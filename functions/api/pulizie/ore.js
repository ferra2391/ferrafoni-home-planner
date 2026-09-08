import { ok, errore, corpo, oggi } from '../_utils.js';

// GET /api/pulizie/ore?dal=AAAA-MM-GG
export async function onRequestGet({ env, request }) {
  const dal = new URL(request.url).searchParams.get('dal') || '2000-01-01';
  const r = await env.DB.prepare('SELECT * FROM ore_lavorate WHERE data >= ? ORDER BY data DESC').bind(dal).all();
  const totale = r.results.reduce((s, o) => s + (o.ore || 0), 0);
  return ok({ giornate: r.results, totale });
}

// POST /api/pulizie/ore  { data, ora_inizio, ora_fine, persona_id }
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  const data = d.data || oggi();
  let ore = d.ore;
  if (ore === undefined && d.ora_inizio && d.ora_fine) {
    const m = t => parseInt(t.slice(0,2),10)*60 + parseInt(t.slice(3,5),10);
    ore = Math.round((m(d.ora_fine) - m(d.ora_inizio)) / 6) / 10;
  }
  if (!ore || ore <= 0) return errore('Ore non valide.');
  const r = await env.DB.prepare(
    'INSERT INTO ore_lavorate (persona_id, data, ora_inizio, ora_fine, ore, nota) VALUES (?,?,?,?,?,?) RETURNING id'
  ).bind(d.persona_id || 'collab', data, d.ora_inizio || null, d.ora_fine || null, ore, d.nota || null).first();
  return ok({ id: r.id, data, ore }, 201);
}
