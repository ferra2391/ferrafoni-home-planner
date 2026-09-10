// Ricerca nel catalogo: serve sia all'app sia al Comando Rapido dell'iPhone.
// Il punto e' che la categoria la assegna il server, cosi chi aggiunge
// non deve mai sceglierla.

// Minuscolo e senza accenti, per confrontare "Caffè" con "caffe".
export function chiave(testo){
  return String(testo || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Cerca il reparto di un prodotto: prima esatto, poi per inizio parola.
export async function reparto(db, nome){
  const k = chiave(nome);
  if (!k) return null;

  try {
    const esatto = await db.prepare(
      'SELECT categoria_id FROM catalogo WHERE nome_cerca = ?'
    ).bind(k).first();
    if (esatto) {
      await db.prepare('UPDATE catalogo SET usi = usi + 1 WHERE nome_cerca = ?').bind(k).run();
      return esatto.categoria_id;
    }

    // "latte fresco intero" deve trovare "latte", ma "bistecca" non deve
    // trovare "te": si confrontano parole intere, mettendo uno spazio ai lati.
    const simile = await db.prepare(
      `SELECT categoria_id, nome_cerca FROM catalogo
       WHERE (' ' || ? || ' ') LIKE ('% ' || nome_cerca || ' %')
          OR (length(?) >= 3 AND nome_cerca LIKE ? || '%')
       ORDER BY length(nome_cerca) DESC LIMIT 1`
    ).bind(k, k, k).first();
    if (simile) return simile.categoria_id;

    // Ultimo tentativo sulla parola principale: "latte fresco intero"
    // deve comunque finire dove sta il latte.
    const prima = k.split(' ')[0];
    if (prima.length >= 4) {
      const perParola = await db.prepare(
        `SELECT categoria_id FROM catalogo
         WHERE nome_cerca = ? OR nome_cerca LIKE ? || ' %'
         ORDER BY usi DESC, length(nome_cerca) LIMIT 1`
      ).bind(prima, prima).first();
      if (perParola) return perParola.categoria_id;
    }

    return null;
  } catch {
    return null;   // catalogo non ancora creato: l'articolo entra senza reparto
  }
}
