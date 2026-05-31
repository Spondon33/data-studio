import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as ss from 'simple-statistics'
import * as d3 from 'd3'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, LineChart,
  Line, Legend, ReferenceLine, Cell
} from 'recharts'

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: '100vh',
    width: '100%',
    maxwidth: '100%',
    margin: '0 auto',
    background: 'radial-gradient(circle at 12% 8%, rgba(34, 211, 238, 0.28), transparent 28%), radial-gradient(circle at 86% 0%, rgba(168, 85, 247, 0.32), transparent 30%), linear-gradient(135deg, #020617 0%, #07111f 38%, #111827 62%, #1e1b4b 100%)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: '#dbeafe',
  },
  header: {
    background: 'linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(15, 23, 42, 0.78), rgba(49, 46, 129, 0.62))',
    color: 'white',
    padding: '1.35rem 2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(125, 211, 252, 0.28)',
    boxShadow: '0 0 38px rgba(59, 130, 246, 0.22), inset 0 -1px 0 rgba(255,255,255,0.08)',
    backdropFilter: 'blur(14px)',
  },
  headerTitle: {
    margin: 0,
    fontSize: '45px',
    fontWeight: 800,
    letterSpacing: '0',
    lineHeight: '1.2',
    paddingBottom: '4px',
    display: 'block',
    background: 'linear-gradient(90deg, #e0f2fe, #67e8f9, #c084fc)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    textShadow: '0 0 28px rgba(103, 232, 249, 0.35)',
  },
  headerSub: { margin: 0, fontSize: '13px', color: '#93c5fd', opacity: 0.9 },
  main: { padding: '2rem', maxWidth: '100%', margin: '0 auto', paddingBottom: '6rem' },
  card: {
    background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.72))',
    borderRadius: '8px',
    border: '1px solid rgba(125, 211, 252, 0.24)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.32), 0 0 26px rgba(59, 130, 246, 0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
    backdropFilter: 'blur(18px)',
  },
  cardTitle: { margin: '0 0 1rem', fontSize: '15px', fontWeight: 700, color: '#e0f2fe', textShadow: '0 0 18px rgba(34, 211, 238, 0.22)' },
  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px',
    borderRadius: '20px', fontSize: '12px', fontWeight: 500,
    background: color === 'blue' ? 'rgba(14, 165, 233, 0.18)' : color === 'gray' ? 'rgba(148, 163, 184, 0.16)' : 'rgba(168, 85, 247, 0.18)',
    color: color === 'blue' ? '#7dd3fc' : color === 'gray' ? '#cbd5e1' : '#e9d5ff',
    border: `1px solid ${color === 'blue' ? 'rgba(125, 211, 252, 0.36)' : color === 'gray' ? 'rgba(203, 213, 225, 0.22)' : 'rgba(216, 180, 254, 0.36)'}`,
    boxShadow: color === 'blue' ? '0 0 14px rgba(14, 165, 233, 0.24)' : '0 0 14px rgba(168, 85, 247, 0.2)',
  }),
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', cursor: 'pointer',
    padding: '7px 11px', borderRadius: '7px', border: '1px solid rgba(125, 211, 252, 0.22)',
    background: 'rgba(15, 23, 42, 0.72)', color: '#dbeafe', userSelect: 'none',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  groupLabel: { fontSize: '11px', fontWeight: 800, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', marginTop: '12px' },
  analysisBtn: (selected, available) => ({
    padding: '7px 13px', fontSize: '13px', borderRadius: '7px',
    border: selected ? '1px solid rgba(103, 232, 249, 0.9)' : '1px solid rgba(125, 211, 252, 0.22)',
    cursor: available ? 'pointer' : 'not-allowed',
    background: selected ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.28), rgba(168, 85, 247, 0.28))' : available ? 'rgba(15, 23, 42, 0.62)' : 'rgba(15, 23, 42, 0.28)',
    color: selected ? '#e0f2fe' : available ? '#bfdbfe' : '#64748b',
    fontWeight: selected ? 600 : 400, transition: 'all 0.15s',
    boxShadow: selected ? '0 0 20px rgba(34, 211, 238, 0.22), inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
  }),
  runBtn: {
    padding: '11px 28px', fontSize: '14px', fontWeight: 800, borderRadius: '8px',
    border: '1px solid rgba(103, 232, 249, 0.55)',
    background: 'linear-gradient(135deg, #2563eb, #0891b2 45%, #7c3aed)',
    color: 'white', cursor: 'pointer',
    boxShadow: '0 0 24px rgba(59, 130, 246, 0.45), 0 0 34px rgba(168, 85, 247, 0.22)',
  },
  table: { borderCollapse: 'collapse', width: '100%', fontSize: '13px', background: 'rgba(2, 6, 23, 0.18)' },
  th: { border: '1px solid rgba(125, 211, 252, 0.18)', padding: '8px 12px', background: 'rgba(14, 165, 233, 0.12)', textAlign: 'left', fontWeight: 700, color: '#bae6fd' },
  td: { border: '1px solid rgba(125, 211, 252, 0.12)', padding: '8px 12px', color: '#dbeafe', background: 'rgba(15, 23, 42, 0.42)' },
  wrapCell: { whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: '120px', maxWidth: '240px' },
  resultTitle: { fontSize: '15px', fontWeight: 800, margin: '0 0 1rem', color: '#e0f2fe', borderBottom: '2px solid #22d3ee', paddingBottom: '6px', display: 'inline-block', textShadow: '0 0 18px rgba(34, 211, 238, 0.28)' },
  subTitle: { fontSize: '13px', fontWeight: 700, color: '#bfdbfe', margin: '0 0 8px' },
  infoBox: (type) => ({
    padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '8px',
    background: type === 'success' ? 'rgba(16, 185, 129, 0.14)' : type === 'warn' ? 'rgba(245, 158, 11, 0.14)' : type === 'danger' ? 'rgba(244, 63, 94, 0.14)' : 'rgba(14, 165, 233, 0.14)',
    color: type === 'success' ? '#86efac' : type === 'warn' ? '#fcd34d' : type === 'danger' ? '#fda4af' : '#93c5fd',
    border: `1px solid ${type === 'success' ? 'rgba(134, 239, 172, 0.28)' : type === 'warn' ? 'rgba(252, 211, 77, 0.28)' : type === 'danger' ? 'rgba(253, 164, 175, 0.28)' : 'rgba(147, 197, 253, 0.28)'}`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  }),
  sectionDivider: { borderBottom: '1px solid rgba(125, 211, 252, 0.18)', marginBottom: '2rem', paddingBottom: '2rem' },
  floatingBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(90deg, rgba(2, 6, 23, 0.96), rgba(30, 41, 59, 0.96), rgba(49, 46, 129, 0.96))', color: 'white',
    padding: '1rem 2rem', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', zIndex: 1000,
    boxShadow: '0 -10px 36px rgba(0,0,0,0.38), 0 0 28px rgba(59, 130, 246, 0.22)',
    borderTop: '1px solid rgba(125, 211, 252, 0.28)',
    backdropFilter: 'blur(14px)',
  },
}

const CLUSTER_COLORS = ['#1d4ed8', '#db2777', '#16a34a', '#ea580c', '#7c3aed', '#0891b2']

// ─── Downloadable Card ────────────────────────────────────────────────────────
function DownloadCard({ id, title, checkedMap, onToggle, children }) {
  const ref = useRef(null)
  const checked = !!checkedMap?.[id]
  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        background: 'linear-gradient(145deg, rgba(2, 6, 23, 0.92), rgba(15, 23, 42, 0.82))',
        borderRadius: '8px',
        border: checked ? '1px solid rgba(103, 232, 249, 0.95)' : '1px solid rgba(125, 211, 252, 0.2)',
        padding: '1rem', marginBottom: '1rem',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: checked ? '0 0 28px rgba(34, 211, 238, 0.28), inset 0 1px 0 rgba(255,255,255,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <label
        className="dl-checkbox-label"
        data-export-control="true"
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(id, ref)}
          style={{ accentColor: '#1d4ed8' }}
        />
        Download
      </label>

      <p style={{ ...S.subTitle, paddingRight: '90px' }} title={title}>{title}</p>
      {children}
    </div>
  )
}

// ─── Analysis Groups ──────────────────────────────────────────────────────────
const ANALYSIS_GROUPS = [
  {
    group: 'Descriptive',
    options: [
      { id: 'descriptive', label: 'Descriptive Statistics', check: (c, t) => Object.values(t).some(v => v === 'numeric'), reason: 'Needs at least one numeric column' },
      { id: 'distribution', label: 'Distribution', check: (c, t) => Object.values(t).some(v => v === 'numeric'), reason: 'Needs at least one numeric column' },
      { id: 'boxplot', label: 'Box Plot', check: (c, t) => Object.values(t).some(v => v === 'numeric'), reason: 'Needs at least one numeric column' },
      { id: 'frequency', label: 'Frequency Count', check: (c, t) => Object.values(t).some(v => v === 'text'), reason: 'Needs at least one text column' },
      { id: 'missing', label: 'Missing Values', check: () => true, reason: '' },
      { id: 'outlier', label: 'Outlier Detection', check: (c, t) => Object.values(t).some(v => v === 'numeric'), reason: 'Needs at least one numeric column' },
    ]
  },
  {
    group: 'Correlation & Relationships',
    options: [
      { id: 'pearson', label: 'Pearson Correlation', check: (c, t) => Object.values(t).filter(v => v === 'numeric').length >= 2, reason: 'Needs at least two numeric columns' },
      { id: 'heatmap', label: 'Correlation Heatmap', check: (c, t) => Object.values(t).filter(v => v === 'numeric').length >= 2, reason: 'Needs at least two numeric columns' },
      { id: 'scatter', label: 'Scatter Plot', check: (c, t) => Object.values(t).filter(v => v === 'numeric').length >= 2, reason: 'Needs at least two numeric columns' },
    ]
  },
  {
    group: 'Statistical Tests',
    options: [
      { id: 'ttest', label: 'T-Test', check: (c, t) => Object.values(t).filter(v => v === 'numeric').length >= 2, reason: 'Needs at least two numeric columns' },
      { id: 'ztest', label: 'Z-Test', check: (c, t) => Object.values(t).some(v => v === 'numeric'), reason: 'Needs at least one numeric column' },
      { id: 'anova', label: 'ANOVA', check: (c, t) => Object.values(t).some(v => v === 'numeric') && Object.values(t).some(v => v === 'text'), reason: 'Needs one numeric and one text column' },
      { id: 'chisquare', label: 'Chi-Square Test', check: (c, t) => Object.values(t).some(v => v === 'text'), reason: 'Needs at least one text column' },
    ]
  },
  {
    group: 'Regression',
    options: [
      { id: 'linear', label: 'Linear Regression', check: (c, t) => Object.values(t).filter(v => v === 'numeric').length >= 2, reason: 'Needs at least two numeric columns' },
      { id: 'multiple', label: 'Multiple Regression', check: (c, t) => Object.values(t).filter(v => v === 'numeric').length >= 3, reason: 'Needs at least three numeric columns' },
      { id: 'logistic', label: 'Logistic Regression', check: (c, t, d) => Object.values(t).some(v => v === 'numeric') && c.some(col => getBinaryInfo(d, col)), reason: 'Needs one numeric predictor and one binary outcome column' },
    ]
  },
  {
    group: 'Clustering',
    options: [
      { id: 'kmeans', label: 'K-Means Clustering', check: (c, t) => Object.values(t).filter(v => v === 'numeric').length >= 2, reason: 'Needs at least two numeric columns' },
    ]
  },
  {
    group: 'Time Series',
    options: [
      { id: 'movingavg', label: 'Moving Average', check: (c, t) => Object.values(t).some(v => v === 'numeric'), reason: 'Needs at least one numeric column' },
      { id: 'trend', label: 'Trend Decomposition', check: (c, t) => Object.values(t).some(v => v === 'numeric'), reason: 'Needs at least one numeric column' },
    ]
  },
]

const ANALYSIS_LABELS = {
  descriptive: 'Descriptive Statistics', distribution: 'Distribution', boxplot: 'Box Plot',
  missing: 'Missing Values', outlier: 'Outlier Detection', frequency: 'Frequency Count',
  pearson: 'Pearson Correlation', heatmap: 'Correlation Heatmap', scatter: 'Scatter Plot',
  ttest: 'T-Test', ztest: 'Z-Test', anova: 'ANOVA', chisquare: 'Chi-Square Test',
  linear: 'Linear Regression', multiple: 'Multiple Regression', logistic: 'Logistic Regression',
  kmeans: 'K-Means Clustering', movingavg: 'Moving Average', trend: 'Trend Decomposition',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getNumericValues(data, col) {
  return data.map(row => parseFloat(row[col])).filter(v => !isNaN(v))
}
function getPairedNumericValues(data, c1, c2) {
  return data.map(row => [parseFloat(row[c1]), parseFloat(row[c2])]).filter(([a, b]) => !isNaN(a) && !isNaN(b))
}
function interpretP(p) {
  if (p < 0.001) return { label: 'Highly significant (p < 0.001)', type: 'success' }
  if (p < 0.01) return { label: 'Very significant (p < 0.01)', type: 'success' }
  if (p < 0.05) return { label: 'Significant (p < 0.05)', type: 'success' }
  if (p < 0.1) return { label: 'Marginally significant (p < 0.1)', type: 'warn' }
  return { label: 'Not significant (p ≥ 0.1)', type: 'danger' }
}
function getPairs(arr) {
  const pairs = []
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      pairs.push([arr[i], arr[j]])
  return pairs
}
function normalPDF(x, mean, std) {
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2)
}
function sigmoid(x) { return 1 / (1 + Math.exp(-x)) }
function shortName(s, n = 25) { return s?.length > n ? s.slice(0, n) + '…' : s }
function normalCDF(x) { return 0.5 * (1 + erf(x / Math.SQRT2)) }
function erf(x) {
  const sign = x < 0 ? -1 : 1
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const ax = Math.abs(x), t = 1 / (1 + p * ax)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax)
  return sign * y
}
function betaContinuedFraction(a, b, x) {
  const maxIter = 200, eps = 3e-14, fpMin = 1e-300
  const qab = a + b, qap = a + 1, qam = a - 1
  let c = 1, d = 1 - qab * x / qap
  if (Math.abs(d) < fpMin) d = fpMin
  d = 1 / d
  let h = d
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpMin) d = fpMin
    c = 1 + aa / c
    if (Math.abs(c) < fpMin) c = fpMin
    d = 1 / d
    h *= d * c
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpMin) d = fpMin
    c = 1 + aa / c
    if (Math.abs(c) < fpMin) c = fpMin
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < eps) break
  }
  return h
}
function logGamma(z) {
  const p = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7]
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
  z -= 1
  let x = 0.9999999999998099
  for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1)
  const t = z + p.length - 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}
function regularizedBeta(a, b, x) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x))
  if (x < (a + 1) / (a + b + 2)) return bt * betaContinuedFraction(a, b, x) / a
  return 1 - bt * betaContinuedFraction(b, a, 1 - x) / b
}
function regularizedGammaP(a, x) {
  if (x <= 0) return 0
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum
    for (let n = 1; n <= 1000; n++) {
      ap += 1
      del *= x / ap
      sum += del
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a))
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d
  for (let i = 1; i <= 1000; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < 1e-300) d = 1e-300
    c = b + an / c
    if (Math.abs(c) < 1e-300) c = 1e-300
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-14) break
  }
  return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h
}
function tTestPValue(t, df) {
  if (!isFinite(t) || !isFinite(df) || df <= 0) return 1
  const x = df / (df + t * t)
  return Math.min(Math.max(regularizedBeta(df / 2, 0.5, x), 0), 1)
}
function fTestPValue(f, df1, df2) {
  if (!isFinite(f) || f < 0 || df1 <= 0 || df2 <= 0) return 1
  const x = df2 / (df2 + df1 * f)
  return Math.min(Math.max(regularizedBeta(df2 / 2, df1 / 2, x), 0), 1)
}
function chiSquarePValue(x, df) {
  if (!isFinite(x) || x < 0 || df <= 0) return 1
  return Math.min(Math.max(1 - regularizedGammaP(df / 2, x / 2), 0), 1)
}
function formatP(p) {
  if (!isFinite(p)) return 'n/a'
  if (p === 0) return '< 1e-300'
  if (p < 0.0001) return p.toExponential(3)
  return p.toFixed(4)
}
function formatNum(v, digits = 4) {
  return isFinite(v) ? Number(v).toFixed(digits) : 'n/a'
}
function getModeLabel(values) {
  const counts = new Map()
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1))
  const maxCount = Math.max(...counts.values())
  if (maxCount <= 1) return 'No unique mode'
  const modes = [...counts.entries()].filter(([, count]) => count === maxCount).map(([v]) => v)
  const shown = modes.slice(0, 5).map(v => formatNum(v)).join(', ')
  return modes.length > 5 ? `${shown}, ...` : shown
}
function getBinaryInfo(data, col) {
  const values = [...new Set(data.map(row => row[col]).filter(v => v !== '' && v != null))]
  if (values.length !== 2) return null
  const sorted = values.sort()
  return { negative: sorted[0], positive: sorted[1] }
}
function invertMatrix(matrix) {
  const n = matrix.length
  const aug = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)])
  for (let i = 0; i < n; i++) {
    let pivot = i
    for (let r = i + 1; r < n; r++) if (Math.abs(aug[r][i]) > Math.abs(aug[pivot][i])) pivot = r
    if (Math.abs(aug[pivot][i]) < 1e-12) return null
    ;[aug[i], aug[pivot]] = [aug[pivot], aug[i]]
    const div = aug[i][i]
    for (let c = 0; c < 2 * n; c++) aug[i][c] /= div
    for (let r = 0; r < n; r++) {
      if (r === i) continue
      const factor = aug[r][i]
      for (let c = 0; c < 2 * n; c++) aug[r][c] -= factor * aug[i][c]
    }
  }
  return aug.map(row => row.slice(n))
}
function fitOLS(rows) {
  const n = rows.length, p = rows[0].x.length + 1
  const X = rows.map(r => [1, ...r.x]), y = rows.map(r => r.y)
  const xtx = Array.from({ length: p }, () => Array(p).fill(0))
  const xty = Array(p).fill(0)
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      xty[a] += X[i][a] * y[i]
      for (let b = 0; b < p; b++) xtx[a][b] += X[i][a] * X[i][b]
    }
  }
  const inv = invertMatrix(xtx)
  if (!inv) return null
  const beta = inv.map(row => row.reduce((sum, v, i) => sum + v * xty[i], 0))
  const yMean = ss.mean(y)
  let sse = 0, sst = 0
  for (let i = 0; i < n; i++) {
    const yhat = beta.reduce((sum, b, j) => sum + b * X[i][j], 0)
    sse += (y[i] - yhat) ** 2
    sst += (y[i] - yMean) ** 2
  }
  const df = n - p, mse = sse / df, r2 = 1 - sse / sst, adjR2 = 1 - (1 - r2) * (n - 1) / df
  const coefficients = beta.map((b, i) => {
    const se = Math.sqrt(Math.max(0, mse * inv[i][i]))
    const t = b / se
    const pVal = tTestPValue(t, df)
    return { beta: b, se, t, p: pVal }
  })
  return { coefficients, r2, adjR2, df, residualSE: Math.sqrt(mse), sse, sst }
}
function standardizePairs(points) {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1])
  const mx = ss.mean(xs), my = ss.mean(ys), sx = ss.sampleStandardDeviation(xs) || 1, sy = ss.sampleStandardDeviation(ys) || 1
  return { scaled: points.map(([x, y]) => [(x - mx) / sx, (y - my) / sy]), mx, my, sx, sy }
}
function safeFileName(name) {
  return [...name]
    .map(ch => (ch.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(ch)) ? '-' : ch)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'analysis'
}
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function cardToSvgSource(el) {
  const width = Math.ceil(el.scrollWidth || el.getBoundingClientRect().width)
  const height = Math.ceil(el.scrollHeight || el.getBoundingClientRect().height)
  const clone = el.cloneNode(true)
  clone.querySelectorAll('[data-export-control="true"]').forEach(node => node.remove())
  clone.querySelectorAll('svg').forEach(svg => {
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  })
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  clone.style.width = `${width}px`
  clone.style.minHeight = `${height}px`
  clone.style.boxSizing = 'border-box'

  const body = new XMLSerializer().serializeToString(clone)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject width="100%" height="100%">
    ${body}
  </foreignObject>
</svg>`
}

// ─── Compute Functions ────────────────────────────────────────────────────────
function computeDescriptive(data, cols, columnTypes) {
  return cols.filter(col => columnTypes[col] === 'numeric').map(col => {
    const values = getNumericValues(data, col)
    if (!values.length) return null
    const q1 = ss.quantile(values, 0.25), q3 = ss.quantile(values, 0.75)
    return {
      column: col, count: values.length, missing: data.length - values.length,
      mean: ss.mean(values).toFixed(4), median: ss.median(values).toFixed(4),
      mode: getModeLabel(values), min: ss.min(values).toFixed(4),
      max: ss.max(values).toFixed(4), range: (ss.max(values) - ss.min(values)).toFixed(4),
      stdDev: values.length > 1 ? ss.sampleStandardDeviation(values).toFixed(4) : 'n/a',
      variance: values.length > 1 ? ss.sampleVariance(values).toFixed(4) : 'n/a',
      skewness: values.length > 2 ? ss.sampleSkewness(values).toFixed(4) : 'n/a', q1: q1.toFixed(4), q3: q3.toFixed(4),
      iqr: (q3 - q1).toFixed(4),
    }
  }).filter(Boolean)
}

function computeDistribution(data, cols, columnTypes) {
  return cols.filter(col => columnTypes[col] === 'numeric').map(col => {
    const values = getNumericValues(data, col)
    const min = ss.min(values), max = ss.max(values), binCount = 15
    if (min === max) return { column: col, bins: [{ label: min.toFixed(1), count: values.length }] }
    const binSize = (max - min) / binCount
    const bins = Array.from({ length: binCount }, (_, i) => {
      const lo = min + i * binSize, hi = lo + binSize
      return { label: i === binCount - 1 ? `${lo.toFixed(1)}-${max.toFixed(1)}` : `${lo.toFixed(1)}-${hi.toFixed(1)}`, count: 0 }
    })
    values.forEach(v => {
      const index = Math.min(Math.floor((v - min) / binSize), binCount - 1)
      bins[index].count += 1
    })
    return { column: col, bins }
  })
}

function computeBoxPlot(data, cols, columnTypes) {
  return cols.filter(col => columnTypes[col] === 'numeric').map(col => {
    const values = getNumericValues(data, col).sort((a, b) => a - b)
    const q1 = ss.quantile(values, 0.25), q3 = ss.quantile(values, 0.75)
    const iqr = q3 - q1, lower = q1 - 1.5 * iqr, upper = q3 + 1.5 * iqr
    const outlierVals = values.filter(v => v < lower || v > upper)
    const whiskerMin = values.find(v => v >= lower) ?? ss.min(values)
    const whiskerMax = [...values].reverse().find(v => v <= upper) ?? ss.max(values)
    return {
      column: col, min: ss.min(values), q1, median: ss.median(values), q3,
      max: ss.max(values), iqr, lowerFence: lower, upperFence: upper,
      whiskerMin, whiskerMax, outlierVals: outlierVals.slice(0, 50),
      outlierCount: outlierVals.length,
    }
  })
}

function computeMissing(data, cols) {
  return cols.map(col => {
    const missing = data.filter(row => row[col] === '' || row[col] === null || row[col] === undefined).length
    return { column: col, total: data.length, missing, present: data.length - missing, missingPct: ((missing / data.length) * 100).toFixed(1) }
  })
}

function computeOutliers(data, cols, columnTypes) {
  return cols.filter(col => columnTypes[col] === 'numeric').map(col => {
    const values = getNumericValues(data, col)
    const q1 = ss.quantile(values, 0.25), q3 = ss.quantile(values, 0.75)
    const iqr = q3 - q1, lower = q1 - 1.5 * iqr, upper = q3 + 1.5 * iqr
    const outliers = values.filter(v => v < lower || v > upper)
    const mean = ss.mean(values), std = ss.sampleStandardDeviation(values)
    const zOutliers = values.filter(v => Math.abs((v - mean) / std) > 3)
    const chartData = [
      { label: 'Normal', count: values.length - outliers.length },
      { label: 'IQR Outliers', count: outliers.length },
      { label: 'Z-Score Outliers', count: zOutliers.length },
    ]
    return { column: col, iqrOutliers: outliers.length, zScoreOutliers: zOutliers.length, lowerFence: lower.toFixed(2), upperFence: upper.toFixed(2), pct: ((outliers.length / values.length) * 100).toFixed(1), chartData }
  })
}

function computeFrequency(data, cols, columnTypes) {
  return cols.filter(col => columnTypes[col] === 'text').map(col => {
    const freq = {}
    data.forEach(row => { const v = row[col]; if (v) freq[v] = (freq[v] || 0) + 1 })
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20)
    return { column: col, freq: sorted.map(([label, count]) => ({ label, count })) }
  })
}

function computePearson(data, cols, columnTypes) {
  const numCols = cols.filter(col => columnTypes[col] === 'numeric')
  return getPairs(numCols).map(([c1, c2]) => {
    const pairs = getPairedNumericValues(data, c1, c2)
    const a = pairs.map(([x]) => x), b = pairs.map(([, y]) => y)
    const len = pairs.length
    try {
      const r = ss.sampleCorrelation(a, b)
      const t = r * Math.sqrt((len - 2) / (1 - r * r))
      const p = tTestPValue(t, len - 2)
      return { col1: c1, col2: c2, r: r.toFixed(4), p: formatP(p), n: len, interp: interpretP(p) }
    } catch { return null }
  }).filter(Boolean)
}

function computeHeatmap(data, cols, columnTypes) {
  const numCols = cols.filter(col => columnTypes[col] === 'numeric')
  const matrix = numCols.map(c1 => numCols.map(c2 => {
    if (c1 === c2) return 1
    const pairs = getPairedNumericValues(data, c1, c2)
    const a = pairs.map(([x]) => x), b = pairs.map(([, y]) => y)
    try { return parseFloat(ss.sampleCorrelation(a, b).toFixed(2)) }
    catch { return 0 }
  }))
  return { cols: numCols, matrix }
}

function computeScatter(data, cols, columnTypes) {
  const numCols = cols.filter(col => columnTypes[col] === 'numeric')
  return getPairs(numCols).map(([xCol, yCol]) => {
    const points = data.slice(0, 500).map(row => ({ x: parseFloat(row[xCol]), y: parseFloat(row[yCol]) })).filter(p => !isNaN(p.x) && !isNaN(p.y))
    return { xCol, yCol, points }
  })
}

function computeTTest(data, cols, columnTypes) {
  const numCols = cols.filter(col => columnTypes[col] === 'numeric')
  return getPairs(numCols).map(([c1, c2]) => {
    const pairs = getPairedNumericValues(data, c1, c2)
    const a = pairs.map(([x]) => x), b = pairs.map(([, y]) => y)
    if (pairs.length < 3) return null
    const mean1 = ss.mean(a), mean2 = ss.mean(b)
    const var1 = ss.sampleVariance(a), var2 = ss.sampleVariance(b)
    const welchSE = Math.sqrt(var1 / a.length + var2 / b.length)
    const welchT = (mean1 - mean2) / welchSE
    const welchDf = (var1 / a.length + var2 / b.length) ** 2 / ((var1 / a.length) ** 2 / (a.length - 1) + (var2 / b.length) ** 2 / (b.length - 1))
    const welchP = tTestPValue(welchT, welchDf)
    const diffs = pairs.map(([x, y]) => x - y)
    const pairedT = ss.mean(diffs) / (ss.sampleStandardDeviation(diffs) / Math.sqrt(diffs.length))
    const pairedDf = diffs.length - 1
    const pairedP = tTestPValue(pairedT, pairedDf)
    const std1 = ss.sampleStandardDeviation(a), std2 = ss.sampleStandardDeviation(b)
    const xMin = Math.min(mean1 - 3*std1, mean2 - 3*std2)
    const xMax = Math.max(mean1 + 3*std1, mean2 + 3*std2)
    const bellData = Array.from({ length: 80 }, (_, i) => {
      const x = xMin + (i / 79) * (xMax - xMin)
      return { x: parseFloat(x.toFixed(3)), [c1]: parseFloat(normalPDF(x, mean1, std1).toFixed(6)), [c2]: parseFloat(normalPDF(x, mean2, std2).toFixed(6)) }
    })
    return {
      c1, c2, n: pairs.length, mean1: mean1.toFixed(4), mean2: mean2.toFixed(4),
      pairedT: formatNum(pairedT), pairedDf: pairedDf.toFixed(0), pairedP: formatP(pairedP), pairedInterp: interpretP(pairedP),
      welchT: formatNum(welchT), welchDf: welchDf.toFixed(2), welchP: formatP(welchP), welchInterp: interpretP(welchP),
      bellData
    }
  }).filter(Boolean)
}

function computeZTest(data, cols, columnTypes) {
  return cols.filter(col => columnTypes[col] === 'numeric').map(col => {
    const values = getNumericValues(data, col)
    const mean = ss.mean(values), std = ss.sampleStandardDeviation(values)
    const z = mean / (std / Math.sqrt(values.length))
    const p = 2 * (1 - normalCDF(Math.abs(z)))
    const bellData = Array.from({ length: 80 }, (_, i) => {
      const x = -4 + (i / 79) * 8
      return { x: parseFloat(x.toFixed(2)), density: parseFloat(normalPDF(x, 0, 1).toFixed(6)) }
    })
    return { column: col, mean: mean.toFixed(4), std: std.toFixed(4), z: z.toFixed(4), p: formatP(p), interp: interpretP(p), bellData }
  })
}

function computeAnova(data, cols, columnTypes) {
  const numCols = cols.filter(c => columnTypes[c] === 'numeric')
  const textCols = cols.filter(c => columnTypes[c] === 'text')
  if (!textCols.length) return []
  return textCols.flatMap(catCol => numCols.map(numCol => {
    const groups = {}
    data.forEach(row => {
      const cat = row[catCol], val = parseFloat(row[numCol])
      if (cat && !isNaN(val)) { if (!groups[cat]) groups[cat] = []; groups[cat].push(val) }
    })
    const groupEntries = Object.entries(groups).filter(([, v]) => v.length > 1)
    if (groupEntries.length < 2) return null
    const allValues = groupEntries.flatMap(([, v]) => v)
    const grandMean = ss.mean(allValues), k = groupEntries.length, N = allValues.length
    const ssBetween = groupEntries.reduce((acc, [, v]) => acc + v.length * (ss.mean(v) - grandMean) ** 2, 0)
    const ssWithin = groupEntries.reduce((acc, [, v]) => acc + v.reduce((s, x) => s + (x - ss.mean(v)) ** 2, 0), 0)
    const F = (ssBetween / (k - 1)) / (ssWithin / (N - k))
    const p = fTestPValue(F, k - 1, N - k)
    const groupSummary = groupEntries.slice(0, 15).map(([name, v]) => ({ name: shortName(name, 15), mean: parseFloat(ss.mean(v).toFixed(2)), n: v.length }))
    return { numCol, catCol, groups: groupEntries.map(([name, v]) => ({ name, n: v.length, mean: ss.mean(v).toFixed(2), std: ss.sampleStandardDeviation(v).toFixed(2) })), F: F.toFixed(4), dfBetween: k - 1, dfWithin: N - k, p: formatP(p), interp: interpretP(p), groupSummary }
  })).filter(Boolean)
}

function computeChiSquare(data, cols, columnTypes) {
  const textCols = cols.filter(c => columnTypes[c] === 'text')
  return getPairs(textCols).map(([c1, c2]) => {
    const freq = {}
    data.forEach(row => { const v1 = row[c1], v2 = row[c2]; if (v1 && v2) { if (!freq[v1]) freq[v1] = {}; freq[v1][v2] = (freq[v1][v2] || 0) + 1 } })
    const rows = Object.keys(freq), cols2 = [...new Set(data.map(r => r[c2]).filter(Boolean))]
    const table = rows.map(r => cols2.map(c => freq[r]?.[c] || 0))
    const rowSums = table.map(r => r.reduce((a, b) => a + b, 0))
    const colSums = cols2.map((_, ci) => table.reduce((a, r) => a + r[ci], 0))
    const total = rowSums.reduce((a, b) => a + b, 0)
    let chi2 = 0
    let minExpected = Infinity
    table.forEach((row, ri) => row.forEach((obs, ci) => { const exp = (rowSums[ri] * colSums[ci]) / total; if (exp > 0) chi2 += (obs - exp) ** 2 / exp }))
    table.forEach((row, ri) => row.forEach((_, ci) => { const exp = (rowSums[ri] * colSums[ci]) / total; if (exp > 0) minExpected = Math.min(minExpected, exp) }))
    const df = (rows.length - 1) * (cols2.length - 1)
    const p = chiSquarePValue(chi2, df)
    return { c1, c2, chi2: chi2.toFixed(4), df, p: formatP(p), minExpected: minExpected.toFixed(2), interp: interpretP(p) }
  })
}

function computeLinearRegression(data, cols, columnTypes) {
  const numCols = cols.filter(c => columnTypes[c] === 'numeric')
  return getPairs(numCols).map(([xCol, yCol]) => {
    const pairs = data.map(row => [parseFloat(row[xCol]), parseFloat(row[yCol])]).filter(([x, y]) => !isNaN(x) && !isNaN(y))
    if (pairs.length < 2) return null
    const reg = ss.linearRegression(pairs)
    const line = ss.linearRegressionLine(reg)
    const r2 = ss.rSquared(pairs, line)
    const xVals = pairs.map(([x]) => x)
    const xMin = ss.min(xVals), xMax = ss.max(xVals)
    const sample = pairs.slice(0, 300).map(([x, y]) => ({ x, y }))
    const regressionLine = [{ x: xMin, y: line(xMin) }, { x: xMax, y: line(xMax) }]
    return { xCol, yCol, slope: reg.m.toFixed(4), intercept: reg.b.toFixed(4), r2: r2.toFixed(4), n: pairs.length, sample, regressionLine }
  }).filter(Boolean)
}

function computeMultipleRegression(data, cols, columnTypes) {
  const numCols = cols.filter(c => columnTypes[c] === 'numeric')
  if (numCols.length < 3) return null
  const yCol = numCols[numCols.length - 1]
  const xCols = numCols.slice(0, -1)
  const cleanRows = data.map(row => ({
    y: parseFloat(row[yCol]),
    x: xCols.map(c => parseFloat(row[c])),
  })).filter(row => !isNaN(row.y) && row.x.every(v => !isNaN(v)))
  if (cleanRows.length <= xCols.length + 2) return null
  const fit = fitOLS(cleanRows)
  if (!fit) return null
  const coefficientRows = fit.coefficients.map((coef, i) => ({
    term: i === 0 ? 'Intercept' : xCols[i - 1],
    beta: formatNum(coef.beta),
    se: formatNum(coef.se),
    t: formatNum(coef.t),
    p: formatP(coef.p),
  }))
  const chartData = coefficientRows.slice(1).map(row => ({ predictor: row.term, beta: parseFloat(row.beta) }))
  return {
    yCol, xCols, n: cleanRows.length, df: fit.df,
    r2: formatNum(fit.r2), adjR2: formatNum(fit.adjR2), residualSE: formatNum(fit.residualSE),
    coefficientRows, chartData,
  }
}

function computeLogisticRegression(data, cols, columnTypes) {
  const numCols = cols.filter(c => columnTypes[c] === 'numeric')
  const binaryCols = cols.filter(c => getBinaryInfo(data, c))
  return numCols.flatMap(xCol => binaryCols.filter(yCol => yCol !== xCol).map(yCol => {
    const info = getBinaryInfo(data, yCol)
    const rows = data.map(row => {
      const x = parseFloat(row[xCol])
      const yRaw = row[yCol]
      return { x, y: yRaw === info.positive ? 1 : yRaw === info.negative ? 0 : NaN }
    }).filter(row => !isNaN(row.x) && !isNaN(row.y))
    if (rows.length < 10) return null
    const xVals = rows.map(r => r.x)
    const mean = ss.mean(xVals), std = ss.sampleStandardDeviation(xVals) || 1
    let b0 = 0, b1 = 0
    for (let iter = 0; iter < 40; iter++) {
      let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0
      rows.forEach(({ x, y }) => {
        const z = (x - mean) / std
        const p = Math.min(Math.max(sigmoid(b0 + b1 * z), 1e-8), 1 - 1e-8)
        const w = p * (1 - p)
        g0 += y - p
        g1 += (y - p) * z
        h00 += w
        h01 += w * z
        h11 += w * z * z
      })
      const det = h00 * h11 - h01 * h01
      if (Math.abs(det) < 1e-12) break
      const d0 = (h11 * g0 - h01 * g1) / det
      const d1 = (-h01 * g0 + h00 * g1) / det
      b0 += d0
      b1 += d1
      if (Math.abs(d0) + Math.abs(d1) < 1e-7) break
    }
    let h00 = 0, h01 = 0, h11 = 0, logLik = 0
    const positives = rows.reduce((sum, r) => sum + r.y, 0)
    const baseRate = positives / rows.length
    const nullLogLik = positives * Math.log(baseRate || 1e-8) + (rows.length - positives) * Math.log(1 - baseRate || 1e-8)
    rows.forEach(({ x, y }) => {
      const z = (x - mean) / std
      const p = Math.min(Math.max(sigmoid(b0 + b1 * z), 1e-8), 1 - 1e-8)
      const w = p * (1 - p)
      h00 += w
      h01 += w * z
      h11 += w * z * z
      logLik += y * Math.log(p) + (1 - y) * Math.log(1 - p)
    })
    const det = h00 * h11 - h01 * h01
    const se1 = det > 0 ? Math.sqrt(h00 / det) : NaN
    const zStat = b1 / se1
    const pValue = 2 * (1 - normalCDF(Math.abs(zStat)))
    const xMin = ss.min(xVals), xMax = ss.max(xVals)
    const sigmoidData = Array.from({ length: 80 }, (_, i) => {
      const x = xMin + (i / 79) * (xMax - xMin)
      const z = (x - mean) / std
      return { x: parseFloat(x.toFixed(3)), probability: parseFloat(sigmoid(b0 + b1 * z).toFixed(4)) }
    })
    const scatterData = rows.slice(0, 300).map(({ x, y }) => ({ x, y }))
    return {
      xCol, yCol, n: rows.length, positiveLabel: info.positive, negativeLabel: info.negative,
      intercept: formatNum(b0), beta: formatNum(b1), se: formatNum(se1), z: formatNum(zStat), p: formatP(pValue),
      oddsRatio: formatNum(Math.exp(b1)), mcfaddenR2: formatNum(1 - logLik / nullLogLik), baseRate: formatNum(baseRate),
      note: `Fitted binary logistic model. Positive class: ${info.positive}. Coefficient is per 1 SD increase in ${xCol}.`,
      sigmoidData, scatterData, interp: interpretP(pValue),
    }
  })).filter(Boolean)
}

function computeKMeans(data, cols, columnTypes, k = 3) {
  const numCols = cols.filter(c => columnTypes[c] === 'numeric')
  return getPairs(numCols).map(([c1, c2]) => {
    const points = data.slice(0, 500).map(row => [parseFloat(row[c1]), parseFloat(row[c2])]).filter(p => !isNaN(p[0]) && !isNaN(p[1]))
    if (points.length < k) return null
    const { scaled, mx, my, sx, sy } = standardizePairs(points)
    let centroids = scaled.slice(0, k), labels = new Array(scaled.length).fill(0)
    for (let iter = 0; iter < 20; iter++) {
      labels = scaled.map(p => { let minD = Infinity, lbl = 0; centroids.forEach((c, i) => { const d = Math.sqrt((p[0]-c[0])**2+(p[1]-c[1])**2); if (d<minD){minD=d;lbl=i} }); return lbl })
      centroids = Array.from({ length: k }, (_, ki) => { const cp = scaled.filter((_, i) => labels[i]===ki); return cp.length ? [ss.mean(cp.map(p=>p[0])),ss.mean(cp.map(p=>p[1]))] : centroids[ki] })
    }
    const chartData = points.map((p, i) => ({ x: p[0], y: p[1], cluster: `Cluster ${labels[i]+1}` }))
    const clusterSizes = Array.from({ length: k }, (_, ki) => ({
      cluster: `Cluster ${ki+1}`, size: labels.filter(l=>l===ki).length,
      cx: (centroids[ki][0] * sx + mx).toFixed(2), cy: (centroids[ki][1] * sy + my).toFixed(2)
    }))
    return { c1, c2, k, chartData, clusterSizes, note: 'K-Means was fit on standardized variables, then centroids were converted back to original units.' }
  }).filter(Boolean)
}

function computeMovingAverage(data, cols, columnTypes, windowSize = 7) {
  return cols.filter(col => columnTypes[col] === 'numeric').map(col => {
    const values = getNumericValues(data, col)
    const ma = values.map((_, i) => i < windowSize-1 ? null : parseFloat(ss.mean(values.slice(i-windowSize+1, i+1)).toFixed(2)))
    return { column: col, window: windowSize, chartData: values.slice(0, 300).map((v, i) => ({ index: i, value: v, ma: ma[i] })) }
  })
}

function computeTrend(data, cols, columnTypes) {
  return cols.filter(col => columnTypes[col] === 'numeric').map(col => {
    const values = getNumericValues(data, col)
    const pairs = values.map((v, i) => [i, v])
    const reg = ss.linearRegression(pairs)
    const line = ss.linearRegressionLine(reg)
    const r2 = ss.rSquared(pairs, line)
    const direction = reg.m > 0.001 ? '↑ Upward' : reg.m < -0.001 ? '↓ Downward' : '→ Flat'
    return { column: col, slope: reg.m.toFixed(6), direction, r2: r2.toFixed(4), chartData: values.slice(0, 300).map((v, i) => ({ index: i, value: v, trend: parseFloat(line(i).toFixed(2)) })) }
  })
}

// ─── SVG Box Plot ─────────────────────────────────────────────────────────────
function SVGBoxPlot({ data: d }) {
  const W = 560, H = 180, PAD = { left: 60, right: 20, top: 20, bottom: 30 }
  const innerW = W - PAD.left - PAD.right, innerH = H - PAD.top - PAD.bottom
  const allVals = [d.min, d.whiskerMin, d.q1, d.median, d.q3, d.whiskerMax, d.max, ...d.outlierVals]
  const xScale = d3.scaleLinear().domain([d3.min(allVals), d3.max(allVals)]).range([0, innerW]).nice()
  const cx = v => xScale(v)
  const midY = innerH/2, boxH = innerH*0.5, boxTop = midY-boxH/2, boxBot = midY+boxH/2
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {xScale.ticks(6).map(t => (
          <g key={t}>
            <line x1={cx(t)} x2={cx(t)} y1={0} y2={innerH} stroke="#e2e8f0" strokeWidth={1} />
            <text x={cx(t)} y={innerH+18} textAnchor="middle" fontSize={10} fill="#94a3b8">{t.toLocaleString()}</text>
          </g>
        ))}
        <line x1={cx(d.whiskerMin)} x2={cx(d.q1)} y1={midY} y2={midY} stroke="#475569" strokeWidth={2} />
        <line x1={cx(d.q3)} x2={cx(d.whiskerMax)} y1={midY} y2={midY} stroke="#475569" strokeWidth={2} />
        <line x1={cx(d.whiskerMin)} x2={cx(d.whiskerMin)} y1={boxTop+10} y2={boxBot-10} stroke="#475569" strokeWidth={2} />
        <line x1={cx(d.whiskerMax)} x2={cx(d.whiskerMax)} y1={boxTop+10} y2={boxBot-10} stroke="#475569" strokeWidth={2} />
        <rect x={cx(d.q1)} y={boxTop} width={cx(d.q3)-cx(d.q1)} height={boxH} fill="#bfdbfe" stroke="#1d4ed8" strokeWidth={2} rx={2} />
        <line x1={cx(d.median)} x2={cx(d.median)} y1={boxTop} y2={boxBot} stroke="#1d4ed8" strokeWidth={3} />
        {d.outlierVals.map((v, i) => <circle key={i} cx={cx(v)} cy={midY} r={3} fill="#ef4444" opacity={0.6} />)}
        <text x={cx(d.median)} y={boxTop-6} textAnchor="middle" fontSize={10} fill="#1d4ed8" fontWeight={600}>Median: {parseFloat(d.median).toLocaleString()}</text>
        <text x={cx(d.q1)} y={boxBot+14} textAnchor="middle" fontSize={9} fill="#475569">Q1</text>
        <text x={cx(d.q3)} y={boxBot+14} textAnchor="middle" fontSize={9} fill="#475569">Q3</text>
      </g>
    </svg>
  )
}

// ─── Result Renderers ─────────────────────────────────────────────────────────
function DescriptiveResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>No numeric columns selected.</p>
  const headers = ['Statistic', ...result.map(r => r.column)]
  const rows = [
    ['Count', ...result.map(r => r.count)], ['Missing', ...result.map(r => r.missing)],
    ['Mean', ...result.map(r => r.mean)], ['Median', ...result.map(r => r.median)],
    ['Mode', ...result.map(r => r.mode)], ['Std Dev', ...result.map(r => r.stdDev)],
    ['Variance', ...result.map(r => r.variance)], ['Min', ...result.map(r => r.min)],
    ['Max', ...result.map(r => r.max)], ['Range', ...result.map(r => r.range)],
    ['Q1', ...result.map(r => r.q1)], ['Q3', ...result.map(r => r.q3)],
    ['IQR', ...result.map(r => r.iqr)], ['Skewness', ...result.map(r => r.skewness)],
  ]
  return (
    <DownloadCard id="descriptive-table" title="Descriptive Statistics — All Columns" {...cardProps}>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead><tr>{headers.map(h => <th key={h} style={{ ...S.th, ...S.wrapCell }}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(([label, ...vals]) => (
            <tr key={label}>
              <td style={{ ...S.td, fontWeight: 600, background: 'rgba(15, 23, 42, 0.42)' }}>{label}</td>
              {vals.map((v, i) => <td key={i} style={S.td}>{v}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </DownloadCard>
  )
}

function DistributionResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>No numeric columns selected.</p>
  return result.map(col => (
    <DownloadCard key={col.column} id={`distribution-${col.column}`} title={`Distribution — ${col.column}`} {...cardProps}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={col.bins} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function BoxPlotResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>No numeric columns selected.</p>
  return result.map(row => (
    <DownloadCard key={row.column} id={`boxplot-${row.column}`} title={`Box Plot — ${row.column}`} {...cardProps}>
      <SVGBoxPlot data={row} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
        <span>Min: <strong>{parseFloat(row.min).toLocaleString()}</strong></span>
        <span>Q1: <strong>{parseFloat(row.q1).toLocaleString()}</strong></span>
        <span>Median: <strong>{parseFloat(row.median).toLocaleString()}</strong></span>
        <span>Q3: <strong>{parseFloat(row.q3).toLocaleString()}</strong></span>
        <span>Max: <strong>{parseFloat(row.max).toLocaleString()}</strong></span>
        <span style={{ color: '#ef4444' }}>Outliers: <strong>{row.outlierCount}</strong></span>
      </div>
    </DownloadCard>
  ))
}

function MissingResult({ result, cardProps }) {
  const chartData = result.map(r => ({ name: shortName(r.column, 15), fullName: r.column, present: r.present, missing: r.missing }))
  return (
    <>
      <DownloadCard id="missing-table" title="Missing Values — Table" {...cardProps}>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead><tr>{['Column', 'Total', 'Present', 'Missing', 'Missing %'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{result.map(row => (
              <tr key={row.column}>
                <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{row.column}</td>
                <td style={S.td}>{row.total}</td><td style={S.td}>{row.present}</td>
                <td style={{ ...S.td, color: row.missing > 0 ? '#ef4444' : '#16a34a' }}>{row.missing}</td>
                <td style={{ ...S.td, color: row.missing > 0 ? '#ef4444' : '#16a34a' }}>{row.missingPct}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </DownloadCard>
      <DownloadCard id="missing-chart" title="Missing Values — Chart" {...cardProps}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#16a34a" name="Present" stackId="a" />
            <Bar dataKey="missing" fill="#ef4444" name="Missing" stackId="a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </DownloadCard>
    </>
  )
}

function OutlierResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>No numeric columns selected.</p>
  return (
    <>
      <DownloadCard id="outlier-table" title="Outlier Detection — Summary Table" {...cardProps}>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead><tr>{['Column', 'IQR Outliers', 'Z-Score Outliers', 'Lower Fence', 'Upper Fence', '% Outliers'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{result.map(row => (
              <tr key={row.column}>
                <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{row.column}</td>
                <td style={{ ...S.td, color: row.iqrOutliers > 0 ? '#ea580c' : '#16a34a' }}>{row.iqrOutliers}</td>
                <td style={{ ...S.td, color: row.zScoreOutliers > 0 ? '#ea580c' : '#16a34a' }}>{row.zScoreOutliers}</td>
                <td style={S.td}>{row.lowerFence}</td><td style={S.td}>{row.upperFence}</td>
                <td style={S.td}>{row.pct}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </DownloadCard>
      {result.map(row => (
        <DownloadCard key={row.column} id={`outlier-chart-${row.column}`} title={`Outlier Breakdown — ${row.column}`} {...cardProps}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={row.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} /><Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {row.chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#16a34a' : '#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </DownloadCard>
      ))}
    </>
  )
}

function FrequencyResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>No text columns selected.</p>
  return result.map(col => (
    <DownloadCard key={col.column} id={`frequency-${col.column}`} title={`Frequency Count — ${col.column}`} {...cardProps}>
      <ResponsiveContainer width="100%" height={Math.max(200, col.freq.length * 28)}>
        <BarChart data={col.freq} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={115} />
          <Tooltip /><Bar dataKey="count" fill="#7c3aed" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function PearsonResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>Need at least two numeric columns.</p>
  return (
    <DownloadCard id="pearson-table" title="Pearson Correlation — All Pairs" {...cardProps}>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead><tr>{['Column 1', 'Column 2', 'r', 'p-value', 'N', 'Interpretation'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{result.map((row, i) => (
            <tr key={i}>
              <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{row.col1}</td>
              <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{row.col2}</td>
              <td style={{ ...S.td, color: Math.abs(row.r) > 0.5 ? '#1d4ed8' : '#374151', fontWeight: 600 }}>{row.r}</td>
              <td style={S.td}>{row.p}</td><td style={S.td}>{row.n}</td>
              <td style={{ ...S.td, color: row.interp.type === 'success' ? '#16a34a' : row.interp.type === 'warn' ? '#d97706' : '#ef4444' }}>{row.interp.label}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </DownloadCard>
  )
}

function HeatmapResult({ result, cardProps }) {
  if (!result) return <p style={{ color: '#ef4444' }}>Need at least two numeric columns.</p>
  const { cols, matrix } = result

  const cellSize = 60
  const labelPad = 140
  const W = labelPad + cols.length * cellSize + 60
  const H = labelPad + cols.length * cellSize + 20

  const getColor = (val) => {
    if (val >= 0) {
      const t = val
      const r = Math.round(255 * (1 - t))
      const g = Math.round(255 * (1 - t))
      const b = 255
      return `rgb(${r},${g},${b})`
    } else {
      const t = -val
      const r = 255
      const g = Math.round(255 * (1 - t))
      const b = Math.round(255 * (1 - t))
      return `rgb(${r},${g},${b})`
    }
  }

  const id = 'heatmap'
  const title = 'Correlation Heatmap'

  return (
    <DownloadCard id={id} title={title} checkedMap={cardProps.checkedMap} onToggle={cardProps.onToggle}>
      <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg
          width={W}
          height={H}
          style={{ fontFamily: 'Arial, sans-serif', display: 'block', margin: '0 auto' }}
        >
          {/* White background */}
          <rect width={W} height={H} fill="transparent" />

          {/* Column labels (top, rotated) */}
          {cols.map((col, ci) => (
            <text
              key={`col-${ci}`}
              x={labelPad + ci * cellSize + cellSize / 2}
              y={labelPad - 8}
              textAnchor="start"
              fontSize={11}
              fill="#bfdbfe"
              transform={`rotate(-45, ${labelPad + ci * cellSize + cellSize / 2}, ${labelPad - 8})`}
            >
              {col.length > 18 ? col.slice(0, 18) + '…' : col}
            </text>
          ))}

          {/* Row labels (left) */}
          {cols.map((col, ri) => (
            <text
              key={`row-${ri}`}
              x={labelPad - 8}
              y={labelPad + ri * cellSize + cellSize / 2 + 4}
              textAnchor="end"
              fontSize={11}
              fill="#bfdbfe"
            >
              {col.length > 18 ? col.slice(0, 18) + '…' : col}
            </text>
          ))}

          {/* Cells */}
          {matrix.map((row, ri) =>
            row.map((val, ci) => {
              const x = labelPad + ci * cellSize
              const y = labelPad + ri * cellSize
              const textColor = Math.abs(val) > 0.5 ? 'white' : '#1e293b'
              return (
                <g key={`${ri}-${ci}`}>
                  <rect
                    x={x} y={y}
                    width={cellSize} height={cellSize}
                    fill={getColor(val)}
                    stroke="white"
                    strokeWidth={1}
                  />
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={textColor}
                  >
                    {val.toFixed(2)}
                  </text>
                </g>
              )
            })
          )}

          {/* Color scale legend */}
          {Array.from({ length: 100 }, (_, i) => {
            const val = -1 + (i / 99) * 2
            return (
              <rect
                key={i}
                x={W - 30}
                y={labelPad + i * ((cols.length * cellSize) / 100)}
                width={20}
                height={(cols.length * cellSize) / 100 + 1}
                fill={getColor(val)}
              />
            )
          })}

          {/* Legend labels */}
          <text x={W - 28} y={labelPad - 6} fontSize={10} fill="#bfdbfe" textAnchor="middle">+1</text>
          <text x={W - 28} y={labelPad + cols.length * cellSize + 14} fontSize={10} fill="#bfdbfe" textAnchor="middle">-1</text>
          <text x={W - 28} y={labelPad + (cols.length * cellSize) / 2 + 4} fontSize={10} fill="#bfdbfe" textAnchor="middle">0</text>
        </svg>
      </div>
    </DownloadCard>
  )
}

function ScatterResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>Need at least two numeric columns.</p>
  return result.map(({ xCol, yCol, points }) => (
    <DownloadCard key={`${xCol}-${yCol}`} id={`scatter-${xCol}-${yCol}`} title={`Scatter — ${xCol} vs ${yCol}`} {...cardProps}>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 62, left: 34 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" name={xCol} tick={{ fontSize: 11 }} label={{ value: xCol, position: 'bottom', offset: 38, fontSize: 11 }} />
          <YAxis dataKey="y" name={yCol} tick={{ fontSize: 11 }} label={{ value: yCol, angle: -90, position: 'insideLeft', offset: -18, fontSize: 11 }} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={points} fill="#1d4ed8" opacity={0.5} />
        </ScatterChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function TTestResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>Need at least two numeric columns.</p>
  return result.map(row => (
    <DownloadCard key={`${row.c1}-${row.c2}`} id={`ttest-${row.c1}-${row.c2}`} title={`T-Test — ${row.c1} vs ${row.c2}`} {...cardProps}>
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={S.table}>
          <thead><tr>{['Test', 'N', 'Mean 1', 'Mean 2', 't-stat', 'df', 'p-value'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            <tr><td style={{ ...S.td, fontWeight: 600 }}>Paired</td><td style={S.td}>{row.n}</td><td style={S.td}>{row.mean1}</td><td style={S.td}>{row.mean2}</td><td style={S.td}>{row.pairedT}</td><td style={S.td}>{row.pairedDf}</td><td style={S.td}>{row.pairedP}</td></tr>
            <tr><td style={{ ...S.td, fontWeight: 600 }}>Welch</td><td style={S.td}>{row.n}</td><td style={S.td}>{row.mean1}</td><td style={S.td}>{row.mean2}</td><td style={S.td}>{row.welchT}</td><td style={S.td}>{row.welchDf}</td><td style={S.td}>{row.welchP}</td></tr>
          </tbody>
        </table>
      </div>
      <div style={S.infoBox(row.pairedInterp.type)}>Paired: {row.pairedInterp.label}</div>
      <div style={S.infoBox(row.welchInterp.type)}>Welch: {row.welchInterp.label}</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={row.bellData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
          <Tooltip /><Legend />
          <Line type="monotone" dataKey={row.c1} stroke="#1d4ed8" dot={false} strokeWidth={2} name={row.c1} />
          <Line type="monotone" dataKey={row.c2} stroke="#db2777" dot={false} strokeWidth={2} name={row.c2} />
        </LineChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function ZTestResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>No numeric columns.</p>
  return result.map(row => (
    <DownloadCard key={row.column} id={`ztest-${row.column}`} title={`Z-Test — ${row.column}`} {...cardProps}>
      <div style={S.infoBox('warn')}>One-sample large-sample z-test against null mean μ₀ = 0. Use only when that null value is meaningful for the variable.</div>
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={S.table}>
          <thead><tr>{['Mean', 'Null Mean', 'Std Dev', 'Z-Score', 'p-value'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody><tr>{[row.mean, '0', row.std, row.z, row.p].map((v, i) => <td key={i} style={S.td}>{v}</td>)}</tr></tbody>
        </table>
      </div>
      <div style={S.infoBox(row.interp.type)}>{row.interp.label}</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={row.bellData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
          <ReferenceLine x={-1.96} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '-1.96', fontSize: 10 }} />
          <ReferenceLine x={1.96} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '1.96', fontSize: 10 }} />
          <ReferenceLine x={parseFloat(row.z)} stroke="#1d4ed8" strokeWidth={2} label={{ value: `z=${row.z}`, fontSize: 10 }} />
          <Line type="monotone" dataKey="density" stroke="#475569" dot={false} strokeWidth={2} name="Normal Dist." />
        </LineChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function AnovaResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>Need one numeric and one text column with at least 2 groups.</p>
  return result.map(row => (
    <DownloadCard key={row.numCol} id={`anova-${row.numCol}`} title={`ANOVA — ${row.numCol} by ${row.catCol}`} {...cardProps}>
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={S.table}>
          <thead><tr>{['F-Statistic', 'df Between', 'df Within', 'p-value'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody><tr>{[row.F, row.dfBetween, row.dfWithin, row.p].map((v, i) => <td key={i} style={S.td}>{v}</td>)}</tr></tbody>
        </table>
      </div>
      <div style={S.infoBox(row.interp.type)}>{row.interp.label}</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={row.groupSummary} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v, n, p) => [v, `Mean (n=${p.payload.n})`]} />
          <Bar dataKey="mean" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Mean" />
        </BarChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function ChiSquareResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>Need at least two text columns.</p>
  return (
    <DownloadCard id="chisquare-table" title="Chi-Square Test — All Pairs" {...cardProps}>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead><tr>{['Column 1', 'Column 2', 'Chi²', 'df', 'p-value', 'Min Expected', 'Interpretation'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{result.map((row, i) => (
            <tr key={i}>
              <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{row.c1}</td>
              <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{row.c2}</td>
              <td style={S.td}>{row.chi2}</td><td style={S.td}>{row.df}</td><td style={S.td}>{row.p}</td><td style={S.td}>{row.minExpected}</td>
              <td style={{ ...S.td, color: row.interp.type === 'success' ? '#16a34a' : row.interp.type === 'warn' ? '#d97706' : '#ef4444' }}>{row.interp.label}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </DownloadCard>
  )
}

function LinearRegressionResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>Need at least two numeric columns.</p>
  return result.map(row => (
    <DownloadCard key={`${row.xCol}-${row.yCol}`} id={`linear-${row.xCol}-${row.yCol}`} title={`Linear Regression — ${row.xCol} → ${row.yCol}`} {...cardProps}>
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={S.table}>
          <thead><tr>{['Slope (m)', 'Intercept (b)', 'R²', 'N'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody><tr>{[row.slope, row.intercept, row.r2, row.n].map((v, i) => <td key={i} style={S.td}>{v}</td>)}</tr></tbody>
        </table>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>y = {row.slope}x + {row.intercept}</p>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 62, left: 34 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" type="number" tick={{ fontSize: 10 }} label={{ value: row.xCol, position: 'bottom', offset: 38, fontSize: 11 }} domain={['auto','auto']} />
          <YAxis dataKey="y" type="number" tick={{ fontSize: 10 }} label={{ value: row.yCol, angle: -90, position: 'insideLeft', offset: -18, fontSize: 11 }} domain={['auto','auto']} />
          <Tooltip /><Legend verticalAlign="top" />
          <Scatter name="Data Points" data={row.sample} fill="#1d4ed8" opacity={0.4} />
          <Scatter name="Regression Line" data={row.regressionLine} fill="#ef4444" line={{ stroke: '#ef4444', strokeWidth: 2 }} shape={() => null} />
        </ScatterChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function MultipleRegressionResult({ result, cardProps }) {
  if (!result) return <p style={{ color: '#ef4444' }}>Need at least three numeric columns.</p>
  return (
    <DownloadCard id="multiple-regression" title={`Multiple Regression — Outcome: ${result.yCol}`} {...cardProps}>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>N = {result.n} · Predictors: {result.xCols.length} · R² = {result.r2} · Adjusted R² = {result.adjR2} · Residual SE = {result.residualSE}</p>
      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table style={S.table}>
          <thead><tr>{['Term', 'Coefficient', 'Std Error', 't-stat', 'p-value'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{result.coefficientRows.map(c => (
            <tr key={c.term}>
              <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{c.term}</td>
              <td style={S.td}>{c.beta}</td>
              <td style={S.td}>{c.se}</td>
              <td style={S.td}>{c.t}</td>
              <td style={S.td}>{c.p}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={result.chartData} layout="vertical" margin={{ top: 5, right: 30, left: 190, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="predictor" type="category" tick={{ fontSize: 10 }} width={185} />
          <Tooltip />
          <ReferenceLine x={0} stroke="#475569" />
          <Bar dataKey="beta" radius={[0, 4, 4, 0]} name="Coefficient">
            {result.chartData.map((c, i) => <Cell key={i} fill={c.beta >= 0 ? '#1d4ed8' : '#ef4444'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </DownloadCard>
  )
}

function LogisticRegressionResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>Need one numeric predictor and one binary outcome column.</p>
  return result.map(row => (
    <DownloadCard key={`${row.xCol}-${row.yCol}`} id={`logistic-${row.xCol}-${row.yCol}`} title={`Logistic Regression — ${row.xCol} → ${row.yCol}`} {...cardProps}>
      <div style={S.infoBox(row.interp.type)}>{row.note}</div>
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={S.table}>
          <thead><tr>{['Predictor', 'Outcome', 'N', 'Positive Class', 'Coef', 'SE', 'z', 'p-value', 'Odds Ratio', 'McFadden R²'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody><tr>
            <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{row.xCol}</td>
            <td style={{ ...S.td, ...S.wrapCell, fontWeight: 600 }}>{row.yCol}</td>
            <td style={S.td}>{row.n}</td><td style={S.td}>{row.positiveLabel}</td><td style={S.td}>{row.beta}</td><td style={S.td}>{row.se}</td><td style={S.td}>{row.z}</td><td style={S.td}>{row.p}</td><td style={S.td}>{row.oddsRatio}</td><td style={S.td}>{row.mcfaddenR2}</td>
          </tr></tbody>
        </table>
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Fitted S-Curve — Predicted Probability</p>
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 62, left: 34 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" type="number" tick={{ fontSize: 10 }} label={{ value: row.xCol, position: 'bottom', offset: 38, fontSize: 11 }} domain={['auto','auto']} />
          <YAxis dataKey="y" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} label={{ value: 'P(y=1)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <Tooltip /><Legend verticalAlign="top" />
          <Scatter name="Data Points" data={row.scatterData} fill="#94a3b8" opacity={0.4} />
          <Scatter name="S-Curve" data={row.sigmoidData.map(d => ({ x: d.x, y: d.probability }))} fill="#1d4ed8" line={{ stroke: '#1d4ed8', strokeWidth: 2 }} opacity={1} shape={() => null} />
        </ScatterChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function KMeansResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>Need at least two numeric columns.</p>
  return result.map(({ c1, c2, k, chartData, clusterSizes, note }) => (
    <DownloadCard key={`${c1}-${c2}`} id={`kmeans-${c1}-${c2}`} title={`K-Means — ${c1} vs ${c2}`} {...cardProps}>
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={S.table}>
          <thead><tr>{['Cluster', 'Size', 'Centroid X', 'Centroid Y'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{clusterSizes.map((c, i) => (
            <tr key={c.cluster}>
              <td style={{ ...S.td, fontWeight: 600, color: CLUSTER_COLORS[i] }}>{c.cluster}</td>
              <td style={S.td}>{c.size}</td><td style={S.td}>{c.cx}</td><td style={S.td}>{c.cy}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={S.infoBox('info')}>{note}</div>
      <ResponsiveContainer width="100%" height={330}>
        <ScatterChart margin={{ top: 34, right: 20, bottom: 62, left: 34 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} label={{ value: c1, position: 'bottom', offset: 38, fontSize: 11 }} />
          <YAxis dataKey="y" tick={{ fontSize: 10 }} label={{ value: c2, angle: -90, position: 'insideLeft', offset: -18, fontSize: 11 }} />
          <Tooltip />
          <Legend verticalAlign="top" align="right" height={28} wrapperStyle={{ top: 0, fontSize: '12px' }} />
          {Array.from({ length: k }, (_, i) => (
            <Scatter key={i} name={`Cluster ${i+1}`} data={chartData.filter(d => d.cluster === `Cluster ${i+1}`)} fill={CLUSTER_COLORS[i]} opacity={0.65} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function MovingAvgResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>No numeric column found.</p>
  return result.map(row => (
    <DownloadCard key={row.column} id={`movingavg-${row.column}`} title={`Moving Average — ${row.column} (window=${row.window})`} {...cardProps}>
      <div style={S.infoBox('warn')}>Calculated in current row order. Sort by a real date/time column first for time-series interpretation.</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={row.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="index" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
          <Tooltip /><Legend />
          <Line type="monotone" dataKey="value" stroke="#cbd5e1" dot={false} name="Actual" strokeWidth={1} />
          <Line type="monotone" dataKey="ma" stroke="#1d4ed8" dot={false} name={`MA(${row.window})`} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

function TrendResult({ result, cardProps }) {
  if (!result?.length) return <p style={{ color: '#ef4444' }}>No numeric column found.</p>
  return result.map(row => (
    <DownloadCard key={row.column} id={`trend-${row.column}`} title={`Trend — ${row.column} (${row.direction})`} {...cardProps}>
      <div style={S.infoBox('warn')}>Trend is fitted against row index. Interpret as time trend only if rows are sorted chronologically.</div>
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table style={S.table}>
          <thead><tr>{['Direction', 'Slope', 'R²'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody><tr><td style={S.td}>{row.direction}</td><td style={S.td}>{row.slope}</td><td style={S.td}>{row.r2}</td></tr></tbody>
        </table>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={row.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="index" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
          <Tooltip /><Legend />
          <Line type="monotone" dataKey="value" stroke="#cbd5e1" dot={false} name="Actual" strokeWidth={1} />
          <Line type="monotone" dataKey="trend" stroke="#ef4444" dot={false} name="Trend" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </DownloadCard>
  ))
}

const RESULT_RENDERERS = {
  descriptive: DescriptiveResult, distribution: DistributionResult, boxplot: BoxPlotResult,
  missing: MissingResult, outlier: OutlierResult, frequency: FrequencyResult,
  pearson: PearsonResult, heatmap: HeatmapResult, scatter: ScatterResult,
  ttest: TTestResult, ztest: ZTestResult, anova: AnovaResult, chisquare: ChiSquareResult,
  linear: LinearRegressionResult, multiple: MultipleRegressionResult, logistic: LogisticRegressionResult,
  kmeans: KMeansResult, movingavg: MovingAvgResult, trend: TrendResult,
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [columnTypes, setColumnTypes] = useState({})
  const [selectedColumns, setSelectedColumns] = useState([])
  const [selectedAnalyses, setSelectedAnalyses] = useState([])
  const [results, setResults] = useState(null)
  const [fileName, setFileName] = useState('')
  const [checkedCards, setCheckedCards] = useState({})
  const [cardRefs, setCardRefs] = useState({})
  const [downloading, setDownloading] = useState(false)

  function detectColumnTypes(rows, cols) {
    const types = {}
    cols.forEach(col => {
      const samples = rows.slice(0, 100).map(r => r[col]).filter(v => v !== '' && v != null)
      const numCount = samples.filter(v => !isNaN(Number(v))).length
      const numeric = samples.length > 0 && numCount / samples.length > 0.8
      if (!numeric) {
        types[col] = 'text'
        return
      }
      const allValues = rows.map(r => r[col]).filter(v => v !== '' && v != null)
      const uniqueRatio = new Set(allValues).size / Math.max(allValues.length, 1)
      const looksLikeId = /(^|[_\s-])id($|[_\s-])/i.test(col) || (uniqueRatio > 0.98 && allValues.every(v => Number.isInteger(Number(v))))
      types[col] = looksLikeId ? 'identifier' : 'numeric'
    })
    return types
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name); setResults(null); setSelectedColumns([]); setSelectedAnalyses([]); setCheckedCards({}); setCardRefs({})
    Papa.parse(file, {
      header: true, skipEmptyLines: true, transformHeader: h => h.trim(),
      complete: ({ data: rows }) => {
        const cols = Object.keys(rows[0])
        const types = detectColumnTypes(rows, cols)
        setData(rows); setColumns(cols); setColumnTypes(types)
      }
    })
  }

  function toggleColumn(col) { setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]) }
  function toggleAnalysis(id, available) { if (!available) return; setSelectedAnalyses(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]) }

  function handleCardToggle(id, ref) {
    setCheckedCards(prev => ({ ...prev, [id]: !prev[id] }))
    setCardRefs(prev => ({ ...prev, [id]: ref }))
  }

  function runAnalysis() {
    const output = {}
    if (selectedAnalyses.includes('descriptive')) output.descriptive = computeDescriptive(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('distribution')) output.distribution = computeDistribution(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('boxplot')) output.boxplot = computeBoxPlot(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('missing')) output.missing = computeMissing(data, selectedColumns)
    if (selectedAnalyses.includes('outlier')) output.outlier = computeOutliers(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('frequency')) output.frequency = computeFrequency(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('pearson')) output.pearson = computePearson(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('heatmap')) output.heatmap = computeHeatmap(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('scatter')) output.scatter = computeScatter(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('ttest')) output.ttest = computeTTest(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('ztest')) output.ztest = computeZTest(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('anova')) output.anova = computeAnova(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('chisquare')) output.chisquare = computeChiSquare(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('linear')) output.linear = computeLinearRegression(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('multiple')) output.multiple = computeMultipleRegression(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('logistic')) output.logistic = computeLogisticRegression(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('kmeans')) output.kmeans = computeKMeans(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('movingavg')) output.movingavg = computeMovingAverage(data, selectedColumns, columnTypes)
    if (selectedAnalyses.includes('trend')) output.trend = computeTrend(data, selectedColumns, columnTypes)
    setResults(output)
    setCheckedCards({})
    setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function downloadChecked(format) {
    setDownloading(true)
    const selectedIds = Object.entries(checkedCards).filter(([, v]) => v).map(([k]) => k)
    const zip = new JSZip()

    for (const id of selectedIds) {
      const ref = cardRefs[id]
      const el = ref?.current
      if (!el) continue

      // for heatmap, screenshot just the SVG to avoid whitespace and clipping
      const isHeatmap = id === 'heatmap'
      const target = el
      const label = el.querySelector('[data-export-control="true"]')
      try {
        // hide checkbox label
        
        if (label) label.style.display = 'none'

        if (isHeatmap) {
          const svg = el.querySelector('svg')
          const svgBg = svg.querySelector('rect')
          if (svgBg) svgBg.setAttribute('fill', 'white')
          const svgTexts = svg.querySelectorAll('text')
          svgTexts.forEach(t => { t._origFill = t.getAttribute('fill'); t.setAttribute('fill', '#1e293b') })

          const svgData = new XMLSerializer().serializeToString(svg)
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
          const svgUrl = URL.createObjectURL(svgBlob)

          const img = new Image()
          img.src = svgUrl

          await new Promise((resolve, reject) => {
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width = img.width * 3
              canvas.height = img.height * 3
              const ctx = canvas.getContext('2d')
              ctx.fillStyle = 'white'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              ctx.scale(3, 3)
              ctx.drawImage(img, 0, 0)
              URL.revokeObjectURL(svgUrl)

              const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
              canvas.toBlob(blob => { zip.file(`${id}.${format}`, blob); resolve() }, mimeType, 0.95)
            }
            img.onerror = reject
          })

          if (svgBg) svgBg.setAttribute('fill', 'transparent')
          svgTexts.forEach(t => { t.setAttribute('fill', t._origFill || '') })
        } else {
          // for all other charts: force white background on everything
          const allEls = [target, ...target.querySelectorAll('*')]
          const originalStyles = allEls.map(e => ({
            background: e.style.background,
            backgroundColor: e.style.backgroundColor,
            color: e.style.color,
            border: e.style.border,
            boxShadow: e.style.boxShadow,
          }))

          allEls.forEach(e => {
            e.style.background = 'white'
            e.style.backgroundColor = 'white'
            e.style.color = '#1e293b'
            e.style.boxShadow = ''
            e.style.border = '1px solid #e2e8f0'
          })

          const svgBg = target.querySelector('svg rect')
          if (svgBg) svgBg.setAttribute('fill', 'white')
          const svgTexts = target.querySelectorAll('svg text')
          svgTexts.forEach(t => { t._origFill = t.getAttribute('fill'); t.setAttribute('fill', '#1e293b') })

          const canvas = await html2canvas(target, {
            backgroundColor: '#ffffff',
            scale: 3,
            useCORS: true,
          })

          // restore everything
          allEls.forEach((e, i) => {
            e.style.background = originalStyles[i].background
            e.style.backgroundColor = originalStyles[i].backgroundColor
            e.style.color = originalStyles[i].color
            e.style.boxShadow = originalStyles[i].boxShadow
            e.style.border = originalStyles[i].border
          })
          if (svgBg) svgBg.setAttribute('fill', 'transparent')
          svgTexts.forEach(t => { t.setAttribute('fill', t._origFill || '') })

          const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
          const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, 0.95))
          zip.file(`${id}.${format}`, blob)
        }

        // restore checkbox label
        if (label) label.style.display = ''

      } catch (err) {
        console.error(`Failed: ${id}`, err)
        const label = el?.querySelector('[data-export-control="true"]')
        if (label) label.style.display = ''
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analysis-charts.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloading(false)
  }

  const checkedCount = Object.values(checkedCards).filter(Boolean).length
  const numericCount = Object.values(columnTypes).filter(t => t === 'numeric').length
  const textCount = Object.values(columnTypes).filter(t => t === 'text').length
  const cardProps = { checkedMap: checkedCards, onToggle: handleCardToggle }

  return (
    <div style={S.app}>
      <style>{`
        .dl-checkbox-label {
          position: absolute; top: 10px; right: 10px;
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #bfdbfe; cursor: pointer;
          background: rgba(15, 23, 42, 0.9);
          padding: 4px 9px; border-radius: 6px;
          border: 1px solid rgba(125, 211, 252, 0.3);
          z-index: 2; user-select: none;
          transition: all 0.2s ease;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.08);
        }
        .dl-checkbox-label:hover {
          background: rgba(14, 165, 233, 0.22);
          border-color: rgba(103, 232, 249, 0.8);
          color: #e0f2fe;
          box-shadow: 0 0 18px rgba(34, 211, 238, 0.28);
          transform: scale(1.05);
        }
        .dl-checkbox-label:active {
          transform: scale(0.97);
        }
        .dl-checkbox-label input[type="checkbox"] {
          width: 13px; height: 13px;
          accent-color: #22d3ee;
          cursor: pointer;
        }

        .zip-btn {
          padding: 8px 18px; border-radius: 7px;
          font-size: 13px; font-weight: 800; color: white;
          cursor: pointer; transition: all 0.2s ease;
          position: relative; overflow: hidden;
        }
        .zip-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.15s ease;
        }
        .zip-btn:hover::after { background: rgba(255,255,255,0.12); }
        .zip-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important; }
        .zip-btn:active { transform: translateY(0px) scale(0.97); }
        .zip-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .clear-btn {
          padding: 8px 16px; border-radius: 7px; font-size: 13px;
          border: 1px solid rgba(125, 211, 252, 0.36);
          background: rgba(15, 23, 42, 0.4); color: #e0f2fe;
          cursor: pointer; transition: all 0.2s ease;
        }
        .clear-btn:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.6);
          color: #fca5a5;
          transform: translateY(-1px);
        }
        .clear-btn:active { transform: scale(0.97); }
      `}</style>
      <div style={S.header}>
        <div>
          <h1 style={S.headerTitle}>Data Analysis Studio</h1>
          <p style={S.headerSub}>Upload a CSV and run statistical analyses instantly</p>
        </div>
      </div>

      <div style={S.main}>
        {/* Upload */}
        <div style={S.card}>
          <h2 style={S.cardTitle}>Upload Dataset</h2>
          <div style={{
            border: '1px dashed rgba(103, 232, 249, 0.55)',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.13), rgba(124, 58, 237, 0.12))',
            boxShadow: '0 0 26px rgba(34, 211, 238, 0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
          }} onClick={() => document.getElementById('csv-input').click()}>
            <input type="file" id="csv-input" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
            <div style={{ fontSize: '32px', marginBottom: '8px', filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.55))' }}>📂</div>
            <div style={{ fontWeight: 800, marginBottom: '4px', color: '#e0f2fe', textShadow: '0 0 18px rgba(34, 211, 238, 0.26)' }}>{fileName || 'Click to upload a CSV file'}</div>
            <div style={{ fontSize: '13px', color: '#93c5fd' }}>
              {data.length > 0 ? `${data.length.toLocaleString()} rows · ${columns.length} columns · ${numericCount} numeric · ${textCount} text` : 'Supports .csv files'}
            </div>
          </div>
        </div>

        {/* Column selector */}
        {data.length > 0 && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>Select Columns to Analyse</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {columns.map(col => (
                <label key={col} style={{
                  ...S.checkLabel,
                  background: selectedColumns.includes(col) ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.24), rgba(124, 58, 237, 0.18))' : S.checkLabel.background,
                  borderColor: selectedColumns.includes(col) ? 'rgba(103, 232, 249, 0.8)' : 'rgba(125, 211, 252, 0.22)',
                  boxShadow: selectedColumns.includes(col) ? '0 0 18px rgba(34, 211, 238, 0.18)' : S.checkLabel.boxShadow,
                }}>
                  <input type="checkbox" checked={selectedColumns.includes(col)} onChange={() => toggleColumn(col)} style={{ accentColor: '#1d4ed8' }} />
                  <span title={col}>{shortName(col, 20)}</span>
                  <span style={S.badge(columnTypes[col] === 'numeric' ? 'blue' : columnTypes[col] === 'identifier' ? 'gray' : 'pink')}>{columnTypes[col]}</span>
                </label>
              ))}
            </div>
            {selectedColumns.length > 0 && <p style={{ marginTop: '10px', fontSize: '13px', color: '#93c5fd' }}>{selectedColumns.length} column{selectedColumns.length > 1 ? 's' : ''} selected</p>}
          </div>
        )}

        {/* Analysis selector */}
        {selectedColumns.length > 0 && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>Select Analyses</h2>
            {ANALYSIS_GROUPS.map(group => (
              <div key={group.group}>
                <p style={S.groupLabel}>{group.group}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  {group.options.map(option => {
                    const available = option.check(columns, columnTypes, data)
                    const selected = selectedAnalyses.includes(option.id)
                    return (
                      <button key={option.id} onClick={() => toggleAnalysis(option.id, available)} title={!available ? option.reason : option.label} style={S.analysisBtn(selected, available)}>
                        {selected && '✓ '}{option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {selectedAnalyses.length > 0 && (
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={runAnalysis} style={S.runBtn}>Run {selectedAnalyses.length} Analysis{selectedAnalyses.length > 1 ? 'es' : ''}</button>
                <span style={{ fontSize: '13px', color: '#93c5fd' }}>on {selectedColumns.length} column{selectedColumns.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {results && (
          <div id="results-section" style={S.card}>
            <h2 style={S.cardTitle}>Results</h2>
            <p style={{ fontSize: '13px', color: '#93c5fd', marginBottom: '1rem' }}>Tick the <strong style={{ color: '#e0f2fe' }}>Download</strong> checkbox on any chart or table to select it for download.</p>
            {selectedAnalyses.map(analysisId => {
              const Renderer = RESULT_RENDERERS[analysisId]
              if (!Renderer || !results[analysisId]) return null
              return (
                <div key={analysisId} style={{ ...S.sectionDivider }}>
                  <p style={S.resultTitle}>{ANALYSIS_LABELS[analysisId]}</p>
                  <Renderer
                    result={results[analysisId]}
                    cardProps={cardProps}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Preview Table */}
        {data.length > 0 && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>Data Preview (first 10 rows)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead><tr>{columns.map(col => <th key={col} style={{ ...S.th, ...S.wrapCell }}>{col}</th>)}</tr></thead>
                <tbody>{data.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(15, 23, 42, 0.52)' : 'rgba(30, 41, 59, 0.52)' }}>
                    {columns.map(col => <td key={col} style={S.td} title={row[col]}>{row[col]}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Floating Download Bar */}
      {checkedCount > 0 && (
        <div style={S.floatingBar}>
          <span style={{ fontSize: '14px' }}>
            <strong>{checkedCount}</strong> item{checkedCount > 1 ? 's' : ''} selected for download
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setCheckedCards({})} className="clear-btn">
              Clear
            </button>
            <button onClick={() => downloadChecked('png')} disabled={downloading} className="zip-btn" style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)', border: '1px solid rgba(103, 232, 249, 0.5)', boxShadow: '0 0 18px rgba(37, 99, 235, 0.32)' }}>
              {downloading ? 'Processing…' : 'PNG ZIP'}
            </button>
            <button onClick={() => downloadChecked('jpg')} disabled={downloading} className="zip-btn" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', border: '1px solid rgba(216, 180, 254, 0.5)', boxShadow: '0 0 18px rgba(124, 58, 237, 0.32)' }}>
              {downloading ? 'Processing…' : 'JPG ZIP'}
            </button>
            <button onClick={() => downloadChecked('svg')} disabled={downloading} className="zip-btn" style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)', border: '1px solid rgba(103, 232, 249, 0.5)', boxShadow: '0 0 18px rgba(34, 211, 238, 0.3)' }}>
              {downloading ? 'Processing…' : 'SVG ZIP'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
