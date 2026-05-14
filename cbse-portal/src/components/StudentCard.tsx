"use client";

import { useState } from "react";
import { ParsedStudent, SubjectMark, SubjectScope, getScopedSubjects, getScopedTotal, getScopedMax } from "@/lib/data";

interface StudentCardProps {
  student: ParsedStudent;
  scope: SubjectScope;
  rank?: number;
}

const GRADE_COLORS: Record<string, string> = {
  A1: "bg-emerald-50 text-emerald-700 border-emerald-200",
  A2: "bg-teal-50 text-teal-700 border-teal-200",
  B1: "bg-sky-50 text-sky-700 border-sky-200",
  B2: "bg-blue-50 text-blue-700 border-blue-200",
  C1: "bg-violet-50 text-violet-700 border-violet-200",
  C2: "bg-purple-50 text-purple-700 border-purple-200",
  D: "bg-amber-50 text-amber-700 border-amber-200",
  E: "bg-red-50 text-red-700 border-red-200",
};
function gradeColor(g: string) {
  return GRADE_COLORS[g] ?? "bg-slate-50 text-slate-600 border-slate-200";
}
function barColor(total: number | null) {
  if (total === null) return "bg-slate-300";
  if (total >= 91) return "bg-emerald-500";
  if (total >= 81) return "bg-teal-500";
  if (total >= 71) return "bg-sky-500";
  if (total >= 61) return "bg-blue-500";
  if (total >= 51) return "bg-amber-500";
  return "bg-red-500";
}

function inferMaxMarks(obtained: number, type: "theory" | "practical" | "total"): number {
  if (type === "practical") {
    if (obtained <= 20) return 20;
    if (obtained <= 30) return 30;
    if (obtained <= 40) return 40;
    if (obtained <= 50) return 50;
    if (obtained <= 70) return 70;
    return 100;
  }
  if (type === "theory") {
    if (obtained <= 30) return 30;
    if (obtained <= 40) return 40;
    if (obtained <= 50) return 50;
    if (obtained <= 70) return 70;
    if (obtained <= 80) return 80;
    return 100;
  }
  return 100; // total is always out of 100
}

function SubjectRow({ subject }: { subject: SubjectMark }) {
  const theoryMax = subject.theory !== null ? inferMaxMarks(subject.theory, "theory") : 100;
  const theoryPct = subject.theory !== null ? (subject.theory / theoryMax) * 100 : 0;
  
  const pracMax = subject.practical !== null ? inferMaxMarks(subject.practical, "practical") : 100;
  const pracPct = subject.practical !== null ? (subject.practical / pracMax) * 100 : 0;

  const totalMax = 100;
  const totalPct = subject.total !== null ? (subject.total / totalMax) * 100 : 0;

  return (
    <div className="py-3 px-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{subject.subjectName}</p>
          <p className="text-xs text-slate-400 mt-0.5">Code: {subject.subjectCode}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {subject.theory !== null && (
            <div className="flex flex-col items-end w-12">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Theory</p>
              <p className="text-xs font-semibold text-slate-600 leading-tight mt-0.5">{subject.theory}</p>
              <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${Math.min(theoryPct, 100)}%` }} />
              </div>
            </div>
          )}
          {subject.practical !== null && subject.practical > 0 && (
            <div className="flex flex-col items-end w-12">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Prac</p>
              <p className="text-xs font-semibold text-slate-600 leading-tight mt-0.5">{subject.practical}</p>
              <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${Math.min(pracPct, 100)}%` }} />
              </div>
            </div>
          )}
          <div className="flex flex-col items-end w-12">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">{subject.total ?? "—"}</p>
          </div>
          <div className="w-10 text-right">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${gradeColor(subject.grade)}`}>
              {subject.grade || "—"}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor(subject.total)}`}
          style={{ width: `${Math.min(totalPct, 100)}%` }} />
      </div>
    </div>
  );
}

export default function StudentCard({ student, scope, rank }: StudentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scopedSubs = getScopedSubjects(student, scope);
  const scopedTotal = getScopedTotal(student, scope);
  const scopedMax = getScopedMax(student, scope);
  const pct = scopedMax > 0 ? ((scopedTotal / scopedMax) * 100).toFixed(1) : "0.0";
  const isPassed = student.result === "PASS";

  const scopeLabel = scope === "best5" ? "Best-5" : scope === "first5" ? "First-5" : "All-6";

  return (
    <article
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group ${
        expanded ? "ring-2 ring-blue-500 ring-offset-1" : "border-slate-200"
      }`}
    >
      <button
        id={`card-${student.rollNumber}`}
        className="w-full text-left p-5 focus:outline-none"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`details-${student.rollNumber}`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Avatar + Info */}
          <div className="flex flex-1 items-start gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${
                student.sex === "F" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
              }`}>
                {student.name.charAt(0)}
              </div>
              {rank && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {rank}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors truncate">
                {student.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md font-mono font-medium">
                  {student.rollNumber}
                </span>
                {student.section && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{student.section}</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate">{student.schoolName}</p>
            </div>
          </div>

          {/* Right: result + marks + chevron */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              isPassed
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}>
              {isPassed ? "✓" : "✗"} {student.result}
            </span>
            <div className="text-right">
              <p className="text-lg font-extrabold text-slate-800 leading-tight">
                {scopedTotal}
                <span className="text-xs font-normal text-slate-400"> / {scopedMax}</span>
              </p>
              <p className="text-xs text-slate-400">{pct}% · {scopeLabel}</p>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Grade pills for scoped subjects */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {scopedSubs.map((s, i) => (
            <span key={i}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${gradeColor(s.grade)}`}
              title={`${s.subjectName}: ${s.total}`}>
              <span className="hidden sm:inline text-[10px] opacity-70 truncate max-w-[60px]">
                {s.subjectName.split(" ")[0]}
              </span>
              {s.grade || "—"}
            </span>
          ))}
        </div>
      </button>

      {/* Expanded details */}
      <div id={`details-${student.rollNumber}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}`}
        aria-hidden={!expanded}>
        <div className="border-t border-slate-100">
          {/* Info strip */}
          <div className="px-5 py-3 bg-slate-50 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Father</p>
              <p className="text-slate-700 font-medium mt-0.5">{student.fatherName}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Mother</p>
              <p className="text-slate-700 font-medium mt-0.5">{student.motherName}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Session</p>
              <p className="text-slate-700 font-medium mt-0.5">{student.session}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">{scopeLabel} Total</p>
              <p className="text-slate-700 font-bold mt-0.5 text-sm">{scopedTotal} / {scopedMax}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Declaration</p>
              <p className="text-slate-700 font-medium mt-0.5">{student.dateOfDeclaration}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Adm. No.</p>
              <p className="text-slate-700 font-mono font-medium mt-0.5">{student.id}</p>
            </div>
          </div>

          {/* All subjects (always show all in expanded view) */}
          <div className="px-2 py-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-2">
              Subject-wise Marks
            </p>
            {student.subjects.map((sub, i) => <SubjectRow key={i} subject={sub} />)}
          </div>

          {/* Co-Scholastic */}
          {student.internalSubjects.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Co-Scholastic Activities
              </p>
              <div className="flex flex-wrap gap-2">
                {student.internalSubjects.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="text-slate-600 font-medium">{s.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold border ${gradeColor(s.grade)}`}>{s.grade}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
