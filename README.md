# Ferrafoni Home Planner

Planner di casa per iPad in landscape, con database su Cloudflare e accesso rapido
dall'iPhone tramite Comandi Rapidi.

## Come è fatto

```
├── public/              → il sito, è quello che Cloudflare pubblica
│   ├── index.html
│   ├── css/             → base.css (fondamenta) e app.css (impianto)
│   └── js/
│       ├── app.js       → colonna, schede, ridisegno
│       ├── stato.js     → unica fonte di verità, calcoli condivisi
│       ├── api.js       → chiamate al database, con rientro sui dati locali
│       ├── ui.js        → riquadri, righe, anelli, modale della data
│       ├── util.js      → date in italiano
│       ├── demo.js      → dati di prova, stessa forma delle API
│       └── moduli/      → un file per modulo, più indice.js
├── functions/api/       → le API, pubblicate insieme al sito
├── schema.sql           → tabelle del database
├── seed.sql             → dati iniziali (famiglia, checklist, biancheria)
└── wrangler.toml        → collegamento tra sito e database
```

### Aggiungere un modulo domani

Tre passaggi, niente altro:

1. una riga nella tabella `moduli` del database;
2. un file in `public/js/moduli/`, con la stessa forma degli altri
   (`id`, `nome`, `emoji`, `colore`, `sezioni`, `render`, `aggancia`);
3. l'import in `public/js/moduli/indice.js`.

La colonna di sinistra, le schede e i badge si costruiscono da soli.

---

## Aggiornamenti dopo la prima pubblicazione

Se il database è già online (hai già fatto il Passo 2) e stai solo aggiungendo
funzioni nuove, non serve rifare schema e seed da capo — cancellerebbero i dati
che hai già inserito. Ogni volta che aggiungo tabelle nuove ti indico un file
di migrazione a parte, con un nome tipo `migrazione-qualcosa.sql`.

Il modulo pagamenti, per esempio, usa `migrazione-pagamenti-console.sql`:
copialo nella Console di D1 su Cloudflare (stessa procedura di schema e seed)
ed eseguilo una volta sola. Aggiunge la tariffa oraria e lo storico dei
pagamenti senza toccare checklist, spesa o calendario già presenti.
Rinomina anche "Collaboratrice" in "Lucia" e imposta 12 €/ora: se il nome o
la cifra sono diversi, apri il file e modifica quelle due righe prima di
incollarlo, oppure correggi da Pulizie → Impostazioni dopo averlo eseguito.

---

## Passo 1 — Il repository su GitHub

```bash
cd ferrafoni-home-planner
git init
git add .
git commit -m "Prima versione del planner di casa"
git branch -M main
git remote add origin https://github.com/TUONOME/ferrafoni-home-planner.git
git push -u origin main
```

Il repository può restare privato: Cloudflare ci accede lo stesso.

---

## Passo 2 — Il database su Cloudflare

Serve Node.js sul computer. Tutti i comandi si danno dentro la cartella del progetto.

```bash
npx wrangler login                       # apre il browser, autorizzi una volta
npx wrangler d1 create ferrafoni-casa
```

L'ultimo comando stampa un `database_id`. Copialo dentro `wrangler.toml`
al posto di `METTI-QUI-L-ID-CHE-TI-DA-CLOUDFLARE`, poi crea le tabelle e i dati:

```bash
npx wrangler d1 execute ferrafoni-casa --remote --file=./schema.sql
npx wrangler d1 execute ferrafoni-casa --remote --file=./seed.sql
```

Verifica che sia andato tutto a posto:

```bash
npx wrangler d1 execute ferrafoni-casa --remote --command="SELECT count(*) FROM pulizie_voci"
```

Devono uscire 30 voci.

---

## Passo 3 — Pubblicare il sito

Nel pannello di Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**,
scegli il repository e imposta:

- Framework preset: **None**
- Build command: **lascia vuoto**
- Build output directory: **`public`**

Al primo salvataggio Cloudflare pubblica il sito e ti dà un indirizzo tipo
`ferrafoni-home-planner.pages.dev`.

### Collegare il database

Nel progetto appena creato: **Settings → Bindings → Add → D1 database**

- Variable name: **`DB`** (esattamente così, le API cercano questo nome)
- D1 database: **ferrafoni-casa**

### La chiave di casa

Sempre in **Settings → Variables and Secrets → Add**, tipo **Secret**:

- Nome: **`CASA_CHIAVE`**
- Valore: una frase lunga a piacere, per esempio `casa-ferrafoni-2026-lenzuola-verdi`

Senza questa chiave chiunque conosca l'indirizzo potrebbe scrivere nella lista.
Dopo averla aggiunta, fai un nuovo deploy dal pannello.

---

## Passo 4 — L'iPad

1. Apri l'indirizzo `.pages.dev` in Safari.
2. Vai su **Casa e famiglia**, scrivi la chiave nel campo e tocca **Salva e ricarica**.
   In alto a sinistra il pallino deve diventare verde con la scritta "collegata al database".
3. Tocca il pulsante di condivisione e scegli **Aggiungi a schermata Home**:
   l'app si apre a schermo intero, senza barra di Safari.

Se il pallino resta arancione l'app continua a funzionare con i dati di prova:
è il rientro di sicurezza, non un errore bloccante.

---

## Passo 5 — Il comando rapido dell'iPhone

Le istruzioni complete sono in [`docs/comando-rapido.md`](docs/comando-rapido.md).

---

## Lavorare in locale

```bash
cp .dev.vars.esempio .dev.vars     # e scrivi dentro la stessa CASA_CHIAVE
npx wrangler pages dev
```

Il sito e le API girano insieme su `http://localhost:8788`.
Per lavorare sul database locale invece che su quello vero, togli `--remote`
dai comandi `d1 execute`.

---

## Limiti del piano gratuito

Con quattro persone, un iPad e un iPhone si resta molto sotto le soglie:
100.000 richieste al giorno per le Functions e i limiti giornalieri di righe
lette e scritte su D1. Da settembre 2026 le query D1 che superano i limiti
falliscono invece di passare, quindi vale la pena tenere d'occhio la sezione
**Analytics** del pannello ogni tanto, ma non è un problema realistico
per una casa.
