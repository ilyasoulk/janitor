console.log('[SkyShade] [CONTENT] Content script loaded');

function showLoadingIndicator(selection, anonymize) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(anonymize ? 'Anonymizing...' : 'Pseudonymizing...'));
}

function replaceSelectedText(selection, cleanedText) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(cleanedText));
    window.getSelection().removeAllRanges();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command !== 'anonymizeSelection' && message.command !== 'pseudonymizeSelection') {
        return false;
    }

    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) 
        return sendResponse({ success: false, error: 'No text selected' });

    const originalText = selection.toString();
    const isAnonymizing = message.command === 'anonymizeSelection';
    
    showLoadingIndicator(selection, isAnonymizing);
    
    (async () => {
        try {
            const response = await chrome.runtime.sendMessage({ 
                type: 'CLEAN_TEXT', text: originalText, anonymizing: isAnonymizing });

            if (response?.cleanedText) 
            {
                replaceSelectedText(selection, response.cleanedText);
                sendResponse({ success: true });
            } 
            else 
                sendResponse({ success: false, error: response?.error || 'Failed to process text'});

        } 
        catch (error) {
            console.error('[SkyShade] [CONTENT] Failed to clean text:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();
    
    return true;
});

