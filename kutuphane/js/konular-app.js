import { db } from "../../js/firebase-config.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const dersId = urlParams.get('dersId');

const konuListesiDiv = document.getElementById("konu-listesi");
const dersBasligiH2 = document.getElementById("dersBasligi");

// DEDEKTİF 1: Tarayıcı linkinden ID'yi alabildik mi?
console.log("1. URL'den okunan dersId:", dersId); 

async function konulariGetir() {
    dersBasligiH2.innerText = ""; 

    if (!dersId) {
        console.error("HATA: URL'de dersId yok! Lütfen sayfaya Dersler menüsünden tıklayarak gelin.");
        dersBasligiH2.innerText = "Bağlantı Hatası";
        konuListesiDiv.innerHTML = "<p style='text-align:center;'>Geçersiz bağlantı. URL'de ID eksik.</p>";
        return;
    }

    try {
        console.log("2. Veritabanına bağlanıldı, dersin adı aranıyor...");
        const dersReferansi = doc(db, "dersler", dersId);
        const dersSnapshot = await getDoc(dersReferansi);

        if (dersSnapshot.exists()) {
            console.log("3. Ders Bulundu:", dersSnapshot.data().baslik);
            dersBasligiH2.innerText = dersSnapshot.data().baslik + " Konuları";
        } else {
            console.warn("DİKKAT: Bu ID'ye ait bir ders Firestore'da bulunamadı:", dersId);
            dersBasligiH2.innerText = "Bilinmeyen Ders";
        }

        console.log("4. Firebase'e soruluyor: dersId değeri '" + dersId + "' olan konuları getir...");
        const konularSorgusu = query(collection(db, "konular"), where("dersId", "==", dersId));
        const snapshot = await getDocs(konularSorgusu);

        console.log("5. Firebase'den gelen konu sayısı:", snapshot.size);

        if (snapshot.empty) {
            konuListesiDiv.innerHTML = "<p style='text-align:center; grid-column: 1 / -1; color:#9CA3AF;'>Bu derse henüz konu eklenmemiş.</p>";
            return;
        }

        konuListesiDiv.innerHTML = ""; 

        snapshot.forEach((dokuman) => {
            const konu = dokuman.data();
            console.log("Ekrana basılan konu:", konu.baslik, "| Bağlı olduğu dersId:", konu.dersId);
            
            const kart = document.createElement("a");
            kart.href = `okuma-secimi.html?konuId=${dokuman.id}`; 
            kart.className = "premium-card"; 
            kart.innerText = konu.baslik;
            konuListesiDiv.appendChild(kart);
        });

        console.log("6. İşlem kusursuz tamamlandı.");

    } catch (error) {
        console.error("Kritik Hata Oluştu:", error);
        konuListesiDiv.innerHTML = "<p style='text-align:center; color:#EF4444;'>Sistem bağlantı hatası yaşadı.</p>";
    }
}

konulariGetir();