// Modulo lista della spesa: righe raggruppate per reparto, comando rapido iPhone
// e impostazioni. La spunta è grande, si usa camminando tra gli scaffali.

import { esc, plurale, avviso } from '../util.js';
import { riq, rigaCfg, interruttore, vuoto } from '../ui.js';
import { api, prova, chiave, salvaChiave, rete } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--spesa)';

function vistaLista(){
  const cats = S.categorie('spesa');
  const tutti = S.S.dati.spesa.articoli;
  const daPrendere = tutti.filter(a => a.stato === 'da_prendere');

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

  const senza = tutti.filter(a => !a.categoria_id);

  return `<div class="griglia g-lato">
    ${riq('Lista corrente', gruppi + (senza.length
        ? `<div class="gruppo aperto"><button class="capo" data-gruppo="sp_altro">
             <span class="emj">📦</span><b>Da smistare</b>
             <span class="avanz">${senza.length}</span><span class="freccia"></span></button>
           <div class="elenco"><div>${senza.map(articolo).join('')}</div></div></div>`
        : '') || vuoto('La lista è vuota'),
      { raso: true, classe: 'tinta', colore: COLORE,
        meta: plurale(daPrendere.length, 'articolo da prendere', 'articoli da prendere') })}

    <div class="griglia" style="align-content:start">
      ${riq('Aggiungi alla lista', `
        <div style="display:flex;gap:9px">
          <input type="text" id="nuovo-articolo" placeholder="Che cosa serve?" style="flex:1;min-width:0">
          <button class="btn" style="background:var(--spesa)" data-aggiungi>Aggiungi</button>
        </div>
        <p class="occhiello" style="margin:18px 0 10px">Comprati spesso</p>
        <div class="etichette">
          ${['Latte','Pane','Uova','Pannolini','Yogurt bambine','Strofinacci'].map(n =>
            `<button class="et-i" data-veloce="${esc(n)}">${esc(n)}</button>`).join('')}
        </div>`)}
      ${riq('Dall\'iPhone', `<ul class="righe" style="margin:-16px -18px">
        ${tutti.filter(a => a.origine === 'iphone').map(a =>
          `<li><span class="tx"><strong>${esc(a.nome)}</strong><span>${esc(S.nomePersona(a.persona_id))}</span></span></li>`).join('')
          || `<li><span class="tx"><span>Niente di nuovo dal telefono</span></span></li>`}
      </ul>`)}
    </div>
  </div>`;
}

const articolo = a => `
  <div class="art ${a.stato === 'preso' ? 'preso' : ''}">
    <button class="spunta ${a.stato === 'preso' ? 'on' : ''}" data-preso="${a.id}"></button>
    <span class="tx"><strong>${esc(a.nome)}</strong>
      <span>${esc(a.origine === 'iphone' ? 'aggiunto dall\'iPhone' :
                   a.origine === 'ricorrente' ? 'articolo ricorrente' :
                   a.origine === 'scorta' ? 'scorta bassa' : S.nomePersona(a.persona_id))}</span></span>
    <span class="qd">${esc(a.quantita || '')}</span>
  </div>`;

function vistaIphone(){
  const url = location.origin + '/api/shortcut';
  return `<div class="griglia g-lato">
    ${riq('Il percorso del comando', `
      <ol style="list-style:none;margin:0;padding:0">
        ${[['Tocchi l\'icona sulla schermata home','Nessuna app da aprire, nessun accesso da fare.'],
           ['Il comando chiede: vedere o aggiungere','Due voci sole, si sceglie con un pollice.'],
           ['Detti o scrivi che cosa serve','Anche più articoli separati dalla virgola.'],
           ['La lista di casa si aggiorna','L\'iPad mostra il nuovo articolo entro pochi secondi.']]
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
      ${riq('Come appare sull\'iPhone', `
        <div class="telefono">
          <div class="sbarra"><span>21:05</span><span>Comandi</span></div>
          <p class="dom">Spesa di casa<br>Che cosa vuoi fare?</p>
          <div class="sc">👀 Vedi la lista</div>
          <div class="sc pri">➕ Aggiungi qualcosa</div>
        </div>`)}
      ${riq('Collegamento', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Stato', rete.collegata ? 'L\'app sta leggendo dal database.' : 'Al momento sta usando i dati locali.',
          `<span class="pill ${rete.collegata ? 'verde' : 'ambra'}">${rete.collegata ? 'Collegata' : 'Non collegata'}</span>`)}
        ${rigaCfg('Chiave di casa', 'La stessa che metti nel comando rapido.',
          `<input type="password" id="campo-chiave" value="${esc(chiave())}" style="min-width:180px">`)}
        ${rigaCfg('', '', `<button class="btn piccolo" style="background:var(--spesa)" data-salva-chiave>Salva e riprova</button>`)}
      </ul>`)}
    </div>
  </div>`;
}

function vistaImpostazioni(){
  return `<div class="griglia g-lato">
    <div class="griglia" style="align-content:start">
      ${riq('Reparti', `<div class="etichette">
        ${S.categorie('spesa').map(c => `<span class="et-i">${c.icona} ${esc(c.nome)}</span>`).join('')}
        <span class="et-i aggiungi">Aggiungi reparto</span></div>
        <p class="nota">L'ordine dei reparti segue il percorso che fai in negozio: la lista si riordina da sola.</p>`,
        { classe: 'tinta', colore: COLORE })}
      ${riq('Articoli ricorrenti', `<ul class="cfg" style="margin:-16px -18px">
        ${[['Detersivo lavatrice','Torna in lista ogni 4 settimane.'],
           ['Pannolini taglia 5','Torna in lista ogni 2 settimane.'],
           ['Sacchi umido','Torna in lista ogni mese.'],
           ['Caffè macinato','Torna in lista ogni 2 settimane.']]
          .map(([t, s]) => rigaCfg(t, s, interruttore(true, COLORE))).join('')}
      </ul>`)}
    </div>
    <div class="griglia" style="align-content:start">
      ${riq('Come si comporta la lista', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Articoli presi', '', `<select><option selected>Restano in fondo</option><option>Spariscono subito</option></select>`)}
        ${rigaCfg('Svuota dopo la spesa', 'La lista si azzera quando segni la spesa come conclusa.', interruttore(true, COLORE))}
        ${rigaCfg('Unisci i doppioni', 'Se in due aggiungete la stessa cosa resta una riga sola.', interruttore(true, COLORE))}
        ${rigaCfg('Scorte basse in lista', 'Gli articoli sotto soglia entrano da soli.', interruttore(true, COLORE))}
        ${rigaCfg('Ricontrolla la lista ogni', '', `<select><option>15 secondi</option><option selected>30 secondi</option><option>1 minuto</option></select>`)}
      </ul>`)}
      ${riq('Chi può modificare', `<ul class="cfg" style="margin:-16px -18px">
        ${S.S.dati.persone.filter(p => p.ruolo !== 'bambina').map(p =>
          rigaCfg(p.nome, p.ruolo === 'collaboratrice' ? 'Solo aggiunta' : 'Aggiunge e conclude la spesa',
                  interruttore(true, COLORE))).join('')}
      </ul>`)}
    </div>
  </div>`;
}

export default {
  id: 'spesa',
  nome: 'Lista della spesa',
  emoji: '🛒',
  colore: COLORE,
  sezioni: [
    { id: 'lista', nome: 'Lista' },
    { id: 'iphone', nome: 'Comando iPhone' },
    { id: 'impostazioni', nome: 'Impostazioni' }
  ],

  distintivo(){ return { n: S.spesaDaPrendere().length, caldo: false }; },

  render(sezione){
    if (sezione === 'iphone') return vistaIphone();
    if (sezione === 'impostazioni') return vistaImpostazioni();
    return vistaLista();
  },

  aggancia(root){
    const aggiungi = nome => {
      if (!nome || !nome.trim()) return;
      S.aggiungiArticoloLocale(nome.trim(), '', null);
      prova(api.aggiungiSpesa({ nome: nome.trim(), origine: 'tablet' }));
      avviso(nome.trim() + ' aggiunto alla lista');
    };

    root.addEventListener('click', e => {
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
        aggiungi(campo.value); campo.value = '';
        return;
      }

      const v = e.target.closest('[data-veloce]');
      if (v) { aggiungi(v.dataset.veloce); return; }

      if (e.target.closest('[data-salva-chiave]')) {
        salvaChiave(root.querySelector('#campo-chiave').value.trim());
        avviso('Chiave salvata, ricarico i dati');
        S.carica();
      }
    });

    root.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.id === 'nuovo-articolo') {
        aggiungi(e.target.value); e.target.value = '';
      }
    });
  }
};
