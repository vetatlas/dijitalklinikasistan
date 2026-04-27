import { db } from "../../js/firebase-config.js";
import { collection, getDocs, query, where, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const dersSecimi = document.getElementById("dersSecimi");
const konuSecimi = document.getElementById("konuSecimi");
const aiUretimForm = document.getElementById("aiUretimForm");
const aiLoader = document.getElementById("aiLoader");
const btnUret = document.getElementById("btnUret");
const vipToast = document.getElementById("vipToast");

function showToast(msg, isError = false) {
    document.getElementById("toastMsg").innerText = msg;
    vipToast.className = isError ? "vip-toast show error" : "vip-toast show";
    setTimeout(() => vipToast.classList.remove("show"), 4000);
}

// Dersleri ve Konuları Getirme (Klasik Sistem)
async function dersleriYukle() {
    const snap = await getDocs(collection(db, "dersler"));
    snap.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id; opt.innerText = d.data().baslik;
        dersSecimi.appendChild(opt);
    });
}
// 👑 VIP API ANAHTARI HAFIZASI
let kayitliApiKey = "";
const apiDocRef = doc(db, "ayarlar", "apikeys");

async function apiKeyiCek() {
    try {
        const snap = await getDoc(apiDocRef);
        if (snap.exists() && snap.data().groq) {
            kayitliApiKey = snap.data().groq;
            const inputEl = document.getElementById("groqApiKey");
            inputEl.value = kayitliApiKey;
            // Key varsa kutuyu tamamen gizle ki göz kalabalığı yapmasın!
            inputEl.parentElement.style.display = "none"; 
        }
    } catch(e) { console.error("API Key çekilemedi", e); }
}
apiKeyiCek();

dersSecimi.addEventListener("change", async (e) => {
    konuSecimi.innerHTML = "<option value=''>Konular yükleniyor...</option>";
    if(!e.target.value) return konuSecimi.innerHTML = "<option value=''>Önce ders seçin...</option>";
    const q = query(collection(db, "konular"), where("dersId", "==", e.target.value));
    const snap = await getDocs(q);
    konuSecimi.innerHTML = "<option value=''>Bir konu seçin...</option>";
    snap.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id; opt.innerText = d.data().baslik;
        konuSecimi.appendChild(opt);
    });
});

dersleriYukle();

// =========================================
// 🚀 KUSURSUZ GROQ API MOTORU
// =========================================
aiUretimForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById("groqApiKey").value;
    const dersId = dersSecimi.value;
    const konuId = konuSecimi.value;
    const dersAdi = dersSecimi.options[dersSecimi.selectedIndex].text;
    const konuAdi = konuSecimi.options[konuSecimi.selectedIndex].text;
    const tur = document.getElementById("uretimTuru").value;
    const talimat = document.getElementById("ozelTalimat").value;
    const adet = document.getElementById("adet").value;

    if(!konuId) return showToast("Hocam önce konu seçmelisin!", true);

    btnUret.style.display = "none";
    aiLoader.style.display = "block";

    try {
        // 🚀 1. ADIM: Senin kütüphaneye girdiğin asıl klinik notu çekiyoruz
        const konuDoc = await getDoc(doc(db, "konular", konuId));
        if (!konuDoc.exists()) throw new Error("Konu kaydı bulunamadı.");
        
        const notIcerigi = konuDoc.data().icerikHtml 
            ? konuDoc.data().icerikHtml.replace(/<[^>]+>/g, ' ') 
            : "";

        if (notIcerigi.trim().length < 20) {
            throw new Error("Hocam bu konunun içeriği çok kısa veya boş. Önce kütüphaneye yeterli not eklemelisin ki zeka oradan soru üretebilsin.");
        }

        // 🚀 2. ADIM: Zekaya "Sadece Bu Metinden Soru Çıkar" Talimatı (Prompt Engineering)
        const systemPrompt = `Sen Türkiye'de çalışan uzman bir veteriner hekim profesörüsün. Görevin, SADECE aşağıda verilen "KLİNİK NOTLAR" metnine dayanarak ${adet} adet profesyonel ${tur === "flaskart" ? "flaşkart" : "çoktan seçmeli test sorusu"} üretmektir.
        
        KESİN KURALLAR:
        1. Verilen metnin dışındaki genel bilgilerini ASLA kullanma. 
        2. Eğer metinde yeterli bilgi yoksa, elindekiyle yetin veya uydurma.
        3. Sorular Türkiye'deki veteriner hekimlik jargonuna (Hocam, vaka, tanı, tedavi protokolü) uygun olsun.
        4. Test soruları 5 şıklı (a,b,c,d,e) olsun ve her sorunun altına mutlaka veteriner hekimlik dilinde profesyonel bir "açıklama" ekle.

        KLİNİK NOTLAR:
        "${notIcerigi}"

        ÖZEL TALİMAT: ${talimat || "Genel klinik değerlendirme."}

        Çıktıyı SADECE JSON olarak ver. Format:
        ${tur === "flaskart" 
            ? '[{"onYuz": "..", "arkaYuz": ".."}]' 
            : '[{"soru": "..", "a": "..", "b": "..", "c": "..", "d": "..", "e": "..", "dogruCevap": "a/b/c/d/e", "aciklama": ".."}]'
        }`;

        // 🚀 3. ADIM: Yeni Llama 3.1 Modeli ile İstek
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: systemPrompt }],
                temperature: 0.1, // Düşük yaratıcılık = Yüksek sadakat (Uydurmayı engeller)
                response_format: { type: "json_object" }
            })
        });

        const veri = await response.json();
        if (veri.error) throw new Error(veri.error.message);

        const jsonCiktisi = veri.choices[0].message.content;
        let uretilenler = JSON.parse(jsonCiktisi);
        
        // JSON içindeki listeyi bul (AI bazen objenin içine gömebilir)
        if (!Array.isArray(uretilenler)) {
            const keys = Object.keys(uretilenler);
            uretilenler = uretilenler[keys[0]];
        }

        // 🚀 4. ADIM: Firebase'e (Soru veya Kart Havuzuna) Kayıt
        const koleksiyon = tur === "flaskart" ? "flaskartlar" : "sorular";
        for (const item of uretilenler) {
            await addDoc(collection(db, koleksiyon), {
                ...item,
                dersId: dersId,
                konuId: konuId,
                olusturmaTarihi: new Date().toISOString()
            });
        }

        showToast(`Şefim, ${uretilenler.length} adet ${tur === 'flaskart' ? 'flaşkart' : 'soru'} senin notlarına göre üretilip kütüphaneye kilitlendi! ✅`);

    } catch (error) {
        console.error(error);
        showToast("Hata oluştu: " + error.message, true);
    } finally {
        btnUret.style.display = "block";
        aiLoader.style.display = "none";
    }
});