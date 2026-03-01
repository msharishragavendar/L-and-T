# DESA — Dynamic Engineering & Site Automation System

> AI-powered construction site management dashboard integrating generative design, live sensor monitoring, automated recalibration, risk prediction, and system integration — all in one control-room interface.

![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-Backend-lightgrey?logo=flask)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-orange?logo=google)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🏗️ Overview

**DESA** is a web-based prototype dashboard that simulates an intelligent control room for managing construction projects in real-time. It demonstrates how AI and live data can transform construction site operations — from structural design generation to safety monitoring and risk mitigation.

### Key Highlights
- 🧠 **AI-Powered Design** — Google Gemini generates context-aware structural variants based on site parameters
- 📡 **Live Sensor Dashboard** — Real-time monitoring of 4 sensor types with historical charting
- ⚙️ **Auto-Recalibration** — AI-triggered design adjustments when sensor anomalies are detected
- 📊 **Risk Prediction** — Schedule variance tracking with probability-based risk assessment
- 🔗 **Integration Hub** — Connectivity status for BIM, IoT, Weather, and Material systems
- 🎨 **Animated Canvas Visualizations** — 8 unique structural drawings with vibrant color schemes

---

## 📸 Modules

### Module 1 — Generative Design Studio
Input site parameters (dimensions, soil type, load capacity, floors, budget) and an optional text prompt. The system generates 3–5 optimized structural design variants with animated canvas previews.

**Supported Structural Types:**
| Variant | Canvas Visualization |
|---|---|
| Cantilever Optimized | Cyan tower + orange cantilever with golden glow nodes |
| Deep Foundation Pro | Blue building + golden piles + purple underground zone |
| Hybrid Frame Alpha | Amber columns + teal beams + emerald cross-bracing |
| Tensile Mesh Beta | Indigo core + animated magenta/purple cables |
| Arch Rib Gamma | Teal-cyan gradient arches + golden hangers + emerald deck |
| Box Girder Delta | 3D isometric with teal/magenta/indigo faces |
| Modular Truss Epsilon | Rainbow hue-shifted modules with glow nodes |
| Shell Structure Zeta | Green-teal curved shell + orange ribs |

### Module 2 — Live Site Sensor Dashboard
Monitors **Soil Pressure**, **Temperature**, **Structural Load**, and **Moisture** with color-coded status indicators (normal/warning/critical) and Chart.js historical graphs. Data auto-refreshes every 2 seconds.

### Module 3 — Design Recalibration Engine
AI generates real-time recalibration alerts when sensor thresholds are breached (e.g., *"Soil Pressure exceeded 200 kPa → Increase footing depth to 2.4m"*). Engineers can **Accept** or **Reject** recommendations, with all decisions tracked in an audit log.

### Module 4 — Simulation & Risk Predictor
Displays predicted vs. actual project progress, identifies risks (Delay, Cost Overrun, Material Shortage) with severity/probability ratings, and summarizes AI-driven savings (cost, time, rework avoided).

### Module 5 — Integration Hub
Shows connectivity status of external data sources: **BIM Model Server** (Autodesk BIM 360), **IoT Sensor Network** (LoRaWAN), **Weather API** (OpenWeather Pro), and **Material Database** (SAP S/4HANA).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3 + Flask |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| AI | Google Gemini 1.5 Flash |
| Charts | Chart.js 4.4.1 |
| Canvas | HTML5 Canvas API |
| Fonts | JetBrains Mono, Inter |

---

## 📁 Project Structure

```
DESA/
├── app.py                    # Flask server — routes & API endpoints
├── requirements.txt          # Python dependencies
├── data/
│   ├── mock_data.py          # Simulated sensor, design, risk & integration data
│   └── gemini_design.py      # Google Gemini AI design generator
├── templates/
│   └── index.html            # Single-page dashboard UI
└── static/
    ├── css/
    │   └── style.css         # Dark theme styling (1800+ lines)
    └── js/
        └── script.js         # Frontend logic & canvas rendering (1100+ lines)
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/msharishragavendar/L-and-T.git
cd L-and-T

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

The app starts at **http://localhost:5000**

### Using Gemini AI (Optional)

For AI-powered design generation, provide a Google Gemini API key:

1. Get a free key from [aistudio.google.com](https://aistudio.google.com)
2. Enter it in the **Gemini API Key** field on the dashboard
3. Or set the environment variable:
   ```bash
   set GEMINI_API_KEY=your_key_here   # Windows
   export GEMINI_API_KEY=your_key_here # Linux/Mac
   ```

> Without a key, the system uses a parameter-aware simulation engine as fallback.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the dashboard |
| `GET` | `/api/sensors` | Sensor readings + 24h history |
| `POST` | `/api/generate-design` | Generate structural design variants |
| `GET` | `/api/recalibrations` | Get recalibration alert + audit log |
| `POST` | `/api/recalibrations/action` | Accept/reject a recalibration |
| `GET` | `/api/risks` | Risk predictions + savings summary |
| `GET` | `/api/integrations` | Integration source statuses |

---

## 🎨 Design

- **Theme**: Dark industrial control-room aesthetic
- **Accent Colors**: Cyan, Amber, Emerald, Purple, Pink
- **Effects**: Glassmorphism cards, animated canvas, gradient fills, radial glow effects
- **Live Clock** + **System Online** indicator

---

## 📝 Notes

- All sensor data, risks, and integrations are **simulated** — this is a prototype dashboard
- Audit log is **in-memory** (resets on server restart)
- The mock design generator is **parameter-aware** — variant selection, materials, scores, and costs all respond to your input parameters

---

## 👤 Author

**M Sharish Ragavendar**

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
