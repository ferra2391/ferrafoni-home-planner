// La home non è un elenco: è un riquadro di urgenze più quattro tessere
// che si aprono a cascata, una alla volta, senza far scorrere la pagina.

import { esc, gm, relativa, plurale, OGGI, GG, MM } from '../util.js';
import { pill, anello, vuoto } from '../ui.js';
import * as S from '../stato.js';

const APERTA = { id: null };

function tessera({ id, nome, colore, emoji, cifra, sotto, percento, righe, azione }){
  const aperta = APERTA.id === id;
  return `
  <article class="tessera ${aperta ? 'aperta' : ''}" style="--c:${colore}" data-tessera="${id}">
    <button class="testa" data-apri="${id}">
      <span class="emj">${emoji}</span>
      <span class="info"><b>${esc(nome)}</b><span>${esc(sotto)}</span></span>
      ${percento !== undefined
        ? `<span style="position:relative;display:flex;align-items:center;justify-content:center">
             ${anello(percento, colore, 58)}
             <b style="position:absolute;font-size:.82rem;color:${colore}">${percento}%</b>
           </span>`
        : `<span class="cifra">${cifra}</span>`}
      <span class="freccia"></span>
    </button>
    <div class="corpo"><div>
      <ul class="righe">${righe || ''}</ul>
      <div class="piedino">
        <span class="occhiello">${esc(azione.nota || '')}</span>
        <button class="btn piccolo" style="background:${colore}" data-vai="${azione.vai}">${esc(azione.testo)}</button>
      </div>
    </div></div>
  </article>`;
}

const rigaSemplice = (titolo, sotto, destra, urgente) => `
  <li class="${urgente ? 'urgente' : ''}">
    <span class="tx"><strong>${esc(titolo)}</strong>${sotto ? `<span>${esc(sotto)}</span>` : ''}</span>
    <span class="qd">${esc(destra || '')}</span></li>`;

function urgenze(){
  const lista = S.scadenzeSettimana(Number(S.impostazione('attivita', 'giorni_avanti', 7)));
  const gravi = lista.filter(x => x.etichetta.urgente);

  if (!lista.length) return `<div class="urgenze vuota">
    <div class="urg calma"><span class="emj">✅</span><span><b>Niente in scadenza</b>
    <span>Nella settimana non c'è nulla da recuperare</span></span></div></div>`;

  const mostrate = (gravi.length ? gravi : lista).slice(0, 4);
  return `<div class="urgenze">${mostrate.map(x => `
    <button class="urg ${x.etichetta.urgente ? '' : 'calma'}" data-vai="${x.modulo}:${x.sezione}">
      <span class="emj">${x.emoji}</span>
      <span><b>${esc(x.titolo)}</b><span>${esc(x.sotto)} · ${esc(x.etichetta.testo)}</span></span>
    </button>`).join('')}</div>`;
}

export default {
  id: 'home',
  nome: 'Oggi',
  emoji: '🏠',
  colore: 'var(--home)',
  sezioni: [{ id: 'oggi', nome: 'Oggi' }],

  distintivo(){
    const n = S.urgenti().length;
    return { n, caldo: n > 0 };
  },

  render(){
    const av = S.avanzamentoPulizie();
    const lucia = S.S.dati.persone.find(p => p.ruolo === 'collaboratrice');
    const conto = lucia ? S.contoPersona(lucia.id) : null;
    const spesa = S.spesaDaPrendere();
    const att = S.attivitaConScadenza();
    const eventi = S.eventiDelGiorno();

    const tessere = [
      tessera({
        id: 'pulizie', nome: 'Pulizie', colore: 'var(--pulizie)', emoji: '🧽',
        percento: av.percento,
        sotto: plurale(av.restanti, 'voce ancora da fare', 'voci ancora da fare'),
        righe: S.S.dati.pulizie.voci.filter(v => !S.spunta(v.id)).slice(0, 5)
          .map(v => rigaSemplice(v.nome, S.categoria(v.categoria_id)?.nome, v.frequenza)).join('')
          || `<li><span class="tx"><strong>Tutto fatto per questa settimana</strong></span></li>`,
        azione: { testo: 'Apri la checklist', vai: 'pulizie:checklist',
                  nota: av.parziali ? plurale(av.parziali, 'voce parziale', 'voci parziali') : '' }
      }),
      tessera({
        id: 'spesa', nome: 'Lista della spesa', colore: 'var(--spesa)', emoji: '🛒',
        cifra: spesa.length, sotto: 'articoli da prendere',
        righe: spesa.slice(0, 5).map(a => rigaSemplice(
          a.nome, a.origine === 'iphone' ? 'aggiunto dall\'iPhone' : S.categoria(a.categoria_id)?.nome,
          a.quantita)).join('') || vuoto('La lista è vuota'),
        azione: { testo: 'Apri la lista', vai: 'spesa:lista',
                  nota: spesa.filter(a => a.origine === 'iphone').length
                        ? 'Qualcosa è arrivato dall\'iPhone' : '' }
      }),
      tessera({
        id: 'conto', nome: lucia ? 'Conto con ' + lucia.nome : 'Ore e pagamenti',
        colore: 'var(--pulizie)', emoji: '\u{1F4B6}',
        cifra: conto ? (conto.differenza >= 0 ? '' : '') + Math.abs(conto.differenza).toFixed(0) : '0',
        sotto: conto
          ? (Math.abs(conto.differenza) < 0.005 ? 'conto in pari'
             : conto.differenza > 0 ? 'euro di troppo gia versati' : 'euro ancora da dare')
          : 'nessuna persona da pagare',
        righe: conto ? [
          rigaSemplice('Ore lavorate in tutto', '', conto.oreTotali.toFixed(1).replace('.', ',')),
          rigaSemplice('Dovuto', lucia.tariffa_oraria + ' euro/ora', conto.dovuto.toFixed(2).replace('.', ',') + ' EUR'),
          rigaSemplice('Pagato finora', '', conto.pagato.toFixed(2).replace('.', ',') + ' EUR'),
          rigaSemplice(
            Math.abs(conto.differenza) < 0.005 ? 'Conto in pari'
              : conto.differenza > 0
                ? lucia.nome + ' e a debito di ' + conto.differenza.toFixed(2).replace('.', ',') + ' EUR'
                : lucia.nome + ' e a credito di ' + Math.abs(conto.differenza).toFixed(2).replace('.', ',') + ' EUR',
            '', '', conto.differenza < -0.005)
        ].join('') : vuoto('Aggiungi una persona che pulisce'),
        azione: { testo: 'Vai ai pagamenti', vai: 'pulizie:pagamenti', nota: '' }
      }),
      tessera({
        id: 'giornata', nome: 'La giornata', colore: 'var(--calendario)', emoji: '📅',
        cifra: eventi.length + att.filter(a => a.giorni === 0).length, sotto: 'tra impegni e scadenze',
        righe: (eventi.map(e => rigaSemplice(e.titolo, S.nomePersona(e.persona_id), e.inizio.slice(11, 16)))
          .concat(att.filter(a => a.giorni <= 1).map(a => rigaSemplice(
            a.nome, S.categoria(a.categoria_id)?.nome, relativa(a.quando), a.giorni <= 0))))
          .slice(0, 5).join('') || vuoto('Giornata libera'),
        azione: { testo: 'Apri il calendario', vai: 'calendario:settimana', nota: '' }
      })
    ];

    return `
      <p class="occhiello" style="margin:0 0 12px">
        ${GG[OGGI.getDay()]} ${OGGI.getDate()} ${MM[OGGI.getMonth()]} · ${esc(S.impostazione('generali','nome_casa','Casa Ferrafoni'))}
      </p>
      ${urgenze()}
      <div class="cascata">${tessere.join('')}</div>`;
  },

  aggancia(root, { vai }){
    root.addEventListener('click', e => {
      const apri = e.target.closest('[data-apri]');
      if (apri) { APERTA.id = APERTA.id === apri.dataset.apri ? null : apri.dataset.apri; this.ridisegna(); return; }
      const dest = e.target.closest('[data-vai]');
      if (dest) { const [m, s] = dest.dataset.vai.split(':'); vai(m, s); }
    });
  }
};
