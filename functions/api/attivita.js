import { ok, errore, corpo, oggi, idBreve } from './_utils.js';

// GET /api/attivita
export async function onRequestGet({ env }) {
  const r = await env.DB.prepare('SELECT * FROM attivita WHERE attiva = 1 ORDER BY scadenza').all();
  return ok({ attivita: r.results });
}

// POST /api/attivita  → nuova attività
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.nome) return errore('Manca il nome.');
  const id = d.id || idBreve('a');
  await env.DB.prepare(
    `INSERT INTO attivita (id, nome, categoria_id, persona_id, scadenza, ricorrenza_giorni, note)
     VALUES (?,?,?,?,?,?,?)`
  ).bind(id, d.nome, d.categoria_id || null, d.persona_id || null,
         d.scadenza || null, d.ricorrenza_giorni || null, d.note || null).run();
  return ok({ id }, 201);
}

// PATCH /api/attivita  { id, fatta: true } → sposta in avanti la scadenza
export async function onRequestPatch({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');

  if (d.fatta) {
    const a = await env.DB.prepare('SELECT * FROM attivita WHERE id = ?').bind(d.id).first();
    if (!a) return errore('Attività non trovata.', 404);
    const eseguita = d.data || oggi();
    let nuova = null;
    if (a.ricorrenza_giorni) {
      const p = new Date(eseguita);
      p.setDate(p.getDate() + a.ricorrenza_giorni);
      nuova = p.toISOString().slice(0, 10);
    }
    await env.DB.prepare('UPDATE attivita SET ultima_esecuzione = ?, scadenza = ? WHERE id = ?')
      .bind(eseguita, nuova, d.id).run();
    return ok({ id: d.id, ultima_esecuzione: eseguita, scadenza: nuova });
  }

  const campi = [], valori = [];
  ['nome','categoria_id','persona_id','scadenza','ricorrenza_giorni','note','attiva'].forEach(c => {
    if (d[c] !== undefined) { campi.push(c + ' = ?'); valori.push(d[c]); }
  });
  if (!campi.length) return errore('Niente da aggiornare.');
  valori.push(d.id);
  await env.DB.prepare(`UPDATE attivita SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
  return ok({ aggiornata: d.id });
}
