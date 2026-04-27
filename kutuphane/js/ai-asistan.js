import { db } from "../../js/firebase-config.js";
import { collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const btnSend = document.getElementById("btnSend");
const btnMic = document.getElementById("btnMic");
const btnUpload = document.getElementById("btnUpload");
const imageUpload = document.getElementById("imageUpload");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const btnRemoveImage = document.getElementById("btnRemoveImage");
const typingIndicator = document.getElementById("typingIndicator");
const apiKeyInput = document.getElementById("apiKeyInput");
const vipToast = document.getElementById("vipToast");

// 👑 OTOMATİK ŞARJÖR DEĞİŞKENLERİ
let kayitliApiKeys = []; // Artık tek bir key değil, dizi(array) tutuyoruz
let aktifKeyIndex = 0;   // O an kullanılan şarjörün sırası
let sohbetGecmisi = [];
let base64Image = null;
// 🎤 ENTEGRASYON 1: SESLİ KOMUT SİSTEMİ
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    
    recognition.onstart = () => btnMic.classList.add("listening");
    recognition.onend = () => btnMic.classList.remove("listening");
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatInput.value += (chatInput.value ? " " : "") + transcript;
    };
} else {
    btnMic.style.display = "none";
}
btnMic.addEventListener("click", () => {
    if (recognition) { btnMic.classList.contains("listening") ? recognition.stop() : recognition.start(); }
});

// 📸 ENTEGRASYON 2: GÖRSEL AI VE PİKSEL LABORATUVARI
btnUpload.addEventListener("click", () => imageUpload.click());

imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 800; 
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, width, height);
                base64Image = canvas.toDataURL('image/jpeg', 0.6);
                imagePreview.src = base64Image;
                imagePreviewContainer.style.display = "flex";
                showToast(`Görsel optimize edildi. Analize hazır.`);
            };
        };
        reader.readAsDataURL(file);
    }
});

btnRemoveImage.addEventListener("click", () => {
    base64Image = null;
    imageUpload.value = "";
    imagePreviewContainer.style.display = "none";
});

// 👑 YENİ NESİL API ANAHTARI HAFIZASI
const apiDocRef = doc(db, "ayarlar", "apikeys");
async function apiKeyleriCek() {
    try {
        const snap = await getDoc(apiDocRef);
        if (snap.exists() && snap.data().groqKeys) {
            kayitliApiKeys = snap.data().groqKeys; // Array olarak çek
            if(apiKeyInput) apiKeyInput.parentElement.style.display = "none";
        } else if (snap.exists() && snap.data().groq) {
            // Eski sistemden kalma tekli key varsa onu da şarjöre dönüştür
            kayitliApiKeys = [snap.data().groq];
            await setDoc(apiDocRef, { groqKeys: kayitliApiKeys }, { merge: true });
            if(apiKeyInput) apiKeyInput.parentElement.style.display = "none";
        }
    } catch(e) { console.error(e); }
}
apiKeyleriCek();

function showToast(msg, isError = false) {
    document.getElementById("toastMsg").innerText = msg;
    vipToast.className = isError ? "vip-toast show error" : "vip-toast show";
    setTimeout(() => vipToast.classList.remove("show"), 3000);
}

// Daktilo Efektli Mesaj Yazdırıcı
function mesajEkle(metin, kimden, imgObj = null) {
    const div = document.createElement("div");
    div.className = `message ${kimden === 'user' ? 'msg-user' : 'msg-ai'}`;
    let htmlContent = metin.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (imgObj) {
        htmlContent = `<img src="${imgObj}" style="max-width: 100%; border-radius: 8px; margin-bottom: 10px;"><br>` + htmlContent;
    }
    chatMessages.appendChild(div);

    if (kimden === 'ai') {
        div.innerHTML = "";
        let i = 0;
        let isTag = false;
        let currentHTML = "";
        function yaz() {
            if (i < htmlContent.length) {
                currentHTML += htmlContent.charAt(i);
                div.innerHTML = currentHTML;
                if (htmlContent.charAt(i) === '<') isTag = true;
                if (htmlContent.charAt(i) === '>') isTag = false;
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (isTag) { yaz(); } else { setTimeout(yaz, 15); }
            }
        }
        yaz();
    } else {
        div.innerHTML = htmlContent;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// 🧠 AKILLI VERİTABANI TARAMASI
async function akilliVeritabaniTaramasi(soru) {
    let bulunanMetinler = "";
    const anahtarKelimeler = soru.toLowerCase().split(" ").filter(k => k.length > 3);
    try {
        const libSnap = await getDocs(collection(db, "konular"));
        libSnap.forEach(doc => {
            const icerik = doc.data().icerikHtml ? doc.data().icerikHtml.replace(/<[^>]+>/g, ' ').toLowerCase() : "";
            if (anahtarKelimeler.some(kelime => icerik.includes(kelime))) {
                bulunanMetinler += `\n[KÜTÜPHANE BİLGİSİ - ${doc.data().baslik}]: ${doc.data().icerikHtml.replace(/<[^>]+>/g, ' ')}`;
            }
        });
    } catch (e) { console.error("Tarama hatası", e); }
    return bulunanMetinler.substring(0, 10000);
}

btnSend.addEventListener("click", mesajGonder);
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); mesajGonder(); }
});

async function mesajGonder() {
    const girilenKeyMetni = (apiKeyInput && apiKeyInput.value.trim()) ? apiKeyInput.value.trim() : "";
    const soru = chatInput.value.trim();

    // Kullanıcı virgülle ayırıp birden fazla key girdiyse array yap (Şarjörleri doldur)
    if (girilenKeyMetni) {
        kayitliApiKeys = girilenKeyMetni.split(",").map(k => k.trim()).filter(k => k.length > 10);
        await setDoc(apiDocRef, { groqKeys: kayitliApiKeys }, { merge: true });
        if (apiKeyInput) apiKeyInput.parentElement.style.display = "none";
    }

    if (kayitliApiKeys.length === 0) return showToast("Hocam API anahtarı eksik!", true);
    if (!soru && !base64Image) return;

    chatInput.value = "";
    const gonderilenResim = base64Image;
    mesajEkle(soru, "user", gonderilenResim);
    btnRemoveImage.click();

    typingIndicator.style.display = "flex";
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const kaynakVeri = await akilliVeritabaniTaramasi(soru);
    let aiModel = "llama-3.3-70b-versatile";
    let mesajPaketi = [];

    if (gonderilenResim) {
        aiModel = "meta-llama/llama-4-scout-17b-16e-instruct"; // Yepyeni Görsel Motor
        mesajPaketi = [
            {
                role: "user",
                content: [
                    { type: "text", text: `Sen Profesör Volkan'sın. Kütüphaneden cevap ver. Soru: ${soru || 'Bulguları açıkla.'}\n\nKÜTÜPHANE BİLGİSİ:\n${kaynakVeri || 'Kayıt Yok.'}` },
                    { type: "image_url", image_url: { url: gonderilenResim } }
                ]
            }
        ];
    } else {
        const systemPrompt = `Sen Türkiye'nin en tecrübeli veteriner hekim profesörüsün. Adın Profesör Volkan. SADECE Kütüphaneden cevap ver:\n${kaynakVeri || "KAYIT YOK."}`;
        mesajPaketi = [
            { role: "system", content: systemPrompt },
            ...sohbetGecmisi,
            { role: "user", content: soru }
        ];
    }

    // 🚀 OTOMATİK ŞARJÖR MEKANİZMASI (HATA YAKALAMA VE GEÇİŞ YAPMA)
    let basarili = false;
    let denemeSayisi = 0;
    let aiCevap = "";

    while (!basarili && denemeSayisi < kayitliApiKeys.length) {
        const currentKey = kayitliApiKeys[aktifKeyIndex];
        try {
            let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${currentKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: aiModel,
                    messages: mesajPaketi,
                    temperature: 0.1
                })
            });

            // EĞER LİMİT DOLDUYSA (Hata 429) ÖZEL HATA FIRLAT
            if (response.status === 429) {
                throw new Error("RATE_LIMIT");
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            aiCevap = data.choices[0].message.content;
            basarili = true; // Kod buraya gelirse işlem başarılı demektir, döngü kırılır.

        } catch (error) {
            // EĞER HATA LİMİT DOLMASIYSA:
            if (error.message === "RATE_LIMIT" || (error.message && error.message.includes("rate"))) {
                console.warn(`[Şarjör ${aktifKeyIndex + 1} Bitti] Diğer API anahtarına geçiliyor...`);
                aktifKeyIndex = (aktifKeyIndex + 1) % kayitliApiKeys.length; // Bir sonraki anahtara geç
                denemeSayisi++;
            } else {
                // Limit dışı bir hataysa (Örn: Model yok, anahtar geçersiz) döngüyü tamamen durdur
                typingIndicator.style.display = "none";
                mesajEkle(`❌ **SİSTEM HATASI:** ${error.message}`, "ai");
                if (apiKeyInput && apiKeyInput.parentElement) apiKeyInput.parentElement.style.display = "block";
                return; // Fonksiyondan çık
            }
        }
    }

    typingIndicator.style.display = "none";

    // EĞER TÜM ŞARJÖRLER BİTTİYSE
    if (!basarili) {
        mesajEkle("❌ **LİMİT DOLDU:** Şefim, mühimmat yeleğindeki tüm API anahtarlarının limiti aynı anda doldu! 1-2 dakika dinlenmeleri lazım.", "ai");
        return;
    }

    // İŞLEM BAŞARILIYSA EKRANA YAZDIR
    sohbetGecmisi.push({ role: "user", content: soru || "Görsel gönderildi." });
    sohbetGecmisi.push({ role: "assistant", content: aiCevap });
    
    mesajEkle(aiCevap, "ai");

    const utterance = new SpeechSynthesisUtterance(aiCevap.replace(/[*#]/g, ''));
    utterance.lang = 'tr-TR';
    window.speechSynthesis.speak(utterance);
}