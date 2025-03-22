// Background is the heart of the extension every process should be done from here
import { cleanPrompt } from './anonymizer.js';

// Add at the top of the file
console.log('[SkyShade] [BACKGROUND] Service worker starting...', new Date().toISOString());

// Add service worker activation handling
self.addEventListener('activate', () => {
    console.log('[SkyShade] [BACKGROUND] Service worker activated');
});

// Add service worker installation handling
self.addEventListener('install', () => {
    console.log('[SkyShade] [BACKGROUND] Service worker installed');
    self.skipWaiting(); // Ensures the service worker activates immediately
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "anonymizeSelection",
        title: "Anonymize Selection",
        contexts: ["selection"]
    });
});

/*
// We are not pseudonymizing for now
// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "pseudonymizeSelection",
        title: "Pseudonymize Selection",
        contexts: ["selection"]
    });
});
*/


// Helper function to ensure content script is loaded
async function ensureContentScriptLoaded(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: "ping" });
    } 
    catch (error) 
    {
        if (error.message.includes('Receiving end does not exist')) {
            console.log('[SkyShade] [BACKGROUND] Content script not ready, injecting...');
            await chrome.scripting.executeScript({ target: { tabId },  files: ['content.js'] });
            await new Promise(resolve => setTimeout(resolve, 100));
        } 
        else 
            throw error;
    }
}


// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "anonymizeSelection") return;

    try {
        await ensureContentScriptLoaded(tab.id);
        await chrome.tabs.sendMessage(tab.id, { command: "anonymizeSelection" });
    } 
    catch (error) {
        console.error('[SkyShade] [BACKGROUND] Error in context menu handler:', error);
    }
});

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle direct text cleaning requests
    if (request.type === 'CLEAN_TEXT') 
    {
        (async () => {
            try {
                const cleanedText = await cleanPrompt(request.text, request.anonymizing);
                sendResponse({ cleanedText });
            } catch (error) { 
                sendResponse({ error: error.message }); 
            }
        })();
        return true;
    }
    
    // Handle anonymize selection requests from popup
    if (request.action === 'ANONYMIZE_SELECTION') {
        (async () => {
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs.length === 0) 
                    throw new Error('No active tab found');

                await ensureContentScriptLoaded(tab[0].id);
                const result = await chrome.tabs.sendMessage(tab[0].id, { command: "anonymizeSelection" });
                sendResponse(result);
            } 
            catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }
});