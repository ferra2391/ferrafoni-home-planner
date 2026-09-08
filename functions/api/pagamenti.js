import { ok, errore, corpo, oggi } from './_utils.js';

// GET /api/pagamenti?persona_id=collab  → elenco pagamenti e riepilogo del conto
export async function onRequestGet({ env, request }) {
  const personaId = new URL(request.url).searchParams.get('persona_id');

  const pagamenti = personaId
    ? await env.DB.prepare('SELECT * FROM pagamenti WHERE persona_id = ? ORDER BY data DESC').bind(personaId).all()
    : await env.DB.prepare('SELECT * FROM pagamenti ORDER BY data DESC').all();

  if (!personaId) return ok({ pagamenti: pagamenti.results });

  const dovuto = await env.DB.prepare(
    `SELECT coalesce(sum(ore * coalesce(tariffa_oraria,
       (SELECT tariffa_oraria FROM persone WHERE id = ?))), 0) AS totale
     FROM ore_lavorate WHERE persona_id = ?`
  ).bind(personaId, personaId).first();

  const pagato = await env.DB.prepare(
    'SELECT coalesce(sum(importo), 0) AS totale FROM pagamenti WHERE persona_id = ?'
  ).bind(personaId).first();

  return ok({
    pagamenti: pagamenti.results,
    riepilogo: {
      dovuto: dovuto.totale,
      pagato: pagato.totale,
      differenza: pagato.totale - dovuto.totale
    }
  });
}

// POST /api/pagamenti  { persona_id, data, importo, nota }
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.persona_id) return errore('Manca persona_id.');
  if (!d.importo || Number(d.importo) <= 0) return errore('Importo non valido.');
  const r = await env.DB.prepare(
    'INSERT INTO pagamenti (persona_id, data, importo, nota) VALUES (?,?,?,?) RETURNING id'
  ).bind(d.persona_id, d.data || oggi(), Number(d.importo), d.nota || null).first();
  return ok({ id: r.id }, 201);
}

// PATCH /api/pagamenti  { id, data, importo, nota }
export async function onRequestPatch({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');
  const campi = [], valori = [];
  ['data', 'importo', 'nota'].forEach(c => {
    if (d[c] !== undefined) { campi.push(c + ' = ?'); valori.push(d[c]); }
  });
  if (!campi.length) return errore('Niente da aggiornare.');
  valori.push(d.id);
  await env.DB.prepare(`UPDATE pagamenti SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
  return ok({ aggiornato: d.id });
}

// DELETE /api/pagamenti?id=12
export async function onRequestDelete({ env, request }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return errore('Manca id.');
  await env.DB.prepare('DELETE FROM pagamenti WHERE id = ?').bind(id).run();
  return ok({ rimosso: id });
}
