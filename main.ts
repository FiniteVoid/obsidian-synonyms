import { Plugin, Editor, MarkdownView, Notice, Modal, App } from 'obsidian';

interface Synonym {
  word: string;
  synonyms: string[];
}

class SynonymModal extends Modal {
  constructor(app: App, private word: string, private result: string[] | string) {
    super(app);
  }

  onOpen() {
    const {contentEl} = this;
    contentEl.empty();
    contentEl.createEl('h2', {text: `"${this.word}"`});

    if (Array.isArray(this.result)) {
      const ul = contentEl.createEl('ul');
      this.result.forEach(synonym => {
        const li = ul.createEl('li');
        li.createEl('h4', {text: synonym});
      });
    } else {
      contentEl.createEl('pre', {text: this.result});
    }
  }

  onClose() {
    const {contentEl} = this;
    contentEl.empty();
  }
}

export default class SynonymPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'get-synonyms',
      name: 'Get Synonyms for Selected Text',
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        if (selection) {
          try {
            const result = await this.getSynonyms(selection);
            new SynonymModal(this.app, selection, result).open();
          } catch (error) {
            new Notice('Error fetching synonyms');
            console.error(error);
          }
        } else {
          new Notice('No text selected');
        }
      }
    });
  }

  async getSynonyms(word: string): Promise<string[] | string> {
    const ollamaUrl = 'http://localhost:11434/api/generate';

    const prompt = `Provide synonyms for the word "${word}". Respond ONLY with a JSON object in the following exact format, and nothing else:
    {
      "word": "${word}",
      "synonyms": ["synonym1", "synonym2", "synonym3"]
    }
    Ensure the response is valid JSON. Do not include any explanations or additional text.`;

    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3.1",
        keep_alive:"2h",
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch synonyms');
    }

    const data = await response.json();
    const content = data.response;

    return this.parseJsonResponse(content);
  }

  parseJsonResponse(content: string): string[] | string {
    // Try to find JSON object in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsedContent: Synonym = JSON.parse(jsonMatch[0]);
        if (parsedContent.synonyms && Array.isArray(parsedContent.synonyms)) {
          return parsedContent.synonyms;
        }
      } catch (error) {
        console.error('Failed to parse JSON:', error);
      }
    }
    
    // If parsing fails or no valid JSON found, return the raw content
    return content;
  }

  onunload() {
    // Clean up any resources if needed
  }
}
// import { Plugin, Editor, MarkdownView, Notice } from 'obsidian';

// interface Synonym {
//   word: string;
//   synonyms: string[];
// }

// export default class SynonymPlugin extends Plugin {
//   async onload() {
//     this.addCommand({
//       id: 'get-synonyms',
//       name: 'Get Synonyms for Selected Text',
//       editorCallback: async (editor: Editor, view: MarkdownView) => {
//         const selection = editor.getSelection();
//         if (selection) {
//           try {
//             const result = await this.getSynonyms(selection);
//             if (Array.isArray(result)) {
//               new Notice(`"${selection}": ${result.join(', ')}`);
//             } else {
//               new Notice(`Raw response: ${result}`);
//             }
//           } catch (error) {
//             new Notice('Error fetching synonyms');
//             console.error(error);
//           }
//         } else {
//           new Notice('No text selected');
//         }
//       }
//     });
//   }

//   async getSynonyms(word: string): Promise<string[] | string> {
//     const ollamaUrl = 'http://localhost:11434/api/generate';

//     const prompt = `Provide synonyms for the word "${word}". Respond ONLY with a JSON object in the following exact format, and nothing else:
//     {
//       "word": "${word}",
//       "synonyms": ["synonym1", "synonym2", "synonym3", ...]
//     }
//     Ensure the response is valid JSON. Do not include any explanations or additional text.`;

//     const response = await fetch(ollamaUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: "llama3.1",
//         keep_alive:"2h",
//         prompt: prompt,
//         stream: false
//       })
//     });

//     if (!response.ok) {
//       throw new Error('Failed to fetch synonyms');
//     }

//     const data = await response.json();
//     const content = data.response;

//     return this.parseJsonResponse(content);
//   }

//   parseJsonResponse(content: string): string[] | string {
//     // Try to find JSON object in the response
//     const jsonMatch = content.match(/\{[\s\S]*\}/);
//     if (jsonMatch) {
//       try {
//         const parsedContent: Synonym = JSON.parse(jsonMatch[0]);
//         if (parsedContent.synonyms && Array.isArray(parsedContent.synonyms)) {
//           return parsedContent.synonyms;
//         }
//       } catch (error) {
//         console.error('Failed to parse JSON:', error);
//       }
//     }
    
//     // If parsing fails or no valid JSON found, return the raw content
//     return content;
//   }

//   onunload() {
//     // Clean up any resources if needed
//   }
// }