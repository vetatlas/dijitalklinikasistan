// Merkezi config dosyamızdan Firebase Auth servisini çağırıyoruz
import { auth } from "./firebase-config.js";

// Sadece Giriş Yapma fonksiyonunu (signInWithEmailAndPassword) içe aktarıyoruz
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// HTML içindeki elementleri seçiyoruz
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorMessageDiv = document.getElementById("errorMessage");

// Form gönderildiğinde (Giriş Yap butonuna basıldığında) çalışacak olay
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Formun sayfayı yenilemesini engeller (Modern SPA mantığı)

    // İnputlardaki değerleri alıyoruz
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Kullanıcıya bir işlem yapıldığını hissettirmek için butonu kilitliyoruz
    loginBtn.innerText = "Sisteme Giriliyor...";
    loginBtn.disabled = true;
    errorMessageDiv.style.display = "none"; // Varsa eski hatayı gizle

    try {
        // Firebase ile şifre ve e-posta kontrolü yapıyoruz
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Eğer kod buraya ulaştıysa giriş BAŞARILI demektir.
        console.log("Giriş başarılı:", userCredential.user.email);
        
        // Kullanıcıyı doğrudan ana menüye (dashboard) yönlendiriyoruz
        window.location.href = "dashboard.html";

    } catch (error) {
        // Eğer kod buraya düştüyse giriş BAŞARISIZ demektir. (Yanlış şifre vb.)
        console.error("Giriş hatası:", error.code, error.message);
        
        // Hata mesajını gösterip butonu eski haline getiriyoruz
        errorMessageDiv.style.display = "block";
        loginBtn.innerText = "Giriş Yap";
        loginBtn.disabled = false;
    }
});