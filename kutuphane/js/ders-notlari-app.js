// Merkezi config dosyamızdan veritabanı (db) bağlantımızı çağırıyoruz.
// '../' kullanarak bir üst klasöre, oradan da ana js klasörüne ulaşıyoruz.
import { db } from "../../js/firebase-config.js";

// Firestore'dan veri çekmek için gerekli fonksiyonları içe aktarıyoruz
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Sayfa yüklendiğinde çalışacak ana fonksiyon
async function dersleriGetir() {
    // HTML'deki listeyi kapsayan div'i seçiyoruz
    const dersListesiDiv = document.getElementById("ders-listesi");

    try {
        // Firestore'daki 'dersler' koleksiyonunun referansını alıyoruz
        const derslerReferansi = collection(db, "dersler");
        
        // Koleksiyondaki tüm dokümanları getiriyoruz
        const snapshot = await getDocs(derslerReferansi);

        // Eğer koleksiyon boşsa kullanıcıya bilgi veriyoruz
        if (snapshot.empty) {
            dersListesiDiv.innerHTML = "<p style='text-align:center; grid-column: 1 / -1;'>Henüz hiç ders eklenmemiş.</p>";
            return;
        }

        // İçerik yükleniyor yazısını temizliyoruz
        dersListesiDiv.innerHTML = "";

        // Gelen her bir ders dokümanı için döngü oluşturuyoruz
        snapshot.forEach((doc) => {
            const dersVerisi = doc.data(); // Dokümanın içindeki veriler (başlık vs.)
            const dersId = doc.id;         // Dokümanın Firebase'deki benzersiz ID'si

            // Yeni bir <a> etiketi oluşturuyoruz (Premium Kart Görünümü)
            const kart = document.createElement("a");
            
            // Kullanıcı bu derse tıkladığında konular.html sayfasına gidecek 
            // ve URL'nin sonuna dersin ID'sini ekleyeceğiz ki hangi dersin konularını açacağımızı bilelim
            kart.href = `konular.html?dersId=${dersId}`; 
            
            // CSS dosyamızdaki premium kart sınıfını atıyoruz
            kart.className = "premium-card"; 
            
            // Kartın içine dersin başlığını yazıyoruz (Eğer başlık yoksa 'İsimsiz Ders' yazsın)
            kart.innerText = dersVerisi.baslik || "İsimsiz Ders"; 

            // Oluşturduğumuz kartı ekrandaki listeye ekliyoruz
            dersListesiDiv.appendChild(kart);
        });

    } catch (error) {
        console.error("Dersler çekilirken bir hata oluştu:", error);
        dersListesiDiv.innerHTML = "<p style='text-align:center; color: red; grid-column: 1 / -1;'>Dersler yüklenirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.</p>";
    }
}

// Fonksiyonu başlatıyoruz
dersleriGetir();