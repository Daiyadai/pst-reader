# PST Image Reader

A web-based tool that replaces the legacy TM puriSCOPE system (iPod + light box) for measuring cleaning effectiveness. Users upload before/after images of liquid samples, and the system automatically calculates a standardized PST (puriSCOPE Test) value.

## Quick Start

```bash
cd /Users/daiyabase/143core/persicope/pst-reader
./scripts/start.sh
```

Then open **http://localhost:3000** in your browser.

To share with others (public URL):
```bash
# In a second terminal:
cloudflared tunnel --url http://localhost:3000
```

## How It Works

1. **Upload** — User uploads two images: a reference (before cleaning, purple) and a result (after cleaning, lighter)
2. **Analyze** — System extracts liquid color from each image using ROI detection, converts RGB to CIELAB color space
3. **Calculate** — A hybrid polynomial + KNN model (trained on 101 legacy reports) predicts the PST value from the color difference
4. **Report** — Results are displayed on screen and can be downloaded as a professional PDF report

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + React 19 + Tailwind CSS | Navy blue themed web UI |
| Backend | Python FastAPI | Image processing, color science, PDF generation |
| Database | SQLite | User accounts, test history |
| Image Processing | Pillow + NumPy | ROI detection, color extraction |
| Color Science | Pure Python sRGB → CIELAB | No external color library needed |
| PDF Reports | ReportLab | Professional downloadable reports |

## Project Structure

```
pst-reader/
├── frontend/                       # Next.js app (port 3000)
│   └── src/
│       ├── app/
│       │   ├── page.tsx            # Dashboard
│       │   ├── test/new/page.tsx   # Upload + analyze
│       │   ├── test/[id]/page.tsx  # Single result view
│       │   ├── history/page.tsx    # Past tests
│       │   ├── settings/page.tsx   # Threshold configuration
│       │   ├── login/page.tsx      # Login
│       │   └── register/page.tsx   # Register
│       └── components/
│           ├── Header.tsx          # Navigation bar
│           ├── ImageUploader.tsx   # Drag-drop upload
│           └── PSTResult.tsx       # Result display card
│
├── backend/                        # FastAPI (port 8000)
│   ├── main.py                     # App entry point + CORS
│   ├── database.py                 # SQLite setup
│   ├── routers/
│   │   ├── analyze.py              # /api/analyze, /api/tests, /api/auth, /api/thresholds
│   │   └── reports.py              # /api/reports/{id}/pdf
│   ├── services/
│   │   ├── image_processor.py      # ROI detection + color extraction
│   │   ├── color_science.py        # sRGB → CIELAB conversion
│   │   ├── pst_calculator.py       # Hybrid poly+KNN PST prediction
│   │   ├── white_balance.py        # Auto/manual white balance correction
│   │   └── pdf_generator.py        # PDF report generation
│   └── calibration/
│       ├── build_calibration.py    # Process ground truth pairs
│       ├── calibration_model.json  # Sample↔report color mapping (R²=0.988)
│       └── pst_regression_model.json # PST prediction model (101 samples)
│
├── data/pst_reader.db              # SQLite database
└── scripts/
    └── start.sh                    # Start both servers
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Upload before/after images, get PST result |
| GET | `/api/tests` | List test history |
| GET | `/api/tests/{id}` | Get single test details |
| GET | `/api/reports/{id}/pdf` | Download PDF report |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/thresholds` | Get PST threshold config |
| PUT | `/api/thresholds` | Update thresholds |
| GET | `/api/calibration/info` | Model info (R², sample count) |
| GET | `/api/health` | Health check |

## PST Calculation

The PST value measures cleaning effectiveness by comparing the color shift between a reference purple solution and the cleaned result:

- **Before image**: Reference purple sample (baseline / "zero point")
- **After image**: Result after cleaning (lighter = cleaner)
- **Key metric**: The a* channel in CIELAB color space (purple → gray shift)

### Model: Hybrid Polynomial + KNN

1. **Polynomial regression** captures the overall trend between color features and PST
2. **K-nearest-neighbors correction** fixes residual errors by comparing against 101 calibration samples
3. **Result**: 101/101 exact matches on ground truth data; LOO-CV MAE = 0.018

### Calibration Data

- 101 paired samples from `/Users/daiyabase/143core/persicope/value reading_corresponded/`
- Each pair: sample photo (960×720) + TM puriSCOPE report (480×300)
- PST values manually read from all 101 report images
- PST range in dataset: -0.14 to 0.30

## Features

- **Dual image upload** with drag-and-drop
- **Instant PST calculation** with color analysis details
- **White balance correction** (auto or manual) for non-lightbox photos
- **Configurable thresholds** — define what PST values mean "clean" vs "not clean"
- **User accounts** with email/password authentication
- **Test history** — view and manage past results
- **PDF reports** — professional downloadable reports with images and color data
- **Auto image rotation** — corrects upside-down legacy photos

## Dependencies

### Python
```
fastapi, uvicorn, pillow, numpy, reportlab, python-multipart, aiosqlite
```

### Node.js
```
next, react, tailwindcss
```

Install: `pip install -r backend/requirements.txt` and `cd frontend && npm install`
