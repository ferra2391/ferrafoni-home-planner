import { ok, corpo, annota, INTESTAZIONI } from './_utils.js';
import { reparto } from './_catalogo.js';

// Endpoint pensato per i Comandi Rapidi di iOS: una sola chiamata,
// tutto passa dalla query, risposta in testo semplice da mostrare a schermo.
//
//   Vedere:    GET /api/shortcut?k=CHIAVE&azione=vedi
//   Aggiungere: GET /api/shortcut?k=CHIAVE&azione=aggiungi&testo=latte, pane, uova
//
// Più articoli si separano con la virgola o con "e".

const testoSemplice = (t, stato = 200) =>
  new Response(t, {
    status: stato,
    headers: { ...INTESTAZIONI, 'content-type': 'text/plain; charset=utf-8' }
  });

function separa(testo) {
  return String(testo || '')
    .split(/,|;| e |\n/i)
    .map(s => s.trim())
    .filter(s => s.length > 1);
}

async function gestisci(env, azione, testo, persona, formato) {
  const db = env.DB;

  if (azione === 'aggiungi') {
    const nomi = separa(testo);
    if (!nomi.length) return { testo: 'Non ho capito che cosa aggiungere.', dati: { aggiunti: [] } };

    const aggiunti = [];
    for (const nome of nomi) {
      const esiste = await db.prepare(
        "SELECT id FROM spesa_articoli WHERE lower(nome) = lower(?) AND stato = 'da_prendere'"
      ).bind(nome).first();
      if (esiste) continue;

      // Il reparto lo assegna il server: dall'iPhone si detta solo il nome.
      const categoria = await reparto(db, nome);
      await db.prepare(
        `INSERT INTO spesa_articoli (nome, categoria_id, origine, persona_id, aggiornato_il)
         VALUES (?, ?, 'iphone', ?, datetime('now'))`
      ).bind(nome, categoria, persona || null).run();
      aggiunti.push(nome);
      await annota(db, 'spesa', 'aggiunto', nome, persona, 'iphone');
    }

    const totale = await db.prepare(
      "SELECT count(*) AS n FROM spesa_articoli WHERE stato = 'da_prendere'"
    ).first();

    const msg = aggiunti.length
      ? `Aggiunto: ${aggiunti.join(', ')}. In lista ora ci sono ${totale.n} articoli.`
      : 'Era già tutto in lista.';
    return { testo: msg, dati: { aggiunti, totale: totale.n } };
  }

  // azione predefinita: vedere la lista
  const r = await db.prepare(
    `SELECT a.nome, a.quantita, c.nome AS reparto
     FROM spesa_articoli a LEFT JOIN categorie c ON c.id = a.categoria_id
     WHERE a.stato = 'da_prendere' ORDER BY c.ordine, a.id`
  ).all();

  if (!r.results.length) return { testo: 'La lista della spesa è vuota.', dati: { articoli: [] } };

  const righe = r.results.map(a => '• ' + a.nome + (a.quantita ? ' — ' + a.quantita : ''));
  return {
    testo: `Lista della spesa, ${r.results.length} articoli:\n` + righe.join('\n'),
    dati: { articoli: r.results }
  };
}

export async function onRequestGet({ env, request }) {
  const p = new URL(request.url).searchParams;
  const r = await gestisci(env, p.get('azione') || 'vedi', p.get('testo'), p.get('persona'), p.get('formato'));
  return p.get('formato') === 'json' ? ok(r.dati) : testoSemplice(r.testo);
}

export async function onRequestPost({ env, request }) {
  const d = await corpo(request);
  const p = new URL(request.url).searchParams;
  const r = await gestisci(
    env,
    d.azione || p.get('azione') || 'aggiungi',
    d.testo || p.get('testo'),
    d.persona || p.get('persona'),
    d.formato
  );
  return d.formato === 'json' ? ok(r.dati) : testoSemplice(r.testo);
}
