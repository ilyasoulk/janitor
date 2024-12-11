import { pipeline, env } from '@xenova/transformers';

// Configure environment
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

// Add at the top of the file
console.log('[BACKGROUND] Service worker starting...', new Date().toISOString());

// NER Pipeline singleton
class PipelineSingleton {
    static task = 'token-classification';
    static model = 'Xenova/bert-base-NER';
    static instance = null;

    static async getInstance() {
        try {
            if (this.instance === null) {
                console.log(`[BACKGROUND] Initializing ${this.task} pipeline...`);
                this.instance = await pipeline(this.task, this.model);
                console.log('[BACKGROUND] Pipeline initialized successfully');
            }
            return this.instance;
        } catch (error) {
            console.error('[BACKGROUND] Pipeline initialization failed:', error);
            console.error('Error details:', error.stack);
            throw error;
        }
    }
}

// Text cleaning function
const cleanPrompt = async (text) => {
    const nerPipeline = await PipelineSingleton.getInstance();
    const entities = await nerPipeline(text);
    
    // Replace entities with placeholders
    let cleanedText = text;
    entities.forEach(entity => {
        if (entity.entity.startsWith('B-')) {
            const entityType = entity.entity.slice(2);
            const word = text.split(/\s+/)[entity.index - 1];
            if (word) {
                cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'g'), `[${entityType}]`);
            }
        }
    });

    // Handle emails
    return cleanedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
};

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CLEAN_TEXT') {
        (async () => {
            try {
                const cleanedText = await cleanPrompt(request.text);
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

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "cleanSelection") {
        try {
            // Check if we can access the tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0) {
                console.error('[BACKGROUND] No active tab found');
                return;
            }

            // Send message with error handling
            try {
                await chrome.tabs.sendMessage(tab.id, { command: "cleanSelection" });
            } catch (error) {
                // If content script isn't ready, inject it
                if (error.message.includes('Receiving end does not exist')) {
                    console.log('[BACKGROUND] Content script not ready, injecting...');
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                    // Try sending the message again
                    await chrome.tabs.sendMessage(tab.id, { command: "cleanSelection" });
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
