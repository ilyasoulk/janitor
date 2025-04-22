console.log('[SkyShade] [CONTENT] Content script loaded');

// Import the selection icon module
import selectionIcon from './selectionIcon.js';

//-------------------------
// ACCEPTED WEBSITES LIST
//-------------------------

// List of accepted websites where the icon and menu should appear
const ACCEPTED_WEBSITES = [
    'chat.openai.com',  // ChatGPT
    'chatgpt.com',
];

// Check if current website is in the accepted list
function isAcceptedWebsite() {
    const hostname = window.location.hostname;
    return ACCEPTED_WEBSITES.some(domain => hostname.includes(domain));
}

// Store the result since it won't change during page session
const isAcceptedSite = isAcceptedWebsite();
console.log(`[SkyShade] [CONTENT] Current site is ${isAcceptedSite ? 'accepted' : 'not accepted'} for icon/menu display`);

//-------------------------
// FUNCTION DEFINITIONS
//-------------------------

// Helper function to check if a node is in an editable area
function isNodeEditable(node) {
    if (!node) return false;
    
    const targetNode = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    
    // Check if node is a textarea by tag name
    if (targetNode.tagName === 'TEXTAREA') return true;
    
    // Check if node is a textarea by checking its class name or attributes
    if (targetNode.classList && 
        (targetNode.classList.contains('textarea') || 
         targetNode.classList.contains('border-default'))) 
        return true;
    
    // Check if it has a placeholder attribute (common for textarea replacements)
    if (targetNode.getAttribute('placeholder') !== null) return true;
    
    // Check if the node contains a textarea or input element
    if (targetNode.querySelector && (
        targetNode.querySelector('textarea') || 
        targetNode.querySelector('input[type="text"], input[type="search"], input[type="email"], input[type="url"], input[type="number"], input[type="tel"], input[type="password"]')
    )) return true;
    
    // Standard editable checks
    return targetNode.isContentEditable || 
           (targetNode.tagName === 'INPUT' && 
            ['text', 'search', 'email', 'url', 'number', 'tel', 'password'].includes(targetNode.type));
}

// Function to update context menu visibility based on selection
function updateContextMenuVisibility(selection) {
    // Don't update menu if not on accepted site
    if (!isAcceptedSite) return;
    
    if (!selection) selection = window.getSelection();
    
    // Default to not showing the menu
    let inEditableArea = false;
    
    if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
        inEditableArea = isNodeEditable(commonAncestor);
    }
    
    // Send message to background script to update context menu visibility
    chrome.runtime.sendMessage({
        type: 'SELECTION_CONTEXT_UPDATE',
        inEditableArea: inEditableArea,
    });
}

// Show the icon near the selection - modified to check if site is accepted
function showSelectionIcon() {
    // Don't show icon if not on accepted site
    if (!isAcceptedSite) {
        selectionIcon.hide();
        return;
    }
    
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
        selectionIcon.hide();
        updateContextMenuVisibility(selection);
        return;
    }
    
    // Check if the selection is within an editable area
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    const inEditableArea = isNodeEditable(commonAncestor);
    
    // Position the icon based on the selection
    selectionIcon.positionFromSelection(selection, inEditableArea);
    
    // Update context menu visibility
    updateContextMenuVisibility(selection);
}

// Show loading indicator while processing
function showLoadingIndicator(selection, anonymize) {   
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(anonymize ? 'Anonymizing...' : 'Pseudonymizing...'));
}

// Replace the selected text with processed text
function replaceSelectedText(selection, cleanedText) {
    // Add a delay of 0.5 seconds before replacing the text
    setTimeout(() => {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const fragments = cleanedText.split('\n');
        const fragment = document.createDocumentFragment();
        
        fragments.forEach((text, index) => {
            fragment.appendChild(document.createTextNode(text));
            
            if (index < fragments.length - 1) 
                fragment.appendChild(document.createElement('br'));
            
        });
        
        // Insert the entire fragment
        range.insertNode(fragment);
        
        // Clear the selection
        window.getSelection().removeAllRanges();
    }, 300); // 300ms = 0.3 seconds
}


function normalizeConsecutiveNewlines(text) {
    if (!text.includes('\n')) return text;
    
    const totalNewlines = (text.match(/\n/g) || []).length;
    const consecutivePairs = (text.match(/\n\n/g) || []).length;
    
    const allNewlinesAreConsecutive = (totalNewlines === consecutivePairs * 2);
    
    if (allNewlinesAreConsecutive && consecutivePairs > 0) 
        return text.replace(/\n\n/g, '\n');
    else
        return text;
}


// Process text transformation (anonymization/pseudonymization)
function processTextTransformation(command, sendResponse) {
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0)
        return sendResponse({ success: false, error: 'No text selected' });

    // Check if the selection is within an editable area
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    
    // Use the helper function to check if editable
    const isEditable = isNodeEditable(commonAncestor);
    
    if (!isEditable) 
        return sendResponse({ success: false, error: 'Selection is not in an editable area' });

    let originalText = selection.toString();
    console.log('[SkyShade] [CONTENT] Newlines before normalization:', originalText.replace(/\n/g, '[NEWLINE]'));
    originalText = normalizeConsecutiveNewlines(originalText);
    console.log('[SkyShade] [CONTENT] Newlines after normalization:', originalText.replace(/\n/g, '[NEWLINE]'));

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

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command !== 'anonymizeSelection' && message.command !== 'pseudonymizeSelection')
        return false;

    return processTextTransformation(message.command, sendResponse);
});

// Set up the click handler for the icon
selectionIcon.setClickHandler(() => processTextTransformation('anonymizeSelection', () => {}));
