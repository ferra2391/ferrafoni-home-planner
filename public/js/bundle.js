(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // public/js/util.js
  var GG = ["domenica", "luned\xEC", "marted\xEC", "mercoled\xEC", "gioved\xEC", "venerd\xEC", "sabato"];
  var MM = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre"
  ];
  var MESI_LUNGHI = MM;
  var inizioGiorno = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  var OGGI = inizioGiorno(/* @__PURE__ */ new Date());
  var piu = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  var lunedi = (d = OGGI) => piu(inizioGiorno(d), -((inizioGiorno(d).getDay() + 6) % 7));
  var iso = (d) => new Date(d).toISOString().slice(0, 10);
  var data = (s) => inizioGiorno(/* @__PURE__ */ new Date(String(s).slice(0, 10) + "T00:00:00"));
  var scarto = (d) => Math.round((inizioGiorno(d) - OGGI) / 864e5);
  var gm = (d) => String(new Date(d).getDate()).padStart(2, "0") + "/" + String(new Date(d).getMonth() + 1).padStart(2, "0");
  var breve = (d) => new Date(d).getDate() + " " + MM[new Date(d).getMonth()].slice(0, 3);
  function relativa(d) {
    const n = scarto(d);
    if (n === 0) return "oggi";
    if (n === 1) return "domani";
    if (n === -1) return "ieri";
    if (n < 0) return -n + " giorni fa";
    if (n < 7) return GG[new Date(d).getDay()];
    return breve(d);
  }
  function scadenzaEtichetta(d) {
    const n = scarto(d);
    if (n < 0) return { testo: n === -1 ? "ieri" : -n + " g di ritardo", classe: "rossa", urgente: true };
    if (n === 0) return { testo: "oggi", classe: "rossa", urgente: true };
    if (n <= 2) return { testo: "tra " + n + " g", classe: "ambra", urgente: false };
    return { testo: "tra " + n + " g", classe: "neutra", urgente: false };
  }
  var $ = (s, r = document) => r.querySelector(s);
  var $$ = (s, r = document) => [...r.querySelectorAll(s)];
  var esc = (s) => String(s != null ? s : "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var plurale = (n, uno, tanti) => n + " " + (n === 1 ? uno : tanti);
  function avviso(testo) {
    let el = document.querySelector(".avviso");
    if (!el) {
      el = document.createElement("div");
      el.className = "avviso";
      document.body.appendChild(el);
    }
    el.textContent = testo;
    requestAnimationFrame(() => el.classList.add("on"));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("on"), 2600);
  }

  // public/js/ui.js
  var riq = (titolo, corpo, opzioni = {}) => `
  <section class="riq ${opzioni.classe || ""}" ${opzioni.colore ? `style="--c:${opzioni.colore}"` : ""}>
    ${titolo ? `<header><h3>${esc(titolo)}</h3>${opzioni.meta ? `<span class="meta">${esc(opzioni.meta)}</span>` : ""}</header>` : ""}
    <div class="dentro ${opzioni.raso ? "raso" : ""}">${corpo}</div>
  </section>`;
  var vuoto = (testo) => `<p class="vuoto">${esc(testo)}</p>`;
  function anello(percento, colore, misura = 62) {
    const r = (misura - 8) / 2, c = 2 * Math.PI * r;
    return `<svg class="anello" width="${misura}" height="${misura}" viewBox="0 0 ${misura} ${misura}" style="--c:${colore}">
    <circle class="sfondo" cx="${misura / 2}" cy="${misura / 2}" r="${r}"></circle>
    <circle class="avanti" cx="${misura / 2}" cy="${misura / 2}" r="${r}"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - percento / 100)}"></circle>
  </svg>`;
  }
  var barra = (percento, colore) => `<div class="barra" style="--c:${colore}"><i style="width:${Math.max(0, Math.min(100, percento))}%"></i></div>`;
  var tabella = (intestazioni, righe) => `
  <table class="tab"><thead><tr>${intestazioni.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
  <tbody>${righe.join("")}</tbody></table>`;
  var interruttore = (acceso, colore, dati = "") => `<span class="sw ${acceso ? "on" : ""}" style="--c:${colore}" ${dati}></span>`;
  var rigaCfg = (titolo, descrizione, controllo) => `
  <li><span class="tx"><strong>${esc(titolo)}</strong>${descrizione ? `<span>${esc(descrizione)}</span>` : ""}</span>${controllo}</li>`;
  var risolvi = null;
  function modaleData({ titolo, sottotitolo, persone = [], personaScelta, mostraTogli = true }) {
    const velo = $("#velo");
    $("#foglio-titolo").textContent = titolo;
    $("#foglio-sotto").textContent = sottotitolo || "";
    const etichette = ["Oggi", "Ieri", "Due giorni fa", "Tre giorni fa"];
    $("#foglio-scelte").innerHTML = etichette.map((et, i) => {
      const d = /* @__PURE__ */ new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      return `<button data-giorni="${-i}">${et}<small>${gm(d)}</small></button>`;
    }).join("");
    $("#foglio-persone").innerHTML = persone.length ? `
    <p class="occhiello" style="margin:0 0 9px">Chi l'ha fatta</p>
    <div class="segmenti" id="foglio-chi">
      ${persone.map((p) => `<button data-persona="${p.id}" class="${p.id === personaScelta ? "on" : ""}">${esc(p.nome)}</button>`).join("")}
    </div>` : "";
    $("#foglio-togli").style.display = mostraTogli ? "" : "none";
    const oggiIso = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    $("#foglio-data").value = oggiIso;
    velo.classList.add("on");
    return new Promise((res) => {
      risolvi = res;
    });
  }
  function chiudiModale(risposta = null) {
    $("#velo").classList.remove("on");
    if (risolvi) {
      risolvi(risposta);
      risolvi = null;
    }
  }
  var risolviForm = null;
  function campoHtml(c, valori) {
    var _a, _b, _c;
    const v = (_b = (_a = valori[c.nome]) != null ? _a : c.difetto) != null ? _b : "";
    if (c.tipo === "select") {
      return `<select data-campo="${c.nome}" ${c.richiesto ? "required" : ""}>
      ${c.opzioni.map((o) => `<option value="${o.id}" ${String(o.id) === String(v) ? "selected" : ""}>${esc(o.nome)}</option>`).join("")}
    </select>`;
    }
    if (c.tipo === "testolungo") {
      return `<textarea data-campo="${c.nome}" rows="3" placeholder="${esc(c.placeholder || "")}">${esc(v)}</textarea>`;
    }
    if (c.tipo === "ora") return `<input type="time" data-campo="${c.nome}" value="${esc(v)}">`;
    if (c.tipo === "numero") return `<input type="number" data-campo="${c.nome}" value="${esc(v)}" min="${(_c = c.min) != null ? _c : ""}" step="${c.step || 1}">`;
    if (c.tipo === "data") return `<input type="date" data-campo="${c.nome}" value="${esc(v)}">`;
    return `<input type="text" data-campo="${c.nome}" value="${esc(v)}" placeholder="${esc(c.placeholder || "")}">`;
  }
  function modaleForm({ titolo, sottotitolo, campi, valori = {}, colore = "var(--home)", permettiElimina = false }) {
    const velo = $("#velo2");
    $("#foglio2-titolo").textContent = titolo;
    $("#foglio2-sotto").textContent = sottotitolo || "";
    $("#foglio2-campi").innerHTML = campi.map((c) => `
    <div class="campo-riga">
      <label>${esc(c.etichetta)}${c.richiesto ? " *" : ""}</label>
      ${campoHtml(c, valori)}
    </div>`).join("");
    $("#foglio2-conferma").style.background = colore;
    $("#foglio2-elimina").style.display = permettiElimina ? "" : "none";
    velo.classList.add("on");
    return new Promise((res) => {
      risolviForm = res;
    });
  }
  function chiudiModaleForm(risultato = null) {
    $("#velo2").classList.remove("on");
    if (risolviForm) {
      risolviForm(risultato);
      risolviForm = null;
    }
  }
  function leggiForm() {
    const dati = {};
    $$("#foglio2-campi [data-campo]").forEach((el) => {
      dati[el.dataset.campo] = el.value;
    });
    return dati;
  }
  function agganciaModaleForm() {
    $("#foglio2-conferma").addEventListener("click", () => chiudiModaleForm({ azione: "salva", valori: leggiForm() }));
    $("#foglio2-elimina").addEventListener("click", () => chiudiModaleForm({ azione: "elimina" }));
    $("#foglio2-annulla").addEventListener("click", () => chiudiModaleForm(null));
    $("#velo2").addEventListener("click", (e) => {
      if (e.target.id === "velo2") chiudiModaleForm(null);
    });
  }
  function agganciaModale() {
    const velo = $("#velo");
    const chi = () => {
      var _a;
      return ((_a = $("#foglio-chi .on")) == null ? void 0 : _a.dataset.persona) || null;
    };
    $("#foglio-scelte").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const d = /* @__PURE__ */ new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + parseInt(b.dataset.giorni, 10));
      chiudiModale({ azione: "segna", data: d, persona: chi() });
    });
    $("#foglio-conferma").addEventListener("click", () => {
      const v = $("#foglio-data").value;
      if (v) chiudiModale({ azione: "segna", data: /* @__PURE__ */ new Date(v + "T00:00:00"), persona: chi() });
    });
    $("#foglio-togli").addEventListener("click", () => chiudiModale({ azione: "togli" }));
    $("#foglio-chiudi").addEventListener("click", () => chiudiModale(null));
    velo.addEventListener("click", (e) => {
      if (e.target === velo) chiudiModale(null);
    });
    document.addEventListener("click", (e) => {
      const b = e.target.closest("#foglio-chi button");
      if (!b) return;
      $("#foglio-chi").querySelectorAll("button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") chiudiModale(null);
    });
  }

  // public/js/demo.js
  var g = (n) => iso(piu(OGGI, n));
  var VOCI = [
    ["v01", "pul_bagno", "Bagno e sanitari", "\u{1F6BF}", "settimanale", 7],
    ["v02", "pul_bagno", "Specchi", "\u{1FA9E}", "settimanale", 7],
    ["v03", "pul_bagno", "Doccia e box", "\u{1F9F4}", "settimanale", 7],
    ["v04", "pul_bagno", "Cambio asciugamani", "\u{1F9FA}", "settimanale", 7],
    ["v05", "pul_bagno", "Tappetino bagno", "\u{1F9FD}", "settimanale", 7],
    ["v06", "pul_cucina", "Cucina e superfici", "\u{1F37D}\uFE0F", "settimanale", 7],
    ["v07", "pul_cucina", "Cambio strofinacci", "\u{1F9FB}", "settimanale", 7],
    ["v08", "pul_cucina", "Lavello e rubinetteria", "\u{1F6B0}", "settimanale", 7],
    ["v09", "pul_cucina", "Interno frigorifero", "\u{1F9CA}", "mensile", 30],
    ["v10", "pul_cucina", "Forno e piano cottura", "\u{1F525}", "mensile", 30],
    ["v11", "pul_cucina", "Filtri cappa", "\u{1F4A8}", "trimestrale", 90],
    ["v12", "pul_camere", "Cambio lenzuola e federe", "\u{1F6CF}\uFE0F", "quindicinale", 14],
    ["v13", "pul_camere", "Sotto i letti", "\u{1F6CC}", "quindicinale", 14],
    ["v14", "pul_camere", "Riordino giochi bambine", "\u{1F9F8}", "settimanale", 7],
    ["v15", "pul_camere", "Materassi, aspirare e girare", "\u{1FAB6}", "trimestrale", 90],
    ["v16", "pul_giorno", "Spolverare", "\u2728", "settimanale", 7],
    ["v17", "pul_giorno", "Sotto mobili e sedie", "\u{1FA91}", "settimanale", 7],
    ["v18", "pul_giorno", "Aspirare e lavare i pavimenti", "\u{1F9F9}", "settimanale", 7],
    ["v19", "pul_giorno", "Battiscopa", "\u{1F4D0}", "quindicinale", 14],
    ["v20", "pul_giorno", "Divano e cuscini", "\u{1F6CB}\uFE0F", "quindicinale", 14],
    ["v21", "pul_bianc", "Cambio accappatoi", "\u{1F97C}", "quindicinale", 14],
    ["v22", "pul_bianc", "Tovaglie e tovaglioli", "\u{1F37D}\uFE0F", "settimanale", 7],
    ["v23", "pul_bianc", "Bavaglini e grembiuli asilo", "\u{1F392}", "settimanale", 7],
    ["v24", "pul_bianc", "Pigiami bambine", "\u{1F45A}", "settimanale", 7],
    ["v25", "pul_fondo", "Vetri e finestre", "\u{1FA9F}", "mensile", 30],
    ["v26", "pul_fondo", "Termosifoni", "\u2668\uFE0F", "mensile", 30],
    ["v27", "pul_fondo", "Porte e maniglie", "\u{1F6AA}", "mensile", 30],
    ["v28", "pul_fondo", "Tende doccia e sifoni", "\u{1F9F4}", "trimestrale", 90],
    ["v29", "pul_fondo", "Tende di casa", "\u{1FA9F}", "stagionale", 120],
    ["v30", "pul_fondo", "Cambio stagione armadi", "\u{1F455}", "stagionale", 180]
  ];
  var BIANC = [
    ["b01", "Strofinacci cucina", 7, -5, "vivien", 2, 4],
    ["b02", "Asciugamani bagno", 7, -8, "collab", 6, 4],
    ["b03", "Tappetino bagno", 7, -6, "collab", 3, 2],
    ["b04", "Lenzuola matrimoniale", 14, -13, "collab", 3, 2],
    ["b05", "Lenzuola lettino Amelie", 14, -10, "vivien", 4, 2],
    ["b06", "Lenzuola lettino Maddie", 14, -16, "vivien", 4, 2],
    ["b07", "Accappatoi", 14, -9, "collab", 4, 2],
    ["b08", "Tovaglie", 7, -4, "davide", 5, 2],
    ["b09", "Bavaglini asilo", 7, -2, "vivien", 8, 4],
    ["b10", "Copriletto e plaid", 30, -24, "collab", 2, 1]
  ];
  var SPESA = [
    [1, "Pomodori da sugo", "1 kg", "sp_ortofrutta", "tablet", "vivien", "da_prendere"],
    [2, "Insalata", "2 buste", "sp_ortofrutta", "tablet", "vivien", "da_prendere"],
    [3, "Banane", "1 casco", "sp_ortofrutta", "tablet", "amelie", "preso"],
    [4, "Latte intero", "2 L", "sp_freschi", "iphone", "davide", "da_prendere"],
    [5, "Yogurt bambine", "6", "sp_freschi", "tablet", "vivien", "da_prendere"],
    [6, "Pannolini taglia 5", "1 pacco", "sp_bambine", "iphone", "vivien", "da_prendere"],
    [7, "Salviette", "2", "sp_bambine", "tablet", "vivien", "da_prendere"],
    [8, "Detersivo lavatrice", "1", "sp_casa", "ricorrente", null, "da_prendere"],
    [9, "Strofinacci nuovi", "4", "sp_casa", "scorta", null, "da_prendere"],
    [10, "Sacchi umido", "1 rotolo", "sp_casa", "tablet", "davide", "preso"]
  ];
  var ATT = [
    ["a01", "Manutenzione caldaia", "att_manut", "davide", -2, 365],
    ["a02", "Bollo auto", "att_doc", "davide", 1, 365],
    ["a03", "Filtri condizionatore", "att_manut", "davide", 4, 180],
    ["a04", "Visita dentista", "att_salute", "vivien", 12, 180],
    ["a05", "Iscrizione asilo Maddie", "att_bambine", "vivien", 19, 365],
    ["a06", "Cambio gomme", "att_auto", "davide", 26, 180]
  ];
  var EVENTI = [
    ["e01", "Nuoto Amelie", "famiglia", 0, "17:00", "amelie"],
    ["e02", "Riunione condominio", "famiglia", 1, "21:00", "davide"],
    ["e03", "Festa asilo", "asilo", 2, "10:00", "amelie"],
    ["e04", "Servizio pulizie", "famiglia", 3, "09:00", "collab"],
    ["e05", "Pediatra Maddie", "famiglia", 3, "16:00", "maddie"],
    ["e06", "Colloquio asilo", "asilo", 4, "17:00", "vivien"],
    ["e07", "Cena dai nonni", "famiglia", 5, "20:00", null],
    ["e08", "Parco con le bambine", "famiglia", 6, "10:30", null]
  ];
  function demo(settimana = iso(lunedi())) {
    const lun = /* @__PURE__ */ new Date(settimana + "T00:00:00");
    return {
      settimana,
      aggiornato: (/* @__PURE__ */ new Date()).toISOString(),
      persone: [
        { id: "davide", nome: "Davide", iniziali: "DA", ruolo: "adulto", colore: "#3D5BA9", tariffa_oraria: 0 },
        { id: "vivien", nome: "Vivien", iniziali: "VI", ruolo: "adulto", colore: "#2F7D6D", tariffa_oraria: 0 },
        { id: "amelie", nome: "Amelie", iniziali: "AM", ruolo: "bambina", colore: "#B9741F", tariffa_oraria: 0 },
        { id: "maddie", nome: "Maddie", iniziali: "MA", ruolo: "bambina", colore: "#9C3A5E", tariffa_oraria: 0 },
        { id: "collab", nome: "Lucia", iniziali: "LU", ruolo: "collaboratrice", colore: "#6E7A83", tariffa_oraria: 12 }
      ],
      moduli: [
        { id: "pulizie", nome: "Pulizie", colore: "#2F7D6D", ordine: 1 },
        { id: "calendario", nome: "Calendario", colore: "#3D5BA9", ordine: 2 },
        { id: "spesa", nome: "Lista della spesa", colore: "#B9741F", ordine: 3 },
        { id: "attivita", nome: "Attivit\xE0 programmate", colore: "#9C3A5E", ordine: 4 }
      ],
      categorie: [
        { id: "pul_bagno", modulo: "pulizie", nome: "Bagno", icona: "\u{1F6BF}", ordine: 1 },
        { id: "pul_cucina", modulo: "pulizie", nome: "Cucina", icona: "\u{1F37D}\uFE0F", ordine: 2 },
        { id: "pul_camere", modulo: "pulizie", nome: "Camere e letti", icona: "\u{1F6CF}\uFE0F", ordine: 3 },
        { id: "pul_giorno", modulo: "pulizie", nome: "Zona giorno", icona: "\u{1F6CB}\uFE0F", ordine: 4 },
        { id: "pul_bianc", modulo: "pulizie", nome: "Biancheria", icona: "\u{1F9FA}", ordine: 5 },
        { id: "pul_fondo", modulo: "pulizie", nome: "Pulizie di fondo", icona: "\u{1FA9F}", ordine: 6 },
        { id: "sp_ortofrutta", modulo: "spesa", nome: "Frutta e verdura", icona: "\u{1F96C}", ordine: 1 },
        { id: "sp_freschi", modulo: "spesa", nome: "Banco freschi", icona: "\u{1F9C0}", ordine: 2 },
        { id: "sp_dispensa", modulo: "spesa", nome: "Dispensa", icona: "\u{1F96B}", ordine: 3 },
        { id: "sp_bambine", modulo: "spesa", nome: "Bambine", icona: "\u{1F9F8}", ordine: 4 },
        { id: "sp_casa", modulo: "spesa", nome: "Casa e pulizia", icona: "\u{1F9FC}", ordine: 6 },
        { id: "att_manut", modulo: "attivita", nome: "Manutenzione", icona: "\u{1F527}", ordine: 1 },
        { id: "att_doc", modulo: "attivita", nome: "Documenti", icona: "\u{1F4C4}", ordine: 2 },
        { id: "att_salute", modulo: "attivita", nome: "Salute", icona: "\u{1FA7A}", ordine: 3 },
        { id: "att_auto", modulo: "attivita", nome: "Auto", icona: "\u{1F697}", ordine: 4 },
        { id: "att_bambine", modulo: "attivita", nome: "Bambine", icona: "\u{1F9D2}", ordine: 5 }
      ],
      impostazioni: [
        { modulo: "generali", chiave: "nome_casa", valore: "Casa Ferrafoni" },
        { modulo: "pulizie", chiave: "nome_collaboratrice", valore: "Collaboratrice" },
        { modulo: "attivita", chiave: "giorni_avanti", valore: "7" }
      ],
      pulizie: {
        voci: VOCI.map(([id, categoria_id, nome, icona, frequenza, ogni_giorni], i) => ({ id, categoria_id, nome, icona, frequenza, ogni_giorni, ordine: i })),
        spunte: [
          { voce_id: "v01", settimana, stato: "fatto", data: g(-1), persona_id: "collab" },
          { voce_id: "v02", settimana, stato: "fatto", data: g(-1), persona_id: "collab" },
          { voce_id: "v06", settimana, stato: "fatto", data: g(-1), persona_id: "collab" },
          { voce_id: "v14", settimana, stato: "parziale", data: g(0), persona_id: "vivien", nota: "Fatto solo il cesto dei giochi grandi" },
          { voce_id: "v16", settimana, stato: "fatto", data: g(-1), persona_id: "collab" }
        ],
        ore: [
          { id: 1, persona_id: "collab", data: g(-8), ora_inizio: "09:00", ora_fine: "12:30", ore: 3.5, tariffa_oraria: 12 },
          { id: 2, persona_id: "collab", data: g(-4), ora_inizio: "09:00", ora_fine: "12:00", ore: 3, tariffa_oraria: 12 },
          { id: 3, persona_id: "collab", data: g(-1), ora_inizio: "09:00", ora_fine: "12:30", ore: 3.5, tariffa_oraria: 12 }
        ]
      },
      biancheria: BIANC.map(([id, nome, ogni_giorni, ult, persona_id, scorta, scorta_minima], i) => ({ id, nome, ogni_giorni, ultimo_cambio: g(ult), persona_id, scorta, scorta_minima, ordine: i })),
      spesa: {
        articoli: SPESA.map(([id, nome, quantita, categoria_id, origine, persona_id, stato]) => ({ id, nome, quantita, categoria_id, origine, persona_id, stato, negozio: "supermercato" })),
        ricorrenti: []
      },
      attivita: ATT.map(([id, nome, categoria_id, persona_id, giorni, ricorrenza_giorni]) => ({ id, nome, categoria_id, persona_id, scadenza: g(giorni), ricorrenza_giorni })),
      eventi: EVENTI.map(([id, titolo, calendario, giorno, ora, persona_id]) => ({ id, titolo, calendario, inizio: iso(piu(lun, giorno)) + "T" + ora, persona_id })),
      registro: [
        { modulo: "pulizie", azione: "fatto", dettaglio: "Bagno e sanitari", persona_id: "collab", persona_nome: "Lucia", creato_il: new Date(Date.now() - 36e5).toISOString() },
        { modulo: "spesa", azione: "aggiunto", dettaglio: "Pannolini taglia 5", persona_id: "vivien", persona_nome: "Vivien", creato_il: new Date(Date.now() - 72e5).toISOString() },
        { modulo: "pulizie", azione: "cambio biancheria", dettaglio: "b02", persona_id: "collab", persona_nome: "Lucia", creato_il: new Date(Date.now() - 86e6).toISOString() }
      ],
      note: [
        { id: 1, modulo: "pulizie", testo: "Lenzuola nell'armadio del corridoio, seconda anta, ripiano alto", creato_il: (/* @__PURE__ */ new Date()).toISOString() },
        { id: 2, modulo: "pulizie", testo: "Niente candeggina in cucina: solo detergente neutro sul piano in legno", creato_il: (/* @__PURE__ */ new Date()).toISOString() },
        { id: 3, modulo: "pulizie", testo: "Camera di Maddie dopo le 15:00, riposino fino alle 14:45", creato_il: (/* @__PURE__ */ new Date()).toISOString() }
      ],
      pagamenti: [
        { id: 1, persona_id: "collab", data: g(-8), importo: 40, nota: "Contanti, prima settimana" },
        { id: 2, persona_id: "collab", data: g(-1), importo: 40, nota: "Bonifico" }
      ]
    };
  }

  // public/js/api.js
  var CHIAVE = "ferrafoni.chiave";
  var rete = { collegata: false, ultimo: null, motivo: "non provata" };
  var chiave = () => localStorage.getItem(CHIAVE) || "";
  var salvaChiave = (v) => localStorage.setItem(CHIAVE, v || "");
  var ATTESA_MAX = 8e3;
  async function chiama(percorso, opzioni = {}) {
    const taglia = new AbortController();
    const timer = setTimeout(() => taglia.abort(), opzioni.attesa || ATTESA_MAX);
    try {
      const r = await fetch("/api" + percorso, __spreadProps(__spreadValues({}, opzioni), {
        signal: taglia.signal,
        headers: __spreadValues(__spreadValues({
          "content-type": "application/json"
        }, chiave() ? { "x-casa-chiave": chiave() } : {}), opzioni.headers || {})
      }));
      if (!r.ok) {
        let dettaglio = "HTTP " + r.status;
        try {
          const j = await r.json();
          if (j == null ? void 0 : j.errore) dettaglio = j.errore;
        } catch (e) {
        }
        throw new Error(dettaglio);
      }
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }
  var CATALOGO_DEMO = [
    { nome: "Latte intero", nome_cerca: "latte intero", categoria_id: "sp_freschi" },
    { nome: "Pane", nome_cerca: "pane", categoria_id: "sp_dispensa" },
    { nome: "Uova", nome_cerca: "uova", categoria_id: "sp_freschi" },
    { nome: "Pomodori", nome_cerca: "pomodori", categoria_id: "sp_ortofrutta" },
    { nome: "Pannolini taglia 5", nome_cerca: "pannolini taglia 5", categoria_id: "sp_bambine" },
    { nome: "Detersivo lavatrice", nome_cerca: "detersivo lavatrice", categoria_id: "sp_casa" },
    { nome: "Gelato", nome_cerca: "gelato", categoria_id: "sp_surgelati" },
    { nome: "Yogurt bambine", nome_cerca: "yogurt bambine", categoria_id: "sp_freschi" }
  ];
  async function caricaStato(settimana) {
    try {
      const d = await chiama("/stato?settimana=" + settimana);
      rete.collegata = true;
      rete.ultimo = /* @__PURE__ */ new Date();
      rete.motivo = "collegata";
      return d;
    } catch (e) {
      rete.collegata = false;
      rete.motivo = e.name === "AbortError" ? "il server non ha risposto in tempo" : e.message || "errore di collegamento";
      return demo(settimana);
    }
  }
  var api = {
    spuntaPulizia: (d) => chiama("/pulizie/spunte", { method: "POST", body: JSON.stringify(d) }),
    togliSpunta: (voce, settimana) => chiama(`/pulizie/spunte?voce_id=${voce}&settimana=${settimana}`, { method: "DELETE" }),
    aggiungiOre: (d) => chiama("/pulizie/ore", { method: "POST", body: JSON.stringify(d) }),
    cambioBiancheria: (d) => chiama("/biancheria", { method: "POST", body: JSON.stringify(d) }),
    aggiungiSpesa: (d) => chiama("/spesa", { method: "POST", body: JSON.stringify(d) }),
    modificaSpesa: (id, d) => chiama("/spesa/" + id, { method: "PATCH", body: JSON.stringify(d) }),
    rimuoviSpesa: (id) => chiama("/spesa/" + id, { method: "DELETE" }),
    attivitaFatta: (id) => chiama("/attivita", { method: "PATCH", body: JSON.stringify({ id, fatta: true }) }),
    salvaImpostazioni: (modulo2, valori) => chiama("/impostazioni", { method: "PUT", body: JSON.stringify({ modulo: modulo2, valori }) }),
    // categorie
    creaCategoria: (d) => chiama("/categorie", { method: "POST", body: JSON.stringify(d) }),
    modificaCategoria: (d) => chiama("/categorie", { method: "PATCH", body: JSON.stringify(d) }),
    eliminaCategoria: (id) => chiama("/categorie?id=" + id, { method: "DELETE" }),
    // persone
    creaPersona: (d) => chiama("/persone", { method: "POST", body: JSON.stringify(d) }),
    modificaPersona: (d) => chiama("/persone", { method: "PATCH", body: JSON.stringify(d) }),
    // voci pulizie
    creaVoce: (d) => chiama("/pulizie/voci", { method: "POST", body: JSON.stringify(d) }),
    modificaVoce: (d) => chiama("/pulizie/voci", { method: "PATCH", body: JSON.stringify(d) }),
    eliminaVoce: (id) => chiama("/pulizie/voci?id=" + id, { method: "DELETE" }),
    // biancheria: configurazione e storico
    salvaBiancheria: (d) => chiama("/biancheria", { method: "PUT", body: JSON.stringify(d) }),
    eliminaBiancheria: (id) => chiama("/biancheria?id=" + id, { method: "DELETE" }),
    storicoBiancheria: (id) => chiama("/biancheria?storico=" + id),
    eliminaCambioBiancheria: (cambioId) => chiama("/biancheria?cambio=" + cambioId, { method: "DELETE" }),
    // ore lavorate
    modificaOre: (d) => chiama("/pulizie/ore", { method: "PATCH", body: JSON.stringify(d) }),
    eliminaOre: (id) => chiama("/pulizie/ore?id=" + id, { method: "DELETE" }),
    // attività
    creaAttivita: (d) => chiama("/attivita", { method: "POST", body: JSON.stringify(d) }),
    modificaAttivita: (d) => chiama("/attivita", { method: "PATCH", body: JSON.stringify(d) }),
    eliminaAttivita: (id) => chiama("/attivita?id=" + id, { method: "DELETE" }),
    // eventi
    creaEvento: (d) => chiama("/eventi", { method: "POST", body: JSON.stringify(d) }),
    modificaEvento: (d) => chiama("/eventi", { method: "PATCH", body: JSON.stringify(d) }),
    eliminaEvento: (id) => chiama("/eventi?id=" + id, { method: "DELETE" }),
    // spesa ricorrenti
    creaRicorrente: (d) => chiama("/spesa/ricorrenti", { method: "POST", body: JSON.stringify(d) }),
    modificaRicorrente: (d) => chiama("/spesa/ricorrenti", { method: "PATCH", body: JSON.stringify(d) }),
    eliminaRicorrente: (id) => chiama("/spesa/ricorrenti?id=" + id, { method: "DELETE" }),
    // pagamenti
    creaPagamento: (d) => chiama("/pagamenti", { method: "POST", body: JSON.stringify(d) }),
    modificaPagamento: (d) => chiama("/pagamenti", { method: "PATCH", body: JSON.stringify(d) }),
    eliminaPagamento: (id) => chiama("/pagamenti?id=" + id, { method: "DELETE" }),
    // catalogo e statistiche della spesa
    catalogo: async () => {
      try {
        return await chiama("/spesa/catalogo");
      } catch (e) {
        return { prodotti: CATALOGO_DEMO };
      }
    },
    imparaProdotto: (d) => chiama("/spesa/catalogo", { method: "POST", body: JSON.stringify(d) }),
    frequenti: async () => {
      try {
        return await chiama("/spesa/frequenti");
      } catch (e) {
        return { frequenti: [
          { nome: "Latte intero", volte: 12 },
          { nome: "Pane", volte: 9 },
          { nome: "Uova", volte: 7 },
          { nome: "Pannolini taglia 5", volte: 6 },
          { nome: "Yogurt bambine", volte: 5 }
        ] };
      }
    },
    // note libere
    creaNota: (d) => chiama("/note", { method: "POST", body: JSON.stringify(d) }),
    modificaNota: (d) => chiama("/note", { method: "PATCH", body: JSON.stringify(d) }),
    eliminaNota: (id) => chiama("/note?id=" + id, { method: "DELETE" }),
    // registro
    registro: (modulo2, limite) => chiama(`/registro?${modulo2 ? "modulo=" + modulo2 + "&" : ""}limite=${limite || 80}`)
  };
  var scritture = { aperte: 0 };
  async function prova(promessa) {
    scritture.aperte++;
    try {
      await promessa;
      return true;
    } catch (e) {
      return false;
    } finally {
      scritture.aperte--;
    }
  }

  // public/js/stato.js
  var iscritti = /* @__PURE__ */ new Set();
  var S = {
    dati: null,
    settimana: iso(lunedi()),
    caricamento: true,
    rete
  };
  var iscriviti = (fn) => {
    iscritti.add(fn);
    return () => iscritti.delete(fn);
  };
  var avvisa = (opzioni = {}) => iscritti.forEach((fn) => fn(S, opzioni));
  var ultimaImpronta = "";
  async function carica(settimana = S.settimana, { silenzioso = false } = {}) {
    if (!silenzioso) {
      S.caricamento = true;
      avvisa();
    }
    const cambiaSettimana = settimana !== S.settimana;
    S.settimana = settimana;
    const nuovi = await caricaStato(settimana);
    S.caricamento = false;
    const impronta = JSON.stringify(nuovi);
    if (silenzioso && !cambiaSettimana && impronta === ultimaImpronta) return;
    ultimaImpronta = impronta;
    S.dati = nuovi;
    avvisa({ silenzioso });
  }
  var persona = (id) => {
    var _a;
    return ((_a = S.dati) == null ? void 0 : _a.persone.find((p) => p.id === id)) || null;
  };
  var nomePersona = (id) => {
    var _a;
    return ((_a = persona(id)) == null ? void 0 : _a.nome) || "";
  };
  var categorie = (modulo2) => {
    var _a;
    return (((_a = S.dati) == null ? void 0 : _a.categorie) || []).filter((c) => c.modulo === modulo2);
  };
  var categoria = (id) => {
    var _a;
    return ((_a = S.dati) == null ? void 0 : _a.categorie.find((c) => c.id === id)) || null;
  };
  var impostazione = (modulo2, chiave2, difetto = "") => {
    var _a, _b, _c;
    return (_c = (_b = (_a = S.dati) == null ? void 0 : _a.impostazioni.find((i) => i.modulo === modulo2 && i.chiave === chiave2)) == null ? void 0 : _b.valore) != null ? _c : difetto;
  };
  var spunta = (voceId) => {
    var _a;
    return ((_a = S.dati) == null ? void 0 : _a.pulizie.spunte.find((s) => s.voce_id === voceId)) || null;
  };
  function avanzamentoPulizie() {
    var _a;
    const voci = ((_a = S.dati) == null ? void 0 : _a.pulizie.voci) || [];
    const fatte = voci.filter((v) => {
      var _a2;
      return ((_a2 = spunta(v.id)) == null ? void 0 : _a2.stato) === "fatto";
    }).length;
    const parziali = voci.filter((v) => {
      var _a2;
      return ((_a2 = spunta(v.id)) == null ? void 0 : _a2.stato) === "parziale";
    }).length;
    return {
      totale: voci.length,
      fatte,
      parziali,
      restanti: voci.length - fatte,
      percento: voci.length ? Math.round(fatte / voci.length * 100) : 0
    };
  }
  function attivitaConScadenza() {
    var _a;
    return (((_a = S.dati) == null ? void 0 : _a.attivita) || []).filter((a) => a.scadenza).map((a) => {
      const d = data(a.scadenza);
      return __spreadProps(__spreadValues({}, a), { quando: d, giorni: scarto(d), etichetta: scadenzaEtichetta(d) });
    }).sort((a, b) => a.giorni - b.giorni);
  }
  function scadenzeSettimana(giorni = 7) {
    var _a;
    const dentro = [];
    attivitaConScadenza().forEach((a) => {
      var _a2, _b;
      if (a.giorni <= giorni) dentro.push({
        titolo: a.nome,
        sotto: (((_a2 = categoria(a.categoria_id)) == null ? void 0 : _a2.nome) || "Attivit\xE0") + " \xB7 " + nomePersona(a.persona_id),
        emoji: ((_b = categoria(a.categoria_id)) == null ? void 0 : _b.icona) || "\u{1F514}",
        modulo: "calendario",
        sezione: "attivita",
        giorni: a.giorni,
        etichetta: a.etichetta
      });
    });
    const fine = piu(/* @__PURE__ */ new Date(S.settimana + "T00:00:00"), 6);
    if (scarto(fine) >= 0 && scarto(fine) <= 2) {
      const mancanti = (((_a = S.dati) == null ? void 0 : _a.pulizie.voci) || []).filter((v) => v.frequenza === "settimanale" && !spunta(v.id));
      if (mancanti.length) dentro.push({
        titolo: mancanti.length + " voci di pulizia da chiudere",
        sotto: "La settimana finisce " + (scarto(fine) === 0 ? "oggi" : "tra " + scarto(fine) + " giorni"),
        emoji: "\u{1F9FD}",
        modulo: "pulizie",
        sezione: "checklist",
        giorni: scarto(fine),
        etichetta: scadenzaEtichetta(fine)
      });
    }
    return dentro.sort((a, b) => a.giorni - b.giorni);
  }
  var urgenti = () => scadenzeSettimana().filter((s) => s.etichetta.urgente);
  function spesaDaPrendere() {
    var _a;
    return (((_a = S.dati) == null ? void 0 : _a.spesa.articoli) || []).filter((a) => a.stato === "da_prendere");
  }
  function eventiDelGiorno(quando2 = OGGI) {
    var _a;
    const g2 = iso(quando2);
    return (((_a = S.dati) == null ? void 0 : _a.eventi) || []).filter((e) => e.inizio.slice(0, 10) === g2).sort((a, b) => a.inizio.localeCompare(b.inizio));
  }
  function applicaSpunta(voceId, stato, quando2, personaId) {
    const arr = S.dati.pulizie.spunte;
    const i = arr.findIndex((s) => s.voce_id === voceId);
    if (stato === null) {
      if (i >= 0) arr.splice(i, 1);
    } else {
      const riga = { voce_id: voceId, settimana: S.settimana, stato, data: iso(quando2), persona_id: personaId };
      i >= 0 ? arr[i] = riga : arr.push(riga);
    }
    avvisa();
  }
  function applicaSpesa(id, campi) {
    const a = S.dati.spesa.articoli.find((x) => x.id === id);
    if (a) {
      Object.assign(a, campi);
      avvisa();
    }
  }
  function aggiungiArticoloLocale(nome, quantita, categoriaId) {
    S.dati.spesa.articoli.push({
      id: "loc" + Date.now(),
      nome,
      quantita,
      categoria_id: categoriaId,
      stato: "da_prendere",
      origine: "tablet"
    });
    avvisa();
  }
  var registro = (modulo2) => {
    var _a;
    return (((_a = S.dati) == null ? void 0 : _a.registro) || []).filter((r) => !modulo2 || r.modulo === modulo2);
  };
  function aggiungiRegistroLocale(modulo2, azione, dettaglio, personaId) {
    if (!S.dati.registro) S.dati.registro = [];
    S.dati.registro.unshift({
      modulo: modulo2,
      azione,
      dettaglio,
      persona_id: personaId,
      persona_nome: nomePersona(personaId),
      creato_il: (/* @__PURE__ */ new Date()).toISOString()
    });
    avvisa();
  }
  function aggiungiCategoriaLocale(cat) {
    S.dati.categorie.push(cat);
    avvisa();
  }
  function modificaCategoriaLocale(id, campi) {
    const c = S.dati.categorie.find((x) => x.id === id);
    if (c) {
      Object.assign(c, campi);
      avvisa();
    }
  }
  function rimuoviCategoriaLocale(id) {
    S.dati.categorie = S.dati.categorie.filter((c) => c.id !== id);
    avvisa();
  }
  function aggiungiPersonaLocale(p) {
    S.dati.persone.push(p);
    avvisa();
  }
  function modificaPersonaLocale(id, campi) {
    const p = persona(id);
    if (p) {
      Object.assign(p, campi);
      avvisa();
    }
  }
  function aggiungiVoceLocale(v) {
    S.dati.pulizie.voci.push(v);
    avvisa();
  }
  function modificaVoceLocale(id, campi) {
    const v = S.dati.pulizie.voci.find((x) => x.id === id);
    if (v) {
      Object.assign(v, campi);
      avvisa();
    }
  }
  function rimuoviVoceLocale(id) {
    S.dati.pulizie.voci = S.dati.pulizie.voci.filter((v) => v.id !== id);
    avvisa();
  }
  function modificaOreLocale(id, campi) {
    const o = S.dati.pulizie.ore.find((x) => String(x.id) === String(id));
    if (o) {
      Object.assign(o, campi);
      avvisa();
    }
  }
  function rimuoviOreLocale(id) {
    S.dati.pulizie.ore = S.dati.pulizie.ore.filter((o) => String(o.id) !== String(id));
    avvisa();
  }
  function aggiungiAttivitaLocale(a) {
    S.dati.attivita.push(a);
    avvisa();
  }
  function modificaAttivitaLocale(id, campi) {
    const a = S.dati.attivita.find((x) => x.id === id);
    if (a) {
      Object.assign(a, campi);
      avvisa();
    }
  }
  function rimuoviAttivitaLocale(id) {
    S.dati.attivita = S.dati.attivita.filter((a) => a.id !== id);
    avvisa();
  }
  function aggiungiEventoLocale(e) {
    S.dati.eventi.push(e);
    avvisa();
  }
  function modificaEventoLocale(id, campi) {
    const e = S.dati.eventi.find((x) => x.id === id);
    if (e) {
      Object.assign(e, campi);
      avvisa();
    }
  }
  function rimuoviEventoLocale(id) {
    S.dati.eventi = S.dati.eventi.filter((e) => e.id !== id);
    avvisa();
  }
  function contoPersona(personaId) {
    var _a, _b;
    const ore = (((_a = S.dati) == null ? void 0 : _a.pulizie.ore) || []).filter((o) => o.persona_id === personaId);
    const p = persona(personaId);
    const dovuto = ore.reduce((s, o) => {
      var _a2, _b2;
      return s + o.ore * ((_b2 = (_a2 = o.tariffa_oraria) != null ? _a2 : p == null ? void 0 : p.tariffa_oraria) != null ? _b2 : 0);
    }, 0);
    const pagato = (((_b = S.dati) == null ? void 0 : _b.pagamenti) || []).filter((pg) => pg.persona_id === personaId).reduce((s, pg) => s + Number(pg.importo), 0);
    return {
      oreTotali: ore.reduce((s, o) => s + o.ore, 0),
      dovuto,
      pagato,
      differenza: pagato - dovuto
    };
  }
  var pagamentiDi = (personaId) => {
    var _a;
    return (((_a = S.dati) == null ? void 0 : _a.pagamenti) || []).filter((p) => p.persona_id === personaId).sort((a, b) => b.data.localeCompare(a.data));
  };
  function aggiungiPagamentoLocale(p) {
    if (!S.dati.pagamenti) S.dati.pagamenti = [];
    S.dati.pagamenti.push(p);
    avvisa();
  }
  function modificaPagamentoLocale(id, campi) {
    const p = (S.dati.pagamenti || []).find((x) => String(x.id) === String(id));
    if (p) {
      Object.assign(p, campi);
      avvisa();
    }
  }
  function rimuoviPagamentoLocale(id) {
    S.dati.pagamenti = (S.dati.pagamenti || []).filter((p) => String(p.id) !== String(id));
    avvisa();
  }
  var note = (modulo2 = "pulizie") => {
    var _a;
    return (((_a = S.dati) == null ? void 0 : _a.note) || []).filter((n) => n.modulo === modulo2);
  };
  function aggiungiNotaLocale(n) {
    if (!S.dati.note) S.dati.note = [];
    S.dati.note.unshift(n);
    avvisa();
  }
  function modificaNotaLocale(id, testo) {
    const n = (S.dati.note || []).find((x) => String(x.id) === String(id));
    if (n) {
      n.testo = testo;
      avvisa();
    }
  }
  function rimuoviNotaLocale(id) {
    S.dati.note = (S.dati.note || []).filter((n) => String(n.id) !== String(id));
    avvisa();
  }
  function applicaNotaVoce(voceId, testo) {
    const arr = S.dati.pulizie.spunte;
    const i = arr.findIndex((s) => s.voce_id === voceId);
    if (i >= 0) {
      arr[i].nota = testo || null;
    } else if (testo) {
      arr.push({
        voce_id: voceId,
        settimana: S.settimana,
        stato: "nota",
        data: iso(OGGI),
        persona_id: null,
        nota: testo
      });
    }
    avvisa();
  }

  // public/js/moduli/home.js
  var APERTA = { id: null };
  function tessera({ id, nome, colore, emoji, cifra, sotto, percento, righe, azione }) {
    const aperta = APERTA.id === id;
    return `
  <article class="tessera ${aperta ? "aperta" : ""}" style="--c:${colore}" data-tessera="${id}">
    <button class="testa" data-apri="${id}">
      <span class="emj">${emoji}</span>
      <span class="info"><b>${esc(nome)}</b><span>${esc(sotto)}</span></span>
      ${percento !== void 0 ? `<span style="position:relative;display:flex;align-items:center;justify-content:center">
             ${anello(percento, colore, 58)}
             <b style="position:absolute;font-size:.82rem;color:${colore}">${percento}%</b>
           </span>` : `<span class="cifra">${cifra}</span>`}
      <span class="freccia"></span>
    </button>
    <div class="corpo"><div>
      <ul class="righe">${righe || ""}</ul>
      <div class="piedino">
        <span class="occhiello">${esc(azione.nota || "")}</span>
        <button class="btn piccolo" style="background:${colore}" data-vai="${azione.vai}">${esc(azione.testo)}</button>
      </div>
    </div></div>
  </article>`;
  }
  var rigaSemplice = (titolo, sotto, destra, urgente) => `
  <li class="${urgente ? "urgente" : ""}">
    <span class="tx"><strong>${esc(titolo)}</strong>${sotto ? `<span>${esc(sotto)}</span>` : ""}</span>
    <span class="qd">${esc(destra || "")}</span></li>`;
  function urgenze() {
    const lista = scadenzeSettimana(Number(impostazione("attivita", "giorni_avanti", 7)));
    const gravi = lista.filter((x) => x.etichetta.urgente);
    if (!lista.length) return `<div class="urgenze vuota">
    <div class="urg calma"><span class="emj">\u2705</span><span><b>Niente in scadenza</b>
    <span>Nella settimana non c'\xE8 nulla da recuperare</span></span></div></div>`;
    const mostrate = (gravi.length ? gravi : lista).slice(0, 4);
    return `<div class="urgenze">${mostrate.map((x) => `
    <button class="urg ${x.etichetta.urgente ? "" : "calma"}" data-vai="${x.modulo}:${x.sezione}">
      <span class="emj">${x.emoji}</span>
      <span><b>${esc(x.titolo)}</b><span>${esc(x.sotto)} \xB7 ${esc(x.etichetta.testo)}</span></span>
    </button>`).join("")}</div>`;
  }
  var home_default = {
    id: "home",
    nome: "Oggi",
    emoji: "\u{1F3E0}",
    colore: "var(--home)",
    sezioni: [{ id: "oggi", nome: "Oggi" }],
    distintivo() {
      const n = urgenti().length;
      return { n, caldo: n > 0 };
    },
    render() {
      const av = avanzamentoPulizie();
      const lucia = S.dati.persone.find((p) => p.ruolo === "collaboratrice");
      const conto = lucia ? contoPersona(lucia.id) : null;
      const spesa = spesaDaPrendere();
      const att = attivitaConScadenza();
      const eventi = eventiDelGiorno();
      const tessere = [
        tessera({
          id: "pulizie",
          nome: "Pulizie",
          colore: "var(--pulizie)",
          emoji: "\u{1F9FD}",
          percento: av.percento,
          sotto: plurale(av.restanti, "voce ancora da fare", "voci ancora da fare"),
          righe: S.dati.pulizie.voci.filter((v) => !spunta(v.id)).slice(0, 5).map((v) => {
            var _a;
            return rigaSemplice(v.nome, (_a = categoria(v.categoria_id)) == null ? void 0 : _a.nome, v.frequenza);
          }).join("") || `<li><span class="tx"><strong>Tutto fatto per questa settimana</strong></span></li>`,
          azione: {
            testo: "Apri la checklist",
            vai: "pulizie:checklist",
            nota: av.parziali ? plurale(av.parziali, "voce parziale", "voci parziali") : ""
          }
        }),
        tessera({
          id: "spesa",
          nome: "Lista della spesa",
          colore: "var(--spesa)",
          emoji: "\u{1F6D2}",
          cifra: spesa.length,
          sotto: "articoli da prendere",
          righe: spesa.slice(0, 5).map((a) => {
            var _a;
            return rigaSemplice(
              a.nome,
              a.origine === "iphone" ? "aggiunto dall'iPhone" : (_a = categoria(a.categoria_id)) == null ? void 0 : _a.nome,
              a.quantita
            );
          }).join("") || vuoto("La lista \xE8 vuota"),
          azione: {
            testo: "Apri la lista",
            vai: "spesa:lista",
            nota: spesa.filter((a) => a.origine === "iphone").length ? "Qualcosa \xE8 arrivato dall'iPhone" : ""
          }
        }),
        tessera({
          id: "conto",
          nome: lucia ? "Conto con " + lucia.nome : "Ore e pagamenti",
          colore: "var(--pulizie)",
          emoji: "\u{1F4B6}",
          cifra: conto ? (conto.differenza >= 0 ? "" : "") + Math.abs(conto.differenza).toFixed(0) : "0",
          sotto: conto ? Math.abs(conto.differenza) < 5e-3 ? "conto in pari" : conto.differenza > 0 ? "euro di troppo gia versati" : "euro ancora da dare" : "nessuna persona da pagare",
          righe: conto ? [
            rigaSemplice("Ore lavorate in tutto", "", conto.oreTotali.toFixed(1).replace(".", ",")),
            rigaSemplice("Dovuto", lucia.tariffa_oraria + " euro/ora", conto.dovuto.toFixed(2).replace(".", ",") + " EUR"),
            rigaSemplice("Pagato finora", "", conto.pagato.toFixed(2).replace(".", ",") + " EUR"),
            rigaSemplice(
              Math.abs(conto.differenza) < 5e-3 ? "Conto in pari" : conto.differenza > 0 ? lucia.nome + " e a debito di " + conto.differenza.toFixed(2).replace(".", ",") + " EUR" : lucia.nome + " e a credito di " + Math.abs(conto.differenza).toFixed(2).replace(".", ",") + " EUR",
              "",
              "",
              conto.differenza < -5e-3
            )
          ].join("") : vuoto("Aggiungi una persona che pulisce"),
          azione: { testo: "Vai ai pagamenti", vai: "pulizie:pagamenti", nota: "" }
        }),
        tessera({
          id: "giornata",
          nome: "La giornata",
          colore: "var(--calendario)",
          emoji: "\u{1F4C5}",
          cifra: eventi.length + att.filter((a) => a.giorni === 0).length,
          sotto: "tra impegni e scadenze",
          righe: eventi.map((e) => rigaSemplice(e.titolo, nomePersona(e.persona_id), e.inizio.slice(11, 16))).concat(att.filter((a) => a.giorni <= 1).map((a) => {
            var _a;
            return rigaSemplice(
              a.nome,
              (_a = categoria(a.categoria_id)) == null ? void 0 : _a.nome,
              relativa(a.quando),
              a.giorni <= 0
            );
          })).slice(0, 5).join("") || vuoto("Giornata libera"),
          azione: { testo: "Apri il calendario", vai: "calendario:settimana", nota: "" }
        })
      ];
      return `
      <p class="occhiello" style="margin:0 0 12px">
        ${GG[OGGI.getDay()]} ${OGGI.getDate()} ${MM[OGGI.getMonth()]} \xB7 ${esc(impostazione("generali", "nome_casa", "Casa Ferrafoni"))}
      </p>
      ${urgenze()}
      <div class="cascata">${tessere.join("")}</div>`;
    },
    aggancia(root, { vai: vai2 }) {
      root.addEventListener("click", (e) => {
        const apri = e.target.closest("[data-apri]");
        if (apri) {
          APERTA.id = APERTA.id === apri.dataset.apri ? null : apri.dataset.apri;
          this.ridisegna();
          return;
        }
        const dest = e.target.closest("[data-vai]");
        if (dest) {
          const [m, s] = dest.dataset.vai.split(":");
          vai2(m, s);
        }
      });
    }
  };

  // public/js/moduli/pulizie.js
  var COLORE = "var(--pulizie)";
  var FREQ = {
    giornaliera: "ogni giorno",
    settimanale: "ogni settimana",
    quindicinale: "ogni 2 settimane",
    mensile: "ogni mese",
    trimestrale: "ogni 3 mesi",
    stagionale: "a ogni cambio stagione"
  };
  var aperti = /* @__PURE__ */ new Set();
  var primaVolta = true;
  var meseScelto = null;
  var MESI = [
    "gennaio",
    "febbraio",
    "marzo",
    "aprile",
    "maggio",
    "giugno",
    "luglio",
    "agosto",
    "settembre",
    "ottobre",
    "novembre",
    "dicembre"
  ];
  function gruppo(cat, voci) {
    const fatte = voci.filter((v) => {
      var _a;
      return ((_a = spunta(v.id)) == null ? void 0 : _a.stato) === "fatto";
    }).length;
    const aperto = aperti.has(cat.id);
    const tutte = fatte === voci.length;
    return `
  <div class="gruppo ${aperto ? "aperto" : ""}">
    <button class="capo" data-gruppo="${cat.id}">
      <span class="emj">${cat.icona || "\u2022"}</span>
      <b>${esc(cat.nome)}</b>
      <span class="avanz">${fatte} di ${voci.length}${tutte ? " \xB7 completata" : ""}</span>
      <span style="width:78px">${barra(voci.length ? fatte / voci.length * 100 : 0, COLORE)}</span>
      <span class="freccia"></span>
    </button>
    <div class="elenco">${aperto ? voci.map(compito).join("") : ""}</div>
  </div>`;
  }
  function compito(v) {
    const s = spunta(v.id);
    const stato = s == null ? void 0 : s.stato;
    const scaduto = !stato && v.frequenza === "settimanale" && scarto(piu(/* @__PURE__ */ new Date(S.settimana + "T00:00:00"), 6)) < 0;
    const timbro = s && (stato === "fatto" || stato === "parziale") ? `<b>${gm(s.data)}</b>${esc(nomePersona(s.persona_id))}` : `<span style="color:var(--tenue-chiaro)">nessuna data</span>`;
    return `
  <div class="compito ${stato === "fatto" ? "fatto" : ""} ${scaduto ? "scaduto" : ""}">
    <span class="emj">${v.icona || "\u2022"}</span>
    <span class="tx"><strong>${esc(v.nome)}</strong><span>${FREQ[v.frequenza] || v.frequenza}</span>
      ${(s == null ? void 0 : s.nota) ? `<span class="nota-voce">${esc(s.nota)}</span>` : ""}</span>
    <button class="quando" data-data="${v.id}">${timbro}</button>
    <span class="segna">
      <button data-segna="fatto" data-voce="${v.id}" class="${stato === "fatto" ? "f-on" : ""}">Fatto</button>
      <button data-segna="parziale" data-voce="${v.id}" class="${stato === "parziale" ? "p-on" : ""}">Parziale</button>
      <button data-nota-voce="${v.id}" class="${(s == null ? void 0 : s.nota) ? "n-on" : ""}">Note</button>
    </span>
  </div>`;
  }
  function barraSettimana() {
    const lun = /* @__PURE__ */ new Date(S.settimana + "T00:00:00");
    const av = avanzamentoPulizie();
    const corrente = S.settimana === iso(lunedi());
    return `
  <div class="settimana-barra">
    <button class="nav" data-sett="-1" aria-label="Settimana precedente">\u2039</button>
    <button class="nav" data-sett="1" aria-label="Settimana successiva">\u203A</button>
    <span class="et">
      <b>${breve(lun)} \u2013 ${breve(piu(lun, 6))}</b>
      <span>${corrente ? "settimana in corso" : lun < OGGI ? "settimana conclusa" : "settimana da venire"}
      \xB7 ${plurale(av.restanti, "voce da fare", "voci da fare")}</span>
    </span>
    <span style="position:relative;display:flex;align-items:center;justify-content:center">
      ${anello(av.percento, COLORE, 60)}
      <b style="position:absolute;font-size:.85rem;color:var(--pulizie)">${av.percento}%</b>
    </span>
    ${corrente ? "" : '<button class="btn chiaro piccolo" data-sett="0">Torna a oggi</button>'}
  </div>`;
  }
  function bannerConto() {
    const lucia = S.dati.persone.find((p) => p.ruolo === "collaboratrice");
    if (!lucia) return "";
    const conto = contoPersona(lucia.id);
    const d = conto.differenza;
    const inPari = Math.abs(d) < 5e-3;
    const colore = inPari || d > 0 ? "var(--verde)" : "var(--rosso)";
    const fondo = inPari || d > 0 ? "#E4F1EB" : "var(--rosso-fondo)";
    const testo = inPari ? lucia.nome + ": conto in pari" : d > 0 ? lucia.nome + " e a debito di " + d.toFixed(2).replace(".", ",") + " EUR" : lucia.nome + " e a credito di " + Math.abs(d).toFixed(2).replace(".", ",") + " EUR";
    const sotto = inPari ? "Pagato esattamente quanto dovuto" : d > 0 ? "Ha ricevuto in piu, si scala dal prossimo pagamento" : "Le devi ancora questa cifra";
    return `<div style="display:flex;align-items:center;gap:12px;padding:13px 18px;
    background:${fondo};border-bottom:1px solid var(--linea-tenue)">
    <span style="font-size:1.2rem">${inPari ? "\u2705" : d > 0 ? "\u{1F4B6}" : "\u{1F514}"}</span>
    <span style="flex:1;min-width:0">
      <b style="display:block;font-size:.94rem;color:${colore}">${esc(testo)}</b>
      <span style="font-size:.79rem;color:var(--tenue)">${esc(sotto)}</span></span>
  </div>`;
  }
  function cardNote() {
    const lista = note("pulizie");
    return riq(
      "Note per chi pulisce",
      (lista.length ? lista.map((n) => `
      <div class="log-riga">
        <span class="log-punto" style="--c:${COLORE}"></span>
        <span class="tx"><strong>${esc(n.testo)}</strong></span>
        <div class="riga-azioni">
          <button data-mod-nota="${n.id}" title="Modifica">&#9998;</button>
          <button data-elimina-nota="${n.id}" title="Elimina" style="color:var(--rosso)">&#128465;</button>
        </div>
      </div>`).join("") : `<p class="vuoto">Nessuna nota</p>`) + `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue);display:flex;gap:9px">
       <input type="text" id="nuova-nota" placeholder="Scrivi una nota..." style="flex:1;min-width:0">
       <button class="btn" style="background:${COLORE}" data-aggiungi-nota>Aggiungi</button>
     </div>`,
      { raso: true, meta: lista.length ? lista.length + " note" : "" }
    );
  }
  var chiaveNote = (sett) => "pulizie-sett-" + sett;
  function cardNoteSettimana() {
    const mia = note(chiaveNote(S.settimana))[0];
    const settPrec = iso(piu(/* @__PURE__ */ new Date(S.settimana + "T00:00:00"), -7));
    const prec = note(chiaveNote(settPrec))[0];
    return riq(
      "Note pulizie",
      `<div style="padding:0 0 4px">
       ${mia ? `<p style="margin:0;white-space:pre-wrap;font-size:.93rem">${esc(mia.testo)}</p>` : `<p style="margin:0;color:var(--tenue);font-size:.9rem">Nessuna nota per questa settimana.</p>`}
     </div>
     ${prec ? `
     <div style="margin-top:16px;padding:12px 14px;background:#F3F0E8;border-radius:10px">
       <p class="occhiello" style="margin:0 0 5px">Rimasto indietro dalla settimana scorsa</p>
       <p style="margin:0;white-space:pre-wrap;font-size:.88rem;font-style:italic">${esc(prec.testo)}</p>
     </div>` : ""}
     <div style="margin-top:14px">
       <button class="btn chiaro pieno" data-note-settimana>${mia ? "Modifica le note" : "Scrivi una nota"}</button>
     </div>`,
      {
        classe: "tinta",
        colore: COLORE,
        meta: breve(/* @__PURE__ */ new Date(S.settimana + "T00:00:00")) + " - " + breve(piu(/* @__PURE__ */ new Date(S.settimana + "T00:00:00"), 6))
      }
    );
  }
  function vistaChecklist() {
    const cats = categorie("pulizie");
    const voci = S.dati.pulizie.voci;
    if (primaVolta) {
      primaVolta = false;
      const prima = cats.find((c) => voci.some((v) => v.categoria_id === c.id && !spunta(v.id)));
      if (prima) aperti.add(prima.id);
    }
    const meseSett = S.settimana.slice(0, 7);
    const ore = S.dati.pulizie.ore.filter((o) => o.data.slice(0, 7) === meseSett).sort((a, b) => b.data.localeCompare(a.data));
    const totale = ore.reduce((s, o) => s + o.ore, 0);
    const nomeMeseSett = MESI[Number(meseSett.slice(5, 7)) - 1];
    return barraSettimana() + `
    <div class="griglia g-lato">
      ${riq(
      "Checklist della settimana",
      cats.map((c) => gruppo(c, voci.filter((v) => v.categoria_id === c.id))).join(""),
      { raso: true, classe: "tinta", colore: COLORE, meta: "ogni spunta chiede la data" }
    )}
      <div class="griglia" style="align-content:start">
        ${riq(
      "Giorni lavorati \xB7 " + nomeMeseSett,
      bannerConto() + tabella(
        ["Giorno", "Orario", "Ore"],
        ore.length ? ore.map((o) => `<tr><td>${esc(new Date(o.data).toLocaleDateString("it-IT", { weekday: "long", day: "numeric" }))}</td>
              <td class="num">${esc(o.ora_inizio || "")} - ${esc(o.ora_fine || "")}</td>
              <td class="num">${String(o.ore).replace(".", ",")}</td></tr>`) : [`<tr><td colspan="3">${vuoto("Nessuna giornata in " + nomeMeseSett)}</td></tr>`]
      ) + `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
             <button class="btn chiaro pieno" data-nuova-giornata>Aggiungi giornata</button></div>`,
      { raso: true, meta: String(totale).replace(".", ",") + " ore a " + nomeMeseSett }
    )}
        ${cardNoteSettimana()}
        ${cardNote()}
      </div>
    </div>`;
  }
  function vistaOre() {
    const ore = S.dati.pulizie.ore.filter((o) => o.data.slice(0, 7) === meseScelto).sort((a, b) => b.data.localeCompare(a.data));
    const totMese = ore.reduce((s, o) => s + o.ore, 0);
    const lucia = S.dati.persone.find((p) => p.ruolo === "collaboratrice");
    const conto = lucia ? contoPersona(lucia.id) : null;
    const [anno, mm] = meseScelto.split("-").map(Number);
    const nomeMese = MESI[mm - 1] + " " + anno;
    const corrente = meseScelto === iso(OGGI).slice(0, 7);
    return `
    <div class="settimana-barra">
      <button class="nav" data-mese="-1" aria-label="Mese precedente">&lsaquo;</button>
      <button class="nav" data-mese="1" aria-label="Mese successivo">&rsaquo;</button>
      <span class="et">
        <b>${nomeMese}</b>
        <span>${ore.length ? ore.length + (ore.length === 1 ? " giornata" : " giornate") + " registrate" : "nessuna giornata"}
        &middot; ${String(totMese).replace(".", ",")} ore</span>
      </span>
      ${corrente ? "" : '<button class="btn chiaro piccolo" data-mese="0">Torna a questo mese</button>'}
    </div>

    <div class="griglia g-lato">
      ${riq(
      "Registro giornate",
      tabella(
        ["Giorno", "Orario", "Ore", "Chi", ""],
        ore.length ? ore.map((o) => `<tr>
          <td>${esc(new Date(o.data).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }))}</td>
          <td class="num">${esc(o.ora_inizio || "")} - ${esc(o.ora_fine || "")}</td>
          <td class="num">${String(o.ore).replace(".", ",")}</td>
          <td>${esc(nomePersona(o.persona_id))}</td>
          <td style="text-align:right"><div class="riga-azioni" style="justify-content:flex-end;display:inline-flex">
            <button data-mod-ore="${o.id}" title="Modifica">&#9998;</button>
            <button data-elimina-ore="${o.id}" title="Elimina" style="color:var(--rosso)">&#128465;</button>
          </div></td></tr>`) : [`<tr><td colspan="5">${vuoto("Nessuna giornata in questo mese")}</td></tr>`]
      ),
      { raso: true, classe: "tinta", colore: COLORE, meta: "anche le giornate passate si possono correggere" }
    )}

      <div class="griglia" style="align-content:start">
        ${riq(nomeMese, `
          <div style="display:flex;align-items:center;gap:22px">
            <div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${String(totMese).replace(".", ",")}</b>
            <span class="occhiello" style="display:block">ore lavorate</span></div>
            <div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${ore.length}</b>
            <span class="occhiello" style="display:block">giornate</span></div>
            ${lucia && lucia.tariffa_oraria ? `<div><b style="font-size:2.2rem;letter-spacing:-.04em;color:var(--pulizie)">${(totMese * lucia.tariffa_oraria).toFixed(0)}</b>
            <span class="occhiello" style="display:block">euro nel mese</span></div>` : ""}
          </div>
          <p class="nota">Usa le frecce in alto per scorrere i mesi passati.</p>`)}
        ${conto ? riq("Conto con " + lucia.nome, `
          <p style="margin:0 0 12px;font-size:.92rem">${fraseConto(lucia.nome, conto.differenza).testo}</p>
          <p class="nota" style="margin:0 0 14px">${fraseConto(lucia.nome, conto.differenza).sotto}</p>
          <button class="btn chiaro pieno" data-vai-pagamenti>Vai ai pagamenti</button>
        `) : ""}
      </div>
    </div>`;
  }
  function vistaImpostazioni() {
    const cats = categorie("pulizie");
    const voci = S.dati.pulizie.voci;
    const lucia = S.dati.persone.find((p) => p.ruolo === "collaboratrice");
    return `<div class="griglia g-lato">
    <div class="griglia" style="align-content:start">
      ${riq(
      "Voci della checklist",
      cats.map((c) => `
        <div class="gruppo ${aperti.has("cfg_" + c.id) ? "aperto" : ""}">
          <button class="capo" data-gruppo="cfg_${c.id}">
            <span class="emj">${c.icona}</span><b>${esc(c.nome)}</b>
            <span class="avanz">${voci.filter((v) => v.categoria_id === c.id).length} voci</span>
            <span class="freccia"></span></button>
          <div class="elenco">${aperti.has("cfg_" + c.id) ? voci.filter((v) => v.categoria_id === c.id).map((v) => `
            <div class="compito" style="min-height:64px">
              <span class="emj">${v.icona}</span>
              <span class="tx"><strong>${esc(v.nome)}</strong><span>${FREQ[v.frequenza]}</span></span>
              <div class="riga-azioni">
                <button data-mod-voce="${v.id}" title="Modifica">&#9998;</button>
                <button data-elimina-voce="${v.id}" title="Togli dalla checklist" style="color:var(--rosso)">&#128465;</button>
              </div>
            </div>`).join("") : ""}</div>
        </div>`).join("") + `<div style="padding:16px 18px;border-top:1px solid var(--linea-tenue)">
           <button class="btn chiaro pieno" data-nuova-voce>Aggiungi una voce</button>
           <p class="nota">Ogni voce ha la sua frequenza e la sua zona. La frequenza decide quando la voce
           torna a essere da fare e quando compare in rosso nella home.</p>
         </div>`,
      { raso: true, classe: "tinta", colore: COLORE, meta: voci.length + " voci attive" }
    )}

      ${riq("Come funziona la checklist", `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg("La settimana inizia", "", `<select><option selected>Lunedi</option><option>Domenica</option></select>`)}
        ${rigaCfg("Chiedi sempre la data quando spunto", "Ogni Fatto o Parziale apre la scelta del giorno.", interruttore(true, COLORE))}
        ${rigaCfg("Chiedi chi ha fatto la lavorazione", "Mostra la scelta tra le persone di casa e chi viene a pulire.", interruttore(true, COLORE))}
        ${rigaCfg("Riporta le voci non fatte", "Restano nella settimana nuova segnalate in rosso.", interruttore(true, COLORE))}
        ${rigaCfg("Blocca le settimane passate", "Dopo la domenica lo storico non e piu modificabile.", interruttore(false, COLORE))}
      </ul>`)}
    </div>

    <div class="griglia" style="align-content:start">
      ${riq("Chi pulisce", `<ul class="cfg" style="margin:-16px -18px">
        ${lucia ? `
        ${rigaCfg("Nome", "Compare accanto a ogni spunta e nel modulo pagamenti.", `<input type="text" data-persona-nome="${lucia.id}" value="${esc(lucia.nome)}" style="min-width:170px">`)}
        ${rigaCfg("Tariffa oraria", "Usata per calcolare quanto e dovuto in base alle ore lavorate.", `<div style="display:flex;align-items:center;gap:8px"><input type="number" min="0" step="0.5" data-persona-tariffa="${lucia.id}" value="${lucia.tariffa_oraria || 0}" style="min-width:90px"><span style="color:var(--tenue)">euro/ora</span></div>`)}
        ` : `<li><span class="tx"><span>Nessuna persona con ruolo "chi pulisce". Aggiungila da Casa e famiglia.</span></span></li>`}
      </ul>
      ${lucia ? `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
        <button class="btn chiaro pieno" data-salva-tariffa="${lucia.id}">Salva nome e tariffa</button>
      </div>` : ""}`)}

      ${riq("Promemoria", `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg("Segnala le voci scadute", "Compaiono in rosso nel riquadro della home.", interruttore(true, COLORE))}
        ${rigaCfg("Riepilogo della domenica sera", "", interruttore(true, COLORE))}
      </ul>`)}
    </div>
  </div>`;
  }
  function fraseConto(nome, differenza) {
    if (Math.abs(differenza) < 5e-3) {
      return { testo: nome + ": conto in pari", sotto: "Quanto pagato corrisponde esattamente al dovuto.", classe: "neutra" };
    }
    if (differenza > 0) {
      return {
        testo: nome + " \xE8 a debito di " + differenza.toFixed(2).replace(".", ",") + " \u20AC",
        sotto: "Ha ricevuto " + differenza.toFixed(2).replace(".", ",") + " \u20AC in pi\xF9 del dovuto: si scala dal prossimo pagamento.",
        classe: "ambra"
      };
    }
    return {
      testo: nome + " \xE8 a credito di " + Math.abs(differenza).toFixed(2).replace(".", ",") + " \u20AC",
      sotto: "Le devi ancora " + Math.abs(differenza).toFixed(2).replace(".", ",") + " \u20AC.",
      classe: "rossa"
    };
  }
  function bloccoPersona(p) {
    const conto = contoPersona(p.id);
    const frase = fraseConto(p.nome, conto.differenza);
    const pagamenti = pagamentiDi(p.id);
    return riq(p.nome, `
    <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin-bottom:18px">
      <div><b style="font-size:1.7rem;letter-spacing:-.03em;color:${COLORE}">${conto.oreTotali.toFixed(1).replace(".", ",")}</b>
        <span class="occhiello" style="display:block">ore lavorate in tutto</span></div>
      <div><b style="font-size:1.7rem;letter-spacing:-.03em;color:${COLORE}">${conto.dovuto.toFixed(2).replace(".", ",")} \u20AC</b>
        <span class="occhiello" style="display:block">dovuto a ${p.tariffa_oraria} \u20AC/ora</span></div>
      <div><b style="font-size:1.7rem;letter-spacing:-.03em;color:${COLORE}">${conto.pagato.toFixed(2).replace(".", ",")} \u20AC</b>
        <span class="occhiello" style="display:block">pagato finora</span></div>
    </div>
    <div class="urg ${frase.classe === "neutra" ? "calma" : ""}" style="cursor:default;${frase.classe === "rossa" ? "border-color:#EBCEC8" : ""}">
      <span class="emj">${frase.classe === "neutra" ? "\u2705" : frase.classe === "ambra" ? "\u{1F4B6}" : "\u{1F514}"}</span>
      <span><b style="${frase.classe === "ambra" ? "color:#8A5F0B" : frase.classe === "rossa" ? "color:var(--rosso)" : ""}">${esc(frase.testo)}</b>
      <span>${esc(frase.sotto)}</span></span>
    </div>
    <p class="section-t" style="margin:20px 0 0">Storico pagamenti</p>
    <div style="margin:0 -18px">
      ${pagamenti.length ? pagamenti.map((pg) => `
        <div class="log-riga">
          <span class="log-punto" style="--c:${COLORE}"></span>
          <span class="tx"><strong>${Number(pg.importo).toFixed(2).replace(".", ",")} \u20AC</strong>
            <span>${gm(pg.data)}${pg.nota ? " \xB7 " + esc(pg.nota) : ""}</span></span>
          <div class="riga-azioni">
            <button data-mod-pag="${pg.id}" title="Modifica">\u270E</button>
          </div>
        </div>`).join("") : `<p class="vuoto">Nessun pagamento ancora registrato</p>`}
    </div>
    <div style="padding:16px 0 0">
      <button class="btn pieno" style="background:${COLORE}" data-nuovo-pag="${p.id}">Registra un pagamento</button>
    </div>
  `, { classe: "tinta", colore: COLORE });
  }
  function vistaPagamenti() {
    const collaboratrici = S.dati.persone.filter((p) => p.ruolo === "collaboratrice");
    if (!collaboratrici.length) {
      return riq("Pagamenti", vuoto('Nessuna persona con ruolo "chi pulisce" al momento. Aggiungila da Casa e famiglia per attivare il conto.'));
    }
    return `<div class="griglia" style="gap:18px">${collaboratrici.map(bloccoPersona).join("")}</div>`;
  }
  var pulizie_default = {
    id: "pulizie",
    nome: "Pulizie",
    emoji: "\u{1F9FD}",
    colore: COLORE,
    sezioni: [
      { id: "checklist", nome: "Checklist" },
      { id: "ore", nome: "Ore e storico" },
      { id: "pagamenti", nome: "Pagamenti" },
      { id: "impostazioni", nome: "Impostazioni" }
    ],
    distintivo() {
      const av = avanzamentoPulizie();
      return { n: av.restanti, caldo: false };
    },
    render(sezione) {
      if (meseScelto === null) meseScelto = iso(OGGI).slice(0, 7);
      if (sezione === "ore") return vistaOre();
      if (sezione === "pagamenti") return vistaPagamenti();
      if (sezione === "impostazioni") return vistaImpostazioni();
      return vistaChecklist();
    },
    aggancia(root, contesto) {
      root.addEventListener("click", async (e) => {
        var _a, _b, _c, _d;
        const g2 = e.target.closest("[data-gruppo]");
        if (g2) {
          const id = g2.dataset.gruppo;
          aperti.has(id) ? aperti.delete(id) : aperti.add(id);
          contesto.ridisegna();
          return;
        }
        const ms = e.target.closest("[data-mese]");
        if (ms) {
          const n = parseInt(ms.dataset.mese, 10);
          if (n === 0) {
            meseScelto = iso(OGGI).slice(0, 7);
          } else {
            const [a, m] = meseScelto.split("-").map(Number);
            const d = new Date(a, m - 1 + n, 1);
            meseScelto = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
          }
          contesto.ridisegna();
          return;
        }
        const sett = e.target.closest("[data-sett]");
        if (sett) {
          const n = parseInt(sett.dataset.sett, 10);
          const nuova = n === 0 ? lunedi() : piu(/* @__PURE__ */ new Date(S.settimana + "T00:00:00"), n * 7);
          carica(iso(nuova));
          return;
        }
        const seg = e.target.closest("[data-segna]");
        if (seg) {
          const voce = seg.dataset.voce, tipo = seg.dataset.segna;
          const attuale = spunta(voce);
          const v = S.dati.pulizie.voci.find((x) => x.id === voce);
          if ((attuale == null ? void 0 : attuale.stato) === tipo) {
            applicaSpunta(voce, null);
            prova(api.togliSpunta(voce, S.settimana));
            avviso("Spunta tolta");
            return;
          }
          const r = await modaleData({
            titolo: (v == null ? void 0 : v.nome) || voce,
            sottotitolo: tipo === "fatto" ? "Quando e stata completata?" : "Quando e stata iniziata?",
            persone: S.dati.persone.filter((p) => p.ruolo !== "bambina"),
            personaScelta: (attuale == null ? void 0 : attuale.persona_id) || ((_a = S.dati.persone.find((p) => p.ruolo === "collaboratrice")) == null ? void 0 : _a.id),
            mostraTogli: !!attuale
          });
          if (!r) return;
          if (r.azione === "togli") {
            applicaSpunta(voce, null);
            prova(api.togliSpunta(voce, S.settimana));
            avviso("Spunta tolta");
            return;
          }
          applicaSpunta(voce, tipo, r.data, r.persona);
          aggiungiRegistroLocale("pulizie", tipo, (v == null ? void 0 : v.nome) || voce, r.persona);
          prova(api.spuntaPulizia({
            voce_id: voce,
            settimana: S.settimana,
            stato: tipo,
            data: iso(r.data),
            persona_id: r.persona
          }));
          avviso((tipo === "fatto" ? "Fatto il " : "Parziale dal ") + gm(r.data));
          return;
        }
        const nv = e.target.closest("[data-nota-voce]");
        if (nv) {
          const voce = nv.dataset.notaVoce;
          const v = S.dati.pulizie.voci.find((x) => x.id === voce);
          const attuale = spunta(voce);
          const r = await modaleForm({
            titolo: "Nota su: " + ((v == null ? void 0 : v.nome) || voce),
            colore: COLORE,
            sottotitolo: "Resta scritta sotto la voce per tutta la settimana.",
            valori: { nota: (attuale == null ? void 0 : attuale.nota) || "" },
            campi: [{
              nome: "nota",
              etichetta: "La nota",
              tipo: "testolungo",
              placeholder: "Es. manca il detergente, rifatto solo meta"
            }],
            permettiElimina: !!(attuale == null ? void 0 : attuale.nota)
          });
          if (!r) return;
          const testo = r.azione === "elimina" ? "" : (r.valori.nota || "").trim();
          applicaNotaVoce(voce, testo);
          prova(api.spuntaPulizia({
            voce_id: voce,
            settimana: S.settimana,
            stato: (attuale == null ? void 0 : attuale.stato) || "nota",
            nota: testo || null,
            data: iso(attuale ? new Date(attuale.data) : OGGI),
            persona_id: (attuale == null ? void 0 : attuale.persona_id) || null
          }));
          avviso(testo ? "Nota salvata" : "Nota tolta");
          return;
        }
        const dt = e.target.closest("[data-data]");
        if (dt) {
          const voce = S.dati.pulizie.voci.find((v) => v.id === dt.dataset.data);
          const attuale = spunta(voce.id);
          const r = await modaleData({
            titolo: voce.nome,
            sottotitolo: attuale ? "Registrata il " + gm(attuale.data) + ". Cambia la data se serve." : "Scegli quando \xE8 stata fatta.",
            persone: S.dati.persone.filter((p) => p.ruolo !== "bambina"),
            personaScelta: (attuale == null ? void 0 : attuale.persona_id) || ((_b = S.dati.persone.find((p) => p.ruolo === "collaboratrice")) == null ? void 0 : _b.id)
          });
          if (!r) return;
          if (r.azione === "togli") {
            applicaSpunta(voce.id, null);
            prova(api.togliSpunta(voce.id, S.settimana));
          } else {
            applicaSpunta(voce.id, "fatto", r.data, r.persona);
            aggiungiRegistroLocale("pulizie", "fatto", voce.nome, r.persona);
            prova(api.spuntaPulizia({
              voce_id: voce.id,
              settimana: S.settimana,
              stato: "fatto",
              data: iso(r.data),
              persona_id: r.persona
            }));
            avviso("Registrata il " + gm(r.data));
          }
          return;
        }
        if (e.target.closest("[data-nuova-giornata]")) {
          const opzChi = S.dati.persone.filter((p) => p.ruolo !== "bambina").map((p) => ({ id: p.id, nome: p.nome }));
          const r = await modaleForm({
            titolo: "Aggiungi una giornata lavorata",
            colore: COLORE,
            sottotitolo: "Le ore vengono calcolate dall orario di inizio e fine.",
            valori: {
              data: iso(OGGI),
              ora_inizio: "09:00",
              ora_fine: "12:00",
              persona_id: ((_c = S.dati.persone.find((p) => p.ruolo === "collaboratrice")) == null ? void 0 : _c.id) || ""
            },
            campi: [
              { nome: "data", etichetta: "Giorno", tipo: "data", richiesto: true },
              { nome: "ora_inizio", etichetta: "Ora di inizio", tipo: "ora", richiesto: true },
              { nome: "ora_fine", etichetta: "Ora di fine", tipo: "ora", richiesto: true },
              { nome: "persona_id", etichetta: "Chi ha lavorato", tipo: "select", opzioni: opzChi }
            ]
          });
          if (!r || r.azione !== "salva") return;
          const { data: data2, ora_inizio, ora_fine, persona_id } = r.valori;
          if (!data2 || !ora_inizio || !ora_fine) {
            avviso("Servono giorno, inizio e fine");
            return;
          }
          const min = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3, 5), 10);
          const ore = Math.round((min(ora_fine) - min(ora_inizio)) / 6) / 10;
          if (ore <= 0) {
            avviso("L orario di fine deve venire dopo quello di inizio");
            return;
          }
          const persona2 = persona(persona_id);
          S.dati.pulizie.ore.unshift({
            id: "loc" + Date.now(),
            persona_id,
            data: data2,
            ora_inizio,
            ora_fine,
            ore,
            tariffa_oraria: (_d = persona2 == null ? void 0 : persona2.tariffa_oraria) != null ? _d : null
          });
          await prova(api.aggiungiOre({ data: data2, ora_inizio, ora_fine, persona_id }));
          const lunGiornata = iso(lunedi(/* @__PURE__ */ new Date(data2 + "T00:00:00")));
          if (lunGiornata !== S.settimana) {
            avviso("Giornata aggiunta, vado alla settimana del " + gm(data2));
            carica(lunGiornata);
            return;
          }
          avvisa();
          avviso("Giornata aggiunta: " + String(ore).replace(".", ",") + " ore");
          return;
        }
        if (e.target.closest("[data-note-settimana]")) {
          const chiave2 = chiaveNote(S.settimana);
          const mia = note(chiave2)[0];
          const r = await modaleForm({
            titolo: "Note della settimana",
            colore: COLORE,
            sottotitolo: "Che cosa non e stato fatto, che cosa resta da recuperare.",
            valori: { testo: (mia == null ? void 0 : mia.testo) || "" },
            campi: [{
              nome: "testo",
              etichetta: "Note",
              tipo: "testolungo",
              placeholder: "Es. vetri non fatti, finiti i sacchi umido"
            }],
            permettiElimina: !!mia
          });
          if (!r) return;
          if (r.azione === "elimina" && mia) {
            rimuoviNotaLocale(mia.id);
            await prova(api.eliminaNota(mia.id));
            avviso("Note tolte");
          } else if (r.azione === "salva") {
            const testo = (r.valori.testo || "").trim();
            if (!testo && mia) {
              rimuoviNotaLocale(mia.id);
              await prova(api.eliminaNota(mia.id));
            } else if (mia) {
              modificaNotaLocale(mia.id, testo);
              await prova(api.modificaNota({ id: mia.id, testo }));
            } else if (testo) {
              aggiungiNotaLocale({
                id: "loc" + Date.now(),
                modulo: chiave2,
                testo,
                creato_il: (/* @__PURE__ */ new Date()).toISOString()
              });
              await prova(api.creaNota({ modulo: chiave2, testo }));
            }
            avviso("Note salvate");
          }
          avvisa();
          return;
        }
        if (e.target.closest("[data-aggiungi-nota]")) {
          const campo = root.querySelector("#nuova-nota");
          const testo = ((campo == null ? void 0 : campo.value) || "").trim();
          if (!testo) {
            avviso("Scrivi prima la nota");
            return;
          }
          aggiungiNotaLocale({
            id: "loc" + Date.now(),
            modulo: "pulizie",
            testo,
            creato_il: (/* @__PURE__ */ new Date()).toISOString()
          });
          prova(api.creaNota({ modulo: "pulizie", testo }));
          avviso("Nota aggiunta");
          return;
        }
        const modNota = e.target.closest("[data-mod-nota]");
        if (modNota) {
          const n = note("pulizie").find((x) => String(x.id) === modNota.dataset.modNota);
          const r = await modaleForm({
            titolo: "Modifica la nota",
            colore: COLORE,
            permettiElimina: true,
            valori: { testo: n.testo },
            campi: [{ nome: "testo", etichetta: "Testo della nota", tipo: "testolungo", richiesto: true }]
          });
          if ((r == null ? void 0 : r.azione) === "salva" && r.valori.testo.trim()) {
            modificaNotaLocale(n.id, r.valori.testo.trim());
            prova(api.modificaNota({ id: n.id, testo: r.valori.testo.trim() }));
            avviso("Nota aggiornata");
          } else if ((r == null ? void 0 : r.azione) === "elimina") {
            rimuoviNotaLocale(n.id);
            prova(api.eliminaNota(n.id));
            avviso("Nota eliminata");
          }
          return;
        }
        const elNota = e.target.closest("[data-elimina-nota]");
        if (elNota) {
          rimuoviNotaLocale(elNota.dataset.eliminaNota);
          prova(api.eliminaNota(elNota.dataset.eliminaNota));
          avviso("Nota eliminata");
          return;
        }
        const opzCat = categorie("pulizie").map((c) => ({ id: c.id, nome: c.nome }));
        const opzFreq = Object.entries(FREQ).map(([id, nome]) => ({ id, nome }));
        const opzPersone = [{ id: "", nome: "Nessuno in particolare" }, ...S.dati.persone.map((p) => ({ id: p.id, nome: p.nome }))];
        if (e.target.closest("[data-nuova-voce]")) {
          const r = await modaleForm({
            titolo: "Nuova voce di checklist",
            colore: COLORE,
            campi: [
              { nome: "nome", etichetta: "Nome della voce", richiesto: true, placeholder: "Es. Vetri del salotto" },
              { nome: "categoria_id", etichetta: "Zona", tipo: "select", opzioni: opzCat, richiesto: true },
              { nome: "frequenza", etichetta: "Ogni quanto", tipo: "select", opzioni: opzFreq, difetto: "settimanale" },
              { nome: "icona", etichetta: "Icona (una emoji)", placeholder: "\u{1F9FD}", difetto: "\u{1F9FD}" }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva" && r.valori.nome) {
            const nuova = __spreadProps(__spreadValues({ id: "loc" + Date.now() }, r.valori), { ogni_giorni: FREQ[r.valori.frequenza] ? void 0 : 7 });
            aggiungiVoceLocale(nuova);
            prova(api.creaVoce(r.valori));
            avviso("Voce aggiunta alla checklist");
          }
          return;
        }
        const modVoce = e.target.closest("[data-mod-voce]");
        if (modVoce) {
          const v = S.dati.pulizie.voci.find((x) => x.id === modVoce.dataset.modVoce);
          const r = await modaleForm({
            titolo: v.nome,
            colore: COLORE,
            permettiElimina: true,
            valori: { nome: v.nome, categoria_id: v.categoria_id, frequenza: v.frequenza, icona: v.icona },
            campi: [
              { nome: "nome", etichetta: "Nome della voce", richiesto: true },
              { nome: "categoria_id", etichetta: "Zona", tipo: "select", opzioni: opzCat },
              { nome: "frequenza", etichetta: "Ogni quanto", tipo: "select", opzioni: opzFreq },
              { nome: "icona", etichetta: "Icona" }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva") {
            modificaVoceLocale(v.id, r.valori);
            prova(api.modificaVoce(__spreadValues({ id: v.id }, r.valori)));
            avviso("Voce aggiornata");
          } else if ((r == null ? void 0 : r.azione) === "elimina") {
            rimuoviVoceLocale(v.id);
            prova(api.eliminaVoce(v.id));
            avviso("Voce tolta dalla checklist");
          }
          return;
        }
        const elVoce = e.target.closest("[data-elimina-voce]");
        if (elVoce) {
          rimuoviVoceLocale(elVoce.dataset.eliminaVoce);
          prova(api.eliminaVoce(elVoce.dataset.eliminaVoce));
          avviso("Voce tolta dalla checklist");
          return;
        }
        const modOre = e.target.closest("[data-mod-ore]");
        if (modOre) {
          const o = S.dati.pulizie.ore.find((x) => String(x.id) === modOre.dataset.modOre);
          const r = await modaleForm({
            titolo: "Correggi la giornata",
            colore: COLORE,
            permettiElimina: true,
            valori: { data: o.data, ora_inizio: o.ora_inizio, ora_fine: o.ora_fine, persona_id: o.persona_id || "" },
            campi: [
              { nome: "data", etichetta: "Giorno", tipo: "data", richiesto: true },
              { nome: "ora_inizio", etichetta: "Ora inizio (es. 09:00)" },
              { nome: "ora_fine", etichetta: "Ora fine (es. 12:00)" },
              { nome: "persona_id", etichetta: "Chi", tipo: "select", opzioni: opzPersone }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva") {
            modificaOreLocale(o.id, r.valori);
            prova(api.modificaOre(__spreadValues({ id: o.id }, r.valori)));
            avviso("Giornata corretta");
          } else if ((r == null ? void 0 : r.azione) === "elimina") {
            rimuoviOreLocale(o.id);
            prova(api.eliminaOre(o.id));
            avviso("Giornata eliminata");
          }
          return;
        }
        const elOre = e.target.closest("[data-elimina-ore]");
        if (elOre) {
          rimuoviOreLocale(elOre.dataset.eliminaOre);
          prova(api.eliminaOre(elOre.dataset.eliminaOre));
          avviso("Giornata eliminata");
          return;
        }
        if (e.target.closest("[data-salva-tariffa]")) {
          const id = e.target.closest("[data-salva-tariffa]").dataset.salvaTariffa;
          const nome = root.querySelector(`[data-persona-nome="${id}"]`).value.trim();
          const tariffa = Number(root.querySelector(`[data-persona-tariffa="${id}"]`).value) || 0;
          modificaPersonaLocale(id, { nome, tariffa_oraria: tariffa });
          prova(api.modificaPersona({ id, nome, tariffa_oraria: tariffa }));
          avviso("Nome e tariffa aggiornati");
          return;
        }
        const nuovoPag = e.target.closest("[data-nuovo-pag]");
        if (nuovoPag) {
          const personaId = nuovoPag.dataset.nuovoPag;
          const r = await modaleForm({
            titolo: "Registra un pagamento",
            colore: COLORE,
            valori: { data: iso(OGGI) },
            campi: [
              { nome: "importo", etichetta: "Quanto hai pagato (\u20AC)", tipo: "numero", min: 0, step: 0.5, richiesto: true },
              { nome: "data", etichetta: "Quando", tipo: "data", richiesto: true },
              { nome: "nota", etichetta: "Nota", placeholder: "Es. Contanti, bonifico..." }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva" && r.valori.importo) {
            const pag = __spreadProps(__spreadValues({ id: "loc" + Date.now(), persona_id: personaId }, r.valori), { importo: Number(r.valori.importo) });
            aggiungiPagamentoLocale(pag);
            prova(api.creaPagamento(__spreadValues({ persona_id: personaId }, r.valori)));
            avviso("Pagamento registrato");
          }
          return;
        }
        const modPag = e.target.closest("[data-mod-pag]");
        if (modPag) {
          const pag = (S.dati.pagamenti || []).find((x) => String(x.id) === modPag.dataset.modPag);
          const r = await modaleForm({
            titolo: "Modifica il pagamento",
            colore: COLORE,
            permettiElimina: true,
            valori: { importo: pag.importo, data: pag.data, nota: pag.nota || "" },
            campi: [
              { nome: "importo", etichetta: "Importo (\u20AC)", tipo: "numero", min: 0, step: 0.5, richiesto: true },
              { nome: "data", etichetta: "Quando", tipo: "data" },
              { nome: "nota", etichetta: "Nota" }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva") {
            const v = __spreadProps(__spreadValues({}, r.valori), { importo: Number(r.valori.importo) });
            modificaPagamentoLocale(pag.id, v);
            prova(api.modificaPagamento(__spreadValues({ id: pag.id }, v)));
            avviso("Pagamento aggiornato");
          } else if ((r == null ? void 0 : r.azione) === "elimina") {
            rimuoviPagamentoLocale(pag.id);
            prova(api.eliminaPagamento(pag.id));
            avviso("Pagamento tolto");
          }
        }
        if (e.target.closest("[data-vai-pagamenti]")) {
          contesto.vai("pulizie", "pagamenti");
        }
      });
      root.addEventListener("keydown", (e) => {
        var _a;
        if (e.key === "Enter" && e.target.id === "nuova-nota") {
          e.preventDefault();
          (_a = root.querySelector("[data-aggiungi-nota]")) == null ? void 0 : _a.click();
        }
      });
    }
  };

  // public/js/moduli/attivita.js
  var COLORE2 = "var(--attivita)";
  function vistaScadenze() {
    const lista = attivitaConScadenza();
    const cats = categorie("attivita");
    const righe = lista.map((a) => {
      var _a;
      return `
    <tr>
      <td><b>${esc(a.nome)}</b><span class="sm">${esc(((_a = categoria(a.categoria_id)) == null ? void 0 : _a.nome) || "")}</span></td>
      <td>${esc(nomePersona(a.persona_id))}</td>
      <td><span class="pill ${a.etichetta.classe}">${esc(a.etichetta.testo)}</span>
          <span class="sm">${gm(a.quando)}</span></td>
      <td>${a.ricorrenza_giorni ? "ogni " + (a.ricorrenza_giorni === 365 ? "anno" : a.ricorrenza_giorni === 180 ? "6 mesi" : a.ricorrenza_giorni + " giorni") : "una volta"}</td>
      <td style="text-align:right"><div class="riga-azioni" style="justify-content:flex-end;display:inline-flex">
        <button class="btn piccolo" style="background:var(--attivita)" data-fatta="${a.id}">Fatta</button>
        <button data-mod-att="${a.id}">Modifica</button>
      </div></td>
    </tr>`;
    });
    return `<div class="griglia g-lato">
    ${riq(
      "Scadenze",
      tabella(["Attivit\xE0", "Chi", "Scade", "Ricorre", ""], righe) + `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
           <button class="btn chiaro pieno" data-nuova-attivita>Nuova attivit\xE0</button></div>`,
      { raso: true, classe: "tinta", colore: COLORE2, meta: "in rosso quelle passate e di oggi" }
    )}
    <div class="griglia" style="align-content:start">
      ${riq("Per categoria", cats.map((c) => {
      const n = lista.filter((a) => a.categoria_id === c.id).length;
      return `<div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;font-size:.87rem;margin-bottom:6px">
            <span>${c.icona} ${esc(c.nome)}</span><span style="color:var(--tenue)">${n}</span></div>
          ${barra(lista.length ? n / lista.length * 100 : 0, COLORE2)}</div>`;
    }).join(""))}
      ${riq("Fatte di recente", `<ul class="righe" style="margin:-16px -18px">
        ${lista.filter((a) => a.ultima_esecuzione).slice(0, 4).map((a) => `<li><span class="tx"><strong>${esc(a.nome)}</strong>
           <span>${esc(nomePersona(a.persona_id))}</span></span>
           <span class="qd">${gm(a.ultima_esecuzione)}</span></li>`).join("") || `<li><span class="tx"><span>Ancora nessuna registrata</span></span></li>`}
      </ul>`)}
    </div>
  </div>`;
  }
  function vistaImpostazioni2() {
    return `<div class="griglia g-lato">
    <div class="griglia" style="align-content:start">
      ${riq("Categorie", `<div class="etichette">
        ${categorie("attivita").map((c) => `<span class="et-i">${c.icona} ${esc(c.nome)}</span>`).join("")}
        <span class="et-i aggiungi">Aggiungi categoria</span></div>`, { classe: "tinta", colore: COLORE2 })}
      ${riq("Ricorrenze", `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg("Ricalcola dalla data di completamento", "Se la fai con dieci giorni di ritardo, la prossima scadenza slitta di dieci giorni.", interruttore(true, COLORE2))}
        ${rigaCfg("Salta i giorni festivi", "Sposta la scadenza al primo giorno feriale utile.", interruttore(false, COLORE2))}
        ${rigaCfg("Tieni lo storico per", "", `<select><option>1 anno</option><option selected>3 anni</option><option>Sempre</option></select>`)}
      </ul>`)}
    </div>
    <div class="griglia" style="align-content:start">
      ${riq("Notifiche", `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg("Primo avviso", "", `<select><option>3 giorni prima</option><option selected>7 giorni prima</option><option>14 giorni prima</option></select>`)}
        ${rigaCfg("Secondo avviso", "Il giorno stesso, alle 09:00.", interruttore(true, COLORE2))}
        ${rigaCfg("Insisti se \xE8 in ritardo", "Un avviso al giorno finch\xE9 non risulta fatta.", interruttore(true, COLORE2))}
      </ul>`)}
      ${riq("Riquadro scadenze in home", `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg("Quanto guarda avanti", "", `<select><option>3 giorni</option><option selected>7 giorni</option><option>14 giorni</option></select>`)}
        ${rigaCfg("Segna in rosso", "", `<select><option>Solo le scadute</option><option selected>Scadute e di oggi</option><option>Scadute, oggi e domani</option></select>`)}
        ${rigaCfg("Includi i cambi biancheria", "", interruttore(true, COLORE2))}
        ${rigaCfg("Includi le voci di pulizia", "", interruttore(true, COLORE2))}
      </ul>`)}
    </div>
  </div>`;
  }
  var attivita_default = {
    id: "attivita",
    nome: "Attivit\xE0 programmate",
    emoji: "\u{1F514}",
    colore: COLORE2,
    sezioni: [{ id: "scadenze", nome: "Scadenze" }, { id: "impostazioni", nome: "Impostazioni" }],
    distintivo() {
      const n = attivitaConScadenza().filter((a) => a.giorni <= 0).length;
      return { n: n || attivitaConScadenza().length, caldo: n > 0 };
    },
    render(sezione) {
      return sezione === "impostazioni" ? vistaImpostazioni2() : vistaScadenze();
    },
    aggancia(root) {
      root.addEventListener("click", async (e) => {
        const fatta = e.target.closest("[data-fatta]");
        if (fatta) {
          const a = S.dati.attivita.find((x) => x.id === fatta.dataset.fatta);
          if (!a) return;
          a.ultima_esecuzione = iso(OGGI);
          if (a.ricorrenza_giorni) {
            const p = new Date(OGGI);
            p.setDate(p.getDate() + a.ricorrenza_giorni);
            a.scadenza = iso(p);
          }
          aggiungiRegistroLocale("attivita", "fatto", a.nome, a.persona_id);
          prova(api.attivitaFatta(a.id));
          avvisa();
          avviso(a.nome + ": prossima scadenza " + (a.scadenza ? relativa(a.scadenza) : "nessuna"));
          return;
        }
        const opzCat = categorie("attivita").map((c) => ({ id: c.id, nome: c.nome }));
        const opzPersone = [{ id: "", nome: "Nessuno in particolare" }, ...S.dati.persone.map((p) => ({ id: p.id, nome: p.nome }))];
        const opzRic = [
          { id: "", nome: "Una volta sola" },
          { id: "30", nome: "Ogni mese" },
          { id: "90", nome: "Ogni 3 mesi" },
          { id: "180", nome: "Ogni 6 mesi" },
          { id: "365", nome: "Ogni anno" }
        ];
        if (e.target.closest("[data-nuova-attivita]")) {
          const r = await modaleForm({
            titolo: "Nuova attivit\xE0",
            colore: COLORE2,
            valori: { scadenza: iso(OGGI) },
            campi: [
              { nome: "nome", etichetta: "Che cosa", richiesto: true, placeholder: "Es. Revisione auto" },
              { nome: "categoria_id", etichetta: "Categoria", tipo: "select", opzioni: opzCat, richiesto: true },
              { nome: "persona_id", etichetta: "Chi se ne occupa", tipo: "select", opzioni: opzPersone },
              { nome: "scadenza", etichetta: "Scade il", tipo: "data", richiesto: true },
              { nome: "ricorrenza_giorni", etichetta: "Si ripete", tipo: "select", opzioni: opzRic }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva" && r.valori.nome && r.valori.scadenza) {
            const v = __spreadProps(__spreadValues({}, r.valori), { ricorrenza_giorni: r.valori.ricorrenza_giorni ? Number(r.valori.ricorrenza_giorni) : null });
            aggiungiAttivitaLocale(__spreadValues({ id: "loc" + Date.now() }, v));
            prova(api.creaAttivita(v));
            avviso("Attivit\xE0 aggiunta");
          }
          return;
        }
        const mod = e.target.closest("[data-mod-att]");
        if (mod) {
          const a = S.dati.attivita.find((x) => x.id === mod.dataset.modAtt);
          const r = await modaleForm({
            titolo: a.nome,
            colore: COLORE2,
            permettiElimina: true,
            valori: {
              nome: a.nome,
              categoria_id: a.categoria_id,
              persona_id: a.persona_id || "",
              scadenza: a.scadenza,
              ricorrenza_giorni: a.ricorrenza_giorni ? String(a.ricorrenza_giorni) : ""
            },
            campi: [
              { nome: "nome", etichetta: "Che cosa", richiesto: true },
              { nome: "categoria_id", etichetta: "Categoria", tipo: "select", opzioni: opzCat },
              { nome: "persona_id", etichetta: "Chi se ne occupa", tipo: "select", opzioni: opzPersone },
              { nome: "scadenza", etichetta: "Scade il", tipo: "data" },
              { nome: "ricorrenza_giorni", etichetta: "Si ripete", tipo: "select", opzioni: opzRic }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva") {
            const v = __spreadProps(__spreadValues({}, r.valori), { ricorrenza_giorni: r.valori.ricorrenza_giorni ? Number(r.valori.ricorrenza_giorni) : null });
            modificaAttivitaLocale(a.id, v);
            prova(api.modificaAttivita(__spreadValues({ id: a.id }, v)));
            avviso("Attivit\xE0 aggiornata");
          } else if ((r == null ? void 0 : r.azione) === "elimina") {
            rimuoviAttivitaLocale(a.id);
            prova(api.eliminaAttivita(a.id));
            avviso("Attivit\xE0 eliminata");
          }
        }
      });
    }
  };

  // public/js/moduli/calendario.js
  var COLORE3 = "var(--calendario)";
  var mese = null;
  function grigliaMese() {
    const [anno, m] = mese.split("-").map(Number);
    const primo = new Date(anno, m - 1, 1);
    const giorniMese = new Date(anno, m, 0).getDate();
    const scarto2 = (primo.getDay() + 6) % 7;
    const celle = Math.ceil((scarto2 + giorniMese) / 7) * 7;
    const scadenze = attivitaConScadenza();
    const intestazioni = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
    let html = '<div class="mese">' + intestazioni.map((g2) => `<div class="mese-int">${g2}</div>`).join("");
    for (let i = 0; i < celle; i++) {
      const giorno = i - scarto2 + 1;
      if (giorno < 1 || giorno > giorniMese) {
        html += '<div class="mese-cella fuori"></div>';
        continue;
      }
      const d = new Date(anno, m - 1, giorno);
      const gIso = iso(d);
      const oggi = gIso === iso(OGGI);
      const eventi = (S.dati.eventi || []).filter((e) => e.inizio.slice(0, 10) === gIso).sort((a, b) => a.inizio.localeCompare(b.inizio));
      const att = scadenze.filter((a) => iso(a.quando) === gIso);
      html += `<div class="mese-cella ${oggi ? "oggi" : ""}" data-giorno="${gIso}">
      <span class="num">${giorno}</span>
      ${eventi.map((e) => `<button class="voce-cal" data-mod-evento="${e.id}" style="--ec:${COLORE3}">
          <b>${esc(e.inizio.slice(11, 16))}</b> ${esc(e.titolo)}</button>`).join("")}
      ${att.map((a) => `<button class="voce-cal" data-mod-att="${a.id}"
          style="--ec:${a.giorni <= 0 ? "var(--rosso)" : "var(--attivita)"}">
          ${esc(a.nome)}</button>`).join("")}
    </div>`;
    }
    return html + "</div>";
  }
  function barraMese() {
    const [anno, m] = mese.split("-").map(Number);
    const corrente = mese === iso(OGGI).slice(0, 7);
    const nEventi = (S.dati.eventi || []).filter((e) => e.inizio.slice(0, 7) === mese).length;
    const nAtt = attivitaConScadenza().filter((a) => iso(a.quando).slice(0, 7) === mese).length;
    return `<div class="settimana-barra">
    <button class="nav" data-cal-mese="-1" aria-label="Mese precedente">&lsaquo;</button>
    <button class="nav" data-cal-mese="1" aria-label="Mese successivo">&rsaquo;</button>
    <span class="et">
      <b>${MESI_LUNGHI[m - 1]} ${anno}</b>
      <span>${nEventi} ${nEventi === 1 ? "impegno" : "impegni"} &middot; ${nAtt} ${nAtt === 1 ? "scadenza" : "scadenze"}</span>
    </span>
    ${corrente ? "" : '<button class="btn chiaro piccolo" data-cal-mese="0">Torna a questo mese</button>'}
    <button class="btn piccolo" style="background:var(--calendario)" data-nuovo-evento>Nuovo impegno</button>
  </div>`;
  }
  function cardProssimi() {
    const prossimi = (S.dati.eventi || []).filter((e) => e.inizio.slice(0, 10) >= iso(OGGI)).sort((a, b) => a.inizio.localeCompare(b.inizio)).slice(0, 10);
    return riq(
      "Prossimi impegni",
      (prossimi.length ? prossimi.map((e) => `
      <div class="log-riga">
        <span class="log-punto" style="--c:${COLORE3}"></span>
        <span class="tx"><strong>${esc(e.titolo)}</strong>
          <span>${esc(new Date(e.inizio).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }))}
          alle ${esc(e.inizio.slice(11, 16))}${e.luogo ? " &middot; " + esc(e.luogo) : ""}${e.persona_id ? " &middot; " + esc(nomePersona(e.persona_id)) : ""}</span></span>
        <div class="riga-azioni">
          <button data-mod-evento="${e.id}">Modifica</button>
          <button data-elimina-evento="${e.id}" class="pericolo">Elimina</button>
        </div>
      </div>`).join("") : vuoto("Nessun impegno in programma")) + `<div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
       <button class="btn pieno" style="background:${COLORE3}" data-nuovo-evento>Aggiungi un impegno</button>
     </div>`,
      { raso: true, meta: prossimi.length ? "in ordine di data" : "" }
    );
  }
  function campiEvento() {
    return [
      { nome: "titolo", etichetta: "Che cosa", richiesto: true, placeholder: "Es. Visita dal pediatra" },
      { nome: "data", etichetta: "Giorno", tipo: "data", richiesto: true },
      { nome: "ora", etichetta: "Ora", tipo: "ora" },
      {
        nome: "persona_id",
        etichetta: "Per chi",
        tipo: "select",
        opzioni: [{ id: "", nome: "Tutta la famiglia" }, ...S.dati.persone.map((p) => ({ id: p.id, nome: p.nome }))]
      },
      { nome: "luogo", etichetta: "Luogo", placeholder: "Facoltativo" },
      { nome: "note", etichetta: "Note", tipo: "testolungo", placeholder: "Facoltativo" }
    ];
  }
  async function nuovoEvento(giorno) {
    const r = await modaleForm({
      titolo: "Nuovo impegno",
      colore: COLORE3,
      valori: { data: giorno || iso(OGGI), ora: "09:00" },
      campi: campiEvento()
    });
    if ((r == null ? void 0 : r.azione) !== "salva" || !r.valori.titolo || !r.valori.data) return;
    const inizio = r.valori.data + "T" + (r.valori.ora || "09:00");
    const evento = {
      id: "loc" + Date.now(),
      titolo: r.valori.titolo,
      calendario: "famiglia",
      persona_id: r.valori.persona_id || null,
      luogo: r.valori.luogo || null,
      note: r.valori.note || null,
      inizio
    };
    aggiungiEventoLocale(evento);
    await prova(api.creaEvento(evento));
    avviso("Impegno aggiunto il " + gm(r.valori.data));
  }
  async function modificaEvento(id) {
    const e = (S.dati.eventi || []).find((x) => String(x.id) === String(id));
    if (!e) return;
    const r = await modaleForm({
      titolo: e.titolo,
      colore: COLORE3,
      permettiElimina: true,
      sottotitolo: "Modifica o elimina questo impegno.",
      valori: {
        titolo: e.titolo,
        data: e.inizio.slice(0, 10),
        ora: e.inizio.slice(11, 16),
        persona_id: e.persona_id || "",
        luogo: e.luogo || "",
        note: e.note || ""
      },
      campi: campiEvento()
    });
    if (!r) return;
    if (r.azione === "elimina") {
      rimuoviEventoLocale(id);
      await prova(api.eliminaEvento(id));
      avviso("Impegno eliminato");
      return;
    }
    const campi = {
      titolo: r.valori.titolo,
      inizio: r.valori.data + "T" + (r.valori.ora || "09:00"),
      persona_id: r.valori.persona_id || null,
      luogo: r.valori.luogo || null,
      note: r.valori.note || null
    };
    modificaEventoLocale(id, campi);
    await prova(api.modificaEvento(__spreadValues({ id }, campi)));
    avviso("Impegno aggiornato");
  }
  var vistaMese = () => barraMese() + riq("", grigliaMese(), { raso: true, classe: "tinta", colore: COLORE3 }) + '<div style="margin-top:18px">' + cardProssimi() + "</div>";
  var calendario_default = {
    id: "calendario",
    nome: "Calendario",
    emoji: "\u{1F4C5}",
    colore: COLORE3,
    sezioni: [
      { id: "mese", nome: "Mese" },
      { id: "attivita", nome: "Attivita programmate" },
      { id: "impostazioni", nome: "Impostazioni" }
    ],
    distintivo() {
      const inRitardo = attivitaConScadenza().filter((a) => a.giorni <= 0).length;
      return { n: inRitardo || eventiDelGiorno().length, caldo: inRitardo > 0 };
    },
    render(sezione, contesto) {
      if (mese === null) mese = iso(OGGI).slice(0, 7);
      if (sezione === "attivita") return attivita_default.render("scadenze", contesto);
      if (sezione === "impostazioni") return attivita_default.render("impostazioni", contesto);
      return vistaMese();
    },
    aggancia(root, contesto) {
      attivita_default.aggancia(root, contesto);
      attivita_default.ridisegna = contesto.ridisegna;
      root.addEventListener("click", async (e) => {
        const nav = e.target.closest("[data-cal-mese]");
        if (nav) {
          const n = parseInt(nav.dataset.calMese, 10);
          if (n === 0) mese = iso(OGGI).slice(0, 7);
          else {
            const [a, m] = mese.split("-").map(Number);
            const d = new Date(a, m - 1 + n, 1);
            mese = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
          }
          contesto.ridisegna();
          return;
        }
        const mod = e.target.closest("[data-mod-evento]");
        if (mod) {
          await modificaEvento(mod.dataset.modEvento);
          return;
        }
        const el = e.target.closest("[data-elimina-evento]");
        if (el) {
          rimuoviEventoLocale(el.dataset.eliminaEvento);
          await prova(api.eliminaEvento(el.dataset.eliminaEvento));
          avviso("Impegno eliminato");
          return;
        }
        if (e.target.closest("[data-nuovo-evento]")) {
          await nuovoEvento();
          return;
        }
        const cella = e.target.closest("[data-giorno]");
        if (cella) await nuovoEvento(cella.dataset.giorno);
      });
    }
  };

  // public/js/moduli/spesa.js
  var COLORE4 = "var(--spesa)";
  var catalogo = null;
  var frequenti = null;
  var suggeriti = [];
  var scritto = "";
  async function caricaExtra(ridisegna) {
    if (catalogo === null) {
      catalogo = [];
      try {
        catalogo = (await api.catalogo()).prodotti || [];
      } catch (e) {
        catalogo = [];
      }
    }
    if (frequenti === null) {
      frequenti = [];
      try {
        frequenti = (await api.frequenti()).frequenti || [];
      } catch (e) {
        frequenti = [];
      }
      if (ridisegna) ridisegna();
    }
  }
  var normalizza = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  function cerca(testo) {
    const k = normalizza(testo);
    if (k.length < 2) return [];
    const inizia = [], dentro = [];
    for (const p of catalogo || []) {
      const n = p.nome_cerca || normalizza(p.nome);
      if (n.indexOf(k) === 0) inizia.push(p);
      else if (n.indexOf(k) > 0) dentro.push(p);
      if (inizia.length >= 6) break;
    }
    return inizia.concat(dentro).slice(0, 6);
  }
  var articolo = (a) => `
  <div class="art ${a.stato === "preso" ? "preso" : ""}">
    <button class="spunta ${a.stato === "preso" ? "on" : ""}" data-preso="${a.id}"></button>
    <span class="tx"><strong>${esc(a.nome)}</strong>
      <span>${esc(a.origine === "iphone" ? "aggiunto dall'iPhone" : a.origine === "ricorrente" ? "articolo ricorrente" : a.origine === "scorta" ? "scorta bassa" : nomePersona(a.persona_id))}</span></span>
    <span class="qd">${esc(a.quantita || "")}</span>
    <div class="riga-azioni"><button data-mod-art="${a.id}">Modifica</button></div>
  </div>`;
  function vistaLista() {
    const cats = categorie("spesa");
    const tutti = S.dati.spesa.articoli;
    const daPrendere = tutti.filter((a) => a.stato === "da_prendere");
    const senza = tutti.filter((a) => !a.categoria_id);
    const gruppi = cats.map((c) => {
      const art = tutti.filter((a) => a.categoria_id === c.id);
      if (!art.length) return "";
      return `
      <div class="gruppo aperto">
        <button class="capo" data-gruppo="sp_${c.id}">
          <span class="emj">${c.icona}</span><b>${esc(c.nome)}</b>
          <span class="avanz">${art.filter((a) => a.stato === "da_prendere").length} da prendere</span>
          <span class="freccia"></span></button>
        <div class="elenco"><div>${art.map(articolo).join("")}</div></div>
      </div>`;
    }).join("");
    const daSmistare = senza.length ? `
    <div class="gruppo aperto">
      <button class="capo" data-gruppo="sp_altro">
        <span class="emj">&#128230;</span><b>Da smistare</b>
        <span class="avanz">${senza.length} senza reparto</span>
        <span class="freccia"></span></button>
      <div class="elenco"><div>${senza.map((a) => `
        <div class="art">
          <button class="spunta ${a.stato === "preso" ? "on" : ""}" data-preso="${a.id}"></button>
          <span class="tx"><strong>${esc(a.nome)}</strong><span>reparto da assegnare</span></span>
          <span class="qd">${esc(a.quantita || "")}</span>
          <div class="riga-azioni"><button data-smista="${a.id}">Dai un reparto</button></div>
        </div>`).join("")}</div></div>
    </div>` : "";
    return `<div class="griglia g-lato">
    ${riq(
      "Lista corrente",
      gruppi + daSmistare || vuoto("La lista e vuota"),
      {
        raso: true,
        classe: "tinta",
        colore: COLORE4,
        meta: plurale(daPrendere.length, "articolo da prendere", "articoli da prendere")
      }
    )}

    <div class="griglia" style="align-content:start">
      ${riq("Aggiungi alla lista", `
        <div style="display:flex;gap:9px">
          <input type="text" id="nuovo-articolo" placeholder="Che cosa serve?"
                 autocomplete="off" value="${esc(scritto)}" style="flex:1;min-width:0">
          <button class="btn" style="background:var(--spesa)" data-aggiungi>Aggiungi</button>
        </div>
        <div id="suggerimenti">${listaSuggerimenti()}</div>
        <p class="nota">Il reparto lo assegna il catalogo da solo, anche a quello che detti dall'iPhone.
        Se non lo conosce, l'articolo finisce in "Da smistare".</p>`)}

      ${riq(
      "Comprati spesso",
      frequenti === null ? '<p class="vuoto">Carico\u2026</p>' : frequenti.length ? `<div class="etichette">${frequenti.map((f) => `<button class="et-i" data-veloce="${esc(f.nome)}">${esc(f.nome)}
                   <span style="color:var(--tenue);font-size:.78rem">${f.volte}</span></button>`).join("")}</div>` : vuoto("Ancora pochi dati: comparira coi primi acquisti"),
      { meta: frequenti && frequenti.length ? "i piu aggiunti in casa" : "" }
    )}
    </div>
  </div>`;
  }
  function listaSuggerimenti() {
    if (!suggeriti.length) return "";
    return `<p class="occhiello" style="margin:14px 0 8px">Suggerimenti</p>
    <div class="etichette">${suggeriti.map((p) => {
      const c = categoria(p.categoria_id);
      return `<button class="et-i" data-suggerito="${esc(p.nome)}">${esc(p.nome)}
        <span style="color:var(--tenue);font-size:.78rem">${esc(c ? c.nome : "")}</span></button>`;
    }).join("")}</div>`;
  }
  function vistaIphone() {
    const url = location.origin + "/api/shortcut";
    return `<div class="griglia g-lato-l">
    ${riq(
      "Il percorso del comando",
      `
      <ol style="list-style:none;margin:0;padding:0">
        ${[
        ["Tocchi l'icona sulla schermata home", "Nessuna app da aprire, nessun accesso da fare."],
        ["Il comando chiede: vedere o aggiungere", "Due voci sole, si sceglie con un pollice."],
        ["Detti che cosa serve", "Anche piu articoli separati dalla virgola."],
        ["Il reparto lo mette il server", "Il catalogo lo riconosce e lo mette al posto giusto."]
      ].map(([t, s], i) => `
          <li style="display:flex;gap:15px;padding-bottom:20px">
            <span style="width:30px;height:30px;border-radius:50%;background:var(--spesa);color:#fff;
              display:flex;align-items:center;justify-content:center;font-weight:700;flex:none">${i + 1}</span>
            <span><b style="display:block">${esc(t)}</b>
            <span style="color:var(--tenue);font-size:.87rem">${esc(s)}</span></span></li>`).join("")}
      </ol>
      <p class="nota">Indirizzo da usare nel comando: <code>${esc(url)}</code></p>`,
      { classe: "tinta", colore: COLORE4 }
    )}

    <div class="griglia" style="align-content:start">
      ${riq("Come appare sull'iPhone", `
        <div class="telefono">
          <div class="sbarra"><span>21:05</span><span>Comandi</span></div>
          <p class="dom">Spesa di casa<br>Che cosa vuoi fare?</p>
          <div class="sc">&#128064; Vedi la lista</div>
          <div class="sc pri">&#10133; Aggiungi qualcosa</div>
        </div>`)}
      ${riq("Collegamento", `<ul class="cfg" style="margin:-16px -18px">
        ${rigaCfg(
      "Stato",
      rete.collegata ? "L app sta leggendo dal database." : "Al momento usa i dati locali.",
      `<span class="pill ${rete.collegata ? "verde" : "ambra"}">${rete.collegata ? "Collegata" : "Non collegata"}</span>`
    )}
        ${rigaCfg(
      "Chiave di casa",
      "La stessa che metti nel comando rapido.",
      `<input type="password" id="campo-chiave" value="${esc(chiave())}" style="min-width:180px">`
    )}
        ${rigaCfg("", "", `<button class="btn piccolo" style="background:var(--spesa)" data-salva-chiave>Salva e riprova</button>`)}
      </ul>`)}
      ${riq("Catalogo prodotti", `
        <p style="margin:0 0 10px;font-size:.92rem">${(catalogo || []).length} prodotti riconosciuti in automatico.</p>
        <p class="nota" style="margin:0">Quando dai un reparto a un articolo finito in "Da smistare",
        il catalogo lo impara: la volta dopo lo riconosce anche dall'iPhone.</p>`)}
    </div>
  </div>`;
  }
  var spesa_default = {
    id: "spesa",
    nome: "Lista della spesa",
    emoji: "\u{1F6D2}",
    colore: COLORE4,
    sezioni: [
      { id: "lista", nome: "Lista" },
      { id: "iphone", nome: "Comando iPhone" }
    ],
    distintivo() {
      return { n: spesaDaPrendere().length, caldo: false };
    },
    render(sezione, contesto) {
      caricaExtra(contesto && contesto.ridisegna);
      return sezione === "iphone" ? vistaIphone() : vistaLista();
    },
    aggancia(root, contesto) {
      const aggiungi = async (nome, categoriaId) => {
        const n = (nome || "").trim();
        if (!n) return;
        aggiungiArticoloLocale(n, "", categoriaId || null);
        aggiungiRegistroLocale("spesa", "aggiunto", n, null);
        scritto = "";
        suggeriti = [];
        await prova(api.aggiungiSpesa({ nome: n, categoria_id: categoriaId || void 0, origine: "tablet" }));
        avviso(n + " aggiunto alla lista");
        carica(S.settimana, { silenzioso: true });
      };
      root.addEventListener("click", async (e) => {
        const g2 = e.target.closest("[data-gruppo]");
        if (g2) {
          g2.closest(".gruppo").classList.toggle("aperto");
          return;
        }
        const p = e.target.closest("[data-preso]");
        if (p) {
          const id = p.dataset.preso;
          const a = S.dati.spesa.articoli.find((x) => String(x.id) === id);
          const nuovo = a.stato === "preso" ? "da_prendere" : "preso";
          applicaSpesa(a.id, { stato: nuovo });
          prova(api.modificaSpesa(id, { stato: nuovo }));
          return;
        }
        if (e.target.closest("[data-aggiungi]")) {
          const campo = root.querySelector("#nuovo-articolo");
          await aggiungi(campo.value);
          return;
        }
        const sug = e.target.closest("[data-suggerito]");
        if (sug) {
          const nome = sug.dataset.suggerito;
          const p2 = (catalogo || []).find((x) => x.nome === nome);
          await aggiungi(nome, p2 && p2.categoria_id);
          return;
        }
        const v = e.target.closest("[data-veloce]");
        if (v) {
          await aggiungi(v.dataset.veloce);
          return;
        }
        const mod = e.target.closest("[data-mod-art]");
        if (mod) {
          const a = S.dati.spesa.articoli.find((x) => String(x.id) === mod.dataset.modArt);
          const r = await modaleForm({
            titolo: a.nome,
            colore: COLORE4,
            permettiElimina: true,
            valori: { nome: a.nome, quantita: a.quantita || "", categoria_id: a.categoria_id || "" },
            campi: [
              { nome: "nome", etichetta: "Che cosa", richiesto: true },
              { nome: "quantita", etichetta: "Quantita", placeholder: "Es. 2 confezioni" },
              {
                nome: "categoria_id",
                etichetta: "Reparto",
                tipo: "select",
                opzioni: [{ id: "", nome: "Da smistare" }, ...categorie("spesa").map((c) => ({ id: c.id, nome: c.nome }))]
              }
            ]
          });
          if (!r) return;
          if (r.azione === "elimina") {
            S.dati.spesa.articoli = S.dati.spesa.articoli.filter((x) => String(x.id) !== String(a.id));
            avvisa();
            await prova(api.rimuoviSpesa(a.id));
            avviso("Articolo tolto");
          } else {
            applicaSpesa(a.id, r.valori);
            await prova(api.modificaSpesa(a.id, r.valori));
            avviso("Articolo aggiornato");
          }
          return;
        }
        const sm = e.target.closest("[data-smista]");
        if (sm) {
          const a = S.dati.spesa.articoli.find((x) => String(x.id) === sm.dataset.smista);
          const r = await modaleForm({
            titolo: a.nome,
            colore: COLORE4,
            sottotitolo: "Il catalogo se lo ricorda: la prossima volta lo riconoscera da solo.",
            valori: { categoria_id: categorie("spesa")[0].id },
            campi: [{
              nome: "categoria_id",
              etichetta: "In che reparto sta",
              tipo: "select",
              opzioni: categorie("spesa").map((c) => ({ id: c.id, nome: c.nome }))
            }]
          });
          if ((r == null ? void 0 : r.azione) !== "salva") return;
          applicaSpesa(a.id, { categoria_id: r.valori.categoria_id });
          await prova(api.modificaSpesa(a.id, { categoria_id: r.valori.categoria_id }));
          await prova(api.imparaProdotto({ nome: a.nome, categoria_id: r.valori.categoria_id }));
          if (catalogo) catalogo.push({ nome: a.nome, nome_cerca: normalizza(a.nome), categoria_id: r.valori.categoria_id });
          avviso("Reparto assegnato, e imparato per la prossima volta");
          return;
        }
        if (e.target.closest("[data-salva-chiave]")) {
          salvaChiave(root.querySelector("#campo-chiave").value.trim());
          avviso("Chiave salvata, ricarico i dati");
          carica();
        }
      });
      root.addEventListener("input", (e) => {
        if (e.target.id !== "nuovo-articolo") return;
        scritto = e.target.value;
        const nuovi = cerca(scritto);
        const cambiati = nuovi.length !== suggeriti.length || nuovi.some((p, i) => p.nome !== suggeriti[i].nome);
        if (!cambiati) return;
        suggeriti = nuovi;
        const box = root.querySelector("#suggerimenti");
        if (box) box.innerHTML = listaSuggerimenti();
      });
      root.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && e.target.id === "nuovo-articolo") {
          e.preventDefault();
          await aggiungi(e.target.value);
        }
      });
    }
  };

  // public/js/moduli/registro.js
  var COLORE5 = "var(--home)";
  var TINTE = { pulizie: "var(--pulizie)", calendario: "var(--calendario)", spesa: "var(--spesa)", attivita: "var(--attivita)" };
  var ETICHETTE = {
    fatto: "segnato come fatto",
    parziale: "segnato come parziale",
    aggiunto: "aggiunto",
    rimosso: "rimosso",
    "cambio biancheria": "cambio registrato"
  };
  var filtro = null;
  function quando(iso2) {
    const d = /* @__PURE__ */ new Date(iso2.replace(" ", "T") + (iso2.includes("Z") ? "" : "Z"));
    const ora = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const oggi = (/* @__PURE__ */ new Date()).toDateString() === d.toDateString();
    return (oggi ? "oggi" : d.toLocaleDateString("it-IT", { day: "numeric", month: "short" })) + " alle " + ora;
  }
  function righeLog() {
    const lista = registro(filtro);
    if (!lista.length) return vuoto("Ancora nessuna registrazione");
    return lista.map((r) => `
    <div class="log-riga">
      <span class="log-punto" style="--c:${TINTE[r.modulo] || COLORE5}"></span>
      <span class="tx"><strong>${esc(r.dettaglio || r.azione)}</strong>
        <span>${esc(ETICHETTE[r.azione] || r.azione)}${r.persona_nome ? " \xB7 " + esc(r.persona_nome) : ""}</span></span>
      <span class="qd">${quando(r.creato_il)}</span>
    </div>`).join("");
  }
  var registro_default = {
    id: "registro",
    nome: "Registro",
    emoji: "\u{1F4CB}",
    colore: COLORE5,
    sezioni: [{ id: "tutto", nome: "Tutte le registrazioni" }],
    distintivo() {
      return { n: 0, caldo: false };
    },
    render() {
      return `<div class="griglia g-lato">
      ${riq(
        "Ultime registrazioni",
        righeLog(),
        {
          raso: true,
          classe: "tinta",
          colore: filtro ? TINTE[filtro] : COLORE5,
          meta: plurale(registro(filtro).length, "voce", "voci")
        }
      )}
      <div class="griglia" style="align-content:start">
        ${riq("Filtra per modulo", `
          <div class="etichette">
            <button class="et-i ${!filtro ? "aggiungi" : ""}" data-filtro="">Tutti</button>
            <button class="et-i" data-filtro="pulizie">\u{1F9FD} Pulizie</button>
            <button class="et-i" data-filtro="spesa">\u{1F6D2} Spesa</button>
            <button class="et-i" data-filtro="attivita">\u{1F514} Attivit\xE0</button>
            <button class="et-i" data-filtro="calendario">\u{1F4C5} Calendario</button>
          </div>
          <p class="nota">Ogni volta che qualcuno spunta una voce, cambia la biancheria o aggiunge un articolo, resta scritto qui: cosa, chi e a che ora.</p>`)}
      </div>
    </div>`;
    },
    aggancia(root) {
      root.addEventListener("click", async (e) => {
        const f = e.target.closest("[data-filtro]");
        if (!f) return;
        filtro = f.dataset.filtro || null;
        try {
          const r = await api.registro(filtro, 150);
          S.dati.registro = r.righe;
        } catch (e2) {
        }
        this.ridisegna();
      });
    }
  };

  // public/js/moduli/generali.js
  var COLORE6 = "var(--home)";
  var MODULI_CAT = [
    { id: "pulizie", nome: "Pulizie", colore: "var(--pulizie)" },
    { id: "spesa", nome: "Lista della spesa", colore: "var(--spesa)" },
    { id: "attivita", nome: "Attivit\xE0 programmate", colore: "var(--attivita)" },
    { id: "calendario", nome: "Calendario", colore: "var(--calendario)" }
  ];
  var generali_default = {
    id: "generali",
    nome: "Casa e famiglia",
    emoji: "\u2699\uFE0F",
    colore: COLORE6,
    nascosto: true,
    sezioni: [{ id: "casa", nome: "Casa e famiglia" }],
    distintivo() {
      return { n: 0, caldo: false };
    },
    render() {
      return `<div class="griglia g-lato">
      <div class="griglia" style="align-content:start">
        ${riq("Chi vive in casa", `<ul class="cfg" style="margin:-16px -18px">
          ${S.dati.persone.map((p) => `<li>
            <span class="tx"><strong>${esc(p.nome)}</strong><span>${p.ruolo === "bambina" ? "Compare nelle attivita, non accede all'app" : "Accesso completo"}</span></span>
            <button class="btn chiaro piccolo" data-mod-persona="${p.id}">Modifica</button>
          </li>`).join("")}
        </ul>
        <div style="padding:14px 18px;border-top:1px solid var(--linea-tenue)">
          <button class="btn chiaro pieno" data-nuova-persona>Aggiungi persona</button>
        </div>`, { classe: "tinta", colore: COLORE6 })}

        ${riq("Categorie per modulo", MODULI_CAT.map((m) => `
          <div class="gruppo aperto">
            <button class="capo" data-gruppo="gc_${m.id}">
              <b>${esc(m.nome)}</b>
              <span class="avanz">${categorie(m.id).length} categorie</span>
              <span class="freccia"></span></button>
            <div class="elenco"><div>
              <div style="padding:12px 18px">
                <div class="etichette">
                  ${categorie(m.id).map((c) => `<button class="et-i" data-mod-cat="${c.id}">${c.icona || "\u{1F4C1}"} ${esc(c.nome)}</button>`).join("")}
                  <button class="et-i aggiungi" data-nuova-cat="${m.id}">Aggiungi categoria</button>
                </div>
              </div>
            </div></div>
          </div>`).join(""), { raso: true })}
        ${riq("Dispositivo di casa", `<ul class="cfg" style="margin:-16px -18px">
          ${rigaCfg("Schermo sempre acceso", "L'iPad resta sulla home quando \xE8 in carica.", interruttore(true, COLORE6))}
          ${rigaCfg("Torna alla home dopo", "", `<select><option>2 minuti</option><option selected>5 minuti</option><option>Mai</option></select>`)}
          ${rigaCfg("Testo grande", "Aumenta i caratteri su tutta l'app.", interruttore(document.body.classList.contains("testo-grande"), COLORE6, "data-testo-grande"))}
        </ul>`)}
      </div>
      <div class="griglia" style="align-content:start">
        ${riq("Dati e collegamento", `<ul class="cfg" style="margin:-16px -18px">
          ${rigaCfg(
        "Stato",
        rete.collegata ? "Collegata al database su Cloudflare." : "Sta usando i dati locali di prova.",
        `<span class="pill ${rete.collegata ? "verde" : "ambra"}">${rete.collegata ? "Collegata" : "Locale"}</span>`
      )}
          ${rigaCfg(
        "Chiave di casa",
        "La stessa che usi nel comando rapido dell'iPhone.",
        `<input type="password" id="chiave-generale" value="${esc(chiave())}" style="min-width:180px">`
      )}
          ${rigaCfg("", "", `<button class="btn piccolo" style="background:var(--home)" data-salva-chiave-gen>Salva e ricarica</button>`)}
          ${rigaCfg("Ricarica automatica", "L'app rilegge il database ogni 30 secondi.", interruttore(true, COLORE6))}
        </ul>`)}
        ${riq("Moduli attivi", `<ul class="cfg" style="margin:-16px -18px">
          ${S.dati.moduli.map((m) => rigaCfg(m.nome, "", interruttore(true, m.colore))).join("")}
        </ul>
        <p class="nota">Per aggiungere un modulo nuovo basta una riga nella tabella moduli e un file in public/js/moduli.</p>`)}
      </div>
    </div>`;
    },
    aggancia(root) {
      root.addEventListener("click", async (e) => {
        if (e.target.closest("[data-testo-grande]")) {
          document.body.classList.toggle("testo-grande");
          localStorage.setItem("ferrafoni.testoGrande", document.body.classList.contains("testo-grande") ? "1" : "0");
          return;
        }
        if (e.target.closest("[data-salva-chiave-gen]")) {
          salvaChiave(root.querySelector("#chiave-generale").value.trim());
          carica();
          return;
        }
        const g2 = e.target.closest("[data-gruppo]");
        if (g2) {
          g2.closest(".gruppo").classList.toggle("aperto");
          return;
        }
        const opzRuoli = [
          { id: "adulto", nome: "Adulto" },
          { id: "bambina", nome: "Bambina" },
          { id: "collaboratrice", nome: "Chi pulisce" }
        ];
        if (e.target.closest("[data-nuova-persona]")) {
          const r = await modaleForm({
            titolo: "Nuova persona",
            colore: COLORE6,
            campi: [
              { nome: "nome", etichetta: "Nome", richiesto: true },
              { nome: "iniziali", etichetta: "Iniziali (due lettere)", placeholder: "Es. GF" },
              { nome: "ruolo", etichetta: "Ruolo", tipo: "select", opzioni: opzRuoli },
              { nome: "colore", etichetta: "Colore (esadecimale)", placeholder: "#6E7A83", difetto: "#6E7A83" }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva" && r.valori.nome) {
            const p = __spreadValues({ id: "loc" + Date.now() }, r.valori);
            aggiungiPersonaLocale(p);
            prova(api.creaPersona(r.valori));
            avviso("Persona aggiunta");
            this.ridisegna();
          }
          return;
        }
        const modP = e.target.closest("[data-mod-persona]");
        if (modP) {
          const p = persona(modP.dataset.modPersona);
          const r = await modaleForm({
            titolo: p.nome,
            colore: COLORE6,
            valori: { nome: p.nome, iniziali: p.iniziali, ruolo: p.ruolo, colore: p.colore },
            campi: [
              { nome: "nome", etichetta: "Nome", richiesto: true },
              { nome: "iniziali", etichetta: "Iniziali" },
              { nome: "ruolo", etichetta: "Ruolo", tipo: "select", opzioni: opzRuoli },
              { nome: "colore", etichetta: "Colore (esadecimale)" }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva") {
            modificaPersonaLocale(p.id, r.valori);
            prova(api.modificaPersona(__spreadValues({ id: p.id }, r.valori)));
            avviso("Persona aggiornata");
            this.ridisegna();
          }
          return;
        }
        const nuovaCat = e.target.closest("[data-nuova-cat]");
        if (nuovaCat) {
          const modulo2 = nuovaCat.dataset.nuovaCat;
          const r = await modaleForm({
            titolo: "Nuova categoria",
            colore: COLORE6,
            campi: [
              { nome: "nome", etichetta: "Nome della categoria", richiesto: true },
              { nome: "icona", etichetta: "Icona (una emoji)", placeholder: "\u{1F4C1}", difetto: "\u{1F4C1}" }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva" && r.valori.nome) {
            const c = __spreadValues({ id: "loc" + Date.now(), modulo: modulo2 }, r.valori);
            aggiungiCategoriaLocale(c);
            prova(api.creaCategoria(__spreadValues({ modulo: modulo2 }, r.valori)));
            avviso("Categoria aggiunta");
            this.ridisegna();
          }
          return;
        }
        const modCat = e.target.closest("[data-mod-cat]");
        if (modCat) {
          const c = categoria(modCat.dataset.modCat);
          const r = await modaleForm({
            titolo: c.nome,
            colore: COLORE6,
            permettiElimina: true,
            valori: { nome: c.nome, icona: c.icona },
            campi: [
              { nome: "nome", etichetta: "Nome", richiesto: true },
              { nome: "icona", etichetta: "Icona" }
            ]
          });
          if ((r == null ? void 0 : r.azione) === "salva") {
            modificaCategoriaLocale(c.id, r.valori);
            prova(api.modificaCategoria(__spreadValues({ id: c.id }, r.valori)));
            avviso("Categoria aggiornata");
          } else if ((r == null ? void 0 : r.azione) === "elimina") {
            rimuoviCategoriaLocale(c.id);
            prova(api.eliminaCategoria(c.id));
            avviso("Categoria tolta");
          }
          this.ridisegna();
        }
      });
    }
  };

  // public/js/moduli/indice.js
  var MODULI = [home_default, pulizie_default, calendario_default, spesa_default, registro_default, generali_default];
  var modulo = (id) => MODULI.find((m) => m.id === id) || MODULI[0];

  // public/js/app.js
  var vista = { modulo: "home", sezione: "oggi" };
  var agganciati = /* @__PURE__ */ new Set();
  function disegnaColonna() {
    $("#voci").innerHTML = MODULI.filter((m) => !m.nascosto).map((m) => {
      let d = { n: 0 };
      try {
        if (m.distintivo) d = m.distintivo();
      } catch (e) {
        d = { n: 0 };
      }
      return `<li><button class="voce ${vista.modulo === m.id ? "on" : ""}" style="--c:${m.colore}" data-modulo="${m.id}">
      <span class="emj">${m.emoji}</span><span class="nm">${esc(m.nome)}</span>
      ${d.n ? `<span class="bdg ${d.caldo ? "caldo" : ""}">${d.n}</span>` : ""}
    </button></li>`;
    }).join("");
    $("#stato-rete").innerHTML = `<span class="punto" style="background:${rete.collegata ? "#5FBF9E" : "#C58312"}"></span>
     ${rete.collegata ? "collegata al database" : "dati locali"}`;
  }
  function disegnaTestata() {
    var _a;
    const m = modulo(vista.modulo);
    const sez = m.sezioni.find((s) => s.id === vista.sezione) || m.sezioni[0];
    $("#occhiello").textContent = m.id === "home" ? "Panoramica" : m.nome;
    $("#titolo").textContent = sez.nome === m.nome ? m.nome : sez.nome;
    document.documentElement.style.setProperty("--accento", m.colore);
    $("#schede").innerHTML = m.sezioni.length > 1 ? m.sezioni.map((s) => `<button class="${s.id === vista.sezione ? "on" : ""}"
        style="--c:${m.colore}" data-sezione="${s.id}">${esc(s.nome)}</button>`).join("") : "";
    $("#facce").innerHTML = (((_a = S.dati) == null ? void 0 : _a.persone) || []).filter((p) => p.ruolo !== "collaboratrice").map((p) => `<span class="faccia" style="background:${p.colore}">${esc(p.iniziali)}</span>`).join("");
    $("#data-oggi").innerHTML = `${GG[OGGI.getDay()]}<b>${OGGI.getDate()} ${MM[OGGI.getMonth()]}</b>`;
  }
  function disegna(_stato, opzioni = {}) {
    if (!S.dati) {
      disegnaColonna();
      $("#corpo").innerHTML = S.caricamento ? '<p class="vuoto">Carico i dati di casa\u2026</p>' : `<section class="riq" style="max-width:560px;margin:0 auto">
           <header><h3>Non riesco a leggere i dati</h3></header>
           <div class="dentro">
             <p style="margin:0 0 14px">${esc(rete.motivo || "collegamento non riuscito")}.</p>
             <button class="btn" id="riprova">Riprova</button>
           </div>
         </section>`;
      return;
    }
    const m = modulo(vista.modulo);
    if (!m.sezioni.some((s) => s.id === vista.sezione)) vista.sezione = m.sezioni[0].id;
    if (opzioni.silenzioso && document.querySelector(".velo.on")) return;
    disegnaColonna();
    disegnaTestata();
    const corpo = $("#corpo");
    const contesto = { vai, ridisegna: disegna };
    const scorri = $("#scorri");
    const posizione = scorri.scrollTop;
    corpo.innerHTML = opzioni.silenzioso ? m.render(vista.sezione, contesto) : `<div class="entra">${m.render(vista.sezione, contesto)}</div>`;
    if (posizione) scorri.scrollTop = posizione;
    if (!agganciati.has(m.id) && m.aggancia) {
      m.aggancia(radicePerModulo(m.id), { vai, ridisegna: disegna });
      m.ridisegna = disegna;
      agganciati.add(m.id);
    }
  }
  function radicePerModulo(idModulo) {
    const corpo = $("#corpo");
    return {
      addEventListener(tipo, gestore, opzioni) {
        corpo.addEventListener(tipo, (e) => {
          if (vista.modulo !== idModulo) return;
          gestore(e);
        }, opzioni);
      },
      querySelector: (sel) => corpo.querySelector(sel),
      querySelectorAll: (sel) => corpo.querySelectorAll(sel)
    };
  }
  function vai(idModulo, idSezione) {
    vista.modulo = idModulo;
    vista.sezione = idSezione || modulo(idModulo).sezioni[0].id;
    if (STRETTO()) menu(false);
    disegna();
    $("#scorri").scrollTop = 0;
  }
  var STRETTO = () => window.innerWidth <= 1240;
  function menu(apri) {
    const app = document.getElementById("app");
    app.classList.toggle("menu-chiuso", !apri);
  }
  function agganciaGuscio() {
    menu(!STRETTO());
    window.addEventListener("resize", () => {
      if (!STRETTO()) menu(true);
    });
    document.getElementById("apri-menu").addEventListener("click", () => {
      const app = document.getElementById("app");
      menu(app.classList.contains("menu-chiuso"));
    });
    $("#voci").addEventListener("click", (e) => {
      const b = e.target.closest("[data-modulo]");
      if (b) vai(b.dataset.modulo);
    });
    $("#schede").addEventListener("click", (e) => {
      const b = e.target.closest("[data-sezione]");
      if (b) vai(vista.modulo, b.dataset.sezione);
    });
    $("#vai-generali").addEventListener("click", () => vai("generali"));
    document.addEventListener("click", (e) => {
      if (e.target.closest("#riprova")) carica(S.settimana);
    });
    document.addEventListener("click", (e) => {
      const sw = e.target.closest(".sw");
      if (sw) sw.classList.toggle("on");
      const sg = e.target.closest(".segmenti button");
      if (sg && !sg.closest("#foglio-chi")) {
        sg.parentElement.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
        sg.classList.add("on");
      }
    });
  }
  function verificaFlexGap() {
    const prova2 = document.createElement("div");
    prova2.style.display = "flex";
    prova2.style.flexDirection = "column";
    prova2.style.rowGap = "1px";
    prova2.style.position = "absolute";
    prova2.style.visibility = "hidden";
    prova2.appendChild(document.createElement("div"));
    prova2.appendChild(document.createElement("div"));
    document.body.appendChild(prova2);
    const supportato = prova2.scrollHeight === 1;
    prova2.parentNode.removeChild(prova2);
    if (!supportato) document.body.classList.add("senza-gap");
  }
  async function avvia() {
    verificaFlexGap();
    if (localStorage.getItem("ferrafoni.testoGrande") === "1") document.body.classList.add("testo-grande");
    agganciaGuscio();
    agganciaModale();
    agganciaModaleForm();
    iscriviti(disegna);
    await carica();
    const puoRicaricare = () => rete.collegata && !document.hidden && scritture.aperte === 0 && !document.querySelector(".velo.on");
    setInterval(() => {
      if (puoRicaricare()) carica(S.settimana, { silenzioso: true });
    }, 3e4);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && puoRicaricare()) carica(S.settimana, { silenzioso: true });
    });
  }
  avvia();
})();
