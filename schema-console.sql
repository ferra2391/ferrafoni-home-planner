PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS persone (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  iniziali    TEXT,
  ruolo       TEXT NOT NULL DEFAULT 'adulto',
  colore      TEXT,
  attiva      INTEGER NOT NULL DEFAULT 1,
  ordine      INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS moduli (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  colore      TEXT NOT NULL,
  icona       TEXT,
  attivo      INTEGER NOT NULL DEFAULT 1,
  ordine      INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS categorie (
  id          TEXT PRIMARY KEY,
  modulo      TEXT NOT NULL REFERENCES moduli(id),
  nome        TEXT NOT NULL,
  icona       TEXT,
  ordine      INTEGER NOT NULL DEFAULT 0,
  attiva      INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_categorie_modulo ON categorie(modulo, ordine);
CREATE TABLE IF NOT EXISTS impostazioni (
  modulo      TEXT NOT NULL,
  chiave      TEXT NOT NULL,
  valore      TEXT,
  tipo        TEXT NOT NULL DEFAULT 'testo',
  PRIMARY KEY (modulo, chiave)
);
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
  settimana   TEXT NOT NULL,
  stato       TEXT NOT NULL,
  data        TEXT NOT NULL,
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
  nota        TEXT
);
CREATE INDEX IF NOT EXISTS idx_ore_data ON ore_lavorate(data);
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
CREATE TABLE IF NOT EXISTS spesa_articoli (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  quantita      TEXT,
  categoria_id  TEXT REFERENCES categorie(id),
  negozio       TEXT NOT NULL DEFAULT 'supermercato',
  stato         TEXT NOT NULL DEFAULT 'da_prendere',
  origine       TEXT NOT NULL DEFAULT 'tablet',
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
CREATE TABLE IF NOT EXISTS eventi (
  id              TEXT PRIMARY KEY,
  titolo          TEXT NOT NULL,
  calendario      TEXT NOT NULL DEFAULT 'famiglia',
  inizio          TEXT NOT NULL,
  fine            TEXT,
  tutto_il_giorno INTEGER NOT NULL DEFAULT 0,
  persona_id      TEXT REFERENCES persone(id),
  luogo           TEXT,
  note            TEXT
);
CREATE INDEX IF NOT EXISTS idx_eventi_inizio ON eventi(inizio);
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
