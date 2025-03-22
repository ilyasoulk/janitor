const isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

if (!isExtensionContext) {
  console.warn('Not running in extension context. Some features will be disabled.');
}

function savePreferences(preferences) {
  chrome.storage.sync.set(preferences, function () {
    updateStatus('Preferences saved');
  });
}

function updateStatus(message, type = 'info') {
  const statusElement = document.getElementById('status');

  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.className = `status-message visible ${type || 'info'}`;
  
  setTimeout(() => {
      statusElement.className = 'status-message';
      statusElement.textContent = '';}, 3000);
}

function loadPreferences(autoAnonymizeCheck) {
  try {

    if (isExtensionContext && chrome.storage && chrome.storage.sync) 
      chrome.storage.sync.get(['autoAnonymize'], function(result) { autoAnonymizeCheck.checked = result.autoAnonymize || false; });
    else 
    {
      console.warn('Chrome storage API not available. Using defaults preferences.');
      autoAnonymizeCheck.checked = false;
    }
  } 
  catch (error) 
  {
    console.error('Error accessing storage:', error);
    autoAnonymizeCheck.checked = false;
  }
}

async function anonymizeSelectedText() {
  if (!isExtensionContext) 
     return updateStatus('Cannot anonymize selection in non-extension context', 'error');

  try {
    const response = await chrome.runtime.sendMessage({ action: "ANONYMIZE_SELECTION" });
    
    if (response && response.success) 
      updateStatus('Text anonymized!', 'success');
    else 
      updateStatus(response?.error || 'No text selected', 'error');
  } 
  catch (error) {
    console.error("Anonymization failed:", error.message);
    updateStatus('Failed to connect to page. Try refreshing.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const anonymizeSelectedBtn = document.getElementById('anonymizeSelected');
  const anonymizeInputBtn = document.getElementById('anonymizeInput');
  const copyBtn = document.getElementById('copyResult');
  const autoAnonymizeCheck = document.getElementById('autoAnonymize');
  const helpBtn = document.getElementById('helpBtn');
  const inputText = document.getElementById('inputText');
  const outputText = document.getElementById('outputText');
  
  let anonymizedResult = "";

  if (autoAnonymizeCheck) { loadPreferences(autoAnonymizeCheck); }

  // Event listeners for preference changes
  autoAnonymizeCheck.addEventListener('change', savePreferences);

  // Anonymize selected text
  anonymizeSelectedBtn.addEventListener('click', () => anonymizeSelectedText());

  // Anonymize input text
  anonymizeInputBtn.addEventListener('click', function() {
    const text = inputText.value.trim();

    if (!text) {
      updateStatus('No text to anonymize', 'error');
      return;
    }

    updateStatus('Anonymizing...', '');
    outputText.textContent = 'Processing...';
    
    if (!isExtensionContext) {
      // Fallback behavior for non-extension context
      outputText.textContent = "Extension API not available.\nOpen this popup through the extension to anonymize text.";
      updateStatus('Cannot anonymize in browser context', 'error');
      return;
    }
    
    // Call the background script's anonymizer
    chrome.runtime.sendMessage({
      type: 'CLEAN_TEXT',
      text: text,
      anonymizing: true
    }, function(response) {
      if (response && response.cleanedText) {
        anonymizedResult = response.cleanedText;
        outputText.textContent = anonymizedResult;
        copyBtn.disabled = false;
        updateStatus('Text anonymized!', 'success');
      } else {
        outputText.textContent = '';
        updateStatus('Failed to anonymize text', 'error');
      }
    });
  });

  // Copy result
  copyBtn.addEventListener('click', function() {
    // If we have text in the output area, copy that
    if (outputText.textContent) {
      navigator.clipboard.writeText(outputText.textContent)
        .then(() => {
          updateStatus('Copied to clipboard!', 'success');
        })
        .catch(() => {
          updateStatus('Failed to copy', 'error');
        });
    } else if (isExtensionContext) {
      // Fall back to the content script method
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "copyResult"}, function(response) {
          if (response && response.success) {
            updateStatus('Copied to clipboard!', 'success');
          } else {
            updateStatus('Nothing to copy', 'error');
          }
        });
      });
    } else {
      updateStatus('Nothing to copy', 'error');
    }
  });

  // Help button
  helpBtn.addEventListener('click', function() {
    if (isExtensionContext) {
      chrome.tabs.create({url: 'help.html'});
    } else {
      window.open('help.html', '_blank');
    }
  });
}); 

