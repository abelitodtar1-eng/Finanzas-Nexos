# Proyecto: Finanzas Pedro (ContaBot)

**Estado:** 🟡 Activo
**Última actualización:** 2026-04-03
**Carpeta:** `/FinanzasPedro/`

## Descripción
Sistema de contabilidad para Pedro, dueño de un negocio de **sublimación y personalización de artículos** en Cuba.
El agente se llama **ContaBot** y permite registrar ventas, consultar ganancias y ver totales por día.

## URLs del proyecto
- 📊 **Google Sheets:** https://docs.google.com/spreadsheets/d/1g8lR3i_ex5scINzYoUA_hHM2ImaQ4Tg642MOTVvJ77Y/edit
- 🤖 **Flujo n8n:** https://dtar-n8n.oj16f5.easypanel.host/workflow/nKMx7vtbnl0gbNO3
- 🖥️ **Dashboard:** https://dtar-finanzas-pedro.oj16f5.easypanel.host/

- Una hoja por día del año (formato `DD-M-AA`, ej: `23-3-26`)
- Zona izquierda: costos y ganancias por producto (cols A–L)
- Zona derecha: tracker de ventas diarias (cols P–BA)

## Stack
- n8n (flujo del agente ContaBot)
- Google Sheets (base de datos contable)
- Claude (procesamiento inteligente via system prompt)
- Telegram (interfaz de consulta para Pedro)
- Node.js / Express (dashboard web — `server.js`)

## Archivos clave
| Archivo | Descripción |
|---------|-------------|
| `Contabilidad_2026.xlsx` | Plantilla Excel base del sistema |
| `system_prompt_agente.md` | System prompt completo de ContaBot |
| `variables_n8n.json` | Catálogo de productos y variables para n8n |
| `dashboard.html` | Dashboard visual |
| `server.js` | Servidor Express |
| `main.py` | Script Python auxiliar |

## Catálogo (36 productos)
Sublimación en: pulóveres, jarras, losas, gorras, bolsos, llaveros, mauspads, botellas, pomos, enguatadas, portacelulares, tazas, monederos, cojines, pop sockets, fotorrocas, imanes, delantales y más.

## Tasas de cambio vigentes
- 1 USD = 515 CUP
- 1 MLC = 400 CUP

## Empleadas
- **Danay** — 640.90 CUP/semana
- **Dayan** — 640.90 CUP/semana

## Gastos indirectos mensuales
- Aporte Salarial 12.5%: 529
- Serv/Contab-R.Hum: 1,500
- Arrendamiento: 3,250
- Fuerza de trabajo: 846
- Retención F/Trabajo: 284
