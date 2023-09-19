import { Application } from '@microsoft/teams-ai';
import { OpenAIEmbeddings, LocalDocumentIndex, GPT3Tokenizer } from 'vectra';
import * as path from 'path';


export function addSemanticSearch(app: Application, apiKey: string, maxTokens = 2000, maxDocuments = 5, maxChunks = 50): void {
    // Create embeddings model
    const embeddings = new OpenAIEmbeddings({
        model: 'text-embedding-ada-002',
        apiKey,
    });

    // Initialize local index
    const index = new LocalDocumentIndex({
        embeddings,
        folderPath: path.join(__dirname, '../index/teams-ai'),
    });

    // Add semantic search prompt function
    const tokenizer = new GPT3Tokenizer();
    app.ai.prompts.addFunction('semanticSearch', async (context, state) => {
        // Query index
        const query = context.activity.text;
        const results = await index.queryDocuments(query, {
            maxDocuments,
            maxChunks,
        });

        // Add documents until you run out of tokens
        // - ignoring
        let remainingTokens = maxTokens;
        let output = '';
        let connector = '';
        for (const result of results) {
            // Render document url
            const title = `${connector}url: ${result.uri}\n`;
            remainingTokens -= tokenizer.encode(title).length;
            if (remainingTokens > 0) {
                output += title;

                // Render document section
                const sections = await result.renderSections(remainingTokens, 1);
                remainingTokens -= sections[0].tokenCount;
                output += sections[0].text;
                connector = '\n\n';
            } else {
                break;
            }
        }

        return output;
    });
}
