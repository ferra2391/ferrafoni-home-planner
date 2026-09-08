// Modulo calendario: settimana a sette colonne, con dentro anche
// i turni delle pulizie e i cambi biancheria se attivati.

import { esc, GG3, piu, iso, lunedi, OGGI, breve, avviso } from '../util.js';
import { riq, rigaCfg, interruttore, modaleForm } from '../ui.js';
import { api, prova } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--calendario)';
const TINTE = { famiglia:'var(--calendario)', asilo:'var(--spesa)', lavoro:'var(--attivita)' };

function settimana(){
  const lun = lunedi();
  const colonne = [];

  for (let i = 0; i < 7; i++) {
    const g = piu(lun, i);
    const oggi = iso(g) === iso(OGGI);
    const eventi = S.eventiDelGiorno(g);
    const bianc = S.biancheriaConScadenza().filter(b => iso(b.prossimo) === iso(g));
    const att = S.attivitaConScadenza().filter(a => iso(a.quando) === iso(g));

    colonne.push(`
      <div class="giorno ${oggi ? 'oggi' : ''}">
        <h4>${GG3[g.getDay()]}<b>${g.getDate()}</b></h4>
        ${eventi.map(e => card(e.titolo, e.inizio.slice(11,16), TINTE[e.calendario] || COLORE)).join('')}
        ${bianc.map(b => card('Cambio ' + b.nome.toLowerCase(), 'biancheria', 'var(--pulizie)')).join('')}
        ${att.map(a => card(a.nome, 'scadenza', 'var(--attivita)')).join('')}
      </div>`);
  }

  return `<div class="sett">${colonne.join('')}</div>`;
}

const card = (titolo, sotto, colore) => `
  <div class="ev" style="--ec:${colore}"><b>${esc(titolo)}</b><span>${esc(sotto)}</span></div>`;

function vistaSettimana(){
  const lun = lunedi();
  const prossimi = (S.S.dati.eventi || [])
    .filter(e => e.inizio.slice(0,10) >= iso(OGGI)).slice(0, 6);

  return riq(breve(lun) + ' – ' + breve(piu(lun, 6)), settimana(),
    { raso: true, classe: 'tinta', colore: COLORE, meta: 'settimana in corso' }) +
    `<div class="griglia g2" style="margin-top:18px">
      ${riq('Prossimi impegni', `<ul class="righe" style="margin:-16px -18px">
        ${prossimi.map(e => `<li><span class="tx"><strong>${esc(e.titolo)}</strong>
          <span>${esc(S.nomePersona(e.persona_id) || e.calendario)}</span></span>
          <span class="qd">${esc(new Date(e.inizio).toLocaleDateString('it-IT',{weekday:'short',day:'numeric'}))}
          ${esc(e.inizio.slice(11,16))}</span></li>`).join('')}
      </ul>` + `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
        <button class="btn chiaro pieno" data-nuovo-evento>Nuovo impegno</button></div>`)}
      ${riq('Calendari collegati', `<ul class="righe" style="margin:-16px -18px">
        ${['famiglia','asilo','lavoro'].map(c => `<li>
          <span class="pill" style="--c:${TINTE[c]}">${esc(c)}</span>
          <span class="tx"><strong>${c === 'famiglia' ? 'Casa Ferrafoni' : c === 'asilo' ? 'Amelie e Maddie' : 'Davide'}</strong>
          <span>${(S.S.dati.eventi || []).filter(e => e.calendario === c).length} impegni</span></span></li>`).join('')}
      </ul>`)}
    </div>`;
}

function vistaImpostazioni(){
  return `<div class="griglia g-lato">
    <div class="griglia" style="align-content:start">
      ${riq('Calendari', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Casa Ferrafoni', 'Visibile a tutti, modificabile da Davide e Vivien.', interruttore(true, COLORE))}
        ${rigaCfg('Asilo di Amelie e Maddie', 'Sola lettura, si aggiorna ogni notte.', interruttore(true, COLORE))}
        ${rigaCfg('Lavoro di Davide', 'Mostra le fasce occupate senza i titoli.', interruttore(true, COLORE))}
        ${rigaCfg('Festività italiane', 'Giorni rossi e chiusure dell\'asilo.', interruttore(false, COLORE))}
      </ul>`, { classe: 'tinta', colore: COLORE })}
      ${riq('Cosa appare nella griglia', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Checklist pulizie', '', interruttore(true, COLORE))}
        ${rigaCfg('Cambi biancheria', '', interruttore(true, COLORE))}
        ${rigaCfg('Attività programmate', '', interruttore(true, COLORE))}
        ${rigaCfg('Giorni di spesa', '', interruttore(false, COLORE))}
      </ul>`)}
    </div>
    ${riq('Avvisi', `<ul class="cfg" style="margin:-16px -18px">
      ${rigaCfg('Avvisa prima di ogni impegno', '', `<select><option>10 minuti</option><option selected>30 minuti</option><option>1 ora</option></select>`)}
      ${rigaCfg('Vista predefinita', '', `<div class="segmenti"><button>Giorno</button><button class="on">Settimana</button><button>Mese</button></div>`)}
      ${rigaCfg('Riepilogo della sera', 'Alle 21:00, cosa succede domani.', interruttore(true, COLORE))}
      ${rigaCfg('Silenzia di notte', 'Dalle 21:30 alle 07:00.', interruttore(true, COLORE))}
    </ul>`)}
  </div>`;
}

export default {
  id: 'calendario',
  nome: 'Calendario',
  emoji: '📅',
  colore: COLORE,
  sezioni: [{ id:'settimana', nome:'Settimana' }, { id:'impostazioni', nome:'Impostazioni' }],
  distintivo(){ return { n: S.eventiDelGiorno().length, caldo: false }; },
  render(sezione){ return sezione === 'impostazioni' ? vistaImpostazioni() : vistaSettimana(); },
  aggancia(root){
    root.addEventListener('click', async e => {
      if (!e.target.closest('[data-nuovo-evento]')) return;

      const opzCal = [{ id:'famiglia', nome:'Famiglia' }, { id:'asilo', nome:'Asilo' }, { id:'lavoro', nome:'Lavoro' }];
      const opzPersone = [{ id:'', nome:'Tutta la famiglia' }, ...S.S.dati.persone.map(p => ({ id:p.id, nome:p.nome }))];

      const r = await modaleForm({
        titolo: 'Nuovo impegno', colore: COLORE,
        valori: { data: iso(OGGI), ora:'09:00' },
        campi: [
          { nome:'titolo', etichetta:'Che cosa', richiesto:true, placeholder:'Es. Visita dal pediatra' },
          { nome:'calendario', etichetta:'Calendario', tipo:'select', opzioni: opzCal },
          { nome:'persona_id', etichetta:'Per chi', tipo:'select', opzioni: opzPersone },
          { nome:'data', etichetta:'Giorno', tipo:'data', richiesto:true },
          { nome:'ora', etichetta:'Ora (es. 16:00)' },
          { nome:'luogo', etichetta:'Luogo', placeholder:'Facoltativo' }
        ]
      });
      if (r?.azione === 'salva' && r.valori.titolo && r.valori.data) {
        const inizio = r.valori.data + 'T' + (r.valori.ora || '09:00');
        const evento = { id:'loc'+Date.now(), titolo:r.valori.titolo, calendario:r.valori.calendario,
                          persona_id:r.valori.persona_id || null, luogo:r.valori.luogo || null, inizio };
        S.aggiungiEventoLocale(evento);
        prova(api.creaEvento({ ...evento }));
        avviso('Impegno aggiunto');
      }
    });
  }
};
