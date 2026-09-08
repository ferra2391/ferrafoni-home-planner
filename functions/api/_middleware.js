import { INTESTAZIONI, errore } from './_utils.js';

// Vale per tutte le rotte sotto /api.
export async function onRequest(context) {
  const { request, env, next } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: INTESTAZIONI });
  }

  if (!env.DB) {
    return errore('Database non collegato. Controlla il binding DB su Cloudflare Pages.', 500);
  }

  // La chiave arriva dall'intestazione (app) o dalla query (Comandi Rapidi).
  const attesa = env.CASA_CHIAVE;
  if (attesa) {
    const url = new URL(request.url);
    const fornita = request.headers.get('x-casa-chiave') || url.searchParams.get('k');
    if (fornita !== attesa) return errore('Chiave di casa non valida.', 401);
  }

  return next();
}
