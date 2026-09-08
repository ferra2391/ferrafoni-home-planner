// Registro di casa: ogni spunta, cambio biancheria, aggiunta spesa e attività
// segnata come fatta lascia una riga qui, con chi e quando.

import { esc, plurale } from '../util.js';
import { riq, vuoto } from '../ui.js';
import { api } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--home)';
const TINTE = { pulizie:'var(--pulizie)', calendario:'var(--calendario)', spesa:'var(--spesa)', attivita:'var(--attivita)' };
const ETICHETTE = {
  fatto:'segnato come fatto', parziale:'segnato come parziale', aggiunto:'aggiunto',
  rimosso:'rimosso', 'cambio biancheria':'cambio registrato'
};

let filtro = null;

function quando(iso){
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z'));
  const ora = d.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' });
  const oggi = new Date().toDateString() === d.toDateString();
  return (oggi ? 'oggi' : d.toLocaleDateString('it-IT', { day:'numeric', month:'short' })) + ' alle ' + ora;
}

function righeLog(){
  const lista = S.registro(filtro);
  if (!lista.length) return vuoto('Ancora nessuna registrazione');
  return lista.map(r => `
    <div class="log-riga">
      <span class="log-punto" style="--c:${TINTE[r.modulo] || COLORE}"></span>
      <span class="tx"><strong>${esc(r.dettaglio || r.azione)}</strong>
        <span>${esc(ETICHETTE[r.azione] || r.azione)}${r.persona_nome ? ' · ' + esc(r.persona_nome) : ''}</span></span>
      <span class="qd">${quando(r.creato_il)}</span>
    </div>`).join('');
}

export default {
  id: 'registro',
  nome: 'Registro',
  emoji: '📋',
  colore: COLORE,
  sezioni: [{ id:'tutto', nome:'Tutte le registrazioni' }],
  distintivo(){ return { n: 0, caldo: false }; },

  render(){
    return `<div class="griglia g-lato">
      ${riq('Ultime registrazioni', righeLog(),
        { raso:true, classe:'tinta', colore: filtro ? TINTE[filtro] : COLORE,
          meta: plurale(S.registro(filtro).length, 'voce', 'voci') })}
      <div class="griglia" style="align-content:start">
        ${riq('Filtra per modulo', `
          <div class="etichette">
            <button class="et-i ${!filtro ? 'aggiungi' : ''}" data-filtro="">Tutti</button>
            <button class="et-i" data-filtro="pulizie">🧽 Pulizie</button>
            <button class="et-i" data-filtro="spesa">🛒 Spesa</button>
            <button class="et-i" data-filtro="attivita">🔔 Attività</button>
            <button class="et-i" data-filtro="calendario">📅 Calendario</button>
          </div>
          <p class="nota">Ogni volta che qualcuno spunta una voce, cambia la biancheria o aggiunge un articolo, resta scritto qui: cosa, chi e a che ora.</p>`)}
      </div>
    </div>`;
  },

  aggancia(root){
    root.addEventListener('click', async e => {
      const f = e.target.closest('[data-filtro]');
      if (!f) return;
      filtro = f.dataset.filtro || null;
      try {
        const r = await api.registro(filtro, 150);
        S.S.dati.registro = r.righe;
      } catch { /* resta con quello che ha già in memoria */ }
      this.ridisegna();
    });
  }
};
