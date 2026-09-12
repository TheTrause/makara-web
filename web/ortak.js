/* MAKARA web — ortak yardimcilar.
   KURAL: kullanicidan gelen hicbir metin innerHTML ile basilmaz; her sey
   textContent / setAttribute ile. Gorsel adresleri beyaz listeden gecer. */
(function () {
  'use strict';

  var A = window.MAKARA_AYAR;
  /* PKCE: Google donusunde adreste yalniz tek kullanimlik ?code= olur
     (erisim anahtari adres cubuguna/gecmise dusmez); supabase-js onu
     acilista oturuma cevirir. E-posta+sifre girisi bundan etkilenmez. */
  var sb = window.supabase.createClient(A.supabaseUrl, A.supabaseAnahtar, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
  });

  var dil = 'tr';
  try {
    dil = localStorage.getItem('makara-dil') ||
      ((navigator.language || '').toLowerCase().indexOf('tr') === 0 ? 'tr' : 'en');
  } catch (e) { /* gizli pencere */ }
  if (dil !== 'en') dil = 'tr';
  document.documentElement.lang = dil;

  var S = {
    giris: ['Giriş yap', 'Sign in'],
    profilim: ['Profilim', 'My profile'],
    cikis: ['Çıkış', 'Sign out'],
    g_baslik: ['Tekrar hoş geldin', 'Welcome back'],
    g_alt: ['MAKARA hesabınla giriş yap. Film günlüğün, incelemelerin ve takip ağın seni bekliyor.',
      'Sign in with your MAKARA account. Your film diary, reviews and network are waiting.'],
    eposta: ['E-posta', 'Email'],
    sifre: ['Şifre', 'Password'],
    g_dgm: ['Giriş yap', 'Sign in'],
    g_bekle: ['Giriş yapılıyor…', 'Signing in…'],
    h_bilgi: ['E-posta veya şifre hatalı.', 'Incorrect email or password.'],
    h_dogrula: ['E-posta adresin henüz doğrulanmamış. Gelen kutundaki bağlantıya dokun.',
      'Your email is not confirmed yet. Tap the link in your inbox.'],
    h_cok: ['Çok fazla deneme yapıldı. Biraz sonra tekrar dene.', 'Too many attempts. Try again in a moment.'],
    h_ag: ['Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.',
      'Could not connect. Check your connection and try again.'],
    h_bos: ['E-posta ve şifreni gir.', 'Enter your email and password.'],
    google_dgm: ['Google ile devam et', 'Continue with Google'],
    veya: ['veya e-posta ile', 'or with email'],
    apple_dgm: ['Apple ile devam et', 'Continue with Apple'],
    h_oauth: ['Giriş tamamlanamadı. Tekrar dene.', 'Sign-in could not be completed. Try again.'],
    g_apple: ['Apple ile kaydolduysan web girişi yakında geliyor; şimdilik uygulamayı kullan.',
      'If you signed up with Apple, web sign-in is coming soon; use the app for now.'],
    g_hesap_yok: ['Hesabın yok mu? Önce MAKARA uygulamasını indir.', 'No account yet? Get the MAKARA app first.'],
    g_sifre: ['Şifreni mi unuttun? Uygulamanın giriş ekranından sıfırlayabilirsin.',
      'Forgot your password? Reset it from the sign-in screen in the app.'],
    g_not: ['Web bir okuma penceresidir: profilini, incelemelerini ve takip ağını görürsün. Düzenleme ve sohbet uygulamada.',
      'The web is a read-only window: see your profile, reviews and network. Editing and chat stay in the app.'],
    takipci: ['Takipçi', 'Followers'],
    takip: ['Takip', 'Following'],
    inceleme: ['İnceleme', 'Reviews'],
    sekme_gunluk: ['Film günlüğü', 'Film diary'],
    sekme_inceleme: ['İncelemeler', 'Reviews'],
    sekme_liste: ['Listeler', 'Lists'],
    sekme_ag: ['Takip ağı', 'Network'],
    favoriler: ['Favoriler', 'Favorites'],
    izleme_listem: ['İzleme listem', 'My watchlist'],
    izleme_not: ['İzleme listen yalnızca sana görünür.', 'Your watchlist is visible only to you.'],
    film: ['Film', 'Film'],
    dizi: ['Dizi', 'Series'],
    incelendi: ['İncelendi', 'Reviewed'],
    bos_gunluk: ['Film günlüğünde henüz bir şey yok.', 'Nothing in the film diary yet.'],
    bos_inceleme: ['Henüz inceleme yok.', 'No reviews yet.'],
    bos_favori: ['Favori eklenmemiş.', 'No favorites yet.'],
    bos_izleme: ['İzleme listen boş.', 'Your watchlist is empty.'],
    son_inceleme: ['Son {0} inceleme gösteriliyor.', 'Showing the latest {0} reviews.'],
    takipciler: ['Takipçiler', 'Followers'],
    takip_edilenler: ['Takip edilenler', 'Following'],
    bos_takipci: ['Henüz takipçin yok.', 'No followers yet.'],
    bos_takip: ['Henüz kimseyi takip etmiyorsun.', 'You are not following anyone yet.'],
    gizli_etiket: ['Gizli', 'Private'],
    kilit_baslik: ['Bu hesap gizli', 'This account is private'],
    kilit_alt: ['Film günlüğü, incelemeler ve listeler yalnızca onaylı takipçilere açık. Takip isteğini MAKARA uygulamasından gönderebilirsin.',
      'The film diary, reviews and lists are visible only to approved followers. You can send a follow request from the MAKARA app.'],
    kapali_baslik: ['Ayrıntılar girişle görünür', 'Sign in to see more'],
    kapali_alt: ['Bu profilin film günlüğü ve incelemeleri MAKARA hesabıyla giriş yapanlara açık.',
      'This profile’s film diary and reviews are visible to people signed in with a MAKARA account.'],
    paylas: ['Profil linkini kopyala', 'Copy profile link'],
    kopyalandi: ['Link kopyalandı', 'Link copied'],
    uygulamada_takip: ['MAKARA’da takip et', 'Follow on MAKARA'],
    duzenle_not: ['Profilini düzenlemek ve kişileri takip etmek için MAKARA uygulamasını kullan.',
      'Use the MAKARA app to edit your profile and follow people.'],
    cta_baslik: ['Sen de film günlüğünü tut.', 'Keep your own film diary.'],
    cta_alt: ['İzlediklerini kaydet, incele, sinemaseverleri takip et.', 'Log what you watch, review it, follow film lovers.'],
    indir: ['Google Play’den indir', 'Get it on Google Play'],
    ios: ['App Store’da yakında', 'Coming soon to the App Store'],
    bulunamadi: ['Profil bulunamadı', 'Profile not found'],
    bulunamadi_alt: ['Bu kullanıcı adıyla bir profil yok ya da görüntülenemiyor.',
      'There is no profile with this username, or it cannot be shown.'],
    tamamla: ['Profilini MAKARA uygulamasında tamamla; ardından burada görünür.',
      'Finish your profile in the MAKARA app; it will then appear here.'],
    hata: ['Profil yüklenemedi. Biraz sonra tekrar dene.', 'Could not load the profile. Try again shortly.'],
    hazir_degil: ['Web profilleri henüz etkin değil.', 'Web profiles are not active yet.'],
    yukleniyor: ['Yükleniyor…', 'Loading…'],
    tmdb1: ['Film verileri ve görselleri TMDB tarafından sağlanır.', 'Film data and images are provided by TMDB.'],
    tmdb2: ['Bu ürün TMDB API’sini kullanır ancak TMDB tarafından onaylanmamış veya sertifikalanmamıştır.',
      'This product uses the TMDB API but is not endorsed or certified by TMDB.'],
    gizlilik: ['Gizlilik Politikası', 'Privacy Policy'],
    kosullar: ['Kullanım Koşulları', 'Terms of Use'],
    kvkk: ['KVKK', 'KVKK'],
    ana: ['Ana sayfa', 'Home'],
    telif: ['© 2026 MAKARA · Repress Studio', '© 2026 MAKARA · Repress Studio']
  };

  function t(k) {
    var v = S[k];
    if (!v) return k;
    var s = v[dil === 'en' ? 1 : 0];
    for (var i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(String(arguments[i]));
    return s;
  }

  /* el('a', {sinif, metin, href, olay:{click}}, ...cocuklar) — metin HEP textContent. */
  function el(etiket, ozellik) {
    var d = document.createElement(etiket);
    if (ozellik) {
      Object.keys(ozellik).forEach(function (k) {
        var v = ozellik[k];
        if (v == null || v === false) return;
        if (k === 'sinif') d.className = v;
        else if (k === 'metin') d.textContent = v;
        else if (k === 'olay') Object.keys(v).forEach(function (o) { d.addEventListener(o, v[o]); });
        else d.setAttribute(k, v === true ? '' : String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      d.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return d;
  }

  function cevir(kok) {
    (kok || document).querySelectorAll('[data-t]').forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    (kok || document).querySelectorAll('[data-t-ph]').forEach(function (e) { e.setAttribute('placeholder', t(e.getAttribute('data-t-ph'))); });
  }

  /* TMDB afisi: once kendi alan adimizdaki /afis vekili (Turkiye'de
     image.tmdb.org DNS engelli), olmazsa dogrudan TMDB, o da olmazsa
     adli yer tutucu. Yol yalniz TMDB dosya adi bicimindeyse kullanilir. */
  var AFIS_DESEN = /^\/[A-Za-z0-9_-]+\.(jpg|png)$/;
  function afisYollari(yol, boy) {
    if (typeof yol !== 'string' || !AFIS_DESEN.test(yol)) return null;
    return ['/afis/' + boy + yol, 'https://image.tmdb.org/t/p/' + boy + yol];
  }
  function afisGorsel(yol, boy, ad) {
    var kap = el('div', { sinif: 'afis' });
    function yerTutucu() {
      kap.textContent = '';
      kap.classList.add('afis-bos');
      kap.appendChild(el('span', { metin: ad || '' }));
    }
    var yollar = afisYollari(yol, boy);
    if (!yollar) { yerTutucu(); return kap; }
    var i = 0;
    var img = el('img', { alt: ad || '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', function () {
      i++;
      if (i < yollar.length) img.src = yollar[i]; else yerTutucu();
    });
    img.src = yollar[0];
    kap.appendChild(img);
    return kap;
  }

  var FOTO_ON = A.supabaseUrl + '/storage/v1/object/public/photos/';
  function fotoGecerli(u) {
    return typeof u === 'string' && u.indexOf(FOTO_ON) === 0 && !/[\s"'()<>\\]/.test(u);
  }

  /* "Baslik|film|550|/abc.jpg" -> {ad, tur, tmdb, afis} */
  function yapimCoz(s) {
    var p = String(s || '').split('|');
    return { ad: p[0] || '', tur: p[1] === 'dizi' ? 'dizi' : 'film',
      tmdb: p[2] ? (parseInt(p[2], 10) || null) : null, afis: p[3] || null };
  }

  /* Uygulamayla ayni: 1-3 Basrol (eski Bilet/Loca Basrol sayilir), 4 Yonetmen. */
  function kademe(n) {
    n = Number(n) || 0;
    if (n >= 4) return { ad: 'Yönetmen', sinif: 'rozet rozet-yonetmen' };
    if (n >= 1) return { ad: 'Başrol', sinif: 'rozet rozet-basrol' };
    return null;
  }

  /* Vercel'de /u/ad ve /profil yonlendirmesi var; dosya adiyla (ornegin
     GitHub Pages'te) acildiysa sorgu parametresine dus. */
  var YONLENDIRME = location.pathname === '/giris' || location.pathname === '/profil' ||
    location.pathname.indexOf('/u/') === 0;
  function profilYolu(ad) {
    return YONLENDIRME ? '/u/' + encodeURIComponent(ad) : '/profil.html?u=' + encodeURIComponent(ad);
  }
  var kendiYolu = YONLENDIRME ? '/profil' : '/profil.html';
  var girisYolu = YONLENDIRME ? '/giris' : '/giris.html';
  function paylasimLinki(ad) { return 'https://makara.social/u/' + encodeURIComponent(ad); }

  var PLAY = 'https://play.google.com/store/apps/details?id=social.makara.app';
  function magazaDugmeleri() {
    return el('div', { sinif: 'magaza' },
      el('a', { sinif: 'dgm dolu', href: PLAY, target: '_blank', rel: 'noopener', metin: t('indir') }),
      el('span', { sinif: 'dgm bos', metin: t('ios') }));
  }

  function ustCubuk(oturum) {
    var sag = document.getElementById('ust-sag');
    if (!sag) return;
    sag.textContent = '';
    sag.appendChild(el('button', {
      type: 'button', sinif: 'dil-dgm', 'aria-label': 'Dil / Language', metin: dil === 'tr' ? 'EN' : 'TR',
      olay: { click: function () {
        try { localStorage.setItem('makara-dil', dil === 'tr' ? 'en' : 'tr'); } catch (e) { /* yok */ }
        location.reload();
      } }
    }));
    if (oturum) {
      sag.appendChild(el('a', { href: kendiYolu, sinif: 'ust-bag', metin: t('profilim') }));
      sag.appendChild(el('button', {
        type: 'button', sinif: 'ust-dgm', metin: t('cikis'),
        olay: { click: function () {
          sb.auth.signOut().finally(function () { location.replace(girisYolu); });
        } }
      }));
    } else {
      sag.appendChild(el('a', { href: girisYolu, sinif: 'ust-dgm dolu', metin: t('giris') }));
    }
  }

  function altBilgi() {
    var alt = document.getElementById('alt');
    if (!alt) return;
    alt.textContent = '';
    alt.appendChild(el('div', { sinif: 'tmdb' },
      el('a', { href: 'https://www.themoviedb.org/', target: '_blank', rel: 'noopener', sinif: 'tmdb-logo' },
        el('img', { src: '/img/tmdb.png', alt: 'TMDB', width: '94', height: '40' })),
      el('div', {}, el('p', { metin: t('tmdb1') }), el('p', { sinif: 'kucuk', metin: t('tmdb2') }))));
    alt.appendChild(el('nav', { sinif: 'alt-bag' },
      el('a', { href: '/', metin: t('ana') }),
      el('a', { href: '/privacy.html', metin: t('gizlilik') }),
      el('a', { href: '/terms.html', metin: t('kosullar') }),
      el('a', { href: '/kvkk.html', metin: t('kvkk') })));
    alt.appendChild(el('p', { sinif: 'telif', metin: t('telif') }));
  }

  function tarih(iso) {
    try {
      return new Date(iso).toLocaleDateString(dil === 'en' ? 'en-GB' : 'tr-TR',
        { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return ''; }
  }

  function noindex() {
    if (document.querySelector('meta[name="robots"]')) return;
    document.head.appendChild(el('meta', { name: 'robots', content: 'noindex' }));
  }

  window.MK = {
    sb: sb, t: t, el: el, dil: dil, cevir: cevir, afisGorsel: afisGorsel, afisYollari: afisYollari,
    fotoGecerli: fotoGecerli, yapimCoz: yapimCoz, kademe: kademe, profilYolu: profilYolu,
    kendiYolu: kendiYolu, girisYolu: girisYolu, paylasimLinki: paylasimLinki,
    magazaDugmeleri: magazaDugmeleri, ustCubuk: ustCubuk, altBilgi: altBilgi, tarih: tarih,
    noindex: noindex
  };
})();
