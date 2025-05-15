document.getElementById('saveButton').addEventListener('click', () => {
  const aiProvider = document.querySelector('input[name="aiProvider"]:checked').value;
  const apiToken = document.getElementById('apiToken').value;

  chrome.storage.sync.set({
    aiProvider: aiProvider,
    apiToken: apiToken
  }, () => {
    console.log('Settings saved');
  });
});

chrome.storage.sync.get(['aiProvider', 'apiToken'], (result) => {
  if (result.aiProvider === 'gemini') {
    document.getElementById('geminiProvider').checked = true;
  } else if (result.aiProvider === 'deepseek') {
    document.getElementById('deepseekProvider').checked = true;
  }
  document.getElementById('apiToken').value = result.apiToken || '';
});
