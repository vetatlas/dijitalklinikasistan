// ===============================================
// 🔐 PREMIUM AUTH
// ===============================================

// auth'un tanımlanmasını bekle
function waitForAuth(cb) {
    if (window.auth) cb();
    else setTimeout(() => waitForAuth(cb), 50);
}

waitForAuth(() => {
    window.auth.onAuthStateChanged(user => {
        if (user) {
            window.currentUser = user;
            document.getElementById('app').style.display = 'flex';
            if (typeof initRouter === 'function') initRouter();
        } else {
            showLoginModal();
        }
    });
});

function showLoginModal() {
    const email = prompt("E-posta adresiniz:");
    if (!email) return;
    const pass = prompt("Şifreniz:");
    if (!pass) return;
    
    window.auth.signInWithEmailAndPassword(email, pass)
        .catch(e => alert("❌ Giriş başarısız: " + e.message));
}