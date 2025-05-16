console.log("Content script running");

function createModal() {
  const modal = document.createElement('div');
  modal.id = 'ask-ai-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    max-width: 90%;
    max-height: 80%;
    overflow-y: auto;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    padding: 20px;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;

  // Close button
  const closeButton = document.createElement('span');
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 15px;
    cursor: pointer;
    font-size: 24px;
    color: #888;
  `;
  closeButton.addEventListener('click', () => modal.remove());
  modal.appendChild(closeButton);

  // Context display
  const contextInput = document.createElement('input');
  contextInput.type = 'text';
  contextInput.id = 'ask-ai-context';
  contextInput.placeholder = 'No context selected';
  contextInput.value = 'No context selected';
  contextInput.disabled = true;
  contextInput.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    margin-bottom: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #f9f9f9;
  `;
  modal.appendChild(contextInput);

  // Response container
  const responseDiv = document.createElement('div');
  responseDiv.id = 'ask-ai-response';
  responseDiv.style.cssText = `
    margin-top: 10px;
  `;
  modal.appendChild(responseDiv);

  // Loading container
  const loadingEl = document.createElement('div');
  loadingEl.id = "loading-placeholder"
  loadingEl.textContent = "Thinking ...";
  loadingEl.style.cssText = 'font-style: italic; color: gray; display: none;';
  modal.appendChild(loadingEl);

  // Question textarea
  const questionInput = document.createElement('textarea');
  questionInput.id = 'ask-ai-question';
  questionInput.placeholder = 'Ask your question...';
  questionInput.style.cssText = `
    width: 100%;
    height: 80px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    margin-bottom: 12px;
    font-size: 14px;
  `;
  modal.appendChild(questionInput);

  // Submit button
  const submitButton = document.createElement('button');
  submitButton.textContent = 'Ask AI';
  submitButton.style.cssText = `
    display: inline-block;
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 16px;
  `;
  modal.appendChild(submitButton);

  // Dragging
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  modal.addEventListener('mousedown', (e) => {
    if (e.target !== modal && e.target !== contextInput) return;
    isDragging = true;
    offsetX = e.clientX - modal.offsetLeft;
    offsetY = e.clientY - modal.offsetTop;
    modal.style.cursor = 'move';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    modal.style.cursor = 'default';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    modal.style.left = `${e.clientX - offsetX}px`;
    modal.style.top = `${e.clientY - offsetY}px`;
    modal.style.transform = 'translate(0, 0)';
  });

  return modal;
}


function parseQuestionsBlock(document) {
  const blocks = document.querySelectorAll('#ask-ai-response .qa-block');
  const conversationHistory = [];

  blocks.forEach(block => {
    const question = block.querySelector('.qa-question')?.textContent?.trim();
    const answer = block.querySelector('.qa-answer')?.textContent?.trim();

    if (question) {
      conversationHistory.push({
        role: "user",
        parts: [{ text: question }]
      });
    }
    if (answer) {
      conversationHistory.push({
        role: "model",
        parts: [{ text: answer }]
      });
    }
  });
  return conversationHistory;
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.action === "ask-ai-ui") {
      // get selected text if any from request
      const selectedText = request.selectedText;
      const metadata = request.metadata;

      // create modal if it doesn't exist
      if (!document.getElementById('ask-ai-modal')) {
        const modal = createModal();
        document.body.appendChild(modal);
      }
      // update context input with selected text
      const contextInput = document.getElementById('ask-ai-context');
      contextInput.value = selectedText || 'No context selected';

      const questionInput = document.getElementById('ask-ai-question');
      const submitButton = document.querySelector('#ask-ai-modal button');
      const loadingEl = document.getElementById('loading-placeholder');
      // const responseDiv = document.getElementById('ask-ai-response');

      submitButton.addEventListener('click', () => {
        const question = questionInput.value;
        loadingEl.style.display = 'block';
        questionInput.disabled = true;
        questionInput.value = '';
        submitButton.disabled = true;

        const conversationHistory = parseQuestionsBlock(document);
        chrome.runtime.sendMessage({
          action: "ask-ai",
          text: question,
          selectedText: selectedText,
          metadata: metadata,
          conversationHistory: conversationHistory,
        }, function (response) {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
          } else {
            console.log("Response from background script:", response);
          }
          loadingEl.style.display = 'none';
          questionInput.disabled = false;
          submitButton.disabled = false;
        });
      });
    } else if (request.action === "ask-ai-response") {
      const responseDiv = document.getElementById('ask-ai-response');

      if (responseDiv && request?.question && request?.response) {
        // Create a container for the Q&A pair
        const loadingEl = document.getElementById('loading-placeholder');
        loadingEl.style.display = 'none';
        const qaContainer = document.createElement('div');
        qaContainer.classList.add('qa-block');
        qaContainer.style.cssText = `
          margin-bottom: 16px;
          padding: 10px;
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 6px;
        `;

        // Question block
        const questionEl = document.createElement('div');
        questionEl.classList.add('qa-question');
        questionEl.textContent = request.question;
        questionEl.style.cssText = `
          font-weight: bold;
          margin-bottom: 6px;
        `;

        // Answer block
        const answerEl = document.createElement('div');
        answerEl.classList.add('qa-answer');
        answerEl.innerHTML = marked.parse(request.response);
        answerEl.style.cssText = `
          background-color: #f1f1f1;
          padding: 10px;
          border-radius: 4px;
        `;

        // Append question and answer to container
        qaContainer.appendChild(questionEl);
        qaContainer.appendChild(answerEl);

        // Append to main response div
        responseDiv.appendChild(qaContainer);
      }

    }
    return true
  }
);
