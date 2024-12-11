async function cleanSelectedText(selection) {
    const originalText = selection.toString();
    if (!originalText) return;

    try {
        const response = await chrome.runtime.sendMessage({
            type: 'CLEAN_TEXT',
            text: originalText
        });

        if (response?.cleanedText) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(response.cleanedText));
            window.getSelection().removeAllRanges();
        }
    } catch (error) {
        console.error('Failed to clean text:', error);
    }
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.command === "cleanSelection") {
        const selection = window.getSelection();
        if (selection?.toString().length > 0) {
            cleanSelectedText(selection);
        }
    }
});

console.log('[CONTENT] Content script loaded');
