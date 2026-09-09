#!/usr/bin/env python3
"""
Genera anteprima.html: tutta l'app in un file solo, da aprire con un doppio clic.
Serve solo per guardare il risultato senza pubblicare nulla; la versione buona
è quella in public/, che Cloudflare serve come si deve.
"""
import json, pathlib, re, sys

RADICE = pathlib.Path(__file__).resolve().parent.parent
PUB = RADICE / "public"

def leggi(p):
    return (PUB / p).read_text(encoding="utf-8")

# tutti i moduli JS, con il percorso usato negli import
moduli = {}
for f in sorted((PUB / "js").rglob("*.js")):
    if f.name == "bundle.js":
        continue   # e il compilato, l'anteprima usa i sorgenti
    chiave = "/" + f.relative_to(PUB).as_posix()
    moduli[chiave] = f.read_text(encoding="utf-8")

html = leggi("index.html")

# L'anteprima usa i sorgenti a moduli, non il bundle: cosi resta leggibile
# e rispecchia sempre l'ultima modifica anche senza ricompilare.
html = html.replace('<script src="/js/bundle.js" defer></script>', '__SCRIPT__')

# stili: da collegamento esterno a blocco inline
stili = "\n".join(leggi("css/" + n) for n in ("base.css", "app.css"))
html = re.sub(r'<link rel="stylesheet"[^>]*>', "", html, count=2)
html = re.sub(r'<link rel="manifest"[^>]*>', "", html)
html = html.replace("</head>", f"<style>\n{stili}\n</style>\n</head>")

# il caricatore ricostruisce i moduli in memoria e rispetta gli import relativi
caricatore = """
<script>
const SORGENTI = __FILES__;
const fatti = new Map();

function risolvi(base, spec){
  if (!spec.startsWith('.')) return spec;
  const parti = base.split('/').slice(0, -1);
  for (const p of spec.split('/')) {
    if (p === '.') continue;
    else if (p === '..') parti.pop();
    else parti.push(p);
  }
  return parti.join('/');
}

function costruisci(percorso){
  if (fatti.has(percorso)) return fatti.get(percorso);
  let codice = SORGENTI[percorso];
  if (codice === undefined) throw new Error('Modulo mancante: ' + percorso);

  // prima le dipendenze, poi si riscrivono gli indirizzi
  codice = codice.replace(/(from\\s*|import\\s*\\(\\s*)['"]([^'"]+)['"]/g, (tutto, prima, spec) => {
    const p = risolvi(percorso, spec);
    return SORGENTI[p] !== undefined ? prima + "'" + costruisci(p) + "'" : tutto;
  });

  const url = URL.createObjectURL(new Blob([codice], { type: 'text/javascript' }));
  fatti.set(percorso, url);
  return url;
}

import(costruisci('/js/app.js')).catch(e => {
  document.getElementById('corpo').innerHTML =
    '<p class="vuoto">Anteprima non disponibile in questo contesto: ' + e.message + '</p>';
});
</script>
"""

html = html.replace('__SCRIPT__',
                    caricatore.replace("__FILES__", json.dumps(moduli, ensure_ascii=False)))

uscita = RADICE / "anteprima.html"
uscita.write_text(html, encoding="utf-8")
print("anteprima.html scritto,", len(html) // 1024, "KB,", len(moduli), "moduli inclusi")
