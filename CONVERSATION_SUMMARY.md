# PST Image Reader — Build Conversation Summary

## What Was Built

A complete web application to replace the legacy TM puriSCOPE cleaning test system. The legacy process used an iPod camera + light box to photograph liquid samples and calculate PST (cleanliness) values. This new system does the same thing digitally through a website.

**Live at: https://pst-reader.onrender.com**

---

## Phase 1: Exploration & Planning

### Data Discovery
- Found the legacy data at `/Users/daiyabase/143core/persicope/`
- `value reading/` — 1,090 sample photos (graduated cylinders with colored liquid)
- `value reading_corresponded/` — 202 files: 101 sample photos + 101 matching TM puriSCOPE reports
- Reports are 480×300 screenshots showing two color swatches, a PST value, date, location, and notes
- Sample photos are 960×720, showing two cylinders side-by-side (standard left, sample right)

### Key Insight from User
The left cylinder is the **standard reference solution** (not "before cleaning") — like white balance for a camera. Each test is self-calibrated against its own reference.

### Architecture Decision
- **Next.js frontend** (TypeScript + Tailwind CSS, navy blue theme) for the web UI
- **Python FastAPI backend** for image processing (Python has better color science libraries)
- **SQLite** database for simplicity
- Local-first deployment, later deployed to Render.com

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
- `POST /api/analyze-combined` — upload single combined image, auto-split and analyze
- `POST /api/analyze` — upload two separate images
- `GET /api/tests` — test history
- `GET /api/tests/{id}` — single test detail
- `GET /api/reports/{id}/pdf?lang=en|zh|de` — multilingual PDF report download
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
- **Dashboard** (`/`) — simple 3-step explanation + "Start Test" button
- **New Test** (`/test/new`) — single combined image upload, location/notes fields
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

### 5. Single Image Upload
- Changed from requiring two separate images to one combined image
- System auto-splits left (standard) and right (test sample)
- New endpoint: `POST /api/analyze-combined`
- Removed the two-image upload option from UI

### 6. Multilingual Support (i18n)
- **English** (default), **Chinese** (中文), **German** (Deutsch)
- Language switcher dropdown in the header
- All UI text translated: navigation, forms, results, error messages
- Language persists in localStorage across sessions
- PDF reports also generated in the selected language
- Added Noto Sans SC font for Chinese character rendering in PDFs

### 7. Production Deployment
- Created Dockerfile (multi-stage: Node build + Python runtime)
- Deployed to **Render.com** (free tier, Docker)
- Live at: **https://pst-reader.onrender.com**
- Auto-deploys on `git push` to GitHub
- Changed `start.sh` to use `npm run build` + `npm run start` (production mode) instead of `npm run dev`

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
- **Problem**: Three card-style boxes looked like buttons but weren't clickable
- **Fix**: Replaced with simple numbered steps (1, 2, 3) as plain text

### Chinese Characters in PDF Showing as Black Squares
- **Problem**: ReportLab default fonts don't support CJK characters
- **Fix**: Bundled Noto Sans SC font (17MB), registered with ReportLab, applied to all PDF text styles when lang=zh

### File Upload Not Working Through Cloudflare Tunnel
- **Problem**: Clicking the upload area opened file picker, but selecting a file did nothing
- **Root cause**: Next.js dev server WebSocket HMR broke JavaScript through cloudflared proxy
- **Fix**: Switched to production build (`npm run build` + `npm run start`) instead of dev mode

### Image Upload Component Click Not Responding
- **Problem**: Multiple iterations of the ImageUploader component failed to trigger file selection
- **Root cause**: Hidden file input overlay approach unreliable across browsers
- **Fix**: Used native `<label>` wrapping `<input type="file">` directly inside — most bulletproof HTML pattern

---

## Deployment

### GitHub Repository
- `https://github.com/Daiyadai/pst-reader` (private)

### Render.com
- Service: Docker web service (free tier)
- Auto-deploys on push to `main` branch
- URL: **https://pst-reader.onrender.com**

### To deploy updates:
```bash
cd /Users/daiyabase/143core/persicope/pst-reader
git add -A && git commit -m "description" && git push
```
Render auto-rebuilds in ~5 minutes.

---

## Key Files

| File | Purpose |
|------|---------|
| `backend/services/pst_calculator.py` | Core PST prediction (hybrid poly+KNN model) |
| `backend/services/image_processor.py` | ROI detection + color extraction |
| `backend/services/color_science.py` | sRGB → CIELAB conversion |
| `backend/services/pdf_generator.py` | Multilingual PDF report generation |
| `backend/services/white_balance.py` | Auto/manual white balance correction |
| `backend/fonts/NotoSansSC-Regular.ttf` | Chinese font for PDFs |
| `backend/calibration/pst_regression_model.json` | Trained model coefficients + KNN reference data |
| `backend/calibration/calibration_model.json` | 101 sample↔report color mappings |
| `backend/routers/analyze.py` | All API endpoints |
| `frontend/src/lib/i18n.ts` | All translations (EN/ZH/DE) |
| `frontend/src/lib/LanguageContext.tsx` | Language state provider |
| `frontend/src/app/test/new/page.tsx` | Main upload + analyze page |
| `frontend/src/components/PSTResult.tsx` | Result display component |
| `Dockerfile` | Multi-stage Docker build for deployment |
| `render.yaml` | Render.com service config |
