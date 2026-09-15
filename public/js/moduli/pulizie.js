// Modulo pulizie. La checklist è divisa per zona: si apre una zona alla volta,
// così su tablet non si scorre mai un elenco di trenta righe.

import { esc, gm, breve, iso, piu, lunedi, OGGI, scarto, plurale, avviso } from '../util.js';
import { riq, tabella, anello, barra, interruttore, rigaCfg, vuoto } from '../ui.js';
import { modaleData, modaleForm } from '../ui.js';
import { api, prova, ultimoErrore } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--pulizie)';
const FREQ = {
  giornaliera: 'ogni giorno', settimanale: 'ogni settimana', quindicinale: 'ogni 2 settimane',
  mensile: 'ogni mese', trimestrale: 'ogni 3 mesi', stagionale: 'a ogni cambio stagione'
};

// Ordine delle cadenze: serve a mettere vicine le lavorazioni con la stessa
// frequenza, cosi nelle due colonne si accompagnano per riga.
const ORDINE_FREQ = { giornaliera:0, settimanale:1, quindicinale:2, mensile:3, trimestrale:4, stagionale:5 };
const perCadenza = (a, b) =>
  (ORDINE_FREQ[a.frequenza] ?? 9) - (ORDINE_FREQ[b.frequenza] ?? 9) || (a.ordine - b.ordine);

const aperti = new Set();
let primaVolta = true;
let meseScelto = null;   // AAAA-MM della vista Ore e storico

const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio',
              'agosto','settembre','ottobre','novembre','dicembre'];

/* ---------- checklist ---------- */

function gruppo(cat, voci){
  const fatte = voci.filter(v => S.spunta(v.id)?.stato === 'fatto').length;
  const aperto = aperti.has(cat.id);
  const tutte = fatte === voci.length;

  // Le voci di una zona chiusa non vengono nemmeno costruite: su iPad
  // disegnare trenta righe a ogni tocco e' la causa principale della lentezza.
  return `
  <div class="gruppo ${aperto ? 'aperto' : ''}">
    <button class="capo" data-gruppo="${cat.id}">
      <span class="emj">${cat.icona || '•'}</span>
      <b>${esc(cat.nome)}</b>
      <span class="avanz">${fatte} di ${voci.length}${tutte ? ' · completata' : ''}</span>
      <span style="width:78px">${barra(voci.length ? fatte / voci.length * 100 : 0, COLORE)}</span>
      <span class="freccia"></span>
    </button>
    <div class="elenco">${aperto ? voci.slice().sort(perCadenza).map(compito).join('') : ''}</div>
  </div>`;
}

function compito(v){
  const s = S.spunta(v.id);
  const stato = s?.stato;
  const scaduto = !stato && v.frequenza === 'settimanale' && scarto(piu(new Date(S.S.settimana + 'T00:00:00'), 6)) < 0;

  const timbro = (s && (stato === 'fatto' || stato === 'parziale'))
    ? `<b>${gm(s.data)}</b>${esc(S.nomePersona(s.persona_id))}`
    : `<span style="color:var(--tenue-chiaro)">nessuna data</span>`;

  return `
  <div class="compito ${stato === 'fatto' ? 'fatto' : ''} ${scaduto ? 'scaduto' : ''}">
    <span class="emj">${v.icona || '•'}</span>
    <span class="tx"><strong>${esc(v.nome)}</strong><span>${FREQ[v.frequenza] || v.frequenza}</span>
      ${s?.nota ? `<span class="nota-voce">${esc(s.nota)}</span>` : ''}</span>
    <button class="quando" data-data="${v.id}">${timbro}</button>
    <span class="segna">
      <button data-segna="fatto" data-voce="${v.id}" class="${stato === 'fatto' ? 'f-on' : ''}">Fatto</button>
      <button data-segna="parziale" data-voce="${v.id}" class="${stato === 'parziale' ? 'p-on' : ''}">Parziale</button>
      <button data-nota-voce="${v.id}" class="${s?.nota ? 'n-on' : ''}">Note</button>
    </span>
  </div>`;
}

// Aggiorna la sola riga toccata, il contatore della sua zona e la percentuale
// in alto. Niente ridisegno: la pagina non si muove e la spunta e' immediata.
function aggiornaRiga(root, voceId){
  const v = S.S.dati.pulizie.voci.find(x => x.id === voceId);
  if (!v) return false;

  const bottone = root.querySelector('[data-voce="' + voceId + '"]');
  const riga = bottone && bottone.closest('.compito');
  if (!riga) return false;

  const contenitore = riga.parentNode;
  const provvisorio = document.createElement('div');
  provvisorio.innerHTML = compito(v);
  contenitore.replaceChild(provvisorio.firstElementChild, riga);

  // contatore e barra della zona
  const cat = S.categoria(v.categoria_id);
  if (cat) {
    const voci = S.S.dati.pulizie.voci.filter(x => x.categoria_id === cat.id);
    const fatte = voci.filter(x => S.spunta(x.id) && S.spunta(x.id).stato === 'fatto').length;
    const capo = root.querySelector('[data-gruppo="' + cat.id + '"]');
    if (capo) {
      const et = capo.querySelector('.avanz');
      if (et) et.textContent = fatte + ' di ' + voci.length + (fatte === voci.length ? ' · completata' : '');
      const barra = capo.querySelector('.barra i');
      if (barra) barra.style.width = (voci.length ? fatte / voci.length * 100 : 0) + '%';
    }
  }

  // anello e testo della settimana
  const av = S.avanzamentoPulizie();
  const cerchio = root.querySelector('.anello .avanti');
  if (cerchio) {
    const r = Number(cerchio.getAttribute('r'));
    const c = 2 * Math.PI * r;
    cerchio.setAttribute('stroke-dashoffset', String(c * (1 - av.percento / 100)));
  }
  const etichetta = root.querySelector('.settimana-barra b[style*="position:absolute"]');
  if (etichetta) etichetta.textContent = av.percento + '%';
  const sotto = root.querySelector('.settimana-barra .et span');
  if (sotto) sotto.textContent = sotto.textContent.replace(/\d+ voc[ei] da fare/,
    plurale(av.restanti, 'voce da fare', 'voci da fare'));

  return true;
}

function barraSettimana(){
  const lun = new Date(S.S.settimana + 'T00:00:00');
  const av = S.avanzamentoPulizie();
  const corrente = S.S.settimana === iso(lunedi());

  return `
  <div class="settimana-barra">
    <button class="nav" data-sett="-1" aria-label="Settimana precedente">‹</button>
    <button class="nav" data-sett="1" aria-label="Settimana successiva">›</button>
    <span class="et">
      <b>${breve(lun)} – ${breve(piu(lun, 6))}</b>
      <span>${corrente ? 'settimana in corso' : (lun < OGGI ? 'settimana conclusa' : 'settimana da venire')}
      · ${plurale(av.restanti, 'voce da fare', 'voci da fare')}</span>
    </span>
    <span style="position:relative;display:flex;align-items:center;justify-content:center">
      ${anello(av.percento, COLORE, 60)}
      <b style="position:absolute;font-size:.85rem;color:var(--pulizie)">${av.percento}%</b>
    </span>
    ${corrente ? '' : '<button class="btn chiaro piccolo" data-sett="0">Torna a oggi</button>'}
  </div>`;
}

function bannerConto(){
  const lucia = S.S.dati.persone.find(p => p.ruolo === 'collaboratrice');
  if (!lucia) return '';
  const conto = S.contoPersona(lucia.id);
  const d = conto.differenza;
  const inPari = Math.abs(d) < 0.005;

  const colore = inPari || d > 0 ? 'var(--verde)' : 'var(--rosso)';
  const fondo  = inPari || d > 0 ? '#E4F1EB' : 'var(--rosso-fondo)';
  const testo = inPari
    ? lucia.nome + ': conto in pari'
    : d > 0
      ? lucia.nome + ' e a debito di ' + d.toFixed(2).replace('.', ',') + ' EUR'
      : lucia.nome + ' e a credito di ' + Math.abs(d).toFixed(2).replace('.', ',') + ' EUR';
  const sotto = inPari
    ? 'Pagato esattamente quanto dovuto'
    : d > 0
      ? 'Ha ricevuto in piu, si scala dal prossimo pagamento'
      : 'Le devi ancora questa cifra';

  return `<div style="display:flex;align-items:center;gap:12px;padding:13px 18px;
    background:${fondo};border-bottom:1px solid var(--linea-tenue)">
    <span style="font-size:1.2rem">${inPari ? '\u2705' : d > 0 ? '\u{1F4B6}' : '\u{1F514}'}</span>
    <span style="flex:1;min-width:0">
      <b style="display:block;font-size:.94rem;color:${colore}">${esc(testo)}</b>
      <span style="font-size:.79rem;color:var(--tenue)">${esc(sotto)}</span></span>
  </div>`;
}

// Le note della settimana stanno nella tabella note, con il modulo che porta
// dentro la data del lunedi: cosi ogni settimana ha le sue e restano nello storico.
const chiaveNote = sett => 'pulizie-sett-' + sett;

// Una sola card: in alto le note di questa settimana, sotto le indicazioni fisse.
function cardNote(){
  const fisse = S.note('pulizie');
  const mia = S.note(chiaveNote(S.S.settimana))[0];
  const settPrec = iso(piu(new Date(S.S.settimana + 'T00:00:00'), -7));
  const prec = S.note(chiaveNote(settPrec))[0];

  return riq('Note pulizie',
    `<div style="padding:16px 18px">
       <p class="occhiello" style="margin:0 0 7px">Questa settimana</p>
       ${mia
         ? `<p style="margin:0;white-space:pre-wrap;font-size:.93rem">${esc(mia.testo)}</p>`
         : `<p style="margin:0;color:var(--tenue);font-size:.9rem">Nessuna nota per questa settimana.</p>`}
       ${prec ? `
       <div style="margin-top:14px;padding:11px 13px;background:#F3F0E8;border-radius:10px">
         <p class="occhiello" style="margin:0 0 5px">Rimasto indietro dalla settimana scorsa</p>
         <p style="margin:0;white-space:pre-wrap;font-size:.86rem;font-style:italic">${esc(prec.testo)}</p>
       </div>` : ''}
       <div style="margin-top:12px">
         <button class="btn chiaro pieno" data-note-settimana>${mia ? 'Modifica le note della settimana' : 'Scrivi una nota per questa settimana'}</button>
       </div>
     </div>

     <p class="occhiello" style="margin:0;padding:12px 18px 8px;border-top:1px solid var(--linea-tenue);background:#F7F5EE">
       Indicazioni fisse per chi pulisce</p>
     ${fisse.length ? fisse.map(n => `
       <div class="log-riga">
         <span class="log-punto" style="--c:${COLORE}"></span>
         <span class="tx"><strong>${esc(n.testo)}</strong></span>
         <div class="riga-azioni">
           <button data-mod-nota="${n.id}">Modifica</button>
           <button data-elimina-nota="${n.id}" class="pericolo">Elimina</button>
         </div>
       </div>`).join('') : `<p class="vuoto">Nessuna indicazione fissa</p>`}
     <div style="padding:14px 18px;border-top:1px solid var(--linea-tenue);display:flex;gap:9px">
       <input type="text" id="nuova-nota" placeholder="Aggiungi un indicazione fissa" style="flex:1;min-width:0">
       <button class="btn" style="background:${COLORE}" data-aggiungi-nota>Aggiungi</button>
     </div>`,
    { raso: true, classe: 'tinta', colore: COLORE,
      meta: breve(new Date(S.S.settimana + 'T00:00:00')) + ' - ' + breve(piu(new Date(S.S.settimana + 'T00:00:00'), 6)) });
}

function vistaChecklist(){
  const cats = S.categorie('pulizie');
  const voci = S.S.dati.pulizie.voci;

  if (primaVolta) {
    primaVolta = false;
    const prima = cats.find(c => voci.some(v => v.categoria_id === c.id && !S.spunta(v.id)));
    if (prima) aperti.add(prima.id);
  }

  // La card mostra tutto il mese della settimana che sto guardando,
  // non solo i sette giorni: cosi si vede il quadro completo del pagamento.
  const meseSett = S.S.settimana.slice(0, 7);
  const ore = S.S.dati.pulizie.ore
    .filter(o => o.data.slice(0, 7) === meseSett)
    .sort((a, b) => b.data.localeCompare(a.data));
  const totale = ore.reduce((s, o) => s + o.ore, 0);
  const nomeMeseSett = MESI[Number(meseSett.slice(5, 7)) - 1];

  return barraSettimana() + `
    <div class="griglia g-lato">
      ${riq('Checklist della settimana',
        cats.map(c => gruppo(c, voci.filter(v => v.categoria_id === c.id))).join(''),
        { raso: true, classe: 'tinta', colore: COLORE, meta: 'ogni spunta chiede la data' })}
      <div class="griglia" style="align-content:start">
        ${riq('Giorni lavorati · ' + nomeMeseSett,
          bannerConto() +
          tabella(['Giorno', 'Orario', 'Ore'],
            ore.length ? ore.map(o => `<tr><td>${esc(new Date(o.data).toLocaleDateString('it-IT',{weekday:'long',day:'numeric'}))}</td>
              <td class="num">${esc(o.ora_inizio || '')} - ${esc(o.ora_fine || '')}</td>
              <td class="num">${String(o.ore).replace('.', ',')}</td></tr>`)
              : [`<tr><td colspan="3">${vuoto('Nessuna giornata in ' + nomeMeseSett)}</td></tr>`]) +
          `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
             <button class="btn chiaro pieno" data-nuova-giornata>Aggiungi giornata</button></div>`,
          { raso: true, meta: String(totale).replace('.', ',') + ' ore a ' + nomeMeseSett })}
        ${cardNote()}
      </div>
    </div>`;
}

/* ---------- ore e storico ---------- */

function vistaOre(){
  const ore = S.S.dati.pulizie.ore
    .filter(o => o.data.slice(0, 7) === meseScelto)
    .sort((a, b) => b.data.localeCompare(a.data));
  const totMese = ore.reduce((s, o) => s + o.ore, 0);
  const lucia = S.S.dati.persone.find(p => p.ruolo === 'collaboratrice');
  const conto = lucia ? S.contoPersona(lucia.id) : null;

  const [anno, mm] = meseScelto.split('-').map(Number);
  const nomeMese = MESI[mm - 1] + ' ' + anno;
  const corrente = meseScelto === iso(OGGI).slice(0, 7);

  return `
    <div class="settimana-barra">
      <button class="nav" data-mese="-1" aria-label="Mese precedente">&lsaquo;</button>
      <button class="nav" data-mese="1" aria-label="Mese successivo">&rsaquo;</button>
      <span class="et">
        <b>${nomeMese}</b>
        <span>${ore.length ? ore.length + (ore.length === 1 ? ' giornata' : ' giornate') + ' registrate' : 'nessuna giornata'}
        &middot; ${String(totMese).replace('.', ',')} ore</span>
      </span>
      ${corrente ? '' : '<button class="btn chiaro piccolo" data-mese="0">Torna a questo mese</button>'}
    </div>

    <div class="griglia g-lato">
      ${riq('Registro giornate', tabella(['Giorno', 'Orario', 'Ore', 'Chi', ''],
        ore.length ? ore.map(o => `<tr>
          <td>${esc(new Date(o.data).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' }))}</td>
          <td class="num">${esc(o.ora_inizio || '')} - ${esc(o.ora_fine || '')}</td>
          <td class="num">${String(o.ore).replace('.', ',')}</td>
          <td>${esc(S.nomePersona(o.persona_id))}</td>
          <td style="text-align:right"><div class="riga-azioni" style="justify-content:flex-end;display:inline-flex">
            <button data-mod-ore="${o.id}" title="Modifica">&#9998;</button>
            <button data-elimina-ore="${o.id}" title="Elimina" style="color:var(--rosso)">&#128465;</button>
          </div></td></tr>`)
          : [`<tr><td colspan="5">${vuoto('Nessuna giornata in questo mese')}</td></tr>`]),
        { raso: true, classe: 'tinta', colore: COLORE, meta: 'anche le giornate passate si possono correggere' })}

      <div class="griglia" style="align-content:start">
        ${riq(nomeMese, `
          <div style="display:flex;align-items:center;gap:22px">
            <div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${String(totMese).replace('.', ',')}</b>
            <span class="occhiello" style="display:block">ore lavorate</span></div>
            <div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${ore.length}</b>
            <span class="occhiello" style="display:block">giornate</span></div>
            ${lucia && lucia.tariffa_oraria ? `<div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${(totMese * lucia.tariffa_oraria).toFixed(0)}</b>
            <span class="occhiello" style="display:block">euro nel mese</span></div>` : ''}
          </div>
          <p class="nota">Usa le frecce in alto per scorrere i mesi passati.</p>`)}
        ${conto ? riq('Conto con ' + lucia.nome, `
          <p style="margin:0 0 12px;font-size:.92rem">${fraseConto(lucia.nome, conto.differenza).testo}</p>
          <p class="nota" style="margin:0 0 14px">${fraseConto(lucia.nome, conto.differenza).sotto}</p>
          <button class="btn chiaro pieno" data-vai-pagamenti>Vai ai pagamenti</button>
        `) : ''}
      </div>
    </div>`;
}

/* ---------- impostazioni ---------- */

function vistaImpostazioni(){
  const cats = S.categorie('pulizie');
  const voci = S.S.dati.pulizie.voci;
  const lucia = S.S.dati.persone.find(p => p.ruolo === 'collaboratrice');

  return `<div class="griglia g-lato">
    <div class="griglia" style="align-content:start">
      ${riq('Voci della checklist', cats.map(c => `
        <div class="gruppo ${aperti.has('cfg_' + c.id) ? 'aperto' : ''}">
          <button class="capo" data-gruppo="cfg_${c.id}">
            <span class="emj">${c.icona}</span><b>${esc(c.nome)}</b>
            <span class="avanz">${voci.filter(v => v.categoria_id === c.id).length} voci</span>
            <span class="freccia"></span></button>
          <div class="elenco">${aperti.has('cfg_' + c.id) ? voci.filter(v => v.categoria_id === c.id).map(v => `
            <div class="compito" style="min-height:64px">
              <span class="emj">${v.icona}</span>
              <span class="tx"><strong>${esc(v.nome)}</strong><span>${FREQ[v.frequenza]}</span></span>
              <div class="riga-azioni">
                <button data-mod-voce="${v.id}" title="Modifica">&#9998;</button>
                <button data-elimina-voce="${v.id}" title="Togli dalla checklist" style="color:var(--rosso)">&#128465;</button>
              </div>
            </div>`).join('') : ''}</div>
        </div>`).join('') +
        `<div style="padding:16px 18px;border-top:1px solid var(--linea-tenue)">
           <button class="btn chiaro pieno" data-nuova-voce>Aggiungi una voce</button>
           <p class="nota">Ogni voce ha la sua frequenza e la sua zona. La frequenza decide quando la voce
           torna a essere da fare e quando compare in rosso nella home.</p>
         </div>`,
        { raso: true, classe: 'tinta', colore: COLORE, meta: voci.length + ' voci attive' })}

      ${riq('Come funziona la checklist', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('La settimana inizia', '', `<select><option selected>Lunedi</option><option>Domenica</option></select>`)}
        ${rigaCfg('Chiedi sempre la data quando spunto', 'Ogni Fatto o Parziale apre la scelta del giorno.', interruttore(true, COLORE))}
        ${rigaCfg('Chiedi chi ha fatto la lavorazione', 'Mostra la scelta tra le persone di casa e chi viene a pulire.', interruttore(true, COLORE))}
        ${rigaCfg('Riporta le voci non fatte', 'Restano nella settimana nuova segnalate in rosso.', interruttore(true, COLORE))}
        ${rigaCfg('Blocca le settimane passate', 'Dopo la domenica lo storico non e piu modificabile.', interruttore(false, COLORE))}
      </ul>`)}
    </div>

    <div class="griglia" style="align-content:start">
      ${riq('Chi pulisce', `<ul class="cfg" style="margin:-16px -18px">
        ${lucia ? `
        ${rigaCfg('Nome', 'Compare accanto a ogni spunta e nel modulo pagamenti.', `<input type="text" data-persona-nome="${lucia.id}" value="${esc(lucia.nome)}" style="min-width:170px">`)}
        ${rigaCfg('Tariffa oraria', 'Usata per calcolare quanto e dovuto in base alle ore lavorate.', `<div style="display:flex;align-items:center;gap:8px"><input type="number" min="0" step="0.5" data-persona-tariffa="${lucia.id}" value="${lucia.tariffa_oraria || 0}" style="min-width:90px"><span style="color:var(--tenue)">euro/ora</span></div>`)}
        ` : `<li><span class="tx"><span>Nessuna persona con ruolo "chi pulisce". Aggiungila da Casa e famiglia.</span></span></li>`}
      </ul>
      ${lucia ? `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
        <button class="btn chiaro pieno" data-salva-tariffa="${lucia.id}">Salva nome e tariffa</button>
      </div>` : ''}`)}

      ${riq('Promemoria', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Segnala le voci scadute', 'Compaiono in rosso nel riquadro della home.', interruttore(true, COLORE))}
        ${rigaCfg('Riepilogo della domenica sera', '', interruttore(true, COLORE))}
      </ul>`)}
    </div>
  </div>`;
}

/* ---------- pagamenti ---------- */

function fraseConto(nome, differenza){
  if (Math.abs(differenza) < 0.005) {
    return { testo: nome + ': conto in pari', sotto: 'Quanto pagato corrisponde esattamente al dovuto.', classe: 'neutra' };
  }
  if (differenza > 0) {
    return {
      testo: nome + ' è a debito di ' + differenza.toFixed(2).replace('.', ',') + ' €',
      sotto: 'Ha ricevuto ' + differenza.toFixed(2).replace('.', ',') + ' € in più del dovuto: si scala dal prossimo pagamento.',
      classe: 'ambra'
    };
  }
  return {
    testo: nome + ' è a credito di ' + Math.abs(differenza).toFixed(2).replace('.', ',') + ' €',
    sotto: 'Le devi ancora ' + Math.abs(differenza).toFixed(2).replace('.', ',') + ' €.',
    classe: 'rossa'
  };
}

function bloccoPersona(p){
  const conto = S.contoPersona(p.id);
  const frase = fraseConto(p.nome, conto.differenza);
  const pagamenti = S.pagamentiDi(p.id);

  return riq(p.nome, `
    <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin-bottom:18px">
      <div><b style="font-size:1.7rem;letter-spacing:-.03em;color:${COLORE}">${conto.oreTotali.toFixed(1).replace('.', ',')}</b>
        <span class="occhiello" style="display:block">ore lavorate in tutto</span></div>
      <div><b style="font-size:1.7rem;letter-spacing:-.03em;color:${COLORE}">${conto.dovuto.toFixed(2).replace('.', ',')} €</b>
        <span class="occhiello" style="display:block">dovuto a ${p.tariffa_oraria} €/ora</span></div>
      <div><b style="font-size:1.7rem;letter-spacing:-.03em;color:${COLORE}">${conto.pagato.toFixed(2).replace('.', ',')} €</b>
        <span class="occhiello" style="display:block">pagato finora</span></div>
    </div>
    <div class="urg ${frase.classe === 'neutra' ? 'calma' : ''}" style="cursor:default;${frase.classe === 'rossa' ? 'border-color:#EBCEC8' : ''}">
      <span class="emj">${frase.classe === 'neutra' ? '✅' : frase.classe === 'ambra' ? '💶' : '🔔'}</span>
      <span><b style="${frase.classe === 'ambra' ? 'color:#8A5F0B' : frase.classe === 'rossa' ? 'color:var(--rosso)' : ''}">${esc(frase.testo)}</b>
      <span>${esc(frase.sotto)}</span></span>
    </div>
    <p class="section-t" style="margin:20px 0 0">Storico pagamenti</p>
    <div style="margin:0 -18px">
      ${pagamenti.length ? pagamenti.map(pg => `
        <div class="log-riga">
          <span class="log-punto" style="--c:${COLORE}"></span>
          <span class="tx"><strong>${Number(pg.importo).toFixed(2).replace('.', ',')} €</strong>
            <span>${gm(pg.data)}${pg.nota ? ' · ' + esc(pg.nota) : ''}</span></span>
          <div class="riga-azioni">
            <button data-mod-pag="${pg.id}" title="Modifica">✎</button>
          </div>
        </div>`).join('') : `<p class="vuoto">Nessun pagamento ancora registrato</p>`}
    </div>
    <div style="padding:16px 0 0">
      <button class="btn pieno" style="background:${COLORE}" data-nuovo-pag="${p.id}">Registra un pagamento</button>
    </div>
  `, { classe: 'tinta', colore: COLORE });
}

function vistaPagamenti(){
  const collaboratrici = S.S.dati.persone.filter(p => p.ruolo === 'collaboratrice');
  if (!collaboratrici.length) {
    return riq('Pagamenti', vuoto('Nessuna persona con ruolo "chi pulisce" al momento. Aggiungila da Casa e famiglia per attivare il conto.'));
  }
  return `<div class="griglia" style="gap:18px">${collaboratrici.map(bloccoPersona).join('')}</div>`;
}

export default {
  id: 'pulizie',
  nome: 'Pulizie',
  emoji: '🧽',
  colore: COLORE,
  sezioni: [
    { id: 'checklist', nome: 'Checklist' },
    { id: 'ore', nome: 'Ore e storico' },
    { id: 'pagamenti', nome: 'Pagamenti' },
    { id: 'impostazioni', nome: 'Impostazioni' }
  ],

  distintivo(){
    const av = S.avanzamentoPulizie();
    return { n: av.restanti, caldo: false };
  },

  render(sezione){
    if (meseScelto === null) meseScelto = iso(OGGI).slice(0, 7);
    if (sezione === 'ore') return vistaOre();
    if (sezione === 'pagamenti') return vistaPagamenti();
    if (sezione === 'impostazioni') return vistaImpostazioni();
    return vistaChecklist();
  },

  aggancia(root, contesto){
    root.addEventListener('click', async e => {
      const g = e.target.closest('[data-gruppo]');
      if (g) {
        const id = g.dataset.gruppo;
        aperti.has(id) ? aperti.delete(id) : aperti.add(id);
        contesto.ridisegna();
        return;
      }

      const ms = e.target.closest('[data-mese]');
      if (ms) {
        const n = parseInt(ms.dataset.mese, 10);
        if (n === 0) {
          meseScelto = iso(OGGI).slice(0, 7);
        } else {
          const [a, m] = meseScelto.split('-').map(Number);
          const d = new Date(a, m - 1 + n, 1);
          meseScelto = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        }
        contesto.ridisegna();
        return;
      }

      const sett = e.target.closest('[data-sett]');
      if (sett) {
        const n = parseInt(sett.dataset.sett, 10);
        const nuova = n === 0 ? lunedi() : piu(new Date(S.S.settimana + 'T00:00:00'), n * 7);
        S.carica(iso(nuova));
        return;
      }

      const seg = e.target.closest('[data-segna]');
      if (seg) {
        const voce = seg.dataset.voce, tipo = seg.dataset.segna;
        const attuale = S.spunta(voce);
        const v = S.S.dati.pulizie.voci.find(x => x.id === voce);

        // Se tocco di nuovo lo stato gia attivo, tolgo la spunta senza chiedere altro.
        if (attuale && attuale.stato === tipo) {
          S.applicaSpunta(voce, null, null, null, { silenzioso: true });
          if (!aggiornaRiga(root, voce)) contesto.ridisegna();
          const tolto = await prova(api.togliSpunta(voce, S.S.settimana));
          avviso(tolto ? 'Spunta tolta' : 'Non salvato: ' + (ultimoErrore.messaggio || 'errore'));
          return;
        }

        // Altrimenti chiedo sempre quando e stata fatta: niente data automatica.
        const r = await modaleData({
          titolo: v?.nome || voce,
          sottotitolo: tipo === 'fatto'
            ? 'Quando e stata completata?'
            : 'Quando e stata iniziata?',
          persone: S.S.dati.persone.filter(p => p.ruolo !== 'bambina'),
          personaScelta: attuale?.persona_id || S.S.dati.persone.find(p => p.ruolo === 'collaboratrice')?.id,
          mostraTogli: !!attuale
        });
        if (!r) return;

        if (r.azione === 'togli') {
          S.applicaSpunta(voce, null);
          prova(api.togliSpunta(voce, S.S.settimana));
          avviso('Spunta tolta');
          return;
        }

        S.applicaSpunta(voce, tipo, r.data, r.persona, { silenzioso: true });
        if (!aggiornaRiga(root, voce)) contesto.ridisegna();

        const salvato = await prova(api.spuntaPulizia({
          voce_id: voce, settimana: S.S.settimana, stato: tipo,
          data: iso(r.data), persona_id: r.persona }));

        if (salvato) {
          S.aggiungiRegistroLocale('pulizie', tipo, (v && v.nome) || voce, r.persona);
          avviso((tipo === 'fatto' ? 'Fatto il ' : 'Parziale dal ') + gm(r.data));
        } else {
          avviso('Non salvato: ' + (ultimoErrore.messaggio || 'errore'));
        }
        return;
      }

      // Nota su una singola voce di checklist
      const nv = e.target.closest('[data-nota-voce]');
      if (nv) {
        const voce = nv.dataset.notaVoce;
        const v = S.S.dati.pulizie.voci.find(x => x.id === voce);
        const attuale = S.spunta(voce);
        const r = await modaleForm({
          titolo: 'Nota su: ' + (v?.nome || voce), colore: COLORE,
          sottotitolo: 'Resta scritta sotto la voce per tutta la settimana.',
          valori: { nota: attuale?.nota || '' },
          campi: [{ nome:'nota', etichetta:'La nota', tipo:'testolungo',
                    placeholder:'Es. manca il detergente, rifatto solo meta' }],
          permettiElimina: !!attuale?.nota
        });
        if (!r) return;

        const testo = r.azione === 'elimina' ? '' : (r.valori.nota || '').trim();
        S.applicaNotaVoce(voce, testo);
        prova(api.spuntaPulizia({ voce_id: voce, settimana: S.S.settimana,
                                  stato: attuale?.stato || 'nota', nota: testo || null,
                                  data: iso(attuale ? new Date(attuale.data) : OGGI),
                                  persona_id: attuale?.persona_id || null }));
        avviso(testo ? 'Nota salvata' : 'Nota tolta');
        return;
      }

      const dt = e.target.closest('[data-data]');
      if (dt) {
        const voce = S.S.dati.pulizie.voci.find(v => v.id === dt.dataset.data);
        const attuale = S.spunta(voce.id);
        const r = await modaleData({
          titolo: voce.nome,
          sottotitolo: attuale
            ? 'Registrata il ' + gm(attuale.data) + '. Cambia la data se serve.'
            : 'Scegli quando è stata fatta.',
          persone: S.S.dati.persone.filter(p => p.ruolo !== 'bambina'),
          personaScelta: attuale?.persona_id || S.S.dati.persone.find(p => p.ruolo === 'collaboratrice')?.id
        });
        if (!r) return;
        if (r.azione === 'togli') {
          S.applicaSpunta(voce.id, null);
          prova(api.togliSpunta(voce.id, S.S.settimana));
        } else {
          S.applicaSpunta(voce.id, 'fatto', r.data, r.persona);
          S.aggiungiRegistroLocale('pulizie', 'fatto', voce.nome, r.persona);
          prova(api.spuntaPulizia({ voce_id: voce.id, settimana: S.S.settimana, stato: 'fatto',
                                    data: iso(r.data), persona_id: r.persona }));
          avviso('Registrata il ' + gm(r.data));
        }
        return;
      }

      // Aggiungi giornata: chiede giorno e orario, poi calcola le ore da sola
      if (e.target.closest('[data-nuova-giornata]')) {
        const opzChi = S.S.dati.persone.filter(p => p.ruolo !== 'bambina')
          .map(p => ({ id: p.id, nome: p.nome }));
        const r = await modaleForm({
          titolo: 'Aggiungi una giornata lavorata', colore: COLORE,
          sottotitolo: 'Le ore vengono calcolate dall orario di inizio e fine.',
          valori: { data: iso(OGGI), ora_inizio: '09:00', ora_fine: '12:00',
                    persona_id: S.S.dati.persone.find(p => p.ruolo === 'collaboratrice')?.id || '' },
          campi: [
            { nome:'data', etichetta:'Giorno', tipo:'data', richiesto:true },
            { nome:'ora_inizio', etichetta:'Ora di inizio', tipo:'ora', richiesto:true },
            { nome:'ora_fine', etichetta:'Ora di fine', tipo:'ora', richiesto:true },
            { nome:'persona_id', etichetta:'Chi ha lavorato', tipo:'select', opzioni: opzChi }
          ]
        });
        if (!r || r.azione !== 'salva') return;

        const { data, ora_inizio, ora_fine, persona_id } = r.valori;
        if (!data || !ora_inizio || !ora_fine) { avviso('Servono giorno, inizio e fine'); return; }

        const min = t => parseInt(t.slice(0,2),10) * 60 + parseInt(t.slice(3,5),10);
        const ore = Math.round((min(ora_fine) - min(ora_inizio)) / 6) / 10;
        if (ore <= 0) { avviso('L orario di fine deve venire dopo quello di inizio'); return; }

        const persona = S.persona(persona_id);
        S.S.dati.pulizie.ore.unshift({ id: 'loc' + Date.now(), persona_id,
          data, ora_inizio, ora_fine, ore, tariffa_oraria: persona?.tariffa_oraria ?? null });

        // Aspetto la risposta prima di ridisegnare: cosi la riga non puo essere
        // riportata indietro da una ricarica di sfondo partita nel frattempo.
        await prova(api.aggiungiOre({ data, ora_inizio, ora_fine, persona_id }));

        // Se la giornata cade in un'altra settimana, la card qui a fianco non
        // potrebbe mostrarla: sposto la vista sulla settimana giusta.
        const lunGiornata = iso(lunedi(new Date(data + 'T00:00:00')));
        if (lunGiornata !== S.S.settimana) {
          avviso('Giornata aggiunta, vado alla settimana del ' + gm(data));
          S.carica(lunGiornata);
          return;
        }

        S.avvisa();
        avviso('Giornata aggiunta: ' + String(ore).replace('.', ',') + ' ore');
        return;
      }

      /* ---- note della settimana ---- */
      if (e.target.closest('[data-note-settimana]')) {
        const chiave = chiaveNote(S.S.settimana);
        const mia = S.note(chiave)[0];
        const r = await modaleForm({
          titolo: 'Note della settimana', colore: COLORE,
          sottotitolo: 'Che cosa non e stato fatto, che cosa resta da recuperare.',
          valori: { testo: mia?.testo || '' },
          campi: [{ nome:'testo', etichetta:'Note', tipo:'testolungo',
                    placeholder:'Es. vetri non fatti, finiti i sacchi umido' }],
          permettiElimina: !!mia
        });
        if (!r) return;

        if (r.azione === 'elimina' && mia) {
          S.rimuoviNotaLocale(mia.id);
          await prova(api.eliminaNota(mia.id));
          avviso('Note tolte');
        } else if (r.azione === 'salva') {
          const testo = (r.valori.testo || '').trim();
          if (!testo && mia) {
            S.rimuoviNotaLocale(mia.id);
            await prova(api.eliminaNota(mia.id));
          } else if (mia) {
            S.modificaNotaLocale(mia.id, testo);
            await prova(api.modificaNota({ id: mia.id, testo }));
          } else if (testo) {
            S.aggiungiNotaLocale({ id:'loc'+Date.now(), modulo: chiave, testo,
                                   creato_il: new Date().toISOString() });
            await prova(api.creaNota({ modulo: chiave, testo }));
          }
          avviso('Note salvate');
        }
        S.avvisa();
        return;
      }

      /* ---- note libere per chi pulisce ---- */
      if (e.target.closest('[data-aggiungi-nota]')) {
        const campo = root.querySelector('#nuova-nota');
        const testo = (campo?.value || '').trim();
        if (!testo) { avviso('Scrivi prima la nota'); return; }
        S.aggiungiNotaLocale({ id: 'loc' + Date.now(), modulo: 'pulizie', testo,
                               creato_il: new Date().toISOString() });
        prova(api.creaNota({ modulo: 'pulizie', testo }));
        avviso('Nota aggiunta');
        return;
      }

      const modNota = e.target.closest('[data-mod-nota]');
      if (modNota) {
        const n = S.note('pulizie').find(x => String(x.id) === modNota.dataset.modNota);
        const r = await modaleForm({
          titolo: 'Modifica la nota', colore: COLORE, permettiElimina: true,
          valori: { testo: n.testo },
          campi: [{ nome:'testo', etichetta:'Testo della nota', tipo:'testolungo', richiesto:true }]
        });
        if (r?.azione === 'salva' && r.valori.testo.trim()) {
          S.modificaNotaLocale(n.id, r.valori.testo.trim());
          prova(api.modificaNota({ id: n.id, testo: r.valori.testo.trim() }));
          avviso('Nota aggiornata');
        } else if (r?.azione === 'elimina') {
          S.rimuoviNotaLocale(n.id);
          prova(api.eliminaNota(n.id));
          avviso('Nota eliminata');
        }
        return;
      }

      const elNota = e.target.closest('[data-elimina-nota]');
      if (elNota) {
        S.rimuoviNotaLocale(elNota.dataset.eliminaNota);
        prova(api.eliminaNota(elNota.dataset.eliminaNota));
        avviso('Nota eliminata');
        return;
      }

      /* ---- nuova voce / modifica / eliminazione ---- */
      const opzCat = S.categorie('pulizie').map(c => ({ id: c.id, nome: c.nome }));
      const opzFreq = Object.entries(FREQ).map(([id, nome]) => ({ id, nome }));
      const opzPersone = [{ id:'', nome:'Nessuno in particolare' }, ...S.S.dati.persone.map(p => ({ id:p.id, nome:p.nome }))];

      if (e.target.closest('[data-nuova-voce]')) {
        const r = await modaleForm({
          titolo: 'Nuova voce di checklist', colore: COLORE,
          campi: [
            { nome:'nome', etichetta:'Nome della voce', richiesto:true, placeholder:'Es. Vetri del salotto' },
            { nome:'categoria_id', etichetta:'Zona', tipo:'select', opzioni: opzCat, richiesto:true },
            { nome:'frequenza', etichetta:'Ogni quanto', tipo:'select', opzioni: opzFreq, difetto:'settimanale' },
            { nome:'icona', etichetta:'Icona (una emoji)', placeholder:'🧽', difetto:'🧽' }
          ]
        });
        if (r?.azione === 'salva' && r.valori.nome) {
          const nuova = { id:'loc'+Date.now(), ...r.valori, ogni_giorni: FREQ[r.valori.frequenza] ? undefined : 7 };
          S.aggiungiVoceLocale(nuova);
          prova(api.creaVoce(r.valori));
          avviso('Voce aggiunta alla checklist');
        }
        return;
      }

      const modVoce = e.target.closest('[data-mod-voce]');
      if (modVoce) {
        const v = S.S.dati.pulizie.voci.find(x => x.id === modVoce.dataset.modVoce);
        const r = await modaleForm({
          titolo: v.nome, colore: COLORE, permettiElimina: true,
          valori: { nome:v.nome, categoria_id:v.categoria_id, frequenza:v.frequenza, icona:v.icona },
          campi: [
            { nome:'nome', etichetta:'Nome della voce', richiesto:true },
            { nome:'categoria_id', etichetta:'Zona', tipo:'select', opzioni: opzCat },
            { nome:'frequenza', etichetta:'Ogni quanto', tipo:'select', opzioni: opzFreq },
            { nome:'icona', etichetta:'Icona' }
          ]
        });
        if (r?.azione === 'salva') {
          S.modificaVoceLocale(v.id, r.valori);
          prova(api.modificaVoce({ id: v.id, ...r.valori }));
          avviso('Voce aggiornata');
        } else if (r?.azione === 'elimina') {
          S.rimuoviVoceLocale(v.id);
          prova(api.eliminaVoce(v.id));
          avviso('Voce tolta dalla checklist');
        }
        return;
      }

      const elVoce = e.target.closest('[data-elimina-voce]');
      if (elVoce) {
        S.rimuoviVoceLocale(elVoce.dataset.eliminaVoce);
        prova(api.eliminaVoce(elVoce.dataset.eliminaVoce));
        avviso('Voce tolta dalla checklist');
        return;
      }

      /* ---- ore lavorate: modifica e cancellazione righe storiche ---- */
      const modOre = e.target.closest('[data-mod-ore]');
      if (modOre) {
        const o = S.S.dati.pulizie.ore.find(x => String(x.id) === modOre.dataset.modOre);
        const r = await modaleForm({
          titolo: 'Correggi la giornata', colore: COLORE, permettiElimina: true,
          valori: { data:o.data, ora_inizio:o.ora_inizio, ora_fine:o.ora_fine, persona_id:o.persona_id || '' },
          campi: [
            { nome:'data', etichetta:'Giorno', tipo:'data', richiesto:true },
            { nome:'ora_inizio', etichetta:'Ora inizio (es. 09:00)' },
            { nome:'ora_fine', etichetta:'Ora fine (es. 12:00)' },
            { nome:'persona_id', etichetta:'Chi', tipo:'select', opzioni: opzPersone }
          ]
        });
        if (r?.azione === 'salva') {
          S.modificaOreLocale(o.id, r.valori);
          prova(api.modificaOre({ id: o.id, ...r.valori }));
          avviso('Giornata corretta');
        } else if (r?.azione === 'elimina') {
          S.rimuoviOreLocale(o.id);
          prova(api.eliminaOre(o.id));
          avviso('Giornata eliminata');
        }
        return;
      }

      const elOre = e.target.closest('[data-elimina-ore]');
      if (elOre) {
        S.rimuoviOreLocale(elOre.dataset.eliminaOre);
        prova(api.eliminaOre(elOre.dataset.eliminaOre));
        avviso('Giornata eliminata');
        return;
      }

      if (e.target.closest('[data-salva-tariffa]')) {
        const id = e.target.closest('[data-salva-tariffa]').dataset.salvaTariffa;
        const nome = root.querySelector(`[data-persona-nome="${id}"]`).value.trim();
        const tariffa = Number(root.querySelector(`[data-persona-tariffa="${id}"]`).value) || 0;
        S.modificaPersonaLocale(id, { nome, tariffa_oraria: tariffa });
        prova(api.modificaPersona({ id, nome, tariffa_oraria: tariffa }));
        avviso('Nome e tariffa aggiornati');
        return;
      }

      /* ---- pagamenti ---- */
      const nuovoPag = e.target.closest('[data-nuovo-pag]');
      if (nuovoPag) {
        const personaId = nuovoPag.dataset.nuovoPag;
        const r = await modaleForm({
          titolo: 'Registra un pagamento', colore: COLORE,
          valori: { data: iso(OGGI) },
          campi: [
            { nome:'importo', etichetta:'Quanto hai pagato (€)', tipo:'numero', min:0, step:0.5, richiesto:true },
            { nome:'data', etichetta:'Quando', tipo:'data', richiesto:true },
            { nome:'nota', etichetta:'Nota', placeholder:'Es. Contanti, bonifico...' }
          ]
        });
        if (r?.azione === 'salva' && r.valori.importo) {
          const pag = { id:'loc'+Date.now(), persona_id: personaId, ...r.valori, importo: Number(r.valori.importo) };
          S.aggiungiPagamentoLocale(pag);
          prova(api.creaPagamento({ persona_id: personaId, ...r.valori }));
          avviso('Pagamento registrato');
        }
        return;
      }

      const modPag = e.target.closest('[data-mod-pag]');
      if (modPag) {
        const pag = (S.S.dati.pagamenti || []).find(x => String(x.id) === modPag.dataset.modPag);
        const r = await modaleForm({
          titolo: 'Modifica il pagamento', colore: COLORE, permettiElimina: true,
          valori: { importo: pag.importo, data: pag.data, nota: pag.nota || '' },
          campi: [
            { nome:'importo', etichetta:'Importo (€)', tipo:'numero', min:0, step:0.5, richiesto:true },
            { nome:'data', etichetta:'Quando', tipo:'data' },
            { nome:'nota', etichetta:'Nota' }
          ]
        });
        if (r?.azione === 'salva') {
          const v = { ...r.valori, importo: Number(r.valori.importo) };
          S.modificaPagamentoLocale(pag.id, v);
          prova(api.modificaPagamento({ id: pag.id, ...v }));
          avviso('Pagamento aggiornato');
        } else if (r?.azione === 'elimina') {
          S.rimuoviPagamentoLocale(pag.id);
          prova(api.eliminaPagamento(pag.id));
          avviso('Pagamento tolto');
        }
      }
      if (e.target.closest('[data-vai-pagamenti]')) {
        contesto.vai('pulizie', 'pagamenti');
      }
    });

    // Invio da tastiera nel campo della nota
    root.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.id === 'nuova-nota') {
        e.preventDefault();
        root.querySelector('[data-aggiungi-nota]')?.click();
      }
    });
  }
};
