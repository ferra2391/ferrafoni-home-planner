// Modulo lista della spesa. Il reparto non lo sceglie chi aggiunge: lo assegna
// il catalogo sul server, cosi funziona uguale da iPad e da iPhone.

import { esc, plurale, avviso } from '../util.js';
import { riq, rigaCfg, vuoto, modaleForm } from '../ui.js';
import { api, prova, chiave, salvaChiave, rete } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--spesa)';

// Catalogo e articoli piu comprati: si caricano una volta sola e restano in memoria.
let catalogo = null;
let frequenti = null;
let suggeriti = [];
let scritto = '';

async function caricaExtra(ridisegna){
  if (catalogo === null) {
    catalogo = [];
    try { catalogo = (await api.catalogo()).prodotti || []; } catch { catalogo = []; }
  }
  if (frequenti === null) {
    frequenti = [];
    try { frequenti = (await api.frequenti()).frequenti || []; } catch { frequenti = []; }
    if (ridisegna) ridisegna();
  }
}

// Confronto senza accenti ne maiuscole, come fa il server.
const normalizza = t => String(t || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function cerca(testo){
  const k = normalizza(testo);
  if (k.length < 2) return [];
  const inizia = [], dentro = [];
  for (const p of catalogo || []) {
    const n = p.nome_cerca || normalizza(p.nome);
    if (n.indexOf(k) === 0) inizia.push(p);
    else if (n.indexOf(k) > 0) dentro.push(p);
    if (inizia.length >= 6) break;
  }
  return inizia.concat(dentro).slice(0, 6);
}

/* ---------- vista principale ---------- */

const articolo = a => `
  <div class="art ${a.stato === 'preso' ? 'preso' : ''}">
    <button class="spunta ${a.stato === 'preso' ? 'on' : ''}" data-preso="${a.id}"></button>
    <span class="tx"><strong>${esc(a.nome)}</strong>
      <span>${esc(a.origine === 'iphone' ? "aggiunto dall'iPhone" :
                   a.origine === 'ricorrente' ? 'articolo ricorrente' :
                   a.origine === 'scorta' ? 'scorta bassa' : S.nomePersona(a.persona_id))}</span></span>
    <span class="qd">${esc(a.quantita || '')}</span>
    <div class="riga-azioni"><button data-mod-art="${a.id}">Modifica</button></div>
  </div>`;

function vistaLista(){
  const cats = S.categorie('spesa');
  const tutti = S.S.dati.spesa.articoli;
  const daPrendere = tutti.filter(a => a.stato === 'da_prendere');
  const senza = tutti.filter(a => !a.categoria_id);

  const gruppi = cats.map(c => {
    const art = tutti.filter(a => a.categoria_id === c.id);
    if (!art.length) return '';
    return `
      <div class="gruppo aperto">
        <button class="capo" data-gruppo="sp_${c.id}">
          <span class="emj">${c.icona}</span><b>${esc(c.nome)}</b>
          <span class="avanz">${art.filter(a => a.stato === 'da_prendere').length} da prendere</span>
          <span class="freccia"></span></button>
        <div class="elenco"><div>${art.map(articolo).join('')}</div></div>
      </div>`;
  }).join('');

  const daSmistare = senza.length ? `
    <div class="gruppo aperto">
      <button class="capo" data-gruppo="sp_altro">
        <span class="emj">&#128230;</span><b>Da smistare</b>
        <span class="avanz">${senza.length} senza reparto</span>
        <span class="freccia"></span></button>
      <div class="elenco"><div>${senza.map(a => `
        <div class="art">
          <button class="spunta ${a.stato === 'preso' ? 'on' : ''}" data-preso="${a.id}"></button>
          <span class="tx"><strong>${esc(a.nome)}</strong><span>reparto da assegnare</span></span>
          <span class="qd">${esc(a.quantita || '')}</span>
          <div class="riga-azioni"><button data-smista="${a.id}">Dai un reparto</button></div>
        </div>`).join('')}</div></div>
    </div>` : '';

  return `<div class="griglia g-lato">
    ${riq('Lista corrente', (gruppi + daSmistare) || vuoto('La lista e vuota'),
      { raso: true, classe: 'tinta', colore: COLORE,
        meta: plurale(daPrendere.length, 'articolo da prendere', 'articoli da prendere') })}

    <div class="griglia" style="align-content:start">
      ${riq('Aggiungi alla lista', `
        <div style="display:flex;gap:9px">
          <input type="text" id="nuovo-articolo" placeholder="Che cosa serve?"
                 autocomplete="off" value="${esc(scritto)}" style="flex:1;min-width:0">
          <button class="btn" style="background:var(--spesa)" data-aggiungi>Aggiungi</button>
        </div>
        <div id="suggerimenti">${listaSuggerimenti()}</div>
        <p class="nota">Il reparto lo assegna il catalogo da solo, anche a quello che detti dall'iPhone.
        Se non lo conosce, l'articolo finisce in "Da smistare".</p>`)}

      ${riq('Comprati spesso', frequenti === null
        ? '<p class="vuoto">Carico…</p>'
        : (frequenti.length
            ? `<div class="etichette">${frequenti.map(f =>
                `<button class="et-i" data-veloce="${esc(f.nome)}">${esc(f.nome)}
                   <span style="color:var(--tenue);font-size:.78rem">${f.volte}</span></button>`).join('')}</div>`
            : vuoto('Ancora pochi dati: comparira coi primi acquisti')),
        { meta: frequenti && frequenti.length ? 'i piu aggiunti in casa' : '' })}
    </div>
  </div>`;
}

function listaSuggerimenti(){
  if (!suggeriti.length) return '';
  return `<p class="occhiello" style="margin:14px 0 8px">Suggerimenti</p>
    <div class="etichette">${suggeriti.map(p => {
      const c = S.categoria(p.categoria_id);
      return `<button class="et-i" data-suggerito="${esc(p.nome)}">${esc(p.nome)}
        <span style="color:var(--tenue);font-size:.78rem">${esc(c ? c.nome : '')}</span></button>`;
    }).join('')}</div>`;
}

/* ---------- comando iPhone ---------- */

function vistaIphone(){
  const url = location.origin + '/api/shortcut';
  return `<div class="griglia g-lato-l">
    ${riq('Il percorso del comando', `
      <ol style="list-style:none;margin:0;padding:0">
        ${[["Tocchi l'icona sulla schermata home", 'Nessuna app da aprire, nessun accesso da fare.'],
           ['Il comando chiede: vedere o aggiungere', 'Due voci sole, si sceglie con un pollice.'],
           ['Detti che cosa serve', 'Anche piu articoli separati dalla virgola.'],
           ['Il reparto lo mette il server', "Il catalogo lo riconosce e lo mette al posto giusto."]]
          .map(([t, s], i) => `
          <li style="display:flex;gap:15px;padding-bottom:20px">
            <span style="width:30px;height:30px;border-radius:50%;background:var(--spesa);color:#fff;
              display:flex;align-items:center;justify-content:center;font-weight:700;flex:none">${i+1}</span>
            <span><b style="display:block">${esc(t)}</b>
            <span style="color:var(--tenue);font-size:.87rem">${esc(s)}</span></span></li>`).join('')}
      </ol>
      <p class="nota">Indirizzo da usare nel comando: <code>${esc(url)}</code></p>`,
      { classe: 'tinta', colore: COLORE })}

    <div class="griglia" style="align-content:start">
      ${riq("Come appare sull'iPhone", `
        <div class="telefono">
          <div class="sbarra"><span>21:05</span><span>Comandi</span></div>
          <p class="dom">Spesa di casa<br>Che cosa vuoi fare?</p>
          <div class="sc">&#128064; Vedi la lista</div>
          <div class="sc pri">&#10133; Aggiungi qualcosa</div>
        </div>`)}
      ${riq('Collegamento', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Stato', rete.collegata ? 'L app sta leggendo dal database.' : 'Al momento usa i dati locali.',
          `<span class="pill ${rete.collegata ? 'verde' : 'ambra'}">${rete.collegata ? 'Collegata' : 'Non collegata'}</span>`)}
        ${rigaCfg('Chiave di casa', 'La stessa che metti nel comando rapido.',
          `<input type="password" id="campo-chiave" value="${esc(chiave())}" style="min-width:180px">`)}
        ${rigaCfg('', '', `<button class="btn piccolo" style="background:var(--spesa)" data-salva-chiave>Salva e riprova</button>`)}
      </ul>`)}
      ${riq('Catalogo prodotti', `
        <p style="margin:0 0 10px;font-size:.92rem">${(catalogo || []).length} prodotti riconosciuti in automatico.</p>
        <p class="nota" style="margin:0">Quando dai un reparto a un articolo finito in "Da smistare",
        il catalogo lo impara: la volta dopo lo riconosce anche dall'iPhone.</p>`)}
    </div>
  </div>`;
}

/* ---------- modulo ---------- */

export default {
  id: 'spesa',
  nome: 'Lista della spesa',
  emoji: '\u{1F6D2}',
  colore: COLORE,
  sezioni: [
    { id: 'lista', nome: 'Lista' },
    { id: 'iphone', nome: 'Comando iPhone' }
  ],

  distintivo(){ return { n: S.spesaDaPrendere().length, caldo: false }; },

  render(sezione, contesto){
    caricaExtra(contesto && contesto.ridisegna);
    return sezione === 'iphone' ? vistaIphone() : vistaLista();
  },

  aggancia(root, contesto){
    const aggiungi = async (nome, categoriaId) => {
      const n = (nome || '').trim();
      if (!n) return;
      S.aggiungiArticoloLocale(n, '', categoriaId || null);
      S.aggiungiRegistroLocale('spesa', 'aggiunto', n, null);
      scritto = ''; suggeriti = [];
      await prova(api.aggiungiSpesa({ nome: n, categoria_id: categoriaId || undefined, origine: 'tablet' }));
      avviso(n + ' aggiunto alla lista');
      // rilegge dal server, cosi si vede il reparto assegnato dal catalogo
      S.carica(S.S.settimana, { silenzioso: true });
    };

    root.addEventListener('click', async e => {
      const g = e.target.closest('[data-gruppo]');
      if (g) { g.closest('.gruppo').classList.toggle('aperto'); return; }

      const p = e.target.closest('[data-preso]');
      if (p) {
        const id = p.dataset.preso;
        const a = S.S.dati.spesa.articoli.find(x => String(x.id) === id);
        const nuovo = a.stato === 'preso' ? 'da_prendere' : 'preso';
        S.applicaSpesa(a.id, { stato: nuovo });
        prova(api.modificaSpesa(id, { stato: nuovo }));
        return;
      }

      if (e.target.closest('[data-aggiungi]')) {
        const campo = root.querySelector('#nuovo-articolo');
        await aggiungi(campo.value);
        return;
      }

      const sug = e.target.closest('[data-suggerito]');
      if (sug) {
        const nome = sug.dataset.suggerito;
        const p = (catalogo || []).find(x => x.nome === nome);
        await aggiungi(nome, p && p.categoria_id);
        return;
      }

      const v = e.target.closest('[data-veloce]');
      if (v) { await aggiungi(v.dataset.veloce); return; }

      // modifica di un articolo gia in lista
      const mod = e.target.closest('[data-mod-art]');
      if (mod) {
        const a = S.S.dati.spesa.articoli.find(x => String(x.id) === mod.dataset.modArt);
        const r = await modaleForm({
          titolo: a.nome, colore: COLORE, permettiElimina: true,
          valori: { nome: a.nome, quantita: a.quantita || '', categoria_id: a.categoria_id || '' },
          campi: [
            { nome:'nome', etichetta:'Che cosa', richiesto:true },
            { nome:'quantita', etichetta:'Quantita', placeholder:'Es. 2 confezioni' },
            { nome:'categoria_id', etichetta:'Reparto', tipo:'select',
              opzioni: [{ id:'', nome:'Da smistare' }, ...S.categorie('spesa').map(c => ({ id:c.id, nome:c.nome }))] }
          ]
        });
        if (!r) return;
        if (r.azione === 'elimina') {
          S.S.dati.spesa.articoli = S.S.dati.spesa.articoli.filter(x => String(x.id) !== String(a.id));
          S.avvisa();
          await prova(api.rimuoviSpesa(a.id));
          avviso('Articolo tolto');
        } else {
          S.applicaSpesa(a.id, r.valori);
          await prova(api.modificaSpesa(a.id, r.valori));
          avviso('Articolo aggiornato');
        }
        return;
      }

      // assegna il reparto e lo insegna al catalogo
      const sm = e.target.closest('[data-smista]');
      if (sm) {
        const a = S.S.dati.spesa.articoli.find(x => String(x.id) === sm.dataset.smista);
        const r = await modaleForm({
          titolo: a.nome, colore: COLORE,
          sottotitolo: 'Il catalogo se lo ricorda: la prossima volta lo riconoscera da solo.',
          valori: { categoria_id: S.categorie('spesa')[0].id },
          campi: [{ nome:'categoria_id', etichetta:'In che reparto sta', tipo:'select',
                    opzioni: S.categorie('spesa').map(c => ({ id:c.id, nome:c.nome })) }]
        });
        if (r?.azione !== 'salva') return;
        S.applicaSpesa(a.id, { categoria_id: r.valori.categoria_id });
        await prova(api.modificaSpesa(a.id, { categoria_id: r.valori.categoria_id }));
        await prova(api.imparaProdotto({ nome: a.nome, categoria_id: r.valori.categoria_id }));
        if (catalogo) catalogo.push({ nome: a.nome, nome_cerca: normalizza(a.nome), categoria_id: r.valori.categoria_id });
        avviso('Reparto assegnato, e imparato per la prossima volta');
        return;
      }

      if (e.target.closest('[data-salva-chiave]')) {
        salvaChiave(root.querySelector('#campo-chiave').value.trim());
        avviso('Chiave salvata, ricarico i dati');
        S.carica();
      }
    });

    // suggerimenti mentre si scrive
    root.addEventListener('input', e => {
      if (e.target.id !== 'nuovo-articolo') return;
      scritto = e.target.value;
      const nuovi = cerca(scritto);
      const cambiati = nuovi.length !== suggeriti.length ||
        nuovi.some((p, i) => p.nome !== suggeriti[i].nome);
      if (!cambiati) return;
      suggeriti = nuovi;
      const box = root.querySelector('#suggerimenti');
      if (box) box.innerHTML = listaSuggerimenti();
    });

    root.addEventListener('keydown', async e => {
      if (e.key === 'Enter' && e.target.id === 'nuovo-articolo') {
        e.preventDefault();
        await aggiungi(e.target.value);
      }
    });
  }
};
