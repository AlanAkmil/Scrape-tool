"use client";

import { useState } from "react";

const ATTR_OPTIONS = ["text", "href", "src", "html", "custom"];

export default function Home() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("list");
  const [engine, setEngine] = useState("auto");
  const [itemSelector, setItemSelector] = useState("");
  const [waitSelector, setWaitSelector] = useState("");
  const [fields, setFields] = useState([
    { name: "title", selector: "", attr: "text", customAttr: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function updateField(i, key, value) {
    const next = [...fields];
    next[i][key] = value;
    setFields(next);
  }

  function addField() {
    setFields([...fields, { name: "", selector: "", attr: "text", customAttr: "" }]);
  }

  function removeField(i) {
    setFields(fields.filter((_, idx) => idx !== i));
  }

  async function handleScrape() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        url,
        mode,
        engine,
        itemSelector,
        waitSelector,
        fields: fields.map((f) => ({
          name: f.name,
          selector: f.selector,
          attr: f.attr === "custom" ? f.customAttr : f.attr,
        })),
      };
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal scrape");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.results, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "scrape-result.json";
    link.click();
  }

  function copyJson() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.results, null, 2));
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Scraper Tool</h1>
      <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
        Static + dynamic (JS render) web scraper. Isi selector, jalanin.
      </p>

      <Section title="Target">
        <Input label="URL" value={url} onChange={setUrl} placeholder="https://example.com/list" />
        <Row>
          <Select label="Mode" value={mode} onChange={setMode} options={["list", "single"]} />
          <Select
            label="Engine"
            value={engine}
            onChange={setEngine}
            options={["auto", "static", "dynamic"]}
          />
        </Row>
        {mode === "list" && (
          <Input
            label="Item selector (CSS, tiap item dalam list)"
            value={itemSelector}
            onChange={setItemSelector}
            placeholder=".product-card"
          />
        )}
        {engine !== "static" && (
          <Input
            label="Wait selector (opsional, buat dynamic engine)"
            value={waitSelector}
            onChange={setWaitSelector}
            placeholder=".product-card"
          />
        )}
      </Section>

      <Section title="Fields">
        {fields.map((f, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              placeholder="nama field"
              value={f.name}
              onChange={(e) => updateField(i, "name", e.target.value)}
              style={{ ...inputStyle, flex: "1 1 100px" }}
            />
            <input
              placeholder="selector (relatif ke item)"
              value={f.selector}
              onChange={(e) => updateField(i, "selector", e.target.value)}
              style={{ ...inputStyle, flex: "2 1 160px" }}
            />
            <select
              value={f.attr}
              onChange={(e) => updateField(i, "attr", e.target.value)}
              style={{ ...inputStyle, flex: "1 1 90px" }}
            >
              {ATTR_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            {f.attr === "custom" && (
              <input
                placeholder="nama atribut"
                value={f.customAttr}
                onChange={(e) => updateField(i, "customAttr", e.target.value)}
                style={{ ...inputStyle, flex: "1 1 90px" }}
              />
            )}
            <button onClick={() => removeField(i)} style={removeBtn}>
              ✕
            </button>
          </div>
        ))}
        <button onClick={addField} style={addBtn}>
          + Tambah field
        </button>
      </Section>

      <button onClick={handleScrape} disabled={loading || !url} style={mainBtn}>
        {loading ? "Scraping..." : "Scrape sekarang"}
      </button>

      {error && (
        <p style={{ color: "#ff6b6b", marginTop: 12, fontSize: 13 }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#999" }}>
              engine: {result.engine} • {result.count} item
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyJson} style={smallBtn}>Copy</button>
              <button onClick={downloadJson} style={smallBtn}>Download</button>
            </div>
          </div>
          <pre
            style={{
              background: "#131320",
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              overflowX: "auto",
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {JSON.stringify(result.results, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 13, color: "#a78bfa", marginBottom: 10, letterSpacing: 0.5 }}>
        {title.toUpperCase()}
      </h2>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "flex", gap: 10 }}>{children}</div>;
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 10, flex: 1 }}>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 10, flex: 1 }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, color: "#999", marginBottom: 4 };

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "#15151f",
  border: "1px solid #2a2a3a",
  borderRadius: 6,
  padding: "8px 10px",
  color: "#e5e5e5",
  fontSize: 13,
};

const mainBtn = {
  width: "100%",
  padding: "12px",
  background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const addBtn = {
  background: "transparent",
  border: "1px dashed #4a4a5a",
  borderRadius: 6,
  padding: "6px 12px",
  color: "#a78bfa",
  fontSize: 12,
  cursor: "pointer",
};

const removeBtn = {
  background: "#2a1520",
  border: "1px solid #4a2030",
  borderRadius: 6,
  color: "#ff6b6b",
  width: 30,
  height: 34,
  cursor: "pointer",
};

const smallBtn = {
  background: "#1e1e2e",
  border: "1px solid #333",
  borderRadius: 6,
  padding: "4px 10px",
  color: "#e5e5e5",
  fontSize: 12,
  cursor: "pointer",
};
