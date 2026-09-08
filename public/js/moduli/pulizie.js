// Modulo pulizie. La checklist è divisa per zona: si apre una zona alla volta,
// così su tablet non si scorre mai un elenco di trenta righe.

import { esc, gm, breve, iso, piu, lunedi, OGGI, scarto, plurale, avviso } from '../util.js';
import { riq, tabella, anello, barra, interruttore, rigaCfg, vuoto } from '../ui.js';
import { modaleData, modaleForm } from '../ui.js';
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
      <td style="text-align:right">
        <div class="riga-azioni" style="justify-content:flex-end;display:inline-flex">
          <button class="btn piccolo" style="background:var(--pulizie)" data-cambio="${b.id}">Cambiato</button>
          <button data-storico="${b.id}" title="Storico">🕐</button>
          <button data-mod-bianc="${b.id}" title="Modifica">✎</button>
        </div>
      </td>
    </tr>`);

  const scorte = lista.filter(b => b.scorta <= b.scorta_minima);

  return `<div class="griglia g-lato">
    ${riq('Cambi biancheria', tabella(['Cosa', 'Ogni', 'Ultimo cambio', 'Stato', ''], righe) +
        `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
           <button class="btn chiaro pieno" data-nuovo-bianc>Aggiungi articolo</button></div>`,
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
      <div id="storico-bianc"></div>
    </div>
  </div>`;
}

function vistaStoricoBiancheria(b, cambi){
  return riq('Storico · ' + b.nome, cambi.length
    ? cambi.map(c => `
      <div class="log-riga">
        <span class="log-punto" style="--c:var(--pulizie)"></span>
        <span class="tx"><strong>${gm(c.data)}</strong><span>${esc(c.persona_nome || 'senza nome')}</span></span>
        <button data-elimina-cambio="${c.id}" style="color:var(--rosso);font-size:.85rem">Togli</button>
      </div>`).join('')
    : vuoto('Nessun cambio registrato ancora'),
    { raso: true, classe: 'tinta', colore: COLORE });
}

/* ---------- ore e storico ---------- */

function vistaOre(){
  const ore = S.S.dati.pulizie.ore;
  const mese = ore.filter(o => o.data.slice(0, 7) === iso(OGGI).slice(0, 7));
  const totMese = mese.reduce((s, o) => s + o.ore, 0);
  const lucia = S.S.dati.persone.find(p => p.ruolo === 'collaboratrice');
  const conto = lucia ? S.contoPersona(lucia.id) : null;

  return `<div class="griglia g-lato">
    ${riq('Registro giornate', tabella(['Giorno', 'Orario', 'Ore', 'Chi', ''],
      ore.map(o => `<tr>
        <td>${esc(new Date(o.data).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long' }))}</td>
        <td class="num">${esc(o.ora_inizio || '')} – ${esc(o.ora_fine || '')}</td>
        <td class="num">${String(o.ore).replace('.', ',')}</td>
        <td>${esc(S.nomePersona(o.persona_id))}</td>
        <td style="text-align:right"><div class="riga-azioni" style="justify-content:flex-end;display:inline-flex">
          <button data-mod-ore="${o.id}" title="Modifica">✎</button>
          <button data-elimina-ore="${o.id}" title="Elimina" style="color:var(--rosso)">🗑</button>
        </div></td></tr>`)),
      { raso: true, classe: 'tinta', colore: COLORE, meta: 'ultimi due mesi, anche passati si possono correggere' })}
    <div class="griglia" style="align-content:start">
      ${riq('Questo mese', `
        <div style="display:flex;align-items:center;gap:18px">
          <div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${String(totMese).replace('.', ',')}</b>
          <span class="occhiello" style="display:block">ore lavorate</span></div>
          <div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${mese.length}</b>
          <span class="occhiello" style="display:block">giornate</span></div>
        </div>
        <p class="nota">Il totale si aggiorna a ogni giornata registrata dalla checklist.</p>`)}
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
          <div class="elenco"><div>${voci.filter(v => v.categoria_id === c.id).map(v => `
            <div class="compito" style="min-height:64px">
              <span class="emj">${v.icona}</span>
              <span class="tx"><strong>${esc(v.nome)}</strong><span>${FREQ[v.frequenza]}</span></span>
              <div class="riga-azioni">
                <button data-mod-voce="${v.id}" title="Modifica">✎</button>
                <button data-elimina-voce="${v.id}" title="Togli dalla checklist" style="color:var(--rosso)">🗑</button>
              </div>
            </div>`).join('')}</div></div>
        </div>`).join('') +
        `<div style="padding:16px 18px;border-top:1px solid var(--linea-tenue)">
           <button class="btn chiaro pieno" data-nuova-voce>Aggiungi una voce</button>
           <p class="nota">Ogni voce ha la sua frequenza e la sua categoria. Cambiandole si aggiorna anche la prossima scadenza in home.</p>
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
        ${lucia ? `
        ${rigaCfg('Nome', 'Compare accanto a ogni spunta e nel modulo pagamenti.', `<input type="text" data-persona-nome="${lucia.id}" value="${esc(lucia.nome)}" style="min-width:170px">`)}
        ${rigaCfg('Tariffa oraria', 'Usata per calcolare quanto è dovuto in base alle ore lavorate.', `<div style="display:flex;align-items:center;gap:8px"><input type="number" min="0" step="0.5" data-persona-tariffa="${lucia.id}" value="${lucia.tariffa_oraria || 0}" style="min-width:90px"><span style="color:var(--tenue)">€/ora</span></div>`)}
        ` : `<li><span class="tx"><span>Nessuna persona con ruolo "chi pulisce". Aggiungila da Casa e famiglia.</span></span></li>`}
        ${rigaCfg('Giorni di servizio', '', `<select><option selected>Lunedì e giovedì</option><option>Solo lunedì</option><option>Tre volte a settimana</option></select>`)}
        ${rigaCfg('Orario abituale', '', `<input type="time" value="09:00" style="min-width:120px">`)}
        ${rigaCfg('Registra le ore lavorate', 'Tabella giorno, orario e ore con totale mensile.', interruttore(true, COLORE))}
        ${rigaCfg('Vista semplificata', 'Solo checklist e ore, senza calendario, spesa e attività.', interruttore(true, COLORE))}
      </ul>
      ${lucia ? `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
        <button class="btn chiaro pieno" data-salva-tariffa="${lucia.id}">Salva nome e tariffa</button>
      </div>` : ''}`)}
      ${riq('Promemoria', `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg('Avviso il mattino del servizio', 'Alle 08:00.', interruttore(true, COLORE))}
        ${rigaCfg('Segnala le voci scadute', 'Compaiono in rosso nel riquadro della home.', interruttore(true, COLORE))}
        ${rigaCfg('Riepilogo della domenica sera', '', interruttore(true, COLORE))}
      </ul>`)}
    </div>
  </div>`;
}

/* ---------- modulo ---------- */

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
    { id: 'biancheria', nome: 'Biancheria' },
    { id: 'ore', nome: 'Ore e storico' },
    { id: 'pagamenti', nome: 'Pagamenti' },
    { id: 'impostazioni', nome: 'Impostazioni' }
  ],

  distintivo(){
    const av = S.avanzamentoPulizie();
    return { n: av.restanti, caldo: false };
  },

  render(sezione){
    if (sezione === 'biancheria') return vistaBiancheria();
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
          const nomeVoce = S.S.dati.pulizie.voci.find(v => v.id === voce)?.nome || voce;
          S.applicaSpunta(voce, tipo, OGGI, chi);
          S.aggiungiRegistroLocale('pulizie', tipo, nomeVoce, chi);
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
          S.aggiungiRegistroLocale('pulizie', 'fatto', voce.nome, r.persona);
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
        S.aggiungiRegistroLocale('pulizie', 'cambio biancheria', b.nome, r.persona);
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

      /* ---- biancheria: nuovo articolo, modifica, storico ---- */
      if (e.target.closest('[data-nuovo-bianc]')) {
        const r = await modaleForm({
          titolo: 'Nuovo articolo di biancheria', colore: COLORE,
          campi: [
            { nome:'nome', etichetta:'Nome', richiesto:true, placeholder:'Es. Federe cuscini' },
            { nome:'ogni_giorni', etichetta:'Ogni quanti giorni si cambia', tipo:'numero', difetto:7, min:1 },
            { nome:'persona_id', etichetta:'Chi se ne occupa di solito', tipo:'select', opzioni: opzPersone },
            { nome:'scorta', etichetta:'Quanti pezzi in scorta', tipo:'numero', difetto:2, min:0 },
            { nome:'scorta_minima', etichetta:'Scorta minima prima di riordinare', tipo:'numero', difetto:2, min:0 }
          ]
        });
        if (r?.azione === 'salva' && r.valori.nome) {
          const nuovo = { id:'loc'+Date.now(), ...r.valori, ultimo_cambio: iso(OGGI) };
          S.aggiungiBiancheriaLocale(nuovo);
          prova(api.salvaBiancheria({ ...r.valori, ultimo_cambio: iso(OGGI) }));
          avviso('Articolo aggiunto');
        }
        return;
      }

      const modBianc = e.target.closest('[data-mod-bianc]');
      if (modBianc) {
        const b = S.S.dati.biancheria.find(x => x.id === modBianc.dataset.modBianc);
        const r = await modaleForm({
          titolo: b.nome, colore: COLORE, permettiElimina: true,
          valori: { nome:b.nome, ogni_giorni:b.ogni_giorni, persona_id:b.persona_id || '', scorta:b.scorta, scorta_minima:b.scorta_minima },
          campi: [
            { nome:'nome', etichetta:'Nome', richiesto:true },
            { nome:'ogni_giorni', etichetta:'Ogni quanti giorni', tipo:'numero', min:1 },
            { nome:'persona_id', etichetta:'Chi se ne occupa', tipo:'select', opzioni: opzPersone },
            { nome:'scorta', etichetta:'Pezzi in scorta', tipo:'numero', min:0 },
            { nome:'scorta_minima', etichetta:'Scorta minima', tipo:'numero', min:0 }
          ]
        });
        if (r?.azione === 'salva') {
          S.modificaBiancheriaLocale(b.id, r.valori);
          prova(api.salvaBiancheria({ id: b.id, ...r.valori }));
          avviso('Articolo aggiornato');
        } else if (r?.azione === 'elimina') {
          S.rimuoviBiancheriaLocale(b.id);
          prova(api.eliminaBiancheria(b.id));
          avviso('Articolo tolto');
        }
        return;
      }

      const storico = e.target.closest('[data-storico]');
      if (storico) {
        const b = S.S.dati.biancheria.find(x => x.id === storico.dataset.storico);
        const box = root.querySelector('#storico-bianc');
        box.innerHTML = '<p class="vuoto">Carico lo storico…</p>';
        try {
          const r = await api.storicoBiancheria(b.id);
          box.innerHTML = vistaStoricoBiancheria(b, r.cambi);
        } catch { box.innerHTML = vistaStoricoBiancheria(b, []); }
        box.scrollIntoView({ behavior:'smooth', block:'nearest' });
        return;
      }

      const elCambio = e.target.closest('[data-elimina-cambio]');
      if (elCambio) {
        prova(api.eliminaCambioBiancheria(elCambio.dataset.eliminaCambio));
        elCambio.closest('.log-riga').remove();
        avviso('Cambio tolto dallo storico');
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
  }
};
