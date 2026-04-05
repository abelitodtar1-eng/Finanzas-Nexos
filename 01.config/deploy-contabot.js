import axios from 'axios';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const N8N_URL = 'https://dtar-n8n.oj16f5.easypanel.host';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjdiNzVkMy05ZTE5LTQzODItYjJiOC1jYzk4NDYyMzgwZGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjI5YzVjNzdkLWQyOWYtNDMxNy1iMWZmLTc4Y2FmNTU2OWU1MSIsImlhdCI6MTc3NDc5ODQ1M30.RsVvkoEHHQ-ZZ8lS6N6f6MrygZd2Siqhxfm4q_S8ht4';
const SHEETS_ID = '1g8lR3i_ex5scINzYoUA_hHM2ImaQ4Tg642MOTVvJ77Y';

const systemPrompt = readFileSync(join(__dirname, '../FinanzasPedro/system_prompt_agente.md'), 'utf-8');

const workflow = {
  name: "ContaBot - Finanzas Pedro",
  nodes: [
    {
      parameters: {
        updates: ["message"],
        additionalFields: {}
      },
      id: "node-telegram-trigger",
      name: "Telegram Trigger",
      type: "n8n-nodes-base.telegramTrigger",
      typeVersion: 1.1,
      position: [240, 300],
      webhookId: "contabot-finanzas-pedro"
    },
    {
      parameters: {
        promptType: "define",
        text: "={{ $json.message.text }}",
        options: {
          systemMessage: systemPrompt
        }
      },
      id: "node-ai-agent",
      name: "AI Agent",
      type: "@n8n/n8n-nodes-langchain.agent",
      typeVersion: 1.7,
      position: [460, 300]
    },
    {
      parameters: {
        model: "claude-opus-4-5",
        options: {
          maxTokensToSample: 2048
        }
      },
      id: "node-claude",
      name: "Claude Opus",
      type: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      typeVersion: 1.3,
      position: [340, 520]
    },
    {
      parameters: {
        contextWindowLength: 20
      },
      id: "node-memory",
      name: "Memoria Conversación",
      type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      typeVersion: 1.3,
      position: [560, 520]
    },
    {
      parameters: {
        operation: "read",
        documentId: {
          __rl: true,
          mode: "id",
          value: SHEETS_ID
        },
        sheetName: {
          __rl: true,
          mode: "name",
          value: "={{ $now.format('d-M-yy') }}"
        },
        options: {}
      },
      id: "node-sheets-read",
      name: "Leer Hoja del Día",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.5,
      position: [760, 420],
      description: "Lee la hoja del día actual para consultar ventas y totales"
    },
    {
      parameters: {
        operation: "appendOrUpdate",
        documentId: {
          __rl: true,
          mode: "id",
          value: SHEETS_ID
        },
        sheetName: {
          __rl: true,
          mode: "name",
          value: "={{ $now.format('d-M-yy') }}"
        },
        columns: {
          mappingMode: "defineBelow",
          value: {}
        },
        options: {}
      },
      id: "node-sheets-write",
      name: "Registrar Venta",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.5,
      position: [760, 620],
      description: "Registra una venta en la columna del producto correspondiente en el tracker del día"
    },
    {
      parameters: {
        chatId: "={{ $('Telegram Trigger').item.json.message.chat.id }}",
        text: "={{ $json.output }}",
        additionalFields: {
          parse_mode: "Markdown"
        }
      },
      id: "node-telegram-send",
      name: "Responder por Telegram",
      type: "n8n-nodes-base.telegram",
      typeVersion: 1.2,
      position: [680, 300]
    }
  ],
  connections: {
    "Telegram Trigger": {
      main: [
        [{ node: "AI Agent", type: "main", index: 0 }]
      ]
    },
    "Claude Opus": {
      ai_languageModel: [
        [{ node: "AI Agent", type: "ai_languageModel", index: 0 }]
      ]
    },
    "Memoria Conversación": {
      ai_memory: [
        [{ node: "AI Agent", type: "ai_memory", index: 0 }]
      ]
    },
    "Leer Hoja del Día": {
      ai_tool: [
        [{ node: "AI Agent", type: "ai_tool", index: 0 }]
      ]
    },
    "Registrar Venta": {
      ai_tool: [
        [{ node: "AI Agent", type: "ai_tool", index: 0 }]
      ]
    },
    "AI Agent": {
      main: [
        [{ node: "Responder por Telegram", type: "main", index: 0 }]
      ]
    }
  },
  active: false,
  settings: {
    executionOrder: "v1"
  },
  tags: []
};

async function deploy() {
  try {
    console.log('Creando workflow ContaBot en n8n...');
    const response = await axios.post(`${N8N_URL}/rest/workflows`, workflow, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Workflow creado!');
    console.log('   Nombre:', response.data.name);
    console.log('   ID:', response.data.id);
    console.log('   URL:', `${N8N_URL}/workflow/${response.data.id}`);
  } catch (error) {
    if (error.response) {
      console.error('❌ Error HTTP', error.response.status);
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

deploy();
