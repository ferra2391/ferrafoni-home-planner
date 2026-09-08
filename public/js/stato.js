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
