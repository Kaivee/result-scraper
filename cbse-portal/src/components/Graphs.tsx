"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell
} from "recharts";
import { OverallStats, ClassStats, SubjectAvg, SubjectClassAvg } from "@/lib/data";

interface GraphsProps {
  overall: OverallStats;
  classStats: ClassStats[];
  subjectAvgs: SubjectAvg[];
  subjectClassAvgs: SubjectClassAvg[];
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

const SECTION_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"
];

export default function Graphs({ overall, classStats, subjectAvgs, subjectClassAvgs }: GraphsProps) {
  const isDark = useIsDark();
  
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

  return (
    <div className="space-y-8">
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 1. Overall Marks Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Overall Marks Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overall.marksDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                  {overall.marksDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Class-wise Mean & Pass Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Class-wise Mean Marks</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="section" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 10']} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                <Bar dataKey="mean" name="Mean Marks" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 3. Subject Radar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Subject-wise Average %</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={subjectAvgs.slice(0, 8)} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="subjectName" tick={{ fill: textColor, fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: textColor, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Radar name="Average %" dataKey="avgPct" stroke="#6366f1" fill="#6366f1" fillOpacity={isDark ? 0.4 : 0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">Showing top 8 subjects by volume</p>
        </div>

        {/* 4. Subject-Class Grouped Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Subject Averages by Section</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectClassAvgs.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="subjectName" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: textColor }} />
                {sections.map((sec, idx) => (
                  <Bar key={sec} dataKey={sec} name={sec} fill={SECTION_COLORS[idx % SECTION_COLORS.length]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">Showing top 5 subjects by volume</p>
        </div>
      </div>

    </div>
  );
}
