"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell
} from "recharts";
import { 
  OverallStats, ClassStats, SubjectAvg, SubjectClassAvg, 
  GenderStats, SubjectGradeDist, SubjectPassFail, TopStudent 
} from "@/lib/data";

interface GraphsProps {
  overall: OverallStats;
  classStats: ClassStats[];
  subjectAvgs: SubjectAvg[];
  subjectClassAvgs: SubjectClassAvg[];
  genderStats: GenderStats[];
  subjectGradeDist: SubjectGradeDist[];
  subjectPassFail: SubjectPassFail[];
  top10: TopStudent[];
}

// Helper to check if dark mode is active to style charts
function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const SECTION_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
const GRADE_COLORS = ["#10b981", "#34d399", "#3b82f6", "#60a5fa", "#8b5cf6", "#a78bfa", "#f59e0b", "#ef4444"];

export default function Graphs({ 
  overall, classStats, subjectAvgs, subjectClassAvgs, 
  genderStats, subjectGradeDist, subjectPassFail, top10 
}: GraphsProps) {
  const isDark = useIsDark();
  const [activeCategory, setActiveCategory] = useState<"overview" | "subjects" | "demographics" | "leaderboard">("overview");
  
  const textColor = isDark ? "#cbd5e1" : "#64748b"; // slate-300 : slate-500
  const gridColor = isDark ? "#334155" : "#e2e8f0"; // slate-700 : slate-200
  const tooltipStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff", // slate-900 : white
    borderColor: isDark ? "#1e293b" : "#e2e8f0",     // slate-800 : slate-200
    color: isDark ? "#f8fafc" : "#0f172a",           // slate-50  : slate-900
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  };

  const sections = useMemo(() => classStats.map(c => c.section), [classStats]);

  const categories = [
    { id: "overview" as const, label: "Performance Overview" },
    { id: "subjects" as const, label: "Subject Deep-Dive" },
    { id: "demographics" as const, label: "Demographics" },
    { id: "leaderboard" as const, label: "Leaderboard" },
  ];

  return (
    <div className="space-y-6 mt-4">
      
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 justify-center md:justify-start pb-2 border-b border-slate-200 dark:border-slate-800">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === c.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW CATEGORY ─── */}
      {activeCategory === "overview" && (
        <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Overall Marks Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overall.marksDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="label" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                  <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                    {overall.marksDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3b82f6" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Class-wise Mean Marks</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="section" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 10']} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                  <Bar dataKey="mean" name="Mean Marks" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUBJECT DEEP-DIVE CATEGORY ─── */}
      {activeCategory === "subjects" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Subject-wise Average %</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={subjectAvgs.slice(0, 8)} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke={gridColor} />
                    <PolarAngleAxis dataKey="subjectName" tick={{ fill: textColor, fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: textColor, fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} />
                    <Radar name="Average %" dataKey="avgPct" stroke="#6366f1" fill="#6366f1" fillOpacity={isDark ? 0.4 : 0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">Showing top 8 subjects by volume</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Subject Averages by Section</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={subjectClassAvgs.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="subjectName" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 100]} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', color: textColor }} />
                    {sections.map((sec, idx) => (
                      <Line key={sec} type="monotone" dataKey={sec} name={sec} stroke={SECTION_COLORS[idx % SECTION_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">Showing top 6 subjects by volume</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Grade Distribution per Subject</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectGradeDist.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="subjectName" type="category" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', color: textColor }} />
                    {["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"].map((grade, idx) => (
                      <Bar key={grade} dataKey={grade} stackId="a" fill={GRADE_COLORS[idx]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Pass vs Fail per Subject</h3>
              <div className="h-[300px] w-full overflow-x-auto custom-scrollbar">
                <div style={{ minWidth: `${Math.max(100, subjectPassFail.length * 60)}px`, height: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPassFail} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="subjectName" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: textColor }} />
                      <Bar dataKey="passed" name="Pass" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="failed" name="Compartment/Fail" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DEMOGRAPHICS CATEGORY ─── */}
      {activeCategory === "demographics" && (
        <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Gender Performance (Mean)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="gender" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v === "M" ? "Male" : v === "F" ? "Female" : v} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 10']} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                  <Bar dataKey="mean" name="Mean Marks" radius={[4, 4, 0, 0]}>
                    {genderStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.gender === "M" ? "#3b82f6" : entry.gender === "F" ? "#ec4899" : "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Gender Distribution (Count)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="gender" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v === "M" ? "Male" : v === "F" ? "Female" : v} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                  <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                    {genderStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.gender === "M" ? "#60a5fa" : entry.gender === "F" ? "#f472b6" : "#a78bfa"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ─── LEADERBOARD CATEGORY ─── */}
      {activeCategory === "leaderboard" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm max-w-3xl mx-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Top 10 Students</h3>
            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax']} />
                  <YAxis dataKey="name" type="category" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} width={120} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: isDark ? '#e2e8f0' : '#334155' }} labelStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold', marginBottom: '4px' }} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                  <Bar dataKey="marks" name="Total Marks" fill="#f59e0b" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: textColor, fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
