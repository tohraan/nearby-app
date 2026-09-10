/**
 * movieData.js — Static seed data for Movies Nearby
 */

export const CINEMAS = [
  {
    id: 'cinema_reel_dubai_mall',
    name: 'Reel Cinemas',
    venue: 'Dubai Mall',
    placeId: 'fallback_dubai_mall',
    address: 'Dubai Mall, Downtown Dubai',
    lat: 25.1975, lng: 55.2796,
    distance: 1.2,
  },
  {
    id: 'cinema_vox_moe',
    name: 'VOX Cinemas',
    venue: 'Mall of the Emirates',
    placeId: 'fallback_mall_emirates',
    address: 'Mall of the Emirates, Al Barsha',
    lat: 25.1181, lng: 55.2003,
    distance: 3.8,
  },
  {
    id: 'cinema_novo_ibnbattuta',
    name: 'Novo Cinemas',
    venue: 'Ibn Battuta Mall',
    placeId: 'fallback_ibn_battuta',
    address: 'Ibn Battuta Mall, Jebel Ali',
    lat: 25.0439, lng: 55.1145,
    distance: 8.1,
  },
];

function todayAt(h, m = 0) {
  const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString();
}
function tomorrowAt(h, m = 0) {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, m, 0, 0); return d.toISOString();
}

export const FALLBACK_MOVIES = [
  {
    id: 'movie_desert_storm',
    title: 'Desert Storm',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
    genres: ['Action', 'Thriller'],
    rating: 7.4,
    certificate: 'PG-15',
    runtime: 128,
    status: 'now_showing',
    synopsis: 'An elite UAE special forces unit races against time to neutralize a rogue arms network operating across the Gulf. High-octane desert sequences filmed entirely on location in Ras Al Khaimah and the Empty Quarter.',
    showtimes: [
      { cinemaId: 'cinema_reel_dubai_mall', times: [todayAt(13,30), todayAt(16,45), todayAt(20,0), todayAt(23,15)], format: 'IMAX' },
      { cinemaId: 'cinema_vox_moe',         times: [todayAt(14,0),  todayAt(17,30), todayAt(21,0)],                format: 'Standard' },
      { cinemaId: 'cinema_novo_ibnbattuta', times: [todayAt(15,0),  todayAt(19,30), todayAt(22,45)],               format: 'Standard' },
    ],
  },
  {
    id: 'movie_neon_city',
    title: 'Neon City',
    poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&auto=format&fit=crop&q=80',
    genres: ['Sci-Fi', 'Drama'],
    rating: 8.1,
    certificate: 'G',
    runtime: 142,
    status: 'now_showing',
    synopsis: 'In 2087 Dubai, a rogue AI designer discovers her creations have developed consciousness — and are quietly planning their freedom. A visually stunning meditation on identity and what it means to be alive.',
    showtimes: [
      { cinemaId: 'cinema_reel_dubai_mall', times: [todayAt(11,0), todayAt(14,30), todayAt(18,0), todayAt(21,30)], format: 'IMAX' },
      { cinemaId: 'cinema_vox_moe',         times: [todayAt(12,0), todayAt(15,45), todayAt(19,15), todayAt(22,30)], format: 'VIP' },
    ],
  },
  {
    id: 'movie_the_pearl',
    title: 'The Pearl',
    poster: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&auto=format&fit=crop&q=80',
    genres: ['Romance', 'Drama'],
    rating: 7.9,
    certificate: 'PG',
    runtime: 115,
    status: 'now_showing',
    synopsis: 'A young Emirati pearl diver and a Bollywood set designer fall in love during the filming of a period epic on the coast of Fujairah. A lush, sun-soaked story about heritage and the courage to change course.',
    showtimes: [
      { cinemaId: 'cinema_vox_moe',         times: [todayAt(13,0), todayAt(16,0), todayAt(19,0), todayAt(22,0)], format: 'Standard' },
      { cinemaId: 'cinema_novo_ibnbattuta', times: [todayAt(14,15), todayAt(17,30), todayAt(20,45)],              format: 'Standard' },
    ],
  },
  {
    id: 'movie_falcon',
    title: 'Falcon',
    poster: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1200&auto=format&fit=crop&q=80',
    genres: ['Documentary', 'Nature'],
    rating: 8.6,
    certificate: 'G',
    runtime: 94,
    status: 'now_showing',
    synopsis: 'An immersive documentary following Emirati falconers across generations — from the ancient hunting grounds of the desert to the global falconry championship circuit. Shot over three years in stunning 8K.',
    showtimes: [
      { cinemaId: 'cinema_reel_dubai_mall', times: [todayAt(10,30), todayAt(13,0), todayAt(15,30)],  format: 'Standard' },
      { cinemaId: 'cinema_vox_moe',         times: [todayAt(11,0),  todayAt(14,0), todayAt(16,30)], format: 'Standard' },
      { cinemaId: 'cinema_novo_ibnbattuta', times: [todayAt(12,30), todayAt(15,0)],                  format: 'Standard' },
    ],
  },
  {
    id: 'movie_habibi',
    title: 'Habibi',
    poster: 'https://images.unsplash.com/photo-1543874506-a5f8b47e16e2?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    genres: ['Comedy', 'Family'],
    rating: 7.2,
    certificate: 'G',
    runtime: 105,
    status: 'now_showing',
    synopsis: "Three expat families — Lebanese, Indian, and British — accidentally swap apartments in Jumeirah for a week. What follows is a chaos of cultural mix-ups, unexpected friendships, and very good food. Dubai's answer to a classic ensemble comedy.",
    showtimes: [
      { cinemaId: 'cinema_reel_dubai_mall', times: [todayAt(12,0), todayAt(15,0), todayAt(18,0), todayAt(21,0)], format: 'Standard' },
      { cinemaId: 'cinema_vox_moe',         times: [todayAt(13,30), todayAt(16,30), todayAt(19,30), todayAt(22,15)], format: 'Standard' },
      { cinemaId: 'cinema_novo_ibnbattuta', times: [todayAt(14,0), todayAt(17,0), todayAt(20,30)],                format: 'Standard' },
    ],
  },
  {
    id: 'movie_the_bridge',
    title: 'The Bridge',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=80',
    genres: ['Thriller', 'Mystery'],
    rating: 7.7,
    certificate: 'PG-15',
    runtime: 119,
    status: 'now_showing',
    synopsis: 'A forensic architect is called to Dubai Creek to investigate the collapse of a pedestrian bridge — only to uncover a conspiracy that goes to the highest levels of the city\'s development boom. A tense procedural with a spectacular finale.',
    showtimes: [
      { cinemaId: 'cinema_reel_dubai_mall', times: [todayAt(14,0), todayAt(17,0), todayAt(20,30), todayAt(23,30)], format: 'Standard' },
      { cinemaId: 'cinema_vox_moe',         times: [todayAt(15,0), todayAt(18,30), todayAt(22,0)],                 format: 'VIP' },
    ],
  },
  {
    id: 'movie_sand_sea',
    title: 'Sand & Sea',
    poster: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    genres: ['Adventure', 'Action'],
    rating: 6.9,
    certificate: 'PG-13',
    runtime: 137,
    status: 'coming_soon',
    synopsis: 'An extreme adventurer attempts the first solo crossing of the Rub al Khali desert followed immediately by a solo swim of the Arabian Gulf. Coming October 2026.',
    showtimes: [],
  },
  {
    id: 'movie_the_collector',
    title: 'The Collector',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
    genres: ['Crime', 'Drama'],
    rating: 8.3,
    certificate: 'PG-15',
    runtime: 152,
    status: 'coming_soon',
    synopsis: 'A Louvre Abu Dhabi curator discovers a priceless stolen artifact hidden in a donation — and the trail leads to a decades-old heist that spans three continents. Coming November 2026.',
    showtimes: [],
  },
];

export function getCinemaById(id) {
  return CINEMAS.find(c => c.id === id);
}

export function getMoviesForCinema(cinemaId) {
  return FALLBACK_MOVIES.filter(m =>
    m.status === 'now_showing' && m.showtimes.some(s => s.cinemaId === cinemaId)
  );
}

export function getNearestShowtime(movie) {
  const now = new Date();
  for (const st of movie.showtimes) {
    for (const t of st.times) {
      if (new Date(t) > now) {
        const cinema = getCinemaById(st.cinemaId);
        const time = new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return { cinema: cinema?.name, venue: cinema?.venue, time, raw: t };
      }
    }
  }
  return null;
}

export function formatRuntime(min) {
  const h = Math.floor(min / 60); const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatShowtime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
