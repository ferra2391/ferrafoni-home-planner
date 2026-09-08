import { ok, errore, corpo, annota } from '../_utils.js';

// PATCH /api/spesa/12  → segna preso, cambia quantità, sposta reparto
export async function onRequestPatch({ env, request, params }) {
  const dati = await corpo(request);
  const campi = [], valori = [];

  ['nome', 'quantita', 'categoria_id', 'negozio', 'stato'].forEach(c => {
    if (dati[c] !== undefined) { campi.push(c + ' = ?'); valori.push(dati[c]); }
  });
  if (!campi.length) return errore('Niente da aggiornare.');

  campi.push("aggiornato_il = datetime('now')");
  valori.push(params.id);

  await env.DB.prepare(`UPDATE spesa_articoli SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
  const riga = await env.DB.prepare('SELECT * FROM spesa_articoli WHERE id = ?').bind(params.id).first();
  return ok({ articolo: riga });
}

// DELETE /api/spesa/12
export async function onRequestDelete({ env, params }) {
  const riga = await env.DB.prepare('SELECT nome FROM spesa_articoli WHERE id = ?').bind(params.id).first();
  await env.DB.prepare('DELETE FROM spesa_articoli WHERE id = ?').bind(params.id).run();
  if (riga) await annota(env.DB, 'spesa', 'rimosso', riga.nome, null);
  return ok({ rimosso: params.id });
}
