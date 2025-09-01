import { useEffect, useMemo, useState } from "react";
import "./index.css";

const API = import.meta.env.VITE_API_BASE;
const PHOTO_URL = import.meta.env.VITE_PHOTO_URL || "/photo.jpg"; // public/photo.jpg

// En çok kullanılan 10 + TRY
const POPULAR_CODES = [
  "EUR", "JPY", "GBP", "AUD", "CAD",
  "CHF", "CNY", "HKD", "INR", "KRW",
  "TRY"
];

// Sembol + tam ad
const CURRENCY_META = {
  USD: { symbol: "$",  name: "Amerikan Doları" },
  EUR: { symbol: "€",  name: "Euro" },
  JPY: { symbol: "¥",  name: "Japon Yeni" },
  GBP: { symbol: "£",  name: "İngiliz Sterlini" },
  AUD: { symbol: "$",  name: "Avustralya Doları" },
  CAD: { symbol: "$",  name: "Kanada Doları" },
  CHF: { symbol: "CHF",name: "İsviçre Frangı" },
  CNY: { symbol: "¥",  name: "Çin Yuanı" },
  HKD: { symbol: "$",  name: "Hong Kong Doları" },
  INR: { symbol: "₹",  name: "Hindistan Rupisi" },
  KRW: { symbol: "₩",  name: "Güney Kore Wonu" },
  TRY: { symbol: "₺",  name: "Türk Lirası" }
};

// 2 basamak formatter
const fmt2 = (x) =>
  x === null || x === undefined || x === "" || Number.isNaN(Number(x))
    ? ""
    : Number(x).toFixed(2);

// Basit tarih formatı
const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

export default function App() {
  const [latestUSD, setLatestUSD] = useState(null); // 1 USD bazlı latest
  const [base, setBase] = useState("USD");
  const [target, setTarget] = useState("TRY");
  const [amount, setAmount] = useState("100");      // string tut
  const [convertResp, setConvertResp] = useState(null);
  const [convertSnap, setConvertSnap] = useState(null); // Convert snapshot
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [showPhoto, setShowPhoto] = useState(false);   // Foto overlay

  // Grafik görünürlüğü
  const [showChart, setShowChart] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  // LATEST (1 USD bazlı)
  useEffect(() => {
    setError("");
    setLatestUSD(null);
    fetch(`${API}/api/currency/latest/USD`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setLatestUSD)
      .catch((e) => setError(e.message));
  }, []);

  // amount giriş kontrolü
  const handleAmountChange = (e) => {
    const v = e.target.value;
    if (v === "" || /^[0-9.,]+$/.test(v)) {
      setAmount(v);
    }
  };

  const handleConvert = async () => {
    setError("");
    try {
      const amountNum = parseFloat((amount || "0").replace(",", "."));
      const r = await fetch(
        `${API}/api/currency/convert?base=${base}&target=${target}&amount=${amountNum}`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setConvertResp(data);
      setConvertSnap({ base, target, amount, converted: data.converted });
    } catch (e) {
      setError(String(e));
    }
  };

    const handleHistory = async () => {
    setError("");
    try {
      const r = await fetch(
        `${API}/api/currency/history?base=${base}&target=${target}&limit=10`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setHistory((await r.json()) || []);
    } catch (e) {
      setError(String(e));
    }
  };


  // Grafik butonuna basınca, history boşsa otomatik getir
    const handleShowChart = async () => {
    if (showChart) { setShowChart(false); return; }
    if (!history || history.length === 0) {
      setChartLoading(true);
      try {
        const r = await fetch(
          `${API}/api/currency/history?base=${base}&target=${target}&days=30`
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setHistory((await r.json()) || []);
      } catch (e) {
        setError(String(e));
      } finally {
        setChartLoading(false);
      }
    }
    setShowChart(true);
  };


  // POPULAR + TRY filtrelenmiş latest satırları
  const latestRows = latestUSD?.rates
    ? POPULAR_CODES
        .filter((code) => latestUSD.rates[code] != null)
        .map((code) => ({
          code,
          rate: latestUSD.rates[code],
          symbol: CURRENCY_META[code]?.symbol ?? "",
          name: CURRENCY_META[code]?.name ?? code
        }))
    : [];

  // --- Chart verisi (rate vs time) ---
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    // createdAt artan sıraya
    const sorted = [...history].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    return sorted
      .filter((x) => x.rate != null && !Number.isNaN(Number(x.rate)))
      .map((x) => ({
        t: new Date(x.createdAt),
        v: Number(x.rate)
      }));
  }, [history]);

  return (
    <div className="page">
      {/* Fotoğraf overlay */}
      {showPhoto && (
        <div className="photo-overlay" onClick={() => setShowPhoto(false)}>
          <img
            className="photo-img"
            src={PHOTO_URL}
            alt="Yüklenen fotoğraf"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="photo-close" onClick={() => setShowPhoto(false)}>
            ×
          </button>
        </div>
      )}

      <div className="card">
        {/* Başlık + sağda butonlar */}
        <div className="topbar">
          <h1>Currency</h1>
          <div className="top-actions">
            <button className="photo-btn" onClick={() => setShowPhoto(true)}>
              📷 Fotoğraf
            </button>
            <button className="photo-btn" onClick={handleShowChart}>
              📈 {showChart ? "Grafiği Gizle" : "Grafiği Göster"}
            </button>
          </div>
        </div>

        <div className="row">
          <input
            value={base}
            onChange={(e) => setBase(e.target.value.toUpperCase())}
            placeholder="Base (USD)"
          />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value.toUpperCase())}
            placeholder="Target (TRY)"
          />
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Amount"
          />
          <button onClick={handleConvert}>Convert</button>
        </div>

        {error && <div className="error">Hata: {error}</div>}

        {/* Dönüşüm Sonucu */}
        {convertSnap && (
          <>
            <h3>Dönüşüm Sonucu</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Base</th>
                  <th>Target</th>
                  <th>Amount</th>
                  <th>Converted</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{convertSnap.base}</td>
                  <td>{convertSnap.target}</td>
                  <td>{convertSnap.amount}</td>
                  <td>{fmt2(convertSnap.converted)}</td>
                </tr>
              </tbody>
            </table>
            <hr />
          </>
        )}

        {/* History yükleme butonu */}
        <div className="row">
          <button onClick={handleHistory}>Load History</button>
        </div>

        {/* GRAFİK */}
        {showChart && (
          <div className="chart-card">
            <h3>
              {base} → {target} Kur (Zaman)
            </h3>
            {chartLoading && <div className="pre">Grafik için veri yükleniyor…</div>}
            {!chartLoading && chartData.length === 0 && (
              <div className="pre">Grafik için yeterli veri yok.</div>
            )}
            {!chartLoading && chartData.length > 0 && (
              <LineChart data={chartData} />
            )}
          </div>
        )}

        {/* History Tablosu */}
        {history?.length > 0 && (
          <>
            <h3>Son Kayıtlar</h3>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Base</th>
                    <th>Target</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Converted</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td>{h.baseCode}</td>
                      <td>{h.targetCode}</td>
                      <td>{h.rate}</td>
                      <td>{h.amount}</td>
                      <td>{fmt2(h.converted)}</td>
                      <td title={h.createdAt}>{fmtDate(h.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <hr />
          </>
        )}

        {/* Latest */}
        <h3>Latest (1 USD bazlı)</h3>
        <div className="info">
          Aşağıda en çok kullanılan 10 para birimi ile Türk Lirası için,
          <strong> 1&nbsp;ABD Doları’nın karşılık geldiği değerler</strong> listelenmiştir.
        </div>

        {!latestUSD && !error && <div className="pre">Loading...</div>}
        {latestRows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Para Birimi</th>
                <th>Değer (1 USD)</th>
              </tr>
            </thead>
            <tbody>
              {latestRows.map(({ code, rate, symbol, name }) => (
                <tr key={code}>
                  <td>
                    {symbol} {code} — {name}
                  </td>
                  <td>{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ----------------- Basit SVG Line Chart bileşeni ----------------- */
function LineChart({ data }) {
  // Boyutlar
  const W = 800;  // viewBox genişliği
  const H = 300;  // viewBox yüksekliği
  const P = 32;   // padding

  const times = data.map((d) => d.t.getTime());
  const values = data.map((d) => d.v);

  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);

  // Tek noktada düz çizgi yerine nokta gösterelim
  const spanT = tMax - tMin || 1;
  const spanV = vMax - vMin || 1;

  const sx = (t) => P + ((t - tMin) / spanT) * (W - 2 * P);
  const sy = (v) => H - P - ((v - vMin) / spanV) * (H - 2 * P);

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${sx(d.t.getTime())} ${sy(d.v)}`)
    .join(" ");

  // X eksenine 3 etiket (baş-orta-son)
  const xTicks = [
    new Date(tMin),
    new Date(tMin + spanT / 2),
    new Date(tMax),
  ];

  // Y eksenine 3 etiket (min-orta-max)
  const yTicks = [vMin, vMin + spanV / 2, vMax];

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg">
        {/* Axes */}
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} className="axis" />
        <line x1={P} y1={P} x2={P} y2={H - P} className="axis" />

        {/* Grid (y) */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={P}
              y1={sy(v)}
              x2={W - P}
              y2={sy(v)}
              className="grid"
            />
            <text x={8} y={sy(v) + 4} className="tick">
              {fmt2(v)}
            </text>
          </g>
        ))}

        {/* Grid (x) */}
        {xTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={sx(t.getTime())}
              y1={P}
              x2={sx(t.getTime())}
              y2={H - P}
              className="grid"
            />
            <text x={sx(t.getTime()) - 32} y={H - 6} className="tick">
              {t.toLocaleDateString()}
            </text>
          </g>
        ))}

        {/* Line */}
        <path d={path} className="line" fill="none" />

        {/* Points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={sx(d.t.getTime())}
            cy={sy(d.v)}
            r="2.5"
            className="dot"
          />
        ))}
      </svg>
    </div>
  );
}
