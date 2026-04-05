import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MCP_URL = 'https://dtar-n8n.oj16f5.easypanel.host/mcp-server/http';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjdiNzVkMy05ZTE5LTQzODItYjJiOC1jYzk4NDYyMzgwZGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjI5YzVjNzdkLWQyOWYtNDMxNy1iMWZmLTc4Y2FmNTU2OWU1MSIsImlhdCI6MTc3NDc5ODQ1M30.RsVvkoEHHQ-ZZ8lS6N6f6MrygZd2Siqhxfm4q_S8ht4';
const SHEETS_ID = '1g8lR3i_ex5scINzYoUA_hHM2ImaQ4Tg642MOTVvJ77Y';

const systemPrompt = readFileSync(join(__dirname, '../FinanzasPedro/system_prompt_agente.md'), 'utf-8');

async function main() {
  const client = new Client({ name: "deploy-contabot", version: "1.0.0" }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(
    new URL(MCP_URL),
    { headers: { 'authorization': `Bearer ${API_KEY}` } }
  );

  await client.connect(transport);
  console.log('✅ Conectado al MCP de n8n');

  // Listar herramientas disponibles
  const tools = await client.listTools();
  console.log('\nHerramientas disponibles:');
  tools.tools.forEach(t => console.log(' -', t.name));

  // Buscar herramienta para crear workflow
  const createTool = tools.tools.find(t =>
    t.name.toLowerCase().includes('create') && t.name.toLowerCase().includes('workflow')
  );

  if (createTool) {
    console.log(`\nUsando herramienta: ${createTool.name}`);
    console.log('Parámetros:', JSON.stringify(createTool.inputSchema, null, 2));
  } else {
    console.log('\nNo se encontró herramienta de creación de workflows.');
    console.log('Herramientas con "workflow":', tools.tools.filter(t => t.name.toLowerCase().includes('workflow')).map(t => t.name));
  }

  await client.close();
}

main().catch(console.error);
