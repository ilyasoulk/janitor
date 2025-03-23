console.log('[SkyShade] [CONTENT] Content script loaded');

// Global variables
let selectionIcon = null;

//-------------------------
// FUNCTION DEFINITIONS
//-------------------------

// Create and append the floating icon element to the page
function createSelectionIcon() {
    if (selectionIcon) return;
    
    selectionIcon = document.createElement('div');
    selectionIcon.id = 'skyshade-selection-icon';
    
    // Use the SkyShade logo as the icon
    selectionIcon.innerHTML = `
        <div class="skyshade-icon-container">
            <img src="${chrome.runtime.getURL('icons/icon.png')}" alt="SkyShade" />
        </div>
    `;
    
    // Add a tooltip attribute
    selectionIcon.title = 'SkyShade - Text anonymizer';
    
    // Style the icon and ensure image fits properly
    selectionIcon.style.cssText = `
        position: absolute;
        z-index: 9999;
        background: #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: none;
        cursor: pointer;
        padding: 5px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Add styles to make sure the image fits inside the circle
    const iconImage = selectionIcon.querySelector('img');
    iconImage.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        width: 22px; /* Adjust as needed */
        height: auto;
        object-fit: contain;
    `;
    
    // Add click event to trigger anonymization directly
    selectionIcon.addEventListener('click', () => processTextTransformation('anonymizeSelection', () => {}));
    
    document.body.appendChild(selectionIcon);
}

// Show the icon near the selection
function showSelectionIcon() {
    if (!selectionIcon) createSelectionIcon();
    
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
        selectionIcon.style.display = 'none';
        return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position the icon at the bottom right of the selection
    selectionIcon.style.left = `${rect.right + window.scrollX}px`;
    selectionIcon.style.top = `${rect.bottom + window.scrollY + 5}px`;
    selectionIcon.style.display = 'block';
}

// Show loading indicator while processing
function showLoadingIndicator(selection, anonymize) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(anonymize ? 'Anonymizing...' : 'Pseudonymizing...'));
}

// Replace the selected text with processed text
function replaceSelectedText(selection, cleanedText) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(cleanedText));
    window.getSelection().removeAllRanges();
}

// Process text transformation (anonymization/pseudonymization)
function processTextTransformation(command, sendResponse) {
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0)
        return sendResponse({ success: false, error: 'No text selected' });

    const originalText = selection.toString();
    const isAnonymizing = command === 'anonymizeSelection';
    
    showLoadingIndicator(selection, isAnonymizing);
    
    (async () => {
        try {
            const response = await chrome.runtime.sendMessage({ 
                type: 'CLEAN_TEXT', text: originalText, anonymizing: isAnonymizing });

            if (response?.cleanedText) {
                replaceSelectedText(selection, response.cleanedText);
                sendResponse({ success: true, message: response.message });
            } 
            else
                sendResponse({ success: false, error: response?.error || 'Failed to process text'});
        } 
        catch (error) {
            console.error('[SkyShade] [CONTENT] Failed to clean text:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();
    
    return true; // Indicates async response
}

//-------------------------
// EVENT LISTENERS
//-------------------------

// Listen for text selection
document.addEventListener('mouseup', () => {
    setTimeout(showSelectionIcon, 10); // Small delay to ensure selection is complete
});

// Listen for selection changes from any source (keyboard shortcuts, context menu, etc.)
document.addEventListener('selectionchange', () => {
    // Use a small delay to let the selection finalize
    setTimeout(showSelectionIcon, 50);
});

// Hide icon when clicking outside
document.addEventListener('mousedown', (e) => {
    // Check if click was outside the icon to hide it
    if (selectionIcon && !selectionIcon.contains(e.target))
        selectionIcon.style.display = 'none';
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command !== 'anonymizeSelection' && message.command !== 'pseudonymizeSelection')
        return false;

    return processTextTransformation(message.command, sendResponse);
});
