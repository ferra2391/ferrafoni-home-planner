import { ok } from '../_utils.js';

// GET /api/spesa/frequenti
// I dieci articoli aggiunti piu spesso, contati dal registro:
// sono quelli veri di casa, non un elenco deciso a tavolino.
export async function onRequestGet({ env }) {
  try {
    const r = await env.DB.prepare(
      `SELECT r.dettaglio AS nome, count(*) AS volte,
              (SELECT c.categoria_id FROM catalogo c
               WHERE c.nome_cerca = lower(r.dettaglio)) AS categoria_id
       FROM registro r
       WHERE r.modulo = 'spesa' AND r.azione = 'aggiunto' AND r.dettaglio IS NOT NULL
       GROUP BY lower(r.dettaglio)
       ORDER BY volte DESC, max(r.creato_il) DESC
       LIMIT 10`
    ).all();
    return ok({ frequenti: r.results });
  } catch {
    return ok({ frequenti: [] });
  }
}
