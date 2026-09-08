const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const RADICE = path.join(__dirname, '..', 'public');

async function main(){
  const html = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true });
  const { window } = dom;

  global.window = window;
  global.document = window.document;
  global.localStorage = window.localStorage;
  global.navigator = window.navigator;
  global.MouseEvent = window.MouseEvent;
  global.HTMLElement = window.HTMLElement;
  global.requestAnimationFrame = fn => setTimeout(fn, 0);
  global.fetch = () => Promise.reject(new Error('rete non disponibile in questo test'));
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = () => {};

  await import('file://' + path.join(RADICE, 'js/app.js'));
  await new Promise(r => setTimeout(r, 300));

  const q = s => document.querySelector(s);
  const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  const risultati = [];
  const prova = (nome, cond) => risultati.push({ nome, ok: !!cond });

  prova('la home si è disegnata', q('#titolo')?.textContent === 'Oggi');
  prova('il pallino di rete è arancione (dati locali)', document.body.innerHTML.includes('dati locali'));

  click(q('[data-modulo="pulizie"]'));
  await new Promise(r => setTimeout(r, 50));
  click(q('[data-sezione="impostazioni"]'));
  await new Promise(r => setTimeout(r, 50));

  prova('la vista impostazioni pulizie ha voci con pulsante modifica', !!q('[data-mod-voce]'));
  prova('c\'è il pulsante "Aggiungi una voce"', !!q('[data-nuova-voce]'));

  const primaVoce = q('[data-mod-voce]');
  click(primaVoce);
  await new Promise(r => setTimeout(r, 80));
  prova('il modale generico si apre', q('#velo2').className.includes('on'));
  prova('il modale ha il campo nome valorizzato', q('#foglio2-campi [data-campo="nome"]')?.value?.length > 0);
  prova('il pulsante elimina è visibile in modifica', q('#foglio2-elimina').style.display !== 'none');

  click(q('#foglio2-annulla'));
  await new Promise(r => setTimeout(r, 50));
  prova('il modale si chiude con annulla', !q('#velo2').className.includes('on'));

  click(q('[data-nuova-voce]'));
  await new Promise(r => setTimeout(r, 80));
  prova('il modale "nuova voce" si apre', q('#velo2').className.includes('on'));
  const selCategoria = q('#foglio2-campi [data-campo="categoria_id"]');
  prova('il select categoria ha le 6 zone di pulizia', selCategoria?.options.length === 6);
  q('#foglio2-campi [data-campo="nome"]').value = 'Prova automatica';
  click(q('#foglio2-conferma'));
  await new Promise(r => setTimeout(r, 100));
  prova('la nuova voce compare nella lista dopo il salvataggio',
    document.body.innerHTML.includes('Prova automatica'));

  click(q('[data-modulo="pulizie"]'));
  await new Promise(r => setTimeout(r, 50));
  click(q('[data-sezione="biancheria"]'));
  await new Promise(r => setTimeout(r, 50));
  prova('la vista biancheria ha il pulsante aggiungi articolo', !!q('[data-nuovo-bianc]'));
  prova('ogni riga ha il pulsante storico', !!q('[data-storico]'));

  click(q('[data-sezione="ore"]'));
  await new Promise(r => setTimeout(r, 50));
  prova('la tabella ore ha i pulsanti modifica/elimina', !!q('[data-mod-ore]') && !!q('[data-elimina-ore]'));

  click(q('[data-modulo="attivita"]'));
  await new Promise(r => setTimeout(r, 80));
  prova('c\'è il pulsante "Nuova attività"', !!q('[data-nuova-attivita]'));
  click(q('[data-nuova-attivita]'));
  await new Promise(r => setTimeout(r, 80));
  const selCatAtt = q('#foglio2-campi [data-campo="categoria_id"]');
  prova('il form nuova attività ha le categorie di attività', selCatAtt?.options.length === 5);
  const selRic = q('#foglio2-campi [data-campo="ricorrenza_giorni"]');
  prova('il form ha le opzioni di ricorrenza', selRic?.options.length === 5);
  q('#foglio2-campi [data-campo="nome"]').value = 'Controllo caldaia test';
  q('#foglio2-campi [data-campo="scadenza"]').value = '2026-12-01';
  click(q('#foglio2-conferma'));
  await new Promise(r => setTimeout(r, 100));
  prova('la nuova attività compare in tabella', document.body.innerHTML.includes('Controllo caldaia test'));

  click(q('[data-modulo="registro"]'));
  await new Promise(r => setTimeout(r, 80));
  prova('il modulo Registro si apre', document.body.innerHTML.includes('registrazioni') || !!q('.log-riga'));
  prova('il registro mostra almeno una riga di log', !!q('.log-riga'));

  click(q('#vai-generali'));
  await new Promise(r => setTimeout(r, 80));
  prova('la vista generali ha le categorie per modulo', !!q('[data-nuova-cat]'));
  click(q('[data-nuova-cat]'));
  await new Promise(r => setTimeout(r, 80));
  prova('il modale nuova categoria si apre', q('#velo2').className.includes('on'));
  q('#foglio2-campi [data-campo="nome"]').value = 'Categoria di prova';
  click(q('#foglio2-conferma'));
  await new Promise(r => setTimeout(r, 100));
  prova('la nuova categoria compare tra le etichette', document.body.innerHTML.includes('Categoria di prova'));

  click(q('[data-modulo="pulizie"]'));
  await new Promise(r => setTimeout(r, 60));
  click(q('[data-sezione="checklist"]'));
  await new Promise(r => setTimeout(r, 60));
  const primoGruppo = q('[data-gruppo]');
  if (primoGruppo && !primoGruppo.closest('.gruppo').classList.contains('aperto')) click(primoGruppo);
  await new Promise(r => setTimeout(r, 60));
  const bottoneFatto = q('[data-segna="fatto"]');
  prova('esiste un pulsante Fatto nella checklist', !!bottoneFatto);
  if (bottoneFatto) {
    click(bottoneFatto);
    await new Promise(r => setTimeout(r, 60));
    click(q('[data-modulo="registro"]'));
    await new Promise(r => setTimeout(r, 80));
    prova('la spunta appena fatta compare nel registro', document.body.innerHTML.includes('segnato come fatto'));
  }

  console.log('');
  let falliti = 0;
  for (const r of risultati) {
    console.log((r.ok ? '  OK  ' : '  XX  ') + r.nome);
    if (!r.ok) falliti++;
  }
  console.log('');
  console.log(risultati.length + ' controlli, ' + falliti + ' falliti');
  process.exit(falliti ? 1 : 0);
}

main().catch(e => { console.error('ERRORE NEL TEST:', e); process.exit(1); });
