
import { useEffect, useMemo, useRef, useState } from "react";

const PX = 3.49;
const FEE = 1;
const N = { "1D": 48, "1W": 56, "1M": 60, "1Y": 72 };
const eur = (n) => "€" + n.toFixed(2);

function gen(r) {
  let s = r.length * 7 + r.charCodeAt(1), v = 3.48, out = [];
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < N[r]; i++) {
    v += (rnd() - 0.5) * (r === "1Y" ? 0.14 : r === "1M" ? 0.07 : 0.04);
    v = Math.max(2.8, Math.min(4.2, v));
    out.push(v);
  }
  out[out.length - 1] = 3.48;
  return out;
}

function Icon({ d, extra }) {
  return (
    <svg viewBox="0 0 24 24" {...extra}>
      {d}
    </svg>
  );
}

export default function App() {
  const [open, setOpen] = useState(() => typeof window !== "undefined" ? window.innerWidth > 1180 : true);
  const [theme, setTheme] = useState(null); // null = system
  const [nav, setNav] = useState("Home");
  const [range, setRange] = useState("1W");
  const [series, setSeries] = useState(() => gen("1W"));
  const [op, setOp] = useState("Sell");
  const [orderType, setOrderType] = useState("Market"); // Market | Limit
  const [shares, setShares] = useState("1.1510791366");
  const [limitPrice, setLimitPrice] = useState("3.49");
  const [held, setHeld] = useState(1.1510791366);
  const [alertOn, setAlertOn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [summary, setSummary] = useState("");
  const [placedType, setPlacedType] = useState("market");
  const [toast, setToast] = useState("");
  const [tip, setTip] = useState({ show: false, left: 0, text: "" });
  const [checkKey, setCheckKey] = useState(0);
  const toastTimer = useRef(null);
  const svgRef = useRef(null);

  const showToast = (m) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme || "";
    if (!theme) delete document.documentElement.dataset.theme;
  }, [theme]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "[" && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) setOpen((o) => !o);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setSeries(gen(range)); }, [range]);

  const { lo, hi, pathD, chg, chgUp } = useMemo(() => {
    const lo = Math.min(...series) - 0.05;
    const hi = Math.max(...series) + 0.05;
    const W = 800, H = 230;
    const pts = series.map((v, i) => [ (i / (series.length - 1)) * W, H - ((v - lo) / (hi - lo)) * (H - 20) - 10 ]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
    const ch = (series[series.length - 1] / series[0] - 1) * 100;
    return { lo, hi, pathD: d, chg: ch, chgUp: ch >= 0 };
  }, [series]);

  const calc = useMemo(() => {
    const isLimit = orderType === "Limit";
    const px = isLimit ? parseFloat(limitPrice) || 0 : PX;
    const sh = parseFloat(shares) || 0;
    const amt = sh * px;
    const tot = op === "Sell" ? amt - FEE : amt + FEE;
    let err = "";
    if (sh <= 0) err = "Enter a number of shares.";
    else if (op === "Sell" && sh > held + 1e-9) err = "You hold " + held.toFixed(10) + " shares.";
    else if (tot <= 0) err = "Order amount must cover the €1.00 fee.";
    return { isLimit, px, sh, amt, tot: Math.max(tot, 0), err, disabled: !!err };
  }, [orderType, limitPrice, shares, op, held]);

  const onChartMove = (e) => {
    const svg = svgRef.current; if (!svg) return;
    const b = svg.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - b.left) / b.width));
    const i = Math.round(f * (series.length - 1));
    setTip({ show: true, left: f * b.width, text: eur(series[i]), frac: f });
  };

  const placeOrder = () => {
    if (calc.disabled) return;
    const newHeld = op === "Sell" ? Math.max(held - calc.sh, 0) : held + calc.sh;
    setHeld(newHeld);
    setSummary(`${op} ${calc.sh.toFixed(10).replace(/0+$/, "").replace(/\.$/, "")} BVB for ${eur(calc.tot)}`);
    setPlacedType(calc.isLimit ? "limit" : "market");
    setPlaced(true);
    setCheckKey((k) => k + 1);
    showToast("Order placed");
  };

  const toggleAlert = () => {
    const v = !alertOn; setAlertOn(v); showToast(v ? "Price alert on" : "Price alert off");
  };

  const navItems = [
    { label: "Home", path: "M5 11l7-6 7 6v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM9.500 14.500c1.500 1.200 3.500 1.200 5 0" },
    { label: "Activity", path: null },
    { label: "Shop", path: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" },
    { label: "Transfers", path: "M5 9h13l-3-3M19 15H6l3 3" },
    { label: "Learn", path: null },
  ];

  return (
    <>
      <div className={`app${open ? " open" : ""}`} id="app">
        <nav className="panel side" id="nav" aria-label="Main">
          <div className="logo"><svg viewBox="0 0 24 24"><path d="M5 11l7-6 7 6v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM9.500 14.500c1.500 1.200 3.500 1.200 5 0" /></svg></div>
          <button className={`press${nav === "Home" ? " on" : ""}`} aria-label="Home" title={open ? "" : "Home"} onClick={() => setNav("Home")}><svg viewBox="0 0 24 24"><path d="M5 11l7-6 7 6v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM9.500 14.500c1.500 1.200 3.500 1.200 5 0" /></svg><span className="lb">Home</span></button>
          <button className={`press${nav === "Activity" ? " on" : ""}`} aria-label="Activity" title={open ? "" : "Activity"} onClick={() => setNav("Activity")}><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" /><path d="M12 13l3-4M9 3h6" /></svg><span className="lb">Activity</span></button>
          <button className={`press${nav === "Shop" ? " on" : ""}`} aria-label="Shop" title={open ? "" : "Shop"} onClick={() => setNav("Shop")}><svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" /></svg><span className="lb">Shop</span></button>
          <button className={`press${nav === "Transfers" ? " on" : ""}`} aria-label="Transfers" title={open ? "" : "Transfers"} onClick={() => setNav("Transfers")}><svg viewBox="0 0 24 24"><path d="M5 9h13l-3-3M19 15H6l3 3" /></svg><span className="lb">Transfers</span></button>
          <button className={`press${nav === "Learn" ? " on" : ""}`} aria-label="Learn" title={open ? "" : "Learn"} onClick={() => setNav("Learn")}><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="12" rx="2" /><path d="M8 20h8M9 12l2-2 2 1 2-3" /></svg><span className="lb">Learn</span></button>
          <div className="sp"></div>
          <button className="press" id="col" aria-label={open ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={open} title={open ? "" : "Expand sidebar"} onClick={() => setOpen((o) => !o)}><svg viewBox="0 0 24 24"><path d="M13 6l6 6-6 6M5 6l6 6-6 6" /></svg><span className="lb" id="colt">{open ? "Collapse" : "Expand"}</span></button>
          <button className="press" id="theme" aria-label="Toggle theme" title={open ? "" : "Theme"} onClick={() => setTheme((t) => {
            const isDark = t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
            return isDark ? "light" : "dark";
          })}><svg viewBox="0 0 24 24"><path d="M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z" /></svg><span className="lb">Theme</span></button>
        </nav>

        <main className="panel">
          <div className="top">
            <button className="circle press" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg></button>
            <h1>Borussia Dortmund</h1>
            <label className="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.300-4.300" /></svg><input placeholder="Search" /></label>
            <button className={`circle press${alertOn ? " on" : ""}`} id="bell" aria-label="Price alert" onClick={toggleAlert}><svg viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.500 2h-15zM10 21h4" /></svg></button>
            <button className={`circle press${saved ? " on" : ""}`} id="mark" aria-label="Save" onClick={() => { const v = !saved; setSaved(v); showToast(v ? "Saved to watchlist" : "Removed from watchlist"); }}><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z" /></svg></button>
          </div>

          <div className="hero">
            <svg width="56" height="56" viewBox="0 0 64 64"><rect width="64" height="64" rx="20" fill="#FDE100" /><circle cx="32" cy="32" r="21" fill="#FDE100" stroke="#111" strokeWidth="3.5" /><text x="32" y="34" textAnchor="middle" fontFamily="Inter,Arial" fontWeight="800" fontSize="22" fill="#111">BVB</text><text x="32" y="46" textAnchor="middle" fontFamily="Inter,Arial" fontWeight="700" fontSize="9" fill="#111">09</text></svg>
            <div className="nm"><b>Borussia Dortmund</b><span>BVB</span></div>
            <div className="px"><b id="px">€3.48</b><span id="chg" className={chgUp ? "up" : ""}>{chgUp ? "↗ +" : "↘ "}{chg.toFixed(2)}%</span></div>
          </div>

          <div className="chart">
            <div className="hd"><b style={{ fontSize: 15, fontWeight: 600 }}>Price</b>
              <div className="seg" id="rng">{["1D", "1W", "1M", "1Y"].map((r) => (
                <button key={r} className={`press${range === r ? " on" : ""}`} data-r={r} onClick={() => setRange(r)}>{r}</button>
              ))}</div></div>
            <div className="plot" id="plot">
              <svg ref={svgRef} id="svg" viewBox="0 0 800 230" preserveAspectRatio="none" aria-label="Price chart"
                onPointerMove={onChartMove} onPointerLeave={() => setTip((t) => ({ ...t, show: false }))}>
                <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7B3DF5" stopOpacity=".28" /><stop offset="1" stopColor="#7B3DF5" stopOpacity="0" /></linearGradient></defs>
                <path d={`${pathD}L800 230L0 230Z`} fill="url(#ar)" />
                <path d={pathD} fill="none" stroke="#6D2EF2" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <line x1={tip.frac ? tip.frac * 800 : 0} x2={tip.frac ? tip.frac * 800 : 0} y1="0" y2="230" stroke="#6D2EF2" strokeDasharray="4 4" opacity={tip.show ? 1 : 0} vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="tipc" id="tipc" style={{ left: tip.left + "px", opacity: tip.show ? 1 : 0 }}>{tip.text}</div>
            </div>
          </div>

          <h2>Portfolio</h2>
          <div className="card pf">
            <div className="h"><span className="ico">📈</span>Invest Pocket</div>
            <div className="g">
              <span id="val">{eur(held * 3.48)}</span><span id="shares">{held.toFixed(10)}</span><span>€3.48</span>
              <small><span style={{ color: "var(--red)" }}>↘ 0.31%</span> 0.29%</small><small>Shares</small><small>Average price</small>
            </div>
          </div>

          <h2>Analyst price targets <button className="circle press" id="help" aria-label="About price targets" style={{ width: 36, height: 36 }} onClick={() => setShowNote((s) => !s)}><svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><circle cx="12" cy="12" r="9" /><path d="M9.800 9.500a2.300 2.300 0 1 1 3.200 2.100c-.7.400-1 .8-1 1.600M12 16.500v.1" /></svg></button></h2>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1.4fr" }}>
            <div className="card tile"><b style={{ color: "var(--brand)" }}>5.50 €</b>Average price target</div>
            <div className="card tile"><b style={{ color: "var(--green)" }}>58.73%</b>Potential % to reach target</div>
            <div className="card"><div style={{ fontSize: 12, color: "var(--muted)" }}>Analyst range</div>
              <div className="range"><div className="bars"><i style={{ flex: 1, background: "#9B6CF7", borderRadius: "6px 0 0 6px" }}></i><i style={{ flex: 1.2, background: "var(--brand2)", borderRadius: "0 6px 6px 0" }}></i></div><div className="rl"><span>Low 3.10</span><span>High 8.00</span></div></div></div>
          </div>
          <p className={`note${showNote ? " show" : ""}`} id="note">Analysts publish where they expect the price to land in 12 months. The average here is 5.50 €, about 58.73% above today’s price.</p>
        </main>

        <aside className="panel right">
          {!placed ? (
            <div id="form" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div className="seg2" id="side">
                <button className={`sell press${op === "Sell" ? " on" : ""}`} onClick={() => setOp("Sell")}>Sell</button>
                <button className={`buy press${op === "Buy" ? " on" : ""}`} onClick={() => setOp("Buy")}>Buy</button>
              </div>
              <div className="seg3" id="type">
                <button className={`press${orderType === "Market" ? " on" : ""}`} onClick={() => setOrderType("Market")}>Market</button>
                <button className={`press${orderType === "Limit" ? " on" : ""}`} onClick={() => setOrderType("Limit")}>Limit</button>
              </div>
              <div className="fld"><label htmlFor="sh">Shares <button className="max" id="max" onClick={() => setShares(held.toFixed(10))}>Max</button></label><input id="sh" inputMode="decimal" value={shares} onChange={(e) => setShares(e.target.value)} /></div>
              {orderType === "Limit" && (
                <div className="fld" id="lim"><label htmlFor="lp">Limit price (€)</label><input id="lp" inputMode="decimal" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} /></div>
              )}
              <div className="tbl">
                <div><span>Order Type</span><span id="t_type">{calc.isLimit ? "Limit Order" : "Market Order"}</span></div>
                <div><span>Operation</span><span id="t_op">{op}</span></div>
                <div><span>Price</span><span id="t_px">{eur(calc.px)}</span></div>
                <div><span>Order Amount</span><span id="t_amt">{eur(calc.amt)}</span></div>
                <div><span>Total Costs</span><span>€1.00</span></div>
                <div className="tot"><span>Total Amount</span><span id="t_tot">{eur(calc.tot)}</span></div>
              </div>
              <div className="err" id="err" role="alert">{calc.err}</div>
              <button className={`go press${op === "Buy" ? " buying" : ""}`} id="go" disabled={calc.disabled} style={{ opacity: calc.disabled ? 0.5 : 1 }} onClick={placeOrder}>Place {op.toLowerCase()} order</button>
            </div>
          ) : (
            <div className="done-v" id="doneV" style={{ display: "flex" }}>
              <div className="ok">
                <svg key={checkKey} className="check" id="check" viewBox="0 0 70 70"><defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5BDB6E" /><stop offset="1" stopColor="#1FAE3C" /></linearGradient></defs><circle cx="35" cy="35" r="34" fill="url(#gg)" /><path d="M19 36l11 11 21-24" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <h3>Your {placedType} order has been placed</h3>
                <p id="sum">{summary}</p>
                <button className="opt press"><span className="ic2" style={{ background: "linear-gradient(135deg,#FF7A45,#FFA13D)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.200 7.800L22 12l-7.800 2.200L12 22l-2.200-7.800L2 12l7.800-2.200z" /></svg></span><span className="t">Trade with lower fees<small>Upgrade your plan</small></span><svg className="ch" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg></button>
                <button className={`opt set press${alertOn ? " on" : ""}`} id="alert" onClick={toggleAlert}><span className="ic2"><svg className="b" width="19" height="19" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.500 2h-15zM10 21h4" /></svg></span><span className="t">Set a price alert<small id="alts">{alertOn ? "Alert is on" : "Be the first to act"}</small></span><svg className="ch" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg></button>
              </div>
              <button className="go press" id="done" onClick={() => { setPlaced(false); setShares(held.toFixed(10)); }}>Done</button>
            </div>
          )}
        </aside>
      </div>
      <div className={`toast${toast ? " show" : ""}`} id="toast" role="status">{toast}</div>
    </>
  );
}
