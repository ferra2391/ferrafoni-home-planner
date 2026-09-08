// Modulo pulizie. La checklist è divisa per zona: si apre una zona alla volta,
// così su tablet non si scorre mai un elenco di trenta righe.

import { esc, gm, breve, iso, piu, lunedi, OGGI, scarto, plurale, avviso } from '../util.js';
import { riq, tabella, anello, barra, interruttore, rigaCfg, vuoto } from '../ui.js';
import { modaleData } from '../ui.js';
import { api, prova } from '../api.js';
import * as S from '../stato.js';

const COLORE = 'var(--pulizie)';
const FREQ = {
  giornaliera: 'ogni giorno', settimanale: 'ogni settimana', quindicinale: 'ogni 2 settimane',
  mensile: 'ogni mese', trimestrale: 'ogni 3 mesi', stagionale: 'a ogni cambio stagione'
};

const aperti = new Set();
let primaVolta = true;

/* ---------- checklist ---------- */

function gruppo(cat, voci){
  const fatte = voci.filter(v => S.spunta(v.id)?.stato === 'fatto').length;
  const aperto = aperti.has(cat.id);
  const tutte = fatte === voci.length;

  return `
  <div class="gruppo ${aperto ? 'aperto' : ''}">
    <button class="capo" data-gruppo="${cat.id}">
      <span class="emj">${cat.icona || '•'}</span>
      <b>${esc(cat.nome)}</b>
      <span class="avanz">${fatte} di ${voci.length}${tutte ? ' · completata' : ''}</span>
      <span style="width:78px">${barra(voci.length ? fatte / voci.length * 100 : 0, COLORE)}</span>
      <span class="freccia"></span>
    </button>
    <div class="elenco"><div>${voci.map(compito).join('')}</div></div>
  </div>`;
}

function compito(v){
  const s = S.spunta(v.id);
  const stato = s?.stato;
  const scaduto = !stato && v.frequenza === 'settimanale' && scarto(piu(new Date(S.S.settimana + 'T00:00:00'), 6)) < 0;

  const timbro = s
    ? `<b>${gm(s.data)}</b>${esc(S.nomePersona(s.persona_id))}`
    : `<span style="color:var(--tenue-chiaro)">nessuna data</span>`;

  return `
  <div class="compito ${stato === 'fatto' ? 'fatto' : ''} ${scaduto ? 'scaduto' : ''}">
    <span class="emj">${v.icona || '•'}</span>
    <span class="tx"><strong>${esc(v.nome)}</strong><span>${FREQ[v.frequenza] || v.frequenza}</span></span>
    <button class="quando" data-data="${v.id}">${timbro}</button>
    <span class="segna">
      <button data-segna="fatto" data-voce="${v.id}" class="${stato === 'fatto' ? 'f-on' : ''}">Fatto</button>
      <button data-segna="parziale" data-voce="${v.id}" class="${stato === 'parziale' ? 'p-on' : ''}">Parziale</button>
    </span>
  </div>`;
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

function vistaChecklist(){
  const cats = S.categorie('pulizie');
  const voci = S.S.dati.pulizie.voci;

  if (primaVolta) {
    primaVolta = false;
    const prima = cats.find(c => voci.some(v => v.categoria_id === c.id && !S.spunta(v.id)));
    if (prima) aperti.add(prima.id);
  }

  const ore = S.S.dati.pulizie.ore.filter(o => o.data >= S.S.settimana && o.data <= iso(piu(new Date(S.S.settimana + 'T00:00:00'), 6)));
  const totale = ore.reduce((s, o) => s + o.ore, 0);

  return barraSettimana() + `
    <div class="griglia g-lato">
      ${riq('Checklist della settimana',
        cats.map(c => gruppo(c, voci.filter(v => v.categoria_id === c.id))).join(''),
        { raso: true, classe: 'tinta', colore: COLORE, meta: 'tocca Fatto o Parziale, la data si registra da sola' })}
      <div class="griglia" style="align-content:start">
        ${riq('Giorni lavorati',
          tabella(['Giorno', 'Orario', 'Ore'],
            ore.length ? ore.map(o => `<tr><td>${esc(new Date(o.data).toLocaleDateString('it-IT',{weekday:'long',day:'numeric'}))}</td>
              <td class="num">${esc(o.ora_inizio || '')} – ${esc(o.ora_fine || '')}</td>
              <td class="num">${String(o.ore).replace('.', ',')}</td></tr>`)
              : [`<tr><td colspan="3">${vuoto('Nessuna giornata registrata')}</td></tr>`]) +
          `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
             <button class="btn chiaro pieno" data-nuova-giornata>Aggiungi giornata</button></div>`,
          { raso: true, meta: String(totale).replace('.', ',') + ' ore questa settimana' })}
        ${riq('Note per chi pulisce', `<ul class="righe" style="margin:-16px -18px">
          <li><span class="tx"><strong>Lenzuola nell'armadio del corridoio</strong><span>Seconda anta, ripiano alto</span></span></li>
          <li><span class="tx"><strong>Niente candeggina in cucina</strong><span>Solo detergente neutro sul piano in legno</span></span></li>
          <li><span class="tx"><strong>Camera di Maddie dopo le 15:00</strong><span>Riposino fino alle 14:45</span></span></li>
        </ul>`)}
      </div>
    </div>`;
}

/* ---------- biancheria ---------- */

function vistaBiancheria(){
  const lista = S.biancheriaConScadenza();
  const righe = lista.map(b => `
    <tr>
      <td><b>${esc(b.nome)}</b><span class="sm">${esc(S.nomePersona(b.persona_id))}</span></td>
      <td>${b.ogni_giorni === 7 ? 'settimana' : b.ogni_giorni === 14 ? '2 settimane' : b.ogni_giorni + ' giorni'}</td>
      <td class="num">${gm(b.ultimo_cambio)}</td>
      <td><span class="pill ${b.etichetta.classe}">${esc(b.etichetta.testo)}</span></td>
      <td style="text-align:right"><button class="btn piccolo" style="background:var(--pulizie)" data-cambio="${b.id}">Cambiato</button></td>
    </tr>`);

  const scorte = lista.filter(b => b.scorta <= b.scorta_minima);

  return `<div class="griglia g-lato">
    ${riq('Cambi biancheria', tabella(['Cosa', 'Ogni', 'Ultimo cambio', 'Stato', ''], righe),
      { raso: true, classe: 'tinta', colore: COLORE, meta: 'in rosso quelli da fare adesso' })}
    <div class="griglia" style="align-content:start">
      ${riq('Scorte in armadio', lista.slice(0, 6).map(b => `
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;font-size:.86rem;margin-bottom:6px">
            <span>${esc(b.nome)}</span><span style="color:var(--tenue)">${b.scorta}</span></div>
          ${barra(Math.min(100, b.scorta / Math.max(1, b.scorta_minima * 2) * 100),
                  b.scorta <= b.scorta_minima ? 'var(--rosso)' : COLORE)}
        </div>`).join('') +
        (scorte.length ? `<p class="nota">${plurale(scorte.length, 'articolo è', 'articoli sono')} sotto scorta e ${scorte.length === 1 ? 'entra' : 'entrano'} da solo in lista della spesa.</p>` : ''))}
    </div>
  </div>`;
}

/* ---------- ore e storico ---------- */

function vistaOre(){
  const ore = S.S.dati.pulizie.ore;
  const mese = ore.filter(o => o.data.slice(0, 7) === iso(OGGI).slice(0, 7));
  const totMese = mese.reduce((s, o) => s + o.ore, 0);

  return `<div class="griglia g-lato">
    ${riq('Registro giornate', tabella(['Giorno', 'Orario', 'Ore', 'Chi'],
      ore.map(o => `<tr>
        <td>${esc(new Date(o.data).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' }))}</td>
        <td class="num">${esc(o.ora_inizio || '')} – ${esc(o.ora_fine || '')}</td>
        <td class="num">${String(o.ore).replace('.', ',')}</td>
        <td>${esc(S.nomePersona(o.persona_id))}</td></tr>`)),
      { raso: true, classe: 'tinta', colore: COLORE, meta: 'ultimi due mesi' })}
    <div class="griglia" style="align-content:start">
      ${riq('Questo mese', `
        <div style="display:flex;align-items:center;gap:18px">
          <div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${String(totMese).replace('.', ',')}</b>
          <span class="occhiello" style="display:block">ore lavorate</span></div>
          <div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${mese.length}</b>
          <span class="occhiello" style="display:block">giornate</span></div>
        </div>
        <p class="nota">Il totale si aggiorna a ogni giornata registrata dalla checklist.</p>`)}
    </div>
  </div>`;
}

/* ---------- impostazioni ---------- */

function vistaImpostazioni(){
  const cats = S.categorie('pulizie');
  const voci = S.S.dati.pulizie.voci;

  return `<div class="griglia g-lato">
    <div class="griglia" style="align-content:start">
      ${riq('Voci della checklist', cats.map(c => `
        <div class="gruppo ${aperti.has('cfg_' + c.id) ? 'aperto' : ''}">
          <button class="capo" data-gruppo="cfg_${c.id}">
            <span class="emj">${c.icona}</span><b>${esc(c.nome)}</b>
            <span class="avanz">${voci.filter(v => v.categoria_id === c.id).length} voci</span>
            <span class="freccia"></span></button>
          <div class="elenco"><div>${voci.filter(v => v.categoria_id === c.id).map(v => `
            <div class="compito" style="min-height:64px">
              <span class="emj">${v.icona}</span>
              <span class="tx"><strong>${esc(v.nome)}</strong></span>
              <select data-freq="${v.id}">${Object.entries(FREQ).map(([k, t]) =>
                `<option value="${k}" ${k === v.frequenza ? 'selected' : ''}>${t}</option>`).join('')}</select>
              ${interruttore(true, COLORE)}
            </div>`).join('')}</div></div>
        </div>`).join('') +
        `<div style="padding:16px 18px;border-top:1px solid var(--linea-tenue)">
           <button class="btn chiaro pieno">Aggiungi una voce</button>
           <p class="nota">Ogni voce ha la sua frequenza. Cambiandola si aggiorna anche la prossima scadenza in home.</p>
         </div>`,
        { raso: true, classe: 'tinta', colore: COLORE, meta: voci.length + ' voci attive' })}

      ${riq('Come funziona la checklist', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('La settimana inizia', '', `<select><option selected>Lunedì</option><option>Domenica</option></select>`)}
        ${rigaCfg('Registra la data quando spunto', 'Alla prima spunta salva la data di oggi, modificabile con un tocco.', interruttore(true, COLORE))}
        ${rigaCfg('Chiedi chi ha fatto la lavorazione', 'Mostra la scelta tra le persone di casa e chi viene a pulire.', interruttore(true, COLORE))}
        ${rigaCfg('Riporta le voci non fatte', 'Restano nella settimana nuova segnalate in rosso.', interruttore(true, COLORE))}
        ${rigaCfg('Blocca le settimane passate', 'Dopo la domenica lo storico non è più modificabile.', interruttore(false, COLORE))}
      </ul>`)}
    </div>

    <div class="griglia" style="align-content:start">
      ${riq('Chi pulisce', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Nome', 'Compare accanto a ogni spunta.', `<input type="text" value="${esc(S.impostazione('pulizie','nome_collaboratrice','Collaboratrice'))}" style="min-width:170px">`)}
        ${rigaCfg('Giorni di servizio', '', `<select><option selected>Lunedì e giovedì</option><option>Solo lunedì</option><option>Tre volte a settimana</option></select>`)}
        ${rigaCfg('Orario abituale', '', `<input type="time" value="09:00" style="min-width:120px">`)}
        ${rigaCfg('Registra le ore lavorate', 'Tabella giorno, orario e ore con totale mensile.', interruttore(true, COLORE))}
        ${rigaCfg('Vista semplificata', 'Solo checklist e ore, senza calendario, spesa e attività.', interruttore(true, COLORE))}
      </ul>`)}
      ${riq('Promemoria', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Avviso il mattino del servizio', 'Alle 08:00.', interruttore(true, COLORE))}
        ${rigaCfg('Segnala le voci scadute', 'Compaiono in rosso nel riquadro della home.', interruttore(true, COLORE))}
        ${rigaCfg('Riepilogo della domenica sera', '', interruttore(true, COLORE))}
      </ul>`)}
    </div>
  </div>`;
}

/* ---------- modulo ---------- */

export default {
  id: 'pulizie',
  nome: 'Pulizie',
  emoji: '🧽',
  colore: COLORE,
  sezioni: [
    { id: 'checklist', nome: 'Checklist' },
    { id: 'biancheria', nome: 'Biancheria' },
    { id: 'ore', nome: 'Ore e storico' },
    { id: 'impostazioni', nome: 'Impostazioni' }
  ],

  distintivo(){
    const av = S.avanzamentoPulizie();
    return { n: av.restanti, caldo: false };
  },

  render(sezione){
    if (sezione === 'biancheria') return vistaBiancheria();
    if (sezione === 'ore') return vistaOre();
    if (sezione === 'impostazioni') return vistaImpostazioni();
    return vistaChecklist();
  },

  aggancia(root){
    root.addEventListener('click', async e => {
      const g = e.target.closest('[data-gruppo]');
      if (g) {
        const id = g.dataset.gruppo;
        aperti.has(id) ? aperti.delete(id) : aperti.add(id);
        g.closest('.gruppo').classList.toggle('aperto');
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
        if (attuale?.stato === tipo) {
          S.applicaSpunta(voce, null);
          prova(api.togliSpunta(voce, S.S.settimana));
        } else {
          const chi = S.S.dati.persone.find(p => p.ruolo === 'collaboratrice')?.id || 'vivien';
          S.applicaSpunta(voce, tipo, OGGI, chi);
          prova(api.spuntaPulizia({ voce_id: voce, settimana: S.S.settimana, stato: tipo,
                                    data: iso(OGGI), persona_id: chi }));
          avviso(tipo === 'fatto' ? 'Segnato come fatto oggi' : 'Segnato come parziale');
        }
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
          prova(api.spuntaPulizia({ voce_id: voce.id, settimana: S.S.settimana, stato: 'fatto',
                                    data: iso(r.data), persona_id: r.persona }));
          avviso('Registrata il ' + gm(r.data));
        }
        return;
      }

      const cb = e.target.closest('[data-cambio]');
      if (cb) {
        const b = S.S.dati.biancheria.find(x => x.id === cb.dataset.cambio);
        const r = await modaleData({
          titolo: b.nome, sottotitolo: 'Quando è stato fatto il cambio?',
          persone: S.S.dati.persone.filter(p => p.ruolo !== 'bambina'),
          personaScelta: b.persona_id, mostraTogli: false
        });
        if (!r || r.azione !== 'segna') return;
        S.applicaCambioBiancheria(b.id, r.data);
        prova(api.cambioBiancheria({ id: b.id, data: iso(r.data), persona_id: r.persona }));
        avviso(b.nome + ' aggiornato al ' + gm(r.data));
        return;
      }

      if (e.target.closest('[data-nuova-giornata]')) {
        const chi = S.S.dati.persone.find(p => p.ruolo === 'collaboratrice')?.id;
        S.S.dati.pulizie.ore.unshift({ id: 'loc' + Date.now(), persona_id: chi,
          data: iso(OGGI), ora_inizio: '09:00', ora_fine: '12:00', ore: 3 });
        prova(api.aggiungiOre({ data: iso(OGGI), ora_inizio: '09:00', ora_fine: '12:00', persona_id: chi }));
        S.avvisa();
        avviso('Giornata di oggi aggiunta, 3 ore');
      }
    });
  }
};
