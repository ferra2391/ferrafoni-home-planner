# Il comando rapido "Spesa di casa"

Un'icona sulla schermata home dell'iPhone che chiede se vuoi vedere la lista
o aggiungere qualcosa, e in entrambi i casi parla direttamente con l'iPad.

## Prima di iniziare

Ti servono due cose:

- l'indirizzo del sito, per esempio `https://ferrafoni-home-planner.pages.dev`
- la chiave di casa, la stessa messa in `CASA_CHIAVE` su Cloudflare

L'indirizzo completo da usare è:

```
https://ferrafoni-home-planner.pages.dev/api/shortcut
```

## Costruire il comando

Apri **Comandi Rapidi → +** e aggiungi le azioni in quest'ordine.

**1. Menu**
Cerca l'azione **Scegli dal menu**. Come richiesta scrivi:
`Spesa di casa: che cosa vuoi fare?`
Crea due voci: `Vedi la lista` e `Aggiungi qualcosa`.

**2. Dentro "Vedi la lista"**

Aggiungi **Ottieni contenuto da URL** con questo indirizzo, sostituendo la chiave:

```
https://ferrafoni-home-planner.pages.dev/api/shortcut?azione=vedi&k=LA-TUA-CHIAVE
```

Sotto, aggiungi **Mostra risultato** e passagli il contenuto ottenuto.
La lista arriva già formattata, un articolo per riga.

**3. Dentro "Aggiungi qualcosa"**

- **Chiedi input**: tipo Testo, domanda `Che cosa serve?`
- **Codifica URL**: passagli l'input appena chiesto (serve per gli spazi e gli accenti)
- **Ottieni contenuto da URL**, costruendo l'indirizzo così:

```
https://ferrafoni-home-planner.pages.dev/api/shortcut?azione=aggiungi&persona=davide&k=LA-TUA-CHIAVE&testo=
```

e attaccando in fondo il testo codificato.

- **Mostra notifica** con il contenuto ottenuto: risponde per esempio
  *"Aggiunto: latte, pane. In lista ora ci sono 11 articoli."*

**4. L'icona**

Dalle impostazioni del comando scegli **Aggiungi a schermata Home**,
dai il nome `Spesa` e scegli un'icona. Da quel momento basta un tocco.

## Dettagli utili

- Più articoli in una volta sola: separali con la virgola o con "e".
  `latte, pane e uova` diventa tre righe distinte.
- Se un articolo è già in lista non viene duplicato: il comando risponde
  che era già tutto presente.
- Il campo `persona` è facoltativo e serve solo a far vedere sull'iPad
  chi ha aggiunto cosa. Metti `davide` sul tuo telefono e `vivien` sul suo.
- L'iPad ricontrolla il database ogni trenta secondi e ogni volta che
  lo schermo si riaccende, quindi l'articolo compare quasi subito.

## Con Siri

Nelle impostazioni del comando puoi dargli una frase, per esempio
"aggiungi alla spesa". Da lì funziona anche a mani occupate.

## Se qualcosa non va

- **Risponde "Chiave di casa non valida"**: la `k=` nell'indirizzo non coincide
  con `CASA_CHIAVE` su Cloudflare. Attenzione a spazi in più incollando.
- **Risponde "Database non collegato"**: manca il binding `DB` nelle impostazioni
  del progetto Pages, oppure il deploy dopo averlo aggiunto.
- **Gli accenti diventano simboli strani**: manca l'azione **Codifica URL**
  prima di comporre l'indirizzo.
