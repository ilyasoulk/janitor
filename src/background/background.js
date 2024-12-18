import { cleanPrompt } from './anonymizer.js';

// Add at the top of the file
console.log('[BACKGROUND] Service worker starting...', new Date().toISOString());

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CLEAN_TEXT') {
        (async () => {
            try {
                const cleanedText = await cleanPrompt(request.text, request.anonymize);
                sendResponse({ cleanedText });
            } catch (error) {
                sendResponse({ error: error.message });
            }
        })();
        return true;
    }
    
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "cleanSelection",
        title: "Anonymize Selection",
        contexts: ["selection"]
    });
});


chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "identifySelection",
        title: "Identify Selection",
        contexts: ["selection"]
    });
});

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "cleanSelection" || info.menuItemId === "identifySelection") {
        try {
            // Check if we can access the tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0) {
                console.error('[BACKGROUND] No active tab found');
                return;
            }

            // Send message with error handling
            try {
                await chrome.tabs.sendMessage(tab.id, { command: info.menuItemId  });
            } catch (error) {
                // If content script isn't ready, inject it
                if (error.message.includes('Receiving end does not exist')) {
                    console.log('[BACKGROUND] Content script not ready, injecting...');
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                    // Try sending the message again
                    await chrome.tabs.sendMessage(tab.id, { command: info.menuItemId  });
                } else {
                    console.error('[BACKGROUND] Error sending message:', error);
                }
            }
        } catch (error) {
            console.error('[BACKGROUND] Error in context menu handler:', error);
        }
    }
});

// Add service worker activation handling
self.addEventListener('activate', (event) => {
    console.log('[BACKGROUND] Service worker activated');
});

// Add service worker installation handling
self.addEventListener('install', (event) => {
    console.log('[BACKGROUND] Service worker installed');
    self.skipWaiting(); // Ensures the service worker activates immediately
});