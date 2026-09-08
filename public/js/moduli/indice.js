// Registro dei moduli. Aggiungerne uno nuovo domani significa
// creare il file, importarlo qui e aggiungerlo all'elenco. Nient'altro.

import home from './home.js';
import pulizie from './pulizie.js';
import calendario from './calendario.js';
import spesa from './spesa.js';
import attivita from './attivita.js';
import generali from './generali.js';

export const MODULI = [home, pulizie, calendario, spesa, attivita, generali];
export const modulo = id => MODULI.find(m => m.id === id) || MODULI[0];
