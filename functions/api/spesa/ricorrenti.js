import { ok, errore, corpo, idBreve } from '../_utils.js';

export async function onRequestGet({ env }) {
  const r = await env.DB.prepare('SELECT * FROM spesa_ricorrenti WHERE attivo = 1').all();
  return ok({ ricorrenti: r.results });
}

// POST /api/spesa/ricorrenti  { nome, quantita, categoria_id, ogni_giorni }
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.nome) return errore('Manca il nome.');
  const id = d.id || idBreve('r');
  await env.DB.prepare(
    'INSERT INTO spesa_ricorrenti (id, nome, quantita, categoria_id, ogni_giorni, ultimo_inserimento) VALUES (?,?,?,?,?,?)'
  ).bind(id, d.nome, d.quantita || null, d.categoria_id || null, d.ogni_giorni || 30, null).run();
  return ok({ id }, 201);
}

// PATCH /api/spesa/ricorrenti  { id, ...campi }
export async function onRequestPatch({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');
  const campi = [], valori = [];
  ['nome','quantita','categoria_id','ogni_giorni','attivo'].forEach(c => {
    if (d[c] !== undefined) { campi.push(c + ' = ?'); valori.push(d[c]); }
  });
  if (!campi.length) return errore('Niente da aggiornare.');
  valori.push(d.id);
  await env.DB.prepare(`UPDATE spesa_ricorrenti SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
  return ok({ aggiornata: d.id });
}

// DELETE /api/spesa/ricorrenti?id=r01
export async function onRequestDelete({ env, request }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return errore('Manca id.');
  await env.DB.prepare('UPDATE spesa_ricorrenti SET attivo = 0 WHERE id = ?').bind(id).run();
  return ok({ disattivata: id });
}
