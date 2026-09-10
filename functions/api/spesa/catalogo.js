import { ok, errore, corpo } from '../_utils.js';
import { chiave } from '../_catalogo.js';

// GET /api/spesa/catalogo          -> tutto il catalogo (l'app lo tiene in memoria)
// GET /api/spesa/catalogo?q=lat    -> solo le corrispondenze
export async function onRequestGet({ env, request }) {
  const q = new URL(request.url).searchParams.get('q');
  try {
    if (q) {
      const k = chiave(q);
      const r = await env.DB.prepare(
        `SELECT nome, categoria_id FROM catalogo
         WHERE nome_cerca LIKE ? || '%' OR nome_cerca LIKE '%' || ? || '%'
         ORDER BY usi DESC, length(nome) LIMIT 8`
      ).bind(k, k).all();
      return ok({ prodotti: r.results });
    }
    const r = await env.DB.prepare(
      'SELECT nome, nome_cerca, categoria_id FROM catalogo ORDER BY nome'
    ).all();
    return ok({ prodotti: r.results });
  } catch {
    return ok({ prodotti: [] });   // catalogo non ancora creato
  }
}

// POST /api/spesa/catalogo  { nome, categoria_id }
// Serve a insegnare un prodotto nuovo: la volta dopo verra' categorizzato da solo.
export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  if (!d.nome || !d.categoria_id) return errore('Servono nome e categoria.');
  const k = chiave(d.nome);
  await env.DB.prepare(
    `INSERT INTO catalogo (nome, nome_cerca, categoria_id, usi) VALUES (?,?,?,1)
     ON CONFLICT(nome_cerca) DO UPDATE SET categoria_id = excluded.categoria_id`
  ).bind(d.nome.trim(), k, d.categoria_id).run();
  return ok({ imparato: d.nome.trim(), categoria_id: d.categoria_id }, 201);
}
