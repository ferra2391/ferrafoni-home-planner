// Utilità comuni: date in italiano e scorciatoie per il DOM.

export const GG  = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
export const GG3 = ['dom','lun','mar','mer','gio','ven','sab'];
export const MM  = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto',
                    'settembre','ottobre','novembre','dicembre'];

export const inizioGiorno = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
export const OGGI = inizioGiorno(new Date());

export const piu = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const lunedi = (d = OGGI) => piu(inizioGiorno(d), -((inizioGiorno(d).getDay() + 6) % 7));
export const iso = d => new Date(d).toISOString().slice(0,10);
export const data = s => inizioGiorno(new Date(String(s).slice(0,10) + 'T00:00:00'));
export const scarto = d => Math.round((inizioGiorno(d) - OGGI) / 86400000);

export const gm = d => String(new Date(d).getDate()).padStart(2,'0') + '/' +
                       String(new Date(d).getMonth()+1).padStart(2,'0');
export const breve = d => new Date(d).getDate() + ' ' + MM[new Date(d).getMonth()].slice(0,3);

export function relativa(d){
  const n = scarto(d);
  if (n === 0)  return 'oggi';
  if (n === 1)  return 'domani';
  if (n === -1) return 'ieri';
  if (n < 0)    return -n + ' giorni fa';
  if (n < 7)    return GG[new Date(d).getDay()];
  return breve(d);
}

// Etichetta breve per le scadenze: "in ritardo", "oggi", "tra 3 g".
export function scadenzaEtichetta(d){
  const n = scarto(d);
  if (n < 0)  return { testo: n === -1 ? 'ieri' : -n + ' g di ritardo', classe: 'rossa', urgente: true };
  if (n === 0) return { testo: 'oggi', classe: 'rossa', urgente: true };
  if (n <= 2)  return { testo: 'tra ' + n + ' g', classe: 'ambra', urgente: false };
  return { testo: 'tra ' + n + ' g', classe: 'neutra', urgente: false };
}

export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

export const plurale = (n, uno, tanti) => n + ' ' + (n === 1 ? uno : tanti);

export function avviso(testo){
  let el = document.querySelector('.avviso');
  if (!el) { el = document.createElement('div'); el.className = 'avviso'; document.body.appendChild(el); }
  el.textContent = testo;
  requestAnimationFrame(() => el.classList.add('on'));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('on'), 2600);
}
