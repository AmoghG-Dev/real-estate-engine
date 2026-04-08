// src/App.jsx
import React, { useState, useEffect } from "react";
import PropertyForm       from "./components/PropertyForm";
import ValuationResult    from "./components/ValuationResult";
import MarketChart        from "./components/MarketChart";
import ComparablesList    from "./components/ComparablesList";
import { useValuation }   from "./hooks/useValuation";
import { useMarket }      from "./hooks/useMarket";
import { api }            from "./services/api";
import "./styles/global.css";
import styles             from "./styles/App.module.css";

const TABS = ["Valuation", "Market", "Comparables"];

const App = () => {
  const [activeTab, setActiveTab] = useState("Valuation");
  const { form, result, loading, error, updateField, submit, reset } = useValuation();
  const { trends, featureImportance, fetchTrends, fetchComparables } = useMarket();
  const [comparables, setComparables]   = useState([]);
  const [nbFilter,    setNbFilter]      = useState("Midtown");

  // When a valuation result arrives, auto-fetch comps
  useEffect(() => {
    if (result?.result?.estimated_value) {
      const nb = form.neighborhood;
      fetchComparables(nb, result.result.estimated_value).then(() => {});
      api.getComparables(nb, result.result.estimated_value)
        .then((d) => setComparables(d.comparables || []));
      fetchTrends(nb);
    }
  }, [result]);

  const handleSubmit = async () => {
    await submit();
    setActiveTab("Valuation");
  };

  const topFeatures = Object.entries(featureImportance)
    .slice(0, 5)
    .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v }));

  return (
    <div className={styles.app}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <div>
            <div className={styles.logoName}>EstateIQ</div>
            <div className={styles.logoSub}>Valuation Engine</div>
          </div>
        </div>

        <PropertyForm
          form={form}
          loading={loading}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
          onReset={reset}
        />
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.tabs}>
            {TABS.map((t) => (
              <button
                key={t}
                className={`${styles.tab} ${activeTab === t ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
                {t === "Valuation" && result && <span className={styles.dot} />}
              </button>
            ))}
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>Live Engine</span>
          </div>
        </div>

        <div className={styles.content}>
          {/* Error banner */}
          {error && (
            <div className={styles.errorBanner}>
              ⚠ {error}
            </div>
          )}

          {/* ── Valuation Tab ── */}
          {activeTab === "Valuation" && (
            <div className={styles.valuationTab}>
              {!result && !loading && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🏡</div>
                  <h2 className={styles.emptyTitle}>Property Valuation</h2>
                  <p className={styles.emptyText}>
                    Configure property attributes on the left panel and click
                    <strong> Get Valuation</strong> to receive an AI-powered market estimate.
                  </p>
                  <div className={styles.emptyBadges}>
                    <span>Linear Regression Model</span>
                    <span>Scikit-learn</span>
                    <span>5,000 Training Samples</span>
                  </div>
                </div>
              )}
              {loading && (
                <div className={styles.loadingState}>
                  <div className={styles.loadingPulse} />
                  <p>Running valuation model…</p>
                </div>
              )}
              {result && !loading && (
                <ValuationResult result={result} />
              )}
            </div>
          )}

          {/* ── Market Tab ── */}
          {activeTab === "Market" && (
            <div className={styles.marketTab}>
              <div className={styles.marketHeader}>
                <h2 className={styles.marketTitle}>Market Overview</h2>
                <select
                  className={styles.nbSelect}
                  value={nbFilter}
                  onChange={(e) => { setNbFilter(e.target.value); fetchTrends(e.target.value); }}
                >
                  {["Downtown","Midtown","Suburbs_North","Suburbs_South",
                    "East_Side","West_End","Historic","Industrial"].map((n) => (
                    <option key={n} value={n}>{n.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <MarketChart trends={trends} neighborhood={nbFilter} />

              {topFeatures.length > 0 && (
                <div className={styles.importanceCard}>
                  <h4 className={styles.importanceTitle}>Top Price Drivers</h4>
                  <div className={styles.importanceList}>
                    {topFeatures.map(({ label, value }, i) => (
                      <div key={i} className={styles.importanceItem}>
                        <span className={styles.impRank}>#{i + 1}</span>
                        <span className={styles.impLabel}>{label}</span>
                        <span className={styles.impCoef}>{value > 0 ? "+" : ""}{value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Comparables Tab ── */}
          {activeTab === "Comparables" && (
            <div className={styles.comparablesTab}>
              {comparables.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <h2 className={styles.emptyTitle}>No Comparables Yet</h2>
                  <p className={styles.emptyText}>
                    Run a valuation first to automatically load comparable
                    properties from the same neighborhood.
                  </p>
                </div>
              ) : (
                <ComparablesList
                  comparables={comparables}
                  subjectPrice={result?.result?.estimated_value}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
