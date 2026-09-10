export const SEEDED_BUNDLES = [
  {
    id: "bundle-kite-beach-sunset",
    title: "Sunset & Volleyball at Kite Beach",
    tagline: "Beach sports, specialty burgers & sea breeze",
    description: "Start with casual volleyball on the sand, grab a gourmet burger at SALT, and finish with a sunset stroll along the Umm Suqeim coastline.",
    totalTime: "~3.5 hours",
    city: "Dubai",
    category: "outdoor",
    heroImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    stops: [
      {
        placeId: "fallback_kite_beach",
        name: "Kite Beach",
        category: "outdoor",
        city: "Dubai",
        duration: "1.5 hrs",
        travelToNext: "🚶 3 min walk"
      },
      {
        placeId: "p_mix_flavours",
        name: "SALT Kite Beach",
        category: "food",
        city: "Dubai",
        duration: "1 hr",
        travelToNext: "🚗 5 min drive"
      },
      {
        placeId: "fallback_burj_khalifa",
        name: "Umm Suqeim Sunset Point",
        category: "attraction",
        city: "Dubai",
        duration: "1 hr",
        travelToNext: null
      }
    ]
  },
  {
    id: "bundle-downtown-iconic",
    title: "Downtown Architecture & Views",
    tagline: "The modern marvels of Sheikh Zayed Road",
    description: "Explore the world's tallest building, marvel at futuristic calligraphy design, and cap off the evening at Dubai Mall's fountain display.",
    totalTime: "~5 hours",
    city: "Dubai",
    category: "attraction",
    heroImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80",
    stops: [
      {
        placeId: "fallback_museum_future",
        name: "Museum of the Future",
        category: "culture",
        city: "Dubai",
        duration: "2 hrs",
        travelToNext: "🚗 8 min drive"
      },
      {
        placeId: "fallback_burj_khalifa",
        name: "Burj Khalifa Observation Deck",
        category: "attraction",
        city: "Dubai",
        duration: "1.5 hrs",
        travelToNext: "🚶 5 min walk"
      },
      {
        placeId: "fallback_dubai_mall",
        name: "The Dubai Mall & Fountains",
        category: "shopping",
        city: "Dubai",
        duration: "1.5 hrs",
        travelToNext: null
      }
    ]
  },
  {
    id: "bundle-alserkal-art-coffee",
    title: "Art & Specialty Coffee Trail",
    tagline: "Galleries, craft coffee & bean-to-bar chocolate",
    description: "Immerse yourself in Alserkal Avenue's contemporary galleries, recharge with single-origin cold brew, and tour a bean-to-bar chocolate factory.",
    totalTime: "~4 hours",
    city: "Dubai",
    category: "culture",
    heroImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
    stops: [
      {
        placeId: "fallback_dubai_frame",
        name: "Alserkal Avenue Galleries",
        category: "culture",
        city: "Dubai",
        duration: "2 hrs",
        travelToNext: "🚶 2 min walk"
      },
      {
        placeId: "p_mix_flavours",
        name: "Nightjar Coffee Roasters",
        category: "cafe",
        city: "Dubai",
        duration: "1 hr",
        travelToNext: "🚶 3 min walk"
      },
      {
        placeId: "fallback_dubai_mall",
        name: "Mirzam Chocolate Factory",
        category: "food",
        city: "Dubai",
        duration: "1 hr",
        travelToNext: null
      }
    ]
  },
  {
    id: "bundle-abu-dhabi-culture",
    title: "Abu Dhabi Cultural Landmarks",
    tagline: "World-class art, royal grandeur & serene spirituality",
    description: "A full-day journey spanning Jean Nouvel's dome at Louvre Abu Dhabi, the presidential palaces of Qasr Al Watan, and the Sheikh Zayed Grand Mosque.",
    totalTime: "~6.5 hours",
    city: "Abu Dhabi",
    category: "culture",
    heroImage: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&auto=format&fit=crop&q=80",
    stops: [
      {
        placeId: "fallback_museum_future",
        name: "Louvre Abu Dhabi",
        category: "culture",
        city: "Abu Dhabi",
        duration: "2.5 hrs",
        travelToNext: "🚗 18 min drive"
      },
      {
        placeId: "fallback_dubai_frame",
        name: "Qasr Al Watan Palace",
        category: "attraction",
        city: "Abu Dhabi",
        duration: "2 hrs",
        travelToNext: "🚗 15 min drive"
      },
      {
        placeId: "fallback_burj_khalifa",
        name: "Sheikh Zayed Grand Mosque",
        category: "attraction",
        city: "Abu Dhabi",
        duration: "2 hrs",
        travelToNext: null
      }
    ]
  },
  {
    id: "bundle-nightlife-movies",
    title: "Dinner & Premiere Movie Night",
    tagline: "Gourmet dining followed by blockbusters",
    description: "Enjoy a relaxed late-afternoon meal at a high-rated neighborhood bistro before catching tonight's premier cinema release nearby.",
    totalTime: "~4 hours",
    city: "Dubai",
    category: "movies",
    heroImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    stops: [
      {
        placeId: "p_mix_flavours",
        name: "Mix Flavours Cafe & Bistro",
        category: "food",
        city: "Dubai",
        duration: "1.5 hrs",
        travelToNext: "🚗 10 min drive"
      },
      {
        placeId: "fallback_burj_khalifa",
        name: "Roxy Cinemas Boxpark",
        category: "entertainment",
        city: "Dubai",
        duration: "2.5 hrs",
        travelToNext: null
      }
    ]
  }
];
