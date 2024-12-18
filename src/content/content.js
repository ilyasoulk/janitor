async function cleanSelectedText(selection, anonymize = true) {
    const originalText = selection.toString();
    if (!originalText) return;

    showLoadingIndicator(selection, anonymize);

    try {
        const response = await chrome.runtime.sendMessage({
            type: 'CLEAN_TEXT',
            text: originalText,
            anonymize: anonymize
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

function showLoadingIndicator(selection, anonymize) {
    const range = selection.getRangeAt(0)
    range.deleteContents();
    range.insertNode(document.createTextNode(anonymize ? "Pseudonymizing..." : "Anonymizing..."));
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.command === "cleanSelection" || message.command === "identifySelection") {
        const selection = window.getSelection();
        if (selection?.toString().length > 0) {
            cleanSelectedText(selection, message.command === "cleanSelection");
        }
    }
});

console.log('[CONTENT] Content script loaded');
