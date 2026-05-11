export type Language = "en" | "zh" | "de";

export const translations = {
  // Header
  appTitle: {
    en: "PST Image Reader",
    zh: "PST 图像读取器",
    de: "PST Bildleser",
  },
  navDashboard: {
    en: "Dashboard",
    zh: "首页",
    de: "Startseite",
  },
  navNewTest: {
    en: "New Test",
    zh: "新建检测",
    de: "Neuer Test",
  },
  navHistory: {
    en: "History",
    zh: "历史记录",
    de: "Verlauf",
  },
  navSettings: {
    en: "Settings",
    zh: "设置",
    de: "Einstellungen",
  },

  // Dashboard
  dashboardSubtitle: {
    en: "Upload standard and test sample images to instantly calculate standardized PST (puriSCOPE Test) values. Replace manual readings with digital precision.",
    zh: "上传标准液与检测样品图片，即时计算标准化 PST（puriSCOPE 检测）值。用数字化精准取代人工读数。",
    de: "Laden Sie Standard- und Testprobenbilder hoch, um standardisierte PST-Werte (puriSCOPE-Test) sofort zu berechnen. Ersetzen Sie manuelle Ablesungen durch digitale Praezision.",
  },
  howItWorks: {
    en: "How it works",
    zh: "使用流程",
    de: "So funktioniert es",
  },
  dashboardStep1: {
    en: "Upload a photo containing two sample bottles with the standard and test sample",
    zh: "上传一张包含标准液和检测样品两个取样瓶的照片",
    de: "Laden Sie ein Foto mit zwei Probenflaschen (Standard und Testprobe) hoch",
  },
  dashboardStep2: {
    en: "The system automatically analyzes color differences and calculates the PST value",
    zh: "系统自动分析颜色差异并计算 PST 值",
    de: "Das System analysiert automatisch Farbunterschiede und berechnet den PST-Wert",
  },
  dashboardStep3: {
    en: "View results and download a professional PDF test report",
    zh: "查看结果并下载专业 PDF 检测报告",
    de: "Ergebnisse anzeigen und professionellen PDF-Testbericht herunterladen",
  },
  startTest: {
    en: "Start Test",
    zh: "开始检测",
    de: "Test starten",
  },

  // New Test
  newTest: {
    en: "New Test",
    zh: "新建检测",
    de: "Neuer Test",
  },
  testResult: {
    en: "Test Result",
    zh: "检测结果",
    de: "Testergebnis",
  },
  uploadSampleImage: {
    en: "Upload Sample Image",
    zh: "上传样品图片",
    de: "Probenbild hochladen",
  },
  uploadInstruction: {
    en: "Upload a photo containing two sample bottles (standard on left, test sample on right)",
    zh: "上传一张包含两个取样瓶的照片（左侧为标准液，右侧为检测样品）",
    de: "Laden Sie ein Foto mit zwei Probenflaschen hoch (Standard links, Testprobe rechts)",
  },
  clickToSelect: {
    en: "Click to select file",
    zh: "点击选择文件",
    de: "Klicken Sie, um eine Datei auszuwaehlen",
  },
  autoSplitNote: {
    en: "The system will automatically split the image into left and right halves for analysis.",
    zh: "系统将自动将图片分为左右两半进行分析。",
    de: "Das System teilt das Bild automatisch in linke und rechte Haelfte zur Analyse.",
  },
  testDetails: {
    en: "Test Details",
    zh: "检测信息",
    de: "Testdetails",
  },
  location: {
    en: "Location",
    zh: "检测地点",
    de: "Standort",
  },
  locationPlaceholder: {
    en: "e.g. Production Line 1",
    zh: "例：生产线1号",
    de: "z.B. Produktionslinie 1",
  },
  notes: {
    en: "Notes",
    zh: "备注",
    de: "Anmerkungen",
  },
  notesPlaceholder: {
    en: "e.g. Weekly CIP check",
    zh: "例：每周CIP检查",
    de: "z.B. Woechentliche CIP-Pruefung",
  },
  analyzing: {
    en: "Analyzing...",
    zh: "分析中...",
    de: "Analyse laeuft...",
  },
  startAnalysis: {
    en: "Analyze",
    zh: "开始分析",
    de: "Analysieren",
  },
  serverError: {
    en: "Server error",
    zh: "服务器错误",
    de: "Serverfehler",
  },
  analysisFailed: {
    en: "Analysis failed, please try again.",
    zh: "分析失败，请重试。",
    de: "Analyse fehlgeschlagen, bitte versuchen Sie es erneut.",
  },
  changeImage: {
    en: "Change image",
    zh: "更换图片",
    de: "Bild aendern",
  },

  // PSTResult
  pstValue: {
    en: "PST Value",
    zh: "PST 值",
    de: "PST-Wert",
  },
  standardReference: {
    en: "Standard (Reference)",
    zh: "标准液（参考）",
    de: "Standard (Referenz)",
  },
  testSampleResult: {
    en: "Test Sample (Result)",
    zh: "检测样品（结果）",
    de: "Testprobe (Ergebnis)",
  },
  meetsThreshold: {
    en: "Meets cleaning threshold",
    zh: "清洁度达标",
    de: "Reinigungsschwelle erreicht",
  },
  belowThreshold: {
    en: "Below cleaning threshold",
    zh: "清洁度未达标",
    de: "Unter Reinigungsschwelle",
  },
  colorAnalysis: {
    en: "Color Analysis",
    zh: "颜色分析",
    de: "Farbanalyse",
  },
  downloadPdf: {
    en: "Download PDF Report",
    zh: "下载 PDF 报告",
    de: "PDF-Bericht herunterladen",
  },
  labelNotClean: {
    en: "Not Clean",
    zh: "未达标",
    de: "Nicht bestanden",
  },
  labelMinimal: {
    en: "Minimal",
    zh: "极低",
    de: "Minimal",
  },
  labelFair: {
    en: "Fair",
    zh: "一般",
    de: "Ausreichend",
  },
  labelGood: {
    en: "Good",
    zh: "良好",
    de: "Gut",
  },
  labelExcellent: {
    en: "Excellent",
    zh: "优秀",
    de: "Ausgezeichnet",
  },

  // History
  history: {
    en: "History",
    zh: "历史记录",
    de: "Verlauf",
  },
  loading: {
    en: "Loading...",
    zh: "加载中...",
    de: "Laden...",
  },
  noTestRecords: {
    en: "No test records",
    zh: "暂无检测记录",
    de: "Keine Testdatensaetze",
  },
  startFirstTest: {
    en: "Start first test",
    zh: "开始第一次检测",
    de: "Ersten Test starten",
  },
  colId: {
    en: "ID",
    zh: "编号",
    de: "Nr.",
  },
  colDate: {
    en: "Date",
    zh: "日期",
    de: "Datum",
  },
  colPstValue: {
    en: "PST Value",
    zh: "PST 值",
    de: "PST-Wert",
  },
  colStatus: {
    en: "Status",
    zh: "状态",
    de: "Status",
  },
  colLocation: {
    en: "Location",
    zh: "地点",
    de: "Standort",
  },
  colNotes: {
    en: "Notes",
    zh: "备注",
    de: "Anmerkungen",
  },
  colActions: {
    en: "Actions",
    zh: "操作",
    de: "Aktionen",
  },
  view: {
    en: "View",
    zh: "查看",
    de: "Ansehen",
  },

  // Settings
  settings: {
    en: "Settings",
    zh: "设置",
    de: "Einstellungen",
  },
  calibrationModel: {
    en: "Calibration Model",
    zh: "校准模型",
    de: "Kalibrierungsmodell",
  },
  trainingSamples: {
    en: "Training Samples",
    zh: "训练样本数",
    de: "Trainingsproben",
  },
  rSquaredFit: {
    en: "R\u00B2 Fit",
    zh: "R\u00B2拟合度",
    de: "R\u00B2-Anpassung",
  },
  thresholdLevels: {
    en: "Threshold Levels",
    zh: "阈值等级数",
    de: "Schwellenwerte",
  },
  pstThresholds: {
    en: "PST Thresholds",
    zh: "PST 阈值设置",
    de: "PST-Schwellenwerte",
  },
  thresholdsDescription: {
    en: "Define PST value ranges to determine cleaning quality. When the PST value is below the \"Max PST\", the corresponding level is applied.",
    zh: "定义 PST 值的等级范围，用于判定清洁质量。当 PST 值低于「最大 PST」时，应用对应等级。",
    de: "Definieren Sie PST-Wertebereiche zur Bestimmung der Reinigungsqualitaet. Liegt der PST-Wert unter dem \"Max PST\", wird die entsprechende Stufe angewendet.",
  },
  maxPst: {
    en: "Max PST",
    zh: "最大 PST",
    de: "Max PST",
  },
  levelName: {
    en: "Level Name",
    zh: "等级名称",
    de: "Stufenname",
  },
  color: {
    en: "Color",
    zh: "颜色",
    de: "Farbe",
  },
  isClean: {
    en: "Clean?",
    zh: "达标?",
    de: "Sauber?",
  },
  remove: {
    en: "Remove",
    zh: "删除",
    de: "Entfernen",
  },
  addLevel: {
    en: "+ Add level",
    zh: "+ 添加等级",
    de: "+ Stufe hinzufuegen",
  },
  saving: {
    en: "Saving...",
    zh: "保存中...",
    de: "Speichern...",
  },
  saveSettings: {
    en: "Save Settings",
    zh: "保存设置",
    de: "Einstellungen speichern",
  },
  thresholdsSaved: {
    en: "Thresholds saved",
    zh: "阈值设置已保存",
    de: "Schwellenwerte gespeichert",
  },
  saveFailed: {
    en: "Save failed, please try again",
    zh: "保存失败，请重试",
    de: "Speichern fehlgeschlagen, bitte versuchen Sie es erneut",
  },
  newLevel: {
    en: "New level",
    zh: "新等级",
    de: "Neue Stufe",
  },
  colorRed: {
    en: "Red",
    zh: "红色",
    de: "Rot",
  },
  colorOrange: {
    en: "Orange",
    zh: "橙色",
    de: "Orange",
  },
  colorYellow: {
    en: "Yellow",
    zh: "黄色",
    de: "Gelb",
  },
  colorGreen: {
    en: "Green",
    zh: "绿色",
    de: "Gruen",
  },
  colorEmerald: {
    en: "Emerald",
    zh: "深绿",
    de: "Smaragdgruen",
  },

  // Login
  signIn: {
    en: "Sign In",
    zh: "登录",
    de: "Anmelden",
  },
  email: {
    en: "Email",
    zh: "邮箱",
    de: "E-Mail",
  },
  password: {
    en: "Password",
    zh: "密码",
    de: "Passwort",
  },
  enterPassword: {
    en: "Enter password",
    zh: "输入密码",
    de: "Passwort eingeben",
  },
  signingIn: {
    en: "Signing in...",
    zh: "登录中...",
    de: "Anmeldung...",
  },
  loginFailed: {
    en: "Login failed",
    zh: "登录失败",
    de: "Anmeldung fehlgeschlagen",
  },
  noAccount: {
    en: "Don't have an account?",
    zh: "还没有账号？",
    de: "Noch kein Konto?",
  },
  register: {
    en: "Register",
    zh: "注册",
    de: "Registrieren",
  },

  // Register
  createAccount: {
    en: "Create Account",
    zh: "创建账号",
    de: "Konto erstellen",
  },
  emailRequired: {
    en: "Email *",
    zh: "邮箱 *",
    de: "E-Mail *",
  },
  passwordMin6: {
    en: "Password * (min 6 chars)",
    zh: "密码 *（至少6位）",
    de: "Passwort * (mind. 6 Zeichen)",
  },
  createPassword: {
    en: "Create password",
    zh: "设置密码",
    de: "Passwort erstellen",
  },
  companyName: {
    en: "Company Name",
    zh: "公司名称",
    de: "Firmenname",
  },
  yourCompany: {
    en: "Your company",
    zh: "您的公司",
    de: "Ihr Unternehmen",
  },
  creatingAccount: {
    en: "Creating account...",
    zh: "注册中...",
    de: "Konto wird erstellt...",
  },
  registrationFailed: {
    en: "Registration failed",
    zh: "注册失败",
    de: "Registrierung fehlgeschlagen",
  },
  alreadyHaveAccount: {
    en: "Already have an account?",
    zh: "已有账号？",
    de: "Bereits ein Konto?",
  },

  // Test Detail
  testNotFound: {
    en: "Test not found",
    zh: "未找到该检测记录",
    de: "Test nicht gefunden",
  },
  backToHistory: {
    en: "Back to history",
    zh: "返回历史记录",
    de: "Zurueck zum Verlauf",
  },
  testNumber: {
    en: "Test #",
    zh: "检测 #",
    de: "Test #",
  },

  // Guidelines (4-panel comic)
  guidelinesTitle: {
    en: "Take a good photo",
    zh: "拍出好照片",
    de: "Gutes Foto aufnehmen",
  },
  guidelinesSubtitle: {
    en: "Follow these four tips for accurate readings",
    zh: "遵循这四条提示，让读数更准确",
    de: "Befolgen Sie diese vier Tipps fuer genaue Messwerte",
  },
  guidelinePosition: {
    en: "Position",
    zh: "位置",
    de: "Position",
  },
  guidelinePositionCaption: {
    en: "Both bottles side by side, centered in frame",
    zh: "两个取样瓶并排居中放置",
    de: "Beide Flaschen mittig nebeneinander",
  },
  guidelineDistance: {
    en: "Distance",
    zh: "距离",
    de: "Abstand",
  },
  guidelineDistanceCaption: {
    en: "Stand close so the bottles fill most of the frame",
    zh: "靠近一点，让取样瓶占满画面大部分",
    de: "Nah genug, dass die Flaschen das Bild fuellen",
  },
  guidelineAngle: {
    en: "Angle",
    zh: "角度",
    de: "Winkel",
  },
  guidelineAngleCaption: {
    en: "Hold the phone straight, not tilted",
    zh: "手机保持竖直，不要倾斜",
    de: "Telefon gerade halten, nicht kippen",
  },
  guidelineLighting: {
    en: "Lighting",
    zh: "光线",
    de: "Beleuchtung",
  },
  guidelineLightingCaption: {
    en: "Bright, even light. Avoid harsh shadows or yellow lamps",
    zh: "明亮均匀的光线，避免强阴影或黄色灯光",
    de: "Helles, gleichmaessiges Licht. Keine harten Schatten oder gelben Lampen",
  },
  guidelinesGotIt: {
    en: "Got it — continue",
    zh: "知道了，继续",
    de: "Verstanden — weiter",
  },
  guidelinesSkip: {
    en: "Skip",
    zh: "跳过",
    de: "Ueberspringen",
  },
  guidelinesDontShowAgain: {
    en: "Don't show again",
    zh: "不再提示",
    de: "Nicht mehr anzeigen",
  },
  guidelinesShowAgain: {
    en: "Photo tips",
    zh: "拍照提示",
    de: "Foto-Tipps",
  },

  // Crop step
  cropTitle: {
    en: "Adjust the crop",
    zh: "调整裁剪范围",
    de: "Zuschnitt anpassen",
  },
  cropAutoSuggested: {
    en: "We auto-detected the bottles. Drag or zoom to fine-tune, then confirm.",
    zh: "我们已自动识别取样瓶。可拖动或缩放微调，确认后继续。",
    de: "Die Flaschen wurden automatisch erkannt. Ziehen oder zoomen Sie zum Anpassen.",
  },
  cropManualHint: {
    en: "Drag and zoom so both bottles fill the frame, then confirm.",
    zh: "拖动并缩放，让两个取样瓶填满画面后确认。",
    de: "Ziehen und zoomen, bis beide Flaschen das Bild ausfuellen.",
  },
  cropZoom: {
    en: "Zoom",
    zh: "缩放",
    de: "Zoom",
  },
  cropConfirm: {
    en: "Confirm crop",
    zh: "确认裁剪",
    de: "Zuschnitt bestaetigen",
  },
  cropProcessing: {
    en: "Processing...",
    zh: "处理中...",
    de: "Verarbeite...",
  },
  back: {
    en: "Back",
    zh: "返回",
    de: "Zurueck",
  },

  // Quality check
  qcRunning: {
    en: "Checking photo quality...",
    zh: "正在检查照片质量...",
    de: "Pruefe Bildqualitaet...",
  },
  qcPassed: {
    en: "Photo looks good",
    zh: "照片质量良好",
    de: "Foto sieht gut aus",
  },
  qcPassedHint: {
    en: "Starting analysis...",
    zh: "开始分析...",
    de: "Analyse wird gestartet...",
  },
  qcFailedTitle: {
    en: "This photo may give an inaccurate reading",
    zh: "该照片可能会导致读数不准确",
    de: "Dieses Foto koennte ungenaue Werte liefern",
  },
  qcFailedSubtitle: {
    en: "Please review the issues below",
    zh: "请查看下方问题",
    de: "Bitte beachten Sie die Hinweise unten",
  },
  // Per-issue: short title (left) + concrete advice (below)
  qcTooDarkTitle: {
    en: "Photo is too dark",
    zh: "照片偏暗",
    de: "Foto ist zu dunkel",
  },
  qcTooDarkAdvice: {
    en: "Move closer to a window, turn on more lamps, or step into bright indoor light. Avoid taking the photo at night with only ceiling lights.",
    zh: "靠近窗户、打开更多灯，或走到室内明亮处拍摄。避免夜间仅靠顶灯拍照。",
    de: "Naeher ans Fenster, mehr Lampen einschalten oder in helles Innenlicht wechseln. Nicht nachts unter alleinigem Deckenlicht aufnehmen.",
  },
  qcTooBrightTitle: {
    en: "Photo is overexposed",
    zh: "照片曝光过度",
    de: "Foto ist ueberbelichtet",
  },
  qcTooBrightAdvice: {
    en: "Move away from direct sunlight or strong lamps. Try shooting under softer, indirect light — diffused daylight or a north-facing window works best.",
    zh: "避开强烈日光或强光灯。改在柔和的间接光下拍摄——漫射日光或朝北的窗边效果最佳。",
    de: "Direkte Sonne oder starke Lampen meiden. Lieber unter weichem Streulicht aufnehmen — Tageslicht oder Nord-Fenster sind ideal.",
  },
  qcColorCastYellowTitle: {
    en: "Lighting is too warm/yellow",
    zh: "光线偏黄",
    de: "Licht ist zu warm/gelb",
  },
  qcColorCastYellowAdvice: {
    en: "Yellow lamps (incandescent or warm LED) tint the image. Switch to a daylight bulb (5000–6500K) or shoot near a window during the day.",
    zh: "黄色灯（白炽灯或暖色 LED）会让画面偏黄。请改用日光色灯泡（5000–6500K）或在白天靠窗拍摄。",
    de: "Warme Lampen (Gluehbirne / warmes LED) faerben das Bild gelb. Tageslichtlampe (5000–6500K) oder Tageslicht-Fenster verwenden.",
  },
  qcColorCastBlueTitle: {
    en: "Lighting is too cool/blue",
    zh: "光线偏冷/偏蓝",
    de: "Licht ist zu kalt/blau",
  },
  qcColorCastBlueAdvice: {
    en: "Cool LEDs and overcast outdoor light skew blue. Use a neutral daylight lamp, or add a warmer light source for balance.",
    zh: "冷色 LED 或阴天外光会让画面偏蓝。请使用中性日光色灯，或加一盏暖光灯平衡。",
    de: "Kalte LEDs und bewoelktes Aussenlicht wirken blaulich. Neutrale Tageslichtlampe oder zusaetzlich waerme Lichtquelle.",
  },
  qcBlurryTitle: {
    en: "Photo is blurry",
    zh: "照片模糊",
    de: "Foto ist unscharf",
  },
  qcBlurryAdvice: {
    en: "Hold the phone with both hands, tap the screen on the bottles to focus, wait for the focus indicator to lock, then take the photo. Avoid moving while shooting.",
    zh: "双手握稳手机，点击屏幕上的取样瓶进行对焦，等对焦框稳定后再按下快门。拍摄时保持不动。",
    de: "Telefon mit beiden Haenden halten, auf die Flaschen tippen zum Fokussieren, warten bis das Fokus-Symbol stabil ist, dann aufnehmen. Beim Schuss nicht bewegen.",
  },
  qcNoBottlesTitle: {
    en: "Bottles not clearly visible",
    zh: "未清晰识别取样瓶",
    de: "Flaschen nicht klar erkennbar",
  },
  qcNoBottlesAdvice: {
    en: "Place both bottles side by side, centered in the frame. Stand close enough that the bottles fill most of the photo. Use a plain background (white wall, white paper).",
    zh: "请将两个取样瓶并排居中放置，靠近一些让取样瓶占满画面大部分。背景使用纯色（白墙或白纸）。",
    de: "Beide Flaschen mittig nebeneinander platzieren. Nah genug, dass sie das Bild fuellen. Einfacher Hintergrund (weisse Wand / Papier).",
  },
  qcTooLowResTitle: {
    en: "Photo resolution too low",
    zh: "照片分辨率过低",
    de: "Bildaufloesung zu niedrig",
  },
  qcTooLowResAdvice: {
    en: "Take a new photo using your phone's full camera (not a screenshot), and stand closer to the bottles instead of zooming. Or tap the Upscale button on the previous step.",
    zh: "请用手机原生相机重拍（不要使用截图），并靠近取样瓶而非用变焦。也可以在上一步点击「放大」按钮。",
    de: "Neues Foto mit der vollen Kamera des Telefons aufnehmen (kein Screenshot), naeher an die Flaschen herangehen statt zu zoomen. Oder im vorigen Schritt „Hochskalieren“ verwenden.",
  },
  qcRetake: {
    en: "Retake photo",
    zh: "重新拍摄",
    de: "Foto neu aufnehmen",
  },
  qcUseAnyway: {
    en: "Use anyway",
    zh: "仍然使用",
    de: "Trotzdem verwenden",
  },

  // Auto-upscale + upload processing
  uploadProcessing: {
    en: "Preparing image...",
    zh: "正在准备图像...",
    de: "Bild wird vorbereitet...",
  },
  cropAutoUpscaled: {
    en: "Image was small ({from}) — automatically upscaled {scale} for easier cropping. This does not add real detail.",
    zh: "图像较小（{from}）——已自动放大 {scale} 以便裁剪。此操作不会增加真实细节。",
    de: "Bild war klein ({from}) — automatisch um {scale} hochskaliert. Es wurden keine echten Details hinzugefuegt.",
  },

  // Color picker step
  pickerTitle: {
    en: "Pick the two colors",
    zh: "点选两个颜色",
    de: "Beide Farben auswaehlen",
  },
  pickerSubtitle: {
    en: "Tap each bottle's liquid in the photo. We'll sample the color and send only those two colors for analysis.",
    zh: "请点击照片中每个取样瓶的液体部分。系统会提取颜色，仅将这两种颜色用于分析。",
    de: "Tippen Sie auf die Fluessigkeit beider Probenflasche. Nur die beiden Farben werden zur Analyse gesendet.",
  },
  pickerStandard: {
    en: "Standard (left)",
    zh: "标准液（左）",
    de: "Standard (links)",
  },
  pickerTest: {
    en: "Test sample (right)",
    zh: "样品（右）",
    de: "Probe (rechts)",
  },
  pickerHintStandard: {
    en: "Tap the standard bottle's liquid (the more purple one).",
    zh: "请点击标准液取样瓶（颜色更紫的那个）。",
    de: "Tippen Sie auf die Fluessigkeit des Standardzylinders (lila).",
  },
  pickerHintTest: {
    en: "Tap the test sample's liquid (the lighter one).",
    zh: "请点击样品取样瓶（颜色较浅的那个）。",
    de: "Tippen Sie auf die Fluessigkeit der Testprobe (heller).",
  },
  pickerNotPicked: {
    en: "not picked yet",
    zh: "尚未选取",
    de: "noch nicht ausgewaehlt",
  },
  pickerTapToPick: {
    en: "tap here, then tap the photo",
    zh: "点击此卡，再点击照片",
    de: "hier tippen, dann das Foto antippen",
  },
  pickerActive: {
    en: "active",
    zh: "当前",
    de: "aktiv",
  },
  pickerReset: {
    en: "re-pick",
    zh: "重选",
    de: "neu waehlen",
  },
  pickerConfirm: {
    en: "Analyze these colors",
    zh: "分析这两个颜色",
    de: "Diese Farben analysieren",
  },
  pickerWhite: {
    en: "White reference",
    zh: "白平衡参考",
    de: "Weissreferenz",
  },
  pickerOptional: {
    en: "optional — improves accuracy",
    zh: "可选——提高准确性",
    de: "optional — verbessert Genauigkeit",
  },
  pickerHintWhite: {
    en: "Tap a NEUTRAL background area — the gap between the sample bottles, paper or wall behind them. Avoid labels (their text/tint can mislead). Skip if no neutral area is visible.",
    zh: "请点击中性背景区域——取样瓶之间的缝隙、取样瓶后方的纸张或墙面。请勿点选标签（其文字或色调会干扰）。若无中性区域，可跳过此步。",
    de: "Tippen Sie auf eine NEUTRALE Hintergrundflaeche — Spalt zwischen den Probenflaschen, Papier oder Wand dahinter. Etiketten meiden. Ueberspringen, wenn keine neutrale Flaeche sichtbar ist.",
  },
  pickerWBApplied: {
    en: "White-balance correction will be applied to standard and test colors.",
    zh: "将根据白平衡参考校正标准液和样品颜色。",
    de: "Weissabgleich wird auf Standard- und Probenfarbe angewendet.",
  },
  pickerWBSkipAlreadyWhite: {
    en: "Reference is already pure white — no correction needed (photo is well-balanced).",
    zh: "参考点已接近纯白——无需校正（照片色彩平衡良好）。",
    de: "Referenz ist bereits reinweiss — keine Korrektur noetig (Foto ist ausgeglichen).",
  },
  pickerWBSkipNotWhite: {
    en: "That reference looks colored, not white — skipping correction. Try tapping a paper background or the gap between bottles.",
    zh: "该参考点呈彩色而非白色——跳过校正。请尝试点击纸张背景或取样瓶之间的缝隙。",
    de: "Referenz wirkt farbig, nicht weiss — Korrektur wird uebersprungen. Versuchen Sie Papierhintergrund oder Spalt zwischen den Flaschen.",
  },
  pickerHintStandardAuto: {
    en: "We auto-picked the standard bottle's liquid. Tap to choose a different point if it looks wrong.",
    zh: "已自动选取标准液取样瓶的液体颜色。如位置不准，可点击其他位置重选。",
    de: "Standardflasche automatisch gewaehlt. Tippen Sie auf eine andere Stelle, falls noetig.",
  },
  pickerHintTestAuto: {
    en: "We auto-picked the test bottle's liquid. Tap to choose a different point if it looks wrong.",
    zh: "已自动选取样品取样瓶的液体颜色。如位置不准，可点击其他位置重选。",
    de: "Probenflasche automatisch gewaehlt. Tippen Sie auf eine andere Stelle, falls noetig.",
  },
  pickerHintWhiteAuto: {
    en: "We auto-picked a white reference. Tap a different neutral area if it looks wrong, or leave as-is.",
    zh: "已自动选取白平衡参考点。如位置不准，可点击其他中性区域重选；或保持当前选择。",
    de: "Weissreferenz automatisch gewaehlt. Bei Bedarf andere neutrale Flaeche tippen; sonst belassen.",
  },
  pickerWBNotNeeded: {
    en: "Photo is already well-balanced — no white-balance correction needed.",
    zh: "照片色彩平衡良好——无需白平衡校正。",
    de: "Foto ist bereits ausgeglichen — kein Weissabgleich noetig.",
  },
  pickerWBNoCandidate: {
    en: "No usable white reference found in this photo — skipping white-balance correction.",
    zh: "未在该照片中找到可用的白色参考点——跳过白平衡校正。",
    de: "Keine geeignete Weissreferenz im Foto gefunden — Korrektur wird uebersprungen.",
  },

  // Backend pipeline UX
  uploadPipelineNote: {
    en: "We'll automatically check your photo, find the bottles, crop it, and balance the colors. If anything is off, we'll tell you exactly what to fix.",
    zh: "系统会自动检查照片、识别取样瓶、裁剪并平衡色彩。若存在问题，会告知具体需要如何改进。",
    de: "Wir pruefen automatisch Ihr Foto, finden die Flaschen, beschneiden und gleichen die Farben ab. Falls etwas nicht stimmt, sagen wir genau, was zu verbessern ist.",
  },
  preparingTitle: {
    en: "Preparing your photo",
    zh: "正在处理照片",
    de: "Foto wird vorbereitet",
  },
  preparingSubtitle: {
    en: "This usually takes 1–3 seconds.",
    zh: "通常需要 1–3 秒。",
    de: "Das dauert in der Regel 1–3 Sekunden.",
  },
  preparingStep1: {
    en: "Detecting the two sample bottles",
    zh: "识别两个取样瓶",
    de: "Beide Probenflaschen erkennen",
  },
  preparingStep2: {
    en: "Auto-cropping to the right framing",
    zh: "自动裁剪到合适构图",
    de: "Automatischer Zuschnitt auf das richtige Format",
  },
  preparingStep3: {
    en: "Checking brightness, sharpness, and resolution",
    zh: "检查亮度、清晰度与分辨率",
    de: "Helligkeit, Schaerfe und Aufloesung pruefen",
  },
  preparingStep4: {
    en: "Balancing lighting if a clean reference is available",
    zh: "若存在干净的参考点，则进行光线平衡",
    de: "Beleuchtung ausgleichen, falls sauberer Referenzpunkt vorhanden",
  },
  resultWBApplied: {
    en: "Auto white-balance was applied (a clean neutral reference was detected outside the bottles).",
    zh: "已自动应用白平衡校正（在取样瓶外检测到干净的中性参考点）。",
    de: "Auto-Weissabgleich wurde angewendet (sauberer Referenzpunkt ausserhalb der Flaschen erkannt).",
  },
  resultFineTuneTitle: {
    en: "Result not matching your expectations?",
    zh: "结果与预期不符？",
    de: "Ergebnis nicht wie erwartet?",
  },
  resultFineTuneSubtitle: {
    en: "Fine-tune by picking the colors manually. Tap each bottle's liquid yourself, and optionally pick a white reference for lighting correction.",
    zh: "可手动微调：自行点击每个取样瓶的液体颜色，并可选地选取白平衡参考点进行光线校正。",
    de: "Manuell feinjustieren: Farben jeder Flasche selbst antippen und optional Weissreferenz waehlen.",
  },
  resultFineTuneButton: {
    en: "Fine-tune manually",
    zh: "手动微调",
    de: "Manuell feinjustieren",
  },

  // Reject page
  rejectHeading: {
    en: "We can't analyze this photo reliably",
    zh: "该照片暂无法可靠分析",
    de: "Wir koennen dieses Foto nicht zuverlaessig analysieren",
  },
  rejectSubheading: {
    en: "Please retake with the suggestion below.",
    zh: "请根据下方建议重新拍摄。",
    de: "Bitte mit Hinweis unten neu aufnehmen.",
  },
  rejectShowDetails: {
    en: "Show technical details",
    zh: "显示技术参数",
    de: "Technische Details anzeigen",
  },
  rejectYourUpload: {
    en: "Your upload:",
    zh: "您上传的照片：",
    de: "Ihre Aufnahme:",
  },
  rejectRetake: {
    en: "Retake photo",
    zh: "重新拍摄",
    de: "Foto neu aufnehmen",
  },
  rejectNoBottlesTitle: {
    en: "Can't find two sample bottles in the photo",
    zh: "未在照片中找到两个取样瓶",
    de: "Beide Probenflaschen nicht im Foto gefunden",
  },
  rejectNoBottlesAdvice: {
    en: "Place both sample bottles side by side, centered in the frame. The standard (purple) goes on the left, the test sample on the right. Make sure both are clearly visible and fill most of the photo. Use a plain background.",
    zh: "请将两个取样瓶并排居中放置——标准液（紫色）在左，样品在右。确保两瓶都清晰可见、占据画面大部分，并使用纯色背景。",
    de: "Beide Probenflaschen mittig nebeneinander platzieren — Standard (lila) links, Probe rechts. Beide muessen klar sichtbar sein und das Bild fuellen. Einfacher Hintergrund.",
  },
  rejectTooDarkTitle: {
    en: "Photo is too dark",
    zh: "照片过暗",
    de: "Foto ist zu dunkel",
  },
  rejectTooDarkAdvice: {
    en: "Move to brighter light. Open a window, turn on more lamps, or move closer to a daylight source. Avoid shadows falling across the bottles.",
    zh: "请改在更明亮的环境下拍摄。打开窗户、增加灯光，或靠近日光来源。避免阴影遮住取样瓶。",
    de: "In helleres Licht wechseln. Fenster oeffnen, mehr Lampen einschalten oder naeher an Tageslicht. Schatten auf den Flaschen vermeiden.",
  },
  rejectTooBrightTitle: {
    en: "Photo is overexposed",
    zh: "照片过曝",
    de: "Foto ist ueberbelichtet",
  },
  rejectTooBrightAdvice: {
    en: "Move out of direct sunlight or strong lamps. Try soft indirect light — a north-facing window or diffused daylight works best.",
    zh: "请避开阳光直射或强光灯。改用柔和的间接光——朝北窗户或漫射日光效果最佳。",
    de: "Direkte Sonne / starke Lampen meiden. Weiches Streulicht (Nord-Fenster oder Tageslicht) ist ideal.",
  },
  rejectTooBlurryTitle: {
    en: "Photo is too blurry",
    zh: "照片过于模糊",
    de: "Foto ist zu unscharf",
  },
  rejectTooBlurryAdvice: {
    en: "Hold the phone with both hands, tap the screen on the bottles to focus, wait for the focus indicator to lock, then take the photo. Avoid moving while shooting. Use a fresh photo (not a screenshot or a forwarded compressed image).",
    zh: "请双手持机，点击屏幕上的取样瓶进行对焦，等对焦框稳定后再拍摄。拍摄时保持不动。请使用原始照片（不要使用截图或被压缩的转发图）。",
    de: "Telefon mit beiden Haenden halten, auf die Flaschen tippen zum Fokussieren, warten bis Fokus stabil, dann aufnehmen. Beim Schuss nicht bewegen. Originalfoto verwenden (kein Screenshot / komprimiertes Bild).",
  },
  rejectTooLowResTitle: {
    en: "Photo resolution is too low",
    zh: "照片分辨率过低",
    de: "Bildaufloesung zu niedrig",
  },
  rejectTooLowResAdvice: {
    en: "Take a new photo with your phone's regular camera (not a screenshot). Stand closer to the bottles instead of zooming. Avoid forwarding the photo through chat apps that compress images.",
    zh: "请用手机原生相机重新拍摄（不要使用截图）。靠近取样瓶而非使用变焦。避免通过会压缩图片的聊天软件转发。",
    de: "Neues Foto mit der normalen Telefonkamera aufnehmen (kein Screenshot). Naeher an die Flaschen herangehen statt zu zoomen. Nicht ueber komprimierende Chat-Apps weiterleiten.",
  },
  rejectManualOverridePrompt: {
    en: "Want to analyze this photo anyway? You can manually pick the colors.",
    zh: "仍想分析该照片？您可以手动选取颜色。",
    de: "Trotzdem analysieren? Sie koennen die Farben manuell waehlen.",
  },
  rejectManualOverrideButton: {
    en: "Switch to manual color picker",
    zh: "切换到手动选取颜色",
    de: "Manuelle Farbauswahl",
  },
  pickerWBPreview: {
    en: "After WB correction",
    zh: "白平衡校正后",
    de: "Nach Weissabgleich",
  },

  // Crop tools (legacy — retained for any future re-introduction of cropping)
  cropRotate: {
    en: "Rotate 90°",
    zh: "旋转 90°",
    de: "Drehen 90°",
  },
  cropUpscale: {
    en: "Upscale",
    zh: "放大",
    de: "Hochskalieren",
  },
  cropUpscaleHint: {
    en: "Upscale doubles the displayed size to make small images easier to crop. It does NOT add real detail to the photo.",
    zh: "放大将图像尺寸翻倍，便于裁剪小图。不会为照片增加真实细节。",
    de: "Hochskalieren verdoppelt die Anzeigegroesse zum einfacheren Zuschneiden. Es fuegt keine echten Details hinzu.",
  },

  // Upload + crop guides
  uploadIdealHint: {
    en: "Your photo should look like this — two bottles side by side, centered",
    zh: "上传的照片应该像这样——两个取样瓶并排居中",
    de: "Ihr Foto sollte so aussehen — zwei Flaschen mittig nebeneinander",
  },
  cropShowGuide: {
    en: "Show guide",
    zh: "显示参考线",
    de: "Hilfslinien anzeigen",
  },
  cropHideGuide: {
    en: "Hide guide",
    zh: "隐藏参考线",
    de: "Hilfslinien ausblenden",
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  return translations[key][lang];
}

/** Map backend English labels to translation keys */
const labelKeyMap: Record<string, TranslationKey> = {
  "Not Clean": "labelNotClean",
  "Minimal": "labelMinimal",
  "Fair": "labelFair",
  "Good": "labelGood",
  "Excellent": "labelExcellent",
};

export function translateLabel(backendLabel: string, lang: Language): string {
  const key = labelKeyMap[backendLabel];
  if (key) return t(key, lang);
  return backendLabel;
}

/** Get date locale string for language */
export function getDateLocale(lang: Language): string {
  switch (lang) {
    case "zh": return "zh-CN";
    case "de": return "de-DE";
    default: return "en-US";
  }
}
