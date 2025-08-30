import { useEffect, useState } from "react";
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

export default function App() {
  const [latestUSD, setLatestUSD] = useState(null); // 1 USD bazlı latest
  const [base, setBase] = useState("USD");
  const [target, setTarget] = useState("TRY");
  const [amount, setAmount] = useState("100"); // string tut
  const [convertResp, setConvertResp] = useState(null);
  const [convertSnap, setConvertSnap] = useState(null); // Convert snapshot
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [showPhoto, setShowPhoto] = useState(false);   // FOTO overlay

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
        `${API}/api/currency/history?base=${base}&target=${target}`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setHistory((await r.json()) || []);
    } catch (e) {
      setError(String(e));
    }
  };

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

  return (
    <div className="page">
      {/* Sağ üstte foto butonu */}
      <button
        className="photo-btn"
        onClick={() => setShowPhoto(true)}
        title="Fotoğrafı göster"
      >
        Fotoğraf
      </button>

      {/* Foto overlay */}
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
        <h1>Currency</h1>

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

        {/* DÖNÜŞÜM SONUCU (snapshot) */}
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

        <div className="row">
          <button onClick={handleHistory}>Load History</button>
        </div>

        {/* HISTORY */}
        {history?.length > 0 && (
          <>
            <h3>Son Kayıtlar</h3>
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
                    <td>{h.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr />
          </>
        )}

        {/* LATEST (1 USD bazlı) */}
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
