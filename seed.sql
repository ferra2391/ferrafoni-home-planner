-- ============================================================
--  Ferrafoni Home Planner — dati iniziali
--  Le date sono relative a oggi, così l'app parte già viva.
-- ============================================================

DELETE FROM registro;
DELETE FROM note;
DELETE FROM eventi;
DELETE FROM attivita;
DELETE FROM spesa_ricorrenti;
DELETE FROM spesa_articoli;
DELETE FROM biancheria_cambi;
DELETE FROM biancheria;
DELETE FROM ore_lavorate;
DELETE FROM pulizie_spunte;
DELETE FROM pulizie_voci;
DELETE FROM impostazioni;
DELETE FROM categorie;
DELETE FROM moduli;
DELETE FROM persone;

-- ---------- persone ----------
INSERT INTO persone (id, nome, iniziali, ruolo, colore, tariffa_oraria, ordine) VALUES
 ('davide','Davide','DA','adulto','#3D5BA9',0,1),
 ('vivien','Vivien','VI','adulto','#2F7D6D',0,2),
 ('amelie','Amelie','AM','bambina','#B9741F',0,3),
 ('maddie','Maddie','MA','bambina','#9C3A5E',0,4),
 ('collab','Lucia','LU','collaboratrice','#6E7A83',12,5);

-- ---------- moduli ----------
INSERT INTO moduli (id, nome, colore, icona, ordine) VALUES
 ('pulizie','Pulizie','#2F7D6D','spugna',1),
 ('calendario','Calendario','#3D5BA9','calendario',2),
 ('spesa','Lista della spesa','#B9741F','carrello',3),
 ('attivita','Attività programmate','#9C3A5E','sveglia',4);

-- ---------- categorie ----------
INSERT INTO categorie (id, modulo, nome, icona, ordine) VALUES
 ('pul_bagno','pulizie','Bagno','🚿',1),
 ('pul_cucina','pulizie','Cucina','🍽️',2),
 ('pul_camere','pulizie','Camere e letti','🛏️',3),
 ('pul_giorno','pulizie','Zona giorno','🛋️',4),
 ('pul_bianc','pulizie','Biancheria','🧺',5),
 ('pul_fondo','pulizie','Pulizie di fondo','🪟',6),

 ('sp_ortofrutta','spesa','Frutta e verdura','🥬',1),
 ('sp_freschi','spesa','Banco freschi','🧀',2),
 ('sp_dispensa','spesa','Dispensa','🥫',3),
 ('sp_bambine','spesa','Bambine','🧸',4),
 ('sp_surgelati','spesa','Surgelati','🧊',5),
 ('sp_casa','spesa','Casa e pulizia','🧼',6),

 ('att_manut','attivita','Manutenzione','🔧',1),
 ('att_doc','attivita','Documenti','📄',2),
 ('att_salute','attivita','Salute','🩺',3),
 ('att_auto','attivita','Auto','🚗',4),
 ('att_bambine','attivita','Bambine','🧒',5),

 ('cal_famiglia','calendario','Famiglia','🏠',1),
 ('cal_asilo','calendario','Asilo','🎒',2),
 ('cal_lavoro','calendario','Lavoro','💼',3);

-- ---------- checklist pulizie ----------
INSERT INTO pulizie_voci (id, categoria_id, nome, icona, frequenza, ogni_giorni, ordine) VALUES
 ('v01','pul_bagno','Bagno e sanitari','🚿','settimanale',7,1),
 ('v02','pul_bagno','Specchi','🪞','settimanale',7,2),
 ('v03','pul_bagno','Doccia e box','🧴','settimanale',7,3),
 ('v04','pul_bagno','Cambio asciugamani','🧺','settimanale',7,4),
 ('v05','pul_bagno','Tappetino bagno','🧽','settimanale',7,5),

 ('v06','pul_cucina','Cucina e superfici','🍽️','settimanale',7,1),
 ('v07','pul_cucina','Cambio strofinacci','🧻','settimanale',7,2),
 ('v08','pul_cucina','Lavello e rubinetteria','🚰','settimanale',7,3),
 ('v09','pul_cucina','Interno frigorifero','🧊','mensile',30,4),
 ('v10','pul_cucina','Forno e piano cottura','🔥','mensile',30,5),
 ('v11','pul_cucina','Filtri cappa','💨','trimestrale',90,6),

 ('v12','pul_camere','Cambio lenzuola e federe','🛏️','quindicinale',14,1),
 ('v13','pul_camere','Sotto i letti','🛌','quindicinale',14,2),
 ('v14','pul_camere','Riordino giochi bambine','🧸','settimanale',7,3),
 ('v15','pul_camere','Materassi, aspirare e girare','🪶','trimestrale',90,4),

 ('v16','pul_giorno','Spolverare','✨','settimanale',7,1),
 ('v17','pul_giorno','Sotto mobili e sedie','🪑','settimanale',7,2),
 ('v18','pul_giorno','Aspirare e lavare i pavimenti','🧹','settimanale',7,3),
 ('v19','pul_giorno','Battiscopa','📐','quindicinale',14,4),
 ('v20','pul_giorno','Divano e cuscini','🛋️','quindicinale',14,5),

 ('v21','pul_bianc','Cambio accappatoi','🥼','quindicinale',14,1),
 ('v22','pul_bianc','Tovaglie e tovaglioli','🍽️','settimanale',7,2),
 ('v23','pul_bianc','Bavaglini e grembiuli asilo','🎒','settimanale',7,3),
 ('v24','pul_bianc','Pigiami bambine','👚','settimanale',7,4),

 ('v25','pul_fondo','Vetri e finestre','🪟','mensile',30,1),
 ('v26','pul_fondo','Termosifoni','♨️','mensile',30,2),
 ('v27','pul_fondo','Porte e maniglie','🚪','mensile',30,3),
 ('v28','pul_fondo','Tende doccia e sifoni','🧴','trimestrale',90,4),
 ('v29','pul_fondo','Tende di casa','🪟','stagionale',120,5),
 ('v30','pul_fondo','Cambio stagione armadi','👕','stagionale',180,6);

-- qualche spunta già registrata nella settimana in corso
INSERT INTO pulizie_spunte (voce_id, settimana, stato, data, persona_id) VALUES
 ('v01', date('now','weekday 1','-7 day'), 'fatto',    date('now','-1 day'), 'collab'),
 ('v02', date('now','weekday 1','-7 day'), 'fatto',    date('now','-1 day'), 'collab'),
 ('v06', date('now','weekday 1','-7 day'), 'fatto',    date('now','-1 day'), 'collab'),
 ('v14', date('now','weekday 1','-7 day'), 'parziale', date('now'),          'vivien'),
 ('v16', date('now','weekday 1','-7 day'), 'fatto',    date('now','-1 day'), 'collab');

-- ---------- ore lavorate ----------
INSERT INTO ore_lavorate (persona_id, data, ora_inizio, ora_fine, ore, tariffa_oraria) VALUES
 ('collab', date('now','-8 day'),  '09:00','12:30', 3.5, 12),
 ('collab', date('now','-4 day'),  '09:00','12:00', 3.0, 12),
 ('collab', date('now','-1 day'),  '09:00','12:30', 3.5, 12);

-- ---------- pagamenti ----------
-- Esempio: nella settimana scorsa il dovuto era inferiore a quanto pagato,
-- così il conto mostra "Lucia è a debito di 2 €" (le si scala dal prossimo pagamento).
INSERT INTO pagamenti (persona_id, data, importo, nota) VALUES
 ('collab', date('now','-8 day'), 40, 'Contanti, prima settimana'),
 ('collab', date('now','-1 day'), 40, 'Bonifico');

-- ---------- biancheria ----------
INSERT INTO biancheria (id, nome, ogni_giorni, ultimo_cambio, persona_id, scorta, scorta_minima, ordine) VALUES
 ('b01','Strofinacci cucina',       7,  date('now','-5 day'),  'vivien', 2, 4, 1),
 ('b02','Asciugamani bagno',        7,  date('now','-8 day'),  'collab', 6, 4, 2),
 ('b03','Tappetino bagno',          7,  date('now','-6 day'),  'collab', 3, 2, 3),
 ('b04','Lenzuola matrimoniale',    14, date('now','-13 day'), 'collab', 3, 2, 4),
 ('b05','Lenzuola lettino Amelie',  14, date('now','-10 day'), 'vivien', 4, 2, 5),
 ('b06','Lenzuola lettino Maddie',  14, date('now','-16 day'), 'vivien', 4, 2, 6),
 ('b07','Accappatoi',               14, date('now','-9 day'),  'collab', 4, 2, 7),
 ('b08','Tovaglie',                 7,  date('now','-4 day'),  'davide', 5, 2, 8),
 ('b09','Bavaglini asilo',          7,  date('now','-2 day'),  'vivien', 8, 4, 9),
 ('b10','Copriletto e plaid',       30, date('now','-24 day'), 'collab', 2, 1, 10);

-- ---------- spesa ----------
INSERT INTO spesa_articoli (nome, quantita, categoria_id, origine, persona_id, stato) VALUES
 ('Pomodori da sugo','1 kg','sp_ortofrutta','tablet','vivien','da_prendere'),
 ('Insalata','2 buste','sp_ortofrutta','tablet','vivien','da_prendere'),
 ('Banane','1 casco','sp_ortofrutta','tablet','amelie','preso'),
 ('Latte intero','2 L','sp_freschi','iphone','davide','da_prendere'),
 ('Yogurt bambine','6','sp_freschi','tablet','vivien','da_prendere'),
 ('Pannolini taglia 5','1 pacco','sp_bambine','iphone','vivien','da_prendere'),
 ('Salviette','2','sp_bambine','tablet','vivien','da_prendere'),
 ('Detersivo lavatrice','1','sp_casa','ricorrente',NULL,'da_prendere'),
 ('Strofinacci nuovi','4','sp_casa','scorta',NULL,'da_prendere'),
 ('Sacchi umido','1 rotolo','sp_casa','tablet','davide','preso');

INSERT INTO spesa_ricorrenti (id, nome, quantita, categoria_id, ogni_giorni, ultimo_inserimento) VALUES
 ('r01','Detersivo lavatrice','1','sp_casa',28, date('now','-2 day')),
 ('r02','Pannolini taglia 5','1 pacco','sp_bambine',14, date('now','-1 day')),
 ('r03','Sacchi umido','1 rotolo','sp_casa',30, date('now','-12 day')),
 ('r04','Caffè macinato','2','sp_dispensa',14, date('now','-9 day'));

-- ---------- attività programmate ----------
INSERT INTO attivita (id, nome, categoria_id, persona_id, scadenza, ricorrenza_giorni) VALUES
 ('a01','Manutenzione caldaia','att_manut','davide', date('now','-2 day'), 365),
 ('a02','Bollo auto','att_doc','davide', date('now','+1 day'), 365),
 ('a03','Filtri condizionatore','att_manut','davide', date('now','+4 day'), 180),
 ('a04','Visita dentista','att_salute','vivien', date('now','+12 day'), 180),
 ('a05','Iscrizione asilo Maddie','att_bambine','vivien', date('now','+19 day'), 365),
 ('a06','Cambio gomme','att_auto','davide', date('now','+26 day'), 180);

-- ---------- calendario ----------
INSERT INTO eventi (id, titolo, calendario, inizio, tutto_il_giorno, persona_id, luogo) VALUES
 ('e01','Nuoto Amelie','famiglia', date('now','weekday 1','-7 day')||'T17:00',0,'amelie','Piscina comunale'),
 ('e02','Riunione condominio','famiglia', date('now','weekday 1','-6 day')||'T21:00',0,'davide',NULL),
 ('e03','Festa asilo','asilo', date('now','weekday 1','-5 day')||'T10:00',0,'amelie',NULL),
 ('e04','Servizio pulizie','famiglia', date('now','weekday 1','-4 day')||'T09:00',0,'collab',NULL),
 ('e05','Pediatra Maddie','famiglia', date('now','weekday 1','-4 day')||'T16:00',0,'maddie','Studio Bianchi'),
 ('e06','Colloquio asilo','asilo', date('now','weekday 1','-3 day')||'T17:00',0,'vivien',NULL),
 ('e07','Cena dai nonni','famiglia', date('now','weekday 1','-2 day')||'T20:00',0,NULL,NULL),
 ('e08','Parco con le bambine','famiglia', date('now','weekday 1','-1 day')||'T10:30',0,NULL,NULL);

-- ---------- note per chi pulisce ----------
INSERT INTO note (modulo, testo) VALUES
 ('pulizie','Lenzuola nell''armadio del corridoio, seconda anta, ripiano alto'),
 ('pulizie','Niente candeggina in cucina: solo detergente neutro sul piano in legno'),
 ('pulizie','Camera di Maddie dopo le 15:00, fa il riposino fino alle 14:45');

-- ---------- impostazioni ----------
INSERT INTO impostazioni (modulo, chiave, valore, tipo) VALUES
 ('generali','nome_casa','Casa Ferrafoni','testo'),
 ('generali','vista_iniziale','home','scelta'),
 ('generali','testo_grande','0','booleano'),
 ('pulizie','inizio_settimana','lunedi','scelta'),
 ('pulizie','registra_data','1','booleano'),
 ('pulizie','chiedi_persona','1','booleano'),
 ('pulizie','riporta_non_fatte','1','booleano'),
 ('pulizie','nome_collaboratrice','Collaboratrice','testo'),
 ('pulizie','registra_ore','1','booleano'),
 ('spesa','svuota_dopo_spesa','1','booleano'),
 ('spesa','unisci_doppioni','1','booleano'),
 ('spesa','scorte_in_lista','1','booleano'),
 ('spesa','intervallo_sync','30','numero'),
 ('calendario','vista_predefinita','settimana','scelta'),
 ('calendario','mostra_pulizie','1','booleano'),
 ('calendario','mostra_biancheria','1','booleano'),
 ('attivita','giorni_avanti','7','numero'),
 ('attivita','rosso_da','oggi','scelta');
