// بيانات Structured Data الكاملة لتحسين SEO
const structuredData = {
  getRestaurantSchema: () => ({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": "https://raslankoshary.com/#restaurant",
    "name": "كشري وكريب رسلان",
    "description": "كشري وكريب رسلان يقدم أشهى أطباق الكشري والكريب مع وجبات مصرية سريعة، يعمل 24 ساعة يومياً لخدمة العملاء في منطقة المريوطية - الجيزة.",
    "url": "https://raslankoshary.com",
    "image": "https://raslankoshary.com/imgs/favicon.png",
    "logo": "https://raslankoshary.com/imgs/favicon.png",
    "favicon": "https://raslankoshary.com/imgs/favicon.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "El-Mansheya Bridge, Monshaat Al Bakkari, المريوطية",
      "addressLocality": "الجيزة",
      "addressRegion": "الجيزة",
      "addressCountry": "EG",
      "postalCode": "12511"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "29.9707",
      "longitude": "31.1615"
    },
    "telephone": "+201011899997",
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+201011899997",
        "contactType": "customer service",
        "availableLanguage": ["ar", "en"]
      },
      {
        "@type": "ContactPoint",
        "telephone": "https://wa.me/201011899997",
        "contactType": "WhatsApp",
        "availableLanguage": ["ar", "en"]
      }
    ],
    "servesCuisine": [
      "Egyptian",
      "Fast Food",
      "Koshary",
      "Crepes",
      "Street Food"
    ],
    "priceRange": "جنيه",
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61578888050094",
      "https://www.instagram.com/raslankoshary",
      "https://wa.me/201011899997",
      "https://www.elmenus.com/ar/القاهرة/كريب-رسلان-a47y?",
      "https://www.google.com/search?q=رسلان+كشري"
    ],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "00:00",
        "closes": "23:59"
      }
    ],
    "menu": "https://raslankoshary.com/index.html",
    "hasMenu": "https://www.elmenus.com/ar/القاهرة/كريب-رسلان-a47y?",
    "acceptsReservations": "false",
    "paymentAccepted": [
      "Cash",
      "Credit Card",
      "Vodafone Cash",
      "InstaPay"
    ],
    "founder": {
      "@type": "Person",
      "name": "رسلان"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.6",
      "reviewCount": "320"
    },
    "potentialAction": [
      {
        "@type": "OrderAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://raslankoshary.com/order.html"
        },
        "deliveryMethod": [
          "http://purl.org/goodrelations/v1#DeliveryModePickUp",
          "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet"
        ]
      },
      {
        "@type": "ReviewAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://raslankoshary.com/feedback.html"
        }
      }
    ]
  }),

  injectSchema: function() {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(this.getRestaurantSchema(), null, 2);
    document.head.appendChild(script);
    console.log('✅ Structured Data injected successfully');
  }
};

// حقن البيانات تلقائياً عند التحميل
document.addEventListener('DOMContentLoaded', function() {
  structuredData.injectSchema();
});

export { structuredData };