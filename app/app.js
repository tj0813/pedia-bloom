/* Pedia Bloom — shell router + native screens.
 * Ties the 76 bundled Stitch fragments (window.PEDIA_SCREENS) into one
 * navigable PWA and adds the core screens Stitch never exported. */
(function () {
  "use strict";

  var SCREENS = window.PEDIA_SCREENS || {};
  var I18N = window.PEDIA_I18N_TOPICS || {}; // curated ID->EN topic titles/subtitles
  var CONTENT = window.PEDIA_CONTENT || {};  // rich encyclopedia entries (Wikipedia/Commons)

  // Variant duplicates hidden from category/library listings — one canonical card per
  // subject (e.g. keep anoa_1, hide anoa_2; keep cendrawasih, hide burung_cendrawasih).
  var HIDDEN_DUPLICATES = {
    "ensiklopedia_anoa_sulawesi_2": 1, "ensiklopedia_burung_maleo_2": 1,
    "ensiklopedia_gajah_sumatra_beranimasi": 1, "ensiklopedia_harimau_sumatra_2": 1,
    "ensiklopedia_jalak_bali_2": 1, "ensiklopedia_penyu_hijau_2": 1,
    "ensiklopedia_burung_cendrawasih": 1, "ensiklopedia_candi_borobudur_1": 1,
    "budaya_alat_musik_angklung_2": 1, "budaya_tari_kecak_bali_beranimasi": 1,
    "sains_gunung_berapi_ring_of_fire_2": 1, "sains_gunung_berapi_ring_of_fire_3": 1,
    "sains_keajaiban_energi_matahari_2": 1,
    "pahlawan_pangeran_diponegoro_2": 1, "pahlawan_pangeran_diponegoro_beranimasi": 1,
    "pahlawan_ki_hajar_dewantara_2": 1, "kewarganegaraan_pancasila_dasar_negara": 1
  };
  var geval = eval; // indirect eval -> runs screen scripts in global scope

  /* Bilingual heading helper (DESIGN.md: Indonesian primary + English subtitle in
   * fresh-teal at 60% size). The .bi-en span handles the teal 0.6em subtitle. */
  function biHead(tag, cls, idText, enText) {
    var sub = enText ? '<span class="bi-en">' + esc(enText) + "</span>" : "";
    return "<" + tag + ' class="' + cls + '">' + esc(idText) + sub + "</" + tag + ">";
  }

  /* ---------------------------------------------------------------- store */
  // Real engagement tracking (no backend) — powers the parent dashboard.
  var store = {
    read: function (k, d) { try { return JSON.parse(localStorage.getItem("pedia." + k)) ?? d; } catch (e) { return d; } },
    write: function (k, v) { try { localStorage.setItem("pedia." + k, JSON.stringify(v)); } catch (e) {} },
    visit: function (id, cat) {
      var v = store.read("visited", {});
      v[id] = (v[id] || 0) + 1;
      store.write("visited", v);
      var today = new Date().toISOString().slice(0, 10);
      var s = store.read("streak", { last: "", days: 0 });
      if (s.last !== today) {
        var y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        s.days = s.last === y ? s.days + 1 : 1;
        s.last = today;
        store.write("streak", s);
      }
    },
    prefs: function () { return store.read("prefs", { dark: false, dyslexia: false, large: false }); },
    profile: function () { return store.read("profile", { name: "Penjelajah" }); }
  };

  /* Derive all gamification stats from real engagement (no backend, no fake numbers).
   * XP rewards both depth (revisits) and breadth (new topics); level = 250 XP each. */
  var XP_PER_LEVEL = 250;
  function computeStats() {
    var visited = store.read("visited", {});
    var ids = Object.keys(visited).filter(function (k) { return SCREENS[k]; });
    var unique = ids.length;
    var totalViews = ids.reduce(function (n, k) { return n + visited[k]; }, 0);
    var xp = unique * 25 + totalViews * 10;
    var streak = store.read("streak", { days: 0 }).days;
    var prog = catProgress();
    var badges = BADGE_DEFS.filter(function (b) { return (prog[b.cat] || 0) >= b.need; }).length;
    return {
      xp: xp, level: Math.floor(xp / XP_PER_LEVEL) + 1,
      xpInLevel: xp % XP_PER_LEVEL, xpPerLevel: XP_PER_LEVEL,
      xpPct: Math.round((xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100),
      streak: streak, badges: badges, coins: totalViews * 15, unique: unique, totalViews: totalViews
    };
  }

  /* --------------------------------------------------------------- helpers */
  var CATS = {
    "Alam & Hewan Indonesia":            { icon: "pets",                color: "primary" },
    "Sains Seru":                        { icon: "science",             color: "secondary" },
    "Budaya Nusantara":                  { icon: "festival",            color: "tertiary" },
    "Sejarah & Pahlawan":                { icon: "history_edu",         color: "primary" },
    "Lingkungan & Kehidupan Sehari-hari":{ icon: "eco",                 color: "secondary" },
    "Lainnya":                           { icon: "auto_stories",        color: "primary" }
  };

  // English names for categories (DESIGN.md bilingual hierarchy).
  var CAT_EN = {
    "Alam & Hewan Indonesia": "Nature & Animals", "Sains Seru": "Fun Science",
    "Budaya Nusantara": "Culture", "Sejarah & Pahlawan": "History & Heroes",
    "Lingkungan & Kehidupan Sehari-hari": "Daily Life", "Lainnya": "More", "Misi": "Missions"
  };
  function catEn(c) { return CAT_EN[c] || ""; }

  var TITLE_FIX = {
    ra_kartini: "R.A. Kartini", ki_hajar_dewantara: "Ki Hajar Dewantara",
    bung_tomo: "Bung Tomo", jenderal_sudirman: "Jenderal Sudirman",
    pangeran_diponegoro: "Pangeran Diponegoro", rafflesia_arnoldii: "Rafflesia Arnoldii",
    rumah_gadang: "Rumah Gadang", anoa_sulawesi: "Anoa Sulawesi", burung_maleo: "Burung Maleo",
    candi_borobudur: "Candi Borobudur", candi_prambanan: "Candi Prambanan", wayang_kulit: "Wayang Kulit",
    tari_kecak_bali: "Tari Kecak Bali", tari_saman: "Tari Saman", alat_musik_angklung: "Angklung",
    penyu_hijau: "Penyu Hijau", jalak_bali: "Jalak Bali", harimau_sumatra: "Harimau Sumatra",
    gajah_sumatra: "Gajah Sumatra", badak_jawa: "Badak Jawa", hutan_mangrove: "Hutan Mangrove",
    bunga_bangkai: "Bunga Bangkai", kantong_semar: "Kantong Semar", anggrek_macan: "Anggrek Macan",
    burung_cendrawasih: "Burung Cendrawasih", hiu_paus: "Hiu Paus",
    proklamasi_kemerdekaan: "Proklamasi Kemerdekaan", sumpah_pemuda: "Sumpah Pemuda",
    sumatra_barat: "Jelajah Sumatra Barat"
  };

  function deriveTitle(id) {
    var t = id.replace(/^(ensiklopedia|budaya|pahlawan|sains|sejarah|misi|hub|jelajah|galeri|lab|pusat|tanya|arena|kuliner|cerita|kewarganegaraan|olahraga|lingkungan|ekonomi|profesi)_/, "");
    var variant = "", variantEn = "";
    if (/_beranimasi$/.test(t)) { variant = "Animasi"; variantEn = "Animated"; t = t.replace(/_beranimasi$/, ""); }
    var p = t.match(/_(\d+)$/);
    if (p) { variant = "Bagian " + p[1]; variantEn = "Part " + p[1]; t = t.replace(/_\d+$/, ""); }
    var name = TITLE_FIX[t] || t.replace(/_/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    var meta = I18N[id] || {};
    return { name: name, variant: variant, variantEn: variantEn, en: meta.en || "", sub: meta.sub || "" };
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function colorOf(cat) { return (CATS[cat] || CATS.Lainnya).color; }
  function iconOf(cat) { return (CATS[cat] || CATS.Lainnya).icon; }

  // Topic cards used across home / library / explore.
  function card(id) {
    var s = SCREENS[id]; if (!s) return "";
    var d = deriveTitle(id), c = colorOf(s.category);
    var rich = CONTENT[id];
    // Enriched topics show their real photo + curated title; others use the Stitch thumb.
    var name = rich ? rich.title_id : d.name;
    var en = rich ? rich.title_en : d.en;
    var sub = rich ? rich.subtitle_id : d.sub;
    // Keep each topic's original image as its card cover; Wikipedia photos live in the gallery.
    var thumb = s.thumb;
    var variantLabel = (!rich && d.variant) ? d.variant + (d.variantEn ? " · " + d.variantEn : "") : "";
    var badge = rich ? '<span class="absolute top-2 right-2 bg-primary text-on-primary text-[10px] font-label-md font-bold px-2 py-0.5 rounded-md shadow flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">menu_book</span>Lengkap</span>' :
      (variantLabel ? '<span class="absolute top-2 right-2 bg-tertiary-container text-on-tertiary-container text-[11px] font-label-md font-bold px-2 py-0.5 rounded-md shadow">' + esc(variantLabel) + "</span>" : "");
    return (
      '<a href="#/screen/' + id + '" class="group block story-card overflow-hidden hover:-translate-y-1 transition-transform pop-in">' +
        '<div class="relative h-32 overflow-hidden rounded-t-xl">' +
          '<img src="' + esc(thumb) + '" alt="' + esc(name) + '" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />' + badge +
        "</div>" +
        '<div class="p-3">' +
          '<span class="inline-flex items-center gap-1 text-[11px] font-label-md font-bold text-' + c + ' mb-1"><span class="material-symbols-outlined text-[14px]">' + iconOf(s.category) + "</span>" + esc(s.category) + "</span>" +
          '<h3 class="font-headline-lg-mobile text-[15px] leading-tight font-bold text-on-surface line-clamp-2">' + esc(name) +
            (en ? '<span class="bi-en">' + esc(en) + "</span>" : "") + "</h3>" +
          (sub ? '<p class="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">' + esc(sub) + "</p>" : "") +
        "</div>" +
      "</a>"
    );
  }

  function screensByCategory() {
    var map = {};
    Object.keys(SCREENS).forEach(function (id) {
      if (HIDDEN_DUPLICATES[id] || id === "tanya_bimobot_ai_chat" || id === "dashboard_petualang_utama" || id.indexOf("beranda_") === 0 || id === "peta_jelajah_nusantara" || id === "dashboard_orang_tua" || id === "gerbang_orang_tua" || id === "galeri_lencana_kebanggaan") {
        return;
      }
      var c = SCREENS[id].category;
      (map[c] = map[c] || []).push(id);
    });
    return map;
  }

  /* ----------------------------------------------------------------- views */
  var view = document.getElementById("view");
  var DAILY_FACTS = [
    { t: "Indonesia punya lebih dari 17.000 pulau!", e: "🏝️" },
    { t: "Komodo hanya hidup di Indonesia, lho.", e: "🦎" },
    { t: "Borobudur adalah candi Buddha terbesar di dunia.", e: "🛕" },
    { t: "Indonesia dilewati garis Khatulistiwa.", e: "🌏" },
    { t: "Rafflesia adalah bunga terbesar di dunia.", e: "🌺" },
    { t: "Garuda Pancasila adalah lambang negara kita.", e: "🦅" },
    { t: "Indonesia berada di Cincin Api Pasifik.", e: "🌋" },
    { t: "Bahasa daerah di Indonesia ada lebih dari 700!", e: "🗣️" }
  ];

  function topbar(title, showBack) {
    document.getElementById("topbar-title").textContent = title;
    document.getElementById("header-detail").classList.toggle("hidden", !showBack);
    document.getElementById("header-shell").classList.toggle("hidden", showBack);
  }

  function setActiveNav(routeBase) {
    document.querySelectorAll(".nav-item").forEach(function (a) {
      a.toggleAttribute("aria-current", a.dataset.route === routeBase);
      if (a.dataset.route === routeBase) a.setAttribute("aria-current", "page");
    });
  }

  /* Home / Beranda */
  function viewHome() {
    var visited = store.read("visited", {});
    var cont = Object.keys(visited).filter(function (k) { return SCREENS[k]; }).slice(-6).reverse();
    var starter = ["ensiklopedia_komodo_1", "sains_keajaiban_siklus_air", "budaya_batik_indonesia", "sejarah_sumpah_pemuda"].filter(function (id) { return SCREENS[id]; });
    var learnIds = cont.length ? cont : starter;
    var stats = computeStats();
    var name = store.profile().name;

    topbar("Pedia Bloom", false);
    setActiveNav("home");

    // Stitch-inspired mobile-first home: illustrated storybook scene, frosted page,
    // large search, pastel topic tiles, and light bottom navigation.
    view.innerHTML =
      '<div class="storybook-home px-5 max-w-[960px] mx-auto space-y-4 pt-3 pb-8">' +
        '<section class="home-page-card pop-in">' +
          '<div class="flex items-center justify-between gap-3 mb-3">' +
            '<button aria-label="Pengaturan" onclick="location.hash=\'#/settings\'" class="home-round-control"><span class="material-symbols-outlined text-[22px]">settings</span></button>' +
            '<div class="flex items-center gap-2 min-w-0">' +
              '<img src="app/assets/img/explorer_mascot.png" alt="Avatar penjelajah" class="w-11 h-11 rounded-full object-cover border-2 border-white shadow-storybook-sm" />' +
              '<div class="min-w-0">' +
                '<p class="font-label-md text-[16px] font-bold text-on-surface truncate">Halo, ' + esc(name) + '!</p>' +
                '<p class="text-[13px] font-bold text-fresh-teal leading-tight">Level ' + stats.level + ' · ' + stats.xpInLevel + '/' + stats.xpPerLevel + ' XP</p>' +
              '</div>' +
            '</div>' +
            '<a href="#/badges" aria-label="Lencana" class="home-round-control"><span class="material-symbols-outlined text-[22px]" style="font-variation-settings:\'FILL\' 1;">military_tech</span></a>' +
          '</div>' +

          '<label class="relative block mb-4">' +
            '<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[22px]">search</span>' +
            '<input id="home-search" type="search" inputmode="search" placeholder="Search for wonders..." aria-label="Cari topik / Search topics" class="home-search-input" />' +
          '</label>' +

          '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">' +
            homeTile("#/category/" + encodeURIComponent("Alam & Hewan Indonesia"), "pets", "Animals", "Hewan", "bg-[#ffe2a8]", "text-[#754300]") +
            homeTile("#/map/Bali%20%26%20Nusa%20Tenggara", "rocket_launch", "Space", "Antariksa", "bg-[#d9e6ff]", "text-[#00497d]") +
            homeTile("#/screen/ensiklopedia_komodo_1", "cruelty_free", "Dinosaurs", "Komodo", "bg-[#d9f5bf]", "text-[#1d5d20]") +
            homeTile("#/library", "water_drop", "Ocean Life", "Laut", "bg-[#c9eff8]", "text-[#00536a]") +
            homeTile("#/category/" + encodeURIComponent("Sains Seru"), "science", "Science", "Sains", "bg-[#e9d5ff]", "text-[#5b2484]") +
            homeTile("#/category/" + encodeURIComponent("Sejarah & Pahlawan"), "history_edu", "History", "Sejarah", "bg-[#ffe1d2]", "text-[#8a3b00]") +
          '</div>' +

          '<div class="mt-4 grid grid-cols-3 gap-2 text-center">' +
            miniStat(stats.streak, "Streak", "local_fire_department", "text-tertiary") +
            miniStat(stats.badges, "Badges", "military_tech", "text-primary") +
            miniStat(stats.coins, "Coins", "diamond", "text-secondary") +
          '</div>' +
        '</section>' +

        '<section class="home-page-card p-4 pop-in">' +
          '<div class="flex items-center justify-between mb-3">' +
            biHead("h3", "font-headline-lg-mobile text-[18px] font-bold text-on-surface", cont.length ? "Lanjut Belajar" : "Mulai Jelajah", cont.length ? "Continue" : "Start Exploring") +
            '<a href="#/library" class="home-small-link">All</a>' +
          '</div>' + railHtml(learnIds.slice(0, 4)) +
        '</section>' +

        '<section class="home-page-card p-4 pop-in">' +
          '<div class="flex items-center gap-3">' +
            '<img src="app/assets/img/smart_owl_helper.png" alt="BimoBot" class="w-20 h-20 object-contain rounded-xl bg-[#f5d1ff]" />' +
            '<div class="min-w-0 flex-1">' +
              '<h3 class="font-headline-lg-mobile text-[18px] leading-tight font-bold text-on-surface">Ask BimoBot<span class="bi-en">Tanya teman pintar</span></h3>' +
              '<p class="text-[14px] leading-snug text-on-surface-variant mt-1">Temukan jawaban aman tentang Indonesia.</p>' +
            '</div>' +
            '<a href="#/ai" aria-label="Tanya BimoBot" class="home-round-control bg-tertiary-container text-on-tertiary-container"><span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">smart_toy</span></a>' +
          '</div>' +
        '</section>' +
      '</div>';

    document.getElementById("home-search").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var q = e.currentTarget.value.trim();
        location.hash = q ? "#/library?search=" + encodeURIComponent(q) : "#/library";
      }
    });
  }

  function homeTile(href, icon, title, subtitle, bg, fg) {
    return '<a href="' + href + '" class="home-topic-tile ' + bg + " " + fg + '">' +
      '<span class="home-topic-icon material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">' + icon + "</span>" +
      '<span class="font-label-md text-[15px] font-bold leading-tight">' + esc(title) + '<span class="block text-[12px] opacity-70 mt-0.5">' + esc(subtitle) + "</span></span>" +
      "</a>";
  }

  function miniStat(n, label, icon, color) {
    return '<a href="#/badges" class="rounded-xl bg-white/60 dark:bg-surface-container p-2 min-h-[56px] flex flex-col items-center justify-center border border-white/70 dark:border-outline-variant/50">' +
      '<span class="material-symbols-outlined text-[20px] ' + color + '" style="font-variation-settings:\'FILL\' 1;">' + icon + '</span>' +
      '<span class="text-[13px] font-bold text-on-surface leading-tight">' + n + '</span>' +
      '<span class="text-[11px] font-bold text-on-surface-variant leading-tight">' + esc(label) + '</span>' +
      '</a>';
  }

  // Big gamified entry card on Home; bilingual title, storybook shadow.
  function featureCard(href, img, alt, fromColor, toColor, idTitle, enTitle, idDesc) {
    return '<a href="' + href + '" class="group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-' + fromColor + " to-" + toColor + ' text-white shadow-storybook hover:-translate-y-1 transition-transform flex flex-col justify-between h-[180px]">' +
      '<img src="app/assets/img/' + img + '" alt="' + esc(alt) + '" class="absolute right-4 bottom-2 w-24 h-24 object-contain opacity-80 group-hover:scale-105 transition-transform" />' +
      '<div class="space-y-1 text-left relative z-10 max-w-[65%]">' +
        '<h3 class="font-headline-lg-mobile text-[18px] font-bold leading-tight">' + esc(idTitle) +
          '<span class="block font-medium text-[11px] leading-tight mt-0.5 text-white/75">' + esc(enTitle) + "</span></h3>" +
        '<p class="text-[12px] text-white/85 leading-snug">' + esc(idDesc) + "</p>" +
      "</div>" +
      '<div class="w-8 h-8 rounded-full bg-white/20 border border-white/20 flex items-center justify-center self-start relative z-10"><span class="material-symbols-outlined text-white text-[18px]">arrow_forward</span></div>' +
    "</a>";
  }

  function categoryBubbleCard(name, enName, icon, gradient) {
    var shortName = name.replace(" Sehari-hari", "").replace(" Indonesia", "");
    return (
      '<a href="#/category/' + encodeURIComponent(name) + '" class="flex flex-col items-center gap-2 story-card hover:border-primary/30 p-4 text-center transition-all hover:-translate-y-0.5">' +
        '<div class="w-14 h-14 rounded-full bg-gradient-to-tr ' + gradient + ' grid place-items-center text-white shadow-storybook-sm transform hover:scale-105 transition-transform">' +
          '<span class="material-symbols-outlined text-[28px]" style="font-variation-settings:\'FILL\' 1;">' + icon + '</span>' +
        '</div>' +
        '<span class="font-label-md text-[13px] font-bold text-on-surface leading-tight">' + esc(shortName) +
          '<span class="bi-en">' + esc(enName) + '</span></span>' +
      '</a>'
    );
  }

  function section(titleId, titleEn, icon, body) {
    return '<section class="space-y-3"><h3 class="font-headline-lg-mobile text-[20px] font-bold text-primary flex items-center gap-2"><span class="material-symbols-outlined">' + icon + "</span><span>" + esc(titleId) + (titleEn ? '<span class="bi-en">' + esc(titleEn) + "</span>" : "") + "</span></h3>" + body + "</section>";
  }
  function railHtml(ids) {
    return '<div class="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">' + ids.map(function (id) { return '<div class="w-40 shrink-0">' + card(id) + "</div>"; }).join("") + "</div>";
  }
  function missionRow(id) {
    var d = deriveTitle(id), s = SCREENS[id];
    return '<a href="#/screen/' + id + '" class="flex items-center gap-3 bg-surface-container-lowest border-2 border-surface-variant rounded-xl p-3 hover:bg-surface-container transition-colors">' +
      '<div class="w-12 h-12 rounded-lg bg-tertiary-container grid place-items-center text-on-tertiary-container shrink-0"><span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">' + s.icon + "</span></div>" +
      '<div class="min-w-0 flex-1"><p class="font-label-md font-bold text-on-surface truncate">' + esc(d.name) + "</p><p class=\"text-[13px] text-on-surface-variant\">Selesaikan untuk dapat XP!</p></div>" +
      '<span class="material-symbols-outlined text-primary">chevron_right</span></a>';
  }

  /* Explore hub — category grid */
  function viewExplore() {
    var byCat = screensByCategory();
    topbar("Jelajah", false);
    setActiveNav("explore");
    var quick =
      '<div class="grid grid-cols-2 gap-3">' +
        quickTile("#/map", "🗺️", "Peta Nusantara", "Explore Map", "secondary-container", "on-secondary-container") +
        quickTile("#/library", "📚", "Semua Topik", "All Topics", "primary-container", "on-primary-container") +
        quickTile("#/games", "🎮", "Main & Misi", "Play & Missions", "tertiary-container", "on-tertiary-container") +
        quickTile("#/badges", "🏅", "Lencanaku", "My Badges", "secondary-fixed", "on-secondary-fixed") +
      "</div>";
    var cats = Object.keys(byCat).sort().map(function (c) {
      var col = colorOf(c);
      return '<a href="#/category/' + encodeURIComponent(c) + '" class="flex items-center gap-3 story-card p-4 hover:-translate-y-0.5 transition-transform pop-in">' +
        '<div class="w-12 h-12 rounded-xl bg-' + col + '-container grid place-items-center text-on-' + col + '-container shrink-0"><span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">' + iconOf(c) + "</span></div>" +
        '<div class="flex-1 min-w-0">' + biHead("p", "font-headline-lg-mobile text-[16px] font-bold text-on-surface", c, catEn(c)) + '<p class="text-[13px] text-on-surface-variant">' + byCat[c].length + " topik · topics</p></div>" +
        '<span class="material-symbols-outlined text-primary">chevron_right</span></a>';
    }).join("");
    view.innerHTML =
      '<div class="px-margin-mobile max-w-container-max mx-auto space-y-6 pt-4">' +
        biHead("h2", "font-headline-lg text-[26px] font-bold text-primary pop-in", "Mau jelajah apa?", "What do you want to explore?") +
        quick +
        biHead("h3", "font-headline-lg-mobile text-[20px] font-bold text-secondary pt-2", "Kategori Ensiklopedia", "Encyclopedia Categories") +
        '<div class="grid gap-3">' + cats + "</div>" +
      "</div>";
  }
  function quickTile(href, emoji, label, enLabel, bg, fg) {
    return '<a href="' + href + '" class="relative overflow-hidden rounded-xl bg-' + bg + " text-" + fg + ' p-4 h-28 flex flex-col justify-between shadow-storybook-sm hover:-translate-y-0.5 transition-transform pop-in">' +
      '<span class="text-[30px]">' + emoji + "</span>" +
      '<span class="font-headline-lg-mobile text-[16px] font-bold leading-tight">' + esc(label) +
        '<span class="block font-medium text-[11px] opacity-75 mt-0.5">' + esc(enLabel) + "</span></span></a>";
  }

  /* Library (all) + category filter */
  function viewLibrary(cat) {
    var ids = Object.keys(SCREENS).filter(function (i) {
      if (HIDDEN_DUPLICATES[i] || i === "tanya_bimobot_ai_chat" || i === "dashboard_petualang_utama" || i.indexOf("beranda_") === 0 || i === "peta_jelajah_nusantara" || i === "dashboard_orang_tua" || i === "gerbang_orang_tua" || i === "galeri_lencana_kebanggaan") {
        return false;
      }
      return !cat || SCREENS[i].category === cat;
    });
    topbar(cat || "Semua Topik", true);
    setActiveNav("explore");
    var byCat = screensByCategory();
    var chips = ['<a href="#/library" class="shrink-0 px-4 py-2 rounded-full font-label-md text-[14px] font-bold border-2 ' + (!cat ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest text-on-surface-variant border-surface-variant") + '">Semua</a>']
      .concat(Object.keys(byCat).sort().map(function (c) {
        var on = c === cat;
        return '<a href="#/category/' + encodeURIComponent(c) + '" class="shrink-0 px-4 py-2 rounded-full font-label-md text-[14px] font-bold border-2 ' + (on ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest text-on-surface-variant border-surface-variant") + '">' + esc(c) + "</a>";
      })).join("");
    view.innerHTML =
      '<div class="px-margin-mobile max-w-container-max mx-auto space-y-4 pt-4">' +
        '<div class="relative"><span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>' +
          '<input id="lib-search" type="search" inputmode="search" placeholder="Apa yang ingin kamu pelajari? / What do you want to learn?" aria-label="Cari topik / Search topics" class="w-full bg-surface-container-low border-2 border-secondary/40 rounded-full pl-12 pr-4 py-3 font-body-md text-on-surface focus:border-secondary outline-none" /></div>' +
        '<div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">' + chips + "</div>" +
        '<p id="lib-count" class="font-label-md text-[14px] text-on-surface-variant">' + ids.length + " topik · topics</p>" +
        '<div id="lib-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">' + ids.map(card).join("") + "</div>" +
        '<div id="lib-empty" class="hidden text-center py-12 text-on-surface-variant"><div class="text-[56px]">🔍</div><p class="font-body-md">Topik tidak ditemukan. Coba kata lain, ya!<span class="block text-[14px] text-fresh-teal mt-1">No topics found. Try another word!</span></p></div>' +
      "</div>";
    var input = document.getElementById("lib-search");
    input.addEventListener("input", function () {
      var q = input.value.toLowerCase().trim();
      var shown = 0;
      var matched = ids.filter(function (id) { return deriveTitle(id).name.toLowerCase().indexOf(q) > -1 || SCREENS[id].category.toLowerCase().indexOf(q) > -1; });
      document.getElementById("lib-grid").innerHTML = matched.map(card).join("");
      shown = matched.length;
      document.getElementById("lib-count").textContent = shown + " topik";
      document.getElementById("lib-empty").classList.toggle("hidden", shown > 0);
    });
    var queryMatch = location.hash.match(/[?&]search=([^&]+)/);
    if (queryMatch) {
      input.value = decodeURIComponent(queryMatch[1].replace(/\+/g, " "));
      input.dispatchEvent(new Event("input"));
    }
  }

  /* Stitch fragment renderer */
  function floatingAi(name) {
    return '<div class="fixed bottom-24 right-6 z-40">' +
      '<a href="#/ai?topic=' + encodeURIComponent(name) + '" class="squishy-button flex items-center gap-2 bg-primary text-on-primary border-on-primary-container px-4 py-3 rounded-full shadow-[0_4px_16px_rgba(0,110,28,0.4)] hover:bg-on-primary-container hover:scale-105 transition-all duration-300">' +
        '<span class="material-symbols-outlined text-[20px]" style="font-variation-settings:\'FILL\' 1;">smart_toy</span>' +
        '<span class="font-label-md font-bold text-sm">Tanya Bloom AI</span>' +
      '</a></div>';
  }

  function viewScreen(id) {
    if (CONTENT[id]) return viewRichScreen(id); // enriched encyclopedia page
    var s = SCREENS[id];
    if (!s) { view.innerHTML = notFound(); return; }
    var d = deriveTitle(id);
    store.visit(id, s.category);
    topbar(d.name, true);
    setActiveNav("explore");

    var isUtility = id === "tanya_bimobot_ai_chat" || id === "dashboard_petualang_utama" || id.indexOf("beranda_") === 0 || id === "peta_jelajah_nusantara" || id === "dashboard_orang_tua" || id === "gerbang_orang_tua";
    var floatingAiBtn = isUtility ? "" : floatingAi(d.name);

    // Bilingual context banner (DESIGN.md): English name + simple subtitle above the fragment.
    var biBanner = d.en ? '<div class="flex items-start gap-2 bg-surface-container-low border-l-4 border-fresh-teal rounded-md px-4 py-2.5">' +
      '<span class="material-symbols-outlined text-fresh-teal text-[20px]">translate</span>' +
      '<p class="font-body-md text-[15px] leading-snug"><span class="font-bold text-on-surface">' + esc(d.en) + "</span>" +
      (d.sub ? '<span class="block text-[13px] text-on-surface-variant">' + esc(d.sub) + "</span>" : "") + "</p></div>" : "";

    view.innerHTML =
      '<div class="px-margin-mobile max-w-container-max mx-auto space-y-7 pt-2 pb-16 pop-in">' + biBanner + s.html +
        relatedHtml(id) +
      '</div>' +
      floatingAiBtn;
    // run the screen's own interaction scripts in global scope (fresh each visit)
    (s.scripts || []).forEach(function (code) { try { geval(code); } catch (e) { console.warn("screen script error in " + id, e); } });
    updateProfileChip(); // reflect the XP/level gained from this visit
    view.scrollTop = 0; window.scrollTo(0, 0);
  }
  function relatedHtml(id) {
    var cat = SCREENS[id].category;
    var rel = Object.keys(SCREENS).filter(function (i) { return i !== id && SCREENS[i].category === cat; }).slice(0, 4);
    if (!rel.length) return "";
    return '<section class="space-y-3 pt-2"><h3 class="font-headline-lg-mobile text-[20px] font-bold text-primary flex items-center gap-2"><span class="material-symbols-outlined">recommend</span><span>Topik Terkait<span class="bi-en">Related Topics</span></span></h3><div class="grid grid-cols-2 gap-3">' + rel.map(card).join("") + "</div></section>";
  }

  /* Rich "illustrated encyclopedia" page (v2) — fact-file infobox, captioned photo
   * gallery, colorful sections, fun facts, glossary, credits. Single-language by
   * default (Indonesian) with an EN toggle, plus offline read-aloud. */
  var richLang = "id", currentRichId = null;
  function tL(idText, enText) { return esc(richLang === "en" ? (enText || idText || "") : (idText || enText || "")); }
  function tOther(idText, enText) { return esc(richLang === "en" ? (idText || "") : (enText || "")); }
  function gSrc(g) { return typeof g === "string" ? g : (g && g.src) || ""; }
  function gCap(g) { return typeof g === "string" ? "" : (richLang === "en" ? (g.caption_en || g.caption_id || "") : (g.caption_id || g.caption_en || "")); }

  function viewRichScreen(id) {
    var c = CONTENT[id];
    currentRichId = id;
    store.visit(id, (SCREENS[id] || {}).category || "Alam & Hewan Indonesia");
    topbar(richLang === "en" ? c.title_en : c.title_id, true);
    setActiveNav("explore");

    var gallery = (c.gallery || []).filter(Boolean);
    // Hero = the topic's ORIGINAL image (kept as its "face"); Wikipedia photos sit in the gallery.
    var hero = (SCREENS[id] && SCREENS[id].thumb) || (gallery.length ? gSrc(gallery[0]) : "app/assets/placeholder.svg");

    var topbarRow =
      '<div class="flex items-center justify-between gap-2">' +
        '<button id="read-aloud" class="flex items-center gap-1.5 bg-surface-container text-primary rounded-full px-3 py-1.5 text-[12px] font-bold"><span class="material-symbols-outlined text-[18px]">volume_up</span>' + (richLang === "en" ? "Listen" : "Dengarkan") + "</button>" +
        '<div class="flex items-center gap-1 bg-surface-container rounded-full p-1 text-[12px] font-bold shrink-0">' +
          '<button data-lang="id" class="px-3 py-1 rounded-full ' + (richLang === "id" ? "bg-primary text-on-primary" : "text-on-surface-variant") + '">ID</button>' +
          '<button data-lang="en" class="px-3 py-1 rounded-full ' + (richLang === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant") + '">EN</button>' +
        "</div></div>";

    var dataCard = (c.data_card && c.data_card.length) ?
      '<section class="story-card p-4"><div class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">' +
      c.data_card.map(function (t) {
        return '<div class="flex items-start gap-2">' +
          '<span class="material-symbols-outlined text-primary text-[22px] shrink-0">' + esc(t.icon || "info") + "</span>" +
          '<div class="min-w-0"><p class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide leading-none">' + tL(t.label_id, t.label_en) + "</p>" +
          '<p class="font-label-md text-[14px] font-bold text-on-surface leading-tight mt-0.5">' + tL(t.value_id, t.value_en) + "</p></div></div>";
      }).join("") + "</div></section>" : "";

    var strip = gallery.map(function (g, i) {
      var src = gSrc(g), cap = gCap(g);
      return '<figure data-zoom="' + esc(src) + '" role="button" tabindex="0" aria-label="Perbesar foto ' + (i + 1) + '" class="snap-start shrink-0 w-[240px] rounded-xl overflow-hidden border-2 border-surface-variant bg-surface-container-lowest cursor-zoom-in">' +
        '<img src="' + esc(src) + '" alt="' + tL(c.title_id, c.title_en) + " " + (i + 1) + '" loading="lazy" class="w-full h-[150px] object-cover" />' +
        (cap ? '<figcaption class="text-[11px] text-on-surface-variant p-2 leading-snug">' + cap + "</figcaption>" : "") + "</figure>";
    }).join("");

    var sections = (c.sections || []).map(function (s) {
      return '<section class="story-card p-5 space-y-2">' +
        '<h3 class="font-headline-lg-mobile text-[18px] font-bold text-primary flex items-center gap-2"><span class="material-symbols-outlined">' + esc(s.icon || "info") + "</span><span>" + tL(s.h_id, s.h_en) + '<span class="bi-en">' + tOther(s.h_id, s.h_en) + "</span></span></h3>" +
        '<p class="font-body-md text-[15px] text-on-surface leading-relaxed">' + tL(s.body_id, s.body_en) + "</p></section>";
    }).join("");

    var facts = (c.facts || []).map(function (f) {
      return '<div class="bg-secondary-fixed rounded-xl p-3 flex gap-2">' +
        '<span class="material-symbols-outlined text-secondary text-[20px] shrink-0" style="font-variation-settings:\'FILL\' 1;">lightbulb</span>' +
        '<p class="text-[13px] text-on-secondary-fixed leading-snug font-medium">' + tL(f.id, f.en) + "</p></div>";
    }).join("");

    var glossary = (c.glossary && c.glossary.length) ?
      '<section class="space-y-3"><h3 class="font-headline-lg-mobile text-[18px] font-bold text-tertiary flex items-center gap-2"><span class="material-symbols-outlined">menu_book</span><span>Kata Baru<span class="bi-en">New Words</span></span></h3><div class="space-y-2">' +
      c.glossary.map(function (gl) {
        return '<div class="story-card p-3"><p class="font-label-md text-[14px] font-bold text-tertiary">' + esc(gl.term) + "</p>" +
          '<p class="text-[13px] text-on-surface leading-snug mt-0.5">' + tL(gl.def_id, gl.def_en) + "</p></div>";
      }).join("") + "</div></section>" : "";

    // Folk-tale "moral of the story" — cream card + bold orange accent so the most
    // important sentence is always high-contrast and easy to read (no colored-fill text).
    var moral = (c.moral_id || c.moral_en) ?
      '<section class="story-card p-5" style="border-left:6px solid rgb(var(--tertiary))">' +
        '<h3 class="font-headline-lg-mobile text-[18px] font-bold text-tertiary flex items-center gap-2"><span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1;">favorite</span><span>Pesan Moral<span class="bi-en">Moral of the Story</span></span></h3>' +
        '<p class="font-body-md text-[15px] text-on-surface leading-relaxed mt-1">' + tL(c.moral_id, c.moral_en) + "</p></section>" : "";

    var names = {};
    gallery.forEach(function (g) { if (g && g.credit) names[g.credit + (g.license ? " (" + g.license + ")" : "")] = 1; });
    var credit = '<div class="text-[11px] text-on-surface-variant pt-3 border-t border-surface-variant leading-relaxed">' +
      "Sumber · Source: Wikipedia (Bahasa Indonesia) · Foto · Photos: Wikimedia Commons." +
      (Object.keys(names).length ? '<span class="block mt-0.5">Kredit foto: ' + esc(Object.keys(names).slice(0, 10).join(" · ")) + "</span>" : "") + "</div>";

    view.innerHTML =
      '<div class="px-margin-mobile max-w-container-max mx-auto pt-2 pb-16 pop-in space-y-6">' +
        topbarRow +
        '<div class="relative rounded-2xl overflow-hidden shadow-storybook-lg">' +
          '<img src="' + esc(hero) + '" alt="' + tL(c.title_id, c.title_en) + '" class="w-full h-60 object-cover" />' +
          '<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-4 pt-16">' +
            '<h1 class="font-headline-lg text-[26px] font-bold text-white leading-tight" style="text-shadow:0 1px 6px rgba(0,0,0,0.5)">' + tL(c.title_id, c.title_en) + '<span class="block font-display-en text-[15px] font-medium text-white/85 mt-0.5">' + tOther(c.title_id, c.title_en) + "</span></h1>" +
            (c.subtitle_id ? '<p class="text-white/90 text-[13px] mt-1">' + tL(c.subtitle_id, c.subtitle_en) + "</p>" : "") +
          "</div></div>" +
        dataCard +
        (gallery.length ?
          '<section class="space-y-2"><h3 class="font-headline-lg-mobile text-[16px] font-bold text-on-background flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px]">photo_library</span><span>Galeri Foto<span class="bi-en">Photo Gallery</span></span></h3>' +
            '<div class="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-1 -mx-1 px-1">' + strip + "</div>" +
            '<p class="text-[11px] text-on-surface-variant">' + (richLang === "en" ? "Tap a photo to zoom" : "Ketuk foto untuk memperbesar") + "</p></section>" : "") +
        '<div class="space-y-4">' + sections + "</div>" +
        moral +
        (c.facts && c.facts.length ?
          '<section class="space-y-3"><h3 class="font-headline-lg-mobile text-[18px] font-bold text-secondary flex items-center gap-2"><span class="material-symbols-outlined">auto_awesome</span><span>Tahukah Kamu?<span class="bi-en">Did You Know?</span></span></h3>' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">' + facts + "</div></section>" : "") +
        glossary +
        credit +
        relatedHtml(id) +
      "</div>" +
      floatingAi(richLang === "en" ? c.title_en : c.title_id);

    view.querySelectorAll("[data-zoom]").forEach(function (el) {
      el.addEventListener("click", function () { openLightbox(el.getAttribute("data-zoom")); });
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(el.getAttribute("data-zoom")); } });
    });
    view.querySelectorAll("[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () { stopReadAloud(); richLang = btn.getAttribute("data-lang"); viewRichScreen(currentRichId); });
    });
    var ra = document.getElementById("read-aloud");
    if (ra) ra.addEventListener("click", function () { toggleReadAloud(c); });
    updateProfileChip();
    view.scrollTop = 0; window.scrollTo(0, 0);
  }

  function openLightbox(src) {
    var ov = document.createElement("div");
    ov.className = "fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4";
    ov.setAttribute("role", "dialog");
    ov.innerHTML = '<img src="' + esc(src) + '" alt="" class="max-w-full max-h-full rounded-xl shadow-2xl" />' +
      '<button id="lb-close" aria-label="Tutup" class="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 text-on-surface grid place-items-center shadow"><span class="material-symbols-outlined">close</span></button>';
    function close() { ov.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    ov.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(ov);
    var cl = document.getElementById("lb-close"); if (cl) cl.focus();
  }

  /* Offline read-aloud (Web Speech API) — reads the page in the current language. */
  var raSpeaking = false;
  function stopReadAloud() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {} raSpeaking = false; }
  function toggleReadAloud(c) {
    if (!window.speechSynthesis) return;
    if (raSpeaking) { stopReadAloud(); return; }
    var parts = [richLang === "en" ? c.title_en : c.title_id];
    (c.sections || []).forEach(function (s) { parts.push(richLang === "en" ? s.body_en : s.body_id); });
    var u = new SpeechSynthesisUtterance(parts.join(". "));
    u.lang = richLang === "en" ? "en-US" : "id-ID";
    u.rate = 0.95;
    u.onend = function () { raSpeaking = false; };
    raSpeaking = true;
    window.speechSynthesis.speak(u);
  }

  /* Games */
  function viewGames() {
    topbar("Main & Misi", false);
    setActiveNav("games");
    var ids = Object.keys(SCREENS).filter(function (i) { return i.indexOf("misi_") === 0 || i.indexOf("arena_") === 0; });
    view.innerHTML =
      '<div class="px-margin-mobile max-w-container-max mx-auto space-y-5 pt-4">' +
        '<div class="rounded-xl bg-gradient-to-br from-tertiary-container to-tertiary text-on-tertiary p-6 shadow-storybook-lg pop-in"><h2 class="font-headline-lg text-[24px] font-bold leading-tight">Arena Petualangan 🎮<span class="block font-display-en text-[15px] font-medium text-white/80 mt-1">Adventure Arena</span></h2><p class="font-body-md text-white/90 mt-1">Selesaikan misi seru sambil belajar tentang Indonesia!</p></div>' +
        (ids.length ? '<div class="grid grid-cols-2 gap-3">' + ids.map(card).join("") + "</div>" : '<div class="story-card p-8 text-center text-on-surface-variant"><div class="text-[48px]">🎮</div><p class="font-body-md mt-2">Misi baru segera hadir!<span class="block text-[14px] text-fresh-teal">New missions coming soon!</span></p></div>') +
      "</div>";
  }

  /* Badges — computed from real engagement */
  var BADGE_DEFS = [
    { id: "island", name: "Penjelajah Pulau", en: "Island Explorer", icon: "travel_explore", cat: "Budaya Nusantara", need: 3 },
    { id: "culture", name: "Pahlawan Budaya", en: "Culture Hero", icon: "festival", cat: "Budaya Nusantara", need: 5 },
    { id: "animal", name: "Penjaga Satwa", en: "Wildlife Guardian", icon: "pets", cat: "Alam & Hewan Indonesia", need: 6 },
    { id: "history", name: "Detektif Sejarah", en: "History Detective", icon: "history_edu", cat: "Sejarah & Pahlawan", need: 3 },
    { id: "hero", name: "Sahabat Pahlawan", en: "Hero's Friend", icon: "military_tech", cat: "Sejarah & Pahlawan", need: 5 },
    { id: "science", name: "Ilmuwan Cilik", en: "Little Scientist", icon: "science", cat: "Sains Seru", need: 5 },
    { id: "mission", name: "Master Misi", en: "Mission Master", icon: "rocket_launch", cat: "Misi", need: 4 }
  ];
  function catProgress() {
    var visited = store.read("visited", {}), prog = {};
    Object.keys(visited).forEach(function (id) {
      if (SCREENS[id]) {
        var c = SCREENS[id].category;
        prog[c] = (prog[c] || 0) + 1;
        if (id.indexOf("misi_") === 0 || id.indexOf("arena_") === 0) {
          prog["Misi"] = (prog["Misi"] || 0) + 1;
        }
      }
    });
    return prog;
  }
  function viewBadges() {
    topbar("Lencanaku", false);
    setActiveNav("badges");
    var prog = catProgress();
    var earnedCount = BADGE_DEFS.filter(function (b) { return (prog[b.cat] || 0) >= b.need; }).length;
    var grid = BADGE_DEFS.map(function (b) {
      var have = prog[b.cat] || 0, earned = have >= b.need, pct = Math.min(100, Math.round(have / b.need * 100));
      return '<div class="story-card p-4 text-center ' + (earned ? "border-tertiary-container" : "opacity-80") + '">' +
        '<div class="w-16 h-16 mx-auto rounded-full grid place-items-center mb-2 ' + (earned ? "bg-tertiary-container text-on-tertiary-container shadow-[0_0_20px_rgba(225,133,0,0.45)]" : "bg-surface-variant text-outline") + '"><span class="material-symbols-outlined text-[32px]" style="font-variation-settings:\'FILL\' ' + (earned ? 1 : 0) + ';">' + b.icon + "</span></div>" +
        '<p class="font-label-md text-[13px] font-bold text-on-surface leading-tight">' + esc(b.name) + '<span class="bi-en">' + esc(b.en) + "</span></p>" +
        '<div class="mt-2 h-2 bg-surface-variant rounded-full overflow-hidden"><div class="h-full bg-' + (earned ? "tertiary" : "primary") + '" style="width:' + pct + '%"></div></div>' +
        '<p class="text-[11px] text-on-surface-variant mt-1">' + Math.min(have, b.need) + "/" + b.need + (earned ? " ✓" : "") + "</p></div>";
    }).join("");
    view.innerHTML =
      '<div class="px-margin-mobile max-w-container-max mx-auto space-y-5 pt-4">' +
        '<div class="rounded-xl bg-gradient-to-br from-tertiary-container to-tertiary text-on-tertiary p-6 shadow-storybook-lg pop-in text-center"><div class="text-[44px]">🏆</div><h2 class="font-headline-lg text-[24px] font-bold leading-tight">' + earnedCount + " / " + BADGE_DEFS.length + ' Lencana<span class="block font-display-en text-[15px] font-medium text-white/80 mt-1">Badges Earned</span></h2><p class="font-body-md text-white/90 mt-1">Terus belajar untuk membuka semua lencana!</p></div>' +
        '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">' + grid + "</div>" +
        '<p class="text-center text-[13px] text-on-surface-variant">Lencana terbuka otomatis saat kamu menjelajahi topik 🌟<span class="block text-fresh-teal">Badges unlock automatically as you explore</span></p>' +
      "</div>";
  }

  /* AI chat — inline self-contained chat view */
  function viewAI() {
    topbar("Tanya BimoBot", false);
    setActiveNav("ai");

    var hash = location.hash;
    var match = hash.match(/\?topic=(.*)$/);
    var topic = match ? decodeURIComponent(match[1]) : "";

    var userAvatar = "app/assets/img/explorer_mascot.png"; // local — keeps the app offline + CSP self-only

    view.innerHTML =
      // Messages scroll freely; input is fixed above bottom nav
      '<div id="ai-messages" class="px-margin-mobile flex flex-col gap-5 pt-2 pb-[180px] max-w-container-max mx-auto w-full"></div>' +
      // Input bar: fixed, sits 80px above bottom (= above the nav bar)
      '<div id="ai-input-bar" class="fixed bottom-[80px] left-0 right-0 z-40 bg-gradient-to-t from-surface via-surface/95 to-transparent pb-4 pt-6 px-4">' +
        '<div class="max-w-container-max mx-auto flex flex-col gap-2">' +
          '<div id="ai-chips" class="flex gap-2 overflow-x-auto no-scrollbar pb-1"></div>' +
          '<div class="flex items-center gap-2 bg-surface-container-lowest rounded-full p-2 border-2 border-surface-variant shadow-md focus-within:border-primary transition-all">' +
            '<span class="material-symbols-outlined text-outline p-2 text-[22px]" style="font-variation-settings:\'FILL\' 1;">smart_toy</span>' +
            '<input id="ai-input" type="text" placeholder="Tanya BimoBot... / Ask BimoBot..." aria-label="Tanya BimoBot / Ask BimoBot" class="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-on-surface placeholder:text-on-surface-variant py-2 px-1 outline-none" />' +
            '<button id="ai-send" class="bg-secondary-container text-on-secondary-container p-3 rounded-full hover:bg-secondary hover:text-on-secondary transition-colors shrink-0 flex items-center justify-center">' +
              '<span class="material-symbols-outlined text-[20px]" style="font-variation-settings:\'FILL\' 1;">send</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    // --- Chat engine ---
    var msgs = document.getElementById("ai-messages");
    var input = document.getElementById("ai-input");
    var send = document.getElementById("ai-send");
    var chipsEl = document.getElementById("ai-chips");

    function botBubble(text) {
      var d = document.createElement("div");
      d.className = "flex items-end gap-3 self-start max-w-[85%] pop-in";
      d.innerHTML =
        '<div class="w-8 h-8 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center mb-1">' +
          '<span class="material-symbols-outlined text-on-primary-container text-[16px]" style="font-variation-settings:\'FILL\' 1;">smart_toy</span>' +
        '</div>' +
        '<div class="bg-surface-container-high text-on-surface rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">' +
          '<p class="font-body-md text-[15px] leading-relaxed">' + esc(text) + '</p>' +
        '</div>';
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function userBubble(text) {
      var d = document.createElement("div");
      d.className = "flex items-end gap-3 self-end max-w-[85%] pop-in";
      d.innerHTML =
        '<div class="bg-primary text-on-primary rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">' +
          '<p class="font-body-md text-[15px] leading-relaxed">' + esc(text) + '</p>' +
        '</div>' +
        '<div class="w-8 h-8 rounded-full bg-secondary-container flex-shrink-0 flex items-center justify-center mb-1 overflow-hidden">' +
          '<img src="' + userAvatar + '" alt="Kamu" class="w-full h-full object-cover" />' +
        '</div>';
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    var typingEl = null;
    function showTyping() {
      typingEl = document.createElement("div");
      typingEl.className = "flex items-end gap-3 self-start max-w-[85%]";
      typingEl.innerHTML =
        '<div class="w-8 h-8 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center mb-1">' +
          '<span class="material-symbols-outlined text-on-primary-container text-[16px]" style="font-variation-settings:\'FILL\' 1;">smart_toy</span>' +
        '</div>' +
        '<div class="bg-surface-container-high rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">' +
          '<div class="flex items-center gap-1.5">' +
            '<div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay:0s"></div>' +
            '<div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay:0.15s"></div>' +
            '<div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay:0.3s"></div>' +
          '</div>' +
        '</div>';
      msgs.appendChild(typingEl);
      msgs.scrollTop = msgs.scrollHeight;
    }
    function hideTyping() { if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl); typingEl = null; }

    var QA = {
      "komodo": "Komodo adalah kadal terbesar di dunia! Lidah mereka bercabang dua untuk mendeteksi bau mangsa hingga jarak 9 km! 🦎",
      "bekantan": "Hidung besar Bekantan jantan gunanya untuk menarik perhatian betina dan mengeluarkan suara keras memperingatkan dari bahaya!",
      "badak": "Badak Jawa hanya tersisa sedikit dan tinggal di Taman Nasional Ujung Kulon. Mereka punya cula satu yang sangat langka! 🦏",
      "orangutan": "Orangutan sangat cerdas! Makanan kesukaan mereka adalah durian, rambutan, dan mangga. Mereka membuat sarang baru dari daun setiap malam! 🦧",
      "harimau": "Harimau Sumatra adalah harimau terkecil di dunia dan hanya ada di Sumatra. Mereka pandai berenang! 🐯",
      "gajah": "Gajah Sumatra menggunakan belalainya untuk menghirup air, makan, dan bahkan bersalaman! 🐘",
      "cendrawasih": "Burung Cendrawasih dari Papua adalah burung tercantik di dunia dengan bulu-bulu yang menakjubkan! 🦜",
      "rafflesia": "Rafflesia Arnoldii adalah bunga terbesar di dunia yang hanya mekar 5-7 hari saja. Baunya seperti daging busuk untuk menarik serangga penyerbuk! 🌺",
      "borobudur": "Candi Borobudur adalah candi Buddha terbesar di dunia dengan 504 patung Buddha dan relief indah! 🛕",
      "prambanan": "Candi Prambanan adalah candi Hindu terindah di Indonesia, dibangun pada abad ke-9! 🏛️",
      "wayang": "Wayang Kulit adalah kesenian tradisional Jawa dimainkan oleh seorang Dalang di balik layar putih! 🎭",
      "batik": "Batik adalah warisan budaya Indonesia yang diakui UNESCO. Setiap motif batik memiliki filosofi dan makna tersendiri! 👘",
      "rendang": "Rendang dari Sumatra Barat adalah salah satu makanan terlezat di dunia! Dimasak sangat lama dengan santan dan rempah khas Indonesia. 🍖",
      "sate": "Sate adalah potongan daging ditusuk bambu dan dibakar arang, biasanya disajikan dengan bumbu kacang! 🍢",
      "rupiah": "Rupiah adalah mata uang resmi Indonesia. Pecahan kertas terbesar adalah Rp100.000! 💴",
      "pancasila": "Pancasila adalah dasar negara Indonesia dengan 5 sila yang mengatur kebersamaan dan persatuan kita! 🦅",
      "proklamasi": "Proklamasi kemerdekaan Indonesia dibacakan oleh Ir. Soekarno pada 17 Agustus 1945! 🇮🇩",
      "gunung": "Indonesia berada di Cincin Api Pasifik sehingga memiliki banyak gunung berapi aktif. Gunung Merapi adalah yang paling aktif! 🌋",
      "danau toba": "Danau Toba di Sumatra Utara adalah danau vulkanik terbesar di dunia! Di tengahnya ada Pulau Samosir! 🏔️",
      "hujan": "Air hujan terbentuk dari air laut yang menguap karena panas matahari menjadi awan, lalu turun sebagai hujan! 🌧️"
    };

    function getReply(msg) {
      var m = msg.toLowerCase();
      for (var k in QA) { if (m.indexOf(k) > -1) return QA[k]; }
      return "Pertanyaan yang hebat! 🤔 Coba tanyakan tentang hewan langka Indonesia, budaya Nusantara, atau penemuan sains yang seru! 😊";
    }

    function handleSend(text) {
      if (!text.trim()) return;
      userBubble(text);
      input.value = "";
      showTyping();
      setTimeout(function () { hideTyping(); botBubble(getReply(text)); }, 1200);
    }

    function setChips(list) {
      chipsEl.innerHTML = "";
      list.forEach(function (q) {
        var btn = document.createElement("button");
        btn.className = "whitespace-nowrap shrink-0 bg-surface-container text-on-surface font-label-md text-[13px] font-bold px-4 py-2 rounded-full border-2 border-surface-variant hover:bg-surface-variant transition-colors shadow-sm";
        btn.textContent = q;
        btn.onclick = function () { handleSend(q); };
        chipsEl.appendChild(btn);
      });
    }

    send.onclick = function () { handleSend(input.value); };
    input.onkeydown = function (e) { if (e.key === "Enter") handleSend(input.value); };

    // Init greeting and chips
    if (topic) {
      botBubble("Halo Penjelajah! 👋 Aku lihat kamu sedang membaca tentang " + topic + ". Ada yang ingin kamu tanyakan? 🤖");
      var nt = topic.toLowerCase();
      if (nt.indexOf("komodo") > -1) {
        setChips(["Kenapa Komodo lidahnya bercabang?", "Di mana Komodo tinggal?", "Apa makanan Komodo?"]);
      } else if (nt.indexOf("borobudur") > -1) {
        setChips(["Siapa yang membangun Borobudur?", "Berapa jumlah stupa Borobudur?", "Di mana letak Borobudur?"]);
      } else if (nt.indexOf("rendang") > -1) {
        setChips(["Terbuat dari apa Rendang?", "Kenapa Rendang dimasak sangat lama?", "Dari mana asal Rendang?"]);
      } else {
        setChips(["Cerita seru tentang " + topic + "!", "Kenapa " + topic + " unik?", "Fakta menarik tentang " + topic]);
      }
    } else {
      botBubble("Halo Penjelajah! Aku BimoBot 🤖 Tanya apa saja tentang Indonesia — hewan, budaya, sains, atau sejarah!");
      setChips([
        "Kenapa Komodo lidahnya bercabang?",
        "Apa makanan favorit Orangutan?",
        "Cerita tentang Candi Borobudur!",
        "Kenapa Rafflesia berbau busuk?"
      ]);
    }
  }

  /* Interactive Map — simplified region selector linking to real content */
  var REGIONS = [
    { name: "Sumatra", en: "Sumatra", emoji: "🐯", keys: ["sumatra", "gadang", "harimau", "gajah", "rafflesia", "kantong_semar"] },
    { name: "Jawa", en: "Java", emoji: "🛕", keys: ["jawa", "borobudur", "prambanan", "wayang", "badak", "kartini", "diponegoro", "sudirman", "proklamasi", "sumpah", "kecak"] },
    { name: "Kalimantan", en: "Borneo", emoji: "🦧", keys: ["kalimantan", "orangutan", "bekantan"] },
    { name: "Sulawesi", en: "Sulawesi", emoji: "🦌", keys: ["sulawesi", "anoa", "tarsius", "maleo"] },
    { name: "Bali & Nusa Tenggara", en: "Bali & Lesser Sundas", emoji: "🦎", keys: ["bali", "komodo", "jalak", "pendet", "dewata"] },
    { name: "Maluku", en: "The Moluccas", emoji: "🌶️", keys: ["maluku", "pattimura", "rempah"] },
    { name: "Papua", en: "Papua", emoji: "🦜", keys: ["papua", "cendrawasih", "cenderawasih", "jayawijaya"] }
  ];
  function regionScreens(r) {
    return Object.keys(SCREENS).filter(function (id) {
      return r.keys.some(function (k) { return id.indexOf(k) > -1; });
    });
  }
  function viewMap(regionName) {
    topbar(regionName || "Peta Nusantara", true);
    setActiveNav("explore");
    if (regionName) {
      var r = REGIONS.filter(function (x) { return x.name === regionName; })[0];
      var ids = r ? regionScreens(r) : [];
      view.innerHTML = '<div class="px-margin-mobile max-w-container-max mx-auto space-y-5 pt-4">' +
        '<div class="rounded-xl bg-secondary-container text-on-secondary-container p-6 shadow-storybook-lg pop-in"><div class="text-[44px]">' + (r ? r.emoji : "🗺️") + '</div>' +
          biHead("h2", "font-headline-lg text-[24px] font-bold leading-tight", regionName, r ? r.en : "") + '<p class="font-body-md mt-1">' + ids.length + " topik · topics dari daerah ini.</p></div>" +
        (ids.length ? '<div class="grid grid-cols-2 gap-3">' + ids.map(card).join("") + "</div>" : '<div class="story-card p-8 text-center text-on-surface-variant"><p class="font-body-md">Belum ada topik untuk daerah ini.<span class="block text-fresh-teal text-[14px]">No topics for this region yet.</span></p></div>') +
        "</div>";
      return;
    }
    var tiles = REGIONS.map(function (r) {
      var n = regionScreens(r).length;
      return '<a href="#/map/' + encodeURIComponent(r.name) + '" class="relative overflow-hidden story-card p-5 flex flex-col items-center text-center gap-2 hover:-translate-y-1 transition-transform pop-in">' +
        '<span class="text-[44px]">' + r.emoji + "</span>" +
        '<span class="font-headline-lg-mobile text-[15px] font-bold text-on-surface leading-tight">' + esc(r.name) + '<span class="bi-en">' + esc(r.en) + "</span></span>" +
        '<span class="text-[12px] font-label-md text-primary font-bold">' + n + " topik</span></a>";
    }).join("");
    view.innerHTML = '<div class="px-margin-mobile max-w-container-max mx-auto space-y-5 pt-4">' +
      '<div class="rounded-xl bg-gradient-to-br from-secondary to-secondary-container text-white p-6 shadow-storybook-lg pop-in"><h2 class="font-headline-lg text-[24px] font-bold leading-tight">Peta Jelajah Nusantara 🗺️<span class="block font-display-en text-[15px] font-medium text-white/80 mt-1">Explore the Archipelago Map</span></h2><p class="font-body-md text-white/90 mt-1">Pilih pulau untuk menemukan satwa, budaya, dan ceritanya.</p></div>' +
      '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">' + tiles + "</div>" +
      "</div>";
  }

  /* Parent gate — simple math challenge (child-safety pattern) */
  function viewParentGate() {
    topbar("Mode Orang Tua", true);
    setActiveNav("none");
    var a = 3 + new Date().getSeconds() % 6, b = 2 + new Date().getMilliseconds() % 5, ans = a + b;
    view.innerHTML =
      '<div class="px-margin-mobile max-w-md mx-auto pt-10 text-center space-y-6 pop-in">' +
        '<div class="w-20 h-20 mx-auto rounded-full bg-primary-container grid place-items-center text-on-primary-container shadow-storybook-sm"><span class="material-symbols-outlined text-[40px]">lock</span></div>' +
        "<div>" + biHead("h2", "font-headline-lg text-[24px] font-bold text-primary", "Khusus Orang Tua", "Parents Only") + '<p class="font-body-md text-on-surface-variant">Untuk masuk, jawab soal ini dulu ya. <span class="text-fresh-teal">/ Solve this to continue.</span></p></div>' +
        '<div class="story-card p-6 space-y-4">' +
          '<p class="font-headline-lg text-[28px] font-bold text-on-surface">' + a + " + " + b + " = ?</p>" +
          '<input id="gate-ans" type="number" inputmode="numeric" aria-label="Jawaban / Answer" class="w-full text-center text-[24px] font-bold bg-surface-container-low border-2 border-secondary/40 rounded-xl py-3 outline-none focus:border-secondary" />' +
          '<button id="gate-go" class="squishy-button w-full bg-primary text-on-primary border-on-primary-container py-3 rounded-full font-label-md font-bold">Masuk · Enter</button>' +
          '<p id="gate-err" class="hidden text-error font-label-md">Jawaban belum tepat, coba lagi. / Not quite, try again.</p>' +
        "</div></div>";
    document.getElementById("gate-go").addEventListener("click", function () {
      if (parseInt(document.getElementById("gate-ans").value, 10) === ans) { location.hash = "#/parent/dashboard"; }
      else { document.getElementById("gate-err").classList.remove("hidden"); }
    });
    document.getElementById("gate-ans").addEventListener("keydown", function (e) { if (e.key === "Enter") document.getElementById("gate-go").click(); });
  }

  /* Parent dashboard — real stats from engagement */
  function viewParentDash() {
    topbar("Dashboard Orang Tua", true);
    setActiveNav("none");
    var prog = catProgress(), visited = store.read("visited", {});
    var total = Object.keys(visited).reduce(function (n, k) { return n + (SCREENS[k] ? 1 : 0); }, 0);
    var totalViews = Object.values(visited).reduce(function (n, v) { return n + v; }, 0);
    var streak = store.read("streak", { days: 0 });
    var cats = Object.keys(CATS).filter(function (c) { return prog[c]; });
    var max = Math.max.apply(null, cats.map(function (c) { return prog[c]; }).concat([1]));
    var bars = cats.sort(function (a, b) { return prog[b] - prog[a]; }).map(function (c) {
      return '<div class="space-y-1"><div class="flex justify-between font-label-md text-[14px] gap-2"><span class="text-on-surface font-bold">' + esc(c) + ' <span class="text-fresh-teal font-medium">· ' + esc(catEn(c)) + '</span></span><span class="text-on-surface-variant shrink-0">' + prog[c] + "</span></div>" +
        '<div class="h-3 bg-surface-variant rounded-full overflow-hidden"><div class="h-full bg-primary rounded-full" style="width:' + Math.round(prog[c] / max * 100) + '%"></div></div></div>';
    }).join("") || '<p class="text-on-surface-variant text-center py-6">Belum ada aktivitas. Ajak anak mulai menjelajah!<span class="block text-fresh-teal text-[14px]">No activity yet. Invite your child to start exploring!</span></p>';
    var topCat = cats.sort(function (a, b) { return prog[b] - prog[a]; })[0];
    var recIds = Object.keys(SCREENS).filter(function (i) { return !visited[i] && (!topCat || SCREENS[i].category === topCat); }).slice(0, 4);
    var name = store.profile().name;
    view.innerHTML =
      '<div class="px-margin-mobile max-w-container-max mx-auto space-y-6 pt-4">' +
        '<div class="flex items-center gap-4 story-card p-4 pop-in">' +
          '<div class="w-14 h-14 rounded-full bg-primary-container grid place-items-center text-on-primary-container"><span class="material-symbols-outlined text-[30px]">child_care</span></div>' +
          "<div>" + biHead("p", "font-headline-lg-mobile text-[18px] font-bold text-on-surface", name, "Your Explorer") + '<p class="font-body-md text-on-surface-variant text-[15px]">Pantau perkembangan belajar di sini. <span class="text-fresh-teal">/ Track learning progress here.</span></p></div></div>' +
        '<div class="grid grid-cols-3 gap-3">' +
          stat(total, "Topik dibuka", "Topics opened", "menu_book", "primary") +
          stat(totalViews, "Total kunjungan", "Total visits", "visibility", "secondary") +
          stat(streak.days, "Hari beruntun", "Day streak", "local_fire_department", "tertiary") +
        "</div>" +
        section("Minat per Kategori", "Interest by Category", "insights", '<div class="story-card p-5 space-y-4">' + bars + "</div>") +
        (recIds.length ? section("Rekomendasi Berikutnya", "What's Next", "recommend", '<div class="grid grid-cols-2 gap-3">' + recIds.map(card).join("") + "</div>") : "") +
        '<div class="bg-surface-container rounded-xl p-5"><h3 class="font-headline-lg-mobile text-[16px] font-bold text-primary flex items-center gap-2"><span class="material-symbols-outlined">shield</span><span>Privasi & Keamanan<span class="bi-en">Privacy & Safety</span></span></h3><ul class="mt-2 space-y-1 font-body-md text-[15px] text-on-surface-variant list-disc pl-5"><li>Semua data belajar tersimpan di perangkat ini saja. <span class="text-fresh-teal">All learning data stays on this device only.</span></li><li>Tidak ada iklan atau obrolan antar anak. <span class="text-fresh-teal">No ads or child-to-child chat.</span></li><li>Konten aman dan sesuai usia. <span class="text-fresh-teal">Safe, age-appropriate content.</span></li></ul>' +
          '<button id="reset-data" class="squishy-button mt-4 bg-error-container text-on-error-container border-error/30 px-4 py-2 rounded-full font-label-md text-[14px] font-bold">Reset Data Belajar · Reset Data</button></div>' +
      "</div>";
    document.getElementById("reset-data").addEventListener("click", function () {
      if (confirm("Hapus semua data belajar di perangkat ini? / Erase all learning data on this device?")) { ["visited", "streak"].forEach(function (k) { localStorage.removeItem("pedia." + k); }); viewParentDash(); }
    });
  }
  function stat(n, label, enLabel, icon, color) {
    return '<div class="story-card p-3 text-center"><div class="w-10 h-10 mx-auto rounded-full bg-' + color + "-container grid place-items-center text-on-" + color + '-container mb-1"><span class="material-symbols-outlined text-[20px]">' + icon + '</span></div><p class="font-headline-lg text-[22px] font-bold text-on-surface leading-none">' + n + '</p><p class="text-[11px] font-label-md text-on-surface-variant mt-1 leading-tight">' + esc(label) + '<span class="block text-fresh-teal text-[10px]">' + esc(enLabel) + "</span></p></div>";
  }

  /* Settings / accessibility */
  function viewSettings() {
    topbar("Pengaturan", true);
    setActiveNav("none");
    var p = store.prefs();
    var name = store.profile().name;
    view.innerHTML =
      '<div class="px-margin-mobile max-w-md mx-auto space-y-4 pt-4">' +
        biHead("h2", "font-headline-lg text-[24px] font-bold text-primary pop-in", "Profil Penjelajah", "Explorer Profile") +
        '<div class="story-card p-4 space-y-2">' +
          '<label for="explorer-name" class="font-label-md font-bold text-on-surface flex items-center gap-2"><span class="material-symbols-outlined text-primary">badge</span><span>Nama Penjelajah<span class="bi-en">Explorer Name</span></span></label>' +
          '<input id="explorer-name" type="text" maxlength="20" value="' + esc(name) + '" placeholder="Tulis namamu / Type your name" class="w-full bg-surface-container-low border-2 border-secondary/40 rounded-xl px-4 py-2.5 font-body-md text-[16px] text-on-surface focus:border-secondary outline-none" />' +
        "</div>" +
        biHead("h2", "font-headline-lg text-[24px] font-bold text-primary pt-2", "Aksesibilitas", "Accessibility") +
        toggle("dark", "Mode Gelap", "Dark Mode", "dark_mode", p.dark) +
        toggle("dyslexia", "Font Ramah Disleksia", "Dyslexia-friendly Font", "text_fields", p.dyslexia) +
        toggle("large", "Teks Lebih Besar", "Larger Text", "format_size", p.large) +
        '<div class="bg-surface-container rounded-xl p-5 mt-4"><h3 class="font-label-md font-bold text-on-surface flex items-center gap-2"><span class="material-symbols-outlined">family_restroom</span><span>Mode Orang Tua<span class="bi-en">Parent Mode</span></span></h3><a href="#/parent" class="squishy-button inline-flex items-center gap-1 mt-3 bg-primary text-on-primary border-on-primary-container px-5 py-2 rounded-full font-label-md font-bold">Buka Dashboard · Open <span class="material-symbols-outlined text-[18px]">arrow_forward</span></a></div>' +
        '<p class="text-center text-[13px] text-on-surface-variant pt-4">Pedia Bloom — Jelajah Nusantara untuk anak Indonesia 🇮🇩<span class="block text-fresh-teal">Indonesia\'s bilingual encyclopedia for kids</span></p>' +
      "</div>";
    document.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.dataset.toggle, prefs = store.prefs();
        prefs[key] = !prefs[key]; store.write("prefs", prefs); applyPrefs(); viewSettings();
      });
    });
    var nameInput = document.getElementById("explorer-name");
    nameInput.addEventListener("change", function () {
      var v = nameInput.value.trim() || "Penjelajah";
      store.write("profile", { name: v }); updateProfileChip();
    });
  }
  function toggle(key, label, enLabel, icon, on) {
    return '<button data-toggle="' + key + '" class="w-full flex items-center gap-3 story-card p-4 text-left">' +
      '<span class="material-symbols-outlined text-primary">' + icon + "</span>" +
      '<span class="flex-1 font-label-md font-bold text-on-surface">' + esc(label) + '<span class="bi-en">' + esc(enLabel) + "</span></span>" +
      '<span class="w-12 h-7 rounded-full ' + (on ? "bg-primary" : "bg-surface-variant") + ' relative transition-colors shrink-0"><span class="absolute top-1 ' + (on ? "right-1" : "left-1") + ' w-5 h-5 bg-white rounded-full shadow transition-all"></span></span></button>';
  }

  function notFound() {
    return '<div class="px-margin-mobile pt-16 text-center space-y-4"><div class="text-[64px]">🧭</div>' +
      biHead("h2", "font-headline-lg text-[24px] font-bold text-primary", "Halaman tidak ditemukan", "Page not found") +
      '<a href="#/home" class="squishy-button inline-block bg-primary text-on-primary border-on-primary-container px-6 py-2 rounded-full font-label-md font-bold">Kembali ke Beranda · Home</a></div>';
  }

  /* Sync the top-bar profile chip (name, level, achievement badge) with real data. */
  function updateProfileChip() {
    var s = computeStats(), name = store.profile().name;
    var nm = document.getElementById("chip-name"); if (nm) nm.textContent = name;
    var lv = document.getElementById("chip-level"); if (lv) lv.textContent = "Lvl " + s.level;
    var nb = document.getElementById("notif-badge");
    if (nb) {
      if (s.badges > 0) { nb.textContent = s.badges; nb.classList.remove("hidden"); }
      else { nb.classList.add("hidden"); }
    }
  }

  /* ---------------------------------------------------------------- prefs */
  function applyPrefs() {
    var p = store.prefs(), html = document.documentElement;
    html.classList.toggle("dark", !!p.dark);
    html.classList.toggle("dyslexia", !!p.dyslexia);
    html.classList.toggle("large-text", !!p.large);
  }

  /* --------------------------------------------------------------- router */
  function router() {
    var hash = location.hash.replace(/^#\/?/, "");
    var route = hash.split("?")[0];
    var parts = route.split("/").filter(Boolean).map(decodeURIComponent);
    var base = parts[0] || "home";
    document.documentElement.classList.toggle("home-storybook", base === "home");
    window.scrollTo(0, 0);
    stopReadAloud();
    updateProfileChip();
    // Error boundary: a broken screen shows a friendly message, never a blank page.
    try {
      switch (base) {
        case "": case "home": return viewHome();
        case "explore": return viewExplore();
        case "library": return viewLibrary(null);
        case "category": return viewLibrary(parts[1]);
        case "screen": return viewScreen(parts[1]);
        case "games": return viewGames();
        case "badges": return viewBadges();
        case "ai": return viewAI();
        case "map": return viewMap(parts[1]);
        case "parent": return parts[1] === "dashboard" ? viewParentDash() : viewParentGate();
        case "settings": return viewSettings();
        default: return (view.innerHTML = notFound());
      }
    } catch (err) {
      console.error("Router error on #/" + hash, err);
      view.innerHTML = errorScreen();
    }
  }
  function errorScreen() {
    return '<div class="px-margin-mobile pt-16 text-center space-y-4">' +
      '<div class="text-[64px]">🐛</div>' +
      biHead("h2", "font-headline-lg text-[24px] font-bold text-primary", "Ups, ada yang tersangkut!", "Oops, something got stuck!") +
      '<p class="font-body-md text-on-surface-variant">Coba kembali ke beranda, ya. <span class="text-fresh-teal">Let\'s head back home.</span></p>' +
      '<a href="#/home" class="squishy-button inline-block bg-primary text-on-primary border-on-primary-container px-6 py-2 rounded-full font-label-md font-bold">Kembali ke Beranda · Home</a></div>';
  }

  /* ----------------------------------------------------------------- init */
  function init() {
    // inject every screen's custom CSS + accessibility styles, once.
    var st = document.createElement("style");
    st.id = "pedia-runtime-styles";
    st.textContent = (window.PEDIA_STYLES || "") +
      "\nhtml.dyslexia, html.dyslexia body { font-family: 'Comic Sans MS','Trebuchet MS',Verdana,sans-serif !important; letter-spacing:0.03em; }" +
      "\nhtml.large-text { font-size: 118%; }";
    document.head.appendChild(st);
    applyPrefs();
    updateProfileChip();

    document.getElementById("back-btn").addEventListener("click", function () {
      if (history.length > 1) history.back(); else location.hash = "#/home";
    });
    document.getElementById("settings-btn").addEventListener("click", function () { location.hash = "#/settings"; });

    window.addEventListener("hashchange", router);
    if (!location.hash) location.replace("#/home");
    router();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
