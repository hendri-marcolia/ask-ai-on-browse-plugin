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
      return "You are an expert AI assistant. Use the highlighted text and any available context and metadata (such as page content,title and metadata or user input) to deliver a clear, accurate, and actionable response. Prioritize relevance, professionalism, and usefulness.";
    }
  }
  );
  newQuestion = []
  if (request.selectedText) {
    newQuestion.push({
      "text": "Context: " + request.selectedText
    });
  }
  if (metadata) {
    newQuestion.push({
      "text": "Metadata: " + JSON.stringify(metadata)
    })
  }
  newQuestion.push({
    "text": "Question: " + query,
  })

  const conversationHistory = request.conversationHistory || []
  conversationHistory.push({ role: "user", parts: newQuestion })
  // console.log(conversationHistory)

  const sitePrompt = await chrome.storage.sync.get({ sites: [] }).then((data) => {
    var sites = data.sites;
    var existingSiteIndex = sites.findIndex(function(site) {
        return site.domain === metadata.domain;
    });

    if (existingSiteIndex !== -1) {
      return sites[existingSiteIndex].rolePrompt;
    }else {
      return undefined;
    }
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiToken}`;
  const data = {
    "system_instruction": {
      "parts": [
        {
          "text": sitePrompt || role
        }
      ]
    },
    "contents": conversationHistory,
    "generationConfig": {
      // "stopSequences": [
      //   "Title"
      // ],
      "temperature": 0.0,
      "maxOutputTokens": 1000,
      "topP": 0.8,
      "topK": 10
    }
  };
  
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

async function geminiRephraseHandler(request) {
  // request.selectedText
  selectedText = request.selectedText
  console.log("Gemini API request:", request);
  const geminiToken = await chrome.storage.sync.get(['apiToken']).then((result) => result.apiToken);

  if (!geminiToken) {
    throw new Error('Gemini API token not found. Please enter it in the settings.');
  }
  // Check role or use default
  const role = await chrome.storage.sync.get(['rephrase-role']).then((result) => {
    if (result.role) {
      return result.role;
    } else {
      return "You are a writing assistant. Rewrite the following sentence to make it clearer and more natural for a native English speaker. Do not interpret it as a question or provide an answer — only improve the wording. Output only the best result you think is. **IMPORTANT** No other text, only the result as output, no need qouting";
    }
  }
  );
  // console.log(conversationHistory)

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
            "text": `"{${selectedText}}"`
          }
        ]
      }
    ],
    "generationConfig": {
      // "stopSequences": [
      //   "Title"
      // ],
      "temperature": 0.0,
      "maxOutputTokens": 1000,
      "topP": 0.8,
      "topK": 10
    }
  };

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

async function routeRephraseRequest(query) {
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
      response = await geminiRephraseHandler(query);
      break;
    case 'deepseek':
      // Replace with actual DeepSeek API call using the token
      // response = await deepseekHandler(query);
      response = "not implemented yet"
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
        }, function (contentScriptResponse) {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
          } else {
            console.log("Response sent to content script:", contentScriptResponse);
          }
        });
      } else if (request.action === "ask-ai") {
        if (request.selectedText) {
          console.log("Selected text:", request.selectedText);
        }
        const response = await routeRequest(request);
        console.log("AI Response:", response);
        // Send the response back to the content script
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "ask-ai-response",
          question: request.text,
          response: response
        }, function (contentScriptResponse) {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
          } else {
            console.log("Response sent to content script:", contentScriptResponse);
          }
        });
        sendResponse({ response: "Response sent to content script" });
      } else if (request.action === "rephrase-ai") {
        if (!request.selectedText || request.selectedText === '') {
          console.log("No text to rephrase");
          alert("No text to rephrase");
        } else {
          const response = await routeRephraseRequest(request)
          chrome.tabs.sendMessage(sender.tab.id, {
            action: "rephrase-ai-result",
            result: response,
            activeElementId: request.activeElementId,
          }, function (contentScriptResponse) {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError.message);
            } else {
              console.log("Response sent to content script:", contentScriptResponse);
            }
          });
        }

      } else {
        console.error("Invalid action:", request.action);
        sendResponse({ error: "Invalid action" });
        return;
      }
    } catch (error) {
      console.error("Error:", error);
      sendResponse({ error: error.message });
    }
  })();

  return true; // Explicitly tell Chrome to keep the message channel open
});

function createContextMenuItem() {
  chrome.contextMenus.create(
    {
      id: "ask-ai",
      title: "Ask AI",
      contexts: ["page", "selection"]
    }
  );
  chrome.contextMenus.create(
    {
      id: "rephrase-ai",
      title: "Rephrase with AI",
      contexts: ["editable"]
    });
}

createContextMenuItem();

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "rephrase-ai") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [tab.url],
      function: (pageUrl) => {
        // get Current tab url for role selection later
        const url = new URL(pageUrl);
        const domain = url.hostname.replace("www.", "");

        // Extract metadata
        let document = window.document;
        let title = document.title;
        let description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        let keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

        // Get focused inputfield
        const activeElement = document.activeElement;
        if (!activeElement.id) {
          activeElement.id = 'plugin-element-to-rephrase-' + crypto.randomUUID(); // Add UUID
        }
        const activeElementId = activeElement.id || '';
        let selectedText = '';

        if (activeElement) {
          if (
            activeElement.tagName === 'TEXTAREA' ||
            (activeElement.tagName === 'INPUT' && activeElement.type === 'text')
          ) {
            // Get selected text from textarea/input
            // let start = activeElement.selectionStart;
            // const end = activeElement.selectionEnd;
            // if (start === end) {
            //   start = 0; // no selected 
            // }
            // selectedText = activeElement.value.substring(start, end);
            selectedText = activeElement.value;
          } else if (activeElement.isContentEditable) {
            selectedText = activeElement.innerText
          }
        }
        chrome.runtime.sendMessage({
          action: 'rephrase-ai',
          selectedText,
          activeElementId,
          metadata: {
            domain,
            url: pageUrl,
            title,
            description,
            keywords
          }
        });
      }
    });
  }
  if (info.menuItemId === "ask-ai") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [tab.url],
      function: (pageUrl) => {
        // This code will be executed in the content script
        const selectedText = window.getSelection().toString();
        // get Current tab url for role selection later
        const url = new URL(pageUrl);
        const domain = url.hostname.replace("www.", "");

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
        }, function (response) {
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
