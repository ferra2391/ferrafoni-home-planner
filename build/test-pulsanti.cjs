// Preme ogni pulsante di ogni schermata e segnala quelli che non rispondono
// o che sollevano errori. Misura anche quanti elementi ha la pagina, che su
// iPad e' la cosa che determina la fluidita'.
const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const RADICE = '/home/claude/hp/public';

const html = fs.readFileSync(path.join(RADICE,'index.html'),'utf8');
const bundle = fs.readFileSync(path.join(RADICE,'js/bundle.js'),'utf8');

const dom = new JSDOM(html.replace('<script src="/js/bundle.js" defer></script>',''),
  { url:'http://localhost/', pretendToBeVisual:true, runScripts:'outside-only' });
const { window } = dom;
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
window.fetch = () => Promise.reject(new Error('offline'));
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = () => {};

const errori = [];
window.addEventListener('error', e => errori.push(e.message));
const origErr = console.error;
console.error = (...a) => errori.push(String(a[0]));

window.eval(bundle);

const d = window.document;
const q = s => d.querySelector(s);
const qa = s => [...d.querySelectorAll(s)];
const click = el => { try { el.dispatchEvent(new window.MouseEvent('click', {bubbles:true})); }
                      catch(e){ errori.push(el.outerHTML.slice(0,60) + ' -> ' + e.message); } };
const pausa = ms => new Promise(r => setTimeout(r, ms));

const ATTRIBUTI = ['data-modulo','data-sezione','data-gruppo','data-segna','data-nota-voce','data-data',
  'data-nuova-giornata','data-note-settimana','data-aggiungi-nota','data-mod-nota','data-elimina-nota',
  'data-sett','data-mese','data-cal-mese','data-nuovo-evento','data-mod-evento','data-elimina-evento',
  'data-giorno','data-fatta','data-mod-att','data-nuova-attivita','data-preso','data-aggiungi',
  'data-veloce','data-suggerito','data-smista','data-mod-art','data-nuovo-pag','data-mod-pag',
  'data-mod-voce','data-elimina-voce','data-nuova-voce','data-mod-ore','data-elimina-ore',
  'data-nuova-persona','data-mod-persona','data-nuova-cat','data-mod-cat','data-filtro',
  'data-salva-tariffa','data-vai-pagamenti','data-testo-grande','data-salva-chiave-gen'];

(async () => {
  await pausa(400);

  const schermate = [
    ['pulizie','checklist'], ['pulizie','ore'], ['pulizie','pagamenti'], ['pulizie','impostazioni'],
    ['calendario','mese'], ['calendario','attivita'], ['calendario','impostazioni'],
    ['spesa','lista'], ['spesa','iphone'],
    ['registro','tutto'], ['home','oggi'], ['generali','casa']
  ];

  let totale = 0, senzaRisposta = 0;
  const muti = [];
  const pesi = [];

  for (const [mod, sez] of schermate) {
    if (!q('#app').className.includes('menu-chiuso')) { /* gia aperto */ } else click(q('#apri-menu'));
    await pausa(30);
    const bottoneModulo = q(`[data-modulo="${mod}"]`) || q('#vai-generali');
    click(bottoneModulo); await pausa(120);
    const scheda = q(`[data-sezione="${sez}"]`);
    if (scheda) { click(scheda); await pausa(120); }

    const nodi = d.querySelectorAll('#corpo *').length;
    pesi.push([mod + '/' + sez, nodi]);

    const selettore = ATTRIBUTI.map(a => '#corpo [' + a + ']').join(',');
    const chiave = el => {
      for (const a of ATTRIBUTI) if (el.hasAttribute(a)) return a + '=' + el.getAttribute(a);
      return el.outerHTML.slice(0, 40);
    };

    // apre tutte le zone: ogni apertura ridisegna, quindi si ricerca ogni volta
    for (let giro = 0; giro < 12; giro++) {
      const chiuso = qa('#corpo .gruppo:not(.aperto) > [data-gruppo]')[0];
      if (!chiuso) break;
      click(chiuso); await pausa(50);
    }

    // Si ripesca l'elenco a ogni giro: dopo un ridisegno i vecchi riferimenti
    // non sono piu' attaccati alla pagina, ed e' proprio cosi' che su iPad
    // un pulsante sembrava "non funzionare".
    const gia = new Set();
    for (let giro = 0; giro < 400; giro++) {
      const b = qa(selettore).find(x => !gia.has(chiave(x)));
      if (!b) break;
      gia.add(chiave(b));
      totale++;
      const prima = d.body.innerHTML;
      click(b);
      await pausa(25);
      const modale = (q('#velo2') && q('#velo2').className.includes('on'))
                  || (q('#velo') && q('#velo').className.includes('on'));
      if (d.body.innerHTML === prima && !modale) { senzaRisposta++; muti.push(mod + '/' + sez + ' ' + chiave(b)); }
      if (modale) {
        const chiudi = q('#foglio2-annulla') || q('#foglio-chiudi');
        click(chiudi); await pausa(40);
      }
      // se un tocco ha cambiato schermata si torna dove eravamo
      const schedaOra = q(`[data-sezione="${sez}"]`);
      if (schedaOra && !schedaOra.className.includes('on')) { click(schedaOra); await pausa(60); }
    }
  }

  console.log('Peso di ogni schermata (numero di elementi):');
  for (const [n, p] of pesi.sort((a,b)=>b[1]-a[1])) console.log('  ' + String(p).padStart(4) + '  ' + n);

  console.log('\nPulsanti premuti: ' + totale);
  console.log('Senza alcuna reazione: ' + senzaRisposta);
  console.log('Errori JavaScript: ' + errori.length);
  if (muti.length) { console.log('\nPulsanti senza reazione:'); for (const m of muti.slice(0,15)) console.log('   ' + m); }
  for (const e of errori.slice(0, 8)) console.log('   ' + e);
  process.exit(errori.length ? 1 : 0);
})();
