ALTER TABLE persone ADD COLUMN tariffa_oraria REAL NOT NULL DEFAULT 0;
ALTER TABLE ore_lavorate ADD COLUMN tariffa_oraria REAL;
CREATE TABLE IF NOT EXISTS pagamenti (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_id  TEXT NOT NULL REFERENCES persone(id),
  data        TEXT NOT NULL,
  importo     REAL NOT NULL,
  nota        TEXT,
  creato_il   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pagamenti_persona ON pagamenti(persona_id, data);
UPDATE persone SET tariffa_oraria = 12 WHERE ruolo = 'collaboratrice';
UPDATE persone SET nome = 'Lucia', iniziali = 'LU' WHERE ruolo = 'collaboratrice';
UPDATE ore_lavorate SET tariffa_oraria = 12
WHERE persona_id IN (SELECT id FROM persone WHERE ruolo = 'collaboratrice')
  AND tariffa_oraria IS NULL;
