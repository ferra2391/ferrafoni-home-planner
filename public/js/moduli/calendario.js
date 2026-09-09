// Modulo calendario: un mese intero in una vista sola, scorribile avanti e
// indietro nel tempo. Dentro ci sono anche le scadenze delle attivita
// programmate, che vivono come scheda di questo modulo.

import { esc, GG3, MESI_LUNGHI, iso, OGGI, gm, avviso } from '../util.js';
import { riq, modaleForm, vuoto } from '../ui.js';
import { api, prova } from '../api.js';
import * as S from '../stato.js';
import attivita from './attivita.js';

const COLORE = 'var(--calendario)';

// Mese mostrato, come AAAA-MM. Si imposta al primo disegno.
let mese = null;

/* ---------- griglia del mese ---------- */

function grigliaMese(){
  const [anno, m] = mese.split('-').map(Number);
  const primo = new Date(anno, m - 1, 1);
  const giorniMese = new Date(anno, m, 0).getDate();
  const scarto = (primo.getDay() + 6) % 7;          // lunedi = 0
  const celle = Math.ceil((scarto + giorniMese) / 7) * 7;

  const scadenze = S.attivitaConScadenza();
  const intestazioni = ['lun','mar','mer','gio','ven','sab','dom'];

  let html = '<div class="mese">' +
    intestazioni.map(g => `<div class="mese-int">${g}</div>`).join('');

  for (let i = 0; i < celle; i++) {
    const giorno = i - scarto + 1;
    if (giorno < 1 || giorno > giorniMese) { html += '<div class="mese-cella fuori"></div>'; continue; }

    const d = new Date(anno, m - 1, giorno);
    const gIso = iso(d);
    const oggi = gIso === iso(OGGI);

    const eventi = (S.S.dati.eventi || [])
      .filter(e => e.inizio.slice(0, 10) === gIso)
      .sort((a, b) => a.inizio.localeCompare(b.inizio));
    const att = scadenze.filter(a => iso(a.quando) === gIso);

    html += `<div class="mese-cella ${oggi ? 'oggi' : ''}" data-giorno="${gIso}">
      <span class="num">${giorno}</span>
      ${eventi.map(e => `<button class="voce-cal" data-mod-evento="${e.id}" style="--ec:${COLORE}">
          <b>${esc(e.inizio.slice(11, 16))}</b> ${esc(e.titolo)}</button>`).join('')}
      ${att.map(a => `<button class="voce-cal" data-mod-att="${a.id}"
          style="--ec:${a.giorni <= 0 ? 'var(--rosso)' : 'var(--attivita)'}">
          ${esc(a.nome)}</button>`).join('')}
    </div>`;
  }

  return html + '</div>';
}

function barraMese(){
  const [anno, m] = mese.split('-').map(Number);
  const corrente = mese === iso(OGGI).slice(0, 7);
  const nEventi = (S.S.dati.eventi || []).filter(e => e.inizio.slice(0, 7) === mese).length;
  const nAtt = S.attivitaConScadenza().filter(a => iso(a.quando).slice(0, 7) === mese).length;

  return `<div class="settimana-barra">
    <button class="nav" data-cal-mese="-1" aria-label="Mese precedente">&lsaquo;</button>
    <button class="nav" data-cal-mese="1" aria-label="Mese successivo">&rsaquo;</button>
    <span class="et">
      <b>${MESI_LUNGHI[m - 1]} ${anno}</b>
      <span>${nEventi} ${nEventi === 1 ? 'impegno' : 'impegni'} &middot; ${nAtt} ${nAtt === 1 ? 'scadenza' : 'scadenze'}</span>
    </span>
    ${corrente ? '' : '<button class="btn chiaro piccolo" data-cal-mese="0">Torna a questo mese</button>'}
    <button class="btn piccolo" style="background:var(--calendario)" data-nuovo-evento>Nuovo impegno</button>
  </div>`;
}

/* ---------- prossimi impegni ---------- */

function cardProssimi(){
  const prossimi = (S.S.dati.eventi || [])
    .filter(e => e.inizio.slice(0, 10) >= iso(OGGI))
    .sort((a, b) => a.inizio.localeCompare(b.inizio))
    .slice(0, 10);

  return riq('Prossimi impegni',
    (prossimi.length ? prossimi.map(e => `
      <div class="log-riga">
        <span class="log-punto" style="--c:${COLORE}"></span>
        <span class="tx"><strong>${esc(e.titolo)}</strong>
          <span>${esc(new Date(e.inizio).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' }))}
          alle ${esc(e.inizio.slice(11, 16))}${e.luogo ? ' &middot; ' + esc(e.luogo) : ''}${e.persona_id ? ' &middot; ' + esc(S.nomePersona(e.persona_id)) : ''}</span></span>
        <div class="riga-azioni">
          <button data-mod-evento="${e.id}">Modifica</button>
          <button data-elimina-evento="${e.id}" class="pericolo">Elimina</button>
        </div>
      </div>`).join('') : vuoto('Nessun impegno in programma')) +
    `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
       <button class="btn pieno" style="background:${COLORE}" data-nuovo-evento>Aggiungi un impegno</button>
     </div>`,
    { raso: true, meta: prossimi.length ? 'in ordine di data' : '' });
}

/* ---------- modale di un impegno ---------- */

function campiEvento(){
  return [
    { nome:'titolo', etichetta:'Che cosa', richiesto:true, placeholder:'Es. Visita dal pediatra' },
    { nome:'data', etichetta:'Giorno', tipo:'data', richiesto:true },
    { nome:'ora', etichetta:'Ora', tipo:'ora' },
    { nome:'persona_id', etichetta:'Per chi', tipo:'select',
      opzioni: [{ id:'', nome:'Tutta la famiglia' }, ...S.S.dati.persone.map(p => ({ id:p.id, nome:p.nome }))] },
    { nome:'luogo', etichetta:'Luogo', placeholder:'Facoltativo' },
    { nome:'note', etichetta:'Note', tipo:'testolungo', placeholder:'Facoltativo' }
  ];
}

async function nuovoEvento(giorno){
  const r = await modaleForm({
    titolo: 'Nuovo impegno', colore: COLORE,
    valori: { data: giorno || iso(OGGI), ora: '09:00' },
    campi: campiEvento()
  });
  if (r?.azione !== 'salva' || !r.valori.titolo || !r.valori.data) return;

  const inizio = r.valori.data + 'T' + (r.valori.ora || '09:00');
  const evento = {
    id: 'loc' + Date.now(), titolo: r.valori.titolo, calendario: 'famiglia',
    persona_id: r.valori.persona_id || null, luogo: r.valori.luogo || null,
    note: r.valori.note || null, inizio
  };
  S.aggiungiEventoLocale(evento);
  await prova(api.creaEvento(evento));
  avviso('Impegno aggiunto il ' + gm(r.valori.data));
}

async function modificaEvento(id){
  const e = (S.S.dati.eventi || []).find(x => String(x.id) === String(id));
  if (!e) return;

  const r = await modaleForm({
    titolo: e.titolo, colore: COLORE, permettiElimina: true,
    sottotitolo: 'Modifica o elimina questo impegno.',
    valori: {
      titolo: e.titolo, data: e.inizio.slice(0, 10), ora: e.inizio.slice(11, 16),
      persona_id: e.persona_id || '', luogo: e.luogo || '', note: e.note || ''
    },
    campi: campiEvento()
  });
  if (!r) return;

  if (r.azione === 'elimina') {
    S.rimuoviEventoLocale(id);
    await prova(api.eliminaEvento(id));
    avviso('Impegno eliminato');
    return;
  }

  const campi = {
    titolo: r.valori.titolo,
    inizio: r.valori.data + 'T' + (r.valori.ora || '09:00'),
    persona_id: r.valori.persona_id || null,
    luogo: r.valori.luogo || null,
    note: r.valori.note || null
  };
  S.modificaEventoLocale(id, campi);
  await prova(api.modificaEvento({ id, ...campi }));
  avviso('Impegno aggiornato');
}

/* ---------- viste ---------- */

const vistaMese = () => barraMese() +
  riq('', grigliaMese(), { raso: true, classe: 'tinta', colore: COLORE }) +
  '<div style="margin-top:18px">' + cardProssimi() + '</div>';

/* ---------- modulo ---------- */

export default {
  id: 'calendario',
  nome: 'Calendario',
  emoji: '\u{1F4C5}',
  colore: COLORE,
  sezioni: [
    { id: 'mese', nome: 'Mese' },
    { id: 'attivita', nome: 'Attivita programmate' },
    { id: 'impostazioni', nome: 'Impostazioni' }
  ],

  distintivo(){
    const inRitardo = S.attivitaConScadenza().filter(a => a.giorni <= 0).length;
    return { n: inRitardo || S.eventiDelGiorno().length, caldo: inRitardo > 0 };
  },

  render(sezione, contesto){
    if (mese === null) mese = iso(OGGI).slice(0, 7);
    if (sezione === 'attivita') return attivita.render('scadenze', contesto);
    if (sezione === 'impostazioni') return attivita.render('impostazioni', contesto);
    return vistaMese();
  },

  aggancia(root, contesto){
    // I pulsanti delle attivita restano quelli del loro modulo: agganciandolo qui
    // funzionano sia nella scheda sia dentro la griglia del mese.
    attivita.aggancia(root, contesto);
    attivita.ridisegna = contesto.ridisegna;

    root.addEventListener('click', async e => {
      const nav = e.target.closest('[data-cal-mese]');
      if (nav) {
        const n = parseInt(nav.dataset.calMese, 10);
        if (n === 0) mese = iso(OGGI).slice(0, 7);
        else {
          const [a, m] = mese.split('-').map(Number);
          const d = new Date(a, m - 1 + n, 1);
          mese = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }
        contesto.ridisegna();
        return;
      }

      const mod = e.target.closest('[data-mod-evento]');
      if (mod) { await modificaEvento(mod.dataset.modEvento); return; }

      const el = e.target.closest('[data-elimina-evento]');
      if (el) {
        S.rimuoviEventoLocale(el.dataset.eliminaEvento);
        await prova(api.eliminaEvento(el.dataset.eliminaEvento));
        avviso('Impegno eliminato');
        return;
      }

      if (e.target.closest('[data-nuovo-evento]')) { await nuovoEvento(); return; }

      // Tocco su una casella vuota del mese: nuovo impegno gia con quel giorno.
      const cella = e.target.closest('[data-giorno]');
      if (cella) await nuovoEvento(cella.dataset.giorno);
    });
  }
};
