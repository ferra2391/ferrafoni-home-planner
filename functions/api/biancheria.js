import { ok, errore, corpo, oggi, idBreve, annota } from './_utils.js';

// GET /api/biancheria                 → elenco con prossima scadenza calcolata
// GET /api/biancheria?storico=ID      → storico dei cambi di un articolo
export async function onRequestGet({ env, request }) {
  const storicoDi = new URL(request.url).searchParams.get('storico');

  if (storicoDi) {
    const r = await env.DB.prepare(
      `SELECT bc.*, p.nome AS persona_nome FROM biancheria_cambi bc
       LEFT JOIN persone p ON p.id = bc.persona_id
       WHERE bc.biancheria_id = ? ORDER BY bc.data DESC`
    ).bind(storicoDi).all();
    return ok({ cambi: r.results });
  }

  const r = await env.DB.prepare('SELECT * FROM biancheria WHERE attiva = 1 ORDER BY ordine').all();
  const voci = r.results.map(b => {
    const prossimo = new Date(b.ultimo_cambio || oggi());
    prossimo.setDate(prossimo.getDate() + b.ogni_giorni);
    return { ...b, prossimo_cambio: prossimo.toISOString().slice(0, 10) };
  });
  return ok({ biancheria: voci });
}

// POST /api/biancheria  { id, data, persona_id }  → registra un nuovo cambio
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.id) return errore('Manca id.');
  const data = d.data || oggi();
  await env.DB.batch([
    env.DB.prepare('UPDATE biancheria SET ultimo_cambio = ? WHERE id = ? AND (ultimo_cambio IS NULL OR ultimo_cambio <= ?)')
      .bind(data, d.id, data),
    env.DB.prepare('INSERT INTO biancheria_cambi (biancheria_id, data, persona_id) VALUES (?,?,?)')
      .bind(d.id, data, d.persona_id || null)
  ]);
  await annota(env.DB, 'pulizie', 'cambio biancheria', d.id, d.persona_id);
  return ok({ id: d.id, data });
}

// PUT /api/biancheria  → crea un nuovo articolo oppure ne modifica la configurazione
export async function onRequestPut({ env, request }) {
  const d = await corpo(request);
  if (!d.nome) return errore('Manca il nome.');

  if (d.id) {
    const campi = [], valori = [];
    ['nome', 'ogni_giorni', 'persona_id', 'scorta', 'scorta_minima', 'attiva', 'ordine'].forEach(c => {
      if (d[c] !== undefined) { campi.push(c + ' = ?'); valori.push(d[c]); }
    });
    if (!campi.length) return errore('Niente da aggiornare.');
    valori.push(d.id);
    await env.DB.prepare(`UPDATE biancheria SET ${campi.join(', ')} WHERE id = ?`).bind(...valori).run();
    return ok({ aggiornata: d.id });
  }

  const id = idBreve('b');
  const max = await env.DB.prepare('SELECT max(ordine) AS m FROM biancheria').first();
  await env.DB.prepare(
    `INSERT INTO biancheria (id, nome, ogni_giorni, ultimo_cambio, persona_id, scorta, scorta_minima, ordine)
     VALUES (?,?,?,?,?,?,?,?)`
  ).bind(id, d.nome, d.ogni_giorni || 7, d.ultimo_cambio || oggi(), d.persona_id || null,
         d.scorta ?? 0, d.scorta_minima ?? 0, (max?.m || 0) + 1).run();
  return ok({ id }, 201);
}

// DELETE /api/biancheria?id=b01              → disattiva l'articolo
// DELETE /api/biancheria?cambio=12           → toglie una riga di storico e ricalcola l'ultimo cambio
export async function onRequestDelete({ env, request }) {
  const p = new URL(request.url).searchParams;
  const cambio = p.get('cambio');
  const id = p.get('id');

  if (cambio) {
    const riga = await env.DB.prepare('SELECT biancheria_id FROM biancheria_cambi WHERE id = ?').bind(cambio).first();
    if (!riga) return errore('Cambio non trovato.', 404);
    await env.DB.prepare('DELETE FROM biancheria_cambi WHERE id = ?').bind(cambio).run();
    const ultimo = await env.DB.prepare(
      'SELECT max(data) AS d FROM biancheria_cambi WHERE biancheria_id = ?'
    ).bind(riga.biancheria_id).first();
    await env.DB.prepare('UPDATE biancheria SET ultimo_cambio = ? WHERE id = ?')
      .bind(ultimo?.d || null, riga.biancheria_id).run();
    return ok({ tolto: cambio, nuovo_ultimo_cambio: ultimo?.d || null });
  }

  if (id) {
    await env.DB.prepare('UPDATE biancheria SET attiva = 0 WHERE id = ?').bind(id).run();
    return ok({ disattivata: id });
  }

  return errore('Serve id o cambio.');
}
