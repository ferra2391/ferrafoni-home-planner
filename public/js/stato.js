// Stato dell'applicazione: unica fonte di verità per tutti i moduli.
// I moduli non parlano tra loro, leggono da qui e si iscrivono ai cambiamenti.

import { caricaStato, rete } from './api.js';
import { OGGI, piu, iso, lunedi, data, scarto, scadenzaEtichetta } from './util.js';

const iscritti = new Set();

export const S = {
  dati: null,
  settimana: iso(lunedi()),
  caricamento: true,
  rete
};

export const iscriviti = fn => { iscritti.add(fn); return () => iscritti.delete(fn); };
export const avvisa = () => iscritti.forEach(fn => fn(S));

export async function carica(settimana = S.settimana){
  S.caricamento = true; avvisa();
  S.settimana = settimana;
  S.dati = await caricaStato(settimana);
  S.caricamento = false;
  avvisa();
}

/* ---------- letture comode ---------- */

export const persona = id => S.dati?.persone.find(p => p.id === id) || null;
export const nomePersona = id => persona(id)?.nome || '';
export const categorie = modulo => (S.dati?.categorie || []).filter(c => c.modulo === modulo);
export const categoria = id => S.dati?.categorie.find(c => c.id === id) || null;

export const impostazione = (modulo, chiave, difetto = '') =>
  S.dati?.impostazioni.find(i => i.modulo === modulo && i.chiave === chiave)?.valore ?? difetto;

export const spunta = voceId => S.dati?.pulizie.spunte.find(s => s.voce_id === voceId) || null;

/* ---------- calcoli condivisi ---------- */

export function avanzamentoPulizie(){
  const voci = S.dati?.pulizie.voci || [];
  const fatte = voci.filter(v => spunta(v.id)?.stato === 'fatto').length;
  const parziali = voci.filter(v => spunta(v.id)?.stato === 'parziale').length;
  return { totale: voci.length, fatte, parziali, restanti: voci.length - fatte,
           percento: voci.length ? Math.round(fatte / voci.length * 100) : 0 };
}

export function biancheriaConScadenza(){
  return (S.dati?.biancheria || []).map(b => {
    const prossimo = piu(data(b.ultimo_cambio), b.ogni_giorni);
    return { ...b, prossimo, giorni: scarto(prossimo), etichetta: scadenzaEtichetta(prossimo) };
  }).sort((a, b) => a.giorni - b.giorni);
}

export function attivitaConScadenza(){
  return (S.dati?.attivita || []).filter(a => a.scadenza).map(a => {
    const d = data(a.scadenza);
    return { ...a, quando: d, giorni: scarto(d), etichetta: scadenzaEtichetta(d) };
  }).sort((a, b) => a.giorni - b.giorni);
}

// Il riquadro rosso della home: tutto ciò che scade entro N giorni,
// da tre moduli diversi, ordinato per urgenza.
export function scadenzeSettimana(giorni = 7){
  const dentro = [];

  biancheriaConScadenza().forEach(b => {
    if (b.giorni <= giorni) dentro.push({
      titolo: b.nome, sotto: 'Biancheria, ogni ' + b.ogni_giorni + ' giorni',
      emoji: '🧺', modulo: 'pulizie', sezione: 'biancheria',
      giorni: b.giorni, etichetta: b.etichetta
    });
  });

  attivitaConScadenza().forEach(a => {
    if (a.giorni <= giorni) dentro.push({
      titolo: a.nome, sotto: (categoria(a.categoria_id)?.nome || 'Attività') + ' · ' + nomePersona(a.persona_id),
      emoji: categoria(a.categoria_id)?.icona || '🔔', modulo: 'attivita', sezione: 'scadenze',
      giorni: a.giorni, etichetta: a.etichetta
    });
  });

  // Voci settimanali non ancora spuntate quando la settimana sta per chiudersi.
  const fine = piu(new Date(S.settimana + 'T00:00:00'), 6);
  if (scarto(fine) >= 0 && scarto(fine) <= 2) {
    const mancanti = (S.dati?.pulizie.voci || []).filter(v => v.frequenza === 'settimanale' && !spunta(v.id));
    if (mancanti.length) dentro.push({
      titolo: mancanti.length + ' voci di pulizia da chiudere',
      sotto: 'La settimana finisce ' + (scarto(fine) === 0 ? 'oggi' : 'tra ' + scarto(fine) + ' giorni'),
      emoji: '🧽', modulo: 'pulizie', sezione: 'checklist',
      giorni: scarto(fine), etichetta: scadenzaEtichetta(fine)
    });
  }

  return dentro.sort((a, b) => a.giorni - b.giorni);
}

export const urgenti = () => scadenzeSettimana().filter(s => s.etichetta.urgente);

export function spesaDaPrendere(){
  return (S.dati?.spesa.articoli || []).filter(a => a.stato === 'da_prendere');
}

export function eventiDelGiorno(quando = OGGI){
  const g = iso(quando);
  return (S.dati?.eventi || []).filter(e => e.inizio.slice(0,10) === g)
    .sort((a, b) => a.inizio.localeCompare(b.inizio));
}

/* ---------- modifiche locali immediate ---------- */
// L'interfaccia risponde subito, la scrittura sul database viaggia dopo.

export function applicaSpunta(voceId, stato, quando, personaId){
  const arr = S.dati.pulizie.spunte;
  const i = arr.findIndex(s => s.voce_id === voceId);
  if (stato === null) { if (i >= 0) arr.splice(i, 1); }
  else {
    const riga = { voce_id: voceId, settimana: S.settimana, stato, data: iso(quando), persona_id: personaId };
    i >= 0 ? arr[i] = riga : arr.push(riga);
  }
  avvisa();
}

export function applicaCambioBiancheria(id, quando){
  const b = S.dati.biancheria.find(x => x.id === id);
  if (b) { b.ultimo_cambio = iso(quando); avvisa(); }
}

export function applicaSpesa(id, campi){
  const a = S.dati.spesa.articoli.find(x => x.id === id);
  if (a) { Object.assign(a, campi); avvisa(); }
}

export function aggiungiArticoloLocale(nome, quantita, categoriaId){
  S.dati.spesa.articoli.push({
    id: 'loc' + Date.now(), nome, quantita, categoria_id: categoriaId,
    stato: 'da_prendere', origine: 'tablet'
  });
  avvisa();
}

/* ---------- registro ---------- */
export const registro = (modulo) =>
  (S.dati?.registro || []).filter(r => !modulo || r.modulo === modulo);

export function aggiungiRegistroLocale(modulo, azione, dettaglio, personaId){
  if (!S.dati.registro) S.dati.registro = [];
  S.dati.registro.unshift({
    modulo, azione, dettaglio, persona_id: personaId,
    persona_nome: nomePersona(personaId), creato_il: new Date().toISOString()
  });
  avvisa();
}

/* ---------- categorie: creazione, modifica, eliminazione locale ---------- */
export function aggiungiCategoriaLocale(cat){
  S.dati.categorie.push(cat); avvisa();
}
export function modificaCategoriaLocale(id, campi){
  const c = S.dati.categorie.find(x => x.id === id);
  if (c) { Object.assign(c, campi); avvisa(); }
}
export function rimuoviCategoriaLocale(id){
  S.dati.categorie = S.dati.categorie.filter(c => c.id !== id); avvisa();
}

/* ---------- persone ---------- */
export function aggiungiPersonaLocale(p){ S.dati.persone.push(p); avvisa(); }
export function modificaPersonaLocale(id, campi){
  const p = persona(id);
  if (p) { Object.assign(p, campi); avvisa(); }
}

/* ---------- voci pulizie ---------- */
export function aggiungiVoceLocale(v){ S.dati.pulizie.voci.push(v); avvisa(); }
export function modificaVoceLocale(id, campi){
  const v = S.dati.pulizie.voci.find(x => x.id === id);
  if (v) { Object.assign(v, campi); avvisa(); }
}
export function rimuoviVoceLocale(id){
  S.dati.pulizie.voci = S.dati.pulizie.voci.filter(v => v.id !== id); avvisa();
}

/* ---------- biancheria: config ---------- */
export function aggiungiBiancheriaLocale(b){ S.dati.biancheria.push(b); avvisa(); }
export function modificaBiancheriaLocale(id, campi){
  const b = S.dati.biancheria.find(x => x.id === id);
  if (b) { Object.assign(b, campi); avvisa(); }
}
export function rimuoviBiancheriaLocale(id){
  S.dati.biancheria = S.dati.biancheria.filter(b => b.id !== id); avvisa();
}

/* ---------- ore lavorate: modifica e cancellazione righe storiche ---------- */
export function modificaOreLocale(id, campi){
  const o = S.dati.pulizie.ore.find(x => String(x.id) === String(id));
  if (o) { Object.assign(o, campi); avvisa(); }
}
export function rimuoviOreLocale(id){
  S.dati.pulizie.ore = S.dati.pulizie.ore.filter(o => String(o.id) !== String(id)); avvisa();
}

/* ---------- attività ---------- */
export function aggiungiAttivitaLocale(a){ S.dati.attivita.push(a); avvisa(); }
export function modificaAttivitaLocale(id, campi){
  const a = S.dati.attivita.find(x => x.id === id);
  if (a) { Object.assign(a, campi); avvisa(); }
}
export function rimuoviAttivitaLocale(id){
  S.dati.attivita = S.dati.attivita.filter(a => a.id !== id); avvisa();
}

/* ---------- eventi ---------- */
export function aggiungiEventoLocale(e){ S.dati.eventi.push(e); avvisa(); }
export function modificaEventoLocale(id, campi){
  const e = S.dati.eventi.find(x => x.id === id);
  if (e) { Object.assign(e, campi); avvisa(); }
}
export function rimuoviEventoLocale(id){
  S.dati.eventi = S.dati.eventi.filter(e => e.id !== id); avvisa();
}

/* ---------- spesa ricorrenti ---------- */
export function aggiungiRicorrenteLocale(r){ S.dati.spesa.ricorrenti.push(r); avvisa(); }
export function rimuoviRicorrenteLocale(id){
  S.dati.spesa.ricorrenti = S.dati.spesa.ricorrenti.filter(r => r.id !== id); avvisa();
}
