// ===============================================
// 📚 DERS NOTLARI GÖRÜNTÜLEME + QUILL EDİTÖR + SWIPE
// ===============================================

let viewState = {
    level: 'courses',
    courseId: null,
    courseName: null,
    subjectId: null,
    subjectName: null
};

let activeNoteCards = [];
let currentCardIndex = 0;
let fullQuill = null;

const viewCourses = document.getElementById('view-courses');

// ========== ANA RENDER ==========
async function renderCourses() {
    viewState.level = 'courses';
    viewCourses.innerHTML = `
        <div class="premium-card" style="text-align:center;">
            <i class="fas fa-graduation-cap" style="font-size:3.5rem; color:var(--primary);"></i>
            <h2>Ders Notlarım</h2>
        </div>
        <div id="courses-list" style="display:grid; gap:16px;"></div>
    `;
    await loadCourses();
}

async function loadCourses() {
    const listDiv = document.getElementById('courses-list');
    showGlobalLoading();
    try {
        const snap = await db.collection('courses').orderBy('createdAt', 'desc').get();
        let html = '';
        if (snap.empty) {
            html = '<div class="premium-card"><p>✨ Henüz ders yok.</p></div>';
        } else {
            for (const doc of snap.docs) {
                const course = doc.data();
                const subSnap = await db.collection('courses').doc(doc.id).collection('subjects').get();
                html += `
                    <div class="premium-card" onclick="navigateToSubjects('${doc.id}', '${course.name.replace(/'/g, "\\'")}')">
                        <h3>📘 ${course.name}</h3>
                        <p>${subSnap.size} konu</p>
                    </div>
                `;
            }
        }
        listDiv.innerHTML = html;
    } catch (e) {
        console.error(e);
    } finally {
        hideGlobalLoading();
    }
}

async function navigateToSubjects(courseId, courseName) {
    viewState = { level: 'subjects', courseId, courseName, subjectId: null, subjectName: null };
    viewCourses.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="icon-btn" onclick="renderCourses()"><i class="fas fa-arrow-left"></i></button>
            <h2>📚 ${courseName}</h2>
        </div>
        <div id="subjects-list" style="display:grid; gap:16px;"></div>
    `;
    await loadSubjects();
}

async function loadSubjects() {
    const listDiv = document.getElementById('subjects-list');
    showGlobalLoading();
    try {
        const snap = await db.collection('courses').doc(viewState.courseId)
                                .collection('subjects').orderBy('createdAt', 'desc').get();
        let html = '';
        if (snap.empty) html = '<div class="premium-card"><p>📌 Konu yok.</p></div>';
        else {
            snap.forEach(doc => {
                const sub = doc.data();
                html += `<div class="premium-card" onclick="navigateToNotes('${doc.id}', '${sub.name.replace(/'/g, "\\'")}')"><h3>📑 ${sub.name}</h3></div>`;
            });
        }
        listDiv.innerHTML = html;
    } catch (e) { console.error(e); } 
    finally { hideGlobalLoading(); }
}

async function navigateToNotes(subjectId, subjectName) {
    viewState.level = 'notes';
    viewState.subjectId = subjectId;
    viewState.subjectName = subjectName;
    viewCourses.innerHTML = `
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
            <button class="icon-btn" onclick="navigateToSubjects('${viewState.courseId}','${viewState.courseName}')"><i class="fas fa-arrow-left"></i></button>
            <h2>📌 ${subjectName}</h2>
        </div>
        <div id="notes-list" style="display:grid; gap:16px;"></div>
    `;
    await loadNotes();
}

async function loadNotes() {
    if (!viewState.courseId || !viewState.subjectId) {
        console.error('loadNotes: Eksik ID', viewState);
        return;
    }
    const listDiv = document.getElementById('notes-list');
    showGlobalLoading();
    try {
        const snap = await db.collection('courses').doc(viewState.courseId)
                                .collection('subjects').doc(viewState.subjectId)
                                .collection('notes').orderBy('createdAt', 'desc').get();
        let html = '';
        if (snap.empty) html = '<div class="premium-card"><p>📄 Not yok.</p></div>';
        else {
            snap.forEach(doc => {
                const note = doc.data();
                html += `<div class="premium-card" onclick="openSwipeView('${doc.id}')"><h4>📄 ${note.title}</h4><p>${note.cards?.length || 0} kart</p></div>`;
            });
        }
        listDiv.innerHTML = html;
    } catch (e) { console.error(e); } 
    finally { hideGlobalLoading(); }
}

// ========== QUILL TAM EKRAN EDİTÖR (DÜZELTİLMİŞ) ==========
async function openFullEditor() {
    const state = window.currentState || viewState;
    if (!state || !state.subjectId) {
        showToast('Önce bir konu seçin.', 'error');
        return;
    }
    
    if (typeof Quill === 'undefined') {
        showToast('Quill editör yüklenemedi. Sayfayı yenileyin.', 'error');
        return;
    }
    
    showGlobalLoading();
    
    try {
        // Editör arayüzünü oluştur
        viewCourses.innerHTML = `
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <button class="icon-btn" onclick="closeEditor()"><i class="fas fa-times"></i></button>
                <h2>Yeni Not</h2>
            </div>
            <input id="note-title-input" placeholder="Not Başlığı" style="width:100%; padding:16px; background:var(--bg-card); border:1px solid var(--glass-border); border-radius:16px; color:white; font-size:1.1rem; margin-bottom:20px;">
            <div id="full-editor-container" style="height:50vh; background:var(--bg-card); border-radius:16px; margin-bottom:20px;"></div>
            <div style="display:flex; gap:12px;">
                <button class="btn-primary" onclick="saveNoteFromEditor()"><i class="fas fa-save"></i> Kaydet</button>
                <button class="icon-btn" style="background:#ef4444;" onclick="closeEditor()">İptal</button>
            </div>
        `;
        
        // DOM'un güncellenmesi için yeterli süre tanı (150ms)
        await new Promise(r => setTimeout(r, 150));
        
        const container = document.getElementById('full-editor-container');
        if (!container) throw new Error('Editor container bulunamadı');
        
        // Varsa eski Quill instance'ını tamamen yok et
        if (fullQuill) {
            fullQuill = null;
        }
        
        // Yeni Quill'i oluştur (toolbar çok sade)
        fullQuill = new Quill('#full-editor-container', {
            theme: 'snow',
            placeholder: 'Vaka detayları, bulgular, tedavi...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });
        
        // Resim yükleme handler'ını ekle (Quill 2.0 ile uyumlu)
        fullQuill.getModule('toolbar').addHandler('image', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
                const file = input.files[0];
                if (!file) return;
                
                // Resmi base64 olarak oku ve sıkıştır
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        let w = img.width, h = img.height;
                        if (w > 1000) { h = (h * 1000) / w; w = 1000; }
                        canvas.width = w; canvas.height = h;
                        ctx.drawImage(img, 0, 0, w, h);
                        const compressed = canvas.toDataURL('image/jpeg', 0.7);
                        const range = fullQuill.getSelection(true);
                        fullQuill.insertEmbed(range.index, 'image', compressed);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            };
            input.click();
        });
        
        console.log('✅ Quill editör başarıyla başlatıldı!');
        hideGlobalLoading();
        
    } catch (error) {
        console.error('Editör hatası:', error);
        showToast('Editör başlatılamadı: ' + error.message, 'error');
        hideGlobalLoading();
        closeEditor();
    }
}

function closeEditor() {
    const state = window.currentState || viewState;
    if (state && state.courseId && state.subjectId) {
        navigateToNotes(state.subjectId, state.subjectName);
    } else {
        renderCourses();
    }
}

// ========== KAYDET ==========
async function saveNoteFromEditor() {
    const title = document.getElementById('note-title-input')?.value.trim();
    if (!title) return showToast('Başlık girin', 'error');
    if (!fullQuill) return showToast('Editör hazır değil', 'error');
    
    const htmlContent = fullQuill.root.innerHTML;
    if (!htmlContent || fullQuill.getText().trim().length === 0) {
        return showToast('İçerik boş', 'error');
    }

    const state = window.currentState || viewState;
    if (!state || !state.courseId || !state.subjectId) {
        return showToast('Ders/Konu bilgisi eksik', 'error');
    }

    showGlobalLoading();
    try {
        const cards = splitContentToCards(htmlContent);
        await db.collection('courses').doc(state.courseId)
                .collection('subjects').doc(state.subjectId)
                .collection('notes').add({
                    title,
                    htmlContent,
                    cards,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
        showToast('Not kaydedildi', 'success');
        closeEditor();
    } catch (e) {
        console.error('Kayıt hatası:', e);
        showToast('Kayıt hatası: ' + e.message, 'error');
    } finally {
        hideGlobalLoading();
    }
}

function splitContentToCards(html, maxChars = 600) {
    const cards = [];
    const div = document.createElement('div');
    div.innerHTML = html;
    Array.from(div.childNodes).forEach(node => {
        if (node.nodeName === 'IMG') {
            cards.push({ type: 'image', src: node.src, alt: node.alt || '' });
        } else {
            const text = node.textContent?.trim() || '';
            if (!text) return;
            if (text.length <= maxChars) cards.push({ type: 'text', content: text });
            else {
                const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
                let temp = '';
                sentences.forEach(s => {
                    if ((temp + s).length > maxChars) {
                        if (temp) cards.push({ type: 'text', content: temp.trim() });
                        temp = s;
                    } else temp += ' ' + s;
                });
                if (temp) cards.push({ type: 'text', content: temp.trim() });
            }
        }
    });
    return cards.length ? cards : [{ type: 'text', content: 'Boş içerik' }];
}

// ========== SWIPE KART GÖRÜNÜMÜ ==========
async function openSwipeView(noteId) {
    showGlobalLoading();
    try {
        const doc = await db.collection('courses').doc(viewState.courseId)
                                .collection('subjects').doc(viewState.subjectId)
                                .collection('notes').doc(noteId).get();
        if (!doc.exists) return showToast('Not bulunamadı', 'error');
        const note = doc.data();
        activeNoteCards = note.cards || [{ type: 'text', content: 'İçerik yok' }];
        currentCardIndex = 0;
        const swipeHTML = `
            <div id="swipe-view" style="position:fixed; inset:0; background:#0b0f19; z-index:3000; display:flex; flex-direction:column;">
                <div class="swipe-header">
                    <button class="icon-btn" onclick="closeSwipeView()"><i class="fas fa-times"></i></button>
                    <h3>${note.title}</h3>
                    <span id="card-counter">1/${activeNoteCards.length}</span>
                </div>
                <div class="swipe-content" id="swipe-content"><div class="swipe-card" id="swipe-card"></div></div>
                <div style="display:flex; justify-content:space-between; padding:20px;">
                    <button class="icon-btn" onclick="prevCard()"><i class="fas fa-chevron-left"></i></button>
                    <button class="icon-btn" onclick="nextCard()"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', swipeHTML);
        renderCard(0);
        const content = document.getElementById('swipe-content');
        let touchStart = 0;
        content.addEventListener('touchstart', e => touchStart = e.changedTouches[0].screenX, {passive:true});
        content.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].screenX - touchStart;
            if (diff < -50) nextCard(); else if (diff > 50) prevCard();
        });
    } catch (e) { showToast('Hata', 'error'); } 
    finally { hideGlobalLoading(); }
}

function renderCard(index) {
    const card = activeNoteCards[index];
    const div = document.getElementById('swipe-card');
    if (card.type === 'text') div.innerHTML = `<p>${card.content}</p>`;
    else div.innerHTML = `<img src="${card.src}" alt="${card.alt}" style="max-width:100%;">`;
    document.getElementById('card-counter').innerText = `${index+1}/${activeNoteCards.length}`;
}

function nextCard() {
    if (currentCardIndex < activeNoteCards.length-1) { currentCardIndex++; renderCard(currentCardIndex); }
    else showToast('🎉 Tebrikler!', 'success');
}
function prevCard() {
    if (currentCardIndex > 0) { currentCardIndex--; renderCard(currentCardIndex); }
}
function closeSwipeView() { document.getElementById('swipe-view').remove(); }