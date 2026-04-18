// ===============================================
// 🧭 ROUTER (SAYFA GEÇİŞLERİ)
// ===============================================

let currentView = 'home';

function initRouter() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            navigateTo(item.dataset.view);
        });
    });
    navigateTo('home');
}

function navigateTo(viewId) {
    console.log('➡️ navigateTo:', viewId);
    
    // View'leri değiştir
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add('active-view');
    
    // Alt menü aktifliği
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewId);
    });
    
    // Başlık
    // titles objesine ekle
    const titles = { 
        home: 'Ana Sayfa', 
        courses: 'Derslerim', 
        arena: 'Sınav Arena', 
        clinic: 'Klinik',
        panel: 'Yönetim Paneli' 
    };
    document.getElementById('page-title').innerText = titles[viewId] || viewId;
    
    currentView = viewId;
    
    // Sayfa render'ları
    if (viewId === 'home') renderHome();
    else if (viewId === 'courses') renderCourses();
    else if (viewId === 'arena') renderArena();
    else if (viewId === 'clinic') renderClinic();
    else if (viewId === 'panel') renderPanel();
}

function renderHome() {
    const container = document.getElementById('view-home');
    if (!container) return;
    container.innerHTML = `
        <div style="margin-bottom: 30px;">
            <h2 style="font-weight: 600; margin-bottom: 8px;">Hoş geldin, <span style="color: var(--primary);">Patron</span></h2>
            <p style="color: var(--text-secondary);">Veterinerlik asistanın hazır.</p>
        </div>
        <div class="grid-2">
            <div class="menu-btn" onclick="navigateTo('courses')"><i class="fas fa-book-open"></i><span>Ders Notları</span></div>
            <div class="menu-btn" onclick="navigateTo('arena')"><i class="fas fa-brain"></i><span>Soru Arena</span></div>
            <div class="menu-btn" onclick="navigateTo('clinic')"><i class="fas fa-syringe"></i><span>Klinik Araçlar</span></div>
            <div class="menu-btn" onclick="alert('Profil ayarları yakında')"><i class="fas fa-user-circle"></i><span>Profil</span></div>
        </div>
        <div class="premium-card" style="margin-top: 30px;">
            <h3><i class="fas fa-chart-line"></i> Hızlı İstatistikler</h3>
            <p>Bu hafta 12 ders notu, 45 soru çözdün.</p>
        </div>
    `;
}

// Başlangıçta initRouter'ı çağır
window.initRouter = initRouter;
