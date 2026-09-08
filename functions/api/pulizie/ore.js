import { ok, errore, corpo, oggi } from '../_utils.js';

function calcolaOre(inizio, fine) {
  const m = t => parseInt(t.slice(0,2),10)*60 + parseInt(t.slice(3,5),10);
  return Math.round((m(fine) - m(inizio)) / 6) / 10;
}

// GET /api/pulizie/ore?dal=AAAA-MM-GG
export async function onRequestGet({ env, request }) {
  const dal = new URL(request.url).searchParams.get('dal') || '2000-01-01';
  const r = await env.DB.prepare(
    `SELECT o.*, p.nome AS persona_nome FROM ore_lavorate o
     LEFT JOIN persone p ON p.id = o.persona_id
     WHERE o.data >= ? ORDER BY o.data DESC`
  ).bind(dal).all();
  const totale = r.results.reduce((s, o) => s + (o.ore || 0), 0);
  return ok({ giornate: r.results, totale });
}

// POST /api/pulizie/ore  { data, ora_inizio, ora_fine, persona_id }  → nuova giornata
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  const data = d.data || oggi();
  let ore = d.ore;
  if (ore === undefined && d.ora_inizio && d.ora_fine) ore = calcolaOre(d.ora_inizio, d.ora_fine);
  if (!ore || ore <= 0) return errore('Ore non valide.');

  // la tariffa si fissa al momento della registrazione, così resta storica
  // anche se in futuro la tariffa della persona cambia
  let tariffa = d.tariffa_oraria;
  if (tariffa === undefined && d.persona_id) {
    const p = await env.DB.prepare('SELECT tariffa_oraria FROM persone WHERE id = ?').bind(d.persona_id).first();
    tariffa = p?.tariffa_oraria ?? null;
  }

  const r = await env.DB.prepare(
    'INSERT INTO ore_lavorate (persona_id, data, ora_inizio, ora_fine, ore, tariffa_oraria, nota) VALUES (?,?,?,?,?,?,?) RETURNING id'
  ).bind(d.persona_id || null, data, d.ora_inizio || null, d.ora_fine || null, ore, tariffa, d.nota || null).first();
  return ok({ id: r.id, data, ore, tariffa_oraria: tariffa }, 201);
}

// PATCH /api/pulizie/ore  { id, data, ora_inizio, ora_fine, persona_id, ore }  → corregge una giornata già registrata
export async function onRequestPatch({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');
  let ore = d.ore;
  if (ore === undefined && d.ora_inizio && d.ora_fine) ore = calcolaOre(d.ora_inizio, d.ora_fine);

  const campi = [], valori = [];
  ['data', 'ora_inizio', 'ora_fine', 'persona_id', 'nota'].forEach(c => {
    if (d[c] !== undefined) { campi.push(c + ' = ?'); valori.push(d[c]); }
  });
  if (ore !== undefined) { campi.push('ore = ?'); valori.push(ore); }
  if (!campi.length) return errore('Niente da aggiornare.');
  valori.push(d.id);
  await env.DB.prepare(`UPDATE ore_lavorate SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
  return ok({ aggiornata: d.id });
}

// DELETE /api/pulizie/ore?id=12
export async function onRequestDelete({ env, request }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return errore('Manca id.');
  await env.DB.prepare('DELETE FROM ore_lavorate WHERE id = ?').bind(id).run();
  return ok({ rimossa: id });
}
