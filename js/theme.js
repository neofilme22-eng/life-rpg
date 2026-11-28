// ============================================================
// ===== TEMAS VISUALES (Configuración → Tema visual) =====
// ============================================================
// Cada tema redefine las variables de css/variables.css mediante
// <html data-theme="...">. "noir" es el tema original (sin atributo).

var THEMES = {
    noir: {
        label: 'Noir — Bahía Ceniza',
        desc: 'Detective melancólico: tinta, latón y niebla marina.',
        color: '#0b100f',
        icons: { favicon: 'assets/icons/icon-192.png', apple: 'assets/icons/apple-touch-icon.png', manifest: 'manifest.json' },
        swatches: ['var(--brass)', '#be524a', 'var(--verdigris)', 'var(--dusk)', '#e3dcc8']
    },
    vice: {
        label: 'Vice City — Neón (GTA VI)',
        desc: 'Atardecer en Ocean Drive: rosa sunset, cian vice, púrpura neón y durazno Miami.',
        color: '#0B0F2B',
        icons: { favicon: 'assets/icons/vice-192.png', apple: 'assets/icons/vice-apple-touch-icon.png', manifest: 'manifest-vice.json' },
        swatches: ['#FF5CA8', '#00F0FF', '#BC6CFF', '#FFB86B', '#0B0F2B'],
        fonts: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Rajdhani:wght@500;600;700&family=Righteous&family=Yellowtail&display=swap'
    }
};

function applyTheme(name, persist) {
    if (!THEMES[name]) name = 'noir';
    var t = THEMES[name];
    var root = document.documentElement;
    if (name === 'noir') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', name);

    // Las tipografías del tema se cargan solo cuando se usa
    if (t.fonts && !document.getElementById('theme-fonts-' + name)) {
        var link = document.createElement('link');
        link.id = 'theme-fonts-' + name;
        link.rel = 'stylesheet';
        link.href = t.fonts;
        document.head.appendChild(link);
    }

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.color);

    // Icono de la app: favicon, icono de iOS y manifest (icono al instalar la PWA)
    if (t.icons) {
        var setHref = function (id, href) { var el = document.getElementById(id); if (el && el.getAttribute('href') !== href) el.setAttribute('href', href); };
        setHref('app-favicon', t.icons.favicon);
        setHref('app-apple-icon', t.icons.apple);
        setHref('app-manifest', t.icons.manifest);
    }

    if (persist !== false) {
        try { localStorage.setItem('life_rpg_theme', name); } catch (e) { }
    }
    renderThemePreview(name);

}

function renderThemePreview(name) {
    var t = THEMES[name] || THEMES.noir;
    var sw = document.getElementById('theme-swatches');
    var desc = document.getElementById('theme-desc');
    var sel = document.getElementById('config-theme');
    if (sel) sel.value = name;
    if (desc) desc.textContent = t.desc;
    if (sw) sw.innerHTML = t.swatches.map(function (c) {
        return '<i style="background:' + c + '; --sw:' + c + '55"></i>';
    }).join('');
}

function loadTheme() {
    var saved = null;
    try { saved = localStorage.getItem('life_rpg_theme'); } catch (e) { }
    applyTheme(saved || 'noir', false);
}

document.addEventListener('DOMContentLoaded', loadTheme);
