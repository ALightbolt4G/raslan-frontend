// تحميل وعرض قائمة الطعام
const menuLoader = {
  async loadMenu() {
    try {
      // محاكاة بيانات القائمة (يمكن استبدالها بـ API حقيقي)
      const menuData = [
        {
          name: "🍛 الكشري",
          items: [
            { name: "كشري صغير", description: "أرز، معكرونة، عدس، حمص، صلصة طماطم، بصل مقلي", price: "25", image: "imgs/koshary-small.jpg" },
            { name: "كشري كبير", description: "أرز، معكرونة، عدس، حمص، صلصة طماطم، بصل مقلي، شطة، ليمون", price: "35", image: "imgs/koshary-large.jpg" },
            { name: "كشري عائلي", description: "وجبة عائلية كبيرة تناسب 4 أشخاص", price: "90", image: "imgs/koshary-family.jpg" }
          ]
        },
        {
          name: "🥞 الكريب",
          items: [
            { name: "كريب جبنة", description: "عجينة كريب مع جبنة موزاريلا ذائبة", price: "30", image: "imgs/crepe-cheese.jpg" },
            { name: "كريب شوكولاتة", description: "كريب حلو مع شوكولاتة وجوز", price: "25", image: "imgs/crepe-chocolate.jpg" },
            { name: "كريب سجق", description: "كريب مالح مع سجق وخضروات", price: "35", image: "imgs/crepe-sausage.jpg" }
          ]
        },
        {
          name: "🧇 الوافل",
          items: [
            { name: "وافل نوتيلا", description: "وافل مقرمش مع نوتيلا وموز", price: "28", image: "imgs/waffle-nutella.jpg" },
            { name: "وافل كراميل", description: "وافل مع كراميل وجوز", price: "26", image: "imgs/waffle-caramel.jpg" }
          ]
        },
        {
          name: "🍗 الطواجن",
          items: [
            { name: "تكة لحم", description: "تكة لحم بالصلصة والبهارات", price: "65", image: "imgs/taka-lahm.jpg" },
            { name: "فراخ بانيه", description: "صدور فراخ مقلية", price: "45", image: "imgs/chicken-pane.jpg" }
          ]
        }
      ];
      
      this.renderMenu(menuData);
    } catch (error) {
      console.error('❌ خطأ في تحميل القائمة:', error);
      this.showError();
    }
  },

  renderMenu(menuData) {
    const container = document.getElementById('menu-container');
    if (!container) {
      console.error('❌ عنصر menu-container غير موجود');
      return;
    }
    
    container.innerHTML = menuData.map(category => `
      <div class="menu-category">
        <h3 class="category-title">${category.name}</h3>
        <div class="menu-items">
          ${category.items.map(item => `
            <div class="menu-item">
              <div class="item-details">
                <h4 class="item-name">${item.name}</h4>
                <p class="item-description">${item.description}</p>
                <div class="item-price">${item.price} جنيه</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    
    console.log('✅ Menu loaded successfully');
  },

  showError() {
    const container = document.getElementById('menu-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>عذراً، حدث خطأ في تحميل القائمة. يرجى المحاولة لاحقاً.</p>
          <button onclick="menuLoader.loadMenu()" class="retry-btn">
            <i class="fas fa-redo"></i> إعادة المحاولة
          </button>
        </div>
      `;
    }
  }
};

// تحميل القائمة تلقائياً عند التحميل
document.addEventListener('DOMContentLoaded', function() {
  menuLoader.loadMenu();
});

export { menuLoader };