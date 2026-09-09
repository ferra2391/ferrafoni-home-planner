import { ok, lunedi } from './_utils.js';

// GET /api/stato?settimana=AAAA-MM-GG
// Una sola chiamata riempie tutta l'app: meno richieste, meno righe lette su D1.
export async function onRequestGet({ request, env }) {
  const db = env.DB;
  const url = new URL(request.url);
  const settimana = url.searchParams.get('settimana') || lunedi();

  // Se una tabella non c'e ancora (migrazione non eseguita) la singola query
  // fallisce, ma il resto dei dati deve arrivare lo stesso: senza questa rete
  // l'app resterebbe senza niente da mostrare.
  const q = async (sql, ...p) => {
    try { return await db.prepare(sql).bind(...p).all(); }
    catch (e) { return { results: [], errore: String(e.message || e) }; }
  };

  const [
    persone, moduli, categorie, impostazioni,
    voci, spunte, ore, biancheria,
    spesa, ricorrenti, attivita, eventi, registro, pagamenti, note
  ] = await Promise.all([
    q('SELECT * FROM persone WHERE attiva = 1 ORDER BY ordine'),
    q('SELECT * FROM moduli WHERE attivo = 1 ORDER BY ordine'),
    q('SELECT * FROM categorie WHERE attiva = 1 ORDER BY modulo, ordine'),
    q('SELECT * FROM impostazioni'),
    q('SELECT * FROM pulizie_voci WHERE attiva = 1 ORDER BY ordine'),
    q('SELECT * FROM pulizie_spunte WHERE settimana = ?', settimana),
    q("SELECT * FROM ore_lavorate WHERE data >= date('now','-60 day') ORDER BY data DESC"),
    q('SELECT * FROM biancheria WHERE attiva = 1 ORDER BY ordine'),
    q('SELECT * FROM spesa_articoli ORDER BY stato, id'),
    q('SELECT * FROM spesa_ricorrenti WHERE attivo = 1'),
    q('SELECT * FROM attivita WHERE attiva = 1 ORDER BY scadenza'),
    q("SELECT * FROM eventi WHERE inizio >= date('now','-14 day') ORDER BY inizio"),
    q(`SELECT r.*, p.nome AS persona_nome FROM registro r
       LEFT JOIN persone p ON p.id = r.persona_id ORDER BY r.creato_il DESC LIMIT 60`),
    q('SELECT * FROM pagamenti ORDER BY data DESC LIMIT 100'),
    q('SELECT * FROM note ORDER BY creato_il DESC')
  ]);

  // Elenca le parti che non e stato possibile leggere, cosi il problema
  // e visibile invece di trasformarsi in una schermata vuota.
  const mancanti = [];
  for (const [nome, r] of Object.entries({ persone, moduli, categorie, impostazioni, voci,
      spunte, ore, biancheria, spesa, ricorrenti, attivita, eventi, registro, pagamenti, note })) {
    if (r.errore) mancanti.push(nome);
  }

  return ok({
    settimana,
    mancanti,
    aggiornato: new Date().toISOString(),
    persone: persone.results,
    moduli: moduli.results,
    categorie: categorie.results,
    impostazioni: impostazioni.results,
    pulizie: { voci: voci.results, spunte: spunte.results, ore: ore.results },
    biancheria: biancheria.results,
    spesa: { articoli: spesa.results, ricorrenti: ricorrenti.results },
    attivita: attivita.results,
    eventi: eventi.results,
    registro: registro.results,
    pagamenti: pagamenti.results,
    note: note.results
  });
}
