/* MAKARA web — e-posta + sifre ile giris (Supabase Auth). */
(async function () {
  'use strict';
  var M = window.MK, t = M.t;

  /* Donus adresi yalniz kendi sitemizde bir yol olabilir (acik yonlendirme yok). */
  function hedef() {
    var g = new URLSearchParams(location.search).get('geri');
    if (g && /^\/(?!\/)[A-Za-z0-9/_.?=&%-]*$/.test(g)) return g;
    return M.kendiYolu;
  }

  var oturum = null;
  try { oturum = (await M.sb.auth.getSession()).data.session; } catch (e) { /* yok */ }
  if (oturum) { location.replace(hedef()); return; }

  M.ustCubuk(null);
  M.altBilgi();
  M.cevir();
  document.getElementById('magaza').appendChild(M.magazaDugmeleri());

  var form = document.getElementById('giris-form');
  var dgm = document.getElementById('giris-dgm');
  var hata = document.getElementById('giris-hata');
  var googleDgm = document.getElementById('google-dgm');
  var appleDgm = document.getElementById('apple-dgm');

  /* Apple web girisi Supabase'de "Secret Key (for OAuth)" + Services ID
     girildi (2026-09-13, Services ID social.makara.web). Secret 2027-03-11'de doluyor. */
  var APPLE_ACIK = true;

  function goster(k) { hata.textContent = t(k); hata.hidden = false; }

  // Google/Apple'dan hata ya da iptalle dönüldüyse (profil sayfası ?hata=oauth ile yollar).
  var h = new URLSearchParams(location.search).get('hata');
  if (h === 'oauth' || h === 'google') goster('h_oauth');

  /* Uygulamayla ayni Supabase OAuth akisi. Donus adresi kendi sitemiz
     (Supabase Redirect URL listesinde); PKCE kodu orada oturuma cevrilir. */
  function oauthBagla(dugme, saglayici) {
    dugme.addEventListener('click', async function () {
      hata.hidden = true;
      dugme.disabled = true;
      try {
        var r = await M.sb.auth.signInWithOAuth({
          provider: saglayici,
          options: { redirectTo: location.origin + hedef() }
        });
        if (r.error) { goster('h_oauth'); dugme.disabled = false; }
        // Başarıda tarayıcı sağlayıcıya gider; bu sayfa kapanır.
      } catch (e) {
        goster('h_oauth');
        dugme.disabled = false;
      }
    });
  }
  oauthBagla(googleDgm, 'google');
  if (APPLE_ACIK) {
    appleDgm.hidden = false;
    document.getElementById('apple-not').hidden = true;
    oauthBagla(appleDgm, 'apple');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hata.hidden = true;
    var eposta = form.eposta.value.trim();
    var sifre = form.sifre.value;
    if (!eposta || !sifre) { goster('h_bos'); return; }
    dgm.disabled = true;
    dgm.textContent = t('g_bekle');
    try {
      var r = await M.sb.auth.signInWithPassword({ email: eposta, password: sifre });
      if (r.error) {
        var kod = r.error.code || '';
        var durum = r.error.status || 0;
        if (kod === 'email_not_confirmed') goster('h_dogrula');
        else if (kod === 'over_request_rate_limit' || kod === 'over_email_send_rate_limit' || durum === 429) goster('h_cok');
        else if (kod === 'invalid_credentials' || durum === 400) goster('h_bilgi');
        else goster('h_ag');
        return;
      }
      location.replace(hedef());
    } catch (err) {
      goster('h_ag');
    } finally {
      dgm.disabled = false;
      dgm.textContent = t('g_dgm');
    }
  });
})();
