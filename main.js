import { pipeline } from '@xenova/transformers';
import { log } from 'console';

class Janitor {
    constructor() {
        this.nerPipeline = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            this.nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER');
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize NER pipeline:', error);
            throw error;
        }
    }

    async cleanPrompt(prompt) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Get named entities from the model
            const entities = await this.nerPipeline(prompt);
            
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

            // Process NER entities
            const nerEntities = [];
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                if (entity.entity.startsWith('B-')) {
                    const start = wordPositions[entity.index - 1].start;
                    let end = wordPositions[entity.index - 1].end;
                    
                    // Look ahead for I- tokens
                    while (i + 1 < entities.length && entities[i + 1].entity.startsWith('I-')) {
                        i++;
                        end = wordPositions[entities[i].index - 1].end;
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

            return cleanedPrompt;
        } catch (error) {
            console.error('Error cleaning prompt:', error);
            throw error;
        }
    }
}

// Example usage
async function main() {
    const janitor = new Janitor();
    const testPrompt = "My name is John Smith and I live in New York. My email is john.smith@email.com";
    
    try {
        const cleanedPrompt = await janitor.cleanPrompt(testPrompt);
        console.log('Original:', testPrompt);
        console.log('Cleaned:', cleanedPrompt);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();

export default Janitor;
