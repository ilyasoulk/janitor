async function cleanSelectedText(selection) {
    const originalText = selection.toString();
    let loadingIndicator;

    console.log('[CONTENT] Starting text cleaning process');
    console.log('[CONTENT] Selected text:', originalText);

    try {
        const originalRange = selection.getRangeAt(0).cloneRange();
        
        loadingIndicator = showLoadingIndicator(selection);
        
        console.log('[CONTENT] Sending message to background script');
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CLEAN_TEXT',
                text: originalText
            });
            
            console.log('[CONTENT] Received response from background:', response);
            
            if (response.error) {
                console.error('[CONTENT] Error in response:', response.error);
                throw new Error(response.error);
            }

            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.remove();
            }

            console.log('[CONTENT] Replacing text with:', response.cleanedText);
            
            selection.removeAllRanges();
            selection.addRange(originalRange);
            
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(response.cleanedText);
            range.insertNode(textNode);
            
            selection.removeAllRanges();
        } catch (err) {
            console.error('[CONTENT] Message sending failed:', err);
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.replaceWith(document.createTextNode(originalText));
            }
            alert('Failed to clean text. Please try reloading the page.');
        }
    } catch (error) {
        console.error('[CONTENT] Error in cleanSelectedText:', error);
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.replaceWith(document.createTextNode(originalText));
        }
    }
}

function showLoadingIndicator(selection) {
    const range = selection.getRangeAt(0).cloneRange();
    const loadingSpan = document.createElement('span');
    loadingSpan.textContent = 'Anonymizing...';
    loadingSpan.id = 'anonymization-loading';
    loadingSpan.style.backgroundColor = '#f0f0f0';
    loadingSpan.style.padding = '2px 4px';
    loadingSpan.style.borderRadius = '3px';
    
    range.deleteContents();
    range.insertNode(loadingSpan);
    
    return loadingSpan;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[CONTENT] Received message:', message);
    
    if (message.command === "cleanSelection") {
        console.log('[CONTENT] Processing cleanSelection command');
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            cleanSelectedText(selection);
        } else {
            console.log('[CONTENT] No text selected');
        }
    }
});

// Add initialization log
console.log('[CONTENT] Content script loaded');
