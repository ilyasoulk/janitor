// Handle any background tasks, like:
// - Managing extension state
// - Handling browser events
// - Communication between tabs
import { pipeline, env } from '@xenova/transformers';

// Configure environment
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

// Add initialization log
console.log('[BACKGROUND] Service worker initialized');

// Create singleton pattern for NER pipeline
class PipelineSingleton {
    static task = 'token-classification';
    static model = 'Xenova/bert-base-NER';
    static instance = null;

    static async getInstance(progress_callback = null) {
        console.log('[BACKGROUND] PipelineSingleton getInstance called');
        if (this.instance === null) {
            console.log('[BACKGROUND] Creating new pipeline instance');
            try {
                this.instance = await pipeline(this.task, this.model, { progress_callback });
                console.log('[BACKGROUND] Pipeline instance created successfully');
            } catch (error) {
                console.error('[BACKGROUND] Error creating pipeline instance:', error);
                console.error('[BACKGROUND] Error stack:', error.stack);
                throw error;
            }
        } else {
            console.log('[BACKGROUND] Returning existing pipeline instance');
        }
        return this.instance;
    }
}

// Main cleaning function
const cleanPrompt = async (prompt, progress_callback = null) => {
    try {
        console.log('[BACKGROUND] Starting cleanPrompt function');
        console.log('[BACKGROUND] Input prompt:', prompt);
        
        // Get pipeline instance
        console.log('[BACKGROUND] About to get pipeline instance');
        const nerPipeline = await PipelineSingleton.getInstance(progress_callback);
        console.log('[BACKGROUND] Pipeline instance obtained:', nerPipeline);
        
        // Get named entities from the model
        console.log('[BACKGROUND] About to run NER pipeline');
        const entities = await nerPipeline(prompt);
        console.log('[BACKGROUND] Entities from NER pipeline:', entities);
        
        // Create a copy of the prompt to modify
        let cleanedPrompt = prompt;

        // Detect emails using regex
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emailEntities = Array.from(prompt.matchAll(emailRegex))
            .map(match => ({
                entity: 'EMAIL',
                start: match.index,
                end: match.index + match[0].length
            }));

        // Get word positions
        const wordPositions = Array.from(prompt.matchAll(/\S+/g))
            .map(match => ({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length
            }));
        console.log('Word positions:', wordPositions);

        // Process NER entities
        const nerEntities = [];
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.entity.startsWith('B-')) {
                const wordPosition = wordPositions[entity.index - 1];
                if (!wordPosition) {
                    console.error('No word position found for entity:', entity);
                    continue;
                }
                const start = wordPosition.start;
                let end = wordPosition.end;
                
                // Look ahead for I- tokens
                while (i + 1 < entities.length && entities[i + 1].entity.startsWith('I-')) {
                    i++;
                    const nextWordPosition = wordPositions[entities[i].index - 1];
                    if (!nextWordPosition) {
                        console.error('No word position found for entity:', entities[i]);
                        break;
                    }
                    end = nextWordPosition.end;
                }
                
                nerEntities.push({
                    entity: entity.entity.slice(2),
                    start,
                    end
                });
            }
        }

        // Combine and sort all entities in reverse order
        const allEntities = [...nerEntities, ...emailEntities]
            .sort((a, b) => b.start - a.start);

        // Replace entities with placeholders
        for (const {entity, start, end} of allEntities) {
            cleanedPrompt = cleanedPrompt.slice(0, start) + 
                           `[${entity}]` + 
                           cleanedPrompt.slice(end);
        }

        console.log('Cleaned prompt:', cleanedPrompt);
        return cleanedPrompt;
    } catch (error) {
        console.error('[BACKGROUND] Error in cleanPrompt:', error);
        console.error('[BACKGROUND] Error stack:', error.stack);
        throw error;
    }
};

// Message handler with more detailed logging
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[BACKGROUND] Received message:', request);
    
    if (request.type === 'CLEAN_TEXT') {
        console.log('[BACKGROUND] Processing CLEAN_TEXT request');
        
        (async function() {
            try {
                console.log('[BACKGROUND] Starting async processing');
                console.log('[BACKGROUND] Text to clean:', request.text);
                
                const cleanedText = await cleanPrompt(request.text, (data) => {
                    console.log('[BACKGROUND] Pipeline progress:', data);
                });
                
                console.log('[BACKGROUND] Text cleaned successfully:', cleanedText);
                sendResponse({ cleanedText });
            } catch (error) {
                console.error('[BACKGROUND] Error during cleaning:', error);
                console.error('[BACKGROUND] Error stack:', error.stack);
                sendResponse({ error: error.message });
            }
        })();
        return true;
    }
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
    console.log('[BACKGROUND] Extension installed, setting up context menu');
    chrome.contextMenus.create({
        id: "cleanSelection",
        title: "Anonymize Selection",
        contexts: ["selection"]
    });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('[BACKGROUND] Context menu clicked:', info);
    if (info.menuItemId === "cleanSelection") {
        console.log('[BACKGROUND] Sending clean command to content script');
        
        // First try to inject the content script if it's not already there
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        }).then(() => {
            // Then send the message
            chrome.tabs.sendMessage(tab.id, { command: "cleanSelection" })
                .catch(error => {
                    console.error('[BACKGROUND] Error sending message to content script:', error);
                    // Attempt to reload the extension
                    chrome.runtime.reload();
                });
        }).catch(error => {
            console.error('[BACKGROUND] Error injecting content script:', error);
        });
    }
});
