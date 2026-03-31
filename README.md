# PST Image Reader

A web-based tool that replaces the legacy TM puriSCOPE system (iPod + light box) for measuring cleaning effectiveness. Users upload a single photo of standard and test sample cylinders, and the system automatically calculates a standardized PST (puriSCOPE Test) value.

## Live Demo

**https://pst-reader.onrender.com**

## Local Development

```bash
cd /Users/daiyabase/143core/persicope/pst-reader
./scripts/start.sh
```

Then open **http://localhost:3000** in your browser.

To share locally via public URL:
```bash
# In a second terminal:
cloudflared tunnel --url http://localhost:3000
```

## How It Works

1. **Upload** — User uploads one photo containing both cylinders (standard on left, test sample on right)
2. **Analyze** — System auto-splits the image, extracts liquid color via ROI detection, converts RGB to CIELAB color space
3. **Calculate** — A hybrid polynomial + KNN model (trained on 101 legacy reports) predicts the PST value
4. **Report** — Results displayed on screen and downloadable as a multilingual PDF report

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + React 19 + Tailwind CSS | Navy blue themed web UI |
| Backend | Python FastAPI | Image processing, color science, PDF generation |
| Database | SQLite | User accounts, test history |
| Image Processing | Pillow + NumPy | ROI detection, color extraction |
| Color Science | Pure Python sRGB → CIELAB | No external color library needed |
| PDF Reports | ReportLab + Noto Sans SC font | Multilingual professional reports |
| i18n | Custom React context | English, Chinese, German |
| Deployment | Docker + Render.com | Free hosted at onrender.com |

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
│       ├── components/
│       │   ├── Header.tsx          # Navigation + language switcher
│       │   ├── ImageUploader.tsx   # File upload component
│       │   └── PSTResult.tsx       # Result display card
│       └── lib/
│           ├── i18n.ts             # All translations (EN/ZH/DE)
│           └── LanguageContext.tsx  # Language state provider
│
├── backend/                        # FastAPI (port 8000)
│   ├── main.py                     # App entry point + CORS
│   ├── database.py                 # SQLite setup
│   ├── routers/
│   │   ├── analyze.py              # /api/analyze, /api/tests, /api/auth, /api/thresholds
│   │   └── reports.py              # /api/reports/{id}/pdf?lang=en|zh|de
│   ├── services/
│   │   ├── image_processor.py      # ROI detection + color extraction
│   │   ├── color_science.py        # sRGB → CIELAB conversion
│   │   ├── pst_calculator.py       # Hybrid poly+KNN PST prediction
│   │   ├── white_balance.py        # Auto/manual white balance correction
│   │   └── pdf_generator.py        # Multilingual PDF report generation
│   ├── fonts/
│   │   └── NotoSansSC-Regular.ttf  # Chinese font for PDFs
│   └── calibration/
│       ├── build_calibration.py    # Process ground truth pairs
│       ├── calibration_model.json  # Sample↔report color mapping (R²=0.988)
│       └── pst_regression_model.json # Hybrid poly+KNN model (101 samples)
│
├── Dockerfile                      # Docker build for deployment
├── render.yaml                     # Render.com config
├── data/pst_reader.db              # SQLite database
└── scripts/
    ├── start.sh                    # Local dev: build + start both servers
    └── start-prod.sh              # Production startup (used by Docker)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze-combined` | Upload single combined image, get PST result |
| POST | `/api/analyze` | Upload two separate images, get PST result |
| GET | `/api/tests` | List test history |
| GET | `/api/tests/{id}` | Get single test details |
| GET | `/api/reports/{id}/pdf?lang=en` | Download PDF report (en/zh/de) |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/thresholds` | Get PST threshold config |
| PUT | `/api/thresholds` | Update thresholds |
| GET | `/api/calibration/info` | Model info (R², sample count) |
| GET | `/api/health` | Health check |

## PST Calculation

The PST value measures cleaning effectiveness by comparing the color shift between a reference standard solution and the test sample:

- **Standard (left)**: Reference purple solution (baseline / "zero point")
- **Test sample (right)**: Result to be measured (lighter = cleaner)
- **Key metric**: The a* channel in CIELAB color space (purple → gray shift)

### Model: Hybrid Polynomial + KNN

1. **Polynomial regression** captures the overall trend between color features and PST
2. **K-nearest-neighbors correction** fixes residual errors by comparing against 101 calibration samples
3. **Result**: 101/101 exact matches on ground truth data; LOO-CV MAE = 0.018

### Calibration Data

- 101 paired samples from `value reading_corresponded/`
- Each pair: sample photo (960×720) + TM puriSCOPE report (480×300)
- PST values manually read from all 101 report images
- PST range in dataset: -0.14 to 0.30

## Features

- **Single image upload** — one photo with both cylinders, auto-split into standard + sample
- **Instant PST calculation** with color analysis details (LAB, delta a*, delta E)
- **Multilingual** — English, Chinese, German (UI + PDF reports)
- **Configurable thresholds** — define what PST values mean "clean" vs "not clean"
- **User accounts** with email/password authentication
- **Test history** — view and manage past results
- **PDF reports** — professional multilingual reports with images, color data, and Chinese font support
- **Auto image rotation** — corrects upside-down legacy photos
- **Deployed** — live at https://pst-reader.onrender.com

## Deployment

Deployed on Render.com via Docker. Auto-deploys on push to GitHub.

```bash
# Push changes to trigger redeploy:
git add -A && git commit -m "update" && git push
```

## Dependencies

### Python
```
fastapi, uvicorn, pillow, numpy, reportlab, python-multipart, aiosqlite
```

### Node.js
```
next, react, tailwindcss
```
