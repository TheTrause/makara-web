/* MAKARA web — profil (kendi, baskasi, girissiz paylasim linki).
   Butun gizlilik karari SUNUCUDA (web_profil RPC); burasi yalniz gelen
   alanlari cizer. Kullanici metni hep textContent. */
(async function () {
  'use strict';
  var M = window.MK, el = M.el, t = M.t;
  var kok = document.getElementById('icerik');
  var TEMALAR = ['altin', 'gumus', 'bordo', 'gece', 'sepya', 'zumrut'];

  function durum(baslik, alt, ek) {
    kok.textContent = '';
    kok.appendChild(el('section', { sinif: 'durum' },
      el('h1', { sinif: 'durum-baslik', metin: baslik }),
      alt ? el('p', { metin: alt }) : null,
      ek || null));
  }

  var oturum = null;
  try { oturum = (await M.sb.auth.getSession()).data.session; } catch (e) { /* yok */ }
  M.ustCubuk(oturum);
  M.altBilgi();

  // Hangi profil? /u/ad (Vercel) ya da profil.html?u=ad; ikisi de yoksa kendi profilim.
  var ad = null;
  if (location.pathname.indexOf('/u/') === 0) {
    try { ad = decodeURIComponent(location.pathname.slice(3).split('/')[0]); } catch (e) { ad = ''; }
  } else {
    ad = new URLSearchParams(location.search).get('u');
  }

  if (!ad) {
    if (!oturum) {
      location.replace(M.girisYolu + '?geri=' + encodeURIComponent(location.pathname));
      return;
    }
    var ben = await M.sb.from('profiles').select('username, onboarding_bitti')
      .eq('id', oturum.user.id).maybeSingle();
    if (ben.error) { durum(t('hata')); return; }
    if (!ben.data || !ben.data.username || !ben.data.onboarding_bitti) {
      durum(t('profilim'), t('tamamla'), M.magazaDugmeleri());
      return;
    }
    ad = ben.data.username;
    history.replaceState(null, '', M.profilYolu(ad) + location.hash);
  }

  if (!ad || ad.length > 40) { bulunamadi(); return; }

  var sonuc = await M.sb.rpc('web_profil', { p_kullanici_adi: ad });
  if (sonuc.error && (sonuc.error.status === 401 || sonuc.error.code === 'PGRST301') && oturum) {
    // Suresi dolmus oturum: cikis yapip girissiz olarak tekrar dene.
    await M.sb.auth.signOut();
    oturum = null;
    M.ustCubuk(null);
    sonuc = await M.sb.rpc('web_profil', { p_kullanici_adi: ad });
  }
  if (sonuc.error) {
    var yok = sonuc.error.code === 'PGRST202' || sonuc.error.status === 404;
    durum(yok ? t('hazir_degil') : t('hata'));
    return;
  }
  if (!sonuc.data) { bulunamadi(); return; }
  ciz(sonuc.data);

  // -------------------------------------------------------------------
  function bulunamadi() {
    document.title = t('bulunamadi') + ' · MAKARA';
    M.noindex();
    durum(t('bulunamadi'), t('bulunamadi_alt'), M.magazaDugmeleri());
  }

  function yildiz(puan) {
    var n = Math.max(0, Math.min(5, Number(puan) || 0));
    return n ? el('span', { sinif: 'yildiz', 'aria-label': n + '/5', metin: '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n) }) : null;
  }

  function ciz(p) {
    document.title = p.ad + ' (@' + p.kullanici_adi + ') · MAKARA';
    var aciklama = document.querySelector('meta[name="description"]');
    if (aciklama) aciklama.setAttribute('content', p.ad + ' — MAKARA film günlüğü ve incelemeleri.');
    if (!p.icerik_acik) M.noindex();

    kok.textContent = '';

    // ---- kahraman ----
    var kahraman = el('section', { sinif: 'kahraman' + (TEMALAR.indexOf(p.tema) >= 0 ? ' tema-' + p.tema : '') });
    var bant = el('div', { sinif: 'bant' });
    var yollar = M.afisYollari(p.afis, 'w780');
    if (yollar) {
      bant.classList.add('bant-afis');
      bant.style.backgroundImage = 'linear-gradient(180deg, rgba(5,13,11,.10) 0%, rgba(5,13,11,.55) 55%, #050D0B 100%), ' +
        'url("' + yollar[0] + '"), url("' + yollar[1] + '")';
    }
    kahraman.appendChild(bant);

    var avatar = M.fotoGecerli(p.foto)
      ? el('img', { sinif: 'avatar', src: p.foto, alt: p.ad || '' })
      : el('div', { sinif: 'avatar avatar-bos', metin: (p.ad || '?').trim().charAt(0).toUpperCase() });

    var rz = M.kademe(p.rozet);
    var kimlik = el('div', { sinif: 'kimlik' },
      el('div', { sinif: 'ad-satir' },
        el('h1', { sinif: 'ad', metin: p.ad || p.kullanici_adi }),
        rz ? el('span', { sinif: rz.sinif, metin: rz.ad }) : null),
      el('p', { sinif: 'kadi', metin: '@' + p.kullanici_adi },
        p.gizli ? el('span', { sinif: 'gizli-etiket', metin: t('gizli_etiket') }) : null),
      p.sehir ? el('p', { sinif: 'sehir', metin: p.sehir }) : null,
      p.bio ? el('p', { sinif: 'bio', metin: p.bio }) : null);

    var sayilar = el('div', { sinif: 'sayilar' });
    function sayi(n, etiket, olay) {
      var ic = [el('b', { metin: String(n == null ? 0 : n) }), el('span', { metin: etiket })];
      var d = olay ? el('button', { type: 'button', sinif: 'sayi tik', olay: { click: olay } })
        : el('div', { sinif: 'sayi' });
      ic.forEach(function (x) { d.appendChild(x); });
      return d;
    }
    sayilar.appendChild(sayi(p.takipci, t('takipci'), p.kendi ? function () { sekmeAc('ag', 'takipci'); } : null));
    sayilar.appendChild(sayi(p.takip, t('takip'), p.kendi ? function () { sekmeAc('ag', 'takip'); } : null));
    if (p.icerik_acik) sayilar.appendChild(sayi(p.inceleme_sayisi, t('inceleme'), function () { sekmeAc('inceleme'); }));

    var eylem = el('div', { sinif: 'eylemler' });
    var paylasDgm = el('button', { type: 'button', sinif: 'dgm bos', metin: t('paylas') });
    paylasDgm.addEventListener('click', function () {
      var link = M.paylasimLinki(p.kullanici_adi);
      var bitti = function () { paylasDgm.textContent = t('kopyalandi'); setTimeout(function () { paylasDgm.textContent = t('paylas'); }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(bitti, function () { prompt('', link); });
      else prompt('', link);
    });
    eylem.appendChild(paylasDgm);
    if (!p.kendi) {
      eylem.appendChild(el('a', { sinif: 'dgm dolu', href: 'https://play.google.com/store/apps/details?id=social.makara.app',
        target: '_blank', rel: 'noopener', metin: t('uygulamada_takip') }));
    }

    kahraman.appendChild(el('div', { sinif: 'kahraman-ic' }, avatar, el('div', { sinif: 'kahraman-sag' }, kimlik, sayilar, eylem)));
    if (p.kendi) kahraman.appendChild(el('p', { sinif: 'not', metin: t('duzenle_not') }));
    kok.appendChild(kahraman);

    // ---- gizli / girise kapali ----
    if (!p.icerik_acik) {
      var gizli = p.gizli;
      kok.appendChild(el('section', { sinif: 'kilit' },
        el('div', { sinif: 'kilit-simge', 'aria-hidden': 'true' }),
        el('h2', { metin: gizli ? t('kilit_baslik') : t('kapali_baslik') }),
        el('p', { metin: gizli ? t('kilit_alt') : t('kapali_alt') }),
        !gizli && !oturum ? el('a', { sinif: 'dgm dolu', href: M.girisYolu + '?geri=' + encodeURIComponent(location.pathname), metin: t('giris') }) : null));
      if (!oturum) kok.appendChild(cta());
      return;
    }

    // ---- sekmeler ----
    var izl = (p.izlediklerim || []).map(M.yapimCoz);
    var inc = p.incelemeler || [];
    var sekmeler = [
      { k: 'gunluk', ad: t('sekme_gunluk'), n: izl.length },
      { k: 'inceleme', ad: t('sekme_inceleme'), n: p.inceleme_sayisi },
      { k: 'liste', ad: t('sekme_liste'), n: null }
    ];
    if (p.kendi) sekmeler.push({ k: 'ag', ad: t('sekme_ag'), n: null });

    var bar = el('div', { sinif: 'sekmeler', role: 'tablist' });
    var paneller = {};
    var dugmeler = {};
    sekmeler.forEach(function (s) {
      var d = el('button', { type: 'button', role: 'tab', sinif: 'sekme', 'aria-selected': 'false' },
        s.ad, s.n != null ? el('span', { sinif: 'sekme-n', metin: String(s.n) }) : null);
      d.addEventListener('click', function () { sekmeAc(s.k); });
      dugmeler[s.k] = d;
      bar.appendChild(d);
      paneller[s.k] = el('section', { sinif: 'panel', role: 'tabpanel' });
      paneller[s.k].hidden = true;
    });
    kok.appendChild(bar);
    sekmeler.forEach(function (s) { kok.appendChild(paneller[s.k]); });

    // İnceleme eşlemesi (günlükte "İncelendi" rozeti için).
    var incEs = {};
    inc.forEach(function (i) { if (i.tmdb_id) incEs[(i.tur === 'tv' ? 'dizi' : 'film') + ':' + i.tmdb_id] = i; });

    // Film günlüğü
    (function () {
      var pn = paneller.gunluk;
      if (!izl.length) { pn.appendChild(el('p', { sinif: 'bos-durum', metin: t('bos_gunluk') })); return; }
      pn.appendChild(izgara(izl, function (y) {
        var i = y.tmdb ? incEs[y.tur + ':' + y.tmdb] : null;
        if (!i) return null;
        return el('button', { type: 'button', sinif: 'incelendi', olay: { click: function () { incelemeyeGit(i); } } },
          t('incelendi'), i.puan ? ' · ' + i.puan + '/5' : '');
      }));
    })();

    // İncelemeler
    (function () {
      var pn = paneller.inceleme;
      if (!inc.length) { pn.appendChild(el('p', { sinif: 'bos-durum', metin: t('bos_inceleme') })); return; }
      inc.forEach(function (i) {
        pn.appendChild(el('article', { sinif: 'inceleme', id: 'inc-' + (i.tur === 'tv' ? 'dizi' : 'film') + '-' + i.tmdb_id },
          M.afisGorsel(i.afis, 'w185', i.ad),
          el('div', { sinif: 'inceleme-govde' },
            el('h3', {}, i.ad || '', i.yil ? el('span', { sinif: 'yil', metin: ' (' + i.yil + ')' }) : null),
            el('p', { sinif: 'meta', metin: (i.tur === 'tv' ? t('dizi') : t('film')) + ' · ' + M.tarih(i.tarih) }),
            yildiz(i.puan),
            el('p', { sinif: 'metin', metin: i.metin || '' }))));
      });
      if ((p.inceleme_sayisi || 0) > inc.length) pn.appendChild(el('p', { sinif: 'bos-durum', metin: t('son_inceleme', inc.length) }));
    })();

    // Listeler
    (function () {
      var pn = paneller.liste;
      var fav = (p.favoriler || []).map(M.yapimCoz);
      pn.appendChild(el('h2', { sinif: 'bolum-baslik', metin: t('favoriler') }));
      pn.appendChild(fav.length ? izgara(fav) : el('p', { sinif: 'bos-durum', metin: t('bos_favori') }));
      if (p.kendi) {
        var il = (p.izleme_listem || []).map(M.yapimCoz);
        pn.appendChild(el('h2', { sinif: 'bolum-baslik', metin: t('izleme_listem') }));
        pn.appendChild(el('p', { sinif: 'not', metin: t('izleme_not') }));
        pn.appendChild(il.length ? izgara(il) : el('p', { sinif: 'bos-durum', metin: t('bos_izleme') }));
      }
    })();

    // Takip ağı (yalnız kendi profil)
    var agTur = 'takipci';
    var agYuklendi = {};
    function agCiz() {
      var pn = paneller.ag;
      if (!pn) return;
      pn.textContent = '';
      var secim = el('div', { sinif: 'secim' });
      [['takipci', t('takipciler')], ['takip', t('takip_edilenler')]].forEach(function (x) {
        secim.appendChild(el('button', { type: 'button', sinif: 'secim-dgm' + (agTur === x[0] ? ' acik' : ''),
          olay: { click: function () { agTur = x[0]; agCiz(); } }, metin: x[1] }));
      });
      pn.appendChild(secim);
      var liste = el('div', { sinif: 'kisiler' });
      pn.appendChild(liste);
      if (agYuklendi[agTur]) { kisileriCiz(liste, agYuklendi[agTur]); return; }
      liste.appendChild(el('p', { sinif: 'bos-durum', metin: t('yukleniyor') }));
      var tur = agTur;
      M.sb.rpc('web_takip_listesi', { p_tur: tur }).then(function (r) {
        if (r.error) { liste.textContent = ''; liste.appendChild(el('p', { sinif: 'bos-durum', metin: t('hata') })); return; }
        agYuklendi[tur] = r.data || [];
        if (agTur === tur) { liste.textContent = ''; kisileriCiz(liste, agYuklendi[tur]); }
      });
    }
    function kisileriCiz(liste, satirlar) {
      if (!satirlar.length) {
        liste.appendChild(el('p', { sinif: 'bos-durum', metin: agTur === 'takipci' ? t('bos_takipci') : t('bos_takip') }));
        return;
      }
      satirlar.forEach(function (k) {
        var r = M.kademe(k.rozet);
        liste.appendChild(el('a', { sinif: 'kisi', href: M.profilYolu(k.kullanici_adi) },
          M.fotoGecerli(k.foto) ? el('img', { sinif: 'kisi-foto', src: k.foto, alt: '', loading: 'lazy' })
            : el('span', { sinif: 'kisi-foto avatar-bos', metin: (k.ad || '?').trim().charAt(0).toUpperCase() }),
          el('span', { sinif: 'kisi-ad' },
            el('b', { metin: k.ad || k.kullanici_adi }),
            el('small', { metin: '@' + k.kullanici_adi })),
          r ? el('span', { sinif: r.sinif + ' kucuk', metin: r.ad }) : null,
          k.gizli ? el('span', { sinif: 'gizli-etiket', metin: t('gizli_etiket') }) : null));
      });
    }

    function sekmeAc(k, alt) {
      if (!paneller[k]) return;
      Object.keys(paneller).forEach(function (x) {
        paneller[x].hidden = x !== k;
        dugmeler[x].setAttribute('aria-selected', x === k ? 'true' : 'false');
      });
      if (k === 'ag') { if (alt) agTur = alt; agCiz(); }
    }
    function incelemeyeGit(i) {
      sekmeAc('inceleme');
      var hedef = document.getElementById('inc-' + (i.tur === 'tv' ? 'dizi' : 'film') + '-' + i.tmdb_id);
      if (hedef) { hedef.scrollIntoView({ behavior: 'smooth', block: 'center' }); hedef.classList.add('vurgu'); }
    }
    window.__sekmeAc = sekmeAc;
    // Sekmeye doğrudan bağlantı: #incelemeler, #listeler, #takipciler, #takip
    var BAG = { '#gunluk': ['gunluk'], '#incelemeler': ['inceleme'], '#listeler': ['liste'],
      '#takipciler': ['ag', 'takipci'], '#takip': ['ag', 'takip'] };
    var bag = BAG[location.hash] || ['gunluk'];
    sekmeAc(bag[0], bag[1]);
    if (!paneller[bag[0]]) sekmeAc('gunluk');

    if (!oturum) kok.appendChild(cta());
  }

  // Sayılara tıklamak sekmeyi açar (kahraman sekmelerden önce çiziliyor).
  function sekmeAc(k, alt) { if (window.__sekmeAc) window.__sekmeAc(k, alt); }

  function izgara(yapimlar, ek) {
    var g = el('div', { sinif: 'izgara' });
    yapimlar.forEach(function (y) {
      g.appendChild(el('figure', { sinif: 'yapim' },
        M.afisGorsel(y.afis, 'w342', y.ad),
        el('figcaption', {},
          el('span', { sinif: 'yapim-ad', metin: y.ad }),
          el('span', { sinif: 'yapim-tur', metin: y.tur === 'dizi' ? t('dizi') : t('film') }),
          ek ? ek(y) : null)));
    });
    return g;
  }

  function cta() {
    return el('section', { sinif: 'cta' },
      el('h2', { metin: t('cta_baslik') }),
      el('p', { metin: t('cta_alt') }),
      M.magazaDugmeleri());
  }
})();
