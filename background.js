console.log("Background script running");

async function geminiHandler(request) {
  // request.text is the question asked by the user
  // request.selectedText is the selected text on the page (optional)
  query = request.text;
  metadata = request.metadata;
  console.log("Gemini API request:", query);
  const geminiToken = await chrome.storage.sync.get(['apiToken']).then((result) => result.apiToken);

  if (!geminiToken) {
    throw new Error('Gemini API token not found. Please enter it in the settings.');
  }
  // Check role or use default
  const role = await chrome.storage.sync.get(['role']).then((result) => {
    if (result.role) {
      return result.role;
    } else { 
      return "You are an expert AI assistant. Use the highlighted text and any available context (such as page content,title and metadata or user input) to deliver a clear, accurate, and actionable response. Prioritize relevance, professionalism, and usefulness.";
    }
  }
  );

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiToken}`;
  const data = {
    "system_instruction": {
      "parts": [
        {
          "text": role
        }
      ]
    },
    "contents": [
      {
        "parts": [
          {
            "text": "Question: " + query
          }
        ]
      }
    ],
    "generationConfig": {
      "stopSequences": [
        "Title"
      ],
      "temperature": 0.0,
      "maxOutputTokens": 500,
      "topP": 0.8,
      "topK": 10
    }
  };
  if (request.selectedText) {
    data.contents[0].parts.push({
      "text": "Context: " + request.selectedText
    });
  }
  if (metadata) {
    data.contents[0].parts.push({
      "text": "Metadata: " + JSON.stringify(metadata)
    })
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    console.log("Gemini API response:", json);
    return json.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return `Error calling Gemini API: ${error.message}`;
  }
}

async function deepseekHandler(query) {
  const deepseekToken = await chrome.storage.sync.get(['apiToken']).then((result) => result.apiToken);

  if (!deepseekToken) {
    throw new Error('DeepSeek API token not found. Please enter it in the settings.');
  }

  // Replace with actual DeepSeek API call using the token
  console.log(`Sending query to DeepSeek: ${query} with token: ${deepseekToken}`);
  return `DeepSeek response for query: ${query}`;
}

async function routeRequest(query) {
  const result = await chrome.storage.sync.get(['aiProvider']);
  console.log("Stored settings:", result);
  if (!result || !result.aiProvider) {
    throw new Error('AI Provider not found. Please select a provider in the settings.');
  }
  if (!query) {
    throw new Error('Query is empty. Please provide a query.');
  }

  let response;
  switch (result.aiProvider) {
    case 'gemini':
      // Replace with actual Gemini API call using the token
      response = await geminiHandler(query);
      break;
    case 'deepseek':
      // Replace with actual DeepSeek API call using the token
      response = await deepseekHandler(query);
      break;
    default:
      throw new Error(`Model ${result.aiProvider} not supported`);
  }

  return response;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      // request.text is the question asked by the user
      // request.selectedText is the selected text on the page (optional)
      console.log("Received request:", request);
      if (request.action === "send-ask-ai") {
        // Check if the request has the required properties
        selectedText = request.selectedText;
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "ask-ai-ui",
          selectedText: selectedText,
          metadata: request.metadata,
        }, function(contentScriptResponse) {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
          } else {
            console.log("Response sent to content script:", contentScriptResponse);
          }
        });
        return;
      }

      if (request.action !== "ask-ai") {
        console.error("Invalid action:", request.action);
        sendResponse({ error: "Invalid action" });
        return;
      }
      if (request.selectedText) {
        console.log("Selected text:", request.selectedText);
      }
      const response = await routeRequest(request);
      console.log("AI Response:", response);
      // Send the response back to the content script
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "ask-ai-response",
        response: response
      }, function(contentScriptResponse) {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError.message);
        } else {
          console.log("Response sent to content script:", contentScriptResponse);
        }
      });
      sendResponse({ response: "Response sent to content script" });
    } catch (error) {
      console.error("Error:", error);
      sendResponse({ error: error.message });
    }
  })();

  return true; // Explicitly tell Chrome to keep the message channel open
});

function createContextMenuItem() {
  chrome.contextMenus.create({
    id: "ask-ai",
    title: "Ask AI",
    contexts: ["page", "selection"]
  });
}

createContextMenuItem();

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "ask-ai") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [tab.url],
      function: (pageUrl) => {
        // This code will be executed in the content script
        const selectedText = window.getSelection().toString();
        // get Current tab url for role selection later
        const url = new URL(pageUrl);
        const domain = url.hostname;

        // Extract metadata
        let document = window.document;
        let title = document.title;
        let description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        let keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';


        
        chrome.runtime.sendMessage({
            action: "send-ask-ai",
            selectedText: selectedText,
            metadata: {
              domain: domain,
              url: url,
              title: title,
              description: description,
              keywords: keywords,
            }
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError.message);
            } else {
              console.log("Response from background script:", response);
            }
          });
      }
    });
  }
});
