function showSystemInfo({
	  version = "V3.5",
	  updateDate = "2025-11-24",
	  developer = "Adham Hossam",
	  email = "adham.hossam5020@gmail.com",
	  website = "https://alightbolt4g.github.io/Adham-website/",
	  backendUrl = "https://raslankoshary.up.railway.app/api"
	} = {}) {
	  console.clear();

	  const now = new Date();
	  const lastUpdate = new Date(updateDate);
	  const diffTime = now - lastUpdate;
	  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	  let timeMessage;
	  if (diffDays === 0) timeMessage = "🎯 تم فتح الموقع في يوم التحديث!";
	  else if (diffDays === 1) timeMessage = "📅 تم فتح الموقع بعد يوم من آخر تحديث.";
	  else timeMessage = `⏰ تم فتح الموقع منذ ${diffDays} أيام من آخر تحديث.`;

	  // 🚀 العنوان الرئيسي
	  console.log(
		"%c🚀 RaslanKoshary " + version + " - Full Stack Masterpiece",
		"background: linear-gradient(90deg, #ff6b35, #f4bf3a); -webkit-background-clip: text; color: transparent; font-size: 24px; font-weight: bold; padding: 10px;"
	  );

	  console.log(`%c📅 تم التحديث: ${lastUpdate.toDateString()} | 👨‍💼 ${developer} | 🎯 نظام متكامل من الصفر`,
		"color: #ee5f06; font-weight: 600; font-size: 14px;"
	  );

	  console.log(`%c${timeMessage}`, "color: #06d6a0; font-style: italic;");
	  console.log("%c────────────────────────────────────────────────────────", "color: #666;");

	  // 👑 أدوار المطور الكاملة
	  console.log("%c👑 أدوار المطور الكاملة:", "color: #f4bf3a; font-weight: bold; font-size: 16px;");
	  console.log(`%c• 🎨 مصمم واجهة المستخدم (UI/UX Designer)
	• 💻 مطور Frontend متكامل
	• 🛠️ مطور Backend محترف
	• 🗄️ مهندس قواعد البيانات (DB Architect)
	• 🔒 مختبر اختراق أخلاقي (Penetration Tester)
	• ☁️ مهندس نشر واستضافة (DevOps)
	• 📱 مطور تطبيقات ويب متجاوبة
	• 🎯 مدير مشروع كامل
	• 🔧 محلل نظم ومهندس حلول
	• 🛡️ مسؤول أمن معلومات`,
		"color: #eee; line-height: 1.6;"
	  );

	  // 🛠️ التقنيات المتقنة
	  console.log("%c\n🛠️ التقنيات المتقنة:", "color: #ff6b35; font-weight: bold; font-size: 16px;");
	  console.log(`%cFrontend: HTML5, CSS3, JavaScript (ES6+), Responsive Design
	Backend: Node.js, Express.js, RESTful APIs
	Database: PostgreSQL, Advanced Query Optimization
	Hosting: Railway (Backend), Static Hosting (Frontend)
	Security: Penetration Testing, SQL Injection Protection, IDOR Fixes
	Performance: Lazy Loading, Caching, Optimized Assets
	Tools: Git, VS Code, Chrome DevTools, Postman`,
		"color: #eee; line-height: 1.5;"
	  );

	  // 🔒 الإنجازات الأمنية
	  console.log("%c\n🔒 الإنجازات الأمنية:", "color: #06d6a0; font-weight: bold; font-size: 16px;");
	  console.log(`%c✅ سد ثغرة IDOR الحرجة بنظام تحقق مزدوج
	✅ حماية كاملة من SQL Injection
	✅ منع تام لثغرات XXE/XML
	✅ سياسة CORS آمنة ومحكمة
	✅ تحقق صارم من جميع المدخلات
	✅ اختبار اختراق شامل وناجح
	✅ نظام Fallback عند فشل الاتصال
	✅ رسائل خطأ آمنة بدون تسريب معلومات`,
		"color: #eee; line-height: 1.6;"
	  );

	  // 🎯 الميزات المتقدمة
	  console.log("%c\n🎯 الميزات المتقدمة:", "color: #118ab2; font-weight: bold; font-size: 16px;");
	  console.log(`%c• 🔄 نظام بحث وفلترة حقيقي عبر API
	• 🖼️ معرض وسائط ديناميكي (صور + فيديو)
	• 📱 تصميم متجاوب متقدم للجوال
	• ⚡ تحميل كسول للأداء الأمثل
	• 🎨 واجهة مستخدم حديثة وجذابة
	• 📊 إحصائيات وتحليلات متقدمة
	• 🔔 نظام إشعارات وتفاعل
	• 🌐 دعم متعدد اللغات جاهز
	• 🛒 نظام طلبات متكامل
	• ⭐ نظام تقييم وتعليقات`,
		"color: #eee; line-height: 1.6;"
	  );

	  // 📊 إحصائيات المشروع
	  console.log("%c\n📊 إحصائيات المشروع:", "color: #7209b7; font-weight: bold; font-size: 16px;");
	  console.log(`%c⏱️  وقت التطوير: تطوير مستمر
	📁 عدد الملفات: 50+ ملف برمجي
	🎨 عناصر واجهة: 100+ عنصر
	🔗 نقاط API: 10+ نقطة نهاية
	🗄️ جداول قاعدة البيانات: 8+ جدول
	📱 جهاز مدعوم: جميع الأجهزة
	⚡ سرعة التحميل: أقل من 2 ثانية
	🔒 اختبارات أمنية: 20+ اختبار`,
		"color: #eee; line-height: 1.6;"
	  );

	  // 🏆 الإنجازات التقنية
	  console.log("%c\n🏆 الإنجازات التقنية:", "color: #f72585; font-weight: bold; font-size: 16px;");
	  console.log(`%c🎯 تحول كامل من Frontend فقط إلى Full Stack
	🚀 نشر Backend ناجح على Railway
	🔧 هندسة قاعدة بيانات متكاملة من الصفر
	🛡️ تطبيق معايير أمنية عالية المستوى
	📈 تحسين أداء واستجابة النظام
	🎨 دمج التصميم الجمالي مع الوظائف التقنية
	🔍 إجراء اختبار اختراق شامل وناجح
	💪 معالجة وإصلاح جميع الثغرات المكتشفة`,
		"color: #eee; line-height: 1.6;"
	  );

	  // 🌟 الرؤية المستقبلية
	  console.log("%c\n🌟 الرؤية المستقبلية:", "color: #ffd166; font-weight: bold; font-size: 16px;");
	  console.log(`%c- 📱 تطبيق جوال أصلي (React Native)
	- 💳 نظام دفع إلكتروني متكامل
	- 🤖 ذكاء اصطناعي للتنبؤ بالطلبات
	- 🚚 تكامل مع منصات التوصيل
	- 📊 لوحة تحكم إدارية متقدمة
	- 🔔 إشعارات push فورية
	- 🌍 نسخ دولية متعددة اللغات
	- 🎯 نظام ولاء وعروض متقدمة`,
		"color: #eee; line-height: 1.6;"
	  );

	  // 💼 معلومات المطور
	  console.log("%c\n💼 معلومات المطور الكاملة:", "color: #ef476f; font-weight: bold; font-size: 16px;");
	  console.log(`%c👨‍💻 الاسم: ${developer}
	📧 البريد: ${email}
	🔗 الموقع: ${website}
	🚀 الـBackend: ${backendUrl}

	🎯 "مطور Full Stack متكامل - من التصميم إلى النشر والأمان"
	🔧 "مهندس حلول متكاملة - UI/UX + Frontend + Backend + DB + Security"
	🛡️ "مختبر اختراق أخلاقي - أضمن أمان تطبيقاتي بنفسي"

	📚 المهارات:
	• UI/UX Design & Prototyping
	• Frontend Development (HTML/CSS/JS)
	• Backend Development (Node.js/Express)
	• Database Design & Optimization
	• API Development & Integration
	• Security Testing & Penetration Testing
	• DevOps & Cloud Deployment
	• Performance Optimization
	• Responsive Web Design
	• Cross-browser Compatibility`,
		"color: #eee; line-height: 1.6;"
	  );

	  // 🎪 ركن المطور
	  console.log("%c\n🎪 ركن المطور:", "color: #00b4d8; font-weight: bold; font-size: 16px;");
	  console.log(`%c👑 "عندما تكون المطور ومصمم الواجهة ومهندس قاعدة البيانات ومختبر الاختراق...
		   فأنت لا تبني نظاماً، أنت تخلق تحفة فنية!"

	🔒 "أختبر ثغراتي قبل أن يكتشفها الآخرون - هذه فلسفتي في الأمان"

	🎯 "من فكرة بسيطة إلى نظام متكامل - هذه قوة المطور الشامل"

	⚡ "تصميم الواجهة + برمجة الخوادم + أمان التطبيقات = مطور Full Stack حقيقي"

	💡 "نصيحة: تعلم الأمان - فهو الفرق بين المطور الجيد والمطور الرائع"`,
		"color: #ccc; font-style: italic; line-height: 1.6;"
	  );

	  // 🍛 الخاتمة الملهمة
	  console.log(`%c\n"من حبة أرز إلى نظام متكامل... ومن مطور إلى مهندس حلول شاملة 🍛🚀"`,
		"color: #f4bf3a; font-size: 14px; font-style: italic; text-align: center;"
	  );

	  console.log("%c\n🔧 تم التطوير بكفاءة واحترافية - Adham Hossam 2025 🔧", 
		"color: #666; font-size: 12px; text-align: center;"
	  );
	}

	// 📅 استدعاء الدالة عند فتح الموقع
	showSystemInfo({
	  version: "V3.5",
	  updateDate: "2025-11-24",
	  developer: "Adham Hossam",
	  email: "adham.hossam5020@gmail.com",
	  website: "RaslanKoshary.com",
	  backendUrl: "https://raslankoshary.up.railway.app/api"
	});