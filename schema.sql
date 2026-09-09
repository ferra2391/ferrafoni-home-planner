-- ============================================================
--  Ferrafoni Home Planner — schema D1
--  Convenzione: tutto in italiano, id testuali leggibili,
--  date in formato ISO (AAAA-MM-GG), niente fusi orari.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ---------- 1. Anagrafiche condivise ----------

CREATE TABLE IF NOT EXISTS persone (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  iniziali    TEXT,
  ruolo       TEXT NOT NULL DEFAULT 'adulto',   -- adulto | bambina | collaboratrice | ospite
  colore      TEXT,
  tariffa_oraria REAL NOT NULL DEFAULT 0,        -- usata per il modulo pagamenti, se ruolo = collaboratrice
  attiva      INTEGER NOT NULL DEFAULT 1,
  ordine      INTEGER NOT NULL DEFAULT 0
);

-- Registro dei moduli: aggiungerne uno domani significa una riga qui,
-- una cartella in public/js/moduli e nient'altro.
CREATE TABLE IF NOT EXISTS moduli (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  colore      TEXT NOT NULL,
  icona       TEXT,
  attivo      INTEGER NOT NULL DEFAULT 1,
  ordine      INTEGER NOT NULL DEFAULT 0
);

-- Categorie generiche: aree delle pulizie, reparti della spesa,
-- categorie delle attività. Una tabella sola per tutti i moduli.
CREATE TABLE IF NOT EXISTS categorie (
  id          TEXT PRIMARY KEY,
  modulo      TEXT NOT NULL REFERENCES moduli(id),
  nome        TEXT NOT NULL,
  icona       TEXT,
  ordine      INTEGER NOT NULL DEFAULT 0,
  attiva      INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_categorie_modulo ON categorie(modulo, ordine);

-- Impostazioni: ogni modulo salva qui i suoi parametri, senza toccare lo schema.
CREATE TABLE IF NOT EXISTS impostazioni (
  modulo      TEXT NOT NULL,
  chiave      TEXT NOT NULL,
  valore      TEXT,
  tipo        TEXT NOT NULL DEFAULT 'testo',    -- testo | numero | booleano | scelta
  PRIMARY KEY (modulo, chiave)
);

-- ---------- 2. Modulo pulizie ----------

CREATE TABLE IF NOT EXISTS pulizie_voci (
  id            TEXT PRIMARY KEY,
  categoria_id  TEXT REFERENCES categorie(id),
  nome          TEXT NOT NULL,
  icona         TEXT,
  frequenza     TEXT NOT NULL DEFAULT 'settimanale',
  ogni_giorni   INTEGER NOT NULL DEFAULT 7,
  persona_id    TEXT REFERENCES persone(id),
  note          TEXT,
  attiva        INTEGER NOT NULL DEFAULT 1,
  ordine        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_voci_categoria ON pulizie_voci(categoria_id, ordine);

CREATE TABLE IF NOT EXISTS pulizie_spunte (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  voce_id     TEXT NOT NULL REFERENCES pulizie_voci(id) ON DELETE CASCADE,
  settimana   TEXT NOT NULL,                     -- lunedì della settimana, ISO
  stato       TEXT NOT NULL,                     -- fatto | parziale
  data        TEXT NOT NULL,                     -- quando è stata fatta davvero
  persona_id  TEXT REFERENCES persone(id),
  nota        TEXT,
  creato_il   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (voce_id, settimana)
);
CREATE INDEX IF NOT EXISTS idx_spunte_settimana ON pulizie_spunte(settimana);

CREATE TABLE IF NOT EXISTS ore_lavorate (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_id  TEXT REFERENCES persone(id),
  data        TEXT NOT NULL,
  ora_inizio  TEXT,
  ora_fine    TEXT,
  ore         REAL NOT NULL DEFAULT 0,
  tariffa_oraria REAL,                           -- tariffa applicata in quel momento, resta fissa nello storico
  nota        TEXT
);
CREATE INDEX IF NOT EXISTS idx_ore_data ON ore_lavorate(data);

-- Pagamenti fatti a chi lavora in casa: il conto è la differenza tra
-- la somma di questi pagamenti e il dovuto calcolato dalle ore lavorate.
CREATE TABLE IF NOT EXISTS pagamenti (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_id  TEXT NOT NULL REFERENCES persone(id),
  data        TEXT NOT NULL,
  importo     REAL NOT NULL,
  nota        TEXT,
  creato_il   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pagamenti_persona ON pagamenti(persona_id, data);

CREATE TABLE IF NOT EXISTS biancheria (
  id             TEXT PRIMARY KEY,
  nome           TEXT NOT NULL,
  ogni_giorni    INTEGER NOT NULL DEFAULT 7,
  ultimo_cambio  TEXT,
  persona_id     TEXT REFERENCES persone(id),
  scorta         INTEGER DEFAULT 0,
  scorta_minima  INTEGER DEFAULT 0,
  attiva         INTEGER NOT NULL DEFAULT 1,
  ordine         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS biancheria_cambi (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  biancheria_id  TEXT NOT NULL REFERENCES biancheria(id) ON DELETE CASCADE,
  data           TEXT NOT NULL,
  persona_id     TEXT REFERENCES persone(id)
);

-- ---------- 3. Modulo spesa ----------

CREATE TABLE IF NOT EXISTS spesa_articoli (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  quantita      TEXT,
  categoria_id  TEXT REFERENCES categorie(id),
  negozio       TEXT NOT NULL DEFAULT 'supermercato',
  stato         TEXT NOT NULL DEFAULT 'da_prendere',  -- da_prendere | preso
  origine       TEXT NOT NULL DEFAULT 'tablet',       -- tablet | iphone | ricorrente | scorta
  persona_id    TEXT REFERENCES persone(id),
  creato_il     TEXT NOT NULL DEFAULT (datetime('now')),
  aggiornato_il TEXT
);
CREATE INDEX IF NOT EXISTS idx_spesa_stato ON spesa_articoli(stato, categoria_id);

CREATE TABLE IF NOT EXISTS spesa_ricorrenti (
  id                  TEXT PRIMARY KEY,
  nome                TEXT NOT NULL,
  quantita            TEXT,
  categoria_id        TEXT REFERENCES categorie(id),
  ogni_giorni         INTEGER NOT NULL DEFAULT 30,
  ultimo_inserimento  TEXT,
  attivo              INTEGER NOT NULL DEFAULT 1
);

-- ---------- 4. Modulo attività programmate ----------

CREATE TABLE IF NOT EXISTS attivita (
  id                 TEXT PRIMARY KEY,
  nome               TEXT NOT NULL,
  categoria_id       TEXT REFERENCES categorie(id),
  persona_id         TEXT REFERENCES persone(id),
  scadenza           TEXT,
  ricorrenza_giorni  INTEGER,
  ultima_esecuzione  TEXT,
  note               TEXT,
  attiva             INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_attivita_scadenza ON attivita(scadenza);

-- ---------- 5. Modulo calendario ----------

CREATE TABLE IF NOT EXISTS eventi (
  id              TEXT PRIMARY KEY,
  titolo          TEXT NOT NULL,
  calendario      TEXT NOT NULL DEFAULT 'famiglia',
  inizio          TEXT NOT NULL,                 -- AAAA-MM-GG oppure AAAA-MM-GGTHH:MM
  fine            TEXT,
  tutto_il_giorno INTEGER NOT NULL DEFAULT 0,
  persona_id      TEXT REFERENCES persone(id),
  luogo           TEXT,
  note            TEXT
);
CREATE INDEX IF NOT EXISTS idx_eventi_inizio ON eventi(inizio);

-- ---------- 6. Note libere ----------

CREATE TABLE IF NOT EXISTS note (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  modulo      TEXT NOT NULL DEFAULT 'pulizie',
  testo       TEXT NOT NULL,
  persona_id  TEXT REFERENCES persone(id),
  creato_il   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_note_modulo ON note(modulo, creato_il);

-- ---------- 7. Registro attività (chi ha fatto cosa) ----------

CREATE TABLE IF NOT EXISTS registro (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  modulo      TEXT NOT NULL,
  azione      TEXT NOT NULL,
  dettaglio   TEXT,
  persona_id  TEXT,
  origine     TEXT NOT NULL DEFAULT 'tablet',
  creato_il   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_registro_data ON registro(creato_il);
