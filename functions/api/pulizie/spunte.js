import { ok, errore, corpo, oggi, lunedi, annota } from '../_utils.js';

// GET /api/pulizie/spunte?settimana=AAAA-MM-GG
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const settimana = url.searchParams.get('settimana') || lunedi();
  const r = await env.DB.prepare('SELECT * FROM pulizie_spunte WHERE settimana = ?').bind(settimana).all();
  return ok({ settimana, spunte: r.results });
}

// POST /api/pulizie/spunte  { voce_id, settimana, stato, data, persona_id, nota }
// Lo stato può essere: fatto, parziale, oppure "nota" quando si vuole solo
// annotare qualcosa senza dichiarare la lavorazione conclusa.
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.voce_id) return errore('Manca voce_id.');

  const settimana = d.settimana || lunedi();
  const ammessi = ['fatto', 'parziale', 'nota'];
  const stato = ammessi.includes(d.stato) ? d.stato : 'fatto';
  const data = d.data || oggi();

  // Se sto solo aggiungendo una nota, non devo cancellare lo stato già presente.
  if (stato === 'nota') {
    const esiste = await env.DB.prepare(
      'SELECT stato, data, persona_id FROM pulizie_spunte WHERE voce_id = ? AND settimana = ?'
    ).bind(d.voce_id, settimana).first();

    if (esiste) {
      await env.DB.prepare(
        'UPDATE pulizie_spunte SET nota = ? WHERE voce_id = ? AND settimana = ?'
      ).bind(d.nota || null, d.voce_id, settimana).run();
      await annota(env.DB, 'pulizie', 'nota', d.voce_id, d.persona_id, d.origine || 'tablet');
      return ok({ voce_id: d.voce_id, settimana, stato: esiste.stato, nota: d.nota || null });
    }
  }

  await env.DB.prepare(
    `INSERT INTO pulizie_spunte (voce_id, settimana, stato, data, persona_id, nota)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(voce_id, settimana) DO UPDATE SET
       stato = excluded.stato, data = excluded.data,
       persona_id = excluded.persona_id, nota = excluded.nota`
  ).bind(d.voce_id, settimana, stato, data, d.persona_id || null, d.nota || null).run();

  await annota(env.DB, 'pulizie', stato, d.voce_id, d.persona_id, d.origine || 'tablet');
  return ok({ voce_id: d.voce_id, settimana, stato, data, persona_id: d.persona_id || null, nota: d.nota || null });
}

// DELETE /api/pulizie/spunte?voce_id=v01&settimana=AAAA-MM-GG
export async function onRequestDelete({ env, request }) {
  const url = new URL(request.url);
  const voce = url.searchParams.get('voce_id');
  const settimana = url.searchParams.get('settimana') || lunedi();
  if (!voce) return errore('Manca voce_id.');
  await env.DB.prepare('DELETE FROM pulizie_spunte WHERE voce_id = ? AND settimana = ?').bind(voce, settimana).run();
  return ok({ tolta: voce, settimana });
}
