import { useEffect, useState } from "react";
import "./index.css";

const API = import.meta.env.VITE_API_BASE;

export default function App() {
  const [latest, setLatest] = useState(null);
  const [base, setBase] = useState("USD");
  const [target, setTarget] = useState("TRY");
  const [amount, setAmount] = useState(100);
  const [convertResp, setConvertResp] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  // sayfa açılır açılmaz son kurları çek
  useEffect(() => {
    setError("");
    fetch(`${API}/api/currency/latest?base=${base}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setLatest)
      .catch((e) => setError(e.message));
  }, [base]);

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

        {convertResp && (
          <>
            <h3>Dönüşüm Sonucu</h3>
            <pre className="pre">{JSON.stringify(convertResp, null, 2)}</pre>
            <hr />
          </>
        )}

        <div className="row">
          <button onClick={handleHistory}>Load History</button>
        </div>

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

        <h3>Latest ({base})</h3>
        <pre className="pre">
          {latest ? JSON.stringify(latest, null, 2) : "Loading..."}
        </pre>
      </div>
    </div>
  );
}
