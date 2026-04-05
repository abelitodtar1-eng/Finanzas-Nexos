const express = require('express');
const path = require('path');
const https = require('https');
const catalog = require('./variables_n8n.json');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const SHEET_ID = '1g8lR3i_ex5scINzYoUA_hHM2ImaQ4Tg642MOTVvJ77Y';

// ── Helpers ───────────────────────────────────────────────────────────────────

// "31-3-26"
function sheetName(date) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = String(date.getFullYear()).slice(-2);
  return `${d}-${m}-${y}`;
}

// "Q" → 16 (0-based), "AB" → 27, etc.
function colToIndex(col) {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64);
  }
  return result - 1;
}

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(csv) {
  return csv.trim().split('\n').map(row => {
    const result = [];
    let field = '', inQ = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') { inQ = !inQ; continue; }
      if (c === ',' && !inQ) { result.push(field); field = ''; continue; }
      field += c;
    }
    result.push(field);
    return result;
  });
}

async function getSheetRows(name) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}&range=A1:BC13`;
  const csv = await fetchURL(url);
  if (!csv || csv.includes('errorMessage')) throw new Error(`Hoja no encontrada: ${name}`);
  return parseCSV(csv);
}

// rows[dayIdx + 1] → row for that weekday (0=Lunes…5=Sábado)
// row headers are in rows[0] and rows[1]; data starts at rows[2] for Lunes
function parseQuantitiesForDay(rows, dayIdx) {
  // Row index: rows[0]=header, rows[1]=Lunes, rows[2]=Martes... rows[6]=Sábado
  const row = rows[dayIdx + 1] || [];
  const quants = {};
  for (const prod of catalog.productos) {
    const idx = colToIndex(prod.col_tracker);
    quants[prod.id] = parseInt(row[idx]) || 0;
  }
  return quants;
}

function computeSales(quantMap) {
  return catalog.productos
    .filter(p => p.precio_venta && quantMap[p.id] > 0)
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      cantidad: quantMap[p.id],
      precio_venta: p.precio_venta,
      inversion_unitaria: p.inversion_total || 0,
      ganancia_unitaria: p.ganancia_neta || 0,
      total_venta: p.precio_venta * quantMap[p.id],
      total_inversion: (p.inversion_total || 0) * quantMap[p.id],
      total_ganancia: (p.ganancia_neta || 0) * quantMap[p.id],
    }));
}

function sumTotales(ventas) {
  return {
    articulos: ventas.reduce((s, v) => s + v.cantidad, 0),
    venta: ventas.reduce((s, v) => s + v.total_venta, 0),
    inversion: ventas.reduce((s, v) => s + v.total_inversion, 0),
    ganancia: ventas.reduce((s, v) => s + v.total_ganancia, 0),
  };
}

// JS getDay(): 0=domingo,1=lunes…6=sábado → our index 0=Lunes…5=Sábado
function jsDayToIdx(jsDay) {
  if (jsDay === 0) return -1; // domingo, sin datos
  return jsDay - 1;
}


// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/api/catalogo', (_req, res) => {
  const productos = catalog.productos
    .filter(p => p.precio_venta)
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      inversion_total: p.inversion_total || 0,
      precio_venta: p.precio_venta,
      ganancia_neta: p.ganancia_neta || 0,
    }));
  res.json({ productos, tasas: catalog.tasas_cambio, salarios: catalog.salarios });
});

app.get('/api/hoy', async (req, res) => {
  try {
    // Acepta ?fecha=30-3-26 o usa hoy
    let fecha;
    if (req.query.fecha) {
      const [d, m, y] = req.query.fecha.split('-').map(Number);
      fecha = new Date(2000 + y, m - 1, d);
    } else {
      fecha = new Date();
    }

    const nombre = sheetName(fecha);
    const rows = await getSheetRows(nombre);

    const dayIdx = jsDayToIdx(fecha.getDay());
    if (dayIdx < 0) {
      return res.json({
        ventas: [], totales: { articulos: 0, venta: 0, inversion: 0, ganancia: 0 },
        fecha: nombre, dia: 'Domingo',
      });
    }

    const quants = parseQuantitiesForDay(rows, dayIdx);
    const ventas = computeSales(quants);
    res.json({
      ventas,
      totales: sumTotales(ventas),
      fecha: nombre,
      dia: catalog.dias_semana[dayIdx],
    });
  } catch (err) {
    console.error('/api/hoy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/semana', async (req, res) => {
  try {
    const hoy = new Date();
    const nombre = sheetName(hoy);
    const rows = await getSheetRows(nombre);

    const semana = catalog.dias_semana.map((dia, dayIdx) => {
      const quants = parseQuantitiesForDay(rows, dayIdx);
      const ventas = computeSales(quants);
      return { dia, ventas, totales: sumTotales(ventas) };
    });

    const totalesGlobales = {
      articulos: semana.reduce((s, d) => s + d.totales.articulos, 0),
      venta: semana.reduce((s, d) => s + d.totales.venta, 0),
      inversion: semana.reduce((s, d) => s + d.totales.inversion, 0),
      ganancia: semana.reduce((s, d) => s + d.totales.ganancia, 0),
    };

    res.json({ semana, totales: totalesGlobales, semana_label: nombre });
  } catch (err) {
    console.error('/api/semana error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mes', async (req, res) => {
  try {
    let year, month;
    if (req.query.mes) {
      const [m, y] = req.query.mes.split('-').map(Number);
      month = m - 1;
      year = 2000 + y;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const ahora = new Date();
    ahora.setHours(23, 59, 59, 999);

    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);

    // Lunes de la semana que contiene el primer día del mes
    let lunes = new Date(primerDia);
    const dow = lunes.getDay();
    lunes.setDate(lunes.getDate() - (dow === 0 ? 6 : dow - 1));
    lunes.setHours(0, 0, 0, 0);

    const semanas = [];

    while (lunes <= ultimoDia) {
      const sabado = new Date(lunes);
      sabado.setDate(lunes.getDate() + 5);

      // Referencia: último día de la semana ≤ hoy
      const refDate = new Date(Math.min(sabado.getTime(), ahora.getTime()));

      if (refDate < lunes) {
        lunes.setDate(lunes.getDate() + 7);
        continue;
      }

      let rows;
      try {
        rows = await getSheetRows(sheetName(refDate));
      } catch {
        lunes.setDate(lunes.getDate() + 7);
        continue;
      }

      const diasSemana = [];
      for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
        const fecha = new Date(lunes);
        fecha.setDate(lunes.getDate() + dayIdx);

        if (fecha.getMonth() !== month || fecha > ahora) continue;

        const quants = parseQuantitiesForDay(rows, dayIdx);
        const ventas = computeSales(quants);
        diasSemana.push({
          fecha: sheetName(fecha),
          dia: catalog.dias_semana[dayIdx],
          ventas,
          totales: sumTotales(ventas),
        });
      }

      if (diasSemana.length > 0) {
        const tot = {
          articulos: diasSemana.reduce((s, d) => s + d.totales.articulos, 0),
          venta:     diasSemana.reduce((s, d) => s + d.totales.venta, 0),
          inversion: diasSemana.reduce((s, d) => s + d.totales.inversion, 0),
          ganancia:  diasSemana.reduce((s, d) => s + d.totales.ganancia, 0),
        };
        semanas.push({ semana_label: sheetName(lunes), dias: diasSemana, totales: tot });
      }

      lunes.setDate(lunes.getDate() + 7);
    }

    const totales = {
      articulos: semanas.reduce((s, w) => s + w.totales.articulos, 0),
      venta:     semanas.reduce((s, w) => s + w.totales.venta, 0),
      inversion: semanas.reduce((s, w) => s + w.totales.inversion, 0),
      ganancia:  semanas.reduce((s, w) => s + w.totales.ganancia, 0),
    };

    const mes_label = primerDia.toLocaleDateString('es-CU', { month: 'long', year: 'numeric' });
    const mes_param = `${month + 1}-${String(year).slice(-2)}`;

    res.json({ semanas, totales, mes_label, mes: mes_param });
  } catch (err) {
    console.error('/api/mes error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/chat/preflight', (_req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

app.options('/api/chat', (_req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

app.post('/api/chat', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const { message, context } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada' });

    const systemPrompt = `Eres el asistente financiero de Pedro, un negocio de sublimación y personalización en Cuba.
Responde siempre en español, de forma concisa y útil. Usa CUP para montos en pesos cubanos.
Contexto financiero actual del dashboard:
${JSON.stringify(context || {})}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ response: data.content[0].text });
  } catch (err) {
    console.error('/api/chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard corriendo en http://localhost:${PORT}`);
});
