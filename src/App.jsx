console.log("API BASE =", API);
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE; // .env'den gelir

export default function App() {
  const [latest, setLatest] = useState(null);
  const [base, setBase] = useState("USD");
  const [target, setTarget] = useState("TRY");
  const [amount, setAmount] = useState(100);
  const [convertResp, setConvertResp] = useState(null);
  const [history, setHistory] = useState([]);

  // Uygulama açılınca son kurları çek
  useEffect(() => {
    fetch(`${API}/api/currency/latest?base=${base}`)
      .then(r => r.json())
      .then(setLatest)
      .catch(console.error);
  }, [base]);

  const handleConvert = async () => {
    const res = await fetch(
      `${API}/api/currency/convert?base=${base}&target=${target}&amount=${amount}`
    );
    const data = await res.json();
    setConvertResp(data);
  };

  const handleHistory = async () => {
    const res = await fetch(
      `${API}/api/currency/history?base=${base}&target=${target}`
    );
    const data = await res.json();
    setHistory(data || []);
  };

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 24, maxWidth: 720 }}>
      <h1>Currency UI</h1>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr auto" }}>
        <input value={base} onChange={e => setBase(e.target.value)} placeholder="Base (USD)" />
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target (TRY)" />
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          placeholder="Amount"
        />
        <button onClick={handleConvert}>Convert</button>
      </div>

      {convertResp && (
        <div style={{ marginTop: 12 }}>
          <strong>Convert Result:</strong>
          <pre>{JSON.stringify(convertResp, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={handleHistory}>Load History</button>
        {history?.length > 0 && (
          <pre style={{ marginTop: 12 }}>
            {JSON.stringify(history, null, 2)}
          </pre>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <strong>Latest ({base}):</strong>
        <pre>{latest ? JSON.stringify(latest, null, 2) : "Loading..."}</pre>
      </div>
    </div>
  );
}
