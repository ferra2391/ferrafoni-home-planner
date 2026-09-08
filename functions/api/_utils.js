// Utilità condivise da tutte le API. Il trattino basso nel nome
// impedisce a Cloudflare Pages di esporre questo file come rotta.

export const INTESTAZIONI = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, x-casa-chiave',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS'
};

export const ok = (dati, stato = 200) =>
  new Response(JSON.stringify(dati), { status: stato, headers: INTESTAZIONI });

export const errore = (messaggio, stato = 400) =>
  new Response(JSON.stringify({ errore: messaggio }), { status: stato, headers: INTESTAZIONI });

export async function corpo(request) {
  const tipo = request.headers.get('content-type') || '';
  try {
    if (tipo.includes('application/json')) return await request.json();
    if (tipo.includes('form')) return Object.fromEntries(await request.formData());
    const testo = await request.text();
    return testo ? JSON.parse(testo) : {};
  } catch {
    return {};
  }
}

export const oggi = () => new Date().toISOString().slice(0, 10);

// Lunedì della settimana che contiene la data indicata.
export function lunedi(data = new Date()) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function idBreve(prefisso) {
  return prefisso + '_' + Math.random().toString(36).slice(2, 8);
}

// Scrive una riga nel registro. Non blocca mai la risposta principale.
export async function annota(db, modulo, azione, dettaglio, persona, origine = 'tablet') {
  try {
    await db.prepare(
      'INSERT INTO registro (modulo, azione, dettaglio, persona_id, origine) VALUES (?,?,?,?,?)'
    ).bind(modulo, azione, dettaglio || null, persona || null, origine).run();
  } catch { /* il registro non deve mai far fallire una scrittura */ }
}
