import { ok, errore, corpo, idBreve } from '../_utils.js';

const GIORNI = { giornaliera:1, settimanale:7, quindicinale:14, mensile:30, trimestrale:90, stagionale:120 };

// GET /api/pulizie/voci
export async function onRequestGet({ env }) {
  const r = await env.DB.prepare('SELECT * FROM pulizie_voci ORDER BY ordine').all();
  return ok({ voci: r.results });
}

// POST /api/pulizie/voci  → nuova voce di checklist
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.nome) return errore('Manca il nome della voce.');
  const id = d.id || idBreve('v');
  const freq = GIORNI[d.frequenza] ? d.frequenza : 'settimanale';
  await env.DB.prepare(
    `INSERT INTO pulizie_voci (id, categoria_id, nome, icona, frequenza, ogni_giorni, persona_id, note, ordine)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(id, d.categoria_id || null, d.nome, d.icona || '•', freq,
         d.ogni_giorni || GIORNI[freq], d.persona_id || null, d.note || null, d.ordine || 99).run();
  return ok({ id }, 201);
}

// PATCH /api/pulizie/voci  → cambia frequenza o disattiva
export async function onRequestPatch({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');
  const campi = [], valori = [];
  ['nome','icona','frequenza','ogni_giorni','categoria_id','persona_id','note','attiva','ordine'].forEach(c => {
    if (d[c] !== undefined) { campi.push(c + ' = ?'); valori.push(d[c]); }
  });
  if (d.frequenza && d.ogni_giorni === undefined && GIORNI[d.frequenza]) {
    campi.push('ogni_giorni = ?'); valori.push(GIORNI[d.frequenza]);
  }
  if (!campi.length) return errore('Niente da aggiornare.');
  valori.push(d.id);
  await env.DB.prepare(`UPDATE pulizie_voci SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
  return ok({ aggiornata: d.id });
}
