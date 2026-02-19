// scripts/orderstate.js - الإصدار المحدث للتحقق المزدوج والمصحح
// تم إصلاح خطأ: ReferenceError: updateLoyaltyDisplay is not defined

const AppState = {
    currentClient: null,
    orders: [],
    filteredOrders: [],
    backendUrl: 'https://raslankoshary.up.railway.app/api', // 🔥 تأكد من استخدام URL الصحيح للـ backend
    currentSort: 'newest',
    currentStatus: 'all',
    currentLoyalty: null // 🔥 إضافة حالة الولاء
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
        console.log('🔄 التحقق من الجلسة السابقة لمتابعة الطلبات...');
        await verifyClient(savedClientId, savedClientPhone);
    } else {
        showLoginInterface();
    }
}

// التحقق المزدوج من العميل
async function verifyClient(clientId, clientPhone) {
    showLoading(true);
    
    try {
        console.log('🔐 التحقق من العميل لمتابعة الطلبات:', { clientId, clientPhone });
        
        const response = await fetch(`${AppState.backendUrl}/clients/${clientId}/verify?phone=${clientPhone}`);
        const result = await response.json();

        if (result.success) {
            console.log('✅ تحقق ناجح لمتابعة الطلبات:', result.data.name);
            
            // حفظ بيانات العميل
            AppState.currentClient = result.data;
            localStorage.setItem('clientId', clientId);
            localStorage.setItem('clientPhone', clientPhone);
            localStorage.setItem('clientData', JSON.stringify(result.data));
            
            // عرض واجهة الطلبات
            showOrdersInterface();
            await loadClientOrders();
            
        } else {
            console.log('❌ تحقق فاشل لمتابعة الطلبات:', result.message);
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

// عرض واجهة الطلبات
// عرض واجهة الطلبات
function showOrdersInterface() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    // تعبئة بيانات العميل
    updateClientDisplay();
    
    // 🔥 تحميل حالة الولاء (الآن تعمل بشكل صحيح)
    updateLoyaltyDisplay();
}

// تحديث عرض بيانات العميل مع الولاء
// تحديث عرض بيانات العميل مع الولاء
function updateClientDisplay() {
    if (!AppState.currentClient) return;
    
    try {
        console.log('🔄 تحديث واجهة العميل:', AppState.currentClient);
        
        // العناصر الأساسية
        const clientName = document.getElementById('client-name');
        const clientIdDisplay = document.getElementById('client-id-display');
        
        if (clientName) {
            clientName.textContent = AppState.currentClient.name || 'العميل';
            console.log('✅ تم تحديث اسم العميل:', AppState.currentClient.name);
        }
        
        if (clientIdDisplay) {
            clientIdDisplay.textContent = AppState.currentClient.id || '0';
            console.log('✅ تم تحديث رقم العميل:', AppState.currentClient.id);
        }
        
        console.log('✅ تم تحديث واجهة المستخدم بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ غير متوقع في تحديث واجهة العميل:', error);
    }
}

// **🔥 دوال الولاء المضافة لحل مشكلة ReferenceError: updateLoyaltyDisplay is not defined**

// 1. الدالة الأساسية لاستدعاء تحديث عرض الولاء
function updateLoyaltyDisplay() {
    // هذه الدالة تُستدعى مباشرة في showOrdersInterface و updateClientDisplay.
    // مهمتها هي التأكد من وجود البيانات ثم استدعاء دالة تحديث الـ UI
    if (AppState.currentLoyalty) {
        updateLoyaltyUI(AppState.currentLoyalty);
    } else {
        console.log('💡 يتم انتظار تحميل بيانات الولاء مع الطلبات.');
        // يمكن إضافة منطق تحميل البيانات هنا إذا لم تكن مرتبطة بالطلبات
    }
}

// 2. الدالة المسؤولة عن تحديث عناصر الـ HTML لـ Loyalty
// 2. الدالة المسؤولة عن تحديث عناصر الـ HTML لـ Loyalty
function updateLoyaltyUI(loyaltyData) {
    const loyaltySection = document.getElementById('loyalty-section');
    if (!loyaltySection) {
        console.warn('⚠️ لم يتم العثور على عناصر الولاء لتحديثها.');
        return;
    }

    console.log('🔥 تحديث واجهة مستخدم الولاء بـ:', loyaltyData);
    
    // إظهار قسم الولاء
    loyaltySection.style.display = 'block';
    
    // تحديث شريط التقدم
    const progressBar = document.getElementById('loyalty-progress');
    const progressText = document.getElementById('loyalty-progress-text');
    const loyaltyMessage = document.getElementById('loyalty-message');
    
    if (progressBar && progressText && loyaltyMessage) {
        const progressPercentage = Math.min(100, (loyaltyData.delivered_orders / 5) * 100);
        
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${loyaltyData.delivered_orders}/5`;
        loyaltyMessage.textContent = loyaltyData.message || 'ابدأ بجمع الطلبات للحصول على توصيل مجاني!';
        
        // تلوين الشريط حسب الحالة
        if (loyaltyData.eligible) {
            progressBar.style.backgroundColor = '#10b981'; // أخضر
            loyaltyMessage.style.color = '#10b981';
            loyaltySection.classList.add('vip-loyalty');
        } else {
            progressBar.style.backgroundColor = '#ee5f06'; // برتقالي
            loyaltyMessage.style.color = '#ee5f06';
            loyaltySection.classList.remove('vip-loyalty');
        }
    }
    
    // تحديث الإحصائيات المتقدمة
    updateAdvancedStats(loyaltyData);
    
    // تحديث شارة VIP
    updateClientLoyaltyBadge(loyaltyData);
}
// ** نهاية دوال الولاء المضافة **

// دالة مساعدة لتنسيق تاريخ العضوية
function formatMemberSince(dateString) {
    if (!dateString) return 'غير متوفر';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG');
    } catch (error) {
        console.error('خطأ في تنسيق التاريخ:', error);
        return 'غير متوفر';
    }
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
    
    // تحديث البيانات
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadClientOrders);
    }
    
    // الفلترة والترتيب
    const sortSelect = document.getElementById('sort-select');
    const statusSelect = document.getElementById('status-select');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            AppState.currentSort = this.value;
            filterAndSortOrders();
        });
    }
    
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            AppState.currentStatus = this.value;
            filterAndSortOrders();
        });
    }

    const closeOrderDetailsBtn = document.getElementById('close-order-details');
    if (closeOrderDetailsBtn) {
        closeOrderDetailsBtn.addEventListener('click', closeOrderDetails);
        console.log('✅ تم إضافة حدث الإغلاق لزر X');
    }
    
    // إغلاق النوافذ المنبثقة
    const closeAlert = document.getElementById('close-alert');
    if (closeAlert) closeAlert.addEventListener('click', closeAlertModal);
}

// ========== نظام الطلبات ==========

// تحميل طلبات العميل من الـ backend
// تحميل طلبات العميل من الـ backend
// 🔥 تأكد من استدعاء نظام الولاء عند تحميل الطلبات
// تحميل طلبات العميل من الـ backend
async function loadClientOrders() {
    showLoading(true);
    
    try {
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/orders`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        AppState.orders = result.data || [];
        
        // 🔥 تحميل بيانات الولاء
        await updateLoyaltyDisplay();
        
        // 🔥 تحميل نقاط العميل
        await loadClientPoints();
        
        // تحميل الإحصائيات
        await loadOrderStats();
        
        // تطبيق الفلترة والترتيب
        filterAndSortOrders();
        
        console.log(`✅ تم تحميل ${result.count || AppState.orders.length} طلب`);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الطلبات:', error);
        showAlert('خطأ', error.message || 'حدث خطأ في تحميل الطلبات', 'error');
    } finally {
        showLoading(false);
    }
}

// في updateLoyaltyDisplay، استخدم:
async function updateLoyaltyDisplay() {
    if (!AppState.currentClient) return;
    
    try {
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/loyalty`);
        const result = await response.json();
        
        if (result.success) {
            const loyaltyData = result.data.loyalty_status;
            
            // ⬇️ معالجة متسقة للبيانات
            AppState.currentLoyalty = {
                eligible: loyaltyData.eligible || false,
                delivered_orders: loyaltyData.delivered_orders || loyaltyData.ordersCount || 0,
                required_orders: 5, // ثابت
                message: loyaltyData.message || '',
                progress_percentage: loyaltyData.progress_percentage || 
                                   Math.min(100, ((loyaltyData.delivered_orders || 0) / 5) * 100)
            };
            
            updateLoyaltyUI(AppState.currentLoyalty);
            console.log('✅ تم تحديث حالة الولاء:', AppState.currentLoyalty);
        }
    } catch (error) {
        console.error('💥 خطأ في جلب حالة الولاء:', error);
    }
}

// 🔥 تحديث واجهة الولاء
function updateLoyaltyUI(loyalty) {
    const loyaltySection = document.getElementById('loyalty-section');
    if (!loyaltySection) {
        console.warn('⚠️ لم يتم العثور على قسم الولاء في الـ HTML');
        return;
    }

    console.log('🔥 تحديث واجهة الولاء:', loyalty);
    
    // إظهار قسم الولاء
    loyaltySection.style.display = 'block';
    const deliveredOrders = loyalty.delivered_orders || loyalty.ordersCount || 0;
    const requiredOrders = 5;     
    // تحديث شريط التقدم
    const progressBar = document.getElementById('loyalty-progress');
    const progressText = document.getElementById('loyalty-progress-text');
    const loyaltyMessage = document.getElementById('loyalty-message');
    
    if (progressBar && progressText && loyaltyMessage) {
        const progressPercentage = Math.min(100, (loyalty.delivered_orders / 5) * 100);
        
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${loyalty.delivered_orders}/5`;
        loyaltyMessage.textContent = loyalty.message || 'ابدأ بجمع الطلبات للحصول على توصيل مجاني!';
        
        // تلوين الشريط حسب الحالة
        if (loyalty.eligible) {
            progressBar.style.backgroundColor = '#10b981';
            loyaltyMessage.style.color = '#10b981';
            loyaltySection.classList.add('vip-loyalty');
        } else {
            progressBar.style.backgroundColor = '#ee5f06';
            loyaltyMessage.style.color = '#ee5f06';
            loyaltySection.classList.remove('vip-loyalty');
        }
    }
    
    // تحديث الإحصائيات المتقدمة
    updateAdvancedStats(loyalty);
    
    // تحديث شارة VIP
    updateClientLoyaltyBadge(loyalty);
}

// 🔥 تحديث الإحصائيات المتقدمة
function updateAdvancedStats(loyalty) {
    const advancedStats = document.getElementById('advanced-stats');
    if (!advancedStats) {
        console.warn('⚠️ لم يتم العثور على عنصر advanced-stats');
        return;
    }

    const progressPercentage = Math.min(100, (loyalty.delivered_orders / 5) * 100);
    
    advancedStats.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card loyalty-stat">
                <div class="stat-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${loyalty.delivered_orders}</div>
                    <div class="stat-label">طلبات مسلمة</div>
                </div>
            </div>
            <div class="stat-card progress-stat">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${progressPercentage}%</div>
                    <div class="stat-label">التقدم</div>
                </div>
            </div>
            <div class="stat-card status-stat">
                <div class="stat-icon">
                    <i class="fas ${loyalty.eligible ? 'fa-check-circle' : 'fa-clock'}"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${loyalty.eligible ? 'مؤهل' : 'قيد التقدم'}</div>
                    <div class="stat-label">حالة الولاء</div>
                </div>
            </div>
        </div>
    `;
}

// 🔥 تحديث شارة الولاء في واجهة العميل
function updateClientLoyaltyBadge(loyalty) {
    const clientName = document.getElementById('client-name');
    if (!clientName) {
        console.warn('⚠️ لم يتم العثور على عنصر client-name');
        return;
    }
    
    if (loyalty.eligible) {
        clientName.innerHTML = `${AppState.currentClient.name} <span class="vip-badge">⭐ VIP</span>`;
        console.log('✅ تم إضافة شارة VIP للعميل');
    } else {
        clientName.textContent = AppState.currentClient.name;
        console.log('ℹ️ العميل غير مؤهل لشارة VIP بعد');
    }
}
// تحميل إحصائيات الطلبات
async function loadOrderStats() {
    try {
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/orders/stats`);
        const result = await response.json();

        if (result.success) {
            updateStatistics(result.data);
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل الإحصائيات:', error);
        // استخدام الإحصائيات المحسوبة محلياً كبديل
        updateStatistics(calculateLocalStats());
    }
}

// تحديث الإحصائيات
function updateStatistics(stats) {
    const totalElement = document.getElementById('total-count');
    const pendingElement = document.getElementById('pending-count');
    const processingElement = document.getElementById('processing-count');
    const deliveredElement = document.getElementById('delivered-count');

    if (totalElement) totalElement.textContent = stats.total || 0;
    if (pendingElement) pendingElement.textContent = stats.pending || 0;
    if (processingElement) processingElement.textContent = stats.processing || 0;
    if (deliveredElement) deliveredElement.textContent = stats.delivered || 0;
}

// حساب الإحصائيات محلياً (كبديل)
function calculateLocalStats() {
    return {
        pending: AppState.orders.filter(order => order.order_state === 'pending').length,
        processing: AppState.orders.filter(order => order.order_state === 'processing').length,
        shipped: AppState.orders.filter(order => order.order_state === 'shipped').length,
        delivered: AppState.orders.filter(order => order.order_state === 'delivered').length,
        canceled: AppState.orders.filter(order => order.order_state === 'canceled').length,
        total: AppState.orders.length
    };
}

// فلترة وترتيب الطلبات
function filterAndSortOrders() {
    let filtered = [...AppState.orders];

    // تطبيق الفلترة حسب الحالة
    if (AppState.currentStatus !== 'all') {
        filtered = filtered.filter(order => order.order_state === AppState.currentStatus);
    }

    // تطبيق الترتيب
    switch (AppState.currentSort) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'amount':
            filtered.sort((a, b) => b.total_amount - a.total_amount);
            break;
    }

    AppState.filteredOrders = filtered;
    renderOrders();
}

// عرض الطلبات
function renderOrders() {
    const ordersContainer = document.getElementById('orders-container');
    const noOrders = document.getElementById('no-orders');
    
    if (!ordersContainer) return;

    if (AppState.filteredOrders.length === 0) {
        ordersContainer.innerHTML = '';
        if (noOrders) noOrders.style.display = 'block';
        return;
    }

    if (noOrders) noOrders.style.display = 'none';

    ordersContainer.innerHTML = AppState.filteredOrders.map(order => {
        // حساب subtotal من البيانات الموجودة
        const deliveryFee = (order.order_type === 'delivery' && typeof order.delivery_fee === 'undefined') 
            ? 15 // قيمة افتراضية لطلبات التوصيل
            : (order.delivery_fee || 0);

        const subtotal = order.total_amount - deliveryFee;
        
        console.log('💰 Order financials:', {
            order_id: order.order_id,
            total_amount: order.total_amount,
            delivery_fee_used: deliveryFee,
            calculated_subtotal: subtotal
        });

        return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <h3>طلب #${order.order_id}</h3>
                    <div class="order-meta">
                        <span class="meta-item">
                            <i class="fas fa-calendar"></i>
                            ${formatDate(order.created_at)}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-clock"></i>
                            ${formatTime(order.created_at)}
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-${order.order_type === 'delivery' ? 'truck' : 'utensils'}"></i>
                            ${order.order_type === 'delivery' ? 'توصيل' : 'في المطعم'}
                        </span>
                    </div>
                </div>
                <div class="order-status status-${order.order_state}">
                    ${getStatusText(order.order_state)}
                </div>
            </div>

            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">رقم الطلب:</span>
                    <span class="detail-value">#${order.order_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">المجموع:</span>
                    <span class="detail-value">${order.total_amount} ج</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">العناصر:</span>
                    <span class="detail-value">${order.order_details?.length || 0} عنصر</span>
                </div>
            </div>

            <div class="order-actions">
                <button class="btn-secondary" onclick="showOrderDetails(${order.order_id})">
                    <i class="fas fa-eye"></i>
                    عرض التفاصيل
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// ========== دوال مساعدة ==========

// الدوال المساعدة
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status) {
    const texts = {
        'pending': 'قيد الانتظار',
        'processing': 'قيد المعالجة',
        'shipped': 'تم الشحن',
        'delivered': 'تم التوصيل',
        'canceled': 'ملغي'
    };
    return texts[status] || 'غير معروف';
}

function getStatusIcon(status) {
    const icons = {
        'pending': 'fa-clock',
        'processing': 'fa-cog',
        'shipped': 'fa-shipping-fast',
        'delivered': 'fa-check-circle',
        'canceled': 'fa-times-circle'
    };
    return icons[status] || 'fa-question-circle';
}

// تسجيل الخروج
function logout() {
    AppState.currentClient = null;
    AppState.orders = [];
    AppState.filteredOrders = [];
    clearStoredData();
    showLoginInterface();
}

// ========== إدارة التحميل والتنبيهات ==========

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

// ========== تفاصيل الطلب ==========

// دالة لعرض تفاصيل الطلب الكاملة
async function showOrderDetails(order_id) {
    showLoading(true);
    
    try {
        const response = await fetch(`${AppState.backendUrl}/orders/${order_id}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const order = result.data;
        showOrderDetailsModal(order);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل تفاصيل الطلب:', error);
        showAlert('خطأ', 'حدث خطأ في تحميل تفاصيل الطلب', 'error');
    } finally {
        showLoading(false);
    }
}

// عرض التفاصيل في مودال
// عرض التفاصيل في مودال مع إضافة قسم النقاط
    function showOrderDetailsModal(order) {
    const modal = document.getElementById('order-details-modal');
    const modalContent = document.getElementById('order-details-content');
    
    if (!modal || !modalContent) return;

    const subtotal = calculateSubtotal(order.order_details || []);
    const deliveryFee = order.delivery_fee || 0;
    
     // 🔥 تعريف المتغير المطلوب
    const purchaseAmount = order.total_amount - deliveryFee; // المبلغ الأساسي للشراء
    
    // 🔥 حساب النقاط المكتسبة بالنظام الجديد (كل 10 جنيه = 1 نقطة)
    const pointsEarned = Math.floor(purchaseAmount / 10);

    const orderDetailsHTML = `
        <div class="order-details-header">
            <h3>تفاصيل الطلب #${order.order_id}</h3>
            <div class="order-status-large status-${order.order_state}">
                <i class="fas ${getStatusIcon(order.order_state)}"></i>
                ${getStatusText(order.order_state)}
            </div>
        </div>

        <div class="details-grid">
            <div class="details-section">
                <h4><i class="fas fa-user"></i> معلومات العميل</h4>
                <div class="details-list">
                    <div class="detail-row">
                        <span class="detail-label">الاسم:</span>
                        <span class="detail-value">${order.clients?.name || 'غير متوفر'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الهاتف:</span>
                        <span class="detail-value">${order.clients?.phone || 'غير متوفر'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">العنوان:</span>
                        <span class="detail-value">${order.clients?.address || 'غير متوفر'}</span>
                    </div>
                </div>
            </div>

            <div class="details-section">
                <h4><i class="fas fa-info-circle"></i> معلومات الطلب</h4>
                <div class="details-list">
                    <div class="detail-row">
                        <span class="detail-label">نوع الطلب:</span>
                        <span class="detail-value">${order.order_type === 'delivery' ? 'توصيل 🚚' : 'في المطعم 🍽️'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ الطلب:</span>
                        <span class="detail-value">${formatDate(order.created_at)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الوقت:</span>
                        <span class="detail-value">${formatTime(order.created_at)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">رقم الطلب:</span>
                        <span class="detail-value">#${order.order_id}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="details-section">
            <h4><i class="fas fa-utensils"></i> المنتجات المطلوبة</h4>
            <div class="products-list">
                ${(order.order_details || []).map(item => `
                    <div class="product-item">
                        <div class="product-info">
                            <div class="product-name">${item.menu_items?.name || 'منتج'}</div>
                            <div class="product-description">${item.menu_items?.description || ''}</div>
                        </div>
                        <div class="product-quantity">${item.quantity} ×</div>
                        <div class="product-price">${item.price} ج</div>
                        <div class="product-total">${(item.quantity * item.price).toFixed(2)} ج</div>
                    </div>
                `).join('')}
                ${(order.order_details || []).length === 0 ? `
                    <div class="no-products">
                        <i class="fas fa-info-circle"></i>
                        لا توجد منتجات في هذا الطلب
                    </div>
                ` : ''}
            </div>
        </div>
<div class="points-formula">(${purchaseAmount} ج ÷ 10 = ${pointsEarned} نقطة)</div>
        <div class="details-section">
            <h4><i class="fas fa-receipt"></i> الملخص المالي</h4>
            <div class="financial-summary">
                <div class="summary-row">
                    <span>مجموع المنتجات:</span>
                    <span>${subtotal.toFixed(2)} ج</span>
                </div>
                ${order.order_type === 'delivery' ? `
                <div class="summary-row">
                    <span>رسوم التوصيل:</span>
                    <span>${deliveryFee.toFixed(2)} ج</span>
                </div>
                ` : ''}
                ${order.discount_applied > 0 ? `
                <div class="summary-row discount">
                    <span>الخصم المطبق:</span>
                    <span>-${order.discount_applied.toFixed(2)} ج</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span>المجموع النهائي:</span>
                    <span>${order.total_amount} ج</span>
                </div>
            </div>
        </div>

        <!-- 🔥 قسم النقاط المكتسبة من هذا الطلب -->
        <div class="details-section points-section">
            <h4><i class="fas fa-coins"></i> النقاط المكتسبة</h4>
            <div class="points-summary-details">
                <div class="points-card">
                    <div class="points-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="points-info">
                        <div class="points-label">نقاط هذا الطلب</div>
                        <div class="points-value">${pointsEarned} نقطة</div>
                        <div class="points-formula">(${purchaseAmount} ج ÷ 10 = ${pointsEarned} نقطة)</div>
                    </div>
                </div>
                
                <div class="points-details">
                    <div class="points-detail-item">
                        <i class="fas fa-calculator"></i>
                        <div>
                            <div class="detail-label">قيمة الطلب:</div>
                            <div class="detail-value">${purchaseAmount} ج</div>
                        </div>
                    </div>
                    
                    <div class="points-detail-item">
                        <i class="fas fa-percentage"></i>
                        <div>
                            <div class="detail-label">معدل النقاط:</div>
                            <div class="detail-value">10 نقاط لكل جنيه</div>
                        </div>
                    </div>
                    
                    <div class="points-detail-item">
                        <i class="fas fa-gift"></i>
                        <div>
                            <div class="detail-label">قيمة النقاط:</div>
                            <div class="detail-value">${(pointsEarned / 10).toFixed(1)} جنيه</div>
                        </div>
                    </div>
                    
                    ${order.discount_applied > 0 ? `
                    <div class="points-detail-item discount">
                        <i class="fas fa-tag"></i>
                        <div>
                            <div class="detail-label">نقاط مستبدلة:</div>
                            <div class="detail-value">-${order.discount_applied * 10} نقطة</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="points-note">
                    <i class="fas fa-info-circle"></i>
                    <span>سيتم إضافة النقاط إلى رصيدك بعد تأكيد تسليم الطلب</span>
                </div>
            </div>
        </div>

        <!-- قسم حالة الولاء -->
        ${AppState.currentLoyalty ? `
        <div class="details-section loyalty-status-section">
            <h4><i class="fas fa-crown"></i> حالة الولاء</h4>
            <div class="loyalty-status-details">
                <div class="loyalty-progress-container">
                    <div class="loyalty-progress-bar">
                        <div class="loyalty-progress" style="width: ${Math.min(100, (AppState.currentLoyalty.delivered_orders / 5) * 100)}%"></div>
                    </div>
                    <div class="loyalty-progress-text">
                        <span>${AppState.currentLoyalty.delivered_orders}/5 طلبات مسلمة</span>
                    </div>
                </div>
                
                <div class="loyalty-message">
                    ${AppState.currentLoyalty.message || 'جمع الطلبات للحصول على توصيل مجاني!'}
                </div>
            </div>
        </div>
        ` : ''}
    `;

    modalContent.innerHTML = orderDetailsHTML;
    modal.style.display = 'flex';
}

// دالة حساب مجموع الطلبات
function calculateSubtotal(orderDetails) {
    if (!orderDetails || !Array.isArray(orderDetails)) {
        return 0;
    }
    
    return orderDetails.reduce((total, item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        return total + (quantity * price);
    }, 0);
}

// إغلاق مودال التفاصيل
function closeOrderDetails() {
    const modal = document.getElementById('order-details-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ========== إغلاق النوافذ ==========

// إغلاق النوافذ بالضغط خارجها
document.addEventListener('click', function(event) {
    // إغلاق نافذة التنبيه
    const alertModal = document.getElementById('alert-modal');
    if (alertModal && event.target === alertModal) {
        closeAlertModal();
    }
    
    // إغلاق نافذة التفاصيل
    const detailsModal = document.getElementById('order-details-modal');
    if (detailsModal && event.target === detailsModal) {
        closeOrderDetails();
    }
});

// إغلاق النوافذ بالضغط على Esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAlertModal();
        closeOrderDetails();
    }
});

// ========== جعل الدوال متاحة عالمياً ==========

window.showOrderDetails = showOrderDetails;
window.closeOrderDetails = closeOrderDetails;
window.closeAlertModal = closeAlertModal;

console.log('✅ تم تحميل نظام متابعة الطلبات بنجاح');

// ========== نظام النقاط ==========

// تحميل نقاط العميل
async function loadClientPoints() {
    if (!AppState.currentClient) return;
    
    try {
        console.log('🔄 جلب نقاط العميل:', AppState.currentClient.id);
        
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/points`);
        const result = await response.json();
        
        if (result.success) {
            const pointsData = result.data.points_summary; // ⬅️ اسم المتغير
            
            // تحديث حالة التطبيق
            AppState.clientPoints = pointsData?.current_points || 0;
            AppState.totalPointsEarned = pointsData?.total_earned || 0;
            AppState.totalPointsSpent = pointsData?.total_spent || 0;
            
            // تحديث الواجهة
            updatePointsDisplay(pointsData);
            
            console.log('✅ تم تحديث نقاط العميل:', pointsData);
        } else {
            console.log('❌ فشل في جلب النقاط:', result.message);
        }
    } catch (error) {
        console.error('💥 خطأ في جلب النقاط:', error);
    }
}

// إصلاح دالة updatePointsDisplay:
function updatePointsDisplay(points) {
    const currentPointsElement = document.getElementById('current-points');
    const pointsEquivalentElement = document.getElementById('points-equivalent');
    
    if (!currentPointsElement || !pointsEquivalentElement) return;
    
    // ⬇️ استخدام points بدلاً من pointsData
    const currentPoints = points?.current_points || 0;
    currentPointsElement.textContent = currentPoints.toLocaleString();
    
    // ⬇️ النظام الجديد: كل 10 نقاط = 1 جنيه
    const equivalentValue = (currentPoints / 10).toFixed(1);
    pointsEquivalentElement.textContent = `(${equivalentValue} جنيه)`;
    
    // تحديث الهيدر
    updateHeaderPoints(currentPoints);
}

// تحديث عرض النقاط
function updatePointsDisplay(points) {
    const currentPointsElement = document.getElementById('current-points');
    const pointsEquivalentElement = document.getElementById('points-equivalent');
    AppState.clientPoints = points.points_summary?.current_points || 0;
    
    if (!currentPointsElement || !pointsEquivalentElement) return;
    
    // تحديث النقاط الحالية
    const currentPoints = points.current_points || 0;
    currentPointsElement.textContent = currentPoints.toLocaleString();
    
    // تحديث القيمة المكافئة
    const equivalentValue = (currentPoints / 10).toFixed(1);
    pointsEquivalentElement.textContent = `(${equivalentValue} جنيه)`;
    
    // تحديث الهيدر إذا كان هناك عنصر للنقاط
    updateHeaderPoints(currentPoints);
}

// تحديث النقاط في الهيدر
function updateHeaderPoints(points) {
    const pointsHeaderElement = document.getElementById('points-header');
    if (!pointsHeaderElement) return;
    
    pointsHeaderElement.innerHTML = `
        <div class="points-badge">
            <span class="points-indicator">
                <i class="fas fa-coins"></i>
                ${points} نقطة
            </span>
        </div>
    `;
}

// إذا لم يكن هناك endpoint للتاريخ، استخدم:
async function loadPointsHistory() {
    if (!AppState.currentClient) return;
    
    try {
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/points/history`);
        const result = await response.json();
        
        if (result.success) {
            const history = result.data;
            
            // البيانات من الـ backend تأتي بهذا الهيكل:
            // history.history: array of transactions
            // history.summary: إحصائيات
            renderPointsHistory(history.history || [], history.summary);
        }
    } catch (error) {
        console.error('❌ خطأ في جلب تاريخ النقاط:', error);
        renderPointsHistory([], null);
    }
}

function renderPointsHistory(transactions, summary) {
    const historyContainer = document.getElementById('points-history-items');
    if (!historyContainer) return;
    
    if (!transactions || transactions.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-info-circle"></i>
                <p>لا توجد معاملات نقاط حتى الآن</p>
            </div>
        `;
        return;
    }
    
    const html = transactions.map(trans => {
        // هيكل البيانات من الـ backend:
        // {
        //     order_id: 8,
        //     points_earned: 6,
        //     points_used: 0,
        //     discount_value: 0,
        //     net_points: 6
        // }
        
        const hasEarned = trans.points_earned > 0;
        const hasUsed = trans.points_used > 0;
        
        return `
            <div class="points-transaction">
                <div class="transaction-type">
                    <i class="fas ${hasEarned ? 'fa-plus-circle earned' : 'fa-minus-circle redeemed'}"></i>
                    <div class="transaction-details">
                        <div class="transaction-title">طلب #${trans.order_id || 'غير معروف'}</div>
                        <div class="transaction-description">
                            ${hasEarned ? `+${trans.points_earned} نقطة مكتسبة` : ''}
                            ${hasUsed ? ` -${trans.points_used} نقطة مستخدمة` : ''}
                        </div>
                    </div>
                </div>
                <div class="transaction-points ${hasEarned ? 'positive' : hasUsed ? 'negative' : 'neutral'}">
                    ${hasEarned ? `+${trans.points_earned}` : hasUsed ? `-${trans.points_used}` : '0'}
                </div>
            </div>
        `;
    }).join('');
    
    historyContainer.innerHTML = html;
}

// عرض تاريخ النقاط
function renderPointsHistory(transactions) {
    const historyContainer = document.getElementById('points-history-items');
    if (!historyContainer) return;
    
    if (!transactions || transactions.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-info-circle"></i>
                <p>لا توجد معاملات نقاط حتى الآن</p>
            </div>
        `;
        return;
    }
    
    const html = transactions.map(transaction => {
        const isEarned = transaction.points > 0;
        const date = new Date(transaction.created_at || transaction.date);
        
        return `
            <div class="points-transaction">
                <div class="transaction-type">
                    <i class="fas ${isEarned ? 'fa-plus-circle earned' : 'fa-minus-circle redeemed'}"></i>
                    <div class="transaction-details">
                        <div class="transaction-title">${transaction.description || (isEarned ? 'اكتساب نقاط' : 'استبدال نقاط')}</div>
                        <div class="transaction-date">${formatDate(date)} ${formatTime(date)}</div>
                    </div>
                </div>
                <div class="transaction-points ${isEarned ? 'positive' : 'negative'}">
                    ${isEarned ? '+' : '-'}${Math.abs(transaction.points)}
                </div>
            </div>
        `;
    }).join('');
    
    historyContainer.innerHTML = html;
}

// عرض تاريخ عينة (للاختبار)
function renderSamplePointsHistory() {
    const historyContainer = document.getElementById('points-history-items');
    if (!historyContainer) return;
    
    const sampleTransactions = [
        {
            description: 'شراء كشري كبير',
            points: 350,
            date: new Date(Date.now() - 86400000) // منذ يوم
        },
        {
            description: 'خصم من الطلب',
            points: -100,
            date: new Date(Date.now() - 172800000) // منذ يومين
        },
        {
            description: 'شراء كريب جبنة',
            points: 300,
            date: new Date(Date.now() - 259200000) // منذ 3 أيام
        }
    ];
    
    renderPointsHistory(sampleTransactions);
}

// تحديث النقاط
async function refreshPoints() {
    showLoading(true);
    
    try {
        // استخدم الـ endpoint الصحيح للمزامنة
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/points/sync`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // إعادة تحميل النقاط بعد المزامنة
            await loadClientPoints();
            showAlert('تم التحديث', result.message || 'تمت مزامنة نقاطك بنجاح', 'success');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث النقاط:', error);
        showAlert('خطأ', error.message || 'فشل في تحديث النقاط', 'error');
    } finally {
        showLoading(false);
    }
}