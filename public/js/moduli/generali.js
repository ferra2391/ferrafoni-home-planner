// Impostazioni della casa: persone, dispositivo, dati e aspetto.

import { esc } from '../util.js';
import { riq, rigaCfg, interruttore } from '../ui.js';
import { chiave, salvaChiave, rete } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--home)';

export default {
  id: 'generali',
  nome: 'Casa e famiglia',
  emoji: '⚙️',
  colore: COLORE,
  nascosto: true,
  sezioni: [{ id:'casa', nome:'Casa e famiglia' }],
  distintivo(){ return { n: 0, caldo: false }; },

  render(){
    return `<div class="griglia g-lato">
      <div class="griglia" style="align-content:start">
        ${riq('Chi vive in casa', `<ul class="cfg" style="margin:-16px -18px">
          ${S.S.dati.persone.map(p => rigaCfg(p.nome,
            p.ruolo === 'collaboratrice' ? 'Vede solo checklist pulizie e ore lavorate' :
            p.ruolo === 'bambina' ? 'Compare nelle attività, non accede all\'app' : 'Accesso completo',
            `<select><option ${p.ruolo==='adulto'?'selected':''}>Adulto</option>
             <option ${p.ruolo==='bambina'?'selected':''}>Bambina</option>
             <option ${p.ruolo==='collaboratrice'?'selected':''}>Chi pulisce</option></select>`)).join('')}
        </ul>`, { classe:'tinta', colore:COLORE })}
        ${riq('Dispositivo di casa', `<ul class="cfg" style="margin:-16px -18px">
          ${rigaCfg('Schermo sempre acceso','L\'iPad resta sulla home quando è in carica.', interruttore(true, COLORE))}
          ${rigaCfg('Torna alla home dopo','', `<select><option>2 minuti</option><option selected>5 minuti</option><option>Mai</option></select>`)}
          ${rigaCfg('Testo grande','Aumenta i caratteri su tutta l\'app.', interruttore(document.body.classList.contains('testo-grande'), COLORE, 'data-testo-grande'))}
        </ul>`)}
      </div>
      <div class="griglia" style="align-content:start">
        ${riq('Dati e collegamento', `<ul class="cfg" style="margin:-16px -18px">
          ${rigaCfg('Stato', rete.collegata ? 'Collegata al database su Cloudflare.' : 'Sta usando i dati locali di prova.',
            `<span class="pill ${rete.collegata ? 'verde' : 'ambra'}">${rete.collegata ? 'Collegata' : 'Locale'}</span>`)}
          ${rigaCfg('Chiave di casa','La stessa che usi nel comando rapido dell\'iPhone.',
            `<input type="password" id="chiave-generale" value="${esc(chiave())}" style="min-width:180px">`)}
          ${rigaCfg('','', `<button class="btn piccolo" style="background:var(--home)" data-salva-chiave-gen>Salva e ricarica</button>`)}
          ${rigaCfg('Ricarica automatica','L\'app rilegge il database ogni 30 secondi.', interruttore(true, COLORE))}
        </ul>`)}
        ${riq('Moduli attivi', `<ul class="cfg" style="margin:-16px -18px">
          ${S.S.dati.moduli.map(m => rigaCfg(m.nome, '', interruttore(true, m.colore))).join('')}
        </ul>
        <p class="nota">Per aggiungere un modulo nuovo basta una riga nella tabella moduli e un file in public/js/moduli.</p>`)}
      </div>
    </div>`;
  },

  aggancia(root){
    root.addEventListener('click', e => {
      if (e.target.closest('[data-testo-grande]')) {
        document.body.classList.toggle('testo-grande');
        localStorage.setItem('ferrafoni.testoGrande', document.body.classList.contains('testo-grande') ? '1' : '0');
      }
      if (e.target.closest('[data-salva-chiave-gen]')) {
        salvaChiave(root.querySelector('#chiave-generale').value.trim());
        S.carica();
      }
    });
  }
};
