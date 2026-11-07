// The reception run of show. Kevin's timeline, 2026-11-07.
//
// Times are local clock times on the day. `at` is 24-hour "HH:MM" so it
// sorts and parses; the page prints it as "4:30".
//
// Only what Kevin gave is in here. Don't invent cues, songs or durations —
// the gaps between blocks are worked out by the page, not stored.

export const EVENT = {
  name: 'Reception',
  kicker: 'Run of show',
  // The page shows the live "now" bar only inside this window.
  opens: '16:30',
  closes: '21:00',
};

export const BLOCKS = [
  {
    at: '16:30',
    name: 'Cocktail hour',
  },
  {
    at: '17:15',
    name: 'Bridal party arrives',
  },
  {
    at: '17:30',
    name: 'Hot potato',
  },
  {
    at: '17:45',
    name: 'Buffet',
  },
  {
    at: '18:30',
    name: 'Shoe game',
  },
  {
    at: '18:45',
    name: 'Speeches, first dance, dance party',
    // One run, no gaps: each step hands straight to the next.
    runsOn: 'No break between these — each one leads into the next.',
    steps: [
      { name: 'Raquel & Trevor — speech' },
      { name: 'Ada & Kevin — speech', cue: 'Into the video montage' },
      { name: 'Video montage' },
      { name: 'First dance', cue: 'Directly out of the montage' },
      { name: '“El Viejo y la Vieja”', cue: 'Leads into the dance party' },
      { name: 'Dance party' },
    ],
  },
  {
    at: '20:00',
    name: 'Cake',
  },
];

// "17:15" → 1035 (minutes since midnight).
export function mins(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// 1035 → "5:15"
export function clock(m) {
  const h = Math.floor(m / 60) % 24;
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')}`;
}

// "45 min" / "1 hr 15 min"
export function length(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}
