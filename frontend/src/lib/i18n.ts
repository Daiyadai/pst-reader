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
    en: "Upload a photo containing two cylinders with the standard and test sample",
    zh: "上传一张包含标准液和检测样品两个量筒的照片",
    de: "Laden Sie ein Foto mit zwei Zylindern (Standard und Testprobe) hoch",
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
    en: "Upload a photo containing two cylinders (standard on left, test sample on right)",
    zh: "上传一张包含两个量筒的照片（左侧为标准液，右侧为检测样品）",
    de: "Laden Sie ein Foto mit zwei Zylindern hoch (Standard links, Testprobe rechts)",
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
