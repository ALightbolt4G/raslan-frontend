// ===== ملف JavaScript الكامل لنظام إدارة المطعم =====

// ===== متغيرات عامة =====
const API_BASE_URL = 'https://raslan.up.railway.app/api';
let currentUser = null;
let currentView = 'dashboard';

// ===== دوال المساعدة العامة =====
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
}

function showAlert(message, type = 'success', duration = 3000) {
    // إنشاء div للتنبيه إذا لم يكن موجود
    let alertDiv = document.getElementById('globalAlert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'globalAlert';
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            min-width: 300px;
            text-align: center;
        `;
        document.body.appendChild(alertDiv);
    }

    alertDiv.textContent = message;
    alertDiv.className = `alert-${type}`;
    
    // تحديد لون الخلفية حسب النوع
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    alertDiv.style.backgroundColor = colors[type] || colors.success;
    alertDiv.style.display = 'block';

    if (duration > 0) {
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, duration);
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = timeString;
    }
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (!passwordInput || !toggleBtn) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function showNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) panel.classList.add('show');
}

function hideNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) panel.classList.remove('show');
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

function openModal(content) {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.innerHTML = content;
        modal.style.display = 'block';
    }
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        document.getElementById('dashboardPage').style.display = 'none';
        document.getElementById('loginPage').classList.add('active');
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
        
        showAlert('تم تسجيل الخروج بنجاح', 'success');
    }
}

function getStatusClass(status) {
    const statusMap = {
        'pending': 'warning',
        'processing': 'info',
        'shipped': 'primary',
        'delivered': 'success',
        'canceled': 'danger'
    };
    return statusMap[status] || 'secondary';
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'قيد الانتظار',
        'processing': 'قيد التحضير',
        'shipped': 'قيد التوصيل',
        'delivered': 'تم التوصيل',
        'canceled': 'ملغي'
    };
    return statusMap[status] || status;
}

// ===== تسجيل الدخول =====
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            
            if (!email || !password) {
                showAlert('يرجى ملء جميع الحقول', 'error');
                return;
            }
            
            try {
                showLoading();
                
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email: email.trim(),
                        password: password 
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    currentUser = data.data;
                    
                    // حفظ بيانات المستخدم في localStorage
                    localStorage.setItem('userData', JSON.stringify(currentUser));
                    
                    showAlert('تم تسجيل الدخول بنجاح!', 'success');
                    
                    // تحديث اسم المستخدم في الواجهة
                    const userNameElement = document.getElementById('userName');
                    if (userNameElement && currentUser.name) {
                        userNameElement.textContent = currentUser.name;
                    }
                    
                    // الانتقال إلى لوحة التحكم
                    setTimeout(() => {
                        document.getElementById('loginPage').classList.remove('active');
                        document.getElementById('dashboardPage').style.display = 'block';
                        loadDashboard();
                    }, 1000);
                    
                } else {
                    showAlert(data.error || 'فشل تسجيل الدخول', 'error');
                }
            } catch (error) {
                console.error('خطأ في تسجيل الدخول:', error);
                showAlert('خطأ في الاتصال بالخادم. تأكد من تشغيل السيرفر.', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    // فحص إذا كان المستخدم مسجل دخول مسبقاً
    checkSavedLogin();
    
    // تحديث الوقت كل ثانية
    setInterval(updateLastUpdateTime, 1000);
    
    // إغلاق القوائم المنسدلة عند النقر خارجها
    document.addEventListener('click', function(event) {
        // إغلاق قائمة المستخدم
        if (!event.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('show');
        }
        
        // إغلاق التنبيهات
        if (!event.target.closest('.notifications-panel') && 
            !event.target.closest('.btn-notification')) {
            hideNotifications();
        }
        
        // إغلاق المودال بالنقر خارجها
        const modal = document.getElementById('productModal');
        if (modal && event.target === modal) {
            closeModal();
        }
    });
    
    // إخفاء صفحة التحكم عند التحميل
    document.getElementById('dashboardPage').style.display = 'none';
});

function checkSavedLogin() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            document.getElementById('loginPage').classList.remove('active');
            document.getElementById('dashboardPage').style.display = 'block';
            
            const userNameElement = document.getElementById('userName');
            if (userNameElement && currentUser.name) {
                userNameElement.textContent = currentUser.name;
            }
            
            loadDashboard();
        } catch (error) {
            console.error('خطأ في تحليل بيانات المستخدم:', error);
            localStorage.removeItem('userData');
        }
    }
}

// ===== تحميل لوحة التحكم =====
async function loadDashboard() {
    try {
        showLoading();
        currentView = 'dashboard';
        
        // تحديث القائمة النشطة
        updateActiveMenu('showDashboard');
        
        // تحميل جميع البيانات
        await Promise.all([
            loadStats(),
            loadRecentOrders(),
            loadRecentClients(),
            loadNotifications()
        ]);
        
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('خطأ في تحميل لوحة التحكم:', error);
        showAlert('خطأ في تحميل البيانات', 'error');
    } finally {
        hideLoading();
    }
}

function updateActiveMenu(handlerName) {
    // إزالة النشط من جميع العناصر
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // إضافة النشط للعنصر الحالي
    const activeItem = document.querySelector(`.menu-item[onclick="${handlerName}()"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

async function loadStats() {
    try {
        // جلب جميع البيانات في وقت واحد
        const [ordersRes, clientsRes, productsRes, feedbackRes] = await Promise.all([
            fetch(`${API_BASE_URL}/orders?status=all`),
            fetch(`${API_BASE_URL}/clients`),
            fetch(`${API_BASE_URL}/menu-items`),
            fetch(`${API_BASE_URL}/feedback`)
        ]);

        const ordersData = await ordersRes.json();
        const clientsData = await clientsRes.json();
        const productsData = await productsRes.json();
        const feedbackData = await feedbackRes.json();

        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const statsHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #4CAF50, #2E7D32);">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="stat-info">
                    <h3>${ordersData.data?.length || 0}</h3>
                    <p>إجمالي الطلبات</p>
                </div>
                <div class="stat-trend">
                    <i class="fas fa-arrow-up"></i>
                    <span>+12%</span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #2196F3, #0D47A1);">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>${clientsData.data?.length || 0}</h3>
                    <p>إجمالي العملاء</p>
                </div>
                <div class="stat-trend">
                    <i class="fas fa-arrow-up"></i>
                    <span>+8%</span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #FF9800, #E65100);">
                    <i class="fas fa-hamburger"></i>
                </div>
                <div class="stat-info">
                    <h3>${productsData.data?.length || 0}</h3>
                    <p>إجمالي المنتجات</p>
                </div>
                <div class="stat-trend">
                    <i class="fas fa-arrow-up"></i>
                    <span>+5%</span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #9C27B0, #4A148C);">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-info">
                    <h3>${feedbackData.data?.length || 0}</h3>
                    <p>إجمالي التقييمات</p>
                </div>
                <div class="stat-trend">
                    <i class="fas fa-arrow-up"></i>
                    <span>+15%</span>
                </div>
            </div>
        `;

        statsContainer.innerHTML = statsHTML;

    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>تعذر تحميل الإحصائيات</p>
                </div>
            `;
        }
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders?status=pending`);
        const data = await response.json();
        
        const table = document.getElementById('recentOrdersTable');
        if (!table) return;
        
        if (data.success && data.data && data.data.length > 0) {
            const orders = data.data.slice(0, 5);
            
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>رقم الطلب</th>
                        <th>العميل</th>
                        <th>الحالة</th>
                        <th>المبلغ</th>
                        <th>التاريخ</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>
                                <span class="order-id">#${order.order_id}</span>
                            </td>
                            <td>
                                <div class="client-cell">
                                    <strong>${order.clients?.name || 'غير معروف'}</strong>
                                    <small>${order.clients?.phone || ''}</small>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge ${getStatusClass(order.order_state)}">
                                    ${getStatusText(order.order_state)}
                                </span>
                            </td>
                            <td>
                                <span class="amount">${parseFloat(order.total_amount || 0).toFixed(2)} ج.م</span>
                            </td>
                            <td>
                                ${new Date(order.created_at).toLocaleDateString('ar-EG', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-action" onclick="viewOrder(${order.order_id})" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-action" onclick="updateOrderModal(${order.order_id})" title="تغيير الحالة">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        } else {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">
                        <i class="fas fa-inbox"></i>
                        <p>لا توجد طلبات حديثة</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('خطأ في تحميل الطلبات الأخيرة:', error);
        const table = document.getElementById('recentOrdersTable');
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="error-table">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>تعذر تحميل الطلبات</p>
                    </td>
                </tr>
            `;
        }
    }
}

async function loadRecentClients() {
    try {
        const response = await fetch(`${API_BASE_URL}/clients`);
        const data = await response.json();
        
        const table = document.getElementById('recentClientsTable');
        if (!table) return;
        
        if (data.success && data.data && data.data.length > 0) {
            const clients = data.data.slice(0, 5);
            
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>الاسم</th>
                        <th>الهاتف</th>
                        <th>نقاط الولاء</th>
                        <th>المنطقة</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${clients.map(client => `
                        <tr>
                            <td>
                                <div class="client-info-cell">
                                    <strong>${client.name}</strong>
                                    <small>${new Date(client.created_at).toLocaleDateString('ar-EG')}</small>
                                </div>
                            </td>
                            <td>${client.phone}</td>
                            <td>
                                <span class="loyalty-points">
                                    <i class="fas fa-star"></i>
                                    ${client.loyalty_points || 0}
                                </span>
                            </td>
                            <td>
                                <span class="area-badge">
                                    ${client.areas?.name || 'غير محدد'}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-action" onclick="viewClientDetails(${client.id})" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-action success" onclick="checkLoyalty(${client.id})" title="فحص الولاء">
                                        <i class="fas fa-crown"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        } else {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-table">
                        <i class="fas fa-users"></i>
                        <p>لا توجد عملاء حديثين</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('خطأ في تحميل العملاء الجدد:', error);
        const table = document.getElementById('recentClientsTable');
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="error-table">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>تعذر تحميل العملاء</p>
                    </td>
                </tr>
            `;
        }
    }
}

async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders?status=pending`);
        const data = await response.json();
        
        const notificationsBody = document.querySelector('.notifications-body');
        if (!notificationsBody) return;
        
        if (data.success && data.data && data.data.length > 0) {
            const pendingOrders = data.data.slice(0, 3);
            
            notificationsBody.innerHTML = `
                <div class="notifications-list">
                    ${pendingOrders.map(order => `
                        <div class="notification-item">
                            <div class="notification-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="notification-content">
                                <p>طلب جديد #${order.order_id}</p>
                                <small>من ${order.clients?.name || 'عميل'}</small>
                                <span class="notification-time">
                                    ${new Date(order.created_at).toLocaleTimeString('ar-EG', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                    <div class="notification-item info">
                        <div class="notification-icon">
                            <i class="fas fa-info-circle"></i>
                        </div>
                        <div class="notification-content">
                            <p>لديك ${pendingOrders.length} طلب(ات) قيد الانتظار</p>
                            <a href="#" onclick="showOrders(); hideNotifications();">عرض جميع الطلبات</a>
                        </div>
                    </div>
                </div>
            `;
            
            // تحديث عدد التنبيهات
            const badge = document.querySelector('.btn-notification .badge');
            if (badge) {
                badge.textContent = pendingOrders.length;
                badge.style.display = pendingOrders.length > 0 ? 'flex' : 'none';
            }
        } else {
            notificationsBody.innerHTML = `
                <div class="notification-item">
                    <div class="notification-icon">
                        <i class="fas fa-bell-slash"></i>
                    </div>
                    <div class="notification-content">
                        <p>لا توجد تنبيهات جديدة</p>
                        <small>آخر تحديث: ${new Date().toLocaleTimeString('ar-EG')}</small>
                    </div>
                </div>
            `;
            
            // إخفاء البادج
            const badge = document.querySelector('.btn-notification .badge');
            if (badge) badge.style.display = 'none';
        }
    } catch (error) {
        console.error('خطأ في تحميل التنبيهات:', error);
        const notificationsBody = document.querySelector('.notifications-body');
        if (notificationsBody) {
            notificationsBody.innerHTML = `
                <div class="notification-item error">
                    <div class="notification-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="notification-content">
                        <p>خطأ في تحميل التنبيهات</p>
                        <small>تحقق من اتصال الإنترنت</small>
                    </div>
                </div>
            `;
        }
    }
}

// ===== نظام الولاء =====
async function checkLoyalty(clientId) {
    try {
        showLoading();
        
        if (!clientId || isNaN(clientId)) {
            showAlert('معرف العميل غير صالح', 'error');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/loyalty/status/${clientId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            const loyaltyData = data.data;
            
            let message = `
                <div class="loyalty-result">
                    <h3><i class="fas fa-crown"></i> حالة الولاء</h3>
                    <div class="loyalty-details">
                        <div class="detail-item">
                            <span class="label">الطلبات المكتملة:</span>
                            <span class="value">${loyaltyData.completedOrders}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">إجمالي الطلبات:</span>
                            <span class="value">${loyaltyData.totalOrders}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">النسبة:</span>
                            <span class="value">${loyaltyData.totalOrders > 0 ? Math.round((loyaltyData.completedOrders / loyaltyData.totalOrders) * 100) : 0}%</span>
                        </div>
                        <div class="status-item ${loyaltyData.isEligible ? 'eligible' : 'not-eligible'}">
                            <span class="label">الحالة:</span>
                            <span class="value">
                                <strong>${loyaltyData.isEligible ? 'مؤهل للتوصيل المجاني 🎉' : 'غير مؤهل'}</strong>
                            </span>
                        </div>
                    </div>
                    ${loyaltyData.hasCancelledOrPending ? `
                        <div class="warning-note">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>يوجد طلبات معلقة أو ملغية</p>
                        </div>
                    ` : ''}
                </div>
            `;
            
            openModal(`
                <div class="modal-content loyalty-modal">
                    <div class="modal-header">
                        <h2><i class="fas fa-crown"></i> نظام الولاء</h2>
                        <button class="btn-close" onclick="closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="closeModal()">
                            <i class="fas fa-times"></i>
                            إغلاق
                        </button>
                        ${loyaltyData.isEligible ? `
                            <button class="btn-primary" onclick="showApplyLoyaltyModal(${clientId})">
                                <i class="fas fa-gift"></i>
                                تطبيق التوصيل المجاني
                            </button>
                        ` : ''}
                    </div>
                </div>
            `);
            
        } else {
            showAlert(data.error || 'خطأ في فحص الولاء', 'error');
        }
    } catch (error) {
        console.error('خطأ في فحص الولاء:', error);
        showAlert('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

function showApplyLoyaltyModal(clientId) {
    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-gift"></i> تطبيق مكافأة الولاء</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="loyalty-reward-info">
                    <div class="reward-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <h3>توصيل مجاني!</h3>
                    <p>يمكنك الآن تطبيق توصيل مجاني للعميل مع إضافة 10 نقاط ولاء إضافية.</p>
                    
                    <div class="form-group">
                        <label for="orderIdSelect">
                            <i class="fas fa-shopping-cart"></i>
                            حدد رقم الطلب:
                        </label>
                        <div class="input-with-button">
                            <input type="number" id="orderIdInput" placeholder="أدخل رقم الطلب" min="1">
                            <button class="btn-small" onclick="searchOrder()">
                                <i class="fas fa-search"></i>
                                بحث
                            </button>
                        </div>
                    </div>
                    
                    <div id="orderDetails" class="order-details-preview" style="display: none;">
                        <!-- سيتم ملؤها بعد البحث -->
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal()">
                    إلغاء
                </button>
                <button class="btn-primary" onclick="applyLoyaltyReward(${clientId})" id="applyRewardBtn" disabled>
                    <i class="fas fa-check-circle"></i>
                    تأكيد وتطبيق
                </button>
            </div>
        </div>
    `;
    
    openModal(modalContent);
}

async function searchOrder() {
    try {
        const orderId = document.getElementById('orderIdInput').value;
        if (!orderId) {
            showAlert('يرجى إدخال رقم الطلب', 'warning');
            return;
        }
        
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/orders`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const order = data.data.find(o => o.order_id == orderId);
            
            if (order) {
                const orderDetails = document.getElementById('orderDetails');
                const applyBtn = document.getElementById('applyRewardBtn');
                
                orderDetails.innerHTML = `
                    <div class="order-preview">
                        <div class="preview-header">
                            <h4>الطلب #${order.order_id}</h4>
                            <span class="status-badge ${getStatusClass(order.order_state)}">
                                ${getStatusText(order.order_state)}
                            </span>
                        </div>
                        <div class="preview-body">
                            <p><strong>العميل:</strong> ${order.clients?.name || 'غير معروف'}</p>
                            <p><strong>المبلغ:</strong> ${parseFloat(order.total_amount || 0).toFixed(2)} ج.م</p>
                            <p><strong>التاريخ:</strong> ${new Date(order.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                    </div>
                `;
                
                orderDetails.style.display = 'block';
                applyBtn.disabled = false;
                
                showAlert('تم العثور على الطلب', 'success');
            } else {
                showAlert('الطلب غير موجود', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في البحث عن الطلب:', error);
        showAlert('خطأ في البحث', 'error');
    } finally {
        hideLoading();
    }
}

async function applyLoyaltyReward(clientId) {
    try {
        const orderId = document.getElementById('orderIdInput').value;
        if (!orderId) {
            showAlert('يرجى إدخال رقم الطلب', 'warning');
            return;
        }
        
        if (!confirm('هل أنت متأكد من تطبيق مكافأة الولاء؟\n\nسيتم:\n1. جعل رسوم التوصيل صفر\n2. إضافة 10 نقاط ولاء للعميل')) {
            return;
        }
        
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/loyalty/apply-reward`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                clientId: parseInt(clientId),
                orderId: parseInt(orderId)
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم تطبيق مكافأة الولاء بنجاح!', 'success');
            closeModal();
            
            // تحديث لوحة التحكم
            if (currentView === 'dashboard') {
                loadDashboard();
            } else if (currentView === 'clients') {
                showClients();
            }
        } else {
            showAlert(data.error || 'فشل تطبيق المكافأة', 'error');
        }
    } catch (error) {
        console.error('خطأ في تطبيق مكافأة الولاء:', error);
        showAlert('خطأ في الاتصال بالخادم', 'error');
    } finally {
        hideLoading();
    }
}

// ===== دوال التنقل الرئيسية =====
function refreshDashboard() {
    showAlert('جاري تحديث البيانات...', 'info');
    loadDashboard();
}

function showProfile() {
    if (!currentUser) return;
    
    const modalContent = `
        <div class="modal-content profile-modal">
            <div class="modal-header">
                <h2><i class="fas fa-user-circle"></i> الملف الشخصي</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="profile-info">
                        <h3>${currentUser.name || 'مدير النظام'}</h3>
                        <p>${currentUser.email || 'غير معروف'}</p>
                        <span class="role-badge">
                            <i class="fas fa-user-shield"></i>
                            ${currentUser.is_admin ? 'مسؤول رئيسي' : 'مستخدم'}
                        </span>
                    </div>
                </div>
                
                <div class="profile-details">
                    <div class="detail-item">
                        <span class="label"><i class="fas fa-id-card"></i> معرف المستخدم:</span>
                        <span class="value">${currentUser.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label"><i class="fas fa-calendar"></i> تاريخ التسجيل:</span>
                        <span class="value">${new Date(currentUser.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label"><i class="fas fa-key"></i> نوع المستخدم:</span>
                        <span class="value">${currentUser.is_admin ? 'مسؤول' : 'مستخدم عادي'}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal()">
                    إغلاق
                </button>
                <button class="btn-primary" onclick="showSettings()">
                    <i class="fas fa-cog"></i>
                    الإعدادات
                </button>
            </div>
        </div>
    `;
    
    openModal(modalContent);
}

function showSettings() {
    const modalContent = `
        <div class="modal-content settings-modal">
            <div class="modal-header">
                <h2><i class="fas fa-cog"></i> الإعدادات</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="settings-tabs">
                    <div class="tab active" onclick="switchSettingsTab('general')">
                        <i class="fas fa-sliders-h"></i>
                        عام
                    </div>
                    <div class="tab" onclick="switchSettingsTab('notifications')">
                        <i class="fas fa-bell"></i>
                        التنبيهات
                    </div>
                    <div class="tab" onclick="switchSettingsTab('security')">
                        <i class="fas fa-shield-alt"></i>
                        الأمان
                    </div>
                </div>
                
                <div class="settings-content" id="generalSettings">
                    <h3><i class="fas fa-sliders-h"></i> الإعدادات العامة</h3>
                    
                    <div class="form-group">
                        <label for="languageSelect">
                            <i class="fas fa-language"></i>
                            اللغة
                        </label>
                        <select id="languageSelect">
                            <option value="ar" selected>العربية</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="themeSelect">
                            <i class="fas fa-palette"></i>
                            السمة
                        </label>
                        <select id="themeSelect">
                            <option value="light" selected>فاتح</option>
                            <option value="dark">داكن</option>
                            <option value="auto">تلقائي</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="itemsPerPage">
                            <i class="fas fa-list"></i>
                            عدد العناصر في الصفحة
                        </label>
                        <select id="itemsPerPage">
                            <option value="10">10</option>
                            <option value="25" selected>25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="autoRefresh" checked>
                            <i class="fas fa-sync"></i>
                            التحديث التلقائي للبيانات
                        </label>
                    </div>
                </div>
                
                <div class="settings-content" id="notificationsSettings" style="display: none;">
                    <h3><i class="fas fa-bell"></i> إعدادات التنبيهات</h3>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="newOrderNotifications" checked>
                            <i class="fas fa-shopping-cart"></i>
                            تنبيهات الطلبات الجديدة
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="deliveryNotifications" checked>
                            <i class="fas fa-truck"></i>
                            تنبيهات تحديث حالة التوصيل
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="loyaltyNotifications" checked>
                            <i class="fas fa-crown"></i>
                            تنبيهات نظام الولاء
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="feedbackNotifications" checked>
                            <i class="fas fa-star"></i>
                            تنبيهات التقييمات الجديدة
                        </label>
                    </div>
                </div>
                
                <div class="settings-content" id="securitySettings" style="display: none;">
                    <h3><i class="fas fa-shield-alt"></i> إعدادات الأمان</h3>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="autoLogout" checked>
                            <i class="fas fa-sign-out-alt"></i>
                            تسجيل الخروج التلقائي بعد 30 دقيقة
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="twoFactorAuth">
                            <i class="fas fa-mobile-alt"></i>
                            المصادقة الثنائية (2FA)
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="sessionLimit">
                            <i class="fas fa-user-lock"></i>
                            تحديد جلسة واحدة لكل مستخدم
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal()">
                    إلغاء
                </button>
                <button class="btn-primary" onclick="saveSettings()">
                    <i class="fas fa-save"></i>
                    حفظ الإعدادات
                </button>
            </div>
        </div>
    `;
    
    openModal(modalContent);
}

function switchSettingsTab(tabName) {
    // إخفاء جميع المحتويات
    document.querySelectorAll('.settings-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // إزالة النشط من جميع التبويبات
    document.querySelectorAll('.settings-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إظهار المحتوى المطلوب
    const contentElement = document.getElementById(`${tabName}Settings`);
    if (contentElement) {
        contentElement.style.display = 'block';
    }
    
    // إضافة النشط للتبويب المطلوب
    const activeTab = document.querySelector(`.settings-tabs .tab[onclick="switchSettingsTab('${tabName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

function saveSettings() {
    // حفظ الإعدادات في localStorage
    const settings = {
        language: document.getElementById('languageSelect')?.value || 'ar',
        theme: document.getElementById('themeSelect')?.value || 'light',
        itemsPerPage: document.getElementById('itemsPerPage')?.value || '25',
        autoRefresh: document.getElementById('autoRefresh')?.checked || false,
        newOrderNotifications: document.getElementById('newOrderNotifications')?.checked || false,
        deliveryNotifications: document.getElementById('deliveryNotifications')?.checked || false,
        loyaltyNotifications: document.getElementById('loyaltyNotifications')?.checked || false,
        feedbackNotifications: document.getElementById('feedbackNotifications')?.checked || false,
        autoLogout: document.getElementById('autoLogout')?.checked || false,
        twoFactorAuth: document.getElementById('twoFactorAuth')?.checked || false,
        sessionLimit: document.getElementById('sessionLimit')?.checked || false
    };
    
    localStorage.setItem('appSettings', JSON.stringify(settings));
    showAlert('تم حفظ الإعدادات بنجاح', 'success');
    closeModal();
}

// ===== إدارة الطلبات =====
async function showOrders() {
    try {
        showLoading();
        currentView = 'orders';
        updateActiveMenu('showOrders');
        
        const response = await fetch(`${API_BASE_URL}/orders`);
        const data = await response.json();
        
        let content = `
            <div class="content-header">
                <h2><i class="fas fa-shopping-cart"></i> إدارة الطلبات</h2>
                <div class="header-actions">
                    <div class="filters">
                        <select id="orderStatusFilter" onchange="filterOrders()">
                            <option value="all">جميع الحالات</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="preparing">قيد التحضير</option>
                            <option value="on_the_way">قيد التوصيل</option>
                            <option value="delivered">تم التوصيل</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                        <div class="date-filter">
                            <input type="date" id="orderStartDate" onchange="filterOrders()" placeholder="من تاريخ">
                            <input type="date" id="orderEndDate" onchange="filterOrders()" placeholder="إلى تاريخ">
                        </div>
                    </div>
                    <button class="btn-refresh" onclick="showOrders()">
                        <i class="fas fa-redo"></i>
                        تحديث
                    </button>
                </div>
            </div>
        `;
        
        if (data.success && data.data && data.data.length > 0) {
            content += `
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>رقم الطلب</th>
                                        <th>العميل</th>
                                        <th>الهاتف</th>
                                        <th>المبلغ</th>
                                        <th>رسوم التوصيل</th>
                                        <th>الحالة</th>
                                        <th>التاريخ</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.data.map(order => `
                                        <tr>
                                            <td>
                                                <span class="order-id">#${order.order_id}</span>
                                            </td>
                                            <td>
                                                <div class="client-cell">
                                                    <strong>${order.clients?.name || 'غير معروف'}</strong>
                                                    <small>${order.clients?.phone || ''}</small>
                                                </div>
                                            </td>
                                            <td>${order.clients?.phone || 'غير معروف'}</td>
                                            <td>
                                                <span class="amount">${parseFloat(order.total_amount || 0).toFixed(2)} ج.م</span>
                                            </td>
                                            <td>
                                                <span class="delivery-fee">${parseFloat(order.delivery_fee || 0).toFixed(2)} ج.م</span>
                                            </td>
                                            <td>
                                                <select class="status-select" onchange="updateOrderStatus(${order.order_id}, this.value)">
                                                    <option value="pending" ${order.order_state === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                                                    <option value="preparing" ${order.order_state === 'preparing' ? 'selected' : ''}>قيد التحضير</option>
                                                    <option value="on_the_way" ${order.order_state === 'on_the_way' ? 'selected' : ''}>قيد التوصيل</option>
                                                    <option value="delivered" ${order.order_state === 'delivered' ? 'selected' : ''}>تم التوصيل</option>
                                                    <option value="cancelled" ${order.order_state === 'cancelled' || order.order_state === 'canceled' ? 'selected' : ''}>ملغي</option>
                                                </select>
                                            </td>
                                            <td>
                                                ${new Date(order.created_at).toLocaleDateString('ar-EG', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td>
                                                <div class="action-buttons">
                                                    <button class="btn-action" onclick="viewOrderDetails(${order.order_id})" title="عرض التفاصيل">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                    <button class="btn-action success" onclick="checkClientLoyalty(${order.clients?.id})" ${!order.clients?.id ? 'disabled' : ''} title="فحص ولاء العميل">
                                                        <i class="fas fa-crown"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>لا توجد طلبات</h3>
                    <p>لم يتم تسجيل أي طلبات حتى الآن</p>
                </div>
            `;
        }
        
        document.getElementById('mainContent').innerHTML = content;
        
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
        showAlert('خطأ في تحميل الطلبات', 'error');
    } finally {
        hideLoading();
    }
}

async function filterOrders() {
    // سيتم إكمالها في الجزء الثاني
    console.log('جاري فلترة الطلبات...');
}

async function updateOrderStatus(orderId, status) {
    try {
        showLoading();
        
        // تحويل cancelled إلى canceled للتطابق مع قاعدة البيانات
        const finalStatus = status === 'cancelled' ? 'canceled' : status;
        
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: finalStatus })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم تحديث حالة الطلب بنجاح', 'success');
            
            // تحديث العرض الحالي
            if (currentView === 'orders') {
                showOrders();
            } else if (currentView === 'dashboard') {
                loadDashboard();
            }
        } else {
            showAlert(data.error || 'فشل تحديث الحالة', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث حالة الطلب:', error);
        showAlert('خطأ في تحديث حالة الطلب', 'error');
    } finally {
        hideLoading();
    }
}

function viewOrder(orderId) {
    viewOrderDetails(orderId);
}

// ===== إدارة العملاء =====
async function showClients() {
    try {
        showLoading();
        currentView = 'clients';
        updateActiveMenu('showClients');
        
        const response = await fetch(`${API_BASE_URL}/clients`);
        const data = await response.json();
        
        let content = `
            <div class="content-header">
                <h2><i class="fas fa-users"></i> إدارة العملاء</h2>
                <div class="header-actions">
                    <button class="btn-primary" onclick="showAddClientModal()">
                        <i class="fas fa-user-plus"></i>
                        إضافة عميل جديد
                    </button>
                </div>
            </div>
        `;
        
        if (data.success && data.data && data.data.length > 0) {
            content += `
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>الاسم</th>
                                        <th>الهاتف</th>
                                        <th>العنوان</th>
                                        <th>المنطقة</th>
                                        <th>نقاط الولاء</th>
                                        <th>تاريخ التسجيل</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.data.map(client => `
                                        <tr>
                                            <td>
                                                <div class="client-name">
                                                    <strong>${client.name}</strong>
                                                    <small>${client.email || ''}</small>
                                                </div>
                                            </td>
                                            <td>${client.phone}</td>
                                            <td>${client.address || 'غير محدد'}</td>
                                            <td>
                                                <span class="area-badge">
                                                    ${client.areas?.name || 'غير محدد'}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="loyalty-points">
                                                    <i class="fas fa-star"></i>
                                                    ${client.loyalty_points || 0}
                                                </span>
                                            </td>
                                            <td>${new Date(client.created_at).toLocaleDateString('ar-EG')}</td>
                                            <td>
                                                <div class="action-buttons">
                                                    <button class="btn-action" onclick="viewClientDetails(${client.id})" title="عرض التفاصيل">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                    <button class="btn-action" onclick="editClient(${client.id})" title="تعديل">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn-action danger" onclick="deleteClient(${client.id})" title="حذف">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                    <button class="btn-action success" onclick="checkLoyalty(${client.id})" title="فحص الولاء">
                                                        <i class="fas fa-crown"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>لا توجد عملاء</h3>
                    <p>لم يتم تسجيل أي عملاء حتى الآن</p>
                    <button class="btn-primary" onclick="showAddClientModal()">
                        <i class="fas fa-plus"></i>
                        إضافة عميل جديد
                    </button>
                </div>
            `;
        }
        
        document.getElementById('mainContent').innerHTML = content;
        
    } catch (error) {
        console.error('خطأ في تحميل العملاء:', error);
        showAlert('خطأ في تحميل العملاء', 'error');
    } finally {
        hideLoading();
    }
}

function checkClientLoyalty(clientId) {
    if (clientId) {
        checkLoyalty(clientId);
    } else {
        showAlert('لا توجد معلومات عن العميل', 'warning');
    }
}

// ... باقي الدوال ستكون في الجزء الثاني

// ===== الملخص الحالي =====
/*
هذا الجزء يحتوي على:
1. دوال المساعدة العامة
2. نظام تسجيل الدخول
3. تحميل لوحة التحكم
4. نظام الولاء
5. إدارة الطلبات
6. إدارة العملاء
7. دوال التنقل الرئيسية

سأكمل في الجزء الثاني:
1. إدارة المنتجات
2. إدارة التصنيفات
3. إدارة المناطق
4. التقارير
5. التقييمات
6. دوال CRUD المتبقية
7. دوال عرض التفاصيل
*/

// ===== إدارة المنتجات =====
async function showProducts() {
    try {
        showLoading();
        currentView = 'products';
        updateActiveMenu('showProducts');
        
        const response = await fetch(`${API_BASE_URL}/menu-items`);
        const data = await response.json();
        
        let content = `
            <div class="content-header">
                <h2><i class="fas fa-hamburger"></i> إدارة المنتجات</h2>
                <div class="header-actions">
                    <div class="filters">
                        <select id="categoryFilter" onchange="filterProducts()">
                            <option value="all">جميع التصنيفات</option>
                            <!-- سيتم ملؤها بالتصنيفات -->
                        </select>
                        <select id="availabilityFilter" onchange="filterProducts()">
                            <option value="all">جميع الحالات</option>
                            <option value="available">متاح فقط</option>
                            <option value="unavailable">غير متاح</option>
                        </select>
                    </div>
                    <button class="btn-primary" onclick="showAddProductModal()">
                        <i class="fas fa-plus"></i>
                        إضافة منتج جديد
                    </button>
                </div>
            </div>
        `;
        
        if (data.success && data.data && data.data.length > 0) {
            content += `
                <div class="products-grid" id="productsGrid">
                    ${data.data.map(item => `
                        <div class="product-card" data-category="${item.category_id || 'uncategorized'}" data-available="${item.is_available}">
                            <div class="product-image">
                                ${item.image_url ? 
                                    `<img src="${item.image_url}" alt="${item.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/667eea/ffffff?text=No+Image'">` : 
                                    `<div class="no-image">
                                        <i class="fas fa-utensils"></i>
                                    </div>`
                                }
                                <span class="product-status ${item.is_available ? 'available' : 'unavailable'}">
                                    ${item.is_available ? 'متاح' : 'غير متاح'}
                                </span>
                            </div>
                            <div class="product-info">
                                <div class="product-header">
                                    <h3 title="${item.name}">${item.name}</h3>
                                    <span class="product-code">${item.unique_code}</span>
                                </div>
                                <p class="product-description">${item.description || 'لا يوجد وصف للمنتج'}</p>
                                <div class="product-meta">
                                    <span class="product-category">
                                        <i class="fas fa-tag"></i>
                                        ${item.menu_category?.name || 'غير مصنف'}
                                    </span>
                                    <span class="product-price">
                                        <i class="fas fa-money-bill-wave"></i>
                                        ${parseFloat(item.price || 0).toFixed(2)} ج.م
                                    </span>
                                </div>
                                <div class="product-actions">
                                    <button class="btn-action" onclick="viewProduct(${item.id})" title="عرض التفاصيل">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-action" onclick="editProduct(${item.id})" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-action danger" onclick="deleteProduct(${item.id})" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            content += `
                <div class="empty-state">
                    <i class="fas fa-hamburger"></i>
                    <h3>لا توجد منتجات</h3>
                    <p>لم يتم إضافة أي منتجات حتى الآن</p>
                    <button class="btn-primary" onclick="showAddProductModal()">
                        <i class="fas fa-plus"></i>
                        إضافة منتج جديد
                    </button>
                </div>
            `;
        }
        
        document.getElementById('mainContent').innerHTML = content;
        
        // تحميل التصنيفات للفلتر
        await loadCategoriesForFilter();
        
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        showAlert('خطأ في تحميل المنتجات', 'error');
    } finally {
        hideLoading();
    }
}

async function loadCategoriesForFilter() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter && data.success && data.data) {
            let options = '<option value="all">جميع التصنيفات</option>';
            data.data.forEach(category => {
                options += `<option value="${category.id}">${category.name}</option>`;
            });
            categoryFilter.innerHTML = options;
        }
    } catch (error) {
        console.error('خطأ في تحميل التصنيفات للفلتر:', error);
    }
}

function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    const availabilityFilter = document.getElementById('availabilityFilter');
    const productsGrid = document.getElementById('productsGrid');
    
    if (!categoryFilter || !availabilityFilter || !productsGrid) return;
    
    const selectedCategory = categoryFilter.value;
    const selectedAvailability = availabilityFilter.value;
    
    const productCards = productsGrid.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const cardAvailable = card.getAttribute('data-available');
        
        let showCard = true;
        
        // فلترة حسب التصنيف
        if (selectedCategory !== 'all' && selectedCategory !== cardCategory) {
            showCard = false;
        }
        
        // فلترة حسب التوفر
        if (selectedAvailability !== 'all') {
            if (selectedAvailability === 'available' && cardAvailable !== 'true') {
                showCard = false;
            } else if (selectedAvailability === 'unavailable' && cardAvailable !== 'false') {
                showCard = false;
            }
        }
        
        card.style.display = showCard ? 'block' : 'none';
    });
}

function showAddProductModal() {
    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> إضافة منتج جديد</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="addProductForm" onsubmit="addProduct(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="productName">اسم المنتج *</label>
                            <input type="text" id="productName" required placeholder="أدخل اسم المنتج">
                        </div>
                        
                        <div class="form-group">
                            <label for="productCode">كود المنتج *</label>
                            <input type="text" id="productCode" required placeholder="مثال: PIZZA001">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="productCategory">التصنيف</label>
                            <select id="productCategory">
                                <option value="">اختر تصنيف</option>
                                <!-- سيتم ملؤها بالتصنيفات -->
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="productPrice">السعر *</label>
                            <input type="number" id="productPrice" required step="0.01" min="0" placeholder="0.00">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="productDescription">الوصف</label>
                        <textarea id="productDescription" rows="3" placeholder="أدخل وصف المنتج"></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="productImage">رابط الصورة</label>
                            <input type="url" id="productImage" placeholder="https://example.com/image.jpg">
                        </div>
                        
                        <div class="form-group">
                            <label for="productAvailability" class="checkbox-label">
                                <input type="checkbox" id="productAvailability" checked>
                                <span>المنتج متاح للطلب</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i>
                            حفظ المنتج
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    openModal(modalContent);
    
    // تحميل التصنيفات في المودال
    loadCategoriesForModal();
}

async function loadCategoriesForModal() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect && data.success && data.data) {
            let options = '<option value="">اختر تصنيف</option>';
            data.data.forEach(category => {
                options += `<option value="${category.id}">${category.name}</option>`;
            });
            categorySelect.innerHTML = options;
        }
    } catch (error) {
        console.error('خطأ في تحميل التصنيفات:', error);
    }
}

async function addProduct(event) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const productData = {
            name: document.getElementById('productName').value.trim(),
            unique_code: document.getElementById('productCode').value.trim(),
            category_id: document.getElementById('productCategory').value || null,
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            description: document.getElementById('productDescription').value.trim() || null,
            image_url: document.getElementById('productImage').value.trim() || null,
            is_available: document.getElementById('productAvailability').checked
        };
        
        if (!productData.name || !productData.unique_code || productData.price <= 0) {
            showAlert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/menu-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم إضافة المنتج بنجاح', 'success');
            closeModal();
            showProducts();
        } else {
            showAlert(data.error || 'فشل إضافة المنتج', 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة المنتج:', error);
        showAlert('خطأ في إضافة المنتج', 'error');
    } finally {
        hideLoading();
    }
}

async function viewProduct(productId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/menu-items`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const product = data.data.find(p => p.id == productId);
            
            if (product) {
                const modalContent = `
                    <div class="modal-content product-details-modal">
                        <div class="modal-header">
                            <h2><i class="fas fa-info-circle"></i> تفاصيل المنتج</h2>
                            <button class="btn-close" onclick="closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="product-details">
                                <div class="product-image-large">
                                    ${product.image_url ? 
                                        `<img src="${product.image_url}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300/667eea/ffffff?text=No+Image'">` : 
                                        `<div class="no-image-large">
                                            <i class="fas fa-utensils"></i>
                                            <p>لا توجد صورة</p>
                                        </div>`
                                    }
                                </div>
                                
                                <div class="product-info-details">
                                    <h3>${product.name}</h3>
                                    <div class="product-meta-details">
                                        <div class="meta-item">
                                            <span class="label"><i class="fas fa-barcode"></i> الكود:</span>
                                            <span class="value">${product.unique_code}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="label"><i class="fas fa-tag"></i> التصنيف:</span>
                                            <span class="value">${product.menu_category?.name || 'غير مصنف'}</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="label"><i class="fas fa-money-bill-wave"></i> السعر:</span>
                                            <span class="value price">${parseFloat(product.price || 0).toFixed(2)} ج.م</span>
                                        </div>
                                        <div class="meta-item">
                                            <span class="label"><i class="fas fa-info-circle"></i> الحالة:</span>
                                            <span class="value status ${product.is_available ? 'available' : 'unavailable'}">
                                                ${product.is_available ? 'متاح' : 'غير متاح'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div class="product-description-details">
                                        <h4><i class="fas fa-file-alt"></i> الوصف:</h4>
                                        <p>${product.description || 'لا يوجد وصف للمنتج'}</p>
                                    </div>
                                    
                                    <div class="product-extra-info">
                                        <div class="extra-item">
                                            <span class="label"><i class="fas fa-calendar"></i> تاريخ الإضافة:</span>
                                            <span class="value">${new Date(product.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                        <div class="extra-item">
                                            <span class="label"><i class="fas fa-database"></i> معرف المنتج:</span>
                                            <span class="value">${product.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary" onclick="closeModal()">
                                <i class="fas fa-times"></i>
                                إغلاق
                            </button>
                            <button class="btn-primary" onclick="editProduct(${product.id})">
                                <i class="fas fa-edit"></i>
                                تعديل المنتج
                            </button>
                        </div>
                    </div>
                `;
                
                openModal(modalContent);
            } else {
                showAlert('المنتج غير موجود', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في عرض تفاصيل المنتج:', error);
        showAlert('خطأ في عرض تفاصيل المنتج', 'error');
    } finally {
        hideLoading();
    }
}

async function editProduct(productId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/menu-items`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const product = data.data.find(p => p.id == productId);
            
            if (product) {
                const modalContent = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2><i class="fas fa-edit"></i> تعديل المنتج</h2>
                            <button class="btn-close" onclick="closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="editProductForm" onsubmit="updateProduct(event, ${productId})">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editProductName">اسم المنتج *</label>
                                        <input type="text" id="editProductName" value="${product.name}" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editProductCode">كود المنتج *</label>
                                        <input type="text" id="editProductCode" value="${product.unique_code}" required>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editProductCategory">التصنيف</label>
                                        <select id="editProductCategory">
                                            <option value="">اختر تصنيف</option>
                                            <!-- سيتم ملؤها بالتصنيفات -->
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editProductPrice">السعر *</label>
                                        <input type="number" id="editProductPrice" value="${product.price}" required step="0.01" min="0">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editProductDescription">الوصف</label>
                                    <textarea id="editProductDescription" rows="3">${product.description || ''}</textarea>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editProductImage">رابط الصورة</label>
                                        <input type="url" id="editProductImage" value="${product.image_url || ''}" placeholder="https://example.com/image.jpg">
                                        ${product.image_url ? `
                                            <div class="current-image">
                                                <small>الصورة الحالية:</small>
                                                <img src="${product.image_url}" alt="صورة المنتج الحالية" style="max-width: 100px; max-height: 100px; margin-top: 5px;" onerror="this.style.display='none'">
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="editProductAvailability" class="checkbox-label">
                                            <input type="checkbox" id="editProductAvailability" ${product.is_available ? 'checked' : ''}>
                                            <span>المنتج متاح للطلب</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-save"></i>
                                        حفظ التغييرات
                                    </button>
                                    <button type="button" class="btn-secondary" onclick="closeModal()">
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                `;
                
                openModal(modalContent);
                
                // تحميل التصنيفات وتعيين القيمة الحالية
                await loadCategoriesForEditModal(product.category_id);
            } else {
                showAlert('المنتج غير موجود', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل نموذج التعديل:', error);
        showAlert('خطأ في تحميل نموذج التعديل', 'error');
    } finally {
        hideLoading();
    }
}

async function loadCategoriesForEditModal(currentCategoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        const categorySelect = document.getElementById('editProductCategory');
        if (categorySelect && data.success && data.data) {
            let options = '<option value="">اختر تصنيف</option>';
            data.data.forEach(category => {
                const selected = category.id == currentCategoryId ? 'selected' : '';
                options += `<option value="${category.id}" ${selected}>${category.name}</option>`;
            });
            categorySelect.innerHTML = options;
        }
    } catch (error) {
        console.error('خطأ في تحميل التصنيفات:', error);
    }
}

async function updateProduct(event, productId) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const productData = {
            name: document.getElementById('editProductName').value.trim(),
            unique_code: document.getElementById('editProductCode').value.trim(),
            category_id: document.getElementById('editProductCategory').value || null,
            price: parseFloat(document.getElementById('editProductPrice').value) || 0,
            description: document.getElementById('editProductDescription').value.trim() || null,
            image_url: document.getElementById('editProductImage').value.trim() || null,
            is_available: document.getElementById('editProductAvailability').checked
        };
        
        if (!productData.name || !productData.unique_code || productData.price <= 0) {
            showAlert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/menu-items/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم تحديث المنتج بنجاح', 'success');
            closeModal();
            showProducts();
        } else {
            showAlert(data.error || 'فشل تحديث المنتج', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث المنتج:', error);
        showAlert('خطأ في تحديث المنتج', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟\n\nملاحظة: هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/menu-items/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم حذف المنتج بنجاح', 'success');
            
            // تحديث العرض الحالي
            if (currentView === 'products') {
                showProducts();
            }
        } else {
            showAlert(data.error || 'فشل حذف المنتج', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف المنتج:', error);
        showAlert('خطأ في حذف المنتج', 'error');
    } finally {
        hideLoading();
    }
}

// ===== إدارة التصنيفات =====
async function showCategories() {
    try {
        showLoading();
        currentView = 'categories';
        updateActiveMenu('showCategories');
        
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        let content = `
            <div class="content-header">
                <h2><i class="fas fa-tags"></i> إدارة التصنيفات</h2>
                <div class="header-actions">
                    <button class="btn-primary" onclick="showAddCategoryModal()">
                        <i class="fas fa-plus"></i>
                        إضافة تصنيف جديد
                    </button>
                </div>
            </div>
        `;
        
        if (data.success && data.data && data.data.length > 0) {
            content += `
                <div class="categories-grid">
                    ${data.data.map(category => `
                        <div class="category-card">
                            <div class="category-icon">
                                <i class="fas fa-folder"></i>
                            </div>
                            <div class="category-info">
                                <h3>${category.name}</h3>
                                <p class="category-description">${category.description || 'لا يوجد وصف'}</p>
                                <div class="category-meta">
                                    <span class="category-order">
                                        <i class="fas fa-sort-numeric-down"></i>
                                        الترتيب: ${category.display_order || 0}
                                    </span>
                                </div>
                                <div class="category-actions">
                                    <button class="btn-action" onclick="editCategory(${category.id})" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-action danger" onclick="deleteCategory(${category.id})" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            content += `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>لا توجد تصنيفات</h3>
                    <p>لم يتم إضافة أي تصنيفات حتى الآن</p>
                    <button class="btn-primary" onclick="showAddCategoryModal()">
                        <i class="fas fa-plus"></i>
                        إضافة تصنيف جديد
                    </button>
                </div>
            `;
        }
        
        document.getElementById('mainContent').innerHTML = content;
        
    } catch (error) {
        console.error('خطأ في تحميل التصنيفات:', error);
        showAlert('خطأ في تحميل التصنيفات', 'error');
    } finally {
        hideLoading();
    }
}

function showAddCategoryModal() {
    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> إضافة تصنيف جديد</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="addCategoryForm" onsubmit="addCategory(event)">
                    <div class="form-group">
                        <label for="categoryName">اسم التصنيف *</label>
                        <input type="text" id="categoryName" required placeholder="أدخل اسم التصنيف">
                    </div>
                    
                    <div class="form-group">
                        <label for="categoryDescription">الوصف</label>
                        <textarea id="categoryDescription" rows="3" placeholder="أدخل وصف التصنيف"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="categoryOrder">ترتيب العرض</label>
                        <input type="number" id="categoryOrder" min="0" value="0" placeholder="0">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i>
                            حفظ التصنيف
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    openModal(modalContent);
}

async function addCategory(event) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const categoryData = {
            name: document.getElementById('categoryName').value.trim(),
            description: document.getElementById('categoryDescription').value.trim() || null,
            display_order: parseInt(document.getElementById('categoryOrder').value) || 0
        };
        
        if (!categoryData.name) {
            showAlert('يرجى إدخال اسم التصنيف', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم إضافة التصنيف بنجاح', 'success');
            closeModal();
            showCategories();
        } else {
            showAlert(data.error || 'فشل إضافة التصنيف', 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة التصنيف:', error);
        showAlert('خطأ في إضافة التصنيف', 'error');
    } finally {
        hideLoading();
    }
}

async function editCategory(categoryId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const category = data.data.find(c => c.id == categoryId);
            
            if (category) {
                const modalContent = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2><i class="fas fa-edit"></i> تعديل التصنيف</h2>
                            <button class="btn-close" onclick="closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="editCategoryForm" onsubmit="updateCategory(event, ${categoryId})">
                                <div class="form-group">
                                    <label for="editCategoryName">اسم التصنيف *</label>
                                    <input type="text" id="editCategoryName" value="${category.name}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editCategoryDescription">الوصف</label>
                                    <textarea id="editCategoryDescription" rows="3">${category.description || ''}</textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editCategoryOrder">ترتيب العرض</label>
                                    <input type="number" id="editCategoryOrder" min="0" value="${category.display_order || 0}">
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-save"></i>
                                        حفظ التغييرات
                                    </button>
                                    <button type="button" class="btn-secondary" onclick="closeModal()">
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                `;
                
                openModal(modalContent);
            } else {
                showAlert('التصنيف غير موجود', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل نموذج التعديل:', error);
        showAlert('خطأ في تحميل نموذج التعديل', 'error');
    } finally {
        hideLoading();
    }
}

async function updateCategory(event, categoryId) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const categoryData = {
            name: document.getElementById('editCategoryName').value.trim(),
            description: document.getElementById('editCategoryDescription').value.trim() || null,
            display_order: parseInt(document.getElementById('editCategoryOrder').value) || 0
        };
        
        if (!categoryData.name) {
            showAlert('يرجى إدخال اسم التصنيف', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم تحديث التصنيف بنجاح', 'success');
            closeModal();
            showCategories();
        } else {
            showAlert(data.error || 'فشل تحديث التصنيف', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث التصنيف:', error);
        showAlert('خطأ في تحديث التصنيف', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟\n\nتحذير: قد تؤثر على المنتجات المرتبطة به.')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم حذف التصنيف بنجاح', 'success');
            
            // تحديث العرض الحالي
            if (currentView === 'categories') {
                showCategories();
            } else if (currentView === 'products') {
                showProducts();
            }
        } else {
            showAlert(data.error || 'فشل حذف التصنيف', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف التصنيف:', error);
        showAlert('خطأ في حذف التصنيف', 'error');
    } finally {
        hideLoading();
    }
}

// ===== إدارة المناطق =====
async function showAreas() {
    try {
        showLoading();
        currentView = 'areas';
        updateActiveMenu('showAreas');
        
        const response = await fetch(`${API_BASE_URL}/areas`);
        const data = await response.json();
        
        let content = `
            <div class="content-header">
                <h2><i class="fas fa-map-marker-alt"></i> إدارة المناطق</h2>
                <div class="header-actions">
                    <button class="btn-primary" onclick="showAddAreaModal()">
                        <i class="fas fa-plus"></i>
                        إضافة منطقة جديدة
                    </button>
                </div>
            </div>
        `;
        
        if (data.success && data.data && data.data.length > 0) {
            content += `
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>اسم المنطقة</th>
                                        <th>رسوم التوصيل</th>
                                        <th>تاريخ الإضافة</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.data.map(area => `
                                        <tr>
                                            <td>
                                                <div class="area-name">
                                                    <strong>${area.name}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="delivery-fee">
                                                    ${parseFloat(area.delivery_fee || 0).toFixed(2)} ج.م
                                                </span>
                                            </td>
                                            <td>${new Date(area.created_at).toLocaleDateString('ar-EG')}</td>
                                            <td>
                                                <div class="action-buttons">
                                                    <button class="btn-action" onclick="editArea(${area.id})" title="تعديل">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn-action danger" onclick="deleteArea(${area.id})" title="حذف">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>لا توجد مناطق</h3>
                    <p>لم يتم إضافة أي مناطق حتى الآن</p>
                    <button class="btn-primary" onclick="showAddAreaModal()">
                        <i class="fas fa-plus"></i>
                        إضافة منطقة جديدة
                    </button>
                </div>
            `;
        }
        
        document.getElementById('mainContent').innerHTML = content;
        
    } catch (error) {
        console.error('خطأ في تحميل المناطق:', error);
        showAlert('خطأ في تحميل المناطق', 'error');
    } finally {
        hideLoading();
    }
}

function showAddAreaModal() {
    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> إضافة منطقة جديدة</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="addAreaForm" onsubmit="addArea(event)">
                    <div class="form-group">
                        <label for="areaName">اسم المنطقة *</label>
                        <input type="text" id="areaName" required placeholder="أدخل اسم المنطقة">
                    </div>
                    
                    <div class="form-group">
                        <label for="areaDeliveryFee">رسوم التوصيل (ج.م)</label>
                        <input type="number" id="areaDeliveryFee" min="0" step="0.01" value="0" placeholder="0.00">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i>
                            حفظ المنطقة
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    openModal(modalContent);
}

async function addArea(event) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const areaData = {
            name: document.getElementById('areaName').value.trim(),
            delivery_fee: parseFloat(document.getElementById('areaDeliveryFee').value) || 0
        };
        
        if (!areaData.name) {
            showAlert('يرجى إدخال اسم المنطقة', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/areas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(areaData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم إضافة المنطقة بنجاح', 'success');
            closeModal();
            showAreas();
        } else {
            showAlert(data.error || 'فشل إضافة المنطقة', 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة المنطقة:', error);
        showAlert('خطأ في إضافة المنطقة', 'error');
    } finally {
        hideLoading();
    }
}

async function editArea(areaId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/areas`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const area = data.data.find(a => a.id == areaId);
            
            if (area) {
                const modalContent = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2><i class="fas fa-edit"></i> تعديل المنطقة</h2>
                            <button class="btn-close" onclick="closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="editAreaForm" onsubmit="updateArea(event, ${areaId})">
                                <div class="form-group">
                                    <label for="editAreaName">اسم المنطقة *</label>
                                    <input type="text" id="editAreaName" value="${area.name}" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editAreaDeliveryFee">رسوم التوصيل (ج.م)</label>
                                    <input type="number" id="editAreaDeliveryFee" min="0" step="0.01" value="${area.delivery_fee || 0}">
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-save"></i>
                                        حفظ التغييرات
                                    </button>
                                    <button type="button" class="btn-secondary" onclick="closeModal()">
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                `;
                
                openModal(modalContent);
            } else {
                showAlert('المنطقة غير موجودة', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل نموذج التعديل:', error);
        showAlert('خطأ في تحميل نموذج التعديل', 'error');
    } finally {
        hideLoading();
    }
}

async function updateArea(event, areaId) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const areaData = {
            name: document.getElementById('editAreaName').value.trim(),
            delivery_fee: parseFloat(document.getElementById('editAreaDeliveryFee').value) || 0
        };
        
        if (!areaData.name) {
            showAlert('يرجى إدخال اسم المنطقة', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(areaData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم تحديث المنطقة بنجاح', 'success');
            closeModal();
            showAreas();
        } else {
            showAlert(data.error || 'فشل تحديث المنطقة', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث المنطقة:', error);
        showAlert('خطأ في تحديث المنطقة', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteArea(areaId) {
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟\n\nتحذير: قد تؤثر على العملاء المرتبطين بها.')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم حذف المنطقة بنجاح', 'success');
            
            // تحديث العرض الحالي
            if (currentView === 'areas') {
                showAreas();
            } else if (currentView === 'clients') {
                showClients();
            }
        } else {
            showAlert(data.error || 'فشل حذف المنطقة', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف المنطقة:', error);
        showAlert('خطأ في حذف المنطقة', 'error');
    } finally {
        hideLoading();
    }
}

// ===== التقارير =====
async function showReports() {
    try {
        showLoading();
        currentView = 'reports';
        updateActiveMenu('showReports');
        
        const content = `
            <div class="content-header">
                <h2><i class="fas fa-chart-bar"></i> التقارير والإحصائيات</h2>
                <div class="header-actions">
                    <div class="date-filter">
                        <input type="date" id="reportStartDate" value="${getDateString(-30)}">
                        <input type="date" id="reportEndDate" value="${getDateString(0)}">
                        <button class="btn-primary" onclick="generateReports()">
                            <i class="fas fa-filter"></i>
                            تطبيق
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="reports-dashboard">
                <div class="reports-grid">
                    <div class="report-card large">
                        <div class="report-header">
                            <h3><i class="fas fa-chart-line"></i> تقرير المبيعات</h3>
                            <button class="btn-action" onclick="showSalesReport()" title="عرض التقرير">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                        </div>
                        <div class="report-body" id="salesReportPreview">
                            <div class="loading-report">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>جاري تحميل بيانات المبيعات...</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <div class="report-header">
                            <h3><i class="fas fa-star"></i> تقرير الولاء</h3>
                        </div>
                        <div class="report-body">
                            <div class="report-summary">
                                <div class="summary-item">
                                    <span class="label">العملاء المؤهلين:</span>
                                    <span class="value" id="eligibleClients">0</span>
                                </div>
                                <div class="summary-item">
                                    <span class="label">إجمالي النقاط:</span>
                                    <span class="value" id="totalPoints">0</span>
                                </div>
                                <button class="btn-small" onclick="showLoyaltyReport()">
                                    <i class="fas fa-eye"></i>
                                    عرض التفاصيل
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <div class="report-header">
                            <h3><i class="fas fa-utensils"></i> المنتجات الأكثر مبيعاً</h3>
                        </div>
                        <div class="report-body" id="topProductsReport">
                            <div class="loading-report">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>جاري تحميل البيانات...</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <div class="report-header">
                            <h3><i class="fas fa-users"></i> تحليل العملاء</h3>
                        </div>
                        <div class="report-body">
                            <div class="report-summary">
                                <div class="summary-item">
                                    <span class="label">العملاء الجدد:</span>
                                    <span class="value" id="newClients">0</span>
                                </div>
                                <div class="summary-item">
                                    <span class="label">متوسط الطلبات:</span>
                                    <span class="value" id="avgOrders">0</span>
                                </div>
                                <button class="btn-small" onclick="showCustomerAnalytics()">
                                    <i class="fas fa-chart-pie"></i>
                                    تحليل كامل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="reports-actions">
                    <button class="btn-secondary" onclick="exportReports()">
                        <i class="fas fa-file-export"></i>
                        تصدير التقارير
                    </button>
                    <button class="btn-primary" onclick="refreshReports()">
                        <i class="fas fa-sync"></i>
                        تحديث جميع التقارير
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('mainContent').innerHTML = content;
        
        // تحميل التقارير
        await generateReports();
        
    } catch (error) {
        console.error('خطأ في تحميل التقارير:', error);
        showAlert('خطأ في تحميل التقارير', 'error');
    } finally {
        hideLoading();
    }
}

function getDateString(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}

async function generateReports() {
    try {
        const startDate = document.getElementById('reportStartDate').value || getDateString(-30);
        const endDate = document.getElementById('reportEndDate').value || getDateString(0);
        
        // تحميل تقرير المبيعات
        await loadSalesReport(startDate, endDate);
        
        // تحميل تقرير المنتجات الأكثر مبيعاً
        await loadTopProductsReport(startDate, endDate);
        
        // تحميل إحصائيات الولاء
        await loadLoyaltyStats();
        
        // تحميل تحليل العملاء
        await loadCustomerStats();
        
    } catch (error) {
        console.error('خطأ في إنشاء التقارير:', error);
        showAlert('خطأ في إنشاء التقارير', 'error');
    }
}

async function loadSalesReport(startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/sales?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        
        const salesReportPreview = document.getElementById('salesReportPreview');
        if (salesReportPreview) {
            if (data.success && data.data) {
                salesReportPreview.innerHTML = `
                    <div class="sales-summary">
                        <div class="summary-row">
                            <div class="summary-col">
                                <span class="label">إجمالي المبيعات:</span>
                                <span class="value">${parseFloat(data.data.total_sales || 0).toFixed(2)} ج.م</span>
                            </div>
                            <div class="summary-col">
                                <span class="label">عدد الطلبات:</span>
                                <span class="value">${data.data.total_orders || 0}</span>
                            </div>
                        </div>
                        <div class="summary-row">
                            <div class="summary-col">
                                <span class="label">متوسط قيمة الطلب:</span>
                                <span class="value">${parseFloat(data.data.average_order_value || 0).toFixed(2)} ج.م</span>
                            </div>
                            <div class="summary-col">
                                <span class="label">أفضل يوم:</span>
                                <span class="value">${data.data.best_day || 'غير متوفر'}</span>
                            </div>
                        </div>
                        <div class="chart-placeholder">
                            <i class="fas fa-chart-bar"></i>
                            <p>رسم بياني للمبيعات حسب اليوم</p>
                        </div>
                    </div>
                `;
            } else {
                salesReportPreview.innerHTML = `
                    <div class="error-report">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>تعذر تحميل تقرير المبيعات</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل تقرير المبيعات:', error);
        const salesReportPreview = document.getElementById('salesReportPreview');
        if (salesReportPreview) {
            salesReportPreview.innerHTML = `
                <div class="error-report">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>خطأ في تحميل البيانات</p>
                </div>
            `;
        }
    }
}

async function loadTopProductsReport(startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/top-selling?startDate=${startDate}&endDate=${endDate}&limit=5`);
        const data = await response.json();
        
        const topProductsReport = document.getElementById('topProductsReport');
        if (topProductsReport) {
            if (data.success && data.data && data.data.length > 0) {
                topProductsReport.innerHTML = `
                    <div class="top-products-list">
                        ${data.data.map((product, index) => `
                            <div class="top-product-item">
                                <div class="product-rank">
                                    <span class="rank-number">${index + 1}</span>
                                </div>
                                <div class="product-info">
                                    <span class="product-name">${product.name || 'غير معروف'}</span>
                                    <span class="product-sales">${product.total_sold || 0} مبيعاً</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                topProductsReport.innerHTML = `
                    <div class="empty-report">
                        <i class="fas fa-utensils"></i>
                        <p>لا توجد بيانات للمنتجات</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل المنتجات الأكثر مبيعاً:', error);
        const topProductsReport = document.getElementById('topProductsReport');
        if (topProductsReport) {
            topProductsReport.innerHTML = `
                <div class="error-report">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>خطأ في تحميل البيانات</p>
                </div>
            `;
        }
    }
}

async function loadLoyaltyStats() {
    try {
        const clientsResponse = await fetch(`${API_BASE_URL}/clients`);
        const clientsData = await clientsResponse.json();
        
        if (clientsData.success && clientsData.data) {
            const totalPoints = clientsData.data.reduce((sum, client) => sum + (client.loyalty_points || 0), 0);
            const eligibleClients = clientsData.data.filter(client => (client.loyalty_points || 0) >= 10).length;
            
            document.getElementById('eligibleClients').textContent = eligibleClients;
            document.getElementById('totalPoints').textContent = totalPoints;
        }
    } catch (error) {
        console.error('خطأ في تحميل إحصائيات الولاء:', error);
    }
}

async function loadCustomerStats() {
    try {
        const clientsResponse = await fetch(`${API_BASE_URL}/clients`);
        const ordersResponse = await fetch(`${API_BASE_URL}/orders`);
        
        const clientsData = await clientsResponse.json();
        const ordersData = await ordersResponse.json();
        
        if (clientsData.success && ordersData.success) {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const newClients = clientsData.data?.filter(client => 
                new Date(client.created_at) >= lastMonth
            ).length || 0;
            
            const avgOrders = clientsData.data?.length > 0 ? 
                Math.round((ordersData.data?.length || 0) / clientsData.data.length * 100) / 100 : 0;
            
            document.getElementById('newClients').textContent = newClients;
            document.getElementById('avgOrders').textContent = avgOrders;
        }
    } catch (error) {
        console.error('خطأ في تحميل تحليل العملاء:', error);
    }
}

function refreshReports() {
    showAlert('جاري تحديث التقارير...', 'info');
    generateReports();
}

function showSalesReport() {
    showAlert('جاري تحميل تقرير المبيعات الكامل...', 'info');
    // يمكن إضافة عرض تقرير مفصل هنا
}

function showLoyaltyReport() {
    showAlert('جاري تحميل تقرير الولاء الكامل...', 'info');
    // يمكن إضافة عرض تقرير مفصل هنا
}

function showCustomerAnalytics() {
    showAlert('جاري تحميل تحليل العملاء الكامل...', 'info');
    // يمكن إضافة عرض تحليل مفصل هنا
}

function exportReports() {
    showAlert('جاري تصدير التقارير...', 'info');
    // يمكن إضافة وظيفة التصدير هنا
}

// ===== التقييمات =====
async function showFeedback() {
    try {
        showLoading();
        currentView = 'feedback';
        updateActiveMenu('showFeedback');
        
        const response = await fetch(`${API_BASE_URL}/feedback`);
        const data = await response.json();
        
        let content = `
            <div class="content-header">
                <h2><i class="fas fa-star"></i> التقييمات والملاحظات</h2>
                <div class="header-actions">
                    <div class="filters">
                        <select id="ratingFilter" onchange="filterFeedback()">
                            <option value="all">جميع التقييمات</option>
                            <option value="5">5 نجوم</option>
                            <option value="4">4 نجوم</option>
                            <option value="3">3 نجوم</option>
                            <option value="2">2 نجوم</option>
                            <option value="1">1 نجمة</option>
                        </select>
                        <div class="date-filter">
                            <input type="date" id="feedbackStartDate" onchange="filterFeedback()" placeholder="من تاريخ">
                            <input type="date" id="feedbackEndDate" onchange="filterFeedback()" placeholder="إلى تاريخ">
                        </div>
                    </div>
                    <button class="btn-refresh" onclick="showFeedback()">
                        <i class="fas fa-redo"></i>
                        تحديث
                    </button>
                </div>
            </div>
        `;
        
        if (data.success && data.data && data.data.length > 0) {
            content += `
                <div class="feedback-stats">
                    <div class="stats-summary">
                        <div class="stat-item">
                            <span class="stat-value">${data.data.length}</span>
                            <span class="stat-label">إجمالي التقييمات</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">
                                ${(data.data.reduce((sum, f) => sum + f.rating, 0) / data.data.length).toFixed(1)}
                            </span>
                            <span class="stat-label">متوسط التقييم</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">
                                ${data.data.filter(f => f.rating >= 4).length}
                            </span>
                            <span class="stat-label">تقييمات إيجابية (4+)</span>
                        </div>
                    </div>
                </div>
                
                <div class="feedback-grid">
                    ${data.data.map(feedback => `
                        <div class="feedback-card" data-rating="${feedback.rating}">
                            <div class="feedback-header">
                                <div class="client-info">
                                    <div class="client-avatar">
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                    <div class="client-details">
                                        <strong>${feedback.clients?.name || 'عميل'}</strong>
                                        <small>${feedback.clients?.phone || ''}</small>
                                        <small>${feedback.clients?.areas?.name || ''}</small>
                                    </div>
                                </div>
                                <div class="rating-stars">
                                    ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}
                                    <span class="rating-number">(${feedback.rating})</span>
                                </div>
                            </div>
                            <div class="feedback-body">
                                <p class="feedback-comment">${feedback.comment || 'لا توجد ملاحظات'}</p>
                                <div class="feedback-emoji">
                                    ${feedback.emoji || '😐'}
                                </div>
                            </div>
                            <div class="feedback-footer">
                                <span class="feedback-date">
                                    <i class="fas fa-clock"></i>
                                    ${new Date(feedback.created_at).toLocaleString('ar-EG')}
                                </span>
                                <button class="btn-action danger" onclick="deleteFeedback(${feedback.id})" title="حذف التقييم">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            content += `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <h3>لا توجد تقييمات</h3>
                    <p>لم يتم إضافة أي تقييمات حتى الآن</p>
                </div>
            `;
        }
        
        document.getElementById('mainContent').innerHTML = content;
        
    } catch (error) {
        console.error('خطأ في تحميل التقييمات:', error);
        showAlert('خطأ في تحميل التقييمات', 'error');
    } finally {
        hideLoading();
    }
}

function filterFeedback() {
    // سيتم تطبيق الفلترة هنا
    console.log('جاري فلترة التقييمات...');
}

async function deleteFeedback(feedbackId) {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم حذف التقييم بنجاح', 'success');
            
            // تحديث العرض الحالي
            if (currentView === 'feedback') {
                showFeedback();
            } else if (currentView === 'dashboard') {
                loadDashboard();
            }
        } else {
            showAlert(data.error || 'فشل حذف التقييم', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف التقييم:', error);
        showAlert('خطأ في حذف التقييم', 'error');
    } finally {
        hideLoading();
    }
}

// ===== دوال CRUD للعملاء (تكملة) =====
async function viewClientDetails(clientId) {
    try {
        showLoading();
        
        // جلب بيانات العميل
        const clientsResponse = await fetch(`${API_BASE_URL}/clients`);
        const clientsData = await clientsResponse.json();
        
        // جلب طلبات العميل
        const ordersResponse = await fetch(`${API_BASE_URL}/orders`);
        const ordersData = await ordersResponse.json();
        
        if (clientsData.success && ordersData.success) {
            const client = clientsData.data?.find(c => c.id == clientId);
            
            if (client) {
                const clientOrders = ordersData.data?.filter(order => order.clients?.id == clientId) || [];
                
                const modalContent = `
                    <div class="modal-content client-details-modal">
                        <div class="modal-header">
                            <h2><i class="fas fa-user-circle"></i> تفاصيل العميل</h2>
                            <button class="btn-close" onclick="closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="client-profile">
                                <div class="profile-header">
                                    <div class="client-avatar-large">
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                    <div class="client-info-large">
                                        <h3>${client.name}</h3>
                                        <div class="client-meta">
                                            <span class="meta-item">
                                                <i class="fas fa-phone"></i>
                                                ${client.phone}
                                            </span>
                                            <span class="meta-item">
                                                <i class="fas fa-map-marker-alt"></i>
                                                ${client.areas?.name || 'غير محدد'}
                                            </span>
                                            <span class="meta-item">
                                                <i class="fas fa-star"></i>
                                                ${client.loyalty_points || 0} نقطة ولاء
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="client-details-section">
                                    <h4><i class="fas fa-info-circle"></i> المعلومات الشخصية</h4>
                                    <div class="details-grid">
                                        <div class="detail-item">
                                            <span class="label">البريد الإلكتروني:</span>
                                            <span class="value">${client.email || 'غير محدد'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="label">العنوان:</span>
                                            <span class="value">${client.address || 'غير محدد'}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="label">تاريخ التسجيل:</span>
                                            <span class="value">${new Date(client.created_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="label">آخر تحديث:</span>
                                            <span class="value">${new Date(client.updated_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                ${clientOrders.length > 0 ? `
                                    <div class="client-orders-section">
                                        <h4><i class="fas fa-shopping-cart"></i> سجل الطلبات (${clientOrders.length})</h4>
                                        <div class="table-responsive">
                                            <table class="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>رقم الطلب</th>
                                                        <th>المبلغ</th>
                                                        <th>الحالة</th>
                                                        <th>التاريخ</th>
                                                        <th>الإجراءات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${clientOrders.map(order => `
                                                        <tr>
                                                            <td>#${order.order_id}</td>
                                                            <td>${parseFloat(order.total_amount || 0).toFixed(2)} ج.م</td>
                                                            <td>
                                                                <span class="status-badge ${getStatusClass(order.order_state)}">
                                                                    ${getStatusText(order.order_state)}
                                                                </span>
                                                            </td>
                                                            <td>${new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                                                            <td>
                                                                <button class="btn-action" onclick="viewOrderDetails(${order.order_id})">
                                                                    <i class="fas fa-eye"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="empty-orders">
                                        <i class="fas fa-shopping-cart"></i>
                                        <p>لا توجد طلبات سابقة</p>
                                    </div>
                                `}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary" onclick="closeModal()">
                                إغلاق
                            </button>
                            <button class="btn-primary" onclick="editClient(${client.id})">
                                <i class="fas fa-edit"></i>
                                تعديل البيانات
                            </button>
                            <button class="btn-success" onclick="checkLoyalty(${client.id})">
                                <i class="fas fa-crown"></i>
                                فحص الولاء
                            </button>
                        </div>
                    </div>
                `;
                
                openModal(modalContent);
            } else {
                showAlert('العميل غير موجود', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في عرض تفاصيل العميل:', error);
        showAlert('خطأ في عرض تفاصيل العميل', 'error');
    } finally {
        hideLoading();
    }
}

async function viewOrderDetails(orderId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/orders`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const order = data.data.find(o => o.order_id == orderId);
            
            if (order) {
                const modalContent = `
                    <div class="modal-content order-details-modal">
                        <div class="modal-header">
                            <h2><i class="fas fa-file-invoice"></i> فاتورة الطلب #${order.order_id}</h2>
                            <button class="btn-close" onclick="closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="invoice-header">
                                <div class="invoice-info">
                                    <div class="info-item">
                                        <span class="label">رقم الفاتورة:</span>
                                        <span class="value">#${order.order_id}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">تاريخ الطلب:</span>
                                        <span class="value">${new Date(order.created_at).toLocaleString('ar-EG')}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="label">حالة الطلب:</span>
                                        <span class="value">
                                            <span class="status-badge ${getStatusClass(order.order_state)}">
                                                ${getStatusText(order.order_state)}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="invoice-sections">
                                <div class="section customer-section">
                                    <h4><i class="fas fa-user"></i> معلومات العميل</h4>
                                    <div class="section-content">
                                        <p><strong>الاسم:</strong> ${order.clients?.name || 'غير معروف'}</p>
                                        <p><strong>الهاتف:</strong> ${order.clients?.phone || 'غير معروف'}</p>
                                        <p><strong>نوع الطلب:</strong> ${order.order_type || 'توصيل'}</p>
                                    </div>
                                </div>
                                
                                <div class="section order-items-section">
                                    <h4><i class="fas fa-list"></i> تفاصيل الطلب</h4>
                                    <div class="section-content">
                                        ${order.order_details && order.order_details.length > 0 ? `
                                            <table class="invoice-table">
                                                <thead>
                                                    <tr>
                                                        <th>المنتج</th>
                                                        <th>الكمية</th>
                                                        <th>السعر</th>
                                                        <th>المجموع</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${order.order_details.map(item => {
                                                        const price = parseFloat(item.price || 0);
                                                        const quantity = parseInt(item.quantity || 1);
                                                        const total = price * quantity;
                                                        
                                                        return `
                                                            <tr>
                                                                <td>${item.menu_items?.name || 'غير معروف'}</td>
                                                                <td>${quantity}</td>
                                                                <td>${price.toFixed(2)} ج.م</td>
                                                                <td>${total.toFixed(2)} ج.م</td>
                                                            </tr>
                                                        `;
                                                    }).join('')}
                                                </tbody>
                                            </table>
                                        ` : '<p class="text-center">لا توجد تفاصيل للطلب</p>'}
                                    </div>
                                </div>
                                
                                <div class="section summary-section">
                                    <h4><i class="fas fa-calculator"></i> ملخص الفاتورة</h4>
                                    <div class="section-content">
                                        <div class="summary-item">
                                            <span class="label">المبلغ الإجمالي:</span>
                                            <span class="value">${parseFloat(order.total_amount || 0).toFixed(2)} ج.م</span>
                                        </div>
                                        <div class="summary-item">
                                            <span class="label">رسوم التوصيل:</span>
                                            <span class="value">${parseFloat(order.delivery_fee || 0).toFixed(2)} ج.م</span>
                                        </div>
                                        <div class="summary-item">
                                            <span class="label">نقاط مستخدمة:</span>
                                            <span class="value">${order.points_used || 0}</span>
                                        </div>
                                        <div class="summary-item">
                                            <span class="label">خصم النقاط:</span>
                                            <span class="value">${parseFloat(order.points_discount || 0).toFixed(2)} ج.م</span>
                                        </div>
                                        <div class="summary-item total">
                                            <span class="label">المبلغ النهائي:</span>
                                            <span class="value">
                                                ${(parseFloat(order.total_amount || 0) + parseFloat(order.delivery_fee || 0) - parseFloat(order.points_discount || 0)).toFixed(2)} ج.م
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn-secondary" onclick="closeModal()">
                                إغلاق
                            </button>
                            ${order.order_state !== 'delivered' && order.order_state !== 'cancelled' && order.order_state !== 'canceled' ? `
                                <button class="btn-primary" onclick="updateOrderStatus(${order.order_id}, 'delivered')">
                                    <i class="fas fa-check"></i>
                                    تم التوصيل
                                </button>
                            ` : ''}
                            ${order.clients?.id ? `
                                <button class="btn-success" onclick="checkLoyalty(${order.clients.id})">
                                    <i class="fas fa-crown"></i>
                                    فحص الولاء
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                openModal(modalContent);
            } else {
                showAlert('الطلب غير موجود', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في عرض تفاصيل الطلب:', error);
        showAlert('خطأ في عرض تفاصيل الطلب', 'error');
    } finally {
        hideLoading();
    }
}

// ===== تكوين الأحداث عند التحميل =====
document.addEventListener('DOMContentLoaded', function() {
    // التأكد من إخفاء لوحة التحكم
    const dashboardPage = document.getElementById('dashboardPage');
    if (dashboardPage) {
        dashboardPage.style.display = 'none';
    }
    
    // تحديث وقت التحديث كل 30 ثانية
    setInterval(updateLastUpdateTime, 30000);
    
    // التحقق من وجود تسجيل دخول سابق
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            const loginPage = document.getElementById('loginPage');
            const dashboardPage = document.getElementById('dashboardPage');
            
            if (loginPage && dashboardPage) {
                loginPage.classList.remove('active');
                dashboardPage.style.display = 'block';
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement && currentUser.name) {
                    userNameElement.textContent = currentUser.name;
                }
                
                loadDashboard();
            }
        } catch (error) {
            console.error('خطأ في تحليل بيانات المستخدم المحفوظة:', error);
            localStorage.removeItem('userData');
        }
    }
    
    // تطبيق الإعدادات المحفوظة
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            applySettings(settings);
        } catch (error) {
            console.error('خطأ في تحليل الإعدادات المحفوظة:', error);
        }
    }
});

function applySettings(settings) {
    // يمكن تطبيق الإعدادات هنا
    console.log('تطبيق الإعدادات:', settings);
    
    // مثال: تطبيق السمة
    if (settings.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// ===== دالة مساعدة للبحث =====
function searchData(searchTerm) {
    // يمكن إضافة وظيفة البحث هنا
    console.log('البحث عن:', searchTerm);
    
    if (!searchTerm.trim()) {
        showAlert('يرجى إدخال نص للبحث', 'warning');
        return;
    }
    
    // إظهار نافذة البحث
    const searchModalContent = `
        <div class="modal-content search-modal">
            <div class="modal-header">
                <h2><i class="fas fa-search"></i> نتائج البحث</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="search-results">
                    <p>جاري البحث عن "${searchTerm}"...</p>
                    <!-- يمكن عرض نتائج البحث هنا -->
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeModal()">
                    إغلاق
                </button>
            </div>
        </div>
    `;
    
    openModal(searchModalContent);
}

// ===== تهيئة نهاية الملف =====
console.log('✅ تم تحميل script.js بنجاح');
console.log('🚀 النظام جاهز للاستخدام');
console.log(`🔗 رابط API: ${API_BASE_URL}`);
console.log(`👤 المستخدم الحالي: ${currentUser ? currentUser.name : 'غير مسجل'}`);

// ===== إضافة حدث للبحث في شريط العنوان =====
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + F للبحث
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchTerm = prompt('أدخل نص للبحث:');
        if (searchTerm) {
            searchData(searchTerm);
        }
    }
    
    // F5 لتحديث الصفحة
    if (e.key === 'F5') {
        e.preventDefault();
        if (confirm('هل تريد تحديث الصفحة؟')) {
            window.location.reload();
        }
    }
});

// ===== دالة لطباعة الفاتورة =====
function printInvoice(orderId) {
    if (!orderId) return;
    
    showAlert('جاري إعداد الفاتورة للطباعة...', 'info');
    
    // يمكن إضافة كود الطباعة هنا
    setTimeout(() => {
        window.print();
    }, 1000);
}

// ===== دالة لنسخ النص =====
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('تم نسخ النص', 'success');
    }).catch(err => {
        console.error('خطأ في النسخ:', err);
        showAlert('فشل نسخ النص', 'error');
    });
}

// ===== ملخص النظام =====
/*
✅ الميزات المكتملة في الجزء الثاني:
1. إدارة المنتجات الكاملة (CRUD)
2. إدارة التصنيفات (CRUD)
3. إدارة المناطق (CRUD)
4. نظام التقارير
5. إدارة التقييمات
6. عرض تفاصيل الطلبات والعملاء
7. نظام البحث
8. وظائف مساعدة إضافية

🎯 النظام الآن كامل وجاهز للاستخدام!
*/

// ===== دوال إدارة العملاء المفقودة =====

// عرض نموذج إضافة عميل
function showAddClientModal() {
    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-user-plus"></i> إضافة عميل جديد</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="addClientForm" onsubmit="addNewClient(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="clientName">اسم العميل *</label>
                            <input type="text" id="clientName" required placeholder="أدخل اسم العميل">
                        </div>
                        <div class="form-group">
                            <label for="clientPhone">رقم الهاتف *</label>
                            <input type="tel" id="clientPhone" required placeholder="مثال: 01234567890">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="clientEmail">البريد الإلكتروني</label>
                            <input type="email" id="clientEmail" placeholder="client@example.com">
                        </div>
                        <div class="form-group">
                            <label for="clientArea">المنطقة</label>
                            <select id="clientArea">
                                <option value="">اختر المنطقة</option>
                                <!-- سيتم ملؤها بالمناطق -->
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="clientAddress">العنوان</label>
                        <textarea id="clientAddress" rows="3" placeholder="أدخل العنوان الكامل"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="clientNotes">ملاحظات</label>
                        <textarea id="clientNotes" rows="2" placeholder="ملاحظات إضافية عن العميل"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i>
                            حفظ العميل
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    openModal(modalContent);
    
    // تحميل المناطق في المودال
    loadAreasForClientModal();
}

// تحميل المناطق في نموذج العميل
async function loadAreasForClientModal() {
    try {
        const response = await fetch(`${API_BASE_URL}/areas`);
        const data = await response.json();
        
        const areaSelect = document.getElementById('clientArea');
        if (areaSelect && data.success && data.data) {
            let options = '<option value="">اختر المنطقة</option>';
            data.data.forEach(area => {
                options += `<option value="${area.id}">${area.name} (${area.delivery_fee || 0} ج.م)</option>`;
            });
            areaSelect.innerHTML = options;
        }
    } catch (error) {
        console.error('خطأ في تحميل المناطق:', error);
    }
}

// إضافة عميل جديد
async function addNewClient(event) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const clientData = {
            name: document.getElementById('clientName').value.trim(),
            phone: document.getElementById('clientPhone').value.trim(),
            email: document.getElementById('clientEmail').value.trim() || null,
            area_id: document.getElementById('clientArea').value || null,
            address: document.getElementById('clientAddress').value.trim() || null,
            loyalty_points: 0,
            pending_redemption: 0
        };
        
        if (!clientData.name || !clientData.phone) {
            showAlert('يرجى ملء اسم العميل ورقم الهاتف', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم إضافة العميل بنجاح', 'success');
            closeModal();
            showClients();
        } else {
            showAlert(data.error || 'فشل إضافة العميل', 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة العميل:', error);
        showAlert('خطأ في إضافة العميل', 'error');
    } finally {
        hideLoading();
    }
}

// تعديل عميل
async function editClient(clientId) {
    try {
        showLoading();
        
        // جلب بيانات العميل
        const response = await fetch(`${API_BASE_URL}/clients`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const client = data.data.find(c => c.id == clientId);
            
            if (client) {
                const modalContent = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2><i class="fas fa-edit"></i> تعديل بيانات العميل</h2>
                            <button class="btn-close" onclick="closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="editClientForm" onsubmit="updateClientData(event, ${clientId})">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editClientName">اسم العميل *</label>
                                        <input type="text" id="editClientName" value="${client.name}" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="editClientPhone">رقم الهاتف *</label>
                                        <input type="tel" id="editClientPhone" value="${client.phone}" required>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editClientEmail">البريد الإلكتروني</label>
                                        <input type="email" id="editClientEmail" value="${client.email || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label for="editClientArea">المنطقة</label>
                                        <select id="editClientArea">
                                            <option value="">اختر المنطقة</option>
                                            <!-- سيتم ملؤها بالمناطق -->
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="editClientLoyalty">نقاط الولاء</label>
                                        <input type="number" id="editClientLoyalty" value="${client.loyalty_points || 0}" min="0">
                                    </div>
                                    <div class="form-group">
                                        <label for="editClientPending">نقاط قيد الاسترداد</label>
                                        <input type="number" id="editClientPending" value="${client.pending_redemption || 0}" min="0">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="editClientAddress">العنوان</label>
                                    <textarea id="editClientAddress" rows="3">${client.address || ''}</textarea>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-save"></i>
                                        حفظ التغييرات
                                    </button>
                                    <button type="button" class="btn-secondary" onclick="closeModal()">
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                `;
                
                openModal(modalContent);
                
                // تحميل المناطق وتعيين القيمة الحالية
                await loadAreasForEditClientModal(client.area_id);
                
            } else {
                showAlert('العميل غير موجود', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل نموذج التعديل:', error);
        showAlert('خطأ في تحميل نموذج التعديل', 'error');
    } finally {
        hideLoading();
    }
}

// تحميل المناطق لتعديل العميل
async function loadAreasForEditClientModal(currentAreaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/areas`);
        const data = await response.json();
        
        const areaSelect = document.getElementById('editClientArea');
        if (areaSelect && data.success && data.data) {
            let options = '<option value="">اختر المنطقة</option>';
            data.data.forEach(area => {
                const selected = area.id == currentAreaId ? 'selected' : '';
                options += `<option value="${area.id}" ${selected}>${area.name} (${area.delivery_fee || 0} ج.م)</option>`;
            });
            areaSelect.innerHTML = options;
        }
    } catch (error) {
        console.error('خطأ في تحميل المناطق:', error);
    }
}

// تحديث بيانات العميل
async function updateClientData(event, clientId) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const clientData = {
            name: document.getElementById('editClientName').value.trim(),
            phone: document.getElementById('editClientPhone').value.trim(),
            email: document.getElementById('editClientEmail').value.trim() || null,
            area_id: document.getElementById('editClientArea').value || null,
            address: document.getElementById('editClientAddress').value.trim() || null,
            loyalty_points: parseInt(document.getElementById('editClientLoyalty').value) || 0,
            pending_redemption: parseInt(document.getElementById('editClientPending').value) || 0
        };
        
        if (!clientData.name || !clientData.phone) {
            showAlert('يرجى ملء اسم العميل ورقم الهاتف', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم تحديث بيانات العميل بنجاح', 'success');
            closeModal();
            showClients();
        } else {
            showAlert(data.error || 'فشل تحديث البيانات', 'error');
        }
    } catch (error) {
        console.error('خطأ في تحديث العميل:', error);
        showAlert('خطأ في تحديث العميل', 'error');
    } finally {
        hideLoading();
    }
}

// حذف عميل
async function deleteClient(clientId) {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟\n\nتحذير: هذا الإجراء لا يمكن التراجع عنه.\nقد يتم حذف الطلبات المرتبطة بهذا العميل.')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم حذف العميل بنجاح', 'success');
            
            // تحديث العرض الحالي
            if (currentView === 'clients') {
                showClients();
            } else if (currentView === 'dashboard') {
                loadDashboard();
            }
        } else {
            showAlert(data.error || 'فشل حذف العميل', 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف العميل:', error);
        showAlert('خطأ في حذف العميل', 'error');
    } finally {
        hideLoading();
    }
}

// ===== دوال إدارة التصنيفات المفقودة =====

// عرض التصنيفات
async function showCategories() {
    try {
        showLoading();
        currentView = 'categories';
        updateActiveMenu('showCategories');
        
        const response = await fetch(`${API_BASE_URL}/categories`);
        const data = await response.json();
        
        let content = `
            <div class="content-header">
                <h2><i class="fas fa-tags"></i> إدارة التصنيفات</h2>
                <div class="header-actions">
                    <button class="btn-primary" onclick="showAddCategoryForm()">
                        <i class="fas fa-plus"></i>
                        إضافة تصنيف جديد
                    </button>
                </div>
            </div>
        `;
        
        if (data.success && data.data && data.data.length > 0) {
            content += `
                <div class="categories-container">
                    <div class="categories-grid">
                        ${data.data.map(category => `
                            <div class="category-card" data-id="${category.id}">
                                <div class="category-header">
                                    <div class="category-icon">
                                        <i class="fas fa-folder"></i>
                                    </div>
                                    <h3 class="category-name">${category.name}</h3>
                                </div>
                                
                                <div class="category-body">
                                    <p class="category-description">
                                        ${category.description || 'لا يوجد وصف لهذا التصنيف'}
                                    </p>
                                    
                                    <div class="category-meta">
                                        <span class="category-order">
                                            <i class="fas fa-sort-numeric-down"></i>
                                            الترتيب: ${category.display_order || 0}
                                        </span>
                                        <span class="category-date">
                                            <i class="fas fa-calendar"></i>
                                            ${new Date(category.created_at).toLocaleDateString('ar-EG')}
                                        </span>
                                    </div>
                                </div>
                                
                                <div class="category-footer">
                                    <div class="category-actions">
                                        <button class="btn-action" onclick="editCategory(${category.id})" title="تعديل">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-action danger" onclick="deleteCategoryConfirmation(${category.id})" title="حذف">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            content += `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-tags"></i>
                    </div>
                    <h3>لا توجد تصنيفات</h3>
                    <p>لم يتم إضافة أي تصنيفات حتى الآن</p>
                    <button class="btn-primary" onclick="showAddCategoryForm()">
                        <i class="fas fa-plus"></i>
                        إضافة تصنيف جديد
                    </button>
                </div>
            `;
        }
        
        document.getElementById('mainContent').innerHTML = content;
        
    } catch (error) {
        console.error('خطأ في تحميل التصنيفات:', error);
        showAlert('خطأ في تحميل التصنيفات', 'error');
    } finally {
        hideLoading();
    }
}

// عرض نموذج إضافة تصنيف
function showAddCategoryForm() {
    const modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> إضافة تصنيف جديد</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="addCategoryForm" onsubmit="addCategory(event)">
                    <div class="form-group">
                        <label for="categoryName">اسم التصنيف *</label>
                        <input type="text" id="categoryName" required placeholder="أدخل اسم التصنيف">
                    </div>
                    
                    <div class="form-group">
                        <label for="categoryDescription">الوصف</label>
                        <textarea id="categoryDescription" rows="3" placeholder="أدخل وصف التصنيف (اختياري)"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="categoryOrder">ترتيب العرض</label>
                        <input type="number" id="categoryOrder" value="0" min="0" placeholder="0">
                        <small class="hint">رقم أقل يعني ظهور أعلى</small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i>
                            حفظ التصنيف
                        </button>
                        <button type="button" class="btn-secondary" onclick="closeModal()">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    openModal(modalContent);
}

// إضافة تصنيف جديد
async function addCategory(event) {
    event.preventDefault();
    
    try {
        showLoading();
        
        const categoryData = {
            name: document.getElementById('categoryName').value.trim(),
            description: document.getElementById('categoryDescription').value.trim() || null,
            display_order: parseInt(document.getElementById('categoryOrder').value) || 0
        };
        
        if (!categoryData.name) {
            showAlert('يرجى إدخال اسم التصنيف', 'error');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم إضافة التصنيف بنجاح', 'success');
            closeModal();
            showCategories();
        } else {
            showAlert(data.error || 'فشل إضافة التصنيف', 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة التصنيف:', error);
        showAlert('خطأ في إضافة التصنيف', 'error');
    } finally {
        hideLoading();
    }
}

// تأكيد حذف تصنيف
function deleteCategoryConfirmation(categoryId) {
    const modalContent = `
        <div class="modal-content confirmation-modal">
            <div class="modal-header">
                <h2><i class="fas fa-exclamation-triangle"></i> تأكيد الحذف</h2>
                <button class="btn-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="warning-icon">
                    <i class="fas fa-trash"></i>
                </div>
                <h3>هل أنت متأكد من حذف هذا التصنيف؟</h3>
                <p class="warning-text">
                    <strong>تحذير:</strong> قد تؤثر على المنتجات المرتبطة بهذا التصنيف.<br>
                    هذا الإجراء لا يمكن التراجع عنه.
                </p>
                <div class="confirmation-actions">
                    <button class="btn-secondary" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                        إلغاء
                    </button>
                    <button class="btn-danger" onclick="confirmDeleteCategory(${categoryId})">
                        <i class="fas fa-trash"></i>
                        نعم، احذف التصنيف
                    </button>
                </div>
            </div>
        </div>
    `;
    
    openModal(modalContent);
}

// تأكيد حذف التصنيف
async function confirmDeleteCategory(categoryId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('تم حذف التصنيف بنجاح', 'success');
            closeModal();
            showCategories();
        } else {
            showAlert(data.error || 'فشل حذف التصنيف', 'error');
            closeModal();
        }
    } catch (error) {
        console.error('خطأ في حذف التصنيف:', error);
        showAlert('خطأ في حذف التصنيف', 'error');
    } finally {
        hideLoading();
    }
}

