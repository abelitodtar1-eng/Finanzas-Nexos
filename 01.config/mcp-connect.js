import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp";

async function connectToN8n() {
    const client = new Client(
        {
            name: "n8n-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        },
    );

    const transport = new StreamableHTTPClientTransport(
        new URL("https://dtar-n8n.oj16f5.easypanel.host/mcp-server/http"),
        {
            headers: {
                'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjdiNzVkMy05ZTE5LTQzODItYjJiOC1jYzk4NDYyMzgwZGQiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6ImFjMDM1MmZhLTcyMGQtNDYwMS05OTQ2LTI2NzAwNWQ4NDYyZSIsImlhdCI6MTc3NTIyNzgzNn0.cfkuF906g3erQp_LbvBtWj0DPUO9yXIXCIgFH5L0QJU'
            }
        }
    );

    try {
        await client.connect(transport);
        console.log("Conectado exitosamente al servidor MCP de n8n!");

        // Probar listar herramientas
        const tools = await client.request({ method: "tools/list" }, {});
        console.log("Herramientas disponibles:", tools.tools.length);

    } catch (error) {
        console.error("Error al conectar:", error.message);
    }
}

connectToN8n();