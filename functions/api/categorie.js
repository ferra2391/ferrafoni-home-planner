import { ok, errore, corpo, idBreve } from './_utils.js';

// GET /api/categorie?modulo=pulizie
export async function onRequestGet({ env, request }) {
  const modulo = new URL(request.url).searchParams.get('modulo');
  const r = modulo
    ? await env.DB.prepare('SELECT * FROM categorie WHERE modulo = ? ORDER BY ordine').bind(modulo).all()
    : await env.DB.prepare('SELECT * FROM categorie ORDER BY modulo, ordine').all();
  return ok({ categorie: r.results });
}

// POST /api/categorie  { modulo, nome, icona, ordine }
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.modulo || !d.nome) return errore('Servono modulo e nome.');
  const id = d.id || idBreve('c');
  await env.DB.prepare(
    'INSERT INTO categorie (id, modulo, nome, icona, ordine) VALUES (?,?,?,?,?)'
  ).bind(id, d.modulo, d.nome, d.icona || '📁', d.ordine ?? 99).run();
  return ok({ id }, 201);
}

// PATCH /api/categorie  { id, nome, icona, ordine, attiva }
export async function onRequestPatch({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');
  const campi = [], valori = [];
  ['nome', 'icona', 'ordine', 'attiva'].forEach(c => {
    if (d[c] !== undefined) { campi.push(c + ' = ?'); valori.push(d[c]); }
  });
  if (!campi.length) return errore('Niente da aggiornare.');
  valori.push(d.id);
  await env.DB.prepare(`UPDATE categorie SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
  return ok({ aggiornata: d.id });
}

// DELETE /api/categorie?id=xxx  (disattiva, non cancella: le voci collegate restano)
export async function onRequestDelete({ env, request }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return errore('Manca id.');
  await env.DB.prepare('UPDATE categorie SET attiva = 0 WHERE id = ?').bind(id).run();
  return ok({ disattivata: id });
}
