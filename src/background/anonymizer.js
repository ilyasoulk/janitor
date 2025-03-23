import { pipeline, env } from '@xenova/transformers';

// Configure environment
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

const DEFAULT_VALUES_ENTITIES = {
    'B-PER': ['John', 'Mary', 'Sarah', 'Michael', 'David', 'Emma', 'James', 'Sophie'],
    'I-PER': ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'],
    'B-ORG': ['Google', 'Microsoft', 'Apple', 'Facebook', 'Amazon', 'Twitter'],
    'B-LOC': ['New York', 'Paris', 'London', 'Tokyo', 'Berlin', 'Alger', 'Limoges', 'Bordeaux', 'Grenoble'],
};

const replacementDict = {};

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

// Aggregates entities with the same type
function aggregateEntities(nerResults) {
    let currentEntity = null;
    let aggregatedEntities = [];

    for (const entity of nerResults) {
        if (entity.word.startsWith('##') && currentEntity) {
            currentEntity.word += entity.word.substring(2); 
            continue;
        } 

        if (currentEntity) 
            aggregatedEntities.push(currentEntity);

        currentEntity = { type: entity.entity, word: entity.word };
    }

    if (currentEntity) 
        aggregatedEntities.push(currentEntity);

    return aggregatedEntities;
}


const isNonIntermediatePersonEntity = entityType => entityType.startsWith('I-') && entityType !== 'PER';


// Text cleaning function
export const cleanPrompt = async (text, anonymize = true) => {
    const nerPipeline = await PipelineSingleton.getInstance();
    const entities = await nerPipeline(text); 
    const aggregatedEntities = aggregateEntities(entities);

    // Replace entities with placeholders
    let cleanedText = text;
    aggregatedEntities.forEach(entity => {
        const entityType = entity.type.slice(2);
        const word = entity.word;

        if (!word) return;

        if (anonymize) {
            cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'g'), `[${entityType}]`);
            return;
        }


        if (replacementDict[word]) 
            cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'g'), replacementDict[word]);

        // Multiple names entity other than name will be replaced by a one name word
        else if (isNonIntermediatePersonEntity(entityType)) 
            cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'g'), '');

        else if (DEFAULT_VALUES_ENTITIES[entity.type]) {
            const newValue = DEFAULT_VALUES_ENTITIES[entity.type].shift();
            replacementDict[word] = newValue;
            cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'g'), newValue);
        }
        else 
            cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'g'), `[${entityType}]`);
    });




    // Handle emails with regex
    const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})/g;


    if (!anonymize) 
        return cleanedText.replace(emailRegex, '[EMAIL]');


    return cleanedText.replace(emailRegex, (match, username) => {
        let changed = false;

        for (const [original, replacement] of Object.entries(replacementDict)) {
            if (username.includes(original.toLowerCase())) {
                username = username.replace(original.toLowerCase(), replacement.toLowerCase());
                changed = true;
            }
        }

        return changed ? `${username}@mail.com` : '[EMAIL]';
    });
};