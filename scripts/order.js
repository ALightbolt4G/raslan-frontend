// scripts/order.js - الإصدار المحدث للتحقق المزدوج

// حالة التطبيق
const AppState = {
    currentClient: null,
    menuItems: [],
    menuCategories: [],
    cart: [],
    currentOrderType: 'dine-in',
    areas: [],
    selectedArea: null,
    currentLoyalty: null,
    cilentPoints: 0,
    backendUrl: 'https://raslankoshary.up.railway.app/api' // تأكد من استخدام URL الصحيح للـ backend 
}
// نظام النقاط الجديد
const PointsSystem = {
    accumulation_rate: 10, // معامل التجميع (كل 10 جنيه = 1 نقطة)
    redemption_rate: 10,    // معامل الاستبدال (كل 10 نقاط = 1 جنيه)
    history: []            // سجل النقاط
};
// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

async function initApp() {
    await loadAreas();
    setupEventListeners();
    setupRedeemListeners();
    checkExistingSession();
}

function setupRedeemListeners() {
    // تحديث عند فتح السلة
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', function() {
            setTimeout(() => {
                if (AppState.currentClient) {
                    updateRedeemUI();
                }
            }, 100);
        });
    }
}
// ========== نظام التحقق المزدوج ==========

// التحقق من الجلسة السابقة
async function checkExistingSession() {
    const savedClientId = localStorage.getItem('clientId');
    const savedClientPhone = localStorage.getItem('clientPhone');
    
    if (savedClientId && savedClientPhone) {
        console.log('🔄 التحقق من الجلسة السابقة...');
        await verifyClient(savedClientId, savedClientPhone);
    } else {
        showLoginInterface();
    }
}

// التحقق المزدوج من العميل
async function verifyClient(clientId, clientPhone) {
    showLoading(true);
    
    try {
        console.log('🔐 التحقق من العميل:', { clientId, clientPhone });
        
        const response = await fetch(`${AppState.backendUrl}/clients/${clientId}/verify?phone=${clientPhone}`);
        const result = await response.json();

        if (result.success) {
            console.log('✅ تحقق ناجح:', result.data.name);
            
            // حفظ بيانات العميل
            AppState.currentClient = result.data;
            localStorage.setItem('clientId', clientId);
            localStorage.setItem('clientPhone', clientPhone);
            localStorage.setItem('clientData', JSON.stringify(result.data));
            
            // تحميل بيانات المنطقة
            await loadClientArea(result.data.area_id);
            
            // عرض الواجهة الرئيسية
            showMainInterface();
            await loadInitialData();
            
            showAlert('مرحباً!', `تم تسجيل الدخول بنجاح، ${result.data.name}`, 'success');
            
        } else {
            console.log('❌ تحقق فاشل:', result.message);
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

// عرض الواجهة الرئيسية
function showMainInterface() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    // تعبئة بيانات العميل
    updateClientDisplay();
}

// تحديث عرض بيانات العميل
// تحديث عرض بيانات العميل
function updateClientDisplay() {
    if (!AppState.currentClient) return;
    
    // تحديث الهيدر
    document.getElementById('client-name').textContent = AppState.currentClient.name;
    document.getElementById('client-id-display').textContent = AppState.currentClient.id;
    
    // تحديث قسم المعلومات
    document.getElementById('display-name').textContent = AppState.currentClient.name;
    document.getElementById('display-phone').textContent = AppState.currentClient.phone;
    document.getElementById('display-area').textContent = AppState.selectedArea ? AppState.selectedArea.name : 'غير محدد';
    
    // تحديث معلومات التوصيل
    document.getElementById('delivery-area').textContent = AppState.selectedArea ? AppState.selectedArea.name : 'غير محدد';
    document.getElementById('delivery-address').textContent = AppState.currentClient.address || 'لم يتم تحديد العنوان';
    document.getElementById('delivery-fee').textContent = AppState.selectedArea ? `${AppState.selectedArea.delivery_fee} ج` : '15 ج';
    
    // 🔥 تحديث حالة الولاء
    updateLoyaltyDisplay();
}

async function loadClientPoints() {
    if (!AppState.currentClient) return;
    
    try {
        // جلب نقاط العميل مع معلومات النظام الجديد
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/points?sync=true`);
        const result = await response.json();
        
        if (result.success) {
            AppState.clientPoints = result.data.points_summary.current_points;
            
            // إذا كان هناك نظام جديد، تحديث المعاملات
            if (result.data.conversion_rate) {
                PointsSystem.redemption_rate = result.data.conversion_rate.points_per_currency || 10;
            }
            
            updatePointsDisplay();
            
            // جلب سجل النقاط المصروفة
            await loadPointsHistory();
        }
    } catch (error) {
        console.error('❌ خطأ في جلب النقاط:', error);
    }
}
// جلب سجل النقاط المصروفة
async function loadPointsHistory() {
    if (!AppState.currentClient) return;
    
    try {
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/points/history`);
        const result = await response.json();
        
        if (result.success) {
            PointsSystem.history = result.data.history || [];
            console.log('📋 تم تحميل سجل النقاط:', PointsSystem.history.length, 'سجل');
        }
    } catch (error) {
        console.error('❌ خطأ في جلب سجل النقاط:', error);
    }
}
// ========== نظام الاستبدال داخل الطلب ==========

// فتح/إغلاق قسم الاستبدال
// فتح/إغلاق قسم الاستبدال
function toggleRedeemSection() {
    const redeemSection = document.getElementById('redeem-section');
    const redeemToggle = document.getElementById('redeem-toggle');
    
    if (!redeemSection) return;
    
    const isVisible = redeemSection.style.display === 'block';
    redeemSection.style.display = isVisible ? 'none' : 'block';
    
    if (redeemToggle) {
        redeemToggle.classList.toggle('active', !isVisible);
    }
    
    if (!isVisible) {
        updateRedeemUI();
    }
}
// تحديث نص المساعدة للاستبدال
// تحديث نص المساعدة للاستبدال بالنظام الجديد
function updateRedeemHelpText() {
    const helpElement = document.querySelector('.redeem-section small');
    if (helpElement) {
        helpElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 5px;">
                <i class="fas fa-info-circle"></i>
                <span>النظام الجديد: كل 10 نقاط = 1 جنيه</span>
            </div>
            <div style="margin-top: 5px; font-size: 0.85rem;">
                مثال: 30 نقطة = 3 جنيه خصم
            </div>
        `;
    }
}
// تحديث واجهة الاستبدال بالنظام الجديد
function updateRedeemUI() {
    const pointsBalance = document.getElementById('points-balance');
    const redeemBtn = document.getElementById('apply-redeem');
    const redeemInput = document.getElementById('redeem-amount');
    const redeemActions = document.getElementById('redeem-actions');
    const pointsValueDisplay = document.getElementById('points-value-display'); // ⬅️ أضف هذا العنصر
    
    if (!pointsBalance || !redeemBtn || !redeemInput) return;
    
    // تحديث رصيد النقاط
    pointsBalance.textContent = AppState.clientPoints || 0;
    
    // 🔥 تحديث قيمة النقاط بالنظام الجديد
    if (pointsValueDisplay) {
        const pointsValue = (AppState.clientPoints / PointsSystem.redemption_rate).toFixed(2);
        pointsValueDisplay.textContent = `${pointsValue} ج`;
        pointsValueDisplay.title = `قيمة نقاطك: ${pointsValue} جنيه`;
    }
    
    // 🔥 تحديث الحد الأدنى للاستبدال
    const minPoints = PointsSystem.redemption_rate; // الحد الأدنى = معامل الاستبدال
    
    if (AppState.clientPoints < minPoints) {
        redeemBtn.disabled = true;
        redeemBtn.innerHTML = `<i class="fas fa-lock"></i> رصيد غير كاف (الحد ${minPoints} نقطة)`;
        redeemInput.disabled = true;
        redeemInput.placeholder = `الحد الأدنى ${minPoints} نقطة`;
        
        if (redeemActions) redeemActions.style.display = 'none';
    } else {
        redeemBtn.disabled = false;
        redeemBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> تطبيق';
        redeemInput.disabled = false;
        redeemInput.placeholder = `${minPoints}, ${minPoints * 2}, ${minPoints * 3}...`;
        redeemInput.min = minPoints;
        redeemInput.step = minPoints;
        
        // تعيين أقصى قيمة للاستبدال
        const maxPoints = Math.min(AppState.clientPoints, 500);
        redeemInput.max = Math.floor(maxPoints / minPoints) * minPoints;
        
        // إظهار زر الإلغاء إذا كان هناك خصم معلق
        if (redeemActions && AppState.pendingDiscount > 0) {
            redeemActions.style.display = 'block';
        } else if (redeemActions) {
            redeemActions.style.display = 'none';
        }
    }
    
    // 🔥 تحديث تلميح المساعدة
    updateRedeemHelpText();
}

// تحديث معاينة الخصم
// تحديث معاينة الخصم بالنظام الجديد
function updateRedeemPreview() {
    const redeemAmount = parseInt(document.getElementById('redeem-amount').value) || 0;
    const previewElement = document.getElementById('redeem-preview');
    const minPoints = PointsSystem.redemption_rate;
    
    if (!previewElement) return;
    
    // 🔥 التحقق من الحد الأدنى ومضاعفات النظام الجديد
    if (redeemAmount < minPoints || redeemAmount % minPoints !== 0) {
        previewElement.classList.remove('show');
        return;
    }
    
    // 🔥 حساب الخصم بالنظام الجديد
    const discount = (redeemAmount / PointsSystem.redemption_rate).toFixed(2);
    
    previewElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <i class="fas fa-gift"></i>
            <span>سوف تحصل على خصم ${discount} جنيه (${redeemAmount} نقطة)</span>
        </div>
    `;
    previewElement.classList.add('show');
}

// تطبيق الاستبدال بالنظام الجديد
async function applyRedeem() {
    const redeemAmount = parseInt(document.getElementById('redeem-amount').value) || 0;
    const minPoints = PointsSystem.redemption_rate;
    
    // 🔥 التحقق من البيانات بالنظام الجديد
    if (!redeemAmount || redeemAmount < minPoints) {
        showAlert('خطأ', `الحد الأدنى للاستبدال هو ${minPoints} نقطة`, 'error');
        return;
    }
    
    // 🔥 التحقق من مضاعفات النظام الجديد
    if (redeemAmount % minPoints !== 0) {
        showAlert('خطأ', `يجب أن تكون النقاط مضاعفات ${minPoints}`, 'error');
        return;
    }
    
    if (redeemAmount > AppState.clientPoints) {
        showAlert('رصيد غير كاف', `رصيدك ${AppState.clientPoints} نقطة فقط`, 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        // 🔥 استخدام النظام الجديد لحفظ النية
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/save-redemption`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                points: redeemAmount,
            
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 🔥 تحديث الرصيد المحلي بالنظام الجديد
            AppState.clientPoints -= redeemAmount;
            
            // 🔥 حساب الخصم بالنظام الجديد
            AppState.pendingDiscount = redeemAmount / PointsSystem.redemption_rate;
            
            // تحديث الواجهة
            updatePointsDisplay();
            updateRedeemUI();
            updateCartTotal();
            
            // إخفاء المعاينة وإعادة تعيين الإدخال
            const previewElement = document.getElementById('redeem-preview');
            if (previewElement) previewElement.classList.remove('show');
            
            const redeemInput = document.getElementById('redeem-amount');
            if (redeemInput) redeemInput.value = '';
            
            // إظهار زر الإلغاء
            const redeemActions = document.getElementById('redeem-actions');
            if (redeemActions) redeemActions.style.display = 'block';
            
            showAlert('تم تفعيل الخصم! 🎉', 
                `سيتم خصم ${AppState.pendingDiscount} جنيه من طلبك (${redeemAmount} نقطة)`, 
                'success');
                
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ خطأ في الاستبدال:', error);
        showAlert('خطأ', error.message || 'فشل في تطبيق الخصم', 'error');
    } finally {
        showLoading(false);
    }
}

// إزالة الاستبدال
function removeRedeem() {
    AppState.pendingDiscount = 0;
    updateCartTotal();
    updateRedeemUI();
    showAlert('تم الإلغاء', 'تم إلغاء الخصم', 'info');
}

// تحديث الإجمالي مع الاستبدال بالنظام الجديد
function updateCartTotal() {
    const subtotal = AppState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    let deliveryFee = 0;
    let loyaltyDiscount = 0;
    
    // رسوم التوصيل
    if (AppState.currentOrderType === 'delivery') {
        if (AppState.currentLoyalty && AppState.currentLoyalty.eligible) {
            deliveryFee = 0;
            loyaltyDiscount = AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15;
        } else {
            deliveryFee = AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15;
        }
    }
    
    // 🔥 خصم النقاط المعلق بالنظام الجديد
    const pointsDiscount = AppState.pendingDiscount || 0;
    
    const total = Math.max(0, subtotal + deliveryFee - pointsDiscount);
    
    // تحديث العرض
    const subtotalElement = document.getElementById('cart-subtotal');
    const deliveryElement = document.getElementById('cart-delivery');
    const totalElement = document.getElementById('cart-total');
    
    if (subtotalElement) subtotalElement.textContent = `${subtotal} ج`;
    if (deliveryElement) deliveryElement.textContent = `${deliveryFee} ج`;
    if (totalElement) totalElement.textContent = `${total.toFixed(2)} ج`;
    
    // 🔥 تحديث عرض الخصم بالنظام الجديد
    updateDiscountDisplay(pointsDiscount, loyaltyDiscount);
    
    // إظهار/إخفاء رسوم التوصيل
    const deliverySummary = document.getElementById('delivery-summary');
    if (deliverySummary) {
        deliverySummary.style.display = AppState.currentOrderType === 'delivery' ? 'flex' : 'none';
    }
}

// تحديث عرض الخصومات
// تحديث عرض الخصومات بالنظام الجديد
function updateDiscountDisplay(pointsDiscount, loyaltyDiscount) {
    const discountElement = document.getElementById('loyalty-discount');
    const discountSection = document.getElementById('discount-section');
    const loyaltyCartMessage = document.getElementById('loyalty-cart-message');
    
    if (discountElement && discountSection) {
        const totalDiscount = pointsDiscount + (loyaltyDiscount || 0);
        
        if (totalDiscount > 0) {
            discountElement.textContent = `-${totalDiscount.toFixed(2)} ج`;
            discountSection.style.display = 'flex';
            
            // 🔥 تفصيل الخصومات بالنظام الجديد
            let discountDetails = '';
            if (pointsDiscount > 0) {
                const pointsUsed = pointsDiscount * PointsSystem.redemption_rate;
                discountDetails += `نقاط: ${pointsUsed} نقطة = ${pointsDiscount} ج\n`;
            }
            if (loyaltyDiscount > 0) discountDetails += `ولاء: ${loyaltyDiscount} ج`;
            
            discountElement.title = discountDetails;
        } else {
            discountSection.style.display = 'none';
        }
    }
    
    // رسالة الولاء
    if (loyaltyCartMessage) {
        if (loyaltyDiscount > 0) {
            loyaltyCartMessage.innerHTML = `
                <i class="fas fa-crown"></i>
                <span>توصيل مجاني! تم توفير ${loyaltyDiscount} ج 🎉</span>
            `;
            loyaltyCartMessage.style.display = 'flex';
        } else {
            loyaltyCartMessage.style.display = 'none';
        }
    }
}
// تحديث عرض النقاط بالنظام الجديد
function updatePointsDisplay() {
    // تحديث الهيدر
    const headerPoints = document.getElementById('header-points');
    const tooltipPoints = document.getElementById('tooltip-points');
    
    if (headerPoints) headerPoints.textContent = AppState.clientPoints || 0;
    if (tooltipPoints) tooltipPoints.textContent = AppState.clientPoints || 0;
    
    // 🔥 تحديث القيمة المالية بالنظام الجديد
    const pointsValue = (AppState.clientPoints / PointsSystem.redemption_rate).toFixed(2);
    const valueElement = document.getElementById('points-value');
    if (valueElement) {
        valueElement.textContent = `${pointsValue} ج`;
        valueElement.title = `كل ${PointsSystem.redemption_rate} نقاط = 1 جنيه`;
    }
    
    // تحديث قسم المعلومات
    const clientPointsElement = document.getElementById('client-points');
    if (clientPointsElement) {
        clientPointsElement.textContent = `${AppState.clientPoints} نقطة (${pointsValue} ج)`;
    }
    
    // تحديث قسم الاستبدال
    updateRedeemUI();
}
// استبدال النقاط
async function redeemPoints(pointsToRedeem, orderId) {
    if (!AppState.currentClient || !orderId) return;
    
    try {
        const response = await fetch(`${AppState.backendUrl}/orders/${orderId}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points_to_redeem: pointsToRedeem })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // تحديث النقاط المحلية
            AppState.clientPoints -= pointsToRedeem;
            updatePointsDisplay();
            
            showAlert('تم الاستبدال', `تم خصم ${result.data.discount_amount} ج من طلبك`, 'success');
            return result.data.discount_amount;
        } else {
            showAlert('خطأ', result.message, 'error');
            return 0;
        }
    } catch (error) {
        console.error('❌ خطأ في استبدال النقاط:', error);
        return 0;
    }
}

// تحديث عرض حالة الولاء
// تحديث عرض حالة الولاء
// ========== نظام الولاء لمتابعة الطلبات ==========

// تحديث عرض حالة الولاء
// 1. الدالة الأساسية لاستدعاء تحديث عرض الولاء
// تحديث عرض حالة الولاء
async function updateLoyaltyDisplay() {
    if (!AppState.currentClient) return;
    
    try {
        const response = await fetch(`${AppState.backendUrl}/clients/${AppState.currentClient.id}/loyalty`);
        const result = await response.json();
        
        if (result.success) {
            AppState.currentLoyalty = result.data.loyalty_status;
            updateLoyaltyUI(result.data.loyalty_status);
            
            // 🔥 تحديث رسوم التوصيل بناءً على الولاء
            updateDeliveryFeeBasedOnLoyalty(result.data.loyalty_status);
        }
    } catch (error) {
        console.error('❌ خطأ في جلب الولاء:', error);
    }
}
function updateDeliveryFeeBasedOnLoyalty(loyalty) {
    const deliveryFeeElement = document.getElementById('delivery-fee');
    const cartDeliveryElement = document.getElementById('cart-delivery');
    
    if (!deliveryFeeElement || !cartDeliveryElement) return;
    
    if (loyalty.eligible && AppState.currentOrderType === 'delivery') {
        // توصيل مجاني للعملاء المميزين
        deliveryFeeElement.textContent = '0 ج 🎉';
        cartDeliveryElement.textContent = '0 ج 🎉';
        deliveryFeeElement.style.color = '#10b981';
        cartDeliveryElement.style.color = '#10b981';
    } else {
        // رسوم عادية
        const fee = AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15;
        deliveryFeeElement.textContent = `${fee} ج`;
        cartDeliveryElement.textContent = `${fee} ج`;
        deliveryFeeElement.style.color = '';
        cartDeliveryElement.style.color = '';
    }
}

// تحديث واجهة الولاء
function updateLoyaltyUI(loyalty) {
    const loyaltySection = document.getElementById('loyalty-section');
    if (!loyaltySection) {
        console.warn('⚠️ لم يتم العثور على قسم الولاء في الـ HTML');
        return;
    }

    console.log('🔥 تحديث واجهة الولاء:', loyalty);
    
    // إظهار قسم الولاء
    loyaltySection.style.display = 'block';
    
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

// تحديث شارة الولاء في واجهة العميل
function updateClientLoyaltyBadge(loyalty) {
    const clientName = document.getElementById('client-name');
    if (!clientName) return;
    
    if (loyalty.eligible) {
        clientName.innerHTML = `${AppState.currentClient.name} <span class="vip-badge">⭐ VIP</span>`;
    } else {
        clientName.textContent = AppState.currentClient.name;
    }
}
// تحديث الإحصائيات المتقدمة
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

// تحديث شارة الولاء في واجهة العميل
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
// تحديث الإحصائيات المتقدمة
// تحديث الإحصائيات المتقدمة
function updateAdvancedStats(loyalty) {
    const advancedStats = document.getElementById('advanced-stats');
    if (!advancedStats) return;
    
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

// تحديث شارة الولاء في واجهة العميل
function updateClientLoyaltyBadge(loyalty) {
    const clientName = document.getElementById('client-name');
    if (!clientName) return;
    
    if (loyalty.eligible) {
        clientName.innerHTML = `${AppState.currentClient.name} <span class="vip-badge">⭐ VIP</span>`;
    } else {
        clientName.textContent = AppState.currentClient.name;
    }
}

// حساب نسبة التقدم
function calculateProgressPercentage(deliveredOrders, requiredOrders = 5) {
    return Math.min(100, (deliveredOrders / requiredOrders) * 100);
}
// تحديث واجهة الولاء
// تحديث واجهة الولاء
function updateLoyaltyUI(loyalty) {
    const loyaltySection = document.getElementById('loyalty-section');
    if (!loyaltySection) return;
    
    // إظهار قسم الولاء
    loyaltySection.style.display = 'block';
    
    // تحديث شريط التقدم
    const progressBar = document.getElementById('loyalty-progress');
    const progressText = document.getElementById('loyalty-progress-text');
    const loyaltyMessage = document.getElementById('loyalty-message');
    
    if (progressBar && progressText && loyaltyMessage) {
        progressBar.style.width = `${loyalty.progress_percentage}%`;
        progressText.textContent = `${loyalty.delivered_orders}/${loyalty.required_orders}`;
        loyaltyMessage.textContent = loyalty.message;
        
        // تلوين الشريط حسب الحالة
        if (loyalty.eligible) {
            progressBar.style.backgroundColor = '#10b981'; // أخضر
            loyaltyMessage.style.color = '#10b981';
            loyaltySection.classList.add('vip-loyalty');
        } else {
            progressBar.style.backgroundColor = '#ee5f06'; // برتقالي
            loyaltyMessage.style.color = '#ee5f06';
            loyaltySection.classList.remove('vip-loyalty');
        }
    }
    
    // ✅ استبدال الدالة المفقودة بالكود المباشر
    updateDeliveryFeeDisplay(loyalty);
    
    // تحديث واجهة العميل
    updateClientLoyaltyBadge(loyalty);
}
// تحديث شارة الولاء في واجهة العميل
function updateClientLoyaltyBadge(loyalty) {
    const clientName = document.getElementById('client-name');
    if (!clientName) return;
    
    if (loyalty.eligible) {
        clientName.innerHTML = `${AppState.currentClient.name} <span class="vip-badge">⭐ VIP</span>`;
    } else {
        clientName.textContent = AppState.currentClient.name;
    }
}

// تحديث عرض رسوم التوصيل بناءً على حالة الولاء
function updateDeliveryFeeDisplay(loyalty) {
    const deliveryFeeElement = document.getElementById('delivery-fee');
    const deliveryFeeCart = document.getElementById('cart-delivery');
    
    console.log('🔄 تحديث عرض رسوم التوصيل:', { 
        eligible: loyalty.eligible, 
        deliveryFee: AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15 
    });
    
    if (deliveryFeeElement) {
        if (loyalty.eligible) {
            deliveryFeeElement.textContent = '0 ج 🎉';
            deliveryFeeElement.style.color = '#10b981';
            deliveryFeeElement.style.fontWeight = 'bold';
            deliveryFeeElement.classList.add('delivery-free');
        } else {
            const fee = AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15;
            deliveryFeeElement.textContent = `${fee} ج`;
            deliveryFeeElement.style.color = '';
            deliveryFeeElement.style.fontWeight = '';
            deliveryFeeElement.classList.remove('delivery-free');
        }
    }
    
    if (deliveryFeeCart) {
        if (loyalty.eligible) {
            deliveryFeeCart.textContent = '0 ج 🎉';
            deliveryFeeCart.style.color = '#10b981';
            deliveryFeeCart.classList.add('delivery-free');
        } else {
            const fee = AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15;
            deliveryFeeCart.textContent = `${fee} ج`;
            deliveryFeeCart.style.color = '';
            deliveryFeeCart.classList.remove('delivery-free');
        }
    }
    
    // تحديث رسالة الولاء في السلة
    const loyaltyCartMessage = document.getElementById('loyalty-cart-message');
    const loyaltyCartText = document.getElementById('loyalty-cart-text');
    
    if (loyaltyCartMessage && loyaltyCartText) {
        if (loyalty.eligible) {
            loyaltyCartText.textContent = 'أنت تحصل على توصيل مجاني! 🎉';
            loyaltyCartMessage.style.display = 'flex';
        } else {
            loyaltyCartMessage.style.display = 'none';
        }
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
    
    // خيارات مكان الأكل
    document.querySelectorAll('.order-option').forEach(option => {
        option.addEventListener('click', function() {
            setOrderType(this.dataset.type);
        });
    });
    
    // زر عرض قسم الاستبدال
    const redeemToggle = document.getElementById('redeem-toggle');
    if (redeemToggle) {
        redeemToggle.addEventListener('click', toggleRedeemSection);
    }
    
    // زر تطبيق الاستبدال
    const applyRedeemBtn = document.getElementById('apply-redeem');
    if (applyRedeemBtn) {
        applyRedeemBtn.addEventListener('click', applyRedeem);
    }
    
    // إدخال مبلغ الاستبدال
    const redeemInput = document.getElementById('redeem-amount');
    if (redeemInput) {
        redeemInput.addEventListener('input', updateRedeemPreview);
    }
    
    // إدارة السلة
    setupCartEventListeners();
    
    // إرسال الطلب
    const submitOrderBtn = document.getElementById('submit-order');
    if (submitOrderBtn) {
        submitOrderBtn.addEventListener('click', handleOrderSubmit);
    }
}

function setupCartEventListeners() {
    // أيقونة السلة
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) cartIcon.addEventListener('click', toggleCartModal);
    
    // نافذة الكمية
    const decreaseQty = document.getElementById('decrease-qty');
    const increaseQty = document.getElementById('increase-qty');
    const quantityInput = document.getElementById('quantity-input');
    const cancelQty = document.getElementById('cancel-qty');
    const addToCart = document.getElementById('add-to-cart');
    
    if (decreaseQty) decreaseQty.addEventListener('click', decreaseQuantity);
    if (increaseQty) increaseQty.addEventListener('click', increaseQuantity);
    if (quantityInput) quantityInput.addEventListener('input', validateQuantity);
    if (cancelQty) cancelQty.addEventListener('click', closeQuantityModal);
    if (addToCart) addToCart.addEventListener('click', addToCartFromModal);
    
    // نافذة السلة
    const closeCart = document.getElementById('close-cart');
    const continueShopping = document.getElementById('continue-shopping');
    const checkoutBtn = document.getElementById('checkout');
    
    if (closeCart) closeCart.addEventListener('click', closeCartModal);
    if (continueShopping) continueShopping.addEventListener('click', closeCartModal);
    if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToCheckout);
    
    // التنبيهات
    const closeAlert = document.getElementById('close-alert');
    if (closeAlert) closeAlert.addEventListener('click', closeAlertModal);
     const redeemToggle = document.getElementById('redeem-toggle');
    if (redeemToggle) {
        redeemToggle.addEventListener('click', function() {
            toggleRedeemSection();
            // إضافة/إزالة class للزر
            this.classList.toggle('active');
        });
    }
    
    // زر تطبيق الاستبدال
    const applyRedeemBtn = document.getElementById('apply-redeem');
    if (applyRedeemBtn) {
        applyRedeemBtn.addEventListener('click', applyRedeem);
    }
    
    // إدخال مبلغ الاستبدال
    const redeemInput = document.getElementById('redeem-amount');
    if (redeemInput) {
        redeemInput.addEventListener('input', updateRedeemPreview);
    }
}

// تحديث دالة openCartModal:
function openCartModal() {
    renderCartItems();
    updateCartTotal();
    
    // إظهار قسم الاستبدال إذا كان العميل لديه نقاط
    if (AppState.currentClient && AppState.clientPoints >= 10) {
        updateRedeemUI();
    }
    
    document.getElementById('cart-modal').style.display = 'flex';
}

// ========== نظام الطلبات ==========

// تحميل البيانات الأولية
async function loadInitialData() {
    await loadMenuData();
    await loadClientPoints(); // ⬅️ أضف هذا
    await updateLoyaltyDisplay(); // ⬅️ وأضف هذا
    updateClientDisplay();
}

// تحميل المناطق
async function loadAreas() {
    try {
        const response = await fetch(`${AppState.backendUrl}/areas`);
        const result = await response.json();
        
        if (result.success) {
            AppState.areas = result.data;
            console.log('✅ تم تحميل المناطق:', result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ فشل تحميل المناطق:', error);
        loadDefaultAreas();
    }
}

// تحميل بيانات المنطقة للعميل
async function loadClientArea(areaId) {
    if (!areaId) {
        AppState.selectedArea = { id: 0, name: 'غير محدد', delivery_fee: 15 };
        return;
    }
    
    const area = AppState.areas.find(a => a.id === parseInt(areaId));
    AppState.selectedArea = area || { id: 0, name: 'غير محدد', delivery_fee: 15 };
}

// ========== إدارة السلة ==========

// فتح نافذة الكمية
function openQuantityModal(itemCode) {
    const item = AppState.menuItems.find(i => i.unique_code === itemCode);
    if (!item) return;
    
    document.getElementById('modal-item-name').textContent = item.name;
    document.getElementById('quantity-input').value = 1;
    
    const modal = document.getElementById('quantity-modal');
    modal.style.display = 'flex';
    modal.dataset.currentItem = itemCode;
}

// إضافة إلى السلة
// في دالة addToCartFromModal، تأكد من إرسال البيانات بالشكل الصحيح
function addToCartFromModal() {
    const modal = document.getElementById('quantity-modal');
    const quantityInput = document.getElementById('quantity-input');
    
    if (!modal || !quantityInput) return;
    
    const itemCode = modal.dataset.currentItem;
    const quantity = parseInt(quantityInput.value);
    const item = AppState.menuItems.find(i => i.unique_code === itemCode);
    
    if (!item) return;
    
    // التحقق من الكمية
    if (quantity < 1 || quantity > 50) {
        showAlert('خطأ', 'الكمية يجب أن تكون بين 1 و 50', 'error');
        return;
    }
    
    // إضافة/تحديث السلة بالبيانات الكاملة
    const existingIndex = AppState.cart.findIndex(cartItem => cartItem.unique_code === itemCode);
    
    if (existingIndex > -1) {
        AppState.cart[existingIndex].quantity += quantity;
    } else {
        AppState.cart.push({
            unique_code: item.unique_code,
            name: item.name,
            price: item.price,
            quantity: quantity,
            item_id: item.id // إضافة ID إذا كان مطلوباً
        });
    }
    
    updateCartUI();
    closeQuantityModal();
    showAlert('تم الإضافة', `تم إضافة ${quantity} من ${item.name} إلى السلة`, 'success');
}

// تحديث واجهة السلة
function updateCartUI() {
    const totalItems = AppState.cart.reduce((total, item) => total + item.quantity, 0);
    const cartCount = document.getElementById('cart-count');
    const cartIcon = document.getElementById('cart-icon');
    
    if (cartCount) cartCount.textContent = totalItems;
    if (cartIcon) cartIcon.style.display = totalItems > 0 ? 'flex' : 'none';
    
    updateCartTotal();
}

// تحديث الإجمالي
// تحديث الإجمالي مع تطبيق الولاء
function updateCartTotal() {
    const subtotal = AppState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    let deliveryFee = 0;
    let loyaltyDiscount = 0;
    
    if (AppState.currentOrderType === 'delivery') {
        // 🔥 تطبيق الولاء على رسوم التوصيل
        if (AppState.currentLoyalty && AppState.currentLoyalty.eligible) {
            // توصيل مجاني للعملاء المميزين
            deliveryFee = 0;
            loyaltyDiscount = AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15;
        } else {
            deliveryFee = AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15;
        }
    }
    
    const total = subtotal + deliveryFee;
    
    // تحديث العرض
    document.getElementById('cart-subtotal').textContent = `${subtotal} ج`;
    document.getElementById('cart-delivery').textContent = `${deliveryFee} ج`;
    document.getElementById('cart-total').textContent = `${total} ج`;
    
    // 🔥 تحديث عرض الخصم
    updateLoyaltyDiscountDisplay(loyaltyDiscount);
    
    // إظهار/إخفاء رسوم التوصيل
    const deliverySummary = document.getElementById('delivery-summary');
    if (deliverySummary) {
        deliverySummary.style.display = AppState.currentOrderType === 'delivery' ? 'flex' : 'none';
    }
}

// تحديث عرض خصم الولاء
function updateLoyaltyDiscountDisplay(discount) {
    const discountElement = document.getElementById('loyalty-discount');
    const discountSection = document.getElementById('discount-section');
    
    if (discountElement && discountSection) {
        if (discount > 0) {
            discountElement.textContent = `-${discount} ج`;
            discountSection.style.display = 'flex';
        } else {
            discountSection.style.display = 'none';
        }
    }
}

// ========== إرسال الطلب ==========

async function handleOrderSubmit() {
    if (!validateOrder()) return;

    try {
        // تحضير بيانات الطلب
        const orderData = {
            client_id: AppState.currentClient.id,
            order_type: AppState.currentOrderType,
            items: AppState.cart.map(item => ({
                unique_code: item.unique_code,
                quantity: item.quantity,
                price: item.price,
                name: item.name
            })),
            address: AppState.currentClient.address || '',
            area_id: AppState.selectedArea ? AppState.selectedArea.id : null
        };

        console.log('🔄 إرسال الطلب:', orderData);

        const response = await fetch(`${AppState.backendUrl}/orders`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();
        
        console.log('📊 استجابة الـ Backend:', result);
        
        if (result.success) {
    console.log('✅ تم إنشاء الطلب بنجاح:', result.data);
    
    const orderId = result.data.order_id;
    
    // 🔥 إرسال جميع بيانات الـ Backend إلى دالة واتساب
    if (orderId) {
        sendWhatsAppOrder(orderId, result.data.totals?.final_amount, result.data);
    } else {
        sendWhatsAppOrder(`ORDER-${Date.now()}`, 
                         result.data.totals?.final_amount || calculateTotalLocally(), 
                         result.data);
    }
            const totalAmount = result.data.totals?.final_amount;
            
            console.log('🔍 استخراج البيانات:', {
                orderId,
                totalAmount,
                dataKeys: result.data.totals,
                dataStructure: result.data
            });
            
             if (!orderId || totalAmount === undefined) {
                console.error('❌ بيانات الطلب غير مكتملة من الـ Backend:', result.data);
                
                // محاولة الحصول على الإجمالي من مكان آخر
                const alternativeAmount = result.data.totals?.final_amount || 
                                        result.data.total_amount || 
                                        calculateTotalLocally();
                
                if (orderId && alternativeAmount !== undefined) {
                    console.log('🔄 استخدام قيمة بديلة للإجمالي:', alternativeAmount);
                    sendWhatsAppOrder(orderId, alternativeAmount);
                } else {
                    showAlert('تحذير', 'تم إنشاء الطلب لكن هناك مشكلة في البيانات', 'warning');
                }
            } else {
                // إرسال واتساب
                sendWhatsAppOrder(orderId, totalAmount);
            }
            
            // إعادة تعيين الخصم المعلق
            AppState.pendingDiscount = 0;
            
            // تحديث البيانات
            await updateLoyaltyDisplay();
            await loadClientPoints();
            
            // تحديث حالة الولاء
            if (result.data.loyalty) {
                AppState.currentLoyalty = result.data.loyalty;
                updateLoyaltyUI(result.data.loyalty);
            }
            
            clearCart();
            showAlert('تم الطلب', `تم إنشاء الطلب بنجاح برقم ${orderId}`, 'success');
            
        } else {
            throw new Error(result.message || 'حدث خطأ في إنشاء الطلب');
        }
        
    } catch (error) {
        console.error('❌ خطأ في إرسال الطلب:', error);
        showAlert('خطأ', error.message || 'حدث خطأ في إرسال الطلب', 'error');
    }
}
// التحقق من الطلب
function validateOrder() {
    // التحقق من وجود عناصر في السلة
    if (AppState.cart.length === 0) {
        showAlert('خطأ', 'السلة فارغة. يرجى إضافة عناصر للطلب', 'error');
        return false;
    }
    
    // التحقق من صحة العناصر في السلة
    for (const item of AppState.cart) {
        if (!item.unique_code || !item.name || !item.price || !item.quantity) {
            showAlert('خطأ', 'يوجد خطأ في بيانات العناصر المضافة', 'error');
            return false;
        }
        
        if (item.quantity < 1 || item.quantity > 50) {
            showAlert('خطأ', `الكمية لـ ${item.name} غير صالحة`, 'error');
            return false;
        }
    }
    
    // التحقق من بيانات التوصيل إذا كان الطلب توصيل
    if (AppState.currentOrderType === 'delivery') {
        if (!AppState.currentClient.address || AppState.currentClient.address.trim() === '') {
            showAlert('خطأ', 'يرجى تحديد العنوان للتوصيل', 'error');
            return false;
        }
        
        if (!AppState.selectedArea || !AppState.selectedArea.id) {
            showAlert('خطأ', 'يرجى تحديد منطقة التوصيل', 'error');
            return false;
        }
    }
    
    // التحقق من وجود العميل
    if (!AppState.currentClient || !AppState.currentClient.id) {
        showAlert('خطأ', 'بيانات العميل غير صالحة', 'error');
        return false;
    }
    
    return true;
}

// إضافة دالة لفحص الاتصال بالـ API
async function testOrderAPI() {
    try {
        console.log('🧪 فحص اتصال الـ API...');
        
        const testData = {
            client_id: AppState.currentClient.id,
            order_type: 'dine-in',
            items: [{
                unique_code: 'TEST001',
                name: 'عنصر تجريبي',
                price: 10,
                quantity: 1
            }],
            address: 'عنوان تجريبي'
        };

        const response = await fetch(`${AppState.backendUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        console.log('نتيجة الفحص:', {
            status: response.status,
            ok: response.ok
        });

        return response.ok;
    } catch (error) {
        console.error('فشل فحص الـ API:', error);
        return false;
    }
}

// استدعاء الفحص عند التحميل (اختياري)
// testOrderAPI();
// ========== دوال مساعدة ==========

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = show ? 'flex' : 'none';
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
        
        icon.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}"></i>`;
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        
        // تلوين الخلفية حسب النوع
        const modal = document.querySelector('.alert-modal');
        if (modal) {
            modal.style.backgroundColor = type === 'success' ? '#d4edda' : 
                                         type === 'error' ? '#f8d7da' : '#d1ecf1';
        }
        
        document.getElementById('alert-modal').style.display = 'flex';
    }
}

// ========== دوال إضافية مكملة ==========

// إرسال الطلب عبر واتساب
// إرسال الطلب عبر واتساب مع معلومات الولاء
function sendWhatsAppOrder(orderId, totalAmount, backendData = null) {
    try {
        console.log('📤 إرسال واتساب مع البيانات:', {
            orderId,
            totalAmount,
            backendData: backendData || 'لا توجد بيانات إضافية'
        });
        
        // 🔥 إذا أتت بيانات إضافية من الـ Backend، استخدمها
        if (backendData && backendData.totals) {
            console.log('🎯 استخدام بيانات الـ Backend الكاملة:', backendData);
            
            // استخدام البيانات من الـ Backend
            const subtotal = backendData.totals.subtotal || 0;
            const deliveryFee = backendData.totals.delivery_fee || 0;
            const discountApplied = backendData.totals.discount_applied || 0;
            const finalAmount = backendData.totals.final_amount || totalAmount;
            
            // استخدام بيانات النقاط من الـ Backend
            const pointsUsed = backendData.points?.used || 0;
            const pointsDiscount = backendData.points?.discount_value || 0;
            const pointsEarned = backendData.points?.earned || 0;
            const pointsBalance = backendData.points?.current_balance || AppState.clientPoints;
            
            // إنشاء الرسالة مع البيانات الكاملة
            createWhatsAppWithBackendData(
                orderId,
                finalAmount,
                subtotal,
                deliveryFee,
                discountApplied,
                pointsUsed,
                pointsDiscount,
                pointsEarned,
                pointsBalance,
                backendData.loyalty
            );
            
        } else {
            // الإصدار العادي
            createWhatsAppMessage(orderId, totalAmount);
        }
        
    } catch (error) {
        console.error('❌ خطأ في إرسال واتساب:', error);
        sendEmergencyWhatsApp(orderId);
    }
}

// 🔥 دالة جديدة تستخدم بيانات الـ Backend الكاملة
function createWhatsAppWithBackendData(
    orderId, 
    finalAmount, 
    subtotal, 
    deliveryFee, 
    discountApplied,
    pointsUsed,
    pointsDiscount,
    pointsEarned,
    pointsBalance,
    loyaltyData
) {
    const messageParts = [];
    
    // العنوان
    messageParts.push(`🎯 *طلب جديد - كشري وكريب رسلان*`);
    messageParts.push(`🆔 رقم الطلب: ${orderId}`);
    messageParts.push(`👤 العميل: ${AppState.currentClient.name}`);
    messageParts.push(`📞 الهاتف: ${AppState.currentClient.phone}`);
    messageParts.push('');
    
    // تفاصيل الطلب من السلة
    messageParts.push(`🛒 *تفاصيل الطلب:*`);
    
    AppState.cart.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        
        messageParts.push(`${index + 1}. ${item.name}`);
        messageParts.push(`   ▫️ الكمية: ${item.quantity}`);
        messageParts.push(`   ▫️ السعر: ${item.price} ج`);
        messageParts.push(`   ▫️ الإجمالي: ${itemTotal} ج`);
        
        if (index < AppState.cart.length - 1) {
            messageParts.push('   ───');
        }
    });
    
    messageParts.push('');
    
    // الملخص المالي (من الـ Backend)
    messageParts.push(`💰 *الملخص المالي:*`);
    messageParts.push(`   المجموع الفرعي: ${subtotal} ج`);
    
    if (deliveryFee > 0) {
        messageParts.push(`   رسوم التوصيل: ${deliveryFee} ج`);
    } else if (deliveryFee === 0 && AppState.currentOrderType === 'delivery') {
        messageParts.push(`   رسوم التوصيل: 0 ج 🎉`);
    }
    
    if (discountApplied > 0) {
        messageParts.push(`   خصم النقاط: -${discountApplied} ج`);
        messageParts.push(`     (تم استبدال ${pointsUsed} نقطة)`);
    }
    
    messageParts.push('   ──────────');
    messageParts.push(`   *الإجمالي النهائي: ${finalAmount} ج*`);
    messageParts.push('');
    
    // الولاء (من الـ Backend)
    if (loyaltyData) {
        messageParts.push(`⭐ *برنامج الولاء:*`);
        
        if (loyaltyData.eligible) {
            messageParts.push(`   ✅ أنت مؤهل للتوصيل المجاني!`);
            messageParts.push(`   لديك ${loyaltyData.delivered_orders} طلبات مسلمة`);
        } else {
            messageParts.push(`   لديك ${loyaltyData.delivered_orders} طلبات مسلمة`);
            const remaining = 5 - loyaltyData.delivered_orders;
            messageParts.push(`   متبقي ${remaining} طلب للحصول على توصيل مجاني`);
        }
        messageParts.push('');
    }
    
    // النقاط (من الـ Backend)
    messageParts.push(`💎 *معلومات النقاط:*`);
    
    if (pointsUsed > 0) {
        messageParts.push(`   النقاط المستخدمة: ${pointsUsed} نقطة`);
        messageParts.push(`   قيمة الخصم: ${pointsDiscount} ج`);
    }
    
    messageParts.push(`   النقاط المكتسبة: ${pointsEarned} نقطة`);
    messageParts.push(`   الرصيد الجديد: ${pointsBalance} نقطة`);
    
    const pointsValue = (pointsBalance / PointsSystem.redemption_rate).toFixed(2);
    messageParts.push(`   (${pointsBalance} ÷ ${PointsSystem.redemption_rate} = ${pointsValue} ج)`);
    messageParts.push('');
    
    // معلومات التوصيل
    if (AppState.currentOrderType === 'delivery') {
        messageParts.push(`📍 *معلومات التوصيل:*`);
        const areaName = AppState.selectedArea ? AppState.selectedArea.name : 'غير محدد';
        const address = AppState.currentClient.address || 'لم يتم تحديد العنوان';
        
        messageParts.push(`   المنطقة: ${areaName}`);
        messageParts.push(`   العنوان: ${address}`);
        messageParts.push('');
    }
    
    // الخاتمة
    messageParts.push(`⏰ ${new Date().toLocaleString('ar-EG')}`);
    messageParts.push(`📱 تطبيق كشري رسلان`);
    messageParts.push(`شكراً لثقتك بنا! 🙏`);
    
    // إرسال الرسالة
    sendWhatsAppToPhone(messageParts.join('\n'));
}

// 🔥 دالة إنشاء رسالة واتساب
function createWhatsAppMessage(orderId, totalAmount) {
    try {
        // إنشاء أجزاء الرسالة
        const messageParts = [];
        
        // العنوان
        messageParts.push(`🎯 *طلب جديد - كشري وكريب رسلان*`);
        messageParts.push(`🆔 رقم الطلب: ${orderId}`);
        messageParts.push(`👤 العميل: ${AppState.currentClient.name}`);
        messageParts.push(`📞 الهاتف: ${AppState.currentClient.phone}`);
        messageParts.push('');
        
        // تفاصيل الطلب
        messageParts.push(`🛒 *تفاصيل الطلب:*`);
        
        let subtotal = 0;
        AppState.cart.forEach((item, index) => {
            const itemTotal = item.quantity * item.price;
            subtotal += itemTotal;
            
            messageParts.push(`${index + 1}. ${item.name}`);
            messageParts.push(`   ▫️ الكمية: ${item.quantity}`);
            messageParts.push(`   ▫️ السعر: ${item.price} ج`);
            messageParts.push(`   ▫️ الإجمالي: ${itemTotal} ج`);
            
            if (index < AppState.cart.length - 1) {
                messageParts.push('   ───');
            }
        });
        
        messageParts.push('');
        
        // الملخص المالي
        messageParts.push(`💰 *الملخص المالي:*`);
        messageParts.push(`   المجموع الفرعي: ${subtotal.toFixed(2)} ج`);
        
        // رسوم التوصيل
        if (AppState.currentOrderType === 'delivery') {
            let deliveryFee = 0;
            if (AppState.currentLoyalty && AppState.currentLoyalty.eligible) {
                deliveryFee = 0;
                messageParts.push(`   رسوم التوصيل: 0 ج 🎉`);
            } else {
                deliveryFee = AppState.selectedArea ? AppState.selectedArea.delivery_fee : 15;
                messageParts.push(`   رسوم التوصيل: ${deliveryFee} ج`);
            }
        }
        
        // خصم النقاط
        const pendingDiscount = AppState.pendingDiscount || 0;
        if (pendingDiscount > 0) {
            const pointsUsed = pendingDiscount * PointsSystem.redemption_rate;
            messageParts.push(`   خصم النقاط: -${pendingDiscount.toFixed(2)} ج`);
            messageParts.push(`     (${pointsUsed} نقطة)`);
        }
        
        messageParts.push('   ──────────');
        messageParts.push(`   *الإجمالي النهائي: ${parseFloat(totalAmount).toFixed(2)} ج*`);
        messageParts.push('');
        
        // الولاء
        if (AppState.currentLoyalty) {
            messageParts.push(`⭐ *برنامج الولاء:*`);
            const remaining = 5 - AppState.currentLoyalty.delivered_orders;
            
            if (AppState.currentLoyalty.eligible) {
                messageParts.push(`   ✅ أنت مؤهل للتوصيل المجاني!`);
                messageParts.push(`   لديك ${AppState.currentLoyalty.delivered_orders} طلبات مسلمة`);
            } else {
                messageParts.push(`   لديك ${AppState.currentLoyalty.delivered_orders} طلبات مسلمة`);
                messageParts.push(`   متبقي ${remaining} طلب للحصول على توصيل مجاني`);
            }
            messageParts.push('');
        }
        
        // النقاط
        if (AppState.clientPoints > 0) {
            const pointsValue = (AppState.clientPoints / PointsSystem.redemption_rate).toFixed(2);
            messageParts.push(`💎 *رصيد النقاط:*`);
            messageParts.push(`   ${AppState.clientPoints} نقطة (${pointsValue} ج)`);
            messageParts.push(`   كل ${PointsSystem.redemption_rate} نقاط = 1 جنيه`);
            messageParts.push('');
        }
        
        // التوصيل
        if (AppState.currentOrderType === 'delivery') {
            messageParts.push(`📍 *معلومات التوصيل:*`);
            const areaName = AppState.selectedArea ? AppState.selectedArea.name : 'غير محدد';
            const address = AppState.currentClient.address || 'لم يتم تحديد العنوان';
            
            messageParts.push(`   المنطقة: ${areaName}`);
            messageParts.push(`   العنوان: ${address}`);
            messageParts.push('');
        }
        
        // الخاتمة
        messageParts.push(`⏰ ${new Date().toLocaleString('ar-EG')}`);
        messageParts.push(`📱 تطبيق كشري رسلان`);
        messageParts.push(`شكراً لثقتك بنا! 🙏`);
        
        // إرسال الرسالة
        sendWhatsAppToPhone(messageParts.join('\n'));
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء الرسالة:', error);
        throw error;
    }
}

// 🔥 دالة إرسال واتساب
function sendWhatsAppToPhone(message) {
    const phoneNumber = "201011899997";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    console.log('🔗 رابط واتساب:', whatsappUrl);
    
    // فتح واتساب
    window.open(whatsappUrl, '_blank');
}

// 🔥 نسخة طوارئ
function sendEmergencyWhatsApp() {
    try {
        let message = `🚨 طلب جديد\n`;
        message += `العميل: ${AppState.currentClient?.name || 'غير معروف'}\n`;
        message += `الهاتف: ${AppState.currentClient?.phone || 'غير معروف'}\n\n`;
        
        AppState.cart.forEach(item => {
            message += `${item.name} × ${item.quantity}\n`;
        });
        
        message += `\n⏰ ${new Date().toLocaleString('ar-EG')}`;
        
        sendWhatsAppToPhone(message);
        
    } catch (error) {
        console.error('❌ فشل كامل في إرسال واتساب:', error);
        showAlert('خطأ', 'تعذر إرسال الطلب، يرجى الاتصال يدوياً', 'error');
    }
}

// 🔥 دالة مساعدة لإرسال رسالة واتساب
function sendWhatsAppMessage(message) {
    try {
        const phoneNumber = "201011899997";
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        // طباعة الرسالة في الكونسول للمراجعة
        console.log('📋 رسالة واتساب للمراجعة:');
        console.log(message);
        console.log('🔗 رابط واتساب:', whatsappUrl);
        
        // فتح في نافذة جديدة
        window.open(whatsappUrl, '_blank');
        
        // إظهار تنبيه للمستخدم
        showAlert('تم إعداد الرسالة', 'سيتم فتح واتساب لإرسال الطلب', 'info');
        
    } catch (error) {
        console.error('❌ خطأ في فتح واتساب:', error);
        showAlert('خطأ', 'تعذر فتح واتساب، يرجى المحاولة يدوياً', 'error');
    }
}

// 🔥 نسخة مبسطة للطوارئ
function sendSimpleWhatsApp(orderId, totalAmount) {
    try {
        let message = `🎯 طلب جديد #${orderId}\n`;
        message += `👤 ${AppState.currentClient?.name || ''}\n`;
        message += `📞 ${AppState.currentClient?.phone || ''}\n\n`;
        
        // العناصر
        message += `🛒 الطلبات:\n`;
        AppState.cart.forEach((item, index) => {
            message += `${index + 1}. ${item.name} - ${item.quantity} × ${item.price} ج\n`;
        });
        
        // الإجمالي
        message += `\n💰 الإجمالي: ${totalAmount} ج\n`;
        
        // خصم النقاط
        if (AppState.pendingDiscount > 0) {
            message += `🎁 خصم النقاط: ${AppState.pendingDiscount} ج\n`;
        }
        
        // الولاء
        if (AppState.currentLoyalty) {
            const remaining = 5 - AppState.currentLoyalty.delivered_orders;
            message += `⭐ متبقي ${remaining} طلب للتوصيل المجاني\n`;
        }
        
        message += `\n⏰ ${new Date().toLocaleString('ar-EG')}`;
        
        sendWhatsAppMessage(message);
        
    } catch (error) {
        console.error('❌ خطأ في النسخة المبسطة:', error);
        showAlert('خطأ', 'تعذر إرسال الطلب عبر واتساب', 'error');
    }
}




// تعيين نوع الطلب
function setOrderType(orderType) {
    AppState.currentOrderType = orderType;
    
    // تحديث الواجهة
    document.querySelectorAll('.order-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.type === orderType);
    });
    
    // إظهار/إخفاء معلومات التوصيل
    const deliveryInfo = document.getElementById('delivery-info');
    if (deliveryInfo) {
        deliveryInfo.style.display = orderType === 'delivery' ? 'block' : 'none';
    }
    
    // 🔥 تحديث رسوم التوصيل بناءً على الولاء
    if (AppState.currentLoyalty) {
        updateDeliveryFeeBasedOnLoyalty(AppState.currentLoyalty);
    }
    
    updateCartTotal();
}
// تسجيل الخروج
function logout() {
    AppState.currentClient = null;
    AppState.cart = [];
    AppState.selectedArea = null;
    
    clearStoredData();
    showLoginInterface();
    
    // إعادة تعيين النموذج
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
    
    updateCartUI();
}
// تحسين تجربة تحميل الصور
// تحسين تحميل الصور
function enhanceImagesLoading() {
    const images = document.querySelectorAll('.item-image');
    
    console.log(`🔍 جاري تحميل ${images.length} صورة...`);
    
    images.forEach((img, index) => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
        
        img.onload = function() {
            this.style.opacity = '1';
            console.log(`✅ تم تحميل الصورة ${index + 1}: ${this.src}`);
        };
        
        img.onerror = function() {
            console.warn(`❌ فشل تحميل الصورة ${index + 1}: ${this.src}`);
            const container = this.parentElement;
            const itemName = container.closest('.menu-item').querySelector('.item-name').textContent;
            handleOrderImageError(this, itemName);
        };
    });
}

// تحليل بيانات الصور
function analyzeImagesData() {
    if (!AppState.menuItems || AppState.menuItems.length === 0) {
        console.warn('⚠️ لا توجد بيانات لعرضها');
        return;
    }
    
    const itemsWithImages = AppState.menuItems.filter(item => 
        item.image_url && item.image_url.trim() !== ''
    );
    
    const validImages = itemsWithImages.filter(item => 
        isValidImageUrl(item.image_url)
    );
    
    console.log(`📊 إحصائيات الصور في النظام:`);
    console.log(`   • إجمالي العناصر: ${AppState.menuItems.length}`);
    console.log(`   • العناصر مع حقل image_url: ${itemsWithImages.length}`);
    console.log(`   • الصور الصالحة: ${validImages.length}`);
    console.log(`   • النسبة: ${Math.round((validImages.length / AppState.menuItems.length) * 100)}%`);
    
    // عرض أمثلة من الصور
    if (validImages.length > 0) {
        console.log('✅ أمثلة على العناصر التي لديها صور:');
        validImages.slice(0, 3).forEach(item => {
            console.log(`   - ${item.name}: ${item.image_url.substring(0, 50)}...`);
        });
    }
    
    return {
        totalItems: AppState.menuItems.length,
        itemsWithImages: itemsWithImages.length,
        validImages: validImages.length,
        percentage: Math.round((validImages.length / AppState.menuItems.length) * 100)
    };
}

// إحصائيات الصور
function checkAndDisplayImagesStatus() {
    const stats = analyzeImagesData();
    
    const menuContainer = document.getElementById('OurMenu');
    if (!menuContainer || !stats) return;
    
    // إزالة أي رسالة سابقة
    const existingInfo = menuContainer.querySelector('.images-info');
    if (existingInfo) existingInfo.remove();
    
    // إضافة رسالة معلومات
    const infoDiv = document.createElement('div');
    infoDiv.className = 'images-info';
    
    if (stats.validImages === 0) {
        infoDiv.innerHTML = `
            <i class="fas fa-image-slash"></i>
            <h4>جميع العناصر معروضة بدون صور</h4>
            <p>لا توجد صور متاحة حاليًا</p>
        `;
    } else {
        infoDiv.innerHTML = `
            <i class="fas fa-images"></i>
            <h4>معلومات الصور</h4>
            <p>${stats.percentage}% من العناصر لديها صور (${stats.validImages} من ${stats.totalItems})</p>
        `;
    }
    
    // إضافة الرسالة في الأعلى
    menuContainer.insertBefore(infoDiv, menuContainer.firstChild);
}




// عرض القائمة
// عرض القائمة مع الصور
// عرض القائمة مع الصور - النسخة المصححة
function renderMenu() {
    const menuContainer = document.getElementById('OurMenu');
    if (!menuContainer) {
        console.error('❌ لم يتم العثور على عنصر menu-container');
        return;
    }
    
    menuContainer.innerHTML = '';
    
    console.log('🎨 جاري عرض القائمة...');
    console.log('📊 بيانات القائمة:', {
        categories: AppState.menuCategories.length,
        items: AppState.menuItems.length,
        itemsWithImages: AppState.menuItems.filter(item => item.image_url).length
    });

    AppState.menuCategories.forEach(category => {
        const categoryItems = AppState.menuItems.filter(item => 
            item.category_id === category.id && item.is_available !== false
        );
        
        if (categoryItems.length === 0) return;

        const categorySection = document.createElement('div');
        categorySection.className = 'menu-category';
        
        let itemsHTML = '';
        
        categoryItems.forEach(item => {
            // التحقق من وجود صورة
            const hasImage = item.image_url && item.image_url.trim() !== '';
            const imageUrl = item.image_url || '';
            
            console.log(`📸 ${item.name}: ${hasImage ? imageUrl : 'بدون صورة'}`);
            
            itemsHTML += `
                <div class="menu-item" data-item-id="${item.id}">
                    <div class="item-content-wrapper">
                        ${hasImage ? `
                            <div class="item-image-container">
                                <img src="${imageUrl}" 
                                     alt="${item.name}" 
                                     class="item-image"
                                     loading="lazy"
                                     onerror="handleOrderImageError(this, '${item.description || ''}')">
                            </div>
                        ` : `
                            <div class="no-image-placeholder">
                                <i class="fas fa-utensils"></i>
                            </div>
                        `}
                        
                        <div class="item-info">
                            <h4 class="item-name">${item.name}</h4>
                            ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                            <div class="item-price">${item.price} ج</div>
                        </div>
                    </div>
                    
                    <button class="add-to-cart-btn" onclick="openQuantityModal('${item.unique_code}')">
                        <i class="fas fa-plus"></i>
                        إضافة
                    </button>
                </div>
            `;
        });

        categorySection.innerHTML = `
            <h3 class="category-title">${category.name}</h3>
            ${category.description ? `<p class="category-description">${category.description}</p>` : ''}
            <div class="menu-items-grid">
                ${itemsHTML}
            </div>
        `;
        
        menuContainer.appendChild(categorySection);
    });
    
    // تحسين تحميل الصور
    setTimeout(enhanceImagesLoading, 100);
    
    // إحصائيات الصور
    setTimeout(checkAndDisplayImagesStatus, 500);
    
    console.log('✅ تم عرض القائمة بنجاح');
}
// مؤشر تحميل للصور
function showImageLoader(container) {
    container.innerHTML = `
        <div class="image-loader">
            <div class="spinner"></div>
            <p>جاري تحميل الصورة...</p>
        </div>
    `;
}

// CSS للـ loader
const imageLoaderStyles = `
    .image-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 20px;
    }
    
    .image-loader .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #ee5f06;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .image-loader p {
        color: #666;
        font-size: 0.9rem;
    }
`;

// إضافة الـ styles
const imageLoaderStyleSheet = document.createElement('style');
imageLoaderStyleSheet.textContent = imageLoaderStyles;
document.head.appendChild(imageLoaderStyleSheet);


// التحقق من صحة رابط الصورة
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (trimmedUrl === '') return false;
    
    // التحقق من أن الرابط يبدأ بـ http/https
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        return false;
    }
    
    // التحقق من امتدادات الصور الشائعة
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = validExtensions.some(ext => 
        trimmedUrl.toLowerCase().endsWith(ext)
    );
    
    return hasValidExtension;
}

// معالجة خطأ تحميل الصورة
function handleOrderImageError(imgElement, description) {
    console.warn('❌ فشل تحميل صورة المنتج:', imgElement.src);
    
    const container = imgElement.parentElement;
    container.innerHTML = `
        <div class="image-error">
            <i class="fas fa-image-slash"></i>
            <p>${description || 'صورة غير متوفرة'}</p>
        </div>
    `;
    
    container.style.background = '#f9f9f9';
    container.style.border = '1px dashed #ddd';
    container.style.borderRadius = '8px';
    container.style.padding = '10px';
    container.style.textAlign = 'center';
}

// تحديث دالة loadMenuData لتحميل الصور
// تحميل القائمة
async function loadMenuData() {
    showLoading(true);
    
    try {
        const response = await fetch(`${AppState.backendUrl}/menu/init`);
        const result = await response.json();
        
        console.log('📊 استجابة Backend كاملة:', result);
        
        if (result.success) {
            AppState.menuCategories = result.data.categories || [];
            AppState.menuItems = result.data.items || [];
            
            // 🔍 فحص بيانات الصور
            console.log('🔍 فحص بيانات الصور:');
            AppState.menuItems.forEach((item, index) => {
                console.log(`${index + 1}. ${item.name}: ${item.image_url || 'لا توجد صورة'}`);
            });
            
            renderMenu();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل القائمة:', error);
        loadFallbackMenu();
    } finally {
        showLoading(false);
    }
}

// تحليل بيانات الصور
function analyzeImagesData(menuData) {
    if (!menuData || !menuData.items) return;
    
    const itemsWithImages = menuData.items.filter(item => 
        item.image_url && item.image_url.trim() !== ''
    );
    
    const validImages = itemsWithImages.filter(item => 
        isValidImageUrl(item.image_url)
    );
    
    console.log(`📊 إحصائيات الصور: ${validImages.length}/${menuData.items.length} عنصر لديه صور صالحة`);
    
    // عرض أمثلة من الصور
    if (validImages.length > 0) {
        console.log('✅ أمثلة على العناصر التي لديها صور:');
        validImages.slice(0, 3).forEach(item => {
            console.log(`   - ${item.name}: ${item.image_url}`);
        });
    }
}
// فتح/إغلاق نافذة السلة
function toggleCartModal() {
    if (AppState.cart.length === 0) {
        showAlert('السلة فارغة', 'يرجى إضافة عناصر للطلب', 'info');
        return;
    }
    
    const cartModal = document.getElementById('cart-modal');
    if (cartModal.style.display === 'flex') {
        closeCartModal();
    } else {
        openCartModal();
    }
}

function openCartModal() {
    renderCartItems();
    updateCartTotal();
    document.getElementById('cart-modal').style.display = 'flex';
}

function closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
}

// عرض عناصر السلة
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (AppState.cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>السلة فارغة</p>
            </div>
        `;
        return;
    }
    
    AppState.cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="item-details">
                    <span class="item-price">${item.price} ج</span>
                    <span class="item-quantity">× ${item.quantity}</span>
                </div>
                <div class="item-total">${item.price * item.quantity} ج</div>
            </div>
            <div class="cart-item-actions">
                <button class="quantity-control" onclick="updateCartItemQuantity(${index}, -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-control" onclick="updateCartItemQuantity(${index}, 1)">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="remove-item" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
}

// تحديث كمية عنصر في السلة
function updateCartItemQuantity(index, change) {
    const newQuantity = AppState.cart[index].quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > 50) {
        showAlert('خطأ', 'الحد الأقصى للكمية هو 50', 'error');
        return;
    }
    
    AppState.cart[index].quantity = newQuantity;
    updateCartUI();
    renderCartItems();
}

// إزالة عنصر من السلة
function removeFromCart(index) {
    const itemName = AppState.cart[index].name;
    AppState.cart.splice(index, 1);
    updateCartUI();
    renderCartItems();
    showAlert('تم الحذف', `تم إزالة ${itemName} من السلة`, 'success');
}

// تفريغ السلة
function clearCart() {
    AppState.cart = [];
    AppState.pendingDiscount = 0;
    updateCartUI();
    closeCartModal();
}

// إدارة الكمية في النافذة المنبثقة
function increaseQuantity() {
    const input = document.getElementById('quantity-input');
    if (input) {
        input.value = parseInt(input.value) + 1;
        validateQuantity();
    }
}

function decreaseQuantity() {
    const input = document.getElementById('quantity-input');
    if (input && input.value > 1) {
        input.value = parseInt(input.value) - 1;
        validateQuantity();
    }
}

function validateQuantity() {
    const input = document.getElementById('quantity-input');
    if (!input) return true;
    
    const value = parseInt(input.value);
    if (value < 1 || value > 50) {
        input.style.borderColor = '#dc2626';
        return false;
    }
    
    input.style.borderColor = '#d1d5db';
    return true;
}

function closeQuantityModal() {
    document.getElementById('quantity-modal').style.display = 'none';
}

function closeAlertModal() {
    document.getElementById('alert-modal').style.display = 'none';
}

// المتابعة للدفع
function proceedToCheckout() {
    closeCartModal();
    
    // التمرير إلى قسم إرسال الطلب
    const orderSection = document.querySelector('.order-section');
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ========== بيانات افتراضية ==========

function loadDefaultAreas() {
    AppState.areas = [
        { id: 1, name: 'منشيه البكاري', delivery_fee: 10 },
        { id: 2, name: 'كعبيش', delivery_fee: 15 },
        { id: 3, name: 'طوابق', delivery_fee: 17 },
        { id: 4, name: 'مريوطيه فيصل', delivery_fee: 20 },
        { id: 5, name: 'شيشيني', delivery_fee: 15 }
    ];
}

function loadFallbackMenu() {
    console.log('🔄 استخدام القائمة الافتراضية...');
    
    AppState.menuCategories = [
        { id: 1, name: 'كشري', description: 'أصناف الكشري اللذيذة' },
        { id: 2, name: 'كريب', description: 'أصناف الكريب الشهية' },
        { id: 3, name: 'سندوتشات', description: 'سندوتشات متنوعة' }
    ];
    
    // 🔥 إضافة صور حقيقية من Supabase
    AppState.menuItems = [
        { 
            id: 1, 
            name: 'كشري عادي', 
            category_id: 1, 
            price: 25, 
            description: 'كشري مع الصلصة والحمص', 
            unique_code: 'KSH001', 
            is_available: true,
            image_url: 'https://fvkbrhafzwdsngztsidh.supabase.co/storage/v1/object/public/Menu/KOSHARY_30.jpg'
        },
        { 
            id: 2, 
            name: 'كشري كبير', 
            category_id: 1, 
            price: 35, 
            description: 'كشري كبير مع جميع الإضافات', 
            unique_code: 'KSH002', 
            is_available: true,
            image_url: 'https://fvkbrhafzwdsngztsidh.supabase.co/storage/v1/object/public/Menu/KOSHARY_50.jpg'
        },
        { 
            id: 3, 
            name: 'كريب جبنة', 
            category_id: 2, 
            price: 30, 
            description: 'كريب بالجبنة الذائبة', 
            unique_code: 'CRP001', 
            is_available: true,
            image_url: 'https://fvkbrhafzwdsngztsidh.supabase.co/storage/v1/object/public/Menu/CREPE.jpg'
        },
        { 
            id: 4, 
            name: 'كريب لانشون', 
            category_id: 2, 
            price: 35, 
            description: 'كريب باللانشون والجبنة', 
            unique_code: 'CRP002', 
            is_available: true,
            image_url: '' // بدون صورة (للتجربة)
        },
        { 
            id: 5, 
            name: 'سندوتش زنجر', 
            category_id: 3, 
            price: 40, 
            description: 'سندوتش زنجر مشوي', 
            unique_code: 'SND001', 
            is_available: true,
            image_url: 'https://fvkbrhafzwdsngztsidh.supabase.co/storage/v1/object/public/Menu/SANDWICH_ZINGER.jpg'
        }
    ];
    
    console.log('✅ تم تحميل القائمة الافتراضية مع الصور');
    renderMenu();
}

// ========== إغلاق النوافذ بالضغط خارجها ==========

document.addEventListener('click', function(event) {
    // إغلاق نافذة الكمية
    const quantityModal = document.getElementById('quantity-modal');
    if (quantityModal && event.target === quantityModal) {
        closeQuantityModal();
    }
    
    // إغلاق نافذة السلة
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && event.target === cartModal) {
        closeCartModal();
    }
    
    // إغلاق نافذة التنبيه
    const alertModal = document.getElementById('alert-modal');
    if (alertModal && event.target === alertModal) {
        closeAlertModal();
    }
});

// ========== إضافة CSS ديناميكي ==========

const dynamicStyles = `
    /* الأنماط الأساسية للقائمة */
    .menu-category {
        margin-bottom: 2.5rem;
    }
    
    .category-title {
        color: #ee5f06;
        font-size: 1.6rem;
        margin-bottom: 0.75rem;
        border-right: 4px solid #ee5f06;
        padding-right: 1rem;
        font-weight: 700;
    }
    
    .category-description {
        color: #666;
        margin-bottom: 1.5rem;
        font-size: 1rem;
        line-height: 1.6;
    }
    
    .menu-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }
    
    /* عنصر القائمة مع الصورة */
    .menu-item {
        background: white;
        border-radius: 15px;
        border: 1px solid #e5e7eb;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
    }
    
    .menu-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .item-content-wrapper {
        padding: 15px;
        flex: 1;
    }
    
    /* حاوية الصورة */
    .item-image-container {
        width: 100%;
        height: 180px;
        overflow: hidden;
        border-radius: 12px;
        margin-bottom: 15px;
        background: #f8f9fa;
        position: relative;
    }
    
    .item-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
    }
    
    .menu-item:hover .item-image {
        transform: scale(1.08);
    }
    
    /* بديل عند عدم وجود صورة */
    .no-image-placeholder {
        width: 100%;
        height: 180px;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-radius: 12px;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
    }
    
    .no-image-placeholder i {
        font-size: 3rem;
    }
    
    /* معلومات العنصر */
    .item-info {
        flex: 1;
    }
    
    .item-name {
        margin: 0 0 8px 0;
        color: #1f2937;
        font-size: 1.2rem;
        font-weight: 700;
        line-height: 1.4;
    }
    
    .item-description {
        color: #6b7280;
        font-size: 0.95rem;
        margin: 0 0 12px 0;
        line-height: 1.6;
        min-height: 40px;
    }
    
    .item-price {
        color: #ee5f06;
        font-weight: bold;
        font-size: 1.4rem;
        margin-top: 10px;
    }
    
    /* زر الإضافة */
    .add-to-cart-btn {
        background: #ee5f06;
        color: white;
        border: none;
        padding: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 1rem;
        font-weight: 600;
        margin-top: auto;
        border-radius: 0 0 15px 15px;
    }
    
    .add-to-cart-btn:hover {
        background: #d35400;
    }
    
    .add-to-cart-btn i {
        font-size: 1.1rem;
    }
    
    /* رسالة معلومات الصور */
    .images-info {
        background: linear-gradient(135deg, #e3f2fd, #bbdefb);
        border: 2px solid #2196f3;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
        font-size: 1rem;
        color: #0d47a1;
        box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2);
    }
    
    .images-info i {
        font-size: 2rem;
        margin-bottom: 10px;
        display: block;
    }
    
    /* خطأ الصورة */
    .image-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #6b7280;
        padding: 30px;
        text-align: center;
        background: #f9fafb;
        border-radius: 8px;
    }
    
    .image-error i {
        font-size: 2.5rem;
        margin-bottom: 15px;
        color: #d1d5db;
    }
    
    .image-error p {
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0;
    }
    
    /* تصميم متجاوب */
    @media (max-width: 768px) {
        .menu-items-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
        }
        
        .item-image-container {
            height: 150px;
        }
        
        .no-image-placeholder {
            height: 150px;
        }
        
        .item-name {
            font-size: 1.1rem;
        }
    }
    
    @media (max-width: 480px) {
        .menu-items-grid {
            grid-template-columns: 1fr;
        }
        
        .item-image-container {
            height: 140px;
        }
        
        .no-image-placeholder {
            height: 140px;
        }
    }
`;

// إضافة الـ styles للصفحة
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// ========== جعل الدوال متاحة عالمياً ==========

window.openQuantityModal = openQuantityModal;
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeFromCart = removeFromCart;
window.closeQuantityModal = closeQuantityModal;
window.closeAlertModal = closeAlertModal;
window.toggleRedeemSection = toggleRedeemSection; // ⬅️ أضف
window.applyRedeem = applyRedeem; // ⬅️ أضف
window.removeRedeem = removeRedeem; // ⬅️ أضف
window.updateRedeemPreview = updateRedeemPreview; // ⬅️ أضف

// دالة للمساعدة في التتبع
window.logAppState = function() {
    console.log('حالة التطبيق:', {
        currentClient: AppState.currentClient,
        selectedArea: AppState.selectedArea,
        currentOrderType: AppState.currentOrderType,
        cart: AppState.cart,
        areas: AppState.areas,
        menuItems: AppState.menuItems.length,
        menuCategories: AppState.menuCategories.length
    });
};

// ========== تهيئة إضافية ==========

// إغلاق النوافذ بالضغط على Esc
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeQuantityModal();
        closeCartModal();
        closeAlertModal();
    }
});

console.log('✅ تم تحميل نظام طلبات كشري رسلان بنجاح');


// تبديل عرض معلومات النظام
function togglePointsInfo() {
    const infoSection = document.getElementById('points-info-section');
    if (!infoSection) return;
    
    const isVisible = infoSection.style.display !== 'none';
    infoSection.style.display = isVisible ? 'none' : 'block';
    
    // إضافة تأثير سلس
    if (!isVisible) {
        infoSection.style.animation = 'fadeIn 0.5s ease';
    }
}

// إضافة تحسينات الأداء في order.js
function optimizeImagesPerformance() {
    const images = document.querySelectorAll('.item-image');
    
    images.forEach(img => {
        // إضافة lazy loading متقدم
        img.loading = 'lazy';
        img.decoding = 'async';
        
        // تحسين cache
        img.style.contentVisibility = 'auto';
        img.style.containIntrinsicSize = '300px 200px';
        
        // إضافة srcset للصور المتعددة الدقة
        const originalSrc = img.src;
        if (originalSrc.includes('supabase.co')) {
            // Supabase يدعم تحويل الصور
            img.srcset = `
                ${originalSrc}?width=300 300w,
                ${originalSrc}?width=600 600w,
                ${originalSrc}?width=900 900w
            `;
            img.sizes = '(max-width: 768px) 300px, 600px';
        }
    });
}

// استدعاء بعد renderMenu
setTimeout(optimizeImagesPerformance, 1000);

// دالة لعرض إحصائيات الصور
function showAdvancedImageStats() {
    const itemsWithImages = AppState.menuItems.filter(item => 
        item.image_url && item.image_url.trim() !== ''
    );
    
    const itemsWithoutImages = AppState.menuItems.filter(item => 
        !item.image_url || item.image_url.trim() === ''
    );
    
    console.log('📊 إحصائيات الصور المتقدمة:');
    console.log('-----------------------------------');
    console.log(`إجمالي العناصر: ${AppState.menuItems.length}`);
    console.log(`مع صور: ${itemsWithImages.length} (${Math.round((itemsWithImages.length/AppState.menuItems.length)*100)}%)`);
    console.log(`بدون صور: ${itemsWithoutImages.length} (${Math.round((itemsWithoutImages.length/AppState.menuItems.length)*100)}%)`);
    
    // تحليل حسب التصنيف
    const statsByCategory = {};
    AppState.menuCategories.forEach(category => {
        const categoryItems = AppState.menuItems.filter(item => 
            item.category_id === category.id
        );
        
        const withImages = categoryItems.filter(item => 
            item.image_url && item.image_url.trim() !== ''
        );
        
        statsByCategory[category.name] = {
            total: categoryItems.length,
            withImages: withImages.length,
            percentage: Math.round((withImages.length/categoryItems.length)*100)
        };
    });
    
    console.log('📈 حسب التصنيف:');
    Object.entries(statsByCategory).forEach(([category, stats]) => {
        console.log(`  ${category}: ${stats.withImages}/${stats.total} (${stats.percentage}%)`);
    });
    
    // اقتراحات للتحسين
    if (itemsWithoutImages.length > 0) {
        console.log('💡 اقتراحات للتحسين:');
        itemsWithoutImages.slice(0, 5).forEach(item => {
            console.log(`  - أضف صورة لـ "${item.name}" (الكود: ${item.unique_code})`);
        });
    }
}

// استدعاء للفحص
setTimeout(showAdvancedImageStats, 3000);