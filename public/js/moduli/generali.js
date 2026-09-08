// Impostazioni della casa: persone, dispositivo, dati e aspetto.

import { esc, avviso } from '../util.js';
import { riq, rigaCfg, interruttore, modaleForm } from '../ui.js';
import { chiave, salvaChiave, rete, api, prova } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--home)';
const MODULI_CAT = [
  { id:'pulizie', nome:'Pulizie', colore:'var(--pulizie)' },
  { id:'spesa', nome:'Lista della spesa', colore:'var(--spesa)' },
  { id:'attivita', nome:'Attività programmate', colore:'var(--attivita)' },
  { id:'calendario', nome:'Calendario', colore:'var(--calendario)' }
];

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
          ${S.S.dati.persone.map(p => `<li>
            <span class="tx"><strong>${esc(p.nome)}</strong><span>${
              p.ruolo === 'collaboratrice' ? 'Vede solo checklist pulizie e ore lavorate' :
              p.ruolo === 'bambina' ? 'Compare nelle attività, non accede all\'app' : 'Accesso completo'}</span></span>
            <button class="btn chiaro piccolo" data-mod-persona="${p.id}">Modifica</button>
          </li>`).join('')}
        </ul>
        <div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
          <button class="btn chiaro pieno" data-nuova-persona>Aggiungi persona</button>
        </div>`, { classe:'tinta', colore:COLORE })}

        ${riq('Categorie per modulo', MODULI_CAT.map(m => `
          <div class="gruppo aperto">
            <button class="capo" data-gruppo="gc_${m.id}">
              <b>${esc(m.nome)}</b>
              <span class="avanz">${S.categorie(m.id).length} categorie</span>
              <span class="freccia"></span></button>
            <div class="elenco"><div>
              <div style="padding:12px 18px">
                <div class="etichette">
                  ${S.categorie(m.id).map(c => `<button class="et-i" data-mod-cat="${c.id}">${c.icona || '📁'} ${esc(c.nome)}</button>`).join('')}
                  <button class="et-i aggiungi" data-nuova-cat="${m.id}">Aggiungi categoria</button>
                </div>
              </div>
            </div></div>
          </div>`).join(''), { raso:true })}
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
    root.addEventListener('click', async e => {
      if (e.target.closest('[data-testo-grande]')) {
        document.body.classList.toggle('testo-grande');
        localStorage.setItem('ferrafoni.testoGrande', document.body.classList.contains('testo-grande') ? '1' : '0');
        return;
      }
      if (e.target.closest('[data-salva-chiave-gen]')) {
        salvaChiave(root.querySelector('#chiave-generale').value.trim());
        S.carica();
        return;
      }
      const g = e.target.closest('[data-gruppo]');
      if (g) { g.closest('.gruppo').classList.toggle('aperto'); return; }

      const opzRuoli = [
        { id:'adulto', nome:'Adulto' }, { id:'bambina', nome:'Bambina' }, { id:'collaboratrice', nome:'Chi pulisce' }
      ];

      if (e.target.closest('[data-nuova-persona]')) {
        const r = await modaleForm({
          titolo: 'Nuova persona', colore: COLORE,
          campi: [
            { nome:'nome', etichetta:'Nome', richiesto:true },
            { nome:'iniziali', etichetta:'Iniziali (due lettere)', placeholder:'Es. GF' },
            { nome:'ruolo', etichetta:'Ruolo', tipo:'select', opzioni: opzRuoli },
            { nome:'colore', etichetta:'Colore (esadecimale)', placeholder:'#6E7A83', difetto:'#6E7A83' }
          ]
        });
        if (r?.azione === 'salva' && r.valori.nome) {
          const p = { id:'loc'+Date.now(), ...r.valori };
          S.aggiungiPersonaLocale(p);
          prova(api.creaPersona(r.valori));
          avviso('Persona aggiunta');
          this.ridisegna();
        }
        return;
      }

      const modP = e.target.closest('[data-mod-persona]');
      if (modP) {
        const p = S.persona(modP.dataset.modPersona);
        const r = await modaleForm({
          titolo: p.nome, colore: COLORE,
          valori: { nome:p.nome, iniziali:p.iniziali, ruolo:p.ruolo, colore:p.colore },
          campi: [
            { nome:'nome', etichetta:'Nome', richiesto:true },
            { nome:'iniziali', etichetta:'Iniziali' },
            { nome:'ruolo', etichetta:'Ruolo', tipo:'select', opzioni: opzRuoli },
            { nome:'colore', etichetta:'Colore (esadecimale)' }
          ]
        });
        if (r?.azione === 'salva') {
          S.modificaPersonaLocale(p.id, r.valori);
          prova(api.modificaPersona({ id: p.id, ...r.valori }));
          avviso('Persona aggiornata');
          this.ridisegna();
        }
        return;
      }

      const nuovaCat = e.target.closest('[data-nuova-cat]');
      if (nuovaCat) {
        const modulo = nuovaCat.dataset.nuovaCat;
        const r = await modaleForm({
          titolo: 'Nuova categoria', colore: COLORE,
          campi: [
            { nome:'nome', etichetta:'Nome della categoria', richiesto:true },
            { nome:'icona', etichetta:'Icona (una emoji)', placeholder:'📁', difetto:'📁' }
          ]
        });
        if (r?.azione === 'salva' && r.valori.nome) {
          const c = { id:'loc'+Date.now(), modulo, ...r.valori };
          S.aggiungiCategoriaLocale(c);
          prova(api.creaCategoria({ modulo, ...r.valori }));
          avviso('Categoria aggiunta');
          this.ridisegna();
        }
        return;
      }

      const modCat = e.target.closest('[data-mod-cat]');
      if (modCat) {
        const c = S.categoria(modCat.dataset.modCat);
        const r = await modaleForm({
          titolo: c.nome, colore: COLORE, permettiElimina: true,
          valori: { nome:c.nome, icona:c.icona },
          campi: [
            { nome:'nome', etichetta:'Nome', richiesto:true },
            { nome:'icona', etichetta:'Icona' }
          ]
        });
        if (r?.azione === 'salva') {
          S.modificaCategoriaLocale(c.id, r.valori);
          prova(api.modificaCategoria({ id: c.id, ...r.valori }));
          avviso('Categoria aggiornata');
        } else if (r?.azione === 'elimina') {
          S.rimuoviCategoriaLocale(c.id);
          prova(api.eliminaCategoria(c.id));
          avviso('Categoria tolta');
        }
        this.ridisegna();
      }
    });
  }
};
