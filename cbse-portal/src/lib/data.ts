// ─── Raw JSON shape ───────────────────────────────────────────────────────────

export interface StudentData {
  ADMN_ID: string; CAT: string; CENT: string; CLASS: string;
  CNAME: string; COMPTT: string; DOD: string; FNAME: string;
  GR1: string; GR2: string; GR3: string; GR4: string; GR5: string; GR6: string;
  GSI_PK: string; GSI_SK: string;
  IGR1: string; IGR2: string; IGR3: string;
  ISNAME1: string; ISNAME2: string; ISNAME3: string;
  ISUB1: string; ISUB2: string; ISUB3: string;
  IS_NCHMCT: string; IS_NSE: string; IS_SKILL: string;
  MNAME: string; MODIFIED_ON: string; MONTH: string; MONTH_L: string;
  MRK11: string; MRK12: string; MRK13: string; MRK13_WRDS: string;
  MRK21: string; MRK22: string; MRK23: string; MRK23_WRDS: string;
  MRK31: string; MRK32: string; MRK33: string; MRK33_WRDS: string;
  MRK41: string; MRK42: string; MRK43: string; MRK43_WRDS: string;
  MRK51: string; MRK52: string; MRK53: string; MRK53_WRDS: string;
  MRK61: string; MRK62: string; MRK63: string; MRK63_WRDS: string;
  NCHMCT_1: string; NCHMCT_2: string; NSE_1: string; NSE_2: string;
  ORGID: string;
  PF1: string; PF2: string; PF3: string; PF4: string; PF5: string; PF6: string;
  PUBLISHED: string; REG: string; RES: string; RESULT: string;
  RROLL: string; RROLL_YEAR: string;
  SCH: string; SCH_NAME: string; SESSION: string; SEX: string; SK: string;
  SKILL_1: string; SKILL_2: string;
  SNAME1: string; SNAME2: string; SNAME3: string; SNAME4: string; SNAME5: string; SNAME6: string;
  SUB1: string; SUB2: string; SUB3: string; SUB4: string; SUB5: string; SUB6: string;
  TMRK: string; URI: string; VERSION: string; YEAR: string; SECTION: string;
}

export interface StudentRecord { data: StudentData; duration_sec: number; request_id: string; status: number; }

export interface SubjectMark {
  subjectName: string; subjectCode: string;
  theory: number | null; practical: number | null; total: number | null;
  grade: string; passFail: string; totalInWords: string; slotIndex: number;
}

export interface ParsedStudent {
  id: string; name: string; rollNumber: string; schoolName: string;
  fatherName: string; motherName: string; section: string; session: string;
  result: string; totalMarks: number; sex: string; dateOfDeclaration: string;
  subjects: SubjectMark[];
  internalSubjects: { name: string; grade: string }[];
  raw: StudentData;
}

export type SubjectScope = "best5" | "first5" | "all6" | string;

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseStudent(data: StudentData): ParsedStudent {
  const slots = [
    { name: data.SNAME1, code: data.SUB1, t: data.MRK11, p: data.MRK12, tot: data.MRK13, words: data.MRK13_WRDS, grade: data.GR1, pf: data.PF1 },
    { name: data.SNAME2, code: data.SUB2, t: data.MRK21, p: data.MRK22, tot: data.MRK23, words: data.MRK23_WRDS, grade: data.GR2, pf: data.PF2 },
    { name: data.SNAME3, code: data.SUB3, t: data.MRK31, p: data.MRK32, tot: data.MRK33, words: data.MRK33_WRDS, grade: data.GR3, pf: data.PF3 },
    { name: data.SNAME4, code: data.SUB4, t: data.MRK41, p: data.MRK42, tot: data.MRK43, words: data.MRK43_WRDS, grade: data.GR4, pf: data.PF4 },
    { name: data.SNAME5, code: data.SUB5, t: data.MRK51, p: data.MRK52, tot: data.MRK53, words: data.MRK53_WRDS, grade: data.GR5, pf: data.PF5 },
    { name: data.SNAME6, code: data.SUB6, t: data.MRK61, p: data.MRK62, tot: data.MRK63, words: data.MRK63_WRDS, grade: data.GR6, pf: data.PF6 },
  ];
  const subjects: SubjectMark[] = slots
    .map((s, i) => ({ ...s, slotIndex: i }))
    .filter((s) => s.name?.trim())
    .map((s) => ({
      subjectName: s.name, subjectCode: s.code,
      theory: s.t && !isNaN(parseInt(s.t, 10)) ? parseInt(s.t, 10) : null,
      practical: s.p && !isNaN(parseInt(s.p, 10)) ? parseInt(s.p, 10) : null,
      total: s.tot && !isNaN(parseInt(s.tot, 10)) ? parseInt(s.tot, 10) : null,
      grade: s.grade, passFail: s.pf === "P" ? "Pass" : s.pf === "F" ? "Fail" : s.pf,
      totalInWords: s.words, slotIndex: s.slotIndex,
    }));
  return {
    id: data.ADMN_ID, name: data.CNAME, rollNumber: data.RROLL,
    schoolName: data.SCH_NAME, fatherName: data.FNAME, motherName: data.MNAME,
    section: data.SECTION, session: data.SESSION, result: data.RESULT,
    totalMarks: parseInt(data.TMRK, 10) || 0, sex: data.SEX,
    dateOfDeclaration: data.DOD, subjects,
    internalSubjects: [
      { name: data.ISNAME1, grade: data.IGR1 },
      { name: data.ISNAME2, grade: data.IGR2 },
      { name: data.ISNAME3, grade: data.IGR3 },
    ].filter((s) => s.name?.trim()),
    raw: data,
  };
}

// ─── Scope helpers ────────────────────────────────────────────────────────────

export function getScopedSubjects(student: ParsedStudent, scope: SubjectScope): SubjectMark[] {
  const { subjects } = student;
  if (scope === "all6") return subjects;
  if (scope === "first5") return subjects.slice(0, 5);
  if (scope.startsWith("SUB_")) {
    const subjName = scope.replace("SUB_", "");
    const subj = subjects.find((s) => s.subjectName === subjName);
    return subj ? [subj] : [];
  }
  const english = subjects.find((s) => s.slotIndex === 0);
  const best4 = [...subjects.filter((s) => s.slotIndex !== 0)]
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0)).slice(0, 4);
  return (english ? [english, ...best4] : best4).sort((a, b) => a.slotIndex - b.slotIndex);
}

export const getScopedTotal = (s: ParsedStudent, sc: SubjectScope) =>
  getScopedSubjects(s, sc).reduce((acc, sub) => acc + (sub.total ?? 0), 0);

export const getScopedMax = (s: ParsedStudent, sc: SubjectScope) =>
  sc.startsWith("SUB_") ? 100 : getScopedSubjects(s, sc).length * 100;

// ─── Analytics types ──────────────────────────────────────────────────────────

export interface OverallStats {
  count: number; passed: number; failed: number; passRate: number;
  mean: number; median: number; stdDev: number;
  min: number; max: number; minStudent: string; maxStudent: string;
  p25: number; p75: number; p90: number; p95: number; p99: number;
  gradeDistribution: Record<string, number>;
  marksDistribution: { label: string; count: number }[];
  meanPct: number; medianPct: number;
}

export interface ClassStats {
  section: string; count: number; passed: number; passRate: number;
  mean: number; median: number; stdDev: number;
  min: number; max: number; topper: string; topperMarks: number; meanPct: number;
}

export interface SubjectAvg { subjectName: string; avgMarks: number; avgPct: number; count: number; topper: string; topperMarks: number; }

// ─── Analytics helpers ────────────────────────────────────────────────────────

const _mean = (v: number[]) => v.length ? parseFloat((v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)) : 0;
const _median = (v: number[]) => {
  if (!v.length) return 0;
  const s = [...v].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : parseFloat(((s[m - 1] + s[m]) / 2).toFixed(2));
};
const _std = (v: number[]) => {
  if (v.length < 2) return 0;
  const m = _mean(v);
  return parseFloat(Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length).toFixed(2));
};
const _pct = (v: number[], p: number) => {
  if (!v.length) return 0;
  const s = [...v].sort((a, b) => a - b), i = (p / 100) * (s.length - 1), lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? s[lo] : parseFloat((s[lo] + (s[hi] - s[lo]) * (i - lo)).toFixed(2));
};

export function computeOverallStats(students: ParsedStudent[], scope: SubjectScope): OverallStats {
  if (!students.length) return {
    count: 0, passed: 0, failed: 0, passRate: 0, mean: 0, median: 0, stdDev: 0,
    min: 0, max: 0, minStudent: "", maxStudent: "",
    p25: 0, p75: 0, p90: 0, p95: 0, p99: 0,
    gradeDistribution: {}, marksDistribution: [], meanPct: 0, medianPct: 0,
  };
  const marks = students.map((s) => getScopedTotal(s, scope));
  const maxP = (scope === "all6" ? 6 : 5) * 100;
  const passed = students.filter((s) => s.result === "PASS").length;
  const minVal = Math.min(...marks), maxVal = Math.max(...marks);
  const gradeDistribution: Record<string, number> = {};
  students.forEach((s) => s.subjects.forEach((sub) => {
    if (sub.grade) gradeDistribution[sub.grade] = (gradeDistribution[sub.grade] ?? 0) + 1;
  }));
  const buckets = [0.5, 0.6, 0.7, 0.8, 0.9].map((t, i, a) => ({
    label: i === 0 ? `<${Math.round(maxP * t)}` : `${Math.round(maxP * a[i - 1])}–${Math.round(maxP * t)}`,
    min: i === 0 ? 0 : maxP * a[i - 1], max: maxP * t,
  })).concat([{ label: `${Math.round(maxP * 0.9)}+`, min: maxP * 0.9, max: Infinity }]);
  const m = _mean(marks), med = _median(marks);
  return {
    count: students.length, passed, failed: students.length - passed,
    passRate: parseFloat(((passed / students.length) * 100).toFixed(1)),
    mean: m, median: med, stdDev: _std(marks),
    min: minVal, max: maxVal,
    minStudent: students[marks.indexOf(minVal)]?.name ?? "",
    maxStudent: students[marks.indexOf(maxVal)]?.name ?? "",
    p25: _pct(marks, 25), p75: _pct(marks, 75),
    p90: _pct(marks, 90), p95: _pct(marks, 95), p99: _pct(marks, 99),
    gradeDistribution,
    marksDistribution: buckets.map((b) => ({ label: b.label, count: marks.filter((x) => x >= b.min && x < b.max).length })),
    meanPct: parseFloat(((m / maxP) * 100).toFixed(1)),
    medianPct: parseFloat(((med / maxP) * 100).toFixed(1)),
  };
}

export function computeClassStats(students: ParsedStudent[], scope: SubjectScope): ClassStats[] {
  const maxP = (scope === "all6" ? 6 : 5) * 100;
  return Array.from(new Set(students.map((s) => s.section))).sort().map((section) => {
    const g = students.filter((s) => s.section === section);
    const marks = g.map((s) => getScopedTotal(s, scope));
    const passed = g.filter((s) => s.result === "PASS").length;
    const maxIdx = marks.indexOf(Math.max(...marks));
    const m = _mean(marks);
    return {
      section, count: g.length, passed,
      passRate: parseFloat(((passed / g.length) * 100).toFixed(1)),
      mean: m, median: _median(marks), stdDev: _std(marks),
      min: Math.min(...marks), max: Math.max(...marks),
      topper: g[maxIdx]?.name ?? "", topperMarks: Math.max(...marks),
      meanPct: parseFloat(((m / maxP) * 100).toFixed(1)),
    };
  });
}

export function computeSubjectAverages(students: ParsedStudent[]): SubjectAvg[] {
  const map: Record<string, { marks: number[], topper: string, topperMarks: number }> = {};
  students.forEach((s) => s.subjects.forEach((sub) => {
    if (sub.total !== null) {
      if (!map[sub.subjectName]) map[sub.subjectName] = { marks: [], topper: "", topperMarks: -1 };
      map[sub.subjectName].marks.push(sub.total);
      if (sub.total > map[sub.subjectName].topperMarks) {
        map[sub.subjectName].topperMarks = sub.total;
        map[sub.subjectName].topper = s.name;
      }
    }
  }));
  return Object.entries(map)
    .map(([n, d]) => ({ 
      subjectName: n, 
      avgMarks: _mean(d.marks), 
      avgPct: parseFloat((_mean(d.marks)).toFixed(1)), 
      count: d.marks.length,
      topper: d.topper,
      topperMarks: d.topperMarks
    }))
    .sort((a, b) => b.avgMarks - a.avgMarks);
}
