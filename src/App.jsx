import { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { fetchData, isDemo } from './api.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);
ChartJS.defaults.color = '#5b7194';
ChartJS.defaults.borderColor = '#e6eefc';

const POLL_MS = 3000;
const rs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK');

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(null);
  const prev = useRef({});
  const [changed, setChanged] = useState({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const d = await fetchData();
        if (!alive) return;
        const diff = {};
        d.products.forEach((p) => { const o = prev.current[p.id]; if (o !== undefined && o !== p.qty) diff[p.id] = p.qty > o ? 'up' : 'down'; prev.current[p.id] = p.qty; });
        setChanged(diff); setData(d); setError(''); setUpdated(new Date());
        setTimeout(() => alive && setChanged({}), 1200);
      } catch (e) { if (alive) setError('Cannot reach API. Is XAMPP (Apache + MySQL) running?'); }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!data) return <div className="center">{error || 'Loading…'}</div>;

  const { products, sales, today_sales } = data;
  const low = products.filter((p) => p.qty <= p.reorder_level);
  const stockValue = products.reduce((s, p) => s + p.qty * p.price, 0);

  return (
    <div className="wrap">
      <header>
        <h1>Factory Stock Dashboard</h1>
        <span className={'live ' + (error ? 'off' : '')}>● {error ? 'Offline' : 'LIVE'} {isDemo && '· demo data'} {updated && <small>{updated.toLocaleTimeString()}</small>}</span>
      </header>

      {error && <div className="alert">{error}</div>}
      {low.length > 0 && (
        <div className="alert">⚠ Low stock: {low.map((p) => `${p.name} (${p.qty})`).join(', ')}</div>
      )}

      <section className="kpis">
        <div className="card"><span>Products</span><b>{products.length}</b></div>
        <div className="card"><span>Stock value</span><b>{rs(stockValue)}</b></div>
        <div className="card"><span>Today's sales</span><b>{rs(today_sales)}</b></div>
        <div className={'card ' + (low.length ? 'bad' : '')}><span>Low-stock items</span><b>{low.length}</b></div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Stock vs reorder level</h3>
          <Bar
            data={{
              labels: products.map((p) => p.name),
              datasets: [
                { label: 'In stock', data: products.map((p) => p.qty), backgroundColor: products.map((p) => (p.qty <= p.reorder_level ? '#ef4444' : '#2563eb')) },
                { label: 'Reorder level', data: products.map((p) => p.reorder_level), backgroundColor: '#93c5fd' },
              ],
            }}
            options={{ responsive: true, animation: { duration: 400 } }}
          />
        </div>
        <div className="card">
          <h3>Sales, last 7 days</h3>
          <Line
            data={{
              labels: sales.map((s) => s.d.slice(5)),
              datasets: [{ label: 'Revenue (Rs)', data: sales.map((s) => +s.revenue), borderColor: '#16a34a', backgroundColor: 'rgba(34,197,94,.2)', pointBackgroundColor: '#16a34a', fill: true, tension: 0.35 }],
            }}
            options={{ responsive: true, animation: { duration: 400 } }}
          />
        </div>
      </section>

      <div className="card">
        <h3>Inventory</h3>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Reorder at</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={changed[p.id] ? 'flash-' + changed[p.id] : ''}>
                <td>{p.name}</td><td>{p.qty}</td><td>{p.reorder_level}</td><td>{rs(p.price)}</td>
                <td>{p.qty <= p.reorder_level ? <span className="tag red">Reorder</span> : <span className="tag green">OK</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
