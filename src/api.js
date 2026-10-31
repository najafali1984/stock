const API = import.meta.env.VITE_API_URL;
export const isDemo = !API;

// ---- Demo mode: simulated data so the Vercel link "moves" without a backend ----
let demo = null;
const dayLabel = (i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); };
function seed() {
  const rows = [['Cotton Yarn (kg)',420,150,680],['Polyester Fabric (m)',310,200,350],['Reactive Dye (kg)',45,60,1900],
                ['Buttons (box)',260,80,450],['Zippers (box)',90,100,820],['Packaging Rolls',175,70,540]];
  return {
    products: rows.map(([name, qty, reorder_level, price], i) => ({ id: i + 1, name, qty, reorder_level, price })),
    sales: [38000, 52000, 41000, 63000, 47000, 58000, 36000].map((revenue, i) => ({ d: dayLabel(i), revenue })),
    today_sales: 36000,
  };
}
function tickDemo() {
  demo ??= seed();
  const p = demo.products[Math.floor(Math.random() * demo.products.length)];
  if (Math.random() < 0.12) p.qty += 150;                       // restock
  else {
    const sold = Math.min(p.qty, 3 + Math.floor(Math.random() * 18));
    p.qty -= sold;
    const money = sold * p.price;
    demo.today_sales += money;
    demo.sales[6].revenue += money;
  }
  return JSON.parse(JSON.stringify(demo));
}

export async function fetchData() {
  if (isDemo) return tickDemo();
  const r = await fetch(API, { cache: 'no-store' });
  if (!r.ok) throw new Error('API error ' + r.status);
  return r.json();
}
