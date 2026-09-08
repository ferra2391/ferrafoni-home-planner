import { ok, errore, corpo } from './_utils.js';

// GET /api/impostazioni?modulo=pulizie
export async function onRequestGet({ env, request }) {
  const modulo = new URL(request.url).searchParams.get('modulo');
  const r = modulo
    ? await env.DB.prepare('SELECT * FROM impostazioni WHERE modulo = ?').bind(modulo).all()
    : await env.DB.prepare('SELECT * FROM impostazioni').all();
  return ok({ impostazioni: r.results });
}

// PUT /api/impostazioni  { modulo, valori: { chiave: valore } }
export async function onRequestPut({ env, request }) {
  const d = await corpo(request);
  if (!d.modulo || !d.valori) return errore('Servono modulo e valori.');
  const righe = Object.entries(d.valori).map(([chiave, valore]) =>
    env.DB.prepare(
      `INSERT INTO impostazioni (modulo, chiave, valore) VALUES (?,?,?)
       ON CONFLICT(modulo, chiave) DO UPDATE SET valore = excluded.valore`
    ).bind(d.modulo, chiave, String(valore))
  );
  if (righe.length) await env.DB.batch(righe);
  return ok({ salvate: righe.length });
}
