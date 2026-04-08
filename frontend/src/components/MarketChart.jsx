// src/components/MarketChart.jsx
import React, { useEffect, useRef } from "react";
import styles from "./MarketChart.module.css";

const fmt = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${(n / 1_000).toFixed(0)}K`;

const MarketChart = ({ trends = [], neighborhood }) => {
  const svgRef  = useRef(null);
  const WIDTH   = 560;
  const HEIGHT  = 220;
  const PAD     = { top: 20, right: 20, bottom: 40, left: 62 };

  const innerW = WIDTH  - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top  - PAD.bottom;

  useEffect(() => {
    if (!trends.length || !svgRef.current) return;
    const prices  = trends.map((d) => d.avg_price);
    const minP    = Math.min(...prices) * 0.96;
    const maxP    = Math.max(...prices) * 1.04;

    const xScale  = (i) => PAD.left + (i / (trends.length - 1)) * innerW;
    const yScale  = (p) => PAD.top  + innerH - ((p - minP) / (maxP - minP)) * innerH;

    // Build SVG path
    const pts   = trends.map((d, i) => ({ x: xScale(i), y: yScale(d.avg_price) }));
    const line  = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area  = `${line} L${pts[pts.length - 1].x},${(PAD.top + innerH).toFixed(1)} L${pts[0].x},${(PAD.top + innerH).toFixed(1)} Z`;

    const ns    = "http://www.w3.org/2000/svg";
    const svg   = svgRef.current;
    svg.innerHTML = "";

    // Defs (gradient)
    const defs  = document.createElementNS(ns, "defs");
    const grad  = document.createElementNS(ns, "linearGradient");
    grad.setAttribute("id", "areaGrad");
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "0"); grad.setAttribute("y2", "1");
    const stop1 = document.createElementNS(ns, "stop");
    stop1.setAttribute("offset", "0%"); stop1.setAttribute("stop-color", "#10b981"); stop1.setAttribute("stop-opacity", "0.25");
    const stop2 = document.createElementNS(ns, "stop");
    stop2.setAttribute("offset", "100%"); stop2.setAttribute("stop-color", "#10b981"); stop2.setAttribute("stop-opacity", "0.01");
    grad.append(stop1, stop2); defs.append(grad); svg.append(defs);

    // Grid lines (4 horizontal)
    for (let j = 0; j <= 4; j++) {
      const y = PAD.top + (j / 4) * innerH;
      const gl = document.createElementNS(ns, "line");
      gl.setAttribute("x1", PAD.left); gl.setAttribute("x2", PAD.left + innerW);
      gl.setAttribute("y1", y); gl.setAttribute("y2", y);
      gl.setAttribute("stroke", "rgba(255,255,255,0.06)"); gl.setAttribute("stroke-width", "1");
      svg.append(gl);
      // Y labels
      const price = maxP - (j / 4) * (maxP - minP);
      const yl = document.createElementNS(ns, "text");
      yl.setAttribute("x", PAD.left - 8); yl.setAttribute("y", y + 4);
      yl.setAttribute("text-anchor", "end"); yl.setAttribute("font-size", "10");
      yl.setAttribute("fill", "rgba(255,255,255,0.35)"); yl.setAttribute("font-family", "monospace");
      yl.textContent = fmt(price); svg.append(yl);
    }

    // Area fill
    const areaPath = document.createElementNS(ns, "path");
    areaPath.setAttribute("d", area); areaPath.setAttribute("fill", "url(#areaGrad)");
    svg.append(areaPath);

    // Line
    const linePath = document.createElementNS(ns, "path");
    linePath.setAttribute("d", line); linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", "#10b981"); linePath.setAttribute("stroke-width", "2.5");
    linePath.setAttribute("stroke-linejoin", "round");
    svg.append(linePath);

    // Points + X labels
    pts.forEach(({ x, y }, i) => {
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("cx", x); circle.setAttribute("cy", y);
      circle.setAttribute("r", "4"); circle.setAttribute("fill", "#10b981");
      circle.setAttribute("stroke", "#0f172a"); circle.setAttribute("stroke-width", "2");
      svg.append(circle);

      const xl = document.createElementNS(ns, "text");
      xl.setAttribute("x", x); xl.setAttribute("y", PAD.top + innerH + 22);
      xl.setAttribute("text-anchor", "middle"); xl.setAttribute("font-size", "10");
      xl.setAttribute("fill", "rgba(255,255,255,0.35)");
      xl.textContent = trends[i].month; svg.append(xl);
    });
  }, [trends]);

  return (
    <div className={styles.chart}>
      <div className={styles.header}>
        <h4 className={styles.title}>Price Trend</h4>
        {neighborhood && <span className={styles.nb}>{neighborhood.replace(/_/g, " ")}</span>}
      </div>
      <div className={styles.svgWrap}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className={styles.svg}
        />
      </div>
      {trends.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>12-Mo High</span>
            <span className={styles.statVal}>{fmt(Math.max(...trends.map((d) => d.avg_price)))}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>12-Mo Low</span>
            <span className={styles.statVal}>{fmt(Math.min(...trends.map((d) => d.avg_price)))}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Avg Volume</span>
            <span className={styles.statVal}>{Math.round(trends.reduce((s, d) => s + d.volume, 0) / trends.length)}/mo</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketChart;
