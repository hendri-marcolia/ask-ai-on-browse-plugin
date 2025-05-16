console.log("Content script running");

function createModal() {
  const modal = document.createElement('div');
  modal.id = 'ask-ai-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    border: 1px solid black;
    padding: 20px;
    z-index: 1000;
  `;

  // Add close button
  const closeButton = document.createElement('span');
  closeButton.textContent = 'x';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    cursor: pointer;
    font-size: 20px;
  `;
  modal.appendChild(closeButton);

  // Drag functionality
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  modal.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - modal.offsetLeft;
    offsetY = e.clientY - modal.offsetTop;
    modal.style.cursor = 'grab';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    modal.style.cursor = 'default';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    modal.style.left = x + 'px';
    modal.style.top = y + 'px';
    modal.style.transform = 'translate(0, 0)';
  });

  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  const contextIput = document.createElement('input');
  contextIput.type = 'text';
  contextIput.id = 'ask-ai-context';
  contextIput.placeholder = 'No context selected';
  contextIput.value = 'No context selected';
  contextIput.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
  `;
  // disable context input
  contextIput.disabled = true;
  modal.appendChild(contextIput);


  const questionInput = document.createElement('input');
  questionInput.type = 'text';
  questionInput.id = 'ask-ai-question';
  questionInput.placeholder = 'Ask your question...';

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Ask';
  submitButton.style.cssText = `
    margin-top: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
  `;
  
  const responseDiv = document.createElement('div');
  responseDiv.id = 'ask-ai-response';

  modal.appendChild(questionInput);
  modal.appendChild(submitButton);
  modal.appendChild(responseDiv);

  return modal;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
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
      const responseDiv = document.getElementById('ask-ai-response');

      submitButton.addEventListener('click', () => {
        const question = questionInput.value;

        chrome.runtime.sendMessage({
          action: "ask-ai",
          text: question,
          selectedText: selectedText,
          metadata: metadata,
        }, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
          } else {
            console.log("Response from background script:", response);
          }
        });
      });
    } else if (request.action === "ask-ai-response") {
      const responseDiv = document.getElementById('ask-ai-response');
      if (responseDiv) {
        // append the response to the response div
        const responseText = document.createElement('div');
        responseText.innerHTML = marked.parse(request.response);
        responseText.style.cssText = `
          margin: 0;
          padding: 10px;
          background-color: #f1f1f1;
          border-radius: 4px;
          margin-top: 10px;
        `;
        responseDiv.appendChild(responseText);
      }
    }
    return true
  }
);
