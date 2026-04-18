// ===============================================
// 🎨 UI YARDIMCILARI (MODAL, TOAST)
// ===============================================

function showModal(content, onConfirm) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-content">
            ${content}
            <div style="display:flex; gap:10px; margin-top:24px;">
                <button class="btn-secondary" onclick="closeModal()" style="flex:1; background:#334155; border:none; padding:14px; border-radius:40px; color:white; font-weight:600;">İptal</button>
                <button class="btn-primary" id="modal-confirm" style="flex:1;">Onayla</button>
            </div>
        </div>
    `;
    modalContainer.style.display = 'flex';
    document.getElementById('modal-confirm').onclick = () => {
        if (onConfirm) onConfirm();
        closeModal();
    };
}

function closeModal() {
    document.getElementById('modal-container').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '40px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
// ========== PREMIUM GLOBAL LOADING ==========
function createLoadingOverlay() {
    // Eğer zaten overlay varsa tekrar oluşturma
    if (document.getElementById('global-loading-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'global-loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-double-ring"></div>
        <div class="loading-text">Yükleniyor...</div>
    `;
    document.body.appendChild(overlay);
}

function showGlobalLoading() {
    createLoadingOverlay();
    document.getElementById('global-loading-overlay').style.display = 'flex';
}

function hideGlobalLoading() {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// İsteğe bağlı: Promise ile otomatik loading wrapper
async function withLoading(promise, options = {}) {
    showGlobalLoading();
    try {
        return await promise;
    } finally {
        hideGlobalLoading();
    }
}