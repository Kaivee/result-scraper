"use client";

import { useState, useMemo } from "react";
import {
  ParsedStudent, SubjectScope,
  computeOverallStats, computeClassStats, computeSubjectAverages, computeSubjectClassAverages
} from "@/lib/data";
import Graphs from "./Graphs";

interface AnalyticsProps {
  students: ParsedStudent[];
  scope: SubjectScope;
}

const GRADE_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"];
const GRADE_COLORS: Record<string, string> = {
  A1: "bg-emerald-500", A2: "bg-teal-500", B1: "bg-sky-500", B2: "bg-blue-500",
  C1: "bg-violet-500", C2: "bg-purple-500", D: "bg-amber-500", E: "bg-red-500",
};

function StatCard({ label, value, sub, color = "text-slate-800 dark:text-slate-100" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 dark:text-slate-400 w-8 shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative">
        <div
          className={`h-full rounded-md transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-white mix-blend-screen">
          {value}
        </span>
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500 w-10 text-right shrink-0">{pct.toFixed(1)}%</span>
    </div>
  );
}

export default function Analytics({ students, scope }: AnalyticsProps) {

  const overall = useMemo(() => computeOverallStats(students, scope), [students, scope]);
  const classStats = useMemo(() => computeClassStats(students, scope), [students, scope]);
  const subjectAvgs = useMemo(() => computeSubjectAverages(students), [students]);
  const subjectClassAvgs = useMemo(() => computeSubjectClassAverages(students), [students]);

  const maxGradeCount = Math.max(...Object.values(overall.gradeDistribution), 1);
  const maxDistCount = Math.max(...overall.marksDistribution.map((b) => b.count), 1);
  const maxSubjectAvg = Math.max(...subjectAvgs.map((s) => s.avgMarks), 1);
  const maxClassMean = Math.max(...classStats.map((c) => c.mean), 1);

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "classwise" as const, label: "Class-wise" },
    { id: "subjects" as const, label: "Subject-wise" },
    { id: "graphs" as const, label: "Graphs" },
  ];

  const [tab, setTab] = useState<typeof tabs[number]["id"]>("overview");

  if (!students.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <div className="px-5 py-3 flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-r border-slate-100 dark:border-slate-800">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics
        </div>
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`analytics-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === t.id
                ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto px-4 py-3 text-xs text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {students.length} students
        </div>
      </div>

      <div className="p-5">
        {/* ─── OVERVIEW TAB ─── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Key numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Pass Rate" value={`${overall.passRate}%`}
                sub={`${overall.passed} / ${overall.count}`} color="text-emerald-600" />
              <StatCard label="Mean" value={overall.mean.toFixed(1)}
                sub={`${overall.meanPct}%`} color="text-blue-700" />
              <StatCard label="Median" value={overall.median.toFixed(1)}
                sub={`${overall.medianPct}%`} color="text-sky-700" />
              <StatCard label="Std Dev" value={overall.stdDev.toFixed(1)}
                sub="spread of scores" color="text-violet-700" />
              <StatCard label="Highest" value={overall.max.toString()}
                sub={overall.maxStudent} color="text-teal-700" />
              <StatCard label="Lowest" value={overall.min.toString()}
                sub={overall.minStudent} color="text-rose-600" />
            </div>

            {/* Percentiles */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Percentile Benchmarks
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "25th", value: overall.p25 },
                  { label: "75th", value: overall.p75 },
                  { label: "90th", value: overall.p90 },
                  { label: "95th", value: overall.p95 },
                  { label: "99th", value: overall.p99 },
                ].map((p) => (
                  <div key={p.label} className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      {p.label} %ile
                    </p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">{p.value}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {(((p.value) / ((scope === "all6" ? 6 : 5) * 100)) * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Grade Distribution */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Grade Distribution (all subjects)
                </p>
                <div className="space-y-2">
                  {GRADE_ORDER.filter((g) => overall.gradeDistribution[g]).map((grade) => (
                    <HBar
                      key={grade}
                      label={grade}
                      value={overall.gradeDistribution[grade]}
                      max={maxGradeCount}
                      color={GRADE_COLORS[grade] ?? "bg-slate-400"}
                    />
                  ))}
                </div>
              </div>

              {/* Marks Distribution */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Marks Distribution (buckets)
                </p>
                <div className="space-y-2">
                  {overall.marksDistribution.map((bucket) => (
                    <HBar
                      key={bucket.label}
                      label={bucket.label}
                      value={bucket.count}
                      max={maxDistCount}
                      color="bg-blue-500"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── CLASS-WISE TAB ─── */}
        {tab === "classwise" && (
          <div className="space-y-5">
            {/* Visual mean bars per section */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Mean Marks by Section
              </p>
              <div className="space-y-2">
                {classStats.map((c) => (
                  <HBar key={c.section} label={c.section.replace("XII ", "")}
                    value={Math.round(c.mean)} max={maxClassMean} color="bg-blue-600" />
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    {["Section", "Students", "Pass %", "Mean", "Median", "Std Dev", "Min", "Max", "Topper"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classStats.map((c) => (
                    <tr key={c.section} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{c.section}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.count}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${c.passRate === 100 ? "text-emerald-600 dark:text-emerald-500" : "text-amber-600 dark:text-amber-500"}`}>
                          {c.passRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {c.mean.toFixed(1)}
                        <span className="text-slate-400 dark:text-slate-500 font-normal text-xs ml-1">({c.meanPct}%)</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.median}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.stdDev}</td>
                      <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">{c.min}</td>
                      <td className="px-4 py-3 text-teal-700 dark:text-teal-400 font-medium">{c.max}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 dark:text-slate-300 font-medium text-xs">{c.topper}</div>
                        <div className="text-slate-400 dark:text-slate-500 text-xs">{c.topperMarks} marks</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot className="bg-blue-50 dark:bg-slate-800 text-xs font-semibold text-blue-700 dark:text-blue-400 border-t-2 border-blue-200 dark:border-slate-700">
                  <tr>
                    <td className="px-4 py-3">SCHOOL TOTAL</td>
                    <td className="px-4 py-3">{overall.count}</td>
                    <td className="px-4 py-3">{overall.passRate}%</td>
                    <td className="px-4 py-3">{overall.mean.toFixed(1)} <span className="text-blue-400 font-normal">({overall.meanPct}%)</span></td>
                    <td className="px-4 py-3">{overall.median}</td>
                    <td className="px-4 py-3">{overall.stdDev}</td>
                    <td className="px-4 py-3">{overall.min}</td>
                    <td className="px-4 py-3">{overall.max}</td>
                    <td className="px-4 py-3">{overall.maxStudent}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ─── SUBJECT-WISE TAB ─── */}
        {tab === "subjects" && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Average Marks per Subject (all students)
            </p>
            <div className="space-y-3">
              {subjectAvgs.map((s) => (
                <div key={s.subjectName} className="flex items-center gap-3">
                  <div className="w-44 shrink-0 text-right">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={s.subjectName}>
                      {s.subjectName}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.count} students</p>
                  </div>
                  <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${(s.avgMarks / maxSubjectAvg) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center pl-3 text-xs font-bold text-white">
                      {s.avgMarks.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-12 text-right shrink-0">
                    <span className={`text-xs font-bold ${
                      s.avgPct >= 90 ? "text-emerald-600" :
                      s.avgPct >= 80 ? "text-teal-600" :
                      s.avgPct >= 70 ? "text-sky-600" : "text-amber-600"
                    }`}>
                      {s.avgPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subject stats summary table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mt-4">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-right">Avg Marks</th>
                    <th className="px-4 py-3 text-right">Avg %</th>
                    <th className="px-4 py-3 text-right">Students</th>
                    <th className="px-4 py-3 text-right">Topper</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {subjectAvgs.map((s) => (
                    <tr key={s.subjectName} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-medium">{s.subjectName}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-800 dark:text-slate-100">{s.avgMarks.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-semibold ${
                          s.avgPct >= 90 ? "text-emerald-600" :
                          s.avgPct >= 80 ? "text-teal-600" :
                          s.avgPct >= 70 ? "text-sky-600" : "text-amber-600"
                        }`}>{s.avgPct.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{s.count}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate max-w-[150px] ml-auto" title={s.topper}>{s.topper}</div>
                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">{s.topperMarks} marks</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── GRAPHS TAB ─── */}
        {tab === "graphs" && (
          <Graphs 
            overall={overall}
            classStats={classStats}
            subjectAvgs={subjectAvgs}
            subjectClassAvgs={subjectClassAvgs}
          />
        )}
      </div>
    </div>
  );
}
