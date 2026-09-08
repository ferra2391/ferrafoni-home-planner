// Pezzi di interfaccia riusati da tutti i moduli.
// Ogni funzione restituisce una stringa HTML: i moduli compongono, non manipolano.

import { esc, gm, $ } from './util.js';

export const riq = (titolo, corpo, opzioni = {}) => `
  <section class="riq ${opzioni.classe || ''}" ${opzioni.colore ? `style="--c:${opzioni.colore}"` : ''}>
    ${titolo ? `<header><h3>${esc(titolo)}</h3>${opzioni.meta ? `<span class="meta">${esc(opzioni.meta)}</span>` : ''}</header>` : ''}
    <div class="dentro ${opzioni.raso ? 'raso' : ''}">${corpo}</div>
  </section>`;

export const riga = ({ titolo, sotto, destra, pill, urgente, dati = '' }) => `
  <li class="${urgente ? 'urgente' : ''}" ${dati}>
    ${pill || ''}
    <span class="tx"><strong>${esc(titolo)}</strong>${sotto ? `<span>${esc(sotto)}</span>` : ''}</span>
    ${destra ? `<span class="qd">${destra}</span>` : ''}
  </li>`;

export const pill = (testo, classe = 'neutra', colore) =>
  `<span class="pill ${classe}" ${colore ? `style="--c:${colore}"` : ''}>${esc(testo)}</span>`;

export const vuoto = testo => `<p class="vuoto">${esc(testo)}</p>`;

export function anello(percento, colore, misura = 62){
  const r = (misura - 8) / 2, c = 2 * Math.PI * r;
  return `<svg class="anello" width="${misura}" height="${misura}" viewBox="0 0 ${misura} ${misura}" style="--c:${colore}">
    <circle class="sfondo" cx="${misura/2}" cy="${misura/2}" r="${r}"></circle>
    <circle class="avanti" cx="${misura/2}" cy="${misura/2}" r="${r}"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - percento/100)}"></circle>
  </svg>`;
}

export const barra = (percento, colore) =>
  `<div class="barra" style="--c:${colore}"><i style="width:${Math.max(0, Math.min(100, percento))}%"></i></div>`;

export const tabella = (intestazioni, righe) => `
  <table class="tab"><thead><tr>${intestazioni.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
  <tbody>${righe.join('')}</tbody></table>`;

export const interruttore = (acceso, colore, dati = '') =>
  `<span class="sw ${acceso ? 'on' : ''}" style="--c:${colore}" ${dati}></span>`;

export const rigaCfg = (titolo, descrizione, controllo) => `
  <li><span class="tx"><strong>${esc(titolo)}</strong>${descrizione ? `<span>${esc(descrizione)}</span>` : ''}</span>${controllo}</li>`;

/* ---------- modale della data ---------- */
// Usata dalla checklist e dai cambi biancheria: pochi pulsanti, grandi.

let risolvi = null;

export function modaleData({ titolo, sottotitolo, persone = [], personaScelta, mostraTogli = true }){
  const velo = $('#velo');
  $('#foglio-titolo').textContent = titolo;
  $('#foglio-sotto').textContent = sottotitolo || '';

  const etichette = ['Oggi', 'Ieri', 'Due giorni fa', 'Tre giorni fa'];
  $('#foglio-scelte').innerHTML = etichette.map((et, i) => {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
    return `<button data-giorni="${-i}">${et}<small>${gm(d)}</small></button>`;
  }).join('');

  $('#foglio-persone').innerHTML = persone.length ? `
    <p class="occhiello" style="margin:0 0 9px">Chi l'ha fatta</p>
    <div class="segmenti" id="foglio-chi">
      ${persone.map(p => `<button data-persona="${p.id}" class="${p.id === personaScelta ? 'on' : ''}">${esc(p.nome)}</button>`).join('')}
    </div>` : '';

  $('#foglio-togli').style.display = mostraTogli ? '' : 'none';
  const oggiIso = new Date().toISOString().slice(0,10);
  $('#foglio-data').value = oggiIso;

  velo.classList.add('on');
  return new Promise(res => { risolvi = res; });
}

export function chiudiModale(risposta = null){
  $('#velo').classList.remove('on');
  if (risolvi) { risolvi(risposta); risolvi = null; }
}

export function agganciaModale(){
  const velo = $('#velo');
  const chi = () => $('#foglio-chi .on')?.dataset.persona || null;

  $('#foglio-scelte').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = new Date(); d.setHours(0,0,0,0);
    d.setDate(d.getDate() + parseInt(b.dataset.giorni, 10));
    chiudiModale({ azione: 'segna', data: d, persona: chi() });
  });

  $('#foglio-conferma').addEventListener('click', () => {
    const v = $('#foglio-data').value;
    if (v) chiudiModale({ azione: 'segna', data: new Date(v + 'T00:00:00'), persona: chi() });
  });

  $('#foglio-togli').addEventListener('click', () => chiudiModale({ azione: 'togli' }));
  $('#foglio-chiudi').addEventListener('click', () => chiudiModale(null));
  velo.addEventListener('click', e => { if (e.target === velo) chiudiModale(null); });

  document.addEventListener('click', e => {
    const b = e.target.closest('#foglio-chi button'); if (!b) return;
    $('#foglio-chi').querySelectorAll('button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') chiudiModale(null); });
}
