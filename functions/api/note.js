import { ok, errore, corpo } from './_utils.js';

// GET /api/note?modulo=pulizie
export async function onRequestGet({ env, request }) {
  const modulo = new URL(request.url).searchParams.get('modulo') || 'pulizie';
  const r = await env.DB.prepare(
    'SELECT * FROM note WHERE modulo = ? ORDER BY creato_il DESC'
  ).bind(modulo).all();
  return ok({ note: r.results });
}

// POST /api/note  { modulo, testo, persona_id }
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.testo || !d.testo.trim()) return errore('La nota è vuota.');
  const r = await env.DB.prepare(
    'INSERT INTO note (modulo, testo, persona_id) VALUES (?,?,?) RETURNING id'
  ).bind(d.modulo || 'pulizie', d.testo.trim(), d.persona_id || null).first();
  return ok({ id: r.id }, 201);
}

// PATCH /api/note  { id, testo }
export async function onRequestPatch({ env, request }) {
  const d = await corpo(request);
  if (!d.id || !d.testo) return errore('Servono id e testo.');
  await env.DB.prepare('UPDATE note SET testo = ? WHERE id = ?').bind(d.testo.trim(), d.id).run();
  return ok({ aggiornata: d.id });
}

// DELETE /api/note?id=3
export async function onRequestDelete({ env, request }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return errore('Manca id.');
  await env.DB.prepare('DELETE FROM note WHERE id = ?').bind(id).run();
  return ok({ rimossa: id });
}
