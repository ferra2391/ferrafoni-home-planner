import { ok, errore, corpo, idBreve } from './_utils.js';

export async function onRequestGet({ env }) {
  const r = await env.DB.prepare('SELECT * FROM persone ORDER BY ordine').all();
  return ok({ persone: r.results });
}

// POST /api/persone  { nome, iniziali, ruolo, colore }
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.nome) return errore('Manca il nome.');
  const id = d.id || idBreve('p');
  const iniziali = d.iniziali || d.nome.slice(0, 2).toUpperCase();
  const max = await env.DB.prepare('SELECT max(ordine) AS m FROM persone').first();
  await env.DB.prepare(
    'INSERT INTO persone (id, nome, iniziali, ruolo, colore, ordine) VALUES (?,?,?,?,?,?)'
  ).bind(id, d.nome, iniziali, d.ruolo || 'adulto', d.colore || '#6E7A83', (max?.m || 0) + 1).run();
  return ok({ id }, 201);
}

// PATCH /api/persone  { id, nome, iniziali, ruolo, colore, attiva }
export async function onRequestPatch({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');
  const campi = [], valori = [];
  ['nome', 'iniziali', 'ruolo', 'colore', 'attiva', 'ordine'].forEach(c => {
    if (d[c] !== undefined) { campi.push(c + ' = ?'); valori.push(d[c]); }
  });
  if (!campi.length) return errore('Niente da aggiornare.');
  valori.push(d.id);
  await env.DB.prepare(`UPDATE persone SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
  return ok({ aggiornata: d.id });
}
