// Modulo attività programmate: scadenze ricorrenti della casa,
// raggruppate per categoria e con la data che si sposta da sola.

import { esc, gm, relativa, avviso, iso, OGGI } from '../util.js';
import { riq, tabella, rigaCfg, interruttore, barra } from '../ui.js';
import { api, prova } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--attivita)';

function vistaScadenze(){
  const lista = S.attivitaConScadenza();
  const cats = S.categorie('attivita');

  const righe = lista.map(a => `
    <tr>
      <td><b>${esc(a.nome)}</b><span class="sm">${esc(S.categoria(a.categoria_id)?.nome || '')}</span></td>
      <td>${esc(S.nomePersona(a.persona_id))}</td>
      <td><span class="pill ${a.etichetta.classe}">${esc(a.etichetta.testo)}</span>
          <span class="sm">${gm(a.quando)}</span></td>
      <td>${a.ricorrenza_giorni ? 'ogni ' + (a.ricorrenza_giorni === 365 ? 'anno' :
            a.ricorrenza_giorni === 180 ? '6 mesi' : a.ricorrenza_giorni + ' giorni') : 'una volta'}</td>
      <td style="text-align:right"><button class="btn piccolo" style="background:var(--attivita)" data-fatta="${a.id}">Fatta</button></td>
    </tr>`);

  return `<div class="griglia g-lato">
    ${riq('Scadenze', tabella(['Attività','Chi','Scade','Ricorre',''], righe),
      { raso:true, classe:'tinta', colore:COLORE, meta:'in rosso quelle passate e di oggi' })}
    <div class="griglia" style="align-content:start">
      ${riq('Per categoria', cats.map(c => {
        const n = lista.filter(a => a.categoria_id === c.id).length;
        return `<div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;font-size:.87rem;margin-bottom:6px">
            <span>${c.icona} ${esc(c.nome)}</span><span style="color:var(--tenue)">${n}</span></div>
          ${barra(lista.length ? n / lista.length * 100 : 0, COLORE)}</div>`;
      }).join(''))}
      ${riq('Fatte di recente', `<ul class="righe" style="margin:-16px -18px">
        ${lista.filter(a => a.ultima_esecuzione).slice(0,4).map(a =>
          `<li><span class="tx"><strong>${esc(a.nome)}</strong>
           <span>${esc(S.nomePersona(a.persona_id))}</span></span>
           <span class="qd">${gm(a.ultima_esecuzione)}</span></li>`).join('')
          || `<li><span class="tx"><span>Ancora nessuna registrata</span></span></li>`}
      </ul>`)}
    </div>
  </div>`;
}

function vistaImpostazioni(){
  return `<div class="griglia g-lato">
    <div class="griglia" style="align-content:start">
      ${riq('Categorie', `<div class="etichette">
        ${S.categorie('attivita').map(c => `<span class="et-i">${c.icona} ${esc(c.nome)}</span>`).join('')}
        <span class="et-i aggiungi">Aggiungi categoria</span></div>`, { classe:'tinta', colore:COLORE })}
      ${riq('Ricorrenze', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Ricalcola dalla data di completamento','Se la fai con dieci giorni di ritardo, la prossima scadenza slitta di dieci giorni.', interruttore(true, COLORE))}
        ${rigaCfg('Salta i giorni festivi','Sposta la scadenza al primo giorno feriale utile.', interruttore(false, COLORE))}
        ${rigaCfg('Tieni lo storico per','', `<select><option>1 anno</option><option selected>3 anni</option><option>Sempre</option></select>`)}
      </ul>`)}
    </div>
    <div class="griglia" style="align-content:start">
      ${riq('Notifiche', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Primo avviso','', `<select><option>3 giorni prima</option><option selected>7 giorni prima</option><option>14 giorni prima</option></select>`)}
        ${rigaCfg('Secondo avviso','Il giorno stesso, alle 09:00.', interruttore(true, COLORE))}
        ${rigaCfg('Insisti se è in ritardo','Un avviso al giorno finché non risulta fatta.', interruttore(true, COLORE))}
      </ul>`)}
      ${riq('Riquadro scadenze in home', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Quanto guarda avanti','', `<select><option>3 giorni</option><option selected>7 giorni</option><option>14 giorni</option></select>`)}
        ${rigaCfg('Segna in rosso','', `<select><option>Solo le scadute</option><option selected>Scadute e di oggi</option><option>Scadute, oggi e domani</option></select>`)}
        ${rigaCfg('Includi i cambi biancheria','', interruttore(true, COLORE))}
        ${rigaCfg('Includi le voci di pulizia','', interruttore(true, COLORE))}
      </ul>`)}
    </div>
  </div>`;
}

export default {
  id: 'attivita',
  nome: 'Attività programmate',
  emoji: '🔔',
  colore: COLORE,
  sezioni: [{ id:'scadenze', nome:'Scadenze' }, { id:'impostazioni', nome:'Impostazioni' }],
  distintivo(){
    const n = S.attivitaConScadenza().filter(a => a.giorni <= 0).length;
    return { n: n || S.attivitaConScadenza().length, caldo: n > 0 };
  },
  render(sezione){ return sezione === 'impostazioni' ? vistaImpostazioni() : vistaScadenze(); },
  aggancia(root){
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-fatta]');
      if (!b) return;
      const a = S.S.dati.attivita.find(x => x.id === b.dataset.fatta);
      if (!a) return;
      a.ultima_esecuzione = iso(OGGI);
      if (a.ricorrenza_giorni) {
        const p = new Date(OGGI); p.setDate(p.getDate() + a.ricorrenza_giorni);
        a.scadenza = iso(p);
      }
      prova(api.attivitaFatta(a.id));
      S.avvisa();
      avviso(a.nome + ': prossima scadenza ' + (a.scadenza ? relativa(a.scadenza) : 'nessuna'));
    });
  }
};
