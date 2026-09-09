-- ============================================================
--  Ferrafoni Home Planner — migrazione: note per chi pulisce
--  Da eseguire UNA VOLTA SOLA sul database già in uso.
--  Non cancella nulla: aggiunge solo una tabella nuova.
-- ============================================================

CREATE TABLE IF NOT EXISTS note (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  modulo      TEXT NOT NULL DEFAULT 'pulizie',
  testo       TEXT NOT NULL,
  persona_id  TEXT REFERENCES persone(id),
  creato_il   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_note_modulo ON note(modulo, creato_il);

INSERT INTO note (modulo, testo) VALUES
 ('pulizie','Lenzuola nell''armadio del corridoio, seconda anta, ripiano alto'),
 ('pulizie','Niente candeggina in cucina: solo detergente neutro sul piano in legno'),
 ('pulizie','Camera di Maddie dopo le 15:00, fa il riposino fino alle 14:45');
