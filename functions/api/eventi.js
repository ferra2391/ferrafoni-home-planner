import { ok, errore, corpo, idBreve } from './_utils.js';

// GET /api/eventi?dal=AAAA-MM-GG&al=AAAA-MM-GG
export async function onRequestGet({ env, request }) {
  const u = new URL(request.url).searchParams;
  const dal = u.get('dal') || '2000-01-01';
  const al = u.get('al') || '2100-01-01';
  const r = await env.DB.prepare('SELECT * FROM eventi WHERE inizio >= ? AND inizio <= ? ORDER BY inizio')
    .bind(dal, al + 'T23:59').all();
  return ok({ eventi: r.results });
}

// POST /api/eventi
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.titolo || !d.inizio) return errore('Servono titolo e inizio.');
  const id = d.id || idBreve('e');
  await env.DB.prepare(
    `INSERT INTO eventi (id, titolo, calendario, inizio, fine, tutto_il_giorno, persona_id, luogo, note)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(id, d.titolo, d.calendario || 'famiglia', d.inizio, d.fine || null,
         d.tutto_il_giorno ? 1 : 0, d.persona_id || null, d.luogo || null, d.note || null).run();
  return ok({ id }, 201);
}
