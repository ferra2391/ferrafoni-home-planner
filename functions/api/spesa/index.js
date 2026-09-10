import { ok, errore, corpo, annota } from '../_utils.js';
import { reparto } from '../_catalogo.js';

// GET /api/spesa  → articoli in lista
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const stato = url.searchParams.get('stato');
  const sql = stato
    ? 'SELECT * FROM spesa_articoli WHERE stato = ? ORDER BY id'
    : 'SELECT * FROM spesa_articoli ORDER BY stato, id';
  const r = stato ? await env.DB.prepare(sql).bind(stato).all() : await env.DB.prepare(sql).all();
  return ok({ articoli: r.results });
}

// POST /api/spesa  → aggiunge uno o più articoli
export async function onRequestPost({ env, request }) {
  const dati = await corpo(request);
  const elenco = Array.isArray(dati.articoli) ? dati.articoli : [dati];
  const aggiunti = [];

  for (const a of elenco) {
    const nome = (a.nome || '').trim();
    if (!nome) continue;

    // Unisce i doppioni ancora da prendere invece di creare una riga nuova.
    const esiste = await env.DB.prepare(
      "SELECT id FROM spesa_articoli WHERE lower(nome) = lower(?) AND stato = 'da_prendere'"
    ).bind(nome).first();

    if (esiste) { aggiunti.push({ id: esiste.id, nome, unito: true }); continue; }

    // La categoria non la chiediamo a chi aggiunge: la cerca il catalogo.
    const categoria = a.categoria_id || await reparto(env.DB, nome);

    const r = await env.DB.prepare(
      `INSERT INTO spesa_articoli (nome, quantita, categoria_id, negozio, origine, persona_id, aggiornato_il)
       VALUES (?,?,?,?,?,?, datetime('now')) RETURNING id`
    ).bind(
      nome, a.quantita || null, categoria,
      a.negozio || 'supermercato', a.origine || 'tablet', a.persona_id || null
    ).first();

    aggiunti.push({ id: r.id, nome, categoria_id: categoria });
    await annota(env.DB, 'spesa', 'aggiunto', nome, a.persona_id, a.origine || 'tablet');
  }

  if (!aggiunti.length) return errore('Nessun articolo valido da aggiungere.');
  return ok({ aggiunti }, 201);
}
