import { pipeline, env } from '@xenova/transformers';

// Configure environment
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

// NER Pipeline singleton
class PipelineSingleton {
    static task = 'token-classification';
    static model = 'Xenova/bert-base-NER';
    static instance = null;

    static async getInstance() {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model);
        }
        return this.instance;
    }
}

// Text cleaning function
export const cleanPrompt = async (text) => {
    const nerPipeline = await PipelineSingleton.getInstance();
    const entities = await nerPipeline(text);
    
    // Replace entities with placeholders
    let cleanedText = text;
    entities.forEach(entity => {
        if (entity.entity.startsWith('B-') || entity.entity.startsWith('I-')) {
            const entityType = entity.entity.slice(2);
            const word = text.split(/\s+/)[entity.index - 1];
            if (word) {
                cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'g'), `[${entityType}]`);
            }
        }
    });

    // Handle emails with regex
    return cleanedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
};