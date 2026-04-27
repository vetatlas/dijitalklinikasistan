import { db } from "../../js/firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const konuId = urlParams.get('konuId');

const slideContent = document.getElementById("slideContent");
const slideCounter = document.getElementById("slideCounter");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");

// Lightbox Motorunu HTML'e Enjekte Et
const lightboxDiv = document.createElement("div");
lightboxDiv.className = "vip-lightbox";
lightboxDiv.innerHTML = `<img id="lightboxImg" src="">`;
document.body.appendChild(lightboxDiv);
const lightboxImg = document.getElementById("lightboxImg");
lightboxDiv.addEventListener("click", (e) => {
    if (e.target === lightboxImg) lightboxImg.classList.toggle("zoomed");
    else { lightboxDiv.classList.remove("active"); lightboxImg.classList.remove("zoomed"); }
});

let slaytlar = [];
let gecerliSlayt = 0;

async function icerigiParcalaVeYukle() {
    if (!konuId) return slideContent.innerHTML = "<h3 style='color:red;'>Bağlantı Hatası!</h3>";
    try {
        const snap = await getDoc(doc(db, "konular", konuId));
        if (snap.exists()) {
            const veri = snap.data();
            slaytlar.push(`<h2 style="color:#D4AF37; font-size:2rem; margin-bottom:20px;">${veri.baslik}</h2>`);

            if (veri.icerikHtml) {
                const geciciDiv = document.createElement("div");
                geciciDiv.innerHTML = veri.icerikHtml;
                
                // VIP PARÇALAYICI: Galeri desteği eklendi
                Array.from(geciciDiv.children).forEach(eleman => {
                    // Elementin içinde metin var mı VEYA resim var mı diye kontrol ediyoruz
                    const icindeMetinVarMi = eleman.textContent.trim() !== "";
                    const icindeResimVarMi = eleman.querySelector("img") !== null;

                    // Eğer ikisinden biri varsa bu kartı onaylıyoruz
                    if (icindeMetinVarMi || icindeResimVarMi) {
                        
                        // Resim varsa, VIP zoom özelliğini (zoomable-image) o resimlere ekle
                        if (icindeResimVarMi) {
                            eleman.querySelectorAll("img").forEach(img => {
                                img.className = "zoomable-image";
                            });
                        }
                        
                        slaytlar.push(`<div style="font-size: 1.25rem; line-height: 1.7; color: #F8FAFC;">${eleman.outerHTML}</div>`);
                    }
                });
            } else {
                slaytlar.push(`<div style="color: #9CA3AF;">İçerik bulunamadı.</div>`);
            }
            slaytiGoster(0);
        }
    } catch (e) { console.error(e); }
}

function slaytiGoster(index) {
    if (index < 0) index = 0;
    if (index >= slaytlar.length) index = slaytlar.length - 1;
    gecerliSlayt = index;

    // Kart geçiş efekti için
    slideContent.style.opacity = 0;
    slideContent.style.transform = "scale(0.95)";
    
    setTimeout(() => {
        slideContent.innerHTML = slaytlar[gecerliSlayt];
        slideCounter.innerText = `${gecerliSlayt + 1} / ${slaytlar.length}`;
        slideContent.style.opacity = 1;
        slideContent.style.transform = "scale(1)";

        // Kartın içine gelen (Quill'den veya normal) TÜM resimleri bul ve VIP Lightbox'a bağla
        document.querySelectorAll("#slideContent img").forEach(img => {
            img.addEventListener("click", () => {
                lightboxImg.src = img.src;
                lightboxDiv.classList.add("active");
            });
        });
    }, 200);

    // Butonları gizle/göster
    btnPrev.style.display = gecerliSlayt === 0 ? "none" : "block";
    btnNext.style.display = gecerliSlayt === slaytlar.length - 1 ? "none" : "block";
}

btnPrev.addEventListener("click", () => slaytiGoster(gecerliSlayt - 1));
btnNext.addEventListener("click", () => slaytiGoster(gecerliSlayt + 1));

window.addEventListener("load", () => {
    document.querySelector(".page-loader").style.opacity = "0";
    setTimeout(() => { document.querySelector(".page-loader").remove(); icerigiParcalaVeYukle(); }, 500);
});