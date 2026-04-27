import { db } from "../../js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const konuId = urlParams.get('konuId');

// Tam Ekran Görsel Motorunu HTML'e enjekte et
const lightboxDiv = document.createElement("div");
lightboxDiv.className = "vip-lightbox";
lightboxDiv.innerHTML = `<img id="lightboxImg" src="">`;
document.body.appendChild(lightboxDiv);

const lightboxImg = document.getElementById("lightboxImg");

// Lightbox Kapatma veya Yakınlaştırma Olayı
lightboxDiv.addEventListener("click", (e) => {
    if (e.target === lightboxImg) {
        lightboxImg.classList.toggle("zoomed"); // Resme tıklarsan büyür/küçülür
    } else {
        lightboxDiv.classList.remove("active"); // Boşluğa tıklarsan kapanır
        lightboxImg.classList.remove("zoomed");
    }
});

async function icerigiYukle() {
    if (!konuId) return document.getElementById("konuBasligi").innerText = "Bağlantı Hatası!";
    try {
        const snap = await getDoc(doc(db, "konular", konuId));
        if (snap.exists()) {
            const veri = snap.data();
            document.getElementById("konuBasligi").innerText = veri.baslik;
            
            // YENİ MOTOR: Editörden gelen hazır HTML'i direkt basıyoruz
            if (veri.icerikHtml) {
                document.getElementById("konuMetni").innerHTML = veri.icerikHtml;
                
                // İçindeki tüm Quill resimlerine Lightbox (Tam ekran zoom) özelliği ekle
                document.querySelectorAll("#konuMetni img").forEach(img => {
                    img.classList.add("zoomable-image");
                    img.addEventListener("click", () => {
                        lightboxImg.src = img.src;
                        lightboxDiv.classList.add("active");
                    });
                });
            } else {
                document.getElementById("konuMetni").innerText = "İçerik bulunamadı.";
            }
        }
    } catch (e) { console.error(e); }
}

window.addEventListener("load", () => {
    document.querySelector(".page-loader").style.opacity = "0";
    setTimeout(() => { document.querySelector(".page-loader").remove(); icerigiYukle(); }, 500);
});