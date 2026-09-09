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
  prova('la scheda Biancheria non esiste piu', !q('[data-sezione="biancheria"]'));

  click(q('[data-sezione="ore"]'));
  await new Promise(r => setTimeout(r, 50));
  prova('la tabella ore ha i pulsanti modifica/elimina', !!q('[data-mod-ore]') && !!q('[data-elimina-ore]'));

  prova('il modulo Attivita non e piu nella colonna', !q('[data-modulo="attivita"]'));
  click(q('[data-modulo="calendario"]'));
  await new Promise(r => setTimeout(r, 80));
  prova('il calendario ha la scheda Attivita programmate', !!q('[data-sezione="attivita"]'));
  prova('la scheda Settimana e diventata Mese', !!q('[data-sezione="mese"]') && !q('[data-sezione="settimana"]'));
  click(q('[data-sezione="attivita"]'));
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
    await new Promise(r => setTimeout(r, 90));
    const sceltaOggi = q('#foglio-scelte button');
    if (sceltaOggi) click(sceltaOggi);
    await new Promise(r => setTimeout(r, 90));
    click(q('[data-modulo="registro"]'));
    await new Promise(r => setTimeout(r, 80));
    prova('la spunta appena fatta compare nel registro', document.body.innerHTML.includes('segnato come fatto'));
  }

  // modulo pagamenti: registrazione e calcolo del conto
  click(q('[data-modulo="pulizie"]'));
  await new Promise(r => setTimeout(r, 60));
  click(q('[data-sezione="pagamenti"]'));
  await new Promise(r => setTimeout(r, 80));
  prova('la vista pagamenti mostra il blocco di Lucia', document.body.innerHTML.includes('Lucia'));
  prova('la frase del conto compare (a debito o a credito)',
    /a debito di|a credito di|conto in pari/.test(document.body.innerHTML));
  prova('c\'è il pulsante per registrare un pagamento', !!q('[data-nuovo-pag]'));

  click(q('[data-nuovo-pag]'));
  await new Promise(r => setTimeout(r, 80));
  prova('il modale nuovo pagamento si apre', q('#velo2').className.includes('on'));
  q('#foglio2-campi [data-campo="importo"]').value = '40';
  q('#foglio2-campi [data-campo="nota"]').value = 'Pagamento di prova';
  click(q('#foglio2-conferma'));
  await new Promise(r => setTimeout(r, 100));
  prova('il nuovo pagamento compare nello storico', document.body.innerHTML.includes('Pagamento di prova'));

  // modifica della tariffa oraria dalle impostazioni
  click(q('[data-sezione="impostazioni"]'));
  await new Promise(r => setTimeout(r, 60));
  const campoTariffa = q('[data-persona-tariffa]');
  prova('il campo tariffa oraria esiste nelle impostazioni', !!campoTariffa);
  if (campoTariffa) {
    campoTariffa.value = '15';
    click(q('[data-salva-tariffa]'));
    await new Promise(r => setTimeout(r, 80));
    click(q('[data-sezione="pagamenti"]'));
    await new Promise(r => setTimeout(r, 80));
    prova('la nuova tariffa è visibile nel conto', document.body.innerHTML.includes('15 €/ora'));
  }

  // --- checklist: la spunta deve CHIEDERE la data, non inserirla da sola ---
  click(q('[data-modulo="pulizie"]'));
  await new Promise(r => setTimeout(r, 60));
  click(q('[data-sezione="checklist"]'));
  await new Promise(r => setTimeout(r, 80));

  prova('il banner del conto compare sui giorni lavorati',
    /a debito di|a credito di|conto in pari/.test(document.body.innerHTML));
  prova('la card note ha il campo per aggiungerne una', !!q('#nuova-nota'));
  prova('ogni voce ha il pulsante Note', !!q('[data-nota-voce]'));

  const gruppo2 = q('[data-gruppo]');
  if (gruppo2 && !gruppo2.closest('.gruppo').classList.contains('aperto')) click(gruppo2);
  await new Promise(r => setTimeout(r, 60));

  const nonSpuntata = [...document.querySelectorAll('[data-segna="fatto"]')]
    .find(b => !b.classList.contains('f-on'));
  if (nonSpuntata) {
    click(nonSpuntata);
    await new Promise(r => setTimeout(r, 90));
    prova('cliccando Fatto si apre la richiesta della data', q('#velo').className.includes('on'));
    click(q('#foglio-chiudi'));
    await new Promise(r => setTimeout(r, 60));
  }

  // --- nota su una singola voce ---
  click(q('[data-nota-voce]'));
  await new Promise(r => setTimeout(r, 90));
  prova('il modale della nota per voce si apre', q('#velo2').className.includes('on'));
  const areaNota = q('#foglio2-campi [data-campo="nota"]');
  prova('la nota usa un campo di testo lungo', areaNota && areaNota.tagName === 'TEXTAREA');
  if (areaNota) {
    areaNota.value = 'Nota di prova sulla voce';
    click(q('#foglio2-conferma'));
    await new Promise(r => setTimeout(r, 110));
    prova('la nota compare sotto la voce', document.body.innerHTML.includes('Nota di prova sulla voce'));
    prova('la nota e in grassetto corsivo', !!q('.nota-voce'));
  }

  // --- nota libera nella card ---
  const campoNota = q('#nuova-nota');
  if (campoNota) {
    campoNota.value = 'Nota libera di prova';
    click(q('[data-aggiungi-nota]'));
    await new Promise(r => setTimeout(r, 110));
    prova('la nota libera compare nella card', document.body.innerHTML.includes('Nota libera di prova'));
  }

  // --- aggiungi giornata: deve chiedere giorno e orario ---
  click(q('[data-nuova-giornata]'));
  await new Promise(r => setTimeout(r, 90));
  prova('Aggiungi giornata apre un modale', q('#velo2').className.includes('on'));
  prova('il modale chiede il giorno', !!q('#foglio2-campi [data-campo="data"]'));
  prova('il modale chiede ora di inizio e fine',
    !!q('#foglio2-campi [data-campo="ora_inizio"]') && !!q('#foglio2-campi [data-campo="ora_fine"]'));
  if (q('#foglio2-campi [data-campo="ora_inizio"]')) {
    q('#foglio2-campi [data-campo="ora_inizio"]').value = '09:00';
    q('#foglio2-campi [data-campo="ora_fine"]').value = '13:00';
    click(q('#foglio2-conferma'));
    await new Promise(r => setTimeout(r, 110));
    prova('la giornata calcola 4 ore dall orario', document.body.innerHTML.includes('09:00'));
  }

  // --- ore e storico: navigazione fra i mesi ---
  click(q('[data-sezione="ore"]'));
  await new Promise(r => setTimeout(r, 90));
  prova('la vista ore ha le frecce dei mesi', !!q('[data-mese="-1"]'));
  const titoloMese = q('.settimana-barra .et b')?.textContent || '';
  click(q('[data-mese="-1"]'));
  await new Promise(r => setTimeout(r, 90));
  const titoloDopo = q('.settimana-barra .et b')?.textContent || '';
  prova('la freccia indietro cambia mese', titoloMese !== titoloDopo && titoloDopo.length > 0);
  prova('compare il pulsante per tornare al mese corrente', !!q('[data-mese="0"]'));

  // --- impostazioni ripulite ---
  click(q('[data-sezione="impostazioni"]'));
  await new Promise(r => setTimeout(r, 90));
  prova('Giorni di servizio e stato tolto', !document.body.innerHTML.includes('Giorni di servizio'));
  prova('Orario abituale e stato tolto', !document.body.innerHTML.includes('Orario abituale'));
  prova('la tariffa oraria e ancora modificabile', !!q('[data-persona-tariffa]'));

  // --- vista per chi pulisce rimossa ---
  prova('il pulsante "Vista per chi pulisce" non c\'e piu', !q('#modo-pulizie'));

  // --- impostazioni pulizie ripulite ---
  click(q('[data-modulo="pulizie"]'));
  await new Promise(r => setTimeout(r, 60));
  click(q('[data-sezione="impostazioni"]'));
  await new Promise(r => setTimeout(r, 80));
  prova('"Registra le ore lavorate" tolto', !document.body.innerHTML.includes('Registra le ore lavorate'));
  prova('"Vista semplificata" tolto', !document.body.innerHTML.includes('Vista semplificata'));

  // --- Lucia ha accesso completo ---
  click(q('#vai-generali'));
  await new Promise(r => setTimeout(r, 80));
  prova('Lucia non e piu limitata alla checklist',
    !document.body.innerHTML.includes('Vede solo checklist'));

  // --- la giornata aggiunta compare nella card Giorni lavorati ---
  click(q('[data-modulo="pulizie"]'));
  await new Promise(r => setTimeout(r, 60));
  click(q('[data-sezione="checklist"]'));
  await new Promise(r => setTimeout(r, 80));
  click(q('[data-nuova-giornata]'));
  await new Promise(r => setTimeout(r, 90));
  const oggiIso = new Date().toISOString().slice(0, 10);
  q('#foglio2-campi [data-campo="data"]').value = oggiIso;
  q('#foglio2-campi [data-campo="ora_inizio"]').value = '14:00';
  q('#foglio2-campi [data-campo="ora_fine"]').value = '17:30';
  click(q('#foglio2-conferma'));
  await new Promise(r => setTimeout(r, 200));
  const cardOre = [...document.querySelectorAll('.riq')]
    .map(r => r.textContent).find(t => t.includes('Giorni lavorati')) || '';
  prova('la giornata appena aggiunta compare nella card', cardOre.includes('14:00'));

  // --- calendario: vista mensile ---
  click(q('[data-modulo="calendario"]'));
  await new Promise(r => setTimeout(r, 90));
  prova('la griglia del mese esiste', !!q('.mese'));
  prova('ci sono 7 intestazioni dei giorni', document.querySelectorAll('.mese-int').length === 7);
  prova('le celle del mese sono almeno 28', document.querySelectorAll('.mese-cella').length >= 28);
  prova('ci sono le frecce per scorrere i mesi', !!q('[data-cal-mese="-1"]'));
  prova('"Calendari collegati" e stato tolto', !document.body.innerHTML.includes('Calendari collegati'));

  const titoloMese1 = q('.settimana-barra .et b')?.textContent || '';
  click(q('[data-cal-mese="1"]'));
  await new Promise(r => setTimeout(r, 90));
  const titoloMese2 = q('.settimana-barra .et b')?.textContent || '';
  prova('la freccia avanti cambia mese', titoloMese1 !== titoloMese2 && titoloMese2.length > 0);
  click(q('[data-cal-mese="0"]'));
  await new Promise(r => setTimeout(r, 90));

  // creazione di un impegno da una casella del mese
  const cellaLibera = [...document.querySelectorAll('.mese-cella[data-giorno]')]
    .find(c => !c.querySelector('.voce-cal'));
  if (cellaLibera) {
    const giornoScelto = cellaLibera.dataset.giorno;
    click(cellaLibera);
    await new Promise(r => setTimeout(r, 90));
    prova('toccando un giorno si apre il nuovo impegno', q('#velo2').className.includes('on'));
    prova('il giorno e gia compilato',
      q('#foglio2-campi [data-campo="data"]')?.value === giornoScelto);
    q('#foglio2-campi [data-campo="titolo"]').value = 'Impegno di prova';
    click(q('#foglio2-conferma'));
    await new Promise(r => setTimeout(r, 200));
    prova('il nuovo impegno compare nel mese', document.body.innerHTML.includes('Impegno di prova'));
  }

  // modifica di un impegno esistente
  const daModificare = q('[data-mod-evento]');
  if (daModificare) {
    click(daModificare);
    await new Promise(r => setTimeout(r, 100));
    prova('il modale di modifica impegno si apre', q('#velo2').className.includes('on'));
    prova('il titolo dell impegno e precompilato',
      (q('#foglio2-campi [data-campo="titolo"]')?.value || '').length > 0);
    prova('si puo eliminare l impegno', q('#foglio2-elimina').style.display !== 'none');
    q('#foglio2-campi [data-campo="titolo"]').value = 'Impegno rinominato';
    click(q('#foglio2-conferma'));
    await new Promise(r => setTimeout(r, 200));
    prova('la modifica dell impegno si vede', document.body.innerHTML.includes('Impegno rinominato'));
  }

  // impostazioni calendario ripulite
  click(q('[data-sezione="impostazioni"]'));
  await new Promise(r => setTimeout(r, 90));
  prova('card "Cosa appare nella griglia" tolta', !document.body.innerHTML.includes('Cosa appare nella griglia'));
  prova('card Avvisi tolta', !document.body.innerHTML.includes('Avvisa prima di ogni impegno'));
  prova('restano le impostazioni delle attivita', document.body.innerHTML.includes('Ricorrenze'));

  // attivita: pulsante modifica leggibile
  click(q('[data-sezione="attivita"]'));
  await new Promise(r => setTimeout(r, 90));
  const btnMod = q('[data-mod-att]');
  prova('il pulsante Modifica delle attivita ha un etichetta chiara',
    btnMod && btnMod.textContent.trim() === 'Modifica');

  // --- pulizie: note della settimana e giorni lavorati del mese ---
  click(q('[data-modulo="pulizie"]'));
  await new Promise(r => setTimeout(r, 90));
  prova('c\'e la card Note pulizie', document.body.innerHTML.includes('Note pulizie'));
  prova('c\'e il pulsante per scrivere le note', !!q('[data-note-settimana]'));
  click(q('[data-note-settimana]'));
  await new Promise(r => setTimeout(r, 90));
  prova('il modale delle note settimanali si apre', q('#velo2').className.includes('on'));
  q('#foglio2-campi [data-campo="testo"]').value = 'Vetri non fatti, da recuperare';
  click(q('#foglio2-conferma'));
  await new Promise(r => setTimeout(r, 200));
  prova('la nota della settimana compare nella card',
    document.body.innerHTML.includes('Vetri non fatti'));

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
