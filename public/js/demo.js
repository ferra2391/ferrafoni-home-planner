// Stessa forma della risposta di /api/stato.
// Serve per lo sviluppo, per l'anteprima e come rete di sicurezza
// se Cloudflare non risponde.

import { OGGI, piu, iso, lunedi } from './util.js';

const g = n => iso(piu(OGGI, n));

const VOCI = [
  ['v01','pul_bagno','Bagno e sanitari','🚿','settimanale',7],
  ['v02','pul_bagno','Specchi','🪞','settimanale',7],
  ['v03','pul_bagno','Doccia e box','🧴','settimanale',7],
  ['v04','pul_bagno','Cambio asciugamani','🧺','settimanale',7],
  ['v05','pul_bagno','Tappetino bagno','🧽','settimanale',7],
  ['v06','pul_cucina','Cucina e superfici','🍽️','settimanale',7],
  ['v07','pul_cucina','Cambio strofinacci','🧻','settimanale',7],
  ['v08','pul_cucina','Lavello e rubinetteria','🚰','settimanale',7],
  ['v09','pul_cucina','Interno frigorifero','🧊','mensile',30],
  ['v10','pul_cucina','Forno e piano cottura','🔥','mensile',30],
  ['v11','pul_cucina','Filtri cappa','💨','trimestrale',90],
  ['v12','pul_camere','Cambio lenzuola e federe','🛏️','quindicinale',14],
  ['v13','pul_camere','Sotto i letti','🛌','quindicinale',14],
  ['v14','pul_camere','Riordino giochi bambine','🧸','settimanale',7],
  ['v15','pul_camere','Materassi, aspirare e girare','🪶','trimestrale',90],
  ['v16','pul_giorno','Spolverare','✨','settimanale',7],
  ['v17','pul_giorno','Sotto mobili e sedie','🪑','settimanale',7],
  ['v18','pul_giorno','Aspirare e lavare i pavimenti','🧹','settimanale',7],
  ['v19','pul_giorno','Battiscopa','📐','quindicinale',14],
  ['v20','pul_giorno','Divano e cuscini','🛋️','quindicinale',14],
  ['v21','pul_bianc','Cambio accappatoi','🥼','quindicinale',14],
  ['v22','pul_bianc','Tovaglie e tovaglioli','🍽️','settimanale',7],
  ['v23','pul_bianc','Bavaglini e grembiuli asilo','🎒','settimanale',7],
  ['v24','pul_bianc','Pigiami bambine','👚','settimanale',7],
  ['v25','pul_fondo','Vetri e finestre','🪟','mensile',30],
  ['v26','pul_fondo','Termosifoni','♨️','mensile',30],
  ['v27','pul_fondo','Porte e maniglie','🚪','mensile',30],
  ['v28','pul_fondo','Tende doccia e sifoni','🧴','trimestrale',90],
  ['v29','pul_fondo','Tende di casa','🪟','stagionale',120],
  ['v30','pul_fondo','Cambio stagione armadi','👕','stagionale',180]
];

const BIANC = [
  ['b01','Strofinacci cucina',7,-5,'vivien',2,4],
  ['b02','Asciugamani bagno',7,-8,'collab',6,4],
  ['b03','Tappetino bagno',7,-6,'collab',3,2],
  ['b04','Lenzuola matrimoniale',14,-13,'collab',3,2],
  ['b05','Lenzuola lettino Amelie',14,-10,'vivien',4,2],
  ['b06','Lenzuola lettino Maddie',14,-16,'vivien',4,2],
  ['b07','Accappatoi',14,-9,'collab',4,2],
  ['b08','Tovaglie',7,-4,'davide',5,2],
  ['b09','Bavaglini asilo',7,-2,'vivien',8,4],
  ['b10','Copriletto e plaid',30,-24,'collab',2,1]
];

const SPESA = [
  [1,'Pomodori da sugo','1 kg','sp_ortofrutta','tablet','vivien','da_prendere'],
  [2,'Insalata','2 buste','sp_ortofrutta','tablet','vivien','da_prendere'],
  [3,'Banane','1 casco','sp_ortofrutta','tablet','amelie','preso'],
  [4,'Latte intero','2 L','sp_freschi','iphone','davide','da_prendere'],
  [5,'Yogurt bambine','6','sp_freschi','tablet','vivien','da_prendere'],
  [6,'Pannolini taglia 5','1 pacco','sp_bambine','iphone','vivien','da_prendere'],
  [7,'Salviette','2','sp_bambine','tablet','vivien','da_prendere'],
  [8,'Detersivo lavatrice','1','sp_casa','ricorrente',null,'da_prendere'],
  [9,'Strofinacci nuovi','4','sp_casa','scorta',null,'da_prendere'],
  [10,'Sacchi umido','1 rotolo','sp_casa','tablet','davide','preso']
];

const ATT = [
  ['a01','Manutenzione caldaia','att_manut','davide',-2,365],
  ['a02','Bollo auto','att_doc','davide',1,365],
  ['a03','Filtri condizionatore','att_manut','davide',4,180],
  ['a04','Visita dentista','att_salute','vivien',12,180],
  ['a05','Iscrizione asilo Maddie','att_bambine','vivien',19,365],
  ['a06','Cambio gomme','att_auto','davide',26,180]
];

const EVENTI = [
  ['e01','Nuoto Amelie','famiglia',0,'17:00','amelie'],
  ['e02','Riunione condominio','famiglia',1,'21:00','davide'],
  ['e03','Festa asilo','asilo',2,'10:00','amelie'],
  ['e04','Servizio pulizie','famiglia',3,'09:00','collab'],
  ['e05','Pediatra Maddie','famiglia',3,'16:00','maddie'],
  ['e06','Colloquio asilo','asilo',4,'17:00','vivien'],
  ['e07','Cena dai nonni','famiglia',5,'20:00',null],
  ['e08','Parco con le bambine','famiglia',6,'10:30',null]
];

export function demo(settimana = iso(lunedi())){
  const lun = new Date(settimana + 'T00:00:00');
  return {
    settimana,
    aggiornato: new Date().toISOString(),
    persone: [
      { id:'davide', nome:'Davide', iniziali:'DA', ruolo:'adulto', colore:'#3D5BA9', tariffa_oraria:0 },
      { id:'vivien', nome:'Vivien', iniziali:'VI', ruolo:'adulto', colore:'#2F7D6D', tariffa_oraria:0 },
      { id:'amelie', nome:'Amelie', iniziali:'AM', ruolo:'bambina', colore:'#B9741F', tariffa_oraria:0 },
      { id:'maddie', nome:'Maddie', iniziali:'MA', ruolo:'bambina', colore:'#9C3A5E', tariffa_oraria:0 },
      { id:'collab', nome:'Lucia', iniziali:'LU', ruolo:'collaboratrice', colore:'#6E7A83', tariffa_oraria:12 }
    ],
    moduli: [
      { id:'pulizie', nome:'Pulizie', colore:'#2F7D6D', ordine:1 },
      { id:'calendario', nome:'Calendario', colore:'#3D5BA9', ordine:2 },
      { id:'spesa', nome:'Lista della spesa', colore:'#B9741F', ordine:3 },
      { id:'attivita', nome:'Attività programmate', colore:'#9C3A5E', ordine:4 }
    ],
    categorie: [
      { id:'pul_bagno', modulo:'pulizie', nome:'Bagno', icona:'🚿', ordine:1 },
      { id:'pul_cucina', modulo:'pulizie', nome:'Cucina', icona:'🍽️', ordine:2 },
      { id:'pul_camere', modulo:'pulizie', nome:'Camere e letti', icona:'🛏️', ordine:3 },
      { id:'pul_giorno', modulo:'pulizie', nome:'Zona giorno', icona:'🛋️', ordine:4 },
      { id:'pul_bianc', modulo:'pulizie', nome:'Biancheria', icona:'🧺', ordine:5 },
      { id:'pul_fondo', modulo:'pulizie', nome:'Pulizie di fondo', icona:'🪟', ordine:6 },
      { id:'sp_ortofrutta', modulo:'spesa', nome:'Frutta e verdura', icona:'🥬', ordine:1 },
      { id:'sp_freschi', modulo:'spesa', nome:'Banco freschi', icona:'🧀', ordine:2 },
      { id:'sp_dispensa', modulo:'spesa', nome:'Dispensa', icona:'🥫', ordine:3 },
      { id:'sp_bambine', modulo:'spesa', nome:'Bambine', icona:'🧸', ordine:4 },
      { id:'sp_casa', modulo:'spesa', nome:'Casa e pulizia', icona:'🧼', ordine:6 },
      { id:'att_manut', modulo:'attivita', nome:'Manutenzione', icona:'🔧', ordine:1 },
      { id:'att_doc', modulo:'attivita', nome:'Documenti', icona:'📄', ordine:2 },
      { id:'att_salute', modulo:'attivita', nome:'Salute', icona:'🩺', ordine:3 },
      { id:'att_auto', modulo:'attivita', nome:'Auto', icona:'🚗', ordine:4 },
      { id:'att_bambine', modulo:'attivita', nome:'Bambine', icona:'🧒', ordine:5 }
    ],
    impostazioni: [
      { modulo:'generali', chiave:'nome_casa', valore:'Casa Ferrafoni' },
      { modulo:'pulizie', chiave:'nome_collaboratrice', valore:'Collaboratrice' },
      { modulo:'attivita', chiave:'giorni_avanti', valore:'7' }
    ],
    pulizie: {
      voci: VOCI.map(([id, categoria_id, nome, icona, frequenza, ogni_giorni], i) =>
        ({ id, categoria_id, nome, icona, frequenza, ogni_giorni, ordine: i })),
      spunte: [
        { voce_id:'v01', settimana, stato:'fatto', data:g(-1), persona_id:'collab' },
        { voce_id:'v02', settimana, stato:'fatto', data:g(-1), persona_id:'collab' },
        { voce_id:'v06', settimana, stato:'fatto', data:g(-1), persona_id:'collab' },
        { voce_id:'v14', settimana, stato:'parziale', data:g(0), persona_id:'vivien' },
        { voce_id:'v16', settimana, stato:'fatto', data:g(-1), persona_id:'collab' }
      ],
      ore: [
        { id:1, persona_id:'collab', data:g(-8), ora_inizio:'09:00', ora_fine:'12:30', ore:3.5, tariffa_oraria:12 },
        { id:2, persona_id:'collab', data:g(-4), ora_inizio:'09:00', ora_fine:'12:00', ore:3, tariffa_oraria:12 },
        { id:3, persona_id:'collab', data:g(-1), ora_inizio:'09:00', ora_fine:'12:30', ore:3.5, tariffa_oraria:12 }
      ]
    },
    biancheria: BIANC.map(([id, nome, ogni_giorni, ult, persona_id, scorta, scorta_minima], i) =>
      ({ id, nome, ogni_giorni, ultimo_cambio:g(ult), persona_id, scorta, scorta_minima, ordine:i })),
    spesa: {
      articoli: SPESA.map(([id, nome, quantita, categoria_id, origine, persona_id, stato]) =>
        ({ id, nome, quantita, categoria_id, origine, persona_id, stato, negozio:'supermercato' })),
      ricorrenti: []
    },
    attivita: ATT.map(([id, nome, categoria_id, persona_id, giorni, ricorrenza_giorni]) =>
      ({ id, nome, categoria_id, persona_id, scadenza:g(giorni), ricorrenza_giorni })),
    eventi: EVENTI.map(([id, titolo, calendario, giorno, ora, persona_id]) =>
      ({ id, titolo, calendario, inizio: iso(piu(lun, giorno)) + 'T' + ora, persona_id })),
    registro: [
      { modulo:'pulizie', azione:'fatto', dettaglio:'Bagno e sanitari', persona_id:'collab', persona_nome:'Lucia', creato_il: new Date(Date.now()-3600e3).toISOString() },
      { modulo:'spesa', azione:'aggiunto', dettaglio:'Pannolini taglia 5', persona_id:'vivien', persona_nome:'Vivien', creato_il: new Date(Date.now()-7200e3).toISOString() },
      { modulo:'pulizie', azione:'cambio biancheria', dettaglio:'b02', persona_id:'collab', persona_nome:'Lucia', creato_il: new Date(Date.now()-86000e3).toISOString() }
    ],
    pagamenti: [
      { id:1, persona_id:'collab', data:g(-8), importo:40, nota:'Contanti, prima settimana' },
      { id:2, persona_id:'collab', data:g(-1), importo:40, nota:'Bonifico' }
    ]
  };
}
