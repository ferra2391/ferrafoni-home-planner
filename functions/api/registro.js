import { ok } from './_utils.js';

// GET /api/registro?modulo=pulizie&limite=60
// Il registro tiene traccia di ogni spunta, cambio, aggiunta: chi, cosa, quando.
export async function onRequestGet({ env, request }) {
  const p = new URL(request.url).searchParams;
  const modulo = p.get('modulo');
  const limite = Math.min(parseInt(p.get('limite') || '80', 10), 300);

  const sql = modulo
    ? 'SELECT r.*, pe.nome AS persona_nome FROM registro r LEFT JOIN persone pe ON pe.id = r.persona_id WHERE r.modulo = ? ORDER BY r.creato_il DESC LIMIT ?'
    : 'SELECT r.*, pe.nome AS persona_nome FROM registro r LEFT JOIN persone pe ON pe.id = r.persona_id ORDER BY r.creato_il DESC LIMIT ?';

  const r = modulo
    ? await env.DB.prepare(sql).bind(modulo, limite).all()
    : await env.DB.prepare(sql).bind(limite).all();

  return ok({ righe: r.results });
}
