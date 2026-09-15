// Avvio dell'applicazione: colonna dei moduli, schede della sezione,
// ridisegno quando lo stato cambia. Nessun modulo tocca il DOM degli altri.

import { $, $$, esc, GG, MM, OGGI, applicaMisuraTesto, misuraTesto } from './util.js';
import { agganciaModale, agganciaModaleForm } from './ui.js';
import { MODULI, modulo } from './moduli/indice.js';
import * as S from './stato.js';
import { rete } from './api.js';

const vista = { modulo: 'home', sezione: 'oggi' };
const agganciati = new Set();

/* ---------- colonna dei moduli ---------- */

function disegnaColonna(){
  $('#voci').innerHTML = MODULI.filter(m => !m.nascosto).map(m => {
    // Un modulo che sbaglia un conteggio non deve impedire il disegno di tutta la colonna.
    let d = { n: 0 };
    try { if (m.distintivo) d = m.distintivo(); } catch { d = { n: 0 }; }
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
  // La colonna e la testata si disegnano sempre, anche prima che i dati
  // arrivino: altrimenti, se il server tarda, resta tutto morto e non si
  // riesce nemmeno ad aprire le impostazioni per correggere la chiave.
  if (!S.S.dati) {
    disegnaColonna();
    $('#corpo').innerHTML = S.S.caricamento
      ? '<p class="vuoto">Carico i dati di casa…</p>'
      : `<section class="riq" style="max-width:560px;margin:0 auto">
           <header><h3>Non riesco a leggere i dati</h3></header>
           <div class="dentro">
             <p style="margin:0 0 14px">${esc(rete.motivo || 'collegamento non riuscito')}.</p>
             <button class="btn" id="riprova">Riprova</button>
           </div>
         </section>`;
    return;
  }

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
  // il contesto passato al modulo deve permettergli anche di ridisegnarsi:
  // serve a chi carica dati in un secondo momento, come il catalogo della spesa
  const contesto = { vai, ridisegna: disegna };

  // Sostituire il contenuto azzera lo scorrimento: lo si rimette dov'era,
  // altrimenti dopo ogni spunta la pagina salta in cima e si perde il segno.
  const scorri = $('#scorri');
  const posizione = scorri.scrollTop;

  corpo.innerHTML = opzioni.silenzioso
    ? m.render(vista.sezione, contesto)
    : `<div class="entra">${m.render(vista.sezione, contesto)}</div>`;

  if (posizione) {
    scorri.scrollTop = posizione;
    // Safari 12 a volte azzera lo scorrimento dopo aver ricalcolato le altezze:
    // lo si rimette anche al fotogramma successivo.
    requestAnimationFrame(() => { if (scorri.scrollTop !== posizione) scorri.scrollTop = posizione; });
  }

  // Ogni modulo si aggancia una sola volta, con delega sul contenitore.
  // Il contenitore pero' e' lo stesso per tutti: senza filtro, il gestore
  // delle pulizie risponderebbe anche ai pulsanti della spesa, e viceversa.
  // Era la causa dei pulsanti che a volte non facevano niente.
  if (!agganciati.has(m.id) && m.aggancia) {
    m.aggancia(radicePerModulo(m.id), { vai, ridisegna: disegna });
    m.ridisegna = disegna;
    agganciati.add(m.id);
  }
}

// Piccolo involucro attorno al contenitore: consegna gli eventi a un modulo
// soltanto quando e' quello davvero a schermo.
function radicePerModulo(idModulo){
  const corpo = $('#corpo');
  return {
    addEventListener(tipo, gestore, opzioni){
      corpo.addEventListener(tipo, e => {
        if (vista.modulo !== idModulo) return;
        gestore(e);
      }, opzioni);
    },
    querySelector: sel => corpo.querySelector(sel),
    querySelectorAll: sel => corpo.querySelectorAll(sel)
  };
}

export function vai(idModulo, idSezione){
  vista.modulo = idModulo;
  vista.sezione = idSezione || modulo(idModulo).sezioni[0].id;
  if (STRETTO()) menu(false);
  disegna();
  $('#scorri').scrollTop = 0;
}

/* ---------- eventi generali ---------- */

// Su schermi stretti (iPad in orizzontale) il menu parte chiuso: la colonna
// da 250px si mangerebbe un quarto della larghezza utile.
const STRETTO = () => window.innerWidth <= 1240;

function menu(apri){
  const app = document.getElementById('app');
  app.classList.toggle('menu-chiuso', !apri);
}

function agganciaGuscio(){
  menu(!STRETTO());
  window.addEventListener('resize', () => { if (!STRETTO()) menu(true); });

  document.getElementById('apri-menu').addEventListener('click', () => {
    const app = document.getElementById('app');
    menu(app.classList.contains('menu-chiuso'));
  });
  $('#voci').addEventListener('click', e => {
    const b = e.target.closest('[data-modulo]');
    if (b) vai(b.dataset.modulo);
  });

  $('#schede').addEventListener('click', e => {
    const b = e.target.closest('[data-sezione]');
    if (b) vai(vista.modulo, b.dataset.sezione);
  });

  $('#vai-generali').addEventListener('click', () => vai('generali'));

  document.addEventListener('click', e => {
    if (e.target.closest('#riprova')) S.carica(S.S.settimana);
  });

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

// Safari 12 (iPad su iOS 12) non conosce gap dentro i flex: senza questa prova
// gli elementi finirebbero appiccicati. Se manca, il foglio di stile applica
// dei margini al posto suo.
function verificaFlexGap(){
  const prova = document.createElement('div');
  prova.style.display = 'flex';
  prova.style.flexDirection = 'column';
  prova.style.rowGap = '1px';
  prova.style.position = 'absolute';
  prova.style.visibility = 'hidden';
  prova.appendChild(document.createElement('div'));
  prova.appendChild(document.createElement('div'));
  document.body.appendChild(prova);
  const supportato = prova.scrollHeight === 1;
  prova.parentNode.removeChild(prova);
  if (!supportato) document.body.classList.add('senza-gap');
}

async function avvia(){
  verificaFlexGap();
  applicaMisuraTesto(misuraTesto());
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
