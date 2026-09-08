import { ok, errore, corpo, idBreve } from '../_utils.js';

const GIORNI = { giornaliera:1, settimanale:7, quindicinale:14, mensile:30, trimestrale:90, stagionale:120 };

export async function onRequestGet({ env }) {
  const r = await env.DB.prepare('SELECT * FROM pulizie_voci WHERE attiva = 1 ORDER BY ordine').all();
  return ok({ voci: r.results });
}

// POST /api/pulizie/voci  → nuova voce di checklist, con categoria e frequenza
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.nome) return errore('Manca il nome della voce.');
  if (!d.categoria_id) return errore('Manca la categoria.');
  const id = d.id || idBreve('v');
  const freq = GIORNI[d.frequenza] ? d.frequenza : 'settimanale';
  const max = await env.DB.prepare(
    'SELECT max(ordine) AS m FROM pulizie_voci WHERE categoria_id = ?'
  ).bind(d.categoria_id).first();
  await env.DB.prepare(
    `INSERT INTO pulizie_voci (id, categoria_id, nome, icona, frequenza, ogni_giorni, persona_id, note, ordine)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(id, d.categoria_id, d.nome, d.icona || '🧽', freq,
         d.ogni_giorni || GIORNI[freq], d.persona_id || null, d.note || null, (max?.m || 0) + 1).run();
  return ok({ id }, 201);
}

// PATCH /api/pulizie/voci  → cambia nome, categoria, frequenza, persona assegnata
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

// DELETE /api/pulizie/voci?id=v01  → toglie la voce dalla checklist (non cancella lo storico)
export async function onRequestDelete({ env, request }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return errore('Manca id.');
  await env.DB.prepare('UPDATE pulizie_voci SET attiva = 0 WHERE id = ?').bind(id).run();
  return ok({ disattivata: id });
}
