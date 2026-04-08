// src/components/ValuationResult.jsx
import React from "react";
import styles from "./ValuationResult.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const TIER_COLORS = {
  Budget: "#64748b", Affordable: "#0ea5e9", "Mid-Market": "#10b981",
  Premium: "#f59e0b", Luxury: "#8b5cf6", "Ultra-Luxury": "#ec4899",
};

const ValuationResult = ({ result }) => {
  if (!result) return null;
  const { result: r } = result;
  if (!r) return null;

  const { estimated_value, confidence_interval, feature_impacts, market_position, model_accuracy } = r;
  const tierColor = TIER_COLORS[market_position?.tier] || "#10b981";

  // Compute bar widths relative to max impact
  const maxImpact = Math.max(...(feature_impacts || []).map((f) => Math.abs(f.impact)));

  return (
    <div className={styles.result}>
      {/* Hero price card */}
      <div className={styles.heroCard}>
        <div className={styles.heroLabel}>Estimated Market Value</div>
        <div className={styles.heroPrice}>{fmt(estimated_value)}</div>
        <div className={styles.heroBadge} style={{ background: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}>
          {market_position?.tier} · {market_position?.description}
        </div>

        <div className={styles.ciRow}>
          <div className={styles.ciItem}>
            <span className={styles.ciLabel}>Low Estimate</span>
            <span className={styles.ciVal}>{fmt(confidence_interval?.low)}</span>
          </div>
          <div className={styles.ciDivider} />
          <div className={styles.ciItem}>
            <span className={styles.ciLabel}>High Estimate</span>
            <span className={styles.ciVal}>{fmt(confidence_interval?.high)}</span>
          </div>
        </div>

        {model_accuracy && (
          <div className={styles.accuracy}>
            Model Accuracy (R²): {(model_accuracy * 100).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Feature impact breakdown */}
      {feature_impacts?.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>What's Driving the Value</h4>
          <div className={styles.impacts}>
            {feature_impacts.map((item, i) => {
              const isPos   = item.impact >= 0;
              const barPct  = (Math.abs(item.impact) / maxImpact) * 100;
              return (
                <div key={i} className={styles.impactRow}>
                  <span className={styles.impactLabel}>{item.feature}</span>
                  <div className={styles.impactBarWrap}>
                    <div
                      className={`${styles.impactBar} ${isPos ? styles.impactPos : styles.impactNeg}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className={`${styles.impactVal} ${isPos ? styles.pos : styles.neg}`}>
                    {isPos ? "+" : ""}{fmt(item.impact)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input summary */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Property Summary</h4>
        <div className={styles.summaryGrid}>
          {[
            ["Neighborhood",  result.input?.neighborhood?.replace(/_/g, " ")],
            ["Square Footage", `${result.input?.square_feet?.toLocaleString()} sqft`],
            ["Bedrooms",      result.input?.bedrooms],
            ["Bathrooms",     result.input?.bathrooms],
            ["Lot Size",      `${result.input?.lot_size?.toLocaleString()} sqft`],
            ["Age",           `${result.input?.age_years} yrs`],
            ["Garage Spaces", result.input?.garage_spaces],
            ["Walk Score",    result.input?.walk_score],
          ].map(([k, v]) => (
            <div key={k} className={styles.summaryItem}>
              <span className={styles.summaryKey}>{k}</span>
              <span className={styles.summaryVal}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        Analysis completed {new Date(result.timestamp).toLocaleTimeString()} ·
        Request #{result.requestId?.slice(0, 8)}
      </div>
    </div>
  );
};

export default ValuationResult;
