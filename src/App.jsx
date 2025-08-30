import { useEffect, useState } from "react";
import "./index.css";

const API = import.meta.env.VITE_API_BASE;

// En çok kullanılan 10 + TRY
const POPULAR_CODES = [
  "EUR", "JPY", "GBP", "AUD", "CAD",
  "CHF", "CNY", "HKD", "INR", "KRW",
  "TRY"
];

// Sembol + tam ad eşlemesi
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

export default function App() {
  const [latestUSD, setLatestUSD] = useState(null); // 1 USD bazlı latest
  const [base, setBase] = useState("USD");
  const [target, setTarget] = useState("TRY");
  const [amount, setAmount] = useState(100);
  const [convertResp, setConvertResp] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  // --- LATEST: 1 USD bazlı veriyi çek ---
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
  }, []); // sadece ilk açılışta

  // --- CONVERT ---
  const handleConvert = async () => {
    setError("");
    try {
      const r = await fetch(
        `${API}/api/currency/convert?base=${base}&target=${target}&amount=${amount}`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setConvertResp(await r.json());
    } catch (e) {
      setError(String(e));
    }
  };

  // --- HISTORY ---
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

  return (
    <div className="page">
      <div className="card">
        <h1>Currency UI</h1>

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
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Amount"
          />
          <button onClick={handleConvert}>Convert</button>
        </div>

        {error && <div className="error">Hata: {error}</div>}

        {/* CONVERT RESULT TABLE */}
        {convertResp && (
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
                  <td>{convertResp.base}</td>
                  <td>{convertResp.target}</td>
                  <td>{convertResp.amount}</td>
                  <td>{convertResp.converted}</td>
                </tr>
              </tbody>
            </table>
            <hr />
          </>
        )}

        <div className="row">
          <button onClick={handleHistory}>Load History</button>
        </div>

        {/* HISTORY TABLE */}
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
                    <td>{h.converted}</td>
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
