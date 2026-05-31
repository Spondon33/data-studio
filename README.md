# 📊 Data Analysis Studio

A powerful no-code desktop application for statistical data analysis. Upload any CSV dataset, select your columns and analyses, and get interactive charts and tables instantly — no Python, no coding required.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue)
![Built With](https://img.shields.io/badge/built%20with-React%20%2B%20Electron-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Upload any CSV** — auto-detects column types (numeric vs text)
- **19 statistical analyses** across 6 categories
- **Interactive charts** — histograms, scatter plots, box plots, heatmaps, regression lines, and more
- **Per-chart downloads** — select individual charts and download as PNG, JPG, or SVG in a zip file
- **Futuristic dark UI** — clean, responsive, and fast
- **No internet required** — runs fully offline as a desktop app

---

## 📈 Analyses Available

**Descriptive**
- Descriptive Statistics, Distribution, Box Plot, Frequency Count, Missing Values, Outlier Detection

**Correlation & Relationships**
- Pearson Correlation, Correlation Heatmap, Scatter Plot

**Statistical Tests**
- T-Test, Z-Test, ANOVA, Chi-Square Test

**Regression**
- Linear Regression, Multiple Regression, Logistic Regression

**Clustering**
- K-Means Clustering

**Time Series**
- Moving Average, Trend Decomposition

---

## 🖥️ Download

Download the latest version from the [Actions tab](../../actions) — click the latest successful workflow run and download the artifact for your platform:

- **macOS** → `mac-dmg`
- **Windows** → `windows-exe`

### macOS Installation
1. Download and unzip `mac-dmg`
2. Open the `.dmg` file
3. Drag the app to your Applications folder
4. Right-click → Open (first time only, since the app is unsigned)

### Windows Installation
1. Download and unzip `windows-exe`
2. Run the `.exe` installer
3. Follow the installation steps

---

## 🛠️ Built With

- **React** — UI framework
- **Electron** — desktop app wrapper
- **Vite** — build tool
- **Recharts** — interactive charts
- **D3.js** — SVG box plots and heatmaps
- **simple-statistics** — statistical computations
- **Papa Parse** — CSV parsing
- **JSZip** — chart export bundling
- **html2canvas** — chart screenshot export

---

## 🚀 Run Locally

Make sure you have **Node.js 20+** installed.

```bash
# Clone the repo
git clone https://github.com/YOURUSERNAME/data-studio.git
cd data-studio

# Install dependencies
npm install

# Start in development mode
npm run dev

# Build and package as desktop app
npm run build
npm run make
```

---

## 📁 Project Structure

```
data-studio/
├── src/
│   └── App.jsx          # Main application
├── assets/
│   ├── icon.icns        # macOS app icon
│   └── icon.ico         # Windows app icon
├── main.cjs             # Electron entry point
├── forge.config.cjs     # Electron Forge config
└── vite.config.js       # Vite build config
```

---

## 📝 License

MIT — free to use, modify, and share.

---

*Developed with AI assistance*
