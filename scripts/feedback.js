// scripts/feedback.js - الإصدار المحدث للتحقق المزدوج

// حالة التطبيق
const AppState = {
    currentClient: null,
    backendUrl: 'https://raslankoshary.up.railway.app/api' // أو 'https://raslankoshary.up.railway.app/api'
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    setupEventListeners();
    checkExistingSession();
}

// ========== نظام التحقق المزدوج ==========

// التحقق من الجلسة السابقة
async function checkExistingSession() {
    const savedClientId = localStorage.getItem('clientId');
    const savedClientPhone = localStorage.getItem('clientPhone');
    
    if (savedClientId && savedClientPhone) {
        console.log('🔄 التحقق من الجلسة السابقة للتقييم...');
        await verifyClient(savedClientId, savedClientPhone);
    } else {
        showLoginInterface();
    }
}

// التحقق المزدوج من العميل
async function verifyClient(clientId, clientPhone) {
    showLoading(true);
    
    try {
        console.log('🔐 التحقق من العميل للتقييم:', { clientId, clientPhone });
        
        const response = await fetch(`${AppState.backendUrl}/clients/${clientId}/verify?phone=${clientPhone}`);
        const result = await response.json();

        if (result.success) {
            console.log('✅ تحقق ناجح للتقييم:', result.data.name);
            
            // حفظ بيانات العميل
            AppState.currentClient = result.data;
            localStorage.setItem('clientId', clientId);
            localStorage.setItem('clientPhone', clientPhone);
            localStorage.setItem('clientData', JSON.stringify(result.data));
            
            // عرض واجهة التقييم
            showFeedbackInterface();
            
        } else {
            console.log('❌ تحقق فاشل للتقييم:', result.message);
            showAlert('خطأ في التسجيل', result.message, 'error');
            clearStoredData();
        }
        
    } catch (error) {
        console.error('💥 خطأ في الاتصال:', error);
        showAlert('خطأ في النظام', 'حدث خطأ أثناء الاتصال بالسيرفر', 'error');
        clearStoredData();
    } finally {
        showLoading(false);
    }
}

// معالجة تسجيل الدخول
async function handleLogin(event) {
    event.preventDefault();
    
    const clientId = document.getElementById('client-id').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();
    
    // التحقق من البيانات
    if (!clientId || !clientPhone) {
        showAlert('خطأ', 'يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // التحقق من صحة رقم الهاتف
    if (!/^01[0-9]{9}$/.test(clientPhone)) {
        showAlert('خطأ', 'رقم الهاتف يجب أن يبدأ بـ 01 ويحتوي على 11 رقماً', 'error');
        return;
    }
    
    await verifyClient(clientId, clientPhone);
}

// مسح البيانات المخزنة
function clearStoredData() {
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientPhone');
    localStorage.removeItem('clientData');
    AppState.currentClient = null;
}

// ========== واجهات المستخدم ==========

// عرض واجهة تسجيل الدخول
function showLoginInterface() {
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('main-content').style.display = 'none';
}

// عرض واجهة التقييم
function showFeedbackInterface() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    // تعبئة بيانات العميل
    updateClientDisplay();
}

// تحديث عرض بيانات العميل
function updateClientDisplay() {
    if (!AppState.currentClient) return;
    
    document.getElementById('client-name').textContent = AppState.currentClient.name;
    document.getElementById('client-id-display').textContent = AppState.currentClient.id;
}

// ========== إعداد الأحداث ==========

function setupEventListeners() {
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // اختيار الإيموجي
    document.querySelectorAll('.emoji-item').forEach(item => {
        item.addEventListener('click', function() {
            selectEmoji(this, this.getAttribute('data-emoji'));
        });
    });
    
    // النجوم
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            selectStar(this.getAttribute('data-rating'));
        });
    });
    
    // نموذج التقييم
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }
    
    // إغلاق النوافذ المنبثقة
    const closeAlert = document.getElementById('close-alert');
    if (closeAlert) closeAlert.addEventListener('click', closeAlertModal);
}

// ========== نظام التقييم ==========

// اختيار الإيموجي
function selectEmoji(element, emoji) {
    document.querySelectorAll('.emoji-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    document.getElementById('selectedEmoji').value = emoji;
}

// اختيار النجوم
function selectStar(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
    document.getElementById('rating').value = rating;
}

// معالجة إرسال التقييم
async function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    if (!AppState.currentClient) {
        showAlert('خطأ', 'يرجى تسجيل الدخول أولاً', 'error');
        return;
    }

    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value.trim();
    const emoji = document.getElementById('selectedEmoji').value;

    if (!rating) {
        showAlert('خطأ', 'يرجى اختيار تقييم بالنجوم', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${AppState.backendUrl}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: AppState.currentClient.id,
                rating: parseInt(rating),
                comment: comment,
                emoji: emoji
            })
        });

        const result = await response.json();

        if (result.success) {
    showAlert('شكراً لك! 🌟', result.message, 'success');
    
    // تأخير إعادة التعيين حتى يرى المستخدم رسالة النجاح
    setTimeout(() => {
        try {
            resetForm();
        } catch (error) {
            console.warn('⚠️ لم يتم إعادة تعيين النموذج:', error);
        }
    }, 2000);
} else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ خطأ في إرسال التقييم:', error);
        showAlert('خطأ', error.message || 'حدث خطأ في إرسال التقييم', 'error');
    } finally {
        showLoading(false);
    }
}

// إعادة تعيين النموذج
// إعادة تعيين النموذج - الإصدار المصحح
function resetForm() {
    console.log('🔄 إعادة تعيين النموذج...');
    
    // إعادة تعيين النجوم
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
        star.textContent = '☆';
    });
    
    // إعادة تعيين الإيموجيز
    document.querySelectorAll('.emoji-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // إعادة تعيين الحقول
    document.getElementById('rating').value = '';
    document.getElementById('selectedEmoji').value = '😐';
    document.getElementById('comment').value = '';
    document.getElementById('char-count').textContent = '0';
    document.getElementById('char-count').style.color = '#666';
    
    // إعادة تعيين نص التقييم
    const ratingText = document.getElementById('rating-text');
    if (ratingText) {
        ratingText.textContent = 'اضغط على النجوم للتقييم';
        ratingText.classList.remove('active');
        ratingText.style.color = '#666';
    }
    
    console.log('✅ تم إعادة تعيين النموذج بنجاح');
}

// تسجيل الخروج
function logout() {
    AppState.currentClient = null;
    clearStoredData();
    showLoginInterface();
    resetForm();
}

// ========== دوال مساعدة ==========

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showAlert(title, message, type = 'info') {
    const icon = document.getElementById('alert-icon');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');
    
    if (icon && alertTitle && alertMessage) {
        // تعيين الأيقونة حسب النوع
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: '#22c55e',
            error: '#dc2626',
            info: '#3b82f6'
        };
        
        icon.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}" style="color: ${colors[type] || '#3b82f6'};"></i>`;
        alertTitle.textContent = title;
        alertTitle.style.color = colors[type] || '#3b82f6';
        alertMessage.textContent = message;
        
        document.getElementById('alert-modal').style.display = 'flex';
    }
}

function closeAlertModal() {
    document.getElementById('alert-modal').style.display = 'none';
}

// ========== إغلاق النوافذ بالضغط خارجها ==========

document.addEventListener('click', function(event) {
    // إغلاق نافذة التنبيه
    const alertModal = document.getElementById('alert-modal');
    if (alertModal && event.target === alertModal) {
        closeAlertModal();
    }
});

// ========== جعل الدوال متاحة عالمياً ==========

window.closeAlertModal = closeAlertModal;

// ========== تهيئة إضافية ==========

// إغلاق النوافذ بالضغط على Esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAlertModal();
    }
});

console.log('✅ تم تحميل نظام التقييمات بنجاح');

// ========== دوال إضافية للواجهة الجديدة ==========

// تحديث نص التقييم
function updateRatingText(rating) {
    const ratingText = document.getElementById('rating-text');
    const texts = {
        1: 'سيء جداً',
        2: 'سيء',
        3: 'متوسط',
        4: 'جيد',
        5: 'ممتاز'
    };
    ratingText.textContent = texts[rating] || 'اضغط على النجوم للتقييم';
    ratingText.style.color = '#ee5f06';
    ratingText.style.fontWeight = '600';
}

// عدّاد الأحرف
function setupCharCounter() {
    const comment = document.getElementById('comment');
    const charCount = document.getElementById('char-count');
    
    comment.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = length;
        
        if (length > 450) {
            charCount.style.color = '#dc2626';
        } else if (length > 300) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#666';
        }
    });
}

// تحديث عرض بيانات العميل
function updateClientDisplay() {
    if (!AppState.currentClient) return;
    
    document.getElementById('client-name').textContent = AppState.currentClient.name;
    document.getElementById('client-id-display').textContent = AppState.currentClient.id;
    document.getElementById('display-name').textContent = AppState.currentClient.name;
    document.getElementById('display-phone').textContent = AppState.currentClient.phone;
    
    // تنسيق تاريخ العضوية
    if (AppState.currentClient.member_since) {
        const date = new Date(AppState.currentClient.member_since);
        const formattedDate = date.toLocaleDateString('ar-EG');
        document.getElementById('display-member-since').textContent = formattedDate;
    }
}

// في initApp أضف:
function initApp() {
    setupEventListeners();
    setupCharCounter(); // ⬅️ هذه جديدة
    checkExistingSession();
}

// في selectStar أضف:
function selectStar(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
    document.getElementById('rating').value = rating;
    updateRatingText(rating); // ⬅️ هذه جديدة
}