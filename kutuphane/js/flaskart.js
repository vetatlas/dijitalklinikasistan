import { db } from "../../js/firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Linkteki konuId'yi alıyoruz
const urlParams = new URLSearchParams(window.location.search);
const konuId = urlParams.get('konuId');

const flashcard = document.getElementById("flashcard");
const cardFront = document.getElementById("cardFront");
const cardBack = document.getElementById("cardBack");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const cardCounter = document.getElementById("cardCounter");
const flashcardContainer = document.getElementById("flashcardContainer");
const emptyState = document.getElementById("emptyState");

let kartlar = [];
let mevcutKartIndex = 0;

// Kart Dönme Efekti
if (flashcard) {
    flashcard.addEventListener("click", () => {
        flashcard.classList.toggle("is-flipped");
    });
}

// Firebase'den Veri Çekme Motoru
async function kartlariYukle() {
    if (!konuId) {
        emptyState.innerHTML = "<h3 style='color:#EF4444;'>Hocam Konu Seçilmedi</h3><p style='color:#9CA3AF;'>Lütfen kütüphaneden bir konunun içine girip 'Flaşkartlar' butonuna basarak buraya gel.</p>";
        emptyState.style.display = "block";
        return;
    }
    
    try {
        const q = query(collection(db, "flaskartlar"), where("konuId", "==", konuId));
        const snap = await getDocs(q);
        
        snap.forEach(doc => {
            kartlar.push(doc.data());
        });

        if (kartlar.length === 0) {
            emptyState.innerHTML = "<h3 style='color:#EF4444;'>Flaşkart Bulunamadı</h3><p style='color:#9CA3AF;'>Şefim bu konuya ait flaşkart yok. AI Yönetim panelinden bu konu için kart üretmelisin.</p>";
            emptyState.style.display = "block";
        } else {
            if (flashcardContainer) flashcardContainer.style.display = "block";
            kartiGoster();
        }
    } catch (e) {
        console.error("Firebase Çekme Hatası:", e);
        emptyState.innerHTML = "<h3 style='color:#EF4444;'>Bağlantı Hatası</h3><p style='color:#9CA3AF;'>Veritabanına ulaşılamadı. F12'ye basıp Konsol sekmesindeki kırmızı hatayı kontrol edin.</p>";
        emptyState.style.display = "block";
    }
}

// Kartı Ekrana Basma
function kartiGoster() {
    flashcard.classList.remove("is-flipped"); // Dönmeyi sıfırla

    setTimeout(() => {
        const kart = kartlar[mevcutKartIndex];
        
        // AI'nın harf hatası yapma ihtimaline karşı tüm varyasyonları deniyoruz
        const onYuzMetni = kart.onYuz || kart.onyuz || kart.Soru || kart.on_yuz || "Soru bulunamadı";
        const arkaYuzMetni = kart.arkaYuz || kart.arkayuz || kart.Cevap || kart.arka_yuz || "Cevap bulunamadı";

        cardFront.innerText = onYuzMetni;
        cardBack.innerText = arkaYuzMetni;
        
        cardCounter.innerText = `${mevcutKartIndex + 1} / ${kartlar.length}`;

        btnPrev.style.visibility = mevcutKartIndex === 0 ? "hidden" : "visible";
        btnNext.style.visibility = mevcutKartIndex === kartlar.length - 1 ? "hidden" : "visible";
    }, 150);
}

if (btnPrev) {
    btnPrev.addEventListener("click", () => {
        if (mevcutKartIndex > 0) {
            mevcutKartIndex--;
            kartiGoster();
        }
    });
}

if (btnNext) {
    btnNext.addEventListener("click", () => {
        if (mevcutKartIndex < kartlar.length - 1) {
            mevcutKartIndex++;
            kartiGoster();
        }
    });
}

// Sistemi Başlat
kartlariYukle();