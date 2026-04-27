import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Hangi sayfada olduğumuza göre linkleri dinamik ayarlayan VIP yol bulucu
let baseYol = "";
if (window.location.pathname.includes("/kutuphane/")) baseYol = "";
else if (window.location.pathname.includes("/ai_panel/")) baseYol = "../kutuphane/";
else baseYol = "kutuphane/"; // Ana dizindeyse (dashboard.html vb.)

const searchInput = document.querySelector(".search-input");
const topBar = document.querySelector(".top-bar");

if (searchInput && topBar) {
    const resultsBox = document.createElement("div");
    resultsBox.className = "search-results-container";
    topBar.appendChild(resultsBox);

    let tumVeriler = [];
    let verilerYuklendiMi = false;

    // Arama çubuğuna tıklandığı an TÜM veritabanını (Dersler + Konular) hafızaya çeker
    searchInput.addEventListener("focus", async () => {
        if (verilerYuklendiMi) return;
        searchInput.placeholder = "Evrensel VIP veritabanı taranıyor...";
        
        try {
            // 1. DERSLERİ ÇEK
            const derslerSnap = await getDocs(collection(db, "dersler"));
            derslerSnap.forEach(doc => {
                tumVeriler.push({
                    id: doc.id,
                    tur: "Ders", // Rozet için
                    baslik: doc.data().baslik || "",
                    icerik: "", 
                    link: `${baseYol}konular.html?dersId=${doc.id}` // Tıklayınca dersin içine gider
                });
            });

            // 2. KONULARI VE İÇERİKLERİ ÇEK
            const konularSnap = await getDocs(collection(db, "konular"));
            konularSnap.forEach(doc => {
                const data = doc.data();
                tumVeriler.push({
                    id: doc.id,
                    tur: "İçerik", // Rozet için
                    baslik: data.baslik || "",
                    icerik: data.icerikHtml ? data.icerikHtml.replace(/<[^>]+>/g, ' ') : "", 
                    link: `${baseYol}okuma-secimi.html?konuId=${doc.id}` // Tıklayınca okuma seçimine gider
                });
            });

            verilerYuklendiMi = true;
            searchInput.placeholder = "Ders, konu veya içerik ara...";
        } catch (error) {
            console.error("Arama motoru hatası:", error);
            searchInput.placeholder = "Sistem hatası.";
        }
    });

    // Canlı Filtre (Harf yazdıkça saniyeler içinde arar)
    searchInput.addEventListener("input", (e) => {
        const arananKelime = e.target.value.toLowerCase().trim();
        resultsBox.innerHTML = "";

        if (arananKelime.length < 2) {
            resultsBox.style.display = "none";
            return;
        }

        // Başlığında VEYA içeriğinde aranan kelime olanları filtrele
        const filtrelenenler = tumVeriler.filter(veri => 
            veri.baslik.toLowerCase().includes(arananKelime) || 
            veri.icerik.toLowerCase().includes(arananKelime)
        );

        if (filtrelenenler.length === 0) {
            resultsBox.innerHTML = `
                <div class="search-result-item" style="cursor: default;">
                    <div class="search-title" style="color: #EF4444;">Sonuç Bulunamadı</div>
                    <div class="search-context">Tüm veritabanında tarandı, eşleşme yok.</div>
                </div>`;
            resultsBox.style.display = "block";
            return;
        }

        // Bulunan ilk 10 sonucu ekrana bas
        filtrelenenler.slice(0, 10).forEach(veri => {
            const kart = document.createElement("a");
            kart.href = veri.link;
            kart.className = "search-result-item";

            // Aranan kelimeyi başlıkta altın rengiyle parlat
            const regex = new RegExp(`(${arananKelime})`, 'gi');
            const parlatilmisBaslik = veri.baslik.replace(regex, '<span class="search-highlight">$1</span>');
            
            // EĞER KELİME METNİN İÇİNDEYSE: O cümleyi bul ve özet olarak göster!
            let ekstraBaglam = "";
            if (veri.icerik.toLowerCase().includes(arananKelime) && !veri.baslik.toLowerCase().includes(arananKelime)) {
                const index = veri.icerik.toLowerCase().indexOf(arananKelime);
                // Kelimenin 20 karakter öncesini ve sonrasını al
                const baslangic = Math.max(0, index - 25);
                const bitis = Math.min(veri.icerik.length, index + arananKelime.length + 25);
                const ozet = veri.icerik.substring(baslangic, bitis).replace(regex, '<span class="search-highlight">$1</span>');
                ekstraBaglam = `<div style="font-size: 0.85rem; color: #D4AF37; margin-top: 8px; font-style: italic; background: rgba(0,0,0,0.2); padding: 5px; border-radius: 6px;">"...${ozet}..."</div>`;
            }

            // Türüne göre VIP rozet rengi
            const rozetRengi = veri.tur === "Ders" ? "#3B82F6" : "#D4AF37";

            kart.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                    <span style="background: ${rozetRengi}; color: #FFF; font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">${veri.tur}</span>
                    <div class="search-title" style="margin: 0;">${parlatilmisBaslik}</div>
                </div>
                ${ekstraBaglam}
                <div class="search-context" style="margin-top: 8px;">${veri.tur === "Ders" ? 'Bu dersin konularını görmek için tıklayın ➔' : 'Okuma moduna gitmek için tıklayın ➔'}</div>
            `;
            resultsBox.appendChild(kart);
        });

        resultsBox.style.display = "block";
    });

    // Boşluğa tıklayınca sonuçları kapat
    document.addEventListener("click", (e) => {
        if (!topBar.contains(e.target)) resultsBox.style.display = "none";
    });
}