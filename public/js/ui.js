// Pezzi di interfaccia riusati da tutti i moduli.
// Ogni funzione restituisce una stringa HTML: i moduli compongono, non manipolano.

import { esc, gm, $, $$ } from './util.js';

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

/* ---------- modulo generico di modifica ---------- */
// Un solo modale per creare o modificare qualunque record: persone, categorie,
// voci di checklist, biancheria, attività, eventi, articoli ricorrenti.
// I campi sono descritti da uno schema, non c'è un modale diverso per ognuno.

let risolviForm = null;

function campoHtml(c, valori){
  const v = valori[c.nome] ?? c.difetto ?? '';
  if (c.tipo === 'select') {
    return `<select data-campo="${c.nome}" ${c.richiesto ? 'required' : ''}>
      ${c.opzioni.map(o => `<option value="${o.id}" ${String(o.id) === String(v) ? 'selected' : ''}>${esc(o.nome)}</option>`).join('')}
    </select>`;
  }
  if (c.tipo === 'testolungo') {
    return `<textarea data-campo="${c.nome}" rows="3" placeholder="${esc(c.placeholder||'')}">${esc(v)}</textarea>`;
  }
  if (c.tipo === 'ora')    return `<input type="time" data-campo="${c.nome}" value="${esc(v)}">`;
  if (c.tipo === 'numero') return `<input type="number" data-campo="${c.nome}" value="${esc(v)}" min="${c.min ?? ''}" step="${c.step || 1}">`;
  if (c.tipo === 'data')   return `<input type="date" data-campo="${c.nome}" value="${esc(v)}">`;
  return `<input type="text" data-campo="${c.nome}" value="${esc(v)}" placeholder="${esc(c.placeholder||'')}">`;
}

export function modaleForm({ titolo, sottotitolo, campi, valori = {}, colore = 'var(--home)', permettiElimina = false }){
  const velo = $('#velo2');
  $('#foglio2-titolo').textContent = titolo;
  $('#foglio2-sotto').textContent = sottotitolo || '';
  $('#foglio2-campi').innerHTML = campi.map(c => `
    <div class="campo-riga">
      <label>${esc(c.etichetta)}${c.richiesto ? ' *' : ''}</label>
      ${campoHtml(c, valori)}
    </div>`).join('');
  $('#foglio2-conferma').style.background = colore;
  $('#foglio2-elimina').style.display = permettiElimina ? '' : 'none';
  velo.classList.add('on');
  return new Promise(res => { risolviForm = res; });
}

export function chiudiModaleForm(risultato = null){
  $('#velo2').classList.remove('on');
  if (risolviForm) { risolviForm(risultato); risolviForm = null; }
}

function leggiForm(){
  const dati = {};
  $$('#foglio2-campi [data-campo]').forEach(el => { dati[el.dataset.campo] = el.value; });
  return dati;
}

export function agganciaModaleForm(){
  $('#foglio2-conferma').addEventListener('click', () => chiudiModaleForm({ azione: 'salva', valori: leggiForm() }));
  $('#foglio2-elimina').addEventListener('click', () => chiudiModaleForm({ azione: 'elimina' }));
  $('#foglio2-annulla').addEventListener('click', () => chiudiModaleForm(null));
  $('#velo2').addEventListener('click', e => { if (e.target.id === 'velo2') chiudiModaleForm(null); });
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
