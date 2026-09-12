/* Afis vekili — /afis/<boy>/<dosya> -> https://image.tmdb.org/t/p/<boy>/<dosya>
 *
 * Neden: Turkiye'de image.tmdb.org DNS duzeyinde engelli; girissiz profil
 * sayfasinda (uygulamanin oturum isteyen vekili kullanilamaz) afisler bu
 * yoldan, Cloudflare'in agi uzerinden gelir.
 *
 * Guvenlik: acik vekil DEGIL. Hedef sabit (yalniz image.tmdb.org/t/p/),
 * boy beyaz listede, dosya adi TMDB bicimi ([A-Za-z0-9_-].jpg|png) disinda
 * hicbir sey kabul edilmez; sorgu dizesi, cerez ve istek basliklari
 * iletilmez; yalniz resim turunde yanit geri verilir.
 */
const BOYLAR = new Set(['w92', 'w154', 'w185', 'w342', 'w500', 'w780']);
const DOSYA = /^[A-Za-z0-9_-]+\.(?:jpg|png)$/;
const RESIM = /^image\/(?:jpeg|png|webp)\b/;

function bulunamadi(sure) {
  return new Response('Not Found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=' + (sure || 300),
      'X-Content-Type-Options': 'nosniff' },
  });
}

export async function onRequest({ request, params }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const parca = Array.isArray(params.path) ? params.path : [];
  if (parca.length !== 2 || !BOYLAR.has(parca[0]) || !DOSYA.test(parca[1])) {
    return bulunamadi(3600);
  }

  let yanit;
  try {
    yanit = await fetch('https://image.tmdb.org/t/p/' + parca[0] + '/' + parca[1], {
      cf: { cacheTtl: 604800, cacheEverything: true },
    });
  } catch (e) {
    return new Response('Bad Gateway', { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }

  const tur = yanit.headers.get('content-type') || '';
  if (!yanit.ok || !RESIM.test(tur)) return bulunamadi(300);

  return new Response(request.method === 'HEAD' ? null : yanit.body, {
    status: 200,
    headers: {
      'Content-Type': tur,
      'Cache-Control': 'public, max-age=604800, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
