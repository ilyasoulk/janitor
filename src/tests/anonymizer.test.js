import { cleanPrompt } from '../background/anonymizer.js';
import { TEST_INPUTS } from './test-cases.js';

async function testCleanPrompt() {
    console.log("=== Starting Clean Prompt Tests ===\n");
    
    for (const testCase of TEST_INPUTS) {
        console.log("Input:", testCase);

        try {
            const cleaned = await cleanPrompt(testCase);
            console.log("Output:", cleaned);
        } 
        catch (error) {
            console.error("Test failed:", error);
        }

        console.log("\n---\n");
    }
}

testCleanPrompt();