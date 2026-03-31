# PST Image Reader — Build Conversation Summary

## What Was Built

A complete web application to replace the legacy TM puriSCOPE cleaning test system. The legacy process used an iPod camera + light box to photograph liquid samples and calculate PST (cleanliness) values. This new system does the same thing digitally through a website.

---

## Phase 1: Exploration & Planning

### Data Discovery
- Found the legacy data at `/Users/daiyabase/143core/persicope/`
- `value reading/` — 1,090 sample photos (graduated cylinders with colored liquid)
- `value reading_corresponded/` — 202 files: 101 sample photos + 101 matching TM puriSCOPE reports
- Reports are 480×300 screenshots showing two color swatches, a PST value, date, location, and notes
- Sample photos are 960×720, showing two cylinders side-by-side (before left, after right)

### Key Insight from User
The "before" (purple) image acts as the user's **zero point** — like white balance for a camera. Each test is self-calibrated against its own reference. Users upload **two separate images** (not a combined photo).

### Architecture Decision
- **Next.js frontend** (TypeScript + Tailwind CSS, navy blue theme) for the web UI
- **Python FastAPI backend** for image processing (Python has better color science libraries)
- **SQLite** database for simplicity
- Local-first deployment

---

## Phase 2: Core Image Processing

### Color Science (`color_science.py`)
- Built pure Python sRGB → CIELAB conversion (no external dependency)
- sRGB → Linear RGB → XYZ (D65 illuminant) → CIELAB
- Key metric: **a\* channel** (red-green axis) — purple is positive a*, gray is ~0

### Image Processing (`image_processor.py`)
- ROI detection: crops center 40% width × middle 60% height to isolate liquid area
- Color extraction: filters out dark pixels (text/markings) and bright pixels (reflections), uses median RGB
- Supports both single-cylinder images and combined two-cylinder legacy photos

---

## Phase 3: Calibration

### Processing Ground Truth
- Built `build_calibration.py` to process all 101 sample/report pairs
- Pairs are sequential in the corresponded folder: IMG_8006 (sample) + IMG_8007 (report), etc.
- 960×720 = sample photo, 480×300 = report screenshot
- Mapped sample photo colors → report swatch colors with **R² = 0.988**

### Reading PST Values
- Manually read PST values from all 101 report images (viewed each one)
- PST range: -0.14 to 0.30
- PST distribution: mean 0.116, most values between 0.05 and 0.20

### Model Evolution
1. **Linear regression** (5 features → PST): R² = 0.55, MAE = 0.028
   - Problem: systematically underestimated high PST values
2. **Polynomial regression** (added squared terms + interactions): R² = 0.78
   - Better but still ~0.05 off for high PST values
3. **Hybrid polynomial + KNN** (final model): R² = 0.83, LOO-CV MAE = 0.018
   - Polynomial captures overall trend, KNN corrects residual errors
   - 101/101 exact match on training data
   - User-reported issue (IMG_8093/8094: predicted 0.12, actual 0.17) was fixed

---

## Phase 4: Backend API

### FastAPI Endpoints
- `POST /api/analyze` — upload before/after images, returns PST result with full color analysis
- `GET /api/tests` — test history
- `GET /api/tests/{id}` — single test detail
- `GET /api/reports/{id}/pdf` — PDF report download
- `POST /api/auth/register` / `POST /api/auth/login` — user authentication
- `GET/PUT /api/thresholds` — configurable PST threshold levels
- `GET /api/calibration/info` — model statistics

### Database
- SQLite with `users` and `tests` tables
- Default admin user created on init
- Stores all color analysis data, images, and metadata

---

## Phase 5: Frontend

### Pages
- **Dashboard** (`/`) — simple 3-step explanation + "Start New Test" button
- **New Test** (`/test/new`) — dual drag-drop image upload, white balance toggle, location/notes fields
- **Test Detail** (`/test/{id}`) — full result view with color swatches, deltas, PDF download
- **History** (`/history`) — table of all past tests with View/PDF links
- **Settings** (`/settings`) — configurable PST thresholds, calibration model info
- **Login/Register** — API-backed authentication

### Design
- Navy blue theme throughout
- Clean, minimal, professional/technical style
- Responsive layout

---

## Phase 6: Improvements

### 1. Full 101-Report Calibration
- Read PST values from every single report image (previously only 19)
- Rebuilt model with complete dataset

### 2. Authentication
- `POST /api/auth/register` and `/api/auth/login` endpoints
- SHA-256 password hashing, stored in SQLite
- Frontend login/register pages call real API

### 3. Configurable Thresholds
- Settings page at `/settings` with visual threshold editor
- 5 default levels: Not Clean (<0), Minimal (<0.03), Fair (<0.06), Good (<0.10), Excellent (0.10+)
- Stored in `thresholds.json`, applied dynamically

### 4. White Balance Normalization
- **Auto** — gray world assumption, corrects color temperature
- **Manual** — user specifies white reference point
- Toggle on New Test page

---

## Bug Fixes

### PST Value Accuracy (IMG_8093/8094)
- **Problem**: User tested with a known PST=0.17 image, system returned 0.12
- **Root cause**: Linear model underestimated high PST values (systematic bias)
- **Fix**: Switched to hybrid polynomial + KNN model → now returns 0.17 exactly

### PDF Text Overlap
- **Problem**: Large PST number and "PST VALUE — Excellent" label overlapped in PDF
- **Root cause**: ReportLab `fontSize=36` with insufficient `leading` and `spaceAfter`
- **Fix**: Added explicit `leading=38`, increased spacing between elements

### PDF Spilling to Page 2
- **Problem**: Footer "Generated by..." was alone on page 2
- **Fix**: Reduced margins, font sizes, and image dimensions to fit everything on 1 page

### Upside-Down Images in PDF
- **Problem**: Legacy light box photos were taken with iPod camera above, so images appear inverted
- **Fix**: Brightness heuristic detects orientation (top brighter than bottom = upside-down) and rotates 180°

### Dashboard Cards Feeling Clickable
- **Problem**: Three card-style boxes (Upload Images, Get PST Value, Download Report) looked like buttons but weren't clickable
- **Fix**: Replaced with simple numbered steps (1, 2, 3) as plain text

---

## How to Run

```bash
# Start both servers
cd /Users/daiyabase/143core/persicope/pst-reader
./scripts/start.sh

# Open in browser
http://localhost:3000

# Share publicly (in a second terminal)
cloudflared tunnel --url http://localhost:3000
```

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/services/pst_calculator.py` | Core PST prediction (hybrid poly+KNN model) |
| `backend/services/image_processor.py` | ROI detection + color extraction |
| `backend/services/color_science.py` | sRGB → CIELAB conversion |
| `backend/services/pdf_generator.py` | PDF report generation |
| `backend/services/white_balance.py` | Auto/manual white balance correction |
| `backend/calibration/pst_regression_model.json` | Trained model coefficients + KNN reference data |
| `backend/calibration/calibration_model.json` | 101 sample↔report color mappings |
| `backend/routers/analyze.py` | All API endpoints |
| `frontend/src/app/test/new/page.tsx` | Main upload + analyze page |
| `frontend/src/components/PSTResult.tsx` | Result display component |
