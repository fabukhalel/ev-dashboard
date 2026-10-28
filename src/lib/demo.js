import { uid } from './storage.js';
import { ymd } from './format.js';

// مولّد بيانات تجريبية ثابتة (seeded) لمعاينة التطبيق
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n) => String(n).padStart(2, '0');

export function makeDemoCharges(capacity = 60.48, prices = {}, today = new Date()) {
  const homePrice = prices.homePrice ?? 0.1;
  const fastPrice = prices.fastPrice ?? 0.25;
  const rand = rng(7);
  const out = [];
  const kwhPerKm = 0.158;
  let odo = 18250;
  let prevAfter = null;
  let offset = -148;

  while (offset <= -1) {
    const type = rand() < 0.72 ? 'home' : 'fast';
    const before = Math.round(15 + rand() * 25);
    if (prevAfter != null) {
      const consumedKwh = ((prevAfter - before) / 100) * capacity;
      odo += Math.round(consumedKwh / (kwhPerKm * (0.92 + rand() * 0.2)));
    }
    const after = type === 'home' ? Math.round(80 + rand() * 20) : Math.round(70 + rand() * 12);
    const energy = ((after - before) / 100) * capacity;
    const price = type === 'home' ? homePrice : fastPrice;
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const hour = type === 'home' ? 21 + Math.floor(rand() * 3) : 12 + Math.floor(rand() * 5);

    out.push({
      id: uid(),
      date: ymd(d),
      time: `${pad(hour)}:${pad(Math.floor(rand() * 60))}`,
      socBefore: before,
      socAfter: after,
      energyKwh: Number(energy.toFixed(3)),
      energyManual: false,
      capacity,
      pricePerKwh: price,
      totalCost: Number((energy * price).toFixed(3)),
      type,
      odometer: odo,
      note: '',
      createdAt: d.getTime(),
    });
    prevAfter = after;
    offset += 2 + Math.floor(rand() * 4);
  }
  return out;
}
