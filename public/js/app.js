// Avvio dell'applicazione: colonna dei moduli, schede della sezione,
// ridisegno quando lo stato cambia. Nessun modulo tocca il DOM degli altri.

import { $, $$, esc, GG, MM, OGGI } from './util.js';
import { agganciaModale, agganciaModaleForm } from './ui.js';
import { MODULI, modulo } from './moduli/indice.js';
import * as S from './stato.js';
import { rete } from './api.js';

const vista = { modulo: 'home', sezione: 'oggi' };
const agganciati = new Set();

/* ---------- colonna dei moduli ---------- */

function disegnaColonna(){
  $('#voci').innerHTML = MODULI.filter(m => !m.nascosto).map(m => {
    const d = m.distintivo ? m.distintivo() : { n: 0 };
    return `<li><button class="voce ${vista.modulo === m.id ? 'on' : ''}" style="--c:${m.colore}" data-modulo="${m.id}">
      <span class="emj">${m.emoji}</span><span class="nm">${esc(m.nome)}</span>
      ${d.n ? `<span class="bdg ${d.caldo ? 'caldo' : ''}">${d.n}</span>` : ''}
    </button></li>`;
  }).join('');

  $('#stato-rete').innerHTML =
    `<span class="punto" style="background:${rete.collegata ? '#5FBF9E' : '#C58312'}"></span>
     ${rete.collegata ? 'collegata al database' : 'dati locali'}`;
}

/* ---------- testata e schede ---------- */

function disegnaTestata(){
  const m = modulo(vista.modulo);
  const sez = m.sezioni.find(s => s.id === vista.sezione) || m.sezioni[0];

  $('#occhiello').textContent = m.id === 'home' ? 'Panoramica' : m.nome;
  $('#titolo').textContent = sez.nome === m.nome ? m.nome : sez.nome;
  document.documentElement.style.setProperty('--accento', m.colore);

  $('#schede').innerHTML = m.sezioni.length > 1
    ? m.sezioni.map(s => `<button class="${s.id === vista.sezione ? 'on' : ''}"
        style="--c:${m.colore}" data-sezione="${s.id}">${esc(s.nome)}</button>`).join('')
    : '';

  $('#facce').innerHTML = (S.S.dati?.persone || []).filter(p => p.ruolo !== 'collaboratrice')
    .map(p => `<span class="faccia" style="background:${p.colore}">${esc(p.iniziali)}</span>`).join('');

  $('#data-oggi').innerHTML = `${GG[OGGI.getDay()]}<b>${OGGI.getDate()} ${MM[OGGI.getMonth()]}</b>`;
}

/* ---------- corpo ---------- */

function disegna(_stato, opzioni = {}){
  if (!S.S.dati) return;
  const m = modulo(vista.modulo);
  if (!m.sezioni.some(s => s.id === vista.sezione)) vista.sezione = m.sezioni[0].id;

  // Se c'e un modale aperto non tocco la pagina sotto: il campo che si sta
  // compilando verrebbe azzerato a meta.
  if (opzioni.silenzioso && document.querySelector('.velo.on')) return;

  disegnaColonna();
  disegnaTestata();

  const corpo = $('#corpo');
  // L'animazione di entrata solo quando si cambia schermata a mano,
  // mai sulle ricariche di sfondo: e quella che faceva sfarfallare la pagina.
  corpo.innerHTML = opzioni.silenzioso
    ? m.render(vista.sezione, { vai })
    : `<div class="entra">${m.render(vista.sezione, { vai })}</div>`;

  // Ogni modulo si aggancia una sola volta, con delega sul contenitore.
  if (!agganciati.has(m.id) && m.aggancia) {
    m.aggancia(corpo, { vai, ridisegna: disegna });
    m.ridisegna = disegna;
    agganciati.add(m.id);
  }
}

export function vai(idModulo, idSezione){
  vista.modulo = idModulo;
  vista.sezione = idSezione || modulo(idModulo).sezioni[0].id;
  $('#scorri').scrollTop = 0;
  disegna();
}

/* ---------- eventi generali ---------- */

function agganciaGuscio(){
  $('#voci').addEventListener('click', e => {
    const b = e.target.closest('[data-modulo]');
    if (b) vai(b.dataset.modulo);
  });

  $('#schede').addEventListener('click', e => {
    const b = e.target.closest('[data-sezione]');
    if (b) vai(vista.modulo, b.dataset.sezione);
  });

  $('#vai-generali').addEventListener('click', () => vai('generali'));

  // Gli interruttori delle impostazioni sono dimostrativi finché
  // non vengono collegati alla tabella impostazioni.
  document.addEventListener('click', e => {
    const sw = e.target.closest('.sw');
    if (sw) sw.classList.toggle('on');
    const sg = e.target.closest('.segmenti button');
    if (sg && !sg.closest('#foglio-chi')) {
      sg.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      sg.classList.add('on');
    }
  });
}

/* ---------- avvio ---------- */

async function avvia(){
  if (localStorage.getItem('ferrafoni.testoGrande') === '1') document.body.classList.add('testo-grande');
  agganciaGuscio();
  agganciaModale();
  agganciaModaleForm();
  S.iscriviti(disegna);
  await S.carica();

  // Ricontrollo periodico: fa comparire sull'iPad ciò che arriva dall'iPhone.
  // Ricarica di sfondo: ferma se la scheda non e in primo piano, se c'e un
  // modale aperto o se una scrittura non ha ancora avuto risposta.
  const puoRicaricare = () =>
    rete.collegata && !document.hidden &&
    S.scritture.aperte === 0 &&
    !document.querySelector('.velo.on');

  setInterval(() => { if (puoRicaricare()) S.carica(S.S.settimana, { silenzioso: true }); }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && puoRicaricare()) S.carica(S.S.settimana, { silenzioso: true });
  });
}

avvia();
