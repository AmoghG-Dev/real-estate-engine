// src/components/ComparablesList.jsx
import React from "react";
import styles from "./ComparablesList.module.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const ComparablesList = ({ comparables = [], subjectPrice }) => {
  if (!comparables.length) return null;

  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <h4 className={styles.title}>Comparable Sales</h4>
        <span className={styles.count}>{comparables.length} comps</span>
      </div>
      <div className={styles.items}>
        {comparables.map((comp, i) => {
          const diff      = comp.price - (subjectPrice || comp.price);
          const diffPct   = subjectPrice ? ((diff / subjectPrice) * 100).toFixed(1) : null;
          const isHigher  = diff >= 0;

          return (
            <div key={i} className={styles.item}>
              <div className={styles.itemLeft}>
                <div className={styles.address}>{comp.address}</div>
                <div className={styles.details}>
                  {comp.sqft?.toLocaleString()} sqft · {comp.bedrooms} bd ·
                  <span className={styles.dom}> {comp.days_on_market}d on market</span>
                </div>
              </div>
              <div className={styles.itemRight}>
                <div className={styles.compPrice}>{fmt(comp.price)}</div>
                {diffPct && (
                  <div className={`${styles.diff} ${isHigher ? styles.higher : styles.lower}`}>
                    {isHigher ? "▲" : "▼"} {Math.abs(diffPct)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComparablesList;
