const isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

if (!isExtensionContext) 
    console.warn('Not running in extension context. Some features will be disabled.');


function savePreferences(preferences) {
    chrome.storage.sync.set(preferences);
}

function updateStatus(message, type = 'info', elementId = 'selectionStatus') {
    const statusElement = document.getElementById(elementId);

    if (!statusElement) return;
  
    if (message) {
        // Show message
        statusElement.textContent = message;
        statusElement.className = `status-message visible ${type || 'info'}`;
    }
    else {
        // Hide message
        statusElement.className = 'status-message';
        // Clear text after animation completes
        setTimeout(() => {
            if (statusElement.className === 'status-message') 
                statusElement.textContent = '';
            
        }, 300);
    }
  
    if (message) 
        // Auto-hide after delay
        setTimeout(() => {
            statusElement.className = 'status-message';
            setTimeout(() => {
                if (statusElement.className === 'status-message') 
                    statusElement.textContent = '';
                
            }, 300);
        }, 3000);
    
}

function loadPreferences(autoAnonymizeCheck) {
    try {

        if (isExtensionContext && chrome.storage && chrome.storage.sync) 
            chrome.storage.sync.get(['autoAnonymize'], function(result) {
                autoAnonymizeCheck.checked = result.autoAnonymize || false; 
            });
        
        else {
            console.warn('Chrome storage API not available. Using defaults preferences.');
            autoAnonymizeCheck.checked = false;
        }
    } 
    catch (error) {
        console.error('Error accessing storage:', error);
        autoAnonymizeCheck.checked = false;
    }
}

const ACCEPTED_WEBSITES = [
    'chat.openai.com',  // ChatGPT
    'chatgpt.com',
];

// This function needs to be async since we're querying tabs
async function isAcceptedWebsite() {
    if (!isExtensionContext) return false;
    
    try {
        // Get the active tab in the current window
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (!tabs || tabs.length === 0) return false;
        
        const tab = tabs[0];
        const url = new URL(tab.url);
        const hostname = url.hostname;
        
        console.log('Active tab hostname:', hostname);
        return ACCEPTED_WEBSITES.some(domain => hostname.includes(domain));
    }
    catch (error) {
        console.error('Error checking website:', error);
        return false;
    }
}


async function anonymizeSelectedText() {
    if (!isExtensionContext) 
        return updateStatus('Cannot anonymize selection in non-extension context', 'error', 'selectionStatus');

    if (!await isAcceptedWebsite()) 
        return updateStatus('This feature is currently only available on ChatGPT websites', 'error', 'selectionStatus');
    

    try {
        const response = await chrome.runtime.sendMessage({ action: 'ANONYMIZE_SELECTION' });
    
        if (response && response.success) 
            updateStatus(response.message, 'success', 'selectionStatus');
        
        else 
            updateStatus(response?.error || 'No text selected', 'error', 'selectionStatus');
        
    } 
    catch (error) {
        console.error('Anonymization failed:', error.message);
        updateStatus('Failed to connect to page. Try refreshing.', 'error', 'selectionStatus');
    }
}

async function anonymizeInputText(outputText, copyBtn) {
    outputText.textContent = 'Processing...';
    let anonymizedResult = '';
    const inputText = document.getElementById('inputText').value.trim();
    
    if (!inputText) 
        return updateStatus('Please enter some text to anonymize', 'error', 'inputStatus');
    
    
    if (!isExtensionContext) {
        // Fallback behavior for non-extension context
        updateStatus('Extension API not available.\nOpen this popup through the extension to anonymize text.', 'error', 'inputStatus');
        return;
    }
    
    // Call the background script's anonymizer
    const response = await chrome.runtime.sendMessage({ type: 'CLEAN_TEXT', text: inputText, anonymizing: true }); 
    
    if (response && response.cleanedText) {
        anonymizedResult = response.cleanedText;
        outputText.textContent = anonymizedResult;
        copyBtn.disabled = false;
        console.info('etst ', response.message);
        updateStatus(response.message, 'success', 'inputStatus');
    } 
    else {
        outputText.textContent = '';
        copyBtn.disabled = true;
        updateStatus('Failed to anonymize text', 'error', 'inputStatus');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const anonymizeSelectedBtn = document.getElementById('anonymizeSelected');
    const anonymizeInputBtn = document.getElementById('anonymizeInput');
    const copyBtn = document.getElementById('copyResult');
    const autoAnonymizeCheck = document.getElementById('autoAnonymize');
    const helpBtn = document.getElementById('helpBtn');
    const outputText = document.getElementById('outputText');
  

    if (autoAnonymizeCheck) 
        loadPreferences(autoAnonymizeCheck); 
    

    // Event listeners for preference changes
    autoAnonymizeCheck.addEventListener('change', savePreferences);

    // Anonymize selected text
    anonymizeSelectedBtn.addEventListener('click', () => anonymizeSelectedText());

    // Anonymize input text
    anonymizeInputBtn.addEventListener('click', () => anonymizeInputText(outputText, copyBtn));

    // Copy result
    copyBtn.addEventListener('click', function() {
    // If we have text in the output area, copy that
        if (outputText.textContent) 
            navigator.clipboard.writeText(outputText.textContent)
                .then(() => {
                    updateStatus('Copied to clipboard', 'success', 'inputStatus');
                })
                .catch(() => {
                    updateStatus('Failed to copy', 'error', 'inputStatus');
                });
        
        else if (isExtensionContext) 
            // Fall back to the content script method
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: 'copyResult'}, function(response) {
                    if (response && response.success) 
                        updateStatus('Copied to clipboard', 'success', 'inputStatus');
                    
                    else 
                        updateStatus('Nothing to copy', 'error', 'inputStatus');
                    
                });
            });
        
        else 
            updateStatus('Nothing to copy', 'error', 'inputStatus');
        
    });

    // Help button
    helpBtn.addEventListener('click', function() {
        // Set window dimensions
        const windowWidth = 900;
        const windowHeight = 800;
        
        // Get screen dimensions and calculate center position
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        const left = Math.round((screenWidth - windowWidth) / 2);
        const top = Math.round((screenHeight - windowHeight) / 2);
        
        if (isExtensionContext) 
            // Open centered help window in extension context
            chrome.windows.create({
                url: chrome.runtime.getURL('ui/help.html'),
                type: 'popup',
                width: windowWidth,
                height: windowHeight,
                left: left,
                top: top,
                focused: true,
            });
        
        else {
            // For non-extension context, also center the window
            const windowFeatures = `width=${windowWidth},height=${windowHeight},left=${left},top=${top}`;
            window.open('help.html', '_blank', windowFeatures);
        }
    });
}); 

