// Client delle API. Se il backend non risponde l'app continua a funzionare
// con i dati dimostrativi e segnala lo stato nella colonna di sinistra.

import { demo } from './demo.js';

const CHIAVE = 'ferrafoni.chiave';

export const rete = { collegata: false, ultimo: null, motivo: 'non provata' };

export const chiave     = ()  => localStorage.getItem(CHIAVE) || '';
export const salvaChiave = v  => localStorage.setItem(CHIAVE, v || '');

async function chiama(percorso, opzioni = {}){
  const r = await fetch('/api' + percorso, {
    ...opzioni,
    headers: {
      'content-type': 'application/json',
      ...(chiave() ? { 'x-casa-chiave': chiave() } : {}),
      ...(opzioni.headers || {})
    }
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

export async function caricaStato(settimana){
  try {
    const d = await chiama('/stato?settimana=' + settimana);
    rete.collegata = true; rete.ultimo = new Date(); rete.motivo = 'collegata';
    return d;
  } catch (e) {
    rete.collegata = false; rete.motivo = 'dati locali';
    return demo(settimana);
  }
}

// Ogni scrittura aggiorna comunque lo stato in memoria: se la rete manca,
// l'app resta usabile e la modifica resta visibile fino al ricaricamento.
export const api = {
  spuntaPulizia : d => chiama('/pulizie/spunte', { method:'POST', body: JSON.stringify(d) }),
  togliSpunta   : (voce, settimana) =>
    chiama(`/pulizie/spunte?voce_id=${voce}&settimana=${settimana}`, { method:'DELETE' }),
  aggiungiOre   : d => chiama('/pulizie/ore', { method:'POST', body: JSON.stringify(d) }),
  cambioBiancheria: d => chiama('/biancheria', { method:'POST', body: JSON.stringify(d) }),
  aggiungiSpesa : d => chiama('/spesa', { method:'POST', body: JSON.stringify(d) }),
  modificaSpesa : (id, d) => chiama('/spesa/' + id, { method:'PATCH', body: JSON.stringify(d) }),
  rimuoviSpesa  : id => chiama('/spesa/' + id, { method:'DELETE' }),
  attivitaFatta : id => chiama('/attivita', { method:'PATCH', body: JSON.stringify({ id, fatta:true }) }),
  salvaImpostazioni: (modulo, valori) =>
    chiama('/impostazioni', { method:'PUT', body: JSON.stringify({ modulo, valori }) })
};

// Le scritture non devono mai bloccare l'interfaccia: si tenta, e se fallisce
// si continua in locale. L'utente vede subito il risultato.
export async function prova(promessa){
  try { await promessa; return true; } catch { return false; }
}
