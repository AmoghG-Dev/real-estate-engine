// src/components/PropertyForm.jsx
import React from "react";
import styles from "./PropertyForm.module.css";

const NEIGHBORHOODS = [
  "Downtown","Midtown","Suburbs_North","Suburbs_South",
  "East_Side","West_End","Historic","Industrial",
];

const SliderField = ({ label, name, min, max, step = 1, value, unit = "", onChange }) => (
  <div className={styles.field}>
    <div className={styles.fieldHeader}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}{unit}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      className={styles.slider}
      onChange={(e) => onChange(name, step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
    />
    <div className={styles.rangeLabels}><span>{min}{unit}</span><span>{max}{unit}</span></div>
  </div>
);

const ToggleField = ({ label, name, value, onChange }) => (
  <div className={styles.toggleField}>
    <span className={styles.toggleLabel}>{label}</span>
    <button
      className={`${styles.toggle} ${value ? styles.toggleOn : ""}`}
      onClick={() => onChange(name, value ? 0 : 1)}
      type="button"
    >
      <span className={styles.toggleKnob} />
    </button>
  </div>
);

const PropertyForm = ({ form, loading, onFieldChange, onSubmit, onReset }) => {
  return (
    <div className={styles.form}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📍</span> Location
        </h3>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={form.neighborhood}
            onChange={(e) => onFieldChange("neighborhood", e.target.value)}
          >
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>{n.replace(/_/g, " ")}</option>
            ))}
          </select>
          <span className={styles.selectArrow}>▾</span>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🏠</span> Property Size
        </h3>
        <SliderField label="Square Footage" name="square_feet" min={400} max={6000} step={50}
          value={form.square_feet} unit=" sqft" onChange={onFieldChange} />
        <SliderField label="Lot Size" name="lot_size" min={1000} max={40000} step={500}
          value={form.lot_size} unit=" sqft" onChange={onFieldChange} />
        <div className={styles.twoCol}>
          <SliderField label="Floors" name="floors" min={1} max={3} step={0.5}
            value={form.floors} onChange={onFieldChange} />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>🛏</span> Rooms
        </h3>
        <div className={styles.twoCol}>
          <SliderField label="Bedrooms" name="bedrooms" min={1} max={6}
            value={form.bedrooms} onChange={onFieldChange} />
          <SliderField label="Bathrooms" name="bathrooms" min={1} max={4} step={0.5}
            value={form.bathrooms} onChange={onFieldChange} />
        </div>
        <SliderField label="Garage Spaces" name="garage_spaces" min={0} max={3}
          value={form.garage_spaces} onChange={onFieldChange} />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📅</span> Property Details
        </h3>
        <SliderField label="Age of Property" name="age_years" min={0} max={80}
          value={form.age_years} unit=" yrs" onChange={onFieldChange} />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>✨</span> Amenities
        </h3>
        <div className={styles.toggleGrid}>
          <ToggleField label="Swimming Pool"  name="has_pool"      value={form.has_pool}      onChange={onFieldChange} />
          <ToggleField label="Fireplace"      name="has_fireplace" value={form.has_fireplace} onChange={onFieldChange} />
          <ToggleField label="Basement"       name="has_basement"  value={form.has_basement}  onChange={onFieldChange} />
          <ToggleField label="Recently Renovated" name="renovated" value={form.renovated}     onChange={onFieldChange} />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📊</span> Neighborhood Scores
        </h3>
        <SliderField label="School Rating" name="school_rating" min={1} max={10} step={0.1}
          value={form.school_rating} onChange={onFieldChange} />
        <SliderField label="Crime Index (lower = safer)" name="crime_index" min={1} max={10} step={0.1}
          value={form.crime_index} onChange={onFieldChange} />
        <SliderField label="Walk Score" name="walk_score" min={0} max={100}
          value={form.walk_score} onChange={onFieldChange} />
      </div>

      <div className={styles.actions}>
        <button className={styles.resetBtn} onClick={onReset} type="button">Reset</button>
        <button className={styles.submitBtn} onClick={onSubmit} disabled={loading} type="button">
          {loading ? (
            <span className={styles.loadingSpinner}>
              <span className={styles.spinner} /> Analyzing…
            </span>
          ) : (
            "Get Valuation →"
          )}
        </button>
      </div>
    </div>
  );
};

export default PropertyForm;
