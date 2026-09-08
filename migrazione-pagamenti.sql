-- ============================================================
--  Ferrafoni Home Planner — migrazione: modulo pagamenti
--  Da eseguire UNA VOLA SOLA sul database già in uso.
--  Non cancella nulla: aggiunge solo colonne e una tabella nuova.
-- ============================================================

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

-- Imposta la tariffa di chi pulisce. Cambia 12 con la cifra vera se diversa.
UPDATE persone SET tariffa_oraria = 12 WHERE ruolo = 'collaboratrice';

-- Rinomina la collaboratrice in Lucia. Se il nome è già giusto o diverso,
-- salta questa riga o modifica il nome tra virgolette.
UPDATE persone SET nome = 'Lucia', iniziali = 'LU' WHERE ruolo = 'collaboratrice';

-- Applica la tariffa anche alle giornate già registrate, che finora non ne avevano una.
UPDATE ore_lavorate SET tariffa_oraria = 12
WHERE persona_id IN (SELECT id FROM persone WHERE ruolo = 'collaboratrice')
  AND tariffa_oraria IS NULL;
