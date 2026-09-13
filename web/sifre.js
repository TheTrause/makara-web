/* MAKARA web — sifre sifirlama. Uygulamayla ayni akis (auth_service.dart):
   resetPasswordForEmail -> e-postaya 6 haneli kod ({{ .Token }}) ->
   verifyOtp (once 'recovery', olmazsa 'email') -> gecici oturum ->
   updateUser(password) -> profil. Baglanti/yonlendirme kullanilmiyor. */
(async function () {
  'use strict';
  var M = window.MK, t = M.t;

  M.ustCubuk(null);
  M.altBilgi();
  M.cevir();
  document.getElementById('girise-don').setAttribute('href', M.girisYolu);

  var f1 = document.getElementById('adim-eposta');
  var f2 = document.getElementById('adim-kod');
  var h1 = document.getElementById('hata1');
  var h2 = document.getElementById('hata2');
  var d1 = document.getElementById('dgm1');
  var d2 = document.getElementById('dgm2');
  var eposta = '';

  function hata(kutu, k) { kutu.textContent = t(k); kutu.hidden = false; }

  function kodla(k) {
    var kod = (k && (k.code || k.error_code)) || '';
    var durum = (k && k.status) || 0;
    if (durum === 429 || /rate_limit/.test(kod)) return 'h_cok';
    if (kod === 'weak_password') return 's_zayif';
    if (kod === 'same_password') return 's_ayni';
    if (kod === 'otp_expired' || /otp|token/.test(kod) || durum === 403) return 's_kod_hatali';
    return 'h_ag';
  }

  async function kodGonder() {
    var r = await M.sb.auth.resetPasswordForEmail(eposta);
    if (r.error) throw r.error;
  }

  f1.addEventListener('submit', async function (e) {
    e.preventDefault();
    h1.hidden = true;
    eposta = f1.eposta.value.trim();
    if (!eposta || eposta.indexOf('@') < 1) { hata(h1, 's_eposta_gir'); return; }
    d1.disabled = true;
    try {
      await kodGonder();
      // Hesap var mı yok mu söylemiyoruz (Supabase de söylemiyor).
      document.getElementById('alt2').textContent = t('s_alt2', eposta);
      f1.hidden = true;
      f2.hidden = false;
      f2.kod.focus();
    } catch (err) {
      hata(h1, kodla(err));
    } finally {
      d1.disabled = false;
    }
  });

  document.getElementById('yeniden').addEventListener('click', async function (e) {
    e.preventDefault();
    h2.hidden = true;
    try { await kodGonder(); hata(h2, 's_yeniden_gitti'); } catch (err) { hata(h2, kodla(err)); }
  });

  f2.addEventListener('submit', async function (e) {
    e.preventDefault();
    h2.hidden = true;
    var kod = f2.kod.value.replace(/\s+/g, '');
    var s1 = f2.sifre.value, s2 = f2.sifre2.value;
    if (!/^\d{6,10}$/.test(kod)) { hata(h2, 's_kod_bicim'); return; }
    if (s1.length < 6) { hata(h2, 's_zayif'); return; }
    if (s1 !== s2) { hata(h2, 's_eslesmiyor'); return; }
    d2.disabled = true;
    try {
      var v = await M.sb.auth.verifyOtp({ email: eposta, token: kod, type: 'recovery' });
      if (v.error) {
        var v2 = await M.sb.auth.verifyOtp({ email: eposta, token: kod, type: 'email' });
        if (v2.error) throw v.error;
      }
      var u = await M.sb.auth.updateUser({ password: s1 });
      if (u.error) throw u.error;
      location.replace(M.kendiYolu);
    } catch (err) {
      hata(h2, kodla(err));
    } finally {
      d2.disabled = false;
    }
  });
})();
