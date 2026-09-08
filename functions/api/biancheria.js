import { ok, errore, corpo, oggi, annota } from './_utils.js';

// GET /api/biancheria  → con prossima scadenza già calcolata
export async function onRequestGet({ env }) {
  const r = await env.DB.prepare('SELECT * FROM biancheria WHERE attiva = 1 ORDER BY ordine').all();
  const voci = r.results.map(b => {
    const prossimo = new Date(b.ultimo_cambio || oggi());
    prossimo.setDate(prossimo.getDate() + b.ogni_giorni);
    return { ...b, prossimo_cambio: prossimo.toISOString().slice(0, 10) };
  });
  return ok({ biancheria: voci });
}

// POST /api/biancheria  { id, data, persona_id }  → registra un cambio
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');
  const data = d.data || oggi();
  await env.DB.batch([
    env.DB.prepare('UPDATE biancheria SET ultimo_cambio = ? WHERE id = ?').bind(data, d.id),
    env.DB.prepare('INSERT INTO biancheria_cambi (biancheria_id, data, persona_id) VALUES (?,?,?)')
      .bind(d.id, data, d.persona_id || null)
  ]);
  await annota(env.DB, 'pulizie', 'cambio biancheria', d.id, d.persona_id);
  return ok({ id: d.id, data });
}
