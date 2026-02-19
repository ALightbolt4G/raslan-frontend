// scripts/script.js

// حالة التطبيق
const AppState = {
    menuItems: [],
    menuCategories: [],
    currentPage: 1,
    itemsPerPage: 6,
    currentFilter: {
        searchTerm: '',
        categoryId: 'all',
        sortBy: 'category_id'
    },
    backendUrl: 'https://raslankoshary.up.railway.app/api' // عنوان الـ backend الخاص بك
};
let currentDisplayedItems = [];
let currentLoadedItems = [];
// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    await initApp();
    setupEventListeners();
});

// تهيئة التطبيق الرئيسية


// تحميل البيانات من الـ backend الخاص بك
async function loadDataFromBackend() {
    try {
        console.log('🔄 جاري تحميل البيانات من الـ backend...');
        
        const response = await fetch(`${AppState.backendUrl}/menu/init`);
        
        if (!response.ok) {
            throw new Error(`خطأ في الشبكة: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('📊 استجابة الـ backend:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'فشل في جلب البيانات');
        }
        
        AppState.menuCategories = result.data.categories || [];
        AppState.menuItems = result.data.items || [];
        
        // 🔥🔥🔥 أضف هذا الجزء فقط - بداية الترتيب 🔥🔥🔥
        // ترتيب التصنيفات حسب display_order من الأصغر للأكبر
        if (AppState.menuCategories.length > 0) {
            AppState.menuCategories.sort((a, b) => {
                // إذا لم يكن هناك display_order، افترض 999 ليظهر في النهاية
                const orderA = a.display_order || 999;
                const orderB = b.display_order || 999;
                return orderA - orderB;
            });
            
            console.log('✅ تم ترتيب التصنيفات حسب display_order:');
            AppState.menuCategories.forEach((cat, index) => {
                console.log(`${index + 1}. ${cat.name} (ترتيب: ${cat.display_order || 'غير محدد'})`);
            });
        }
        // 🔥🔥🔥 نهاية الجزء المضاف 🔥🔥🔥
        
        // التحقق من وجود صور في البيانات
        const itemsWithImages = AppState.menuItems.filter(item => 
            item.image_url && item.image_url.trim() !== ''
        );
        
        console.log(`📸 ${itemsWithImages.length} عنصر لديه صور من إجمالي ${AppState.menuItems.length} عنصر`);
        
        if (AppState.menuCategories.length === 0 || AppState.menuItems.length === 0) {
            console.log('لا توجد بيانات، استخدام البيانات المحلية');
            loadSampleData();
        } else {
            console.log(`✅ تم تحميل ${AppState.menuCategories.length} تصنيف و ${AppState.menuItems.length} عنصر من الـ Backend`);
            displayMenu();
        }
        
    } catch (error) {
        console.warn('استخدام البيانات المحلية:', error.message);
        console.error('تفاصيل الخطأ:', error);
        loadSampleData();
    }
}
// البحث والفلترة عبر الـ backend
async function searchAndFilter() {
    try {
        const { searchTerm, categoryId, sortBy } = AppState.currentFilter;
        
        const params = new URLSearchParams({
            searchTerm: searchTerm,
            categoryId: categoryId,
            sortBy: sortBy, // 🔥 سيتم إرسال 'category_id' للـ Backend
            page: AppState.currentPage,
            limit: AppState.itemsPerPage
        });
        
        console.log(`🔍 إرسال طلب بحث: ${AppState.backendUrl}/menu/search?${params}`);
        
        const response = await fetch(`${AppState.backendUrl}/menu/search?${params}`);
        
        if (!response.ok) {
            throw new Error(`خطأ في الشبكة: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('📊 نتائج البحث:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'فشل في البحث');
        }
        
        // 🔥 إذا كان الترتيب حسب category_id، تأكد من ترتيب النتائج
        if (sortBy === 'category_id' && result.data && Array.isArray(result.data)) {
            result.data.sort((a, b) => {
                const orderA = a.display_order || a.id;
                const orderB = b.display_order || b.id;
                return orderA - orderB;
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('خطأ في البحث:', error);
        // في حالة الخطأ، نستخدم البحث المحلي
        return {
            success: true,
            data: performLocalSearch(),
            pagination: {
                currentPage: AppState.currentPage,
                totalPages: Math.ceil(AppState.menuItems.length / AppState.itemsPerPage),
                totalItems: AppState.menuItems.length,
                hasMore: (AppState.currentPage * AppState.itemsPerPage) < AppState.menuItems.length
            }
        };
    }
}


// البحث المحلي (كبديل عند فشل الاتصال بالـ backend)
function performLocalSearch() {
    let filteredItems = [...AppState.menuItems];
    
    // تطبيق البحث
    if (AppState.currentFilter.searchTerm) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(AppState.currentFilter.searchTerm) ||
            (item.description && item.description.toLowerCase().includes(AppState.currentFilter.searchTerm))
        );
    }
    
    // تطبيق تصفية التصنيف
    if (AppState.currentFilter.categoryId !== 'all') {
        filteredItems = filteredItems.filter(item => 
            item.category_id == AppState.currentFilter.categoryId
        );
    }
    
    // 🔥🔥🔥 تطبيق الترتيب مع إضافة خيار category_id 🔥🔥🔥
    switch (AppState.currentFilter.sortBy) {
        case 'category_id':
            // ترتيب حسب category_id أولاً
            filteredItems.sort((a, b) => {
                // 1. أولاً حسب category_id
                if (a.category_id !== b.category_id) {
                    return a.category_id - b.category_id;
                }
                // 2. إذا كان نفس التصنيف، حسب الاسم
                return a.name.localeCompare(b.name, 'ar');
            });
            break;
            
        case 'price_low':
            filteredItems.sort((a, b) => a.price - b.price);
            break;
            
        case 'price_high':
            filteredItems.sort((a, b) => b.price - a.price);
            break;
            
        case 'name':
        default:
            filteredItems.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            break;
    }
    
    // تطبيق التقسيم للصفحات
    const startIndex = (AppState.currentPage - 1) * AppState.itemsPerPage;
    const endIndex = startIndex + AppState.itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);
    
    // ترتيب التصنيفات حسب display_order أو id
    const sortedCategories = [...AppState.menuCategories].sort((a, b) => {
        const orderA = a.display_order || a.id;
        const orderB = b.display_order || b.id;
        return orderA - orderB;
    });
    
    // تجميع حسب التصنيف مع الحفاظ على الترتيب
    return sortedCategories.map(category => {
        const items = paginatedItems.filter(item => item.category_id === category.id);
        return { ...category, items };
    }).filter(category => category.items.length > 0);
}

// تحميل البيانات المحلية
function loadSampleData() {
    AppState.menuCategories = [
        { id: 1, name: "كشري", description: "أصناف الكشري المختلفة", display_order: 1 },
        { id: 2, name: "كريب", description: "أصناف الكريب اللذيذة", display_order: 2 },
        { id: 3, name: "مشروبات", description: "المشروبات الباردة والساخنة", display_order: 3 },
        { id: 4, name: "إضافات", description: "إضافات خاصة بالكشري", display_order: 4 },
        { id: 5, name: "الإسباجتي", description: "أصناف الإسباجتي", display_order: 5 },
        { id: 6, name: "الحلو", description: "أصناف الحلويات", display_order: 6 },
        { id: 7, name: "كريب VIP", description: "أصناف الكريب VIP", display_order: 7 }
    ];
    
    AppState.menuItems = [
        { 
            id: 1, 
            name: "كشري أصفر", 
            description: "كشري أصفر تقليدي مع الصلصة والحمص", 
            price: 25, 
            category_id: 1, 
            unique_code: "KOSHARY_1",
            is_available: true
        },
        { 
            id: 2, 
            name: "كشري أسود", 
            description: "كشري أسود مع العدس الأسود", 
            price: 30, 
            category_id: 1, 
            unique_code: "KOSHARY_2",
            is_available: true
        },
        // ... باقي العناصر
    ];
    
    // 🔥🔥🔥 أضف هذا السطر للتأكد من الترتيب 🔥🔥🔥
    // ترتيب التصنيفات حسب display_order
    AppState.menuCategories.sort((a, b) => a.display_order - b.display_order);
    
    console.log('✅ تم تحميل البيانات المحلية مع الترتيب الصحيح');
    console.log('أول تصنيف يجب يكون "كشري":', AppState.menuCategories[0]?.name);
    
    displayMenu();
}


function createFilterInterface() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    // 🔥 حساب عدد العناصر لكل تصنيف
    const getCategoryItemCount = (categoryId) => {
        if (categoryId === 'all') return AppState.menuItems.length;
        return AppState.menuItems.filter(item => item.category_id == categoryId).length;
    };

    const filterHTML = `
        <div class="filter-container">
            <div class="filter-header">
                <h2>📋 تصفية القائمة</h2>
                <div class="filter-stats">
                    <span class="items-count" id="total-items">${AppState.menuItems.length} عنصر</span>
                    <span class="filter-active" id="active-filters-count"></span>
                </div>
            </div>
            <div class="filter-controls">
                <div class="search-box">
                    <input type="text" id="search-input" 
                           placeholder="🔍 ابحث في القائمة..." 
                           value="${AppState.currentFilter.searchTerm}"
                           title="ابحث بالاسم أو الوصف">
                    <i class="fas fa-search search-icon"></i>
                </div>
                
                <div class="filter-row">
                    <div class="filter-group">
                        <label for="category-filter">📂 التصنيف:</label>
                        <select id="category-filter" class="category-select">
                            <option value="all">🏷️ جميع التصنيفات (${AppState.menuItems.length})</option>
                            ${AppState.menuCategories.map(category => 
                                `<option value="${category.id}" ${AppState.currentFilter.categoryId == category.id ? 'selected' : ''}>
                                    ${category.name} (${getCategoryItemCount(category.id)})
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="sort-filter">↕️ الترتيب:</label>
                        <select id="sort-filter" class="sort-select">
                            <option value="category_id" ${AppState.currentFilter.sortBy === 'category_id' ? 'selected' : ''}>
                                📊 ترتيب حسب التصنيف
                            </option>
                            <option value="name" ${AppState.currentFilter.sortBy === 'name' ? 'selected' : ''}>
                                🔤 الاسم (أ-ي)
                            </option>
                            <option value="price_low" ${AppState.currentFilter.sortBy === 'price_low' ? 'selected' : ''}>
                                💰 السعر (منخفض → مرتفع)
                            </option>
                            <option value="price_high" ${AppState.currentFilter.sortBy === 'price_high' ? 'selected' : ''}>
                                💵 السعر (مرتفع → منخفض)
                            </option>
                        </select>
                    </div>
                    
                    <button id="reset-filters" class="reset-btn" title="إعادة التعيين إلى الإعدادات الافتراضية">
                        <i class="fas fa-redo"></i>
                        إعادة التعيين
                    </button>
                </div>
                
                <div class="filter-indicators" id="filter-indicators">
                    <!-- ستظهر هنا الفلاتر النشطة -->
                </div>
            </div>
        </div>
    `;

    // إضافة واجهة الفلترة قبل محتوى القائمة
    if (!document.querySelector('.filter-container')) {
        menuContainer.insertAdjacentHTML('afterbegin', filterHTML);
    }
     addFilterStyles();
    // تحديث مؤشرات الفلترة
    updateFilterIndicators();
}
// تحديث مؤشرات الفلترة النشطة
function updateFilterIndicators() {
    const indicatorsContainer = document.getElementById('filter-indicators');
    if (!indicatorsContainer) return;
    
    const { searchTerm, categoryId, sortBy } = AppState.currentFilter;
    const indicators = [];
    
    if (searchTerm) {
        indicators.push(`
            <span class="filter-indicator">
                🔍 "${searchTerm}"
                <button onclick="clearSearch()" class="clear-indicator">×</button>
            </span>
        `);
    }
    
    if (categoryId !== 'all') {
        const category = AppState.menuCategories.find(c => c.id == categoryId);
        if (category) {
            indicators.push(`
                <span class="filter-indicator">
                    📂 ${category.name}
                    <button onclick="clearCategoryFilter()" class="clear-indicator">×</button>
                </span>
            `);
        }
    }
    
    if (sortBy !== 'category_id') { // لا نعرض إذا كان افتراضي
        const sortLabels = {
            'name': 'الاسم (أ-ي)',
            'price_low': 'السعر (منخفض)',
            'price_high': 'السعر (مرتفع)'
        };
        
        indicators.push(`
            <span class="filter-indicator">
                ↕️ ${sortLabels[sortBy]}
                <button onclick="clearSortFilter()" class="clear-indicator">×</button>
            </span>
        `);
    }
    
    indicatorsContainer.innerHTML = indicators.length > 0 
        ? `<div class="active-filters">فلاتر نشطة: ${indicators.join('')}</div>`
        : '';
}

// دوال مساعدة لحذف الفلاتر
function clearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
        applyFilters();
    }
}

function clearCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = 'all';
        applyFilters();
    }
}

function clearSortFilter() {
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.value = 'category_id'; // قيمة افتراضية
        applyFilters();
    }
}
// تطبيق الفلترة
// تطبيق الفلترة
async function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (searchInput) AppState.currentFilter.searchTerm = searchInput.value.toLowerCase();
    if (categoryFilter) AppState.currentFilter.categoryId = categoryFilter.value;
    if (sortFilter) AppState.currentFilter.sortBy = sortFilter.value;
    
    AppState.currentPage = 1; // العودة للصفحة الأولى عند التصفية
    
    // تحديث مؤشرات الفلترة
    updateFilterIndicators();
    
    await displayFilteredMenu();
}

// عرض القائمة المصفاة
async function displayFilteredMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    // إظهار تحميل أثناء البحث
    const existingContent = menuContainer.querySelector('.menu-content');
    if (existingContent) {
        existingContent.innerHTML = '<div class="loading-search">جاري البحث...</div>';
    }

    try {
        const result = await searchAndFilter();
        
        if (!result.success) {
            throw new Error(result.message);
        }

        // تحديث إحصائيات الفلترة
        const itemsCount = document.querySelector('.items-count');
        if (itemsCount) {
            itemsCount.textContent = `${result.pagination.totalItems} عنصر`;
        }

        // عرض النتائج
        displaySearchResults(result.data, result.pagination);
        
    } catch (error) {
        console.error('خطأ في عرض النتائج:', error);
        showError('حدث خطأ في البحث. جاري استخدام البيانات المحلية.');
        const localResults = performLocalSearch();
        displaySearchResults(localResults, {
            currentPage: AppState.currentPage,
            totalPages: Math.ceil(AppState.menuItems.length / AppState.itemsPerPage),
            totalItems: AppState.menuItems.length,
            hasMore: (AppState.currentPage * AppState.itemsPerPage) < AppState.menuItems.length
        });
    }
}

function displaySearchResults(categorizedItems, pagination) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    // إزالة المحتوى القديم
    const existingContent = menuContainer.querySelector('.menu-content');
    if (existingContent) existingContent.remove();

    // إنشاء محتوى جديد
    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';
    
    if (!categorizedItems || categorizedItems.length === 0) {
        menuContent.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم نعثر على أي عناصر تطابق بحثك</p>
                <button onclick="resetFilters()" class="reset-btn">عرض كل العناصر</button>
            </div>
        `;
    } else {
        // 🔥🔥🔥 تحقق من ترتيب التصنيفات قبل العرض 🔥🔥🔥
        console.log('📋 ترتيب التصنيفات في displaySearchResults:');
        categorizedItems.forEach((cat, index) => {
            console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, display_order: ${cat.display_order || cat.id})`);
        });
        // 🔥🔥🔥 نهاية التحقق 🔥🔥🔥
        
        menuContent.innerHTML = categorizedItems.map(category => {
            const items = category.items || [];
            
            return `
                <div class="menu-category">
                    <div class="category-header">
                        <h3 class="category-title">${category.name || 'غير مصنف'}</h3>
                        <div class="category-line"></div>
                        <span class="category-count">${items.length} عنصر</span>
                    </div>
                    <div class="category-widgets">
                        ${items.map(item => {
                            // التحقق من وجود صورة
                            const hasImage = item.image_url && item.image_url.trim() !== '';
                            
                            return `
                                <div class="menu-widget" data-id="${item.unique_code}">
                                    <div class="widget-header">
                                        <h4 class="item-name">${item.name}</h4>
                                        <span class="price-badge">${formatPrice(item.price)}</span>
                                    </div>
                                    
                                    <div class="widget-body">
                                        ${hasImage ? `
                                            <div class="item-image-container">
                                                <img src="${item.image_url}" 
                                                     alt="${item.name}" 
                                                     class="item-image"
                                                     loading="lazy"
                                                     onerror="this.style.display='none'; this.parentElement.innerHTML = '<p class=\\'item-description\\'>${item.description || 'وصف غير متوفر'}</p>';">
                                            </div>
                                        ` : `
                                            <p class="item-description">${item.description || 'وصف غير متوفر'}</p>
                                        `}
                                    </div>
                                    
                                    <div class="widget-footer">
                                        <button class="order-btn" onclick="orderItem('${item.unique_code}')">
                                            <i class="fas fa-shopping-cart"></i>
                                            اطلب الآن
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    menuContainer.appendChild(menuContent);
    addLoadMoreButton(pagination);
}

// إضافة زر تحميل المزيد
function addLoadMoreButton(pagination) {
    const menuContainer = document.getElementById('menu-container');
    const existingBtn = menuContainer.querySelector('.load-more-btn');
    
    if (existingBtn) {
        existingBtn.remove();
    }
    
    if (pagination.hasMore) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'load-more-btn';
        loadMoreBtn.innerHTML = `
            <i class="fas fa-chevron-down"></i>
            عرض المزيد (${pagination.totalItems - (AppState.currentPage * AppState.itemsPerPage)})
        `;
        loadMoreBtn.onclick = loadMoreItems;
        menuContainer.appendChild(loadMoreBtn);
    }
}

// ⭐⭐ دالة جديدة: تحميل المزيد من العناصر بدون حذف القديمة ⭐⭐
async function loadMoreItems() {
    try {
        AppState.currentPage++;
        
        // إظهار مؤشر تحميل
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
            loadMoreBtn.disabled = true;
        }
        
        // البحث والفلترة
        const result = await searchAndFilter();
        
        if (result.success && result.data && result.data.length > 0) {
            // استدعاء دالة عرض محسنة
            displayMoreResults(result.data, result.pagination);
        }
        
        // إعادة الزر لحالته الأصلية
        if (loadMoreBtn) {
            const remainingItems = Math.max(0, result.pagination.totalItems - (AppState.currentPage * AppState.itemsPerPage));
            if (remainingItems > 0) {
                loadMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> عرض المزيد (${remainingItems} عنصر)`;
                loadMoreBtn.disabled = false;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('خطأ في تحميل المزيد:', error);
        // استعادة حالة الزر
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = `<i class="fas fa-chevron-down"></i> عرض المزيد`;
            loadMoreBtn.disabled = false;
        }
    }
}

// ⭐⭐ دالة جديدة: عرض النتائج الإضافية ⭐⭐
function displayMoreResults(categorizedItems, pagination) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;
    
    const menuContent = menuContainer.querySelector('.menu-content');
    if (!menuContent) return;
    
    categorizedItems.forEach(category => {
        const existingCategory = menuContent.querySelector(`#category-${category.id}`);
        const items = category.items || [];
        
        if (existingCategory) {
            // إذا التصنيف موجود، نضيف العناصر الجديدة له
            const categoryWidgets = existingCategory.querySelector('.category-widgets');
            if (categoryWidgets) {
                items.forEach(item => {
                    const itemHTML = renderMenuItem(item);
                    categoryWidgets.insertAdjacentHTML('beforeend', itemHTML);
                });
                
                // تحديث عدد العناصر
                const countElement = existingCategory.querySelector('.category-count');
                if (countElement) {
                    const currentCount = parseInt(countElement.textContent) || 0;
                    countElement.textContent = `${currentCount + items.length} عنصر`;
                }
            }
        } else {
            // إذا التصنيف جديد، نضيفه كاملاً
            const categoryHTML = `
                <div class="menu-category" id="category-${category.id}">
                    <div class="category-header">
                        <h3 class="category-title">${category.name || 'غير مصنف'}</h3>
                        <div class="category-line"></div>
                        <span class="category-count">${items.length} عنصر</span>
                    </div>
                    <div class="category-widgets">
                        ${items.map(item => renderMenuItem(item)).join('')}
                    </div>
                </div>
            `;
            menuContent.insertAdjacentHTML('beforeend', categoryHTML);
        }
    });
    
    // تحديث زر تحميل المزيد
    updateLoadMoreButton(pagination);
}

// ⭐⭐ دالة محسنة لتحديث زر تحميل المزيد ⭐⭐
function updateLoadMoreButton(pagination) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;
    
    // إزالة الزر القديم
    const existingBtn = menuContainer.querySelector('.load-more-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // إذا كان هناك المزيد من العناصر
    if (pagination.hasMore) {
        const remainingItems = pagination.totalItems - (AppState.currentPage * AppState.itemsPerPage);
        if (remainingItems > 0) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.innerHTML = `
                <i class="fas fa-chevron-down"></i>
                عرض المزيد (${remainingItems} عنصر)
            `;
            loadMoreBtn.onclick = loadMoreItems;
            menuContainer.appendChild(loadMoreBtn);
        }
    }
}

// إعادة تعيين الفلترة
async function resetFilters() {
    AppState.currentFilter = {
        searchTerm: '',
        categoryId: 'all',
        sortBy: 'category_id'  // 🔥 تغيير من 'name' إلى 'category_id'
    };
    
    AppState.currentPage = 1;
    
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'category_id';  // 🔥 تغيير من 'name' إلى 'category_id'
    
    await displayFilteredMenu();
}

// عرض القائمة الرئيسية
function displayMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) {
        console.error('عنصر menu-container غير موجود');
        return;
    }

    menuContainer.innerHTML = '';

    // إنشاء واجهة الفلترة
    createFilterInterface();

    if (AppState.menuItems.length === 0) {
        menuContainer.innerHTML += `
            <div class="no-items">
                <i class="fas fa-utensils"></i>
                <p>لا توجد عناصر في القائمة حالياً</p>
            </div>
        `;
        return;
    }

    // 🔥🔥🔥 التعديل هنا: ترتيب التصنيفات قبل العرض الأولي 🔥🔥🔥
    // ترتيب التصنيفات حسب display_order أو id
    const sortedCategories = [...AppState.menuCategories].sort((a, b) => {
        const orderA = a.display_order || a.id;
        const orderB = b.display_order || b.id;
        return orderA - orderB;
    });

    console.log('📋 ترتيب التصنيفات للعرض الأولي:');
    sortedCategories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (ترتيب: ${cat.display_order || cat.id})`);
    });

    // عرض أول صفحة من القائمة - مع التصنيفات المرتبة
    displayFirstPage();
}
// دالة مساعدة للتحقق من صحة رابط الصورة
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (trimmedUrl === '') return false;
    
    // التحقق من أن الرابط يبدأ بـ http/https
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        return false;
    }
    
    // التحقق من امتدادات الصور الشائعة
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const hasValidExtension = validExtensions.some(ext => 
        trimmedUrl.toLowerCase().endsWith(ext)
    );
    
    return hasValidExtension;
}

// دالة محسنة لعرض العنصر مع الصورة
function renderMenuItem(item) {
    const hasValidImage = isValidImageUrl(item.image_url);
    
    return `
        <div class="menu-widget" data-id="${item.unique_code}">
            <div class="widget-header">
                <h4 class="item-name">${item.name}</h4>
                <span class="price-badge">${formatPrice(item.price)}</span>
            </div>
            
            <div class="widget-body">
                ${hasValidImage ? `
                    <div class="item-image-container">
                        <img src="${item.image_url}" 
                             alt="${item.name}" 
                             class="item-image"
                             loading="lazy"
                             onerror="handleImageError(this, '${item.description || ''}')">
                    </div>
                ` : `
                    <div class="no-image-content">
                        <i class="fas fa-utensils"></i>
                        <p class="item-description">${item.description || 'وصف غير متوفر'}</p>
                    </div>
                `}
            </div>
            
            <div class="widget-footer">
                <button class="order-btn" onclick="orderItem('${item.unique_code}')">
                    <i class="fas fa-shopping-cart"></i>
                    اطلب الآن
                </button>
            </div>
        </div>
    `;
}

// معالجة خطأ تحميل الصورة
function handleImageError(imgElement, description) {
    console.warn('❌ فشل تحميل الصورة:', imgElement.src);
    
    const container = imgElement.parentElement;
    container.innerHTML = `
        <div class="no-image-content">
            <i class="fas fa-image-slash" style="font-size: 2rem; color: #ccc; margin-bottom: 10px;"></i>
            <p class="item-description">${description || 'صورة غير متوفرة'}</p>
        </div>
    `;
    
    // إضافة CSS للعنصر بدون صورة
    container.style.background = '#f9f9f9';
    container.style.border = '1px dashed #ddd';
    container.style.padding = '20px';
    container.style.borderRadius = '8px';
}

// تحديث displaySearchResults لاستخدام الدالة الجديدة
function displaySearchResults(categorizedItems, pagination) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    const existingContent = menuContainer.querySelector('.menu-content');
    if (existingContent) existingContent.remove();

    const menuContent = document.createElement('div');
    menuContent.className = 'menu-content';
    
    if (!categorizedItems || categorizedItems.length === 0) {
        menuContent.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>لا توجد نتائج</h3>
                <p>لم نعثر على أي عناصر تطابق بحثك</p>
                <button onclick="resetFilters()" class="reset-btn">عرض كل العناصر</button>
            </div>
        `;
    } else {
        menuContent.innerHTML = categorizedItems.map(category => {
            const items = category.items || [];
            
            return `
                <div class="menu-category">
                    <div class="category-header">
                        <h3 class="category-title">${category.name || 'غير مصنف'}</h3>
                        <div class="category-line"></div>
                        <span class="category-count">${items.length} عنصر</span>
                    </div>
                    <div class="category-widgets">
                        ${items.map(item => renderMenuItem(item)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    menuContainer.appendChild(menuContent);
    addLoadMoreButton(pagination);
}
// عرض الصفحة الأولى مع الصور
function displayFirstPage() {
    // تحقق من وجود صور في العناصر الأولى
    const hasImages = AppState.menuItems.some(item => item.image_url && item.image_url.trim() !== '');
    
    if (hasImages) {
        console.log('✅ تم اكتشاف صور في البيانات، جاري العرض...');
    } else {
        console.log('ℹ️ لا توجد صور في البيانات، جاري العرض بالنمط القديم...');
    }
    
    // 🔥🔥🔥 تعديل: عرض القائمة المصفاة مع التأكد من الترتيب 🔥🔥🔥
    
    // 1. أولاً: ترتيب التصنيفات في AppState لتكون متاحة للبحث
    AppState.menuCategories.sort((a, b) => {
        const orderA = a.display_order || a.id;
        const orderB = b.display_order || b.id;
        return orderA - orderB;
    });
    
    // 2. إعادة تعيين الفلترة للقيم الافتراضية (باستخدام category_id كقيمة افتراضية)
    AppState.currentFilter = {
        searchTerm: '',
        categoryId: 'all',
        sortBy: 'category_id'  // 🔥 تغيير من 'name' إلى 'category_id'
    };
    AppState.currentPage = 1;
    
    // 3. عرض القائمة المصفاة (سيتم التعامل مع الصور تلقائياً)
    displayFilteredMenu();
}

// تحميل معرض الصور من الـ backend
async function loadGallery() {
    try {
        const response = await fetch(`${AppState.backendUrl}/gallery`);
        
        if (!response.ok) {
            throw new Error(`خطأ في الشبكة: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'فشل في تحميل المعرض');
        }
        
        renderGallery(result.data.images, result.data.videos);
        
    } catch (error) {
        console.error('خطأ في تحميل المعرض:', error);
        // استخدام البيانات المحلية كبديل
        loadLocalGallery();
    }
}

// تحميل المعرض المحلي
function loadLocalGallery() {
    const galleryData = {
        images: [
            { 
                url: 'https://dl.dropboxusercontent.com/scl/fi/uramho4wruhrjsv4vxght/.jpg?rlkey=vg466y1s1dv22kwuuhtrcwduc&st=7e6i0qpu', 
                title: 'الحلو' 
            },
            { 
                url: 'https://dl.dropboxusercontent.com/scl/fi/5wzhp9pmhyqgupwew3oqt/.jpg?rlkey=brdm09eczl3we68adaa7ixjbt&st=qmk0auyg', 
                title: 'سندويتش زنجر' 
            },
            { 
                url: 'https://dl.dropboxusercontent.com/scl/fi/xemx1em68fj51ls3eft7i/.jpg?rlkey=sza4pk8xnxg8x1c8bbvqibqfj&st=pltutfuw', 
                title: 'صوره المطعم' 
            },
            { 
                url: 'https://dl.dropboxusercontent.com/scl/fi/lqhlg74wxfunonae3exys/.jpg?rlkey=flh8dbl9o23n8csyvkom3awdd&st=2nk98hkc', 
                title: 'طاجن لحمه' 
            },
            { 
                url: 'https://dl.dropboxusercontent.com/scl/fi/zwqe18aeub5lepcctz2a6/.jpg?rlkey=2egfeq0mo87g81po6ahyku687&st=kjibo60q', 
                title: 'كريب فراخ' 
            },
            { 
                url: 'https://dl.dropboxusercontent.com/scl/fi/kncyjs21m22fmhjip634n/.jpg?rlkey=34enhqbf079ljccj6p7oj3ss1&st=lim70chh', 
                title: 'كشري' 
            }
        ],
        videos: [
            {
                src: 'https://dl.dropboxusercontent.com/scl/fi/7ujrearefrk3z70oqqs4v/video.mp4?rlkey=r6vvr0ctylwltg398jifpz371&st=sd29pief',
                caption: 'فيديو عن المطعم'
            },
            {
                src: 'https://dl.dropboxusercontent.com/scl/fi/wei0lrm3vihxqadiogq3x/video2.mp4?rlkey=828ho9m3lm93ei963bu3p88sw&st=icqtrw4r',
                caption: 'الكريب مع رسلان'
            }
        ]
    };

    renderGallery(galleryData.images, galleryData.videos);
}

// عرض معرض الصور
function renderGallery(images, videos = []) {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    // دمج الصور والفيديوهات
    const allMedia = [
        ...(images || []).map(img => ({ ...img, type: 'image' })),
        ...(videos || []).map(vid => ({ ...vid, type: 'video', url: vid.src, title: vid.caption }))
    ];

    if (!allMedia || allMedia.length === 0) {
        galleryGrid.innerHTML = `
            <div class="no-gallery">
                <i class="fas fa-images"></i>
                <p>معرض الصور قريباً إن شاء الله</p>
            </div>
        `;
        return;
    }

    galleryGrid.innerHTML = allMedia.map(media => {
        if (media.type === 'video') {
            return `
                <div class="gallery-item">
                    <video controls muted playsinline preload="metadata" class="gallery-media">
                        <source src="${media.url}" type="video/mp4">
                        متصفحك لا يدعم تشغيل الفيديو
                    </video>
                    <div class="gallery-overlay">
                        <h4>${media.title}</h4>
                        <div class="video-indicator">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="gallery-item">
                    <img src="${media.url}" alt="${media.title}" loading="lazy" class="gallery-media">
                    <div class="gallery-overlay">
                        <h4>${media.title}</h4>
                    </div>
                </div>
            `;
        }
    }).join('');

    // إضافة تأثيرات التفاعل
    setupGalleryInteractions();
}

// وظيفة الطلب المباشر
function orderItem(itemCode) {
    localStorage.setItem('selectedItem', itemCode);
    window.location.href = 'order.html';
}

// تنسيق السعر
function formatPrice(price) {
    return `${parseFloat(price).toFixed(2)} ج.م`;
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    setupMenuNavigation();
    setupLazyGallery();
    loadFontAwesome();
    setupFilterEvents();
}

// إعداد أحداث الفلترة
function setupFilterEvents() {
    // استخدام event delegation للعناصر الديناميكية
    document.addEventListener('input', function(e) {
        if (e.target.matches('#search-input')) {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                applyFilters();
            }, 300); // تأخير 300 مللي ثانية للبحث
        }
    });
    
    document.addEventListener('change', function(e) {
        if (e.target.matches('#category-filter') || e.target.matches('#sort-filter')) {
            applyFilters();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.matches('#reset-filters') || e.target.closest('#reset-filters')) {
            resetFilters();
        }
    });
}

// إعداد التنقل في القائمة
function setupMenuNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('nav.menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
            
            // تبديل الأيقونة
            const icon = menuToggle.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-bars')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }

    // إغلاق القائمة عند النقر على رابط
    document.querySelectorAll('nav.menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
            
            // إعادة الأيقونة
            const icon = menuToggle?.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    });
}

// تحميل Font Awesome
function loadFontAwesome() {
    if (document.querySelector('link[href*="font-awesome"]')) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
}

// إعداد المعرض الكسول
function setupLazyGallery() {
    const gallerySection = document.querySelector('.gallery-section');
    if (!gallerySection) return;

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadGallery();
            observer.disconnect();
        }
    }, { threshold: 0.1 });

    observer.observe(gallerySection);
}

// وظائف إدارة صفحة التحميل
function updateLoadingText(text) {
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

function updateProgress(percent) {
    const progress = document.getElementById('progress');
    if (progress) {
        progress.style.width = percent + '%';
    }
}

function showLoadingPage() {
    const loadingPage = document.getElementById('loading-page');
    if (loadingPage) {
        loadingPage.style.display = 'flex';
        loadingPage.style.opacity = '1';
    }
}

function hideLoadingPage() {
    const loadingPage = document.getElementById('loading-page');
    if (loadingPage) {
        loadingPage.style.opacity = '0';
        setTimeout(() => {
            loadingPage.style.display = 'none';
        }, 500);
    }
}

// وظائف محسنة لإدارة الأخطاء
function showError(message) {
    console.error(message);
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
        menuContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>حدث خطأ</h3>
                <p>${message}</p>
                <div class="error-actions">
                    <button onclick="location.reload()" class="retry-btn">
                        <i class="fas fa-redo"></i>
                        إعادة المحاولة
                    </button>
                    <button onclick="useLocalData()" class="local-btn">
                        <i class="fas fa-database"></i>
                        استخدام البيانات المحلية
                    </button>
                </div>
            </div>
        `;
    }
}

// استخدام البيانات المحلية عند الضغط على الزر
function useLocalData() {
    console.log('🔄 استخدام البيانات المحلية...');
    loadSampleData();
}

// تحسين initApp
async function initApp() {
    try {
        showLoadingPage();
        updateLoadingText('جاري تحميل القائمة...');
        updateProgress(30);
         await debugBackendData();
        // تحميل البيانات من الـ backend الخاص بك
        await loadDataFromBackend();
        updateProgress(70);
        
        // تحميل معرض الصور
        await loadGallery();
        updateProgress(90);
        
        // إخفاء صفحة التحميل
        setTimeout(() => {
            hideLoadingPage();
            updateProgress(100);
        }, 1000);
        
    } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
        showError('حدث خطأ في تحميل البيانات. جاري استخدام البيانات المحلية.');
        loadSampleData();
        hideLoadingPage();
    }
}

// جعل الدوال متاحة globally
window.orderItem = orderItem;
window.loadMoreItems = loadMoreItems;
window.resetFilters = resetFilters;
window.applyFilters = applyFilters;

// باقي الكود (welcome-message.js) يبقى كما هو دون تغيير
// ... [نفس كود welcome-message.js السابق]
// welcome-message.js - رسالة الترحيب والتقييم
(function() {
    'use strict';
    
    // تهيئة متغيرات التطبيق
    const AppConfig = {
        visitThreshold: 5, // عدد الزيارات المطلوبة قبل عرض الرسالة
        showAgainAfter: 3, // عدد الزيارات الإضافية قبل إعادة العرض
        maxVisits: 30, // الحد الأقصى للزيارات لعرض الرسالة
        localStorageKey: 'raslan_visit_data',
        overlayId: 'welcome-overlay',
        messageId: 'welcome-message'
    };
    
    // إنشاء عناصر DOM ديناميكياً
    function createWelcomeOverlay() {
        // التحقق إذا كان الـ overlay موجوداً مسبقاً
        if (document.getElementById(AppConfig.overlayId)) {
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.id = AppConfig.overlayId;
        overlay.className = 'welcome-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.5s ease;
        `;
        
        const message = document.createElement('div');
        message.id = AppConfig.messageId;
        message.className = 'welcome-message';
        message.style.cssText = `
            background: white;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            padding: 40px;
            width: 100%;
            max-width: 500px;
            position: relative;
            overflow: hidden;
            text-align: center;
            animation: slideUp 0.5s ease;
        `;
        
        // إضافة CSS animations
        addWelcomeStyles();
        
        // بناء محتوى الرسالة
        message.innerHTML = `
            <button class="close-btn">&times;</button>
            
            <div class="welcome-header">
                <i class="fas fa-star"></i>
                <h2>مرحباً بعودتك!</h2>
                <p>يسعدنا أنك تزورنا مرة أخرى</p>
                <div class="client-name">العزيز/ة</div>
            </div>
            
            <p>نحن نسعى دائماً لتقديم أفضل خدمة لك. إذا كنت راضياً عن تجربتك معنا، يرجى تقييمنا:</p>
            
            <div class="rating-actions">
                <a href="https://share.google/XP43RV5hBXSX40NxM" target="_blank" class="rating-btn">
                    <i class="fas fa-star"></i>
                    تقييم الخدمة
                </a>
                
                <a href="feedback.html" class="feedback-link">
                    <i class="fas fa-comments"></i>
                    لديك اقتراح؟ اضغط هنا
                </a>
            </div>
            
            <p class="note">
                ملاحظة: صفحة الاقتراحات (Feedback) مخصصة للتعليقات التفصيلية والاقتراحات، 
                بينما الرابط أعلاه مخصص للتقييم العام للخدمة.
            </p>
            
            <div class="actions">
                <button class="action-btn order-btn">
                    <i class="fas fa-shopping-cart"></i>
                    اطلب الآن
                </button>
                <button class="action-btn later-btn">
                    <i class="fas fa-clock"></i>
                    لاحقاً
                </button>
            </div>
        `;
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
        
        // إعداد مستمعي الأحداث
        setupEventListeners();
    }
    
    // إضافة الأنماط الديناميكية
    function addWelcomeStyles() {
        if (document.getElementById('welcome-message-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'welcome-message-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .welcome-header {
                margin-bottom: 25px;
            }
            
            .welcome-header i {
                font-size: 4rem;
                color: #ee5f06;
                margin-bottom: 15px;
            }
            
            .welcome-header h2 {
                color: #ee5f06;
                font-size: 1.8rem;
                margin-bottom: 10px;
            }
            
            .welcome-header p {
                color: #666;
                font-size: 1.1rem;
                line-height: 1.5;
            }
            
            .client-name {
                background: linear-gradient(135deg, #ee5f06, #f4bf3a);
                color: white;
                padding: 10px 20px;
                border-radius: 30px;
                font-weight: bold;
                font-size: 1.2rem;
                display: inline-block;
                margin: 15px 0;
            }
            
            .rating-actions {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin: 25px 0;
            }
            
            .rating-btn {
                background: linear-gradient(135deg, #ee5f06, #f4bf3a);
                color: white;
                padding: 15px;
                border: none;
                border-radius: 10px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                box-shadow: 0 4px 15px rgba(238, 95, 6, 0.3);
                text-decoration: none;
            }
            
            .rating-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(238, 95, 6, 0.4);
            }
            
            .feedback-link {
                color: #ee5f06;
                text-decoration: none;
                padding: 12px;
                border: 2px solid #ee5f06;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            .feedback-link:hover {
                background: #ee5f06;
                color: white;
            }
            
            .note {
                font-size: 0.9rem;
                color: #666;
                margin-top: 15px;
                font-style: italic;
                line-height: 1.4;
            }
            
            .actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .action-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            
            .order-btn {
                background: #ee5f06;
                color: white;
            }
            
            .order-btn:hover {
                background: #d35400;
            }
            
            .later-btn {
                background: #f8f9fa;
                color: #666;
                border: 1px solid #ddd;
            }
            
            .later-btn:hover {
                background: #e9ecef;
            }
            
            .close-btn {
                position: absolute;
                top: 15px;
                left: 15px;
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #999;
                cursor: pointer;
                transition: color 0.3s ease;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .close-btn:hover {
                color: #ee5f06;
                background: #f8f9fa;
            }
            
            @media (max-width: 768px) {
                .welcome-overlay {
                    padding: 15px;
                }
                
                .welcome-message {
                    padding: 30px 20px;
                }
                
                .welcome-header h2 {
                    font-size: 1.5rem;
                }
                
                .welcome-header i {
                    font-size: 3rem;
                }
                
                .rating-actions {
                    gap: 10px;
                }
                
                .actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // إعداد مستمعي الأحداث
    function setupEventListeners() {
        const overlay = document.getElementById(AppConfig.overlayId);
        const message = document.getElementById(AppConfig.messageId);
        
        // زر الإغلاق
        message.querySelector('.close-btn').addEventListener('click', function() {
            hideWelcomeMessage();
            markRatingAsShown();
        });
        
        // زر لاحقاً
        message.querySelector('.later-btn').addEventListener('click', function() {
            hideWelcomeMessage();
            // إعادة العرض بعد عدد إضافي من الزيارات
            const visitData = getVisitData();
            visitData.ratingShown = false;
            localStorage.setItem(AppConfig.localStorageKey, JSON.stringify(visitData));
        });
        
        // زر اطلب الآن
        message.querySelector('.order-btn').addEventListener('click', function() {
            window.location.href = 'order.html';
        });
        
        // إغلاق الـ overlay عند النقر خارج الصندوق
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hideWelcomeMessage();
                markRatingAsShown();
            }
        });
        
        // إغلاق بالزر Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.style.display === 'flex') {
                hideWelcomeMessage();
                markRatingAsShown();
            }
        });
    }
    
    // 🗂️ جلب بيانات الزيارات من localStorage بأمان
    function getVisitData() {
        try {
            const data = JSON.parse(localStorage.getItem(AppConfig.localStorageKey));
            if (data && typeof data.visitCount === "number") {
                return data;
            }
        } catch (e) {
            console.warn("خطأ في قراءة بيانات الزيارات:", e);
        }
        return { visitCount: 0, lastVisit: null, lastRatingShownAt: 0 };
    }

    // 💾 حفظ بيانات الزيارات
    function saveVisitData(data) {
        try {
            localStorage.setItem(AppConfig.localStorageKey, JSON.stringify(data));
        } catch (e) {
            console.warn("خطأ في حفظ بيانات الزيارات:", e);
        }
    }

    // 📈 تتبع الزيارة (مع حماية من التكرار)
    function trackVisit() {
        if (sessionStorage.getItem("visitTracked") === "true") {
            console.log("زيارة محسوبة مسبقاً في هذه الجلسة ✅");
            return getVisitData();
        }

        const visitData = getVisitData();
        visitData.visitCount += 1;
        visitData.lastVisit = new Date().toISOString();
        saveVisitData(visitData);

        sessionStorage.setItem("visitTracked", "true");

        console.log(`عدد زياراتك: ${visitData.visitCount}`);
        return visitData;
    }

    // ✅ تحديد ما إذا كان يجب عرض رسالة التقييم
    function shouldShowRating(visitData) {
        const threshold = AppConfig.visitThreshold;
        const maxVisits = AppConfig.maxVisits;
        
        // التحقق من عدم تجاوز الحد الأقصى للزيارات
        if (visitData.visitCount > maxVisits) {
            console.log(`تم الوصول للحد الأقصى (${maxVisits} زيارة) - لن يتم عرض الرسالة`);
            return false;
        }
        
        // عرض الرسالة فقط عندما:
        // 1. عدد الزيارات مضاعف للـ threshold
        // 2. لم نعرض الرسالة لهذا العدد من قبل
        // 3. لم نتجاوز الحد الأقصى للزيارات
        return visitData.visitCount > 0 && 
               visitData.visitCount % threshold === 0 && 
               visitData.lastRatingShownAt !== visitData.visitCount;
    }
    
    // عرض رسالة الترحيب
    function showWelcomeMessage() {
        const overlay = document.getElementById(AppConfig.overlayId);
        const message = document.getElementById(AppConfig.messageId);
        
        if (!overlay || !message) {
            console.error('عناصر الرسالة غير موجودة');
            return;
        }
        
        // الحصول على بيانات العميل من localStorage
        const clientData = JSON.parse(localStorage.getItem('currentClient') || '{}');
        
        // عرض اسم العميل إذا كان موجوداً
        const clientNameElement = message.querySelector('.client-name');
        if (clientData.name) {
            clientNameElement.textContent = clientData.name;
        } else {
            clientNameElement.textContent = "عزيزنا العميل";
        }
        
        overlay.style.display = 'flex';
        // منع التمرير عند ظهور الـ overlay
        document.body.style.overflow = 'hidden';
    }
    
    // إخفاء رسالة الترحيب
    function hideWelcomeMessage() {
        const overlay = document.getElementById(AppConfig.overlayId);
        if (overlay) {
            overlay.style.display = 'none';
            // إعادة التمرير
            document.body.style.overflow = 'auto';
        }
    }
    
    // وضع علامة أن رسالة التقييم قد تم عرضها
    function markRatingAsShown() {
        const visitData = getVisitData();
        visitData.lastRatingShownAt = visitData.visitCount;
        saveVisitData(visitData);
    }
    
    // تهيئة التطبيق
    function init() {
        // إنشاء عناصر الرسالة
        createWelcomeOverlay();
        
        // تتبع الزيارة
        const visitData = trackVisit();
        
        // التحقق إذا حان وقت عرض رسالة التقييم
        if (shouldShowRating(visitData)) {
            console.log(`عرض رسالة التقييم للزيارة رقم ${visitData.visitCount}`);
            // الانتظار قليلاً ثم عرض الرسالة (لتحسين تجربة المستخدم)
            setTimeout(showWelcomeMessage, 2000);
        } else {
            console.log(`لا توجد حاجة لعرض الرسالة - الزيارة رقم ${visitData.visitCount}`);
        }
    }
    
    // تصدير الدوال للاستخدام الخارجي
    window.WelcomeMessage = {
        init: init,
        show: showWelcomeMessage,
        hide: hideWelcomeMessage,
        trackVisit: trackVisit
    };
    
    // تهيئة التطبيق عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

document.addEventListener('DOMContentLoaded', function() {
    // إنشاء زر الإغلاق
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.id = 'closeBtn';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    // إيجاد عنصر الملاحظة وإضافة زر الإغلاق له
    const warningNote = document.querySelector('.warning-note');
    warningNote.style.position = 'relative';
    warningNote.appendChild(closeBtn);
    
    // التحقق مما إذا كان المستخدم قد أغلق الملاحظة مسبقًا
    const isWarningClosed = localStorage.getItem('warningClosed');
    if (isWarningClosed === 'true') {
        warningNote.style.display = 'none';
    }
    
    // إضافة حدث النقر على زر الإغلاق
    closeBtn.addEventListener('click', function() {
        // إضافة تأثير اختفاء سلس
        warningNote.style.transition = 'all 0.4s ease';
        warningNote.style.opacity = '0';
        warningNote.style.transform = 'translateY(-20px) scale(0.95)';
        
        setTimeout(function() {
            warningNote.style.display = 'none';
            // حفظ حالة الإغلاق في localStorage
            localStorage.setItem('warningClosed', 'true');
        }, 400);
    });
    
    // دالة لإعادة عرض الملاحظة (اختياري - للتطوير)
    function showWarningNote() {
        localStorage.removeItem('warningClosed');
        warningNote.style.display = 'block';
        setTimeout(function() {
            warningNote.style.opacity = '1';
            warningNote.style.transform = 'translateY(0) scale(1)';
        }, 50);
    }
    
    // إضافة حدث لإعادة العرض عند الضغط على R (للتطوير)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' || e.key === 'R') {
            showWarningNote();
        }
    });
});

// إعداد تفاعلات المعرض - الدالة المفقودة
function setupGalleryInteractions() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        // تأثير التكبير عند المرور
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });

        // فتح الصورة/الفيديو عند النقر
        item.addEventListener('click', function() {
            openMediaModal(this);
        });
    });
}

// فتح الوسائط في نافذة مشروطة - تأكد من وجودها
function openMediaModal(galleryItem) {
    const media = galleryItem.querySelector('.gallery-media');
    const title = galleryItem.querySelector('h4').textContent;
    
    // إنشاء الـ modal
    const modal = document.createElement('div');
    modal.className = 'gallery-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const mediaContent = media.tagName === 'VIDEO' 
        ? `<video controls autoplay class="modal-media" style="max-width: 90%; max-height: 80%;">
             <source src="${media.querySelector('source').src}" type="video/mp4">
           </video>`
        : `<img src="${media.src}" alt="${title}" class="modal-media" style="max-width: 90%; max-height: 80%;">`;

    modal.innerHTML = `
        <div class="modal-content" style="position: relative; text-align: center;">
            ${mediaContent}
            <div class="modal-caption" style="color: white; margin-top: 15px; font-size: 1.2rem;">
                ${title}
            </div>
            <button class="modal-close" style="position: absolute; top: -50px; right: 0; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // إضافة الـ modal للصفحة
    document.body.appendChild(modal);

    // إظهار الـ modal
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);

    // إغلاق الـ modal
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
}

// جعل الدوال متاحة globally
window.orderItem = orderItem;
window.loadMoreItems = loadMoreItems;
window.resetFilters = resetFilters;
window.applyFilters = applyFilters;
window.setupGalleryInteractions = setupGalleryInteractions;
window.openMediaModal = openMediaModal;
window.displayMoreResults = displayMoreResults;


async function debugBackendData() {
    try {
        console.log('🔍 جاري فحص بيانات الـ Backend...');
        
        const response = await fetch(`${AppState.backendUrl}/menu/init`);
        const result = await response.json();
        
        if (result.success) {
            console.log('📊 بيانات التصنيفات من Backend:');
            if (result.data.categories) {
                result.data.categories.forEach((cat, index) => {
                    console.log(`${index + 1}. ID: ${cat.id}, Name: ${cat.name}, display_order: ${cat.display_order || 'غير محدد'}`);
                });
                
                // تحقق إذا كان display_order موجوداً
                const hasDisplayOrder = result.data.categories.some(cat => cat.display_order);
                console.log(`🔢 display_order موجود؟ ${hasDisplayOrder}`);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في فحص بيانات Backend:', error);
    }
}

// إضافة CSS ديناميكي للفلترة
function addFilterStyles() {
    const styleId = 'filter-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .filter-container {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            border: 1px solid #eaeaea;
        }
        
        .filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .filter-header h2 {
            color: #ee5f06;
            font-size: 1.4rem;
            margin: 0;
        }
        
        .filter-stats {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .items-count {
            background: #f8f9fa;
            padding: 8px 15px;
            border-radius: 20px;
            font-weight: 600;
            color: #555;
            border: 1px solid #dee2e6;
        }
        
        .filter-row {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 15px;
            align-items: end;
        }
        
        @media (max-width: 768px) {
            .filter-row {
                grid-template-columns: 1fr;
            }
        }
        
        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .filter-group label {
            font-weight: 600;
            color: #555;
            font-size: 0.9rem;
        }
        
        .search-box {
            position: relative;
            margin-bottom: 15px;
        }
        
        #search-input {
            width: 100%;
            padding: 15px 45px 15px 20px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s;
        }
        
        #search-input:focus {
            border-color: #ee5f06;
            box-shadow: 0 0 0 3px rgba(238, 95, 6, 0.2);
            outline: none;
        }
        
        .search-icon {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
        }
        
        .category-select, .sort-select {
            padding: 12px 15px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 1rem;
            background: white;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .category-select:focus, .sort-select:focus {
            border-color: #ee5f06;
            box-shadow: 0 0 0 3px rgba(238, 95, 6, 0.2);
            outline: none;
        }
        
        .reset-btn {
            padding: 12px 20px;
            background: #f8f9fa;
            color: #666;
            border: 2px solid #dee2e6;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }
        
        .reset-btn:hover {
            background: #e9ecef;
        }
        
        .filter-indicators {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        
        .active-filters {
            font-size: 0.9rem;
            color: #666;
        }
        
        .filter-indicator {
            display: inline-flex;
            align-items: center;
            background: #e7f4ff;
            color: #0066cc;
            padding: 5px 12px;
            border-radius: 20px;
            margin: 3px;
            font-size: 0.85rem;
            border: 1px solid #b6d4fe;
        }
        
        .clear-indicator {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            margin-right: -5px;
            margin-left: 5px;
            padding: 2px 5px;
            border-radius: 50%;
            font-size: 1rem;
        }
        
        .clear-indicator:hover {
            background: #0066cc;
            color: white;
        }
    `;
    
    document.head.appendChild(style);
}