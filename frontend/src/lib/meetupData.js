/**
 * meetupData.js — Static seed data for Sports Meetups
 */

export const SPORT_ICONS = {
  volleyball: '🏐', football: '⚽', basketball: '🏀', padel: '🎾',
  running: '🏃', cycling: '🚴', tennis: '🎾', swimming: '🏊', other: '🏅',
};

export const SPORT_COLORS = {
  volleyball:  { bg: '#D4EFDF', text: '#1A6634' },
  football:    { bg: '#D6EAF8', text: '#1A4A7A' },
  basketball:  { bg: '#FFE8D6', text: '#8B3A0F' },
  padel:       { bg: '#F3E5F5', text: '#5B2C7A' },
  running:     { bg: '#FCF3CF', text: '#7A5A00' },
  cycling:     { bg: '#E8D5C4', text: '#5C3A1E' },
  tennis:      { bg: '#AEE8C5', text: '#0D5C35' },
  swimming:    { bg: '#B9E7F4', text: '#0A4A6A' },
  other:       { bg: '#E8DAEF', text: '#4A2C6A' },
};

export const SPORTS_LIST = ['volleyball','football','basketball','padel','running','cycling','tennis','swimming','other'];

function daysFromNow(n, hour, min = 0) {
  const d = new Date(); d.setDate(d.getDate() + n); d.setHours(hour, min, 0, 0); return d.toISOString();
}

export const FALLBACK_MEETUPS = [
  {
    id: 'meetup_volleyball_kite',
    sport: 'volleyball',
    title: 'Beach Volleyball — Kite Beach',
    placeId: 'fallback_kite_beach',
    placeName: 'Kite Beach',
    placeImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    city: 'Dubai',
    startsAt: daysFromNow(1, 17, 30),
    maxParticipants: 12,
    participants: [
      { id: 'u1', name: 'Ahmed', avatar: '🧑‍🦱', isHost: true },
      { id: 'u2', name: 'Sara',  avatar: '👩', isHost: false },
      { id: 'u3', name: 'Ravi',  avatar: '🧑', isHost: false },
      { id: 'u4', name: 'Layla', avatar: '👩‍🦰', isHost: false },
      { id: 'u5', name: 'Omar',  avatar: '🧔', isHost: false },
    ],
    description: 'Casual 4v4 beach volleyball, all skill levels welcome. We play till sunset then grab shawarma nearby. Bring water and sunscreen!',
    status: 'upcoming',
  },
  {
    id: 'meetup_football_mamzar',
    sport: 'football',
    title: '5-a-Side Football — Al Mamzar',
    placeId: 'fallback_mamzar_beach',
    placeName: 'Al Mamzar Beach Park',
    placeImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    city: 'Dubai',
    startsAt: daysFromNow(1, 19, 0),
    maxParticipants: 10,
    participants: [
      { id: 'u6',  name: 'Khalid',  avatar: '🧑‍🦲', isHost: true },
      { id: 'u7',  name: 'James',   avatar: '👨', isHost: false },
      { id: 'u8',  name: 'Priya',   avatar: '👩‍🦳', isHost: false },
      { id: 'u9',  name: 'Tariq',   avatar: '🧑‍🦱', isHost: false },
      { id: 'u10', name: 'Fatima',  avatar: '👩', isHost: false },
      { id: 'u11', name: 'Daniel',  avatar: '👨‍🦰', isHost: false },
      { id: 'u12', name: 'Noor',    avatar: '👩‍🦱', isHost: false },
    ],
    description: '5-a-side on the grass pitch, mix of nationalities and levels. We rotate every 15 mins so everyone plays. Just show up!',
    status: 'upcoming',
  },
  {
    id: 'meetup_padel_difc',
    sport: 'padel',
    title: 'Padel Doubles — DIFC',
    placeId: 'fallback_difc',
    placeName: 'DIFC Padel Club',
    placeImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
    city: 'Dubai',
    startsAt: daysFromNow(2, 8, 0),
    maxParticipants: 4,
    participants: [
      { id: 'u13', name: 'Yousuf', avatar: '🧔', isHost: true },
      { id: 'u14', name: 'Hana',   avatar: '👩‍🦰', isHost: false },
    ],
    description: 'Looking for 2 more for doubles padel — intermediate level. Court booked, just split the cost (AED 30/person). Bring your racket.',
    status: 'upcoming',
  },
  {
    id: 'meetup_running_creek',
    sport: 'running',
    title: 'Morning Run — Creek Harbour',
    placeId: 'fallback_creek_harbour',
    placeName: 'Dubai Creek Harbour',
    placeImage: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
    city: 'Dubai',
    startsAt: daysFromNow(1, 6, 0),
    maxParticipants: 20,
    participants: [
      { id: 'u15', name: 'Mei',    avatar: '👩', isHost: true },
      { id: 'u16', name: 'Carlos', avatar: '🧑‍🦱', isHost: false },
      { id: 'u17', name: 'Aisha',  avatar: '👩‍🦱', isHost: false },
      { id: 'u18', name: 'Ben',    avatar: '👨', isHost: false },
      { id: 'u19', name: 'Lina',   avatar: '👩‍🦳', isHost: false },
      { id: 'u20', name: 'Rami',   avatar: '🧑‍🦲', isHost: false },
      { id: 'u21', name: 'Julia',  avatar: '👩‍🦰', isHost: false },
      { id: 'u22', name: 'Saud',   avatar: '🧔', isHost: false },
    ],
    description: "Easy 5km social run along the waterfront at 6am before it gets hot. All paces welcome — we don't leave anyone behind. Coffee after!",
    status: 'upcoming',
  },
  {
    id: 'meetup_cycling_qudra',
    sport: 'cycling',
    title: 'Al Qudra Cycling Group',
    placeId: 'fallback_al_qudra',
    placeName: 'Al Qudra Lakes',
    placeImage: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80',
    city: 'Dubai',
    startsAt: daysFromNow(2, 5, 30),
    maxParticipants: 15,
    participants: [
      { id: 'u23', name: 'Hassan', avatar: '🧑‍🦱', isHost: true },
      { id: 'u24', name: 'Nadia',  avatar: '👩', isHost: false },
      { id: 'u25', name: 'Tom',    avatar: '👨‍🦰', isHost: false },
      { id: 'u26', name: 'Amira',  avatar: '👩‍🦲', isHost: false },
      { id: 'u27', name: 'Faris',  avatar: '🧔', isHost: false },
      { id: 'u28', name: 'Sophie', avatar: '👩‍🦱', isHost: false },
      { id: 'u29', name: 'Majid',  avatar: '🧑', isHost: false },
      { id: 'u30', name: 'Chloe',  avatar: '👩‍🦰', isHost: false },
      { id: 'u31', name: 'Eisa',   avatar: '🧑‍🦲', isHost: false },
      { id: 'u32', name: 'Mia',    avatar: '👩', isHost: false },
      { id: 'u33', name: 'Saif',   avatar: '🧑‍🦱', isHost: false },
    ],
    description: '50km ride around Al Qudra lakes starting at sunrise. Intermediate pace (~22km/h avg). Road bikes preferred. Bring 2L water minimum.',
    status: 'upcoming',
  },
  {
    id: 'meetup_basketball_citywalk',
    sport: 'basketball',
    title: '3-on-3 Basketball — City Walk',
    placeId: 'fallback_city_walk',
    placeName: 'City Walk',
    placeImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    city: 'Dubai',
    startsAt: daysFromNow(1, 20, 0),
    maxParticipants: 6,
    participants: [
      { id: 'u34', name: 'Marcus',  avatar: '🧑‍🦱', isHost: true },
      { id: 'u35', name: 'Bilal',   avatar: '🧔', isHost: false },
      { id: 'u36', name: 'Yasmin',  avatar: '👩‍🦱', isHost: false },
      { id: 'u37', name: 'Ryan',    avatar: '👨', isHost: false },
      { id: 'u38', name: 'Dalal',   avatar: '👩', isHost: false },
      { id: 'u39', name: 'Jerome',  avatar: '🧑‍🦲', isHost: false },
    ],
    description: 'Full house! Competitive 3v3, make runs until midnight. Court is well-lit, bring your A game.',
    status: 'upcoming',
  },
  {
    id: 'meetup_tennis_jumeirah',
    sport: 'tennis',
    title: 'Tennis Drills — JBR',
    placeId: 'fallback_jbr',
    placeName: 'JBR The Walk',
    placeImage: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
    city: 'Dubai',
    startsAt: daysFromNow(2, 16, 0),
    maxParticipants: 8,
    participants: [
      { id: 'u40', name: 'Leila',  avatar: '👩‍🦰', isHost: true },
      { id: 'u41', name: 'Ziad',   avatar: '🧑', isHost: false },
      { id: 'u42', name: 'Mona',   avatar: '👩‍🦱', isHost: false },
    ],
    description: 'Mixed-level tennis session — we warm up with drills then play points. Rackets available to borrow. Intermediate+ preferred.',
    status: 'upcoming',
  },
];

export function getMeetupsForPlace(placeId) {
  return FALLBACK_MEETUPS.filter(m => m.placeId === placeId && m.status !== 'past');
}

export function formatMeetupTime(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const tom = new Date(); tom.setDate(now.getDate() + 1);
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (d.toDateString() === now.toDateString()) return `Today · ${timeStr}`;
  if (d.toDateString() === tom.toDateString()) return `Tomorrow · ${timeStr}`;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` · ${timeStr}`;
}

export function getMeetupCapacity(meetup, extraJoined = false) {
  const count = meetup.participants.length + (extraJoined ? 1 : 0);
  const max = meetup.maxParticipants;
  return { count, max, isFull: count >= max, isPast: meetup.status === 'past' };
}
