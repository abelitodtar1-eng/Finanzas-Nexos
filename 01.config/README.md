# Proyecto N8n

Este proyecto configura la conexión con n8n corriendo en Easypanel usando el protocolo MCP (Model Context Protocol).

## Configuración

- URL de n8n: https://dtar-n8n.oj16f5.easypanel.host/
- Endpoint MCP: /mcp-server/http
- API Key: Configurada en los scripts

## Archivos

- `connect.js`: Script para probar conexión con la API REST de n8n (usando Bearer token).
- `mcp-connect.js`: Script para conectar con el servidor MCP de n8n (usando StreamableHTTPClientTransport).

## Uso

1. Instala dependencias: `npm install`
2. Ejecuta el script de conexión MCP: `node mcp-connect.js`

## Configuración en VS Code

Para usar n8n como servidor MCP en VS Code, agrega esta configuración en `settings.json`:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "https://dtar-n8n.oj16f5.easypanel.host/mcp-server/http",
        "--header",
        "authorization:Bearer [TU_API_KEY]"
      ]
    }
  }
}
```

Reemplaza `[TU_API_KEY]` con tu clave API de n8n.

## Notas

- Asegúrate de que el servidor MCP esté habilitado en n8n.
- Los scripts usan la API key proporcionada para autenticación.