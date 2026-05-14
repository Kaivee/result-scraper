"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import StudentCard from "@/components/StudentCard";
import Analytics from "@/components/Analytics";
import { ParsedStudent, SubjectScope, getScopedTotal } from "@/lib/data";

// ─── Custom Hooks ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Navbar (inlined) ─────────────────────────────────────────────────────────
function Navbar({ searchQuery, onSearchChange, totalCount, filteredCount }: {
  searchQuery: string; onSearchChange: (q: string) => void;
  totalCount: number; filteredCount: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, []);
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white border-b border-slate-200 ${
      scrolled ? "shadow-md backdrop-blur-md bg-white/95" : ""
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 shadow-lg flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current text-white" aria-hidden>
                <path d="M16 2 L28 7 L28 18 C28 24 22 29 16 30 C10 29 4 24 4 18 L4 7 Z" />
                <path d="M11 16 L15 20 L21 13" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-slate-800 tracking-tight">CBSE Results 2026</span>
              <span className="text-xs text-blue-600 font-medium hidden sm:block">Class XII · Official Portal</span>
            </div>
          </div>
          <div className="flex-1 max-w-xl relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input id="navbar-search" ref={inputRef} type="text" value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or roll number…"
              className="w-full pl-9 pr-16 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700"
              aria-label="Search students" />
            {searchQuery
              ? <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Clear">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              : <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">⌘K</kbd>
            }
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button className="hidden sm:flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF Summary
            </button>
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600">
                {filteredCount.toLocaleString()}{filteredCount !== totalCount && <span className="text-slate-400"> / {totalCount.toLocaleString()}</span>} students
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const PAGE_SIZE = 24;

type SortKey = "name" | "marks" | "roll" | "percent";
type ResultFilter = "ALL" | "PASS" | "FAIL";

export default function ClientPage({ initialStudents }: { initialStudents: ParsedStudent[] }) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Filters & sort
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterResult, setFilterResult] = useState<ResultFilter>("ALL");
  const [filterSection, setFilterSection] = useState<string>("ALL");
  const [scope, setScope] = useState<SubjectScope>("best5");

  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dynamic section list
  const sections = useMemo(() => {
    const s = Array.from(new Set(initialStudents.map((s) => s.section))).sort();
    return ["ALL", ...s];
  }, [initialStudents]);

  // Filter + sort (using debounced query)
  const filteredStudents = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase().trim();
    let list = initialStudents;

    if (q) list = list.filter((s) =>
      s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)
    );
    if (filterResult !== "ALL") list = list.filter((s) => s.result === filterResult);
    if (filterSection !== "ALL") list = list.filter((s) => s.section === filterSection);

    return [...list].sort((a, b) => {
      let diff = 0;
      if (sortBy === "name") diff = a.name.localeCompare(b.name);
      else if (sortBy === "roll") diff = a.rollNumber.localeCompare(b.rollNumber);
      else if (sortBy === "marks" || sortBy === "percent") {
        diff = getScopedTotal(a, scope) - getScopedTotal(b, scope);
      }
      return sortDirection === "asc" ? diff : -diff;
    });
  }, [initialStudents, debouncedSearchQuery, sortBy, sortDirection, filterResult, filterSection, scope]);

  // Analytics uses section + result filter but NOT search
  const analyticsStudents = useMemo(() => {
    let list = initialStudents;
    if (filterResult !== "ALL") list = list.filter((s) => s.result === filterResult);
    if (filterSection !== "ALL") list = list.filter((s) => s.section === filterSection);
    return list;
  }, [initialStudents, filterResult, filterSection]);

  // Compute ranks to handle ties
  const studentRanks = useMemo(() => {
    if (sortBy !== "marks" && sortBy !== "percent") return [];
    const ranks: number[] = [];
    let currentRank = 1;
    for (let i = 0; i < filteredStudents.length; i++) {
      if (i > 0) {
        const prevMarks = getScopedTotal(filteredStudents[i - 1], scope);
        const currMarks = getScopedTotal(filteredStudents[i], scope);
        const changed = sortDirection === "desc" ? currMarks < prevMarks : currMarks > prevMarks;
        if (changed) {
          currentRank = i + 1; // Standard competition ranking
        }
      }
      ranks.push(currentRank);
    }
    return ranks;
  }, [filteredStudents, sortBy, scope, sortDirection]);

  // Reset pagination on any filter change
  useEffect(() => { setDisplayedCount(PAGE_SIZE); }, [debouncedSearchQuery, sortBy, sortDirection, filterResult, filterSection, scope]);

  // Infinite scroll
  const loadMore = useCallback(() => {
    setDisplayedCount((prev) => Math.min(prev + PAGE_SIZE, filteredStudents.length));
  }, [filteredStudents.length]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    const el = loaderRef.current;
    if (el) obs.observe(el);
    return () => { if (el) obs.unobserve(el); };
  }, [loadMore]);

  const displayedStudents = filteredStudents.slice(0, displayedCount);
  const hasMore = displayedCount < filteredStudents.length;

  const scopeOptions: { value: SubjectScope; label: string; desc: string }[] = [
    { value: "best5", label: "Best 5", desc: "English + top 4 others" },
    { value: "first5", label: "First 5", desc: "Subjects 1–5" },
    { value: "all6", label: "All 6", desc: "All subjects" },
  ];

  return (
    <>
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={initialStudents.length}
        filteredCount={filteredStudents.length}
      />

      <main className="min-h-screen bg-slate-50 pt-16 pb-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-1">Official Portal</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                  CBSE Class XII Results <span className="text-blue-300">2026</span>
                </h1>
                <p className="text-blue-200 text-sm mt-2">Session 2025–2026 · Declared on 13 May 2026</p>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-xs text-blue-300 uppercase tracking-wider">School</span>
                <span className="text-sm font-semibold text-white leading-snug max-w-xs">
                  Amity International School, Sec 46, Gurgaon, Haryana
                </span>
                <span className="text-xs text-blue-300 mt-1">School Code: 40525</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

          {/* ── Filter & Control Bar ── */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0">Subjects:</span>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  {scopeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setScope(opt.value)}
                      title={opt.desc}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                        scope === opt.value
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {scope === "best5" && (
                  <span className="text-[10px] text-blue-500 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 hidden sm:block">
                    English locked ✓
                  </span>
                )}
              </div>

              <div className="h-5 border-l border-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0">Result:</span>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  {(["ALL", "PASS", "FAIL"] as const).map((val) => (
                    <button key={val}
                      onClick={() => setFilterResult(val)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        filterResult === val
                          ? val === "PASS" ? "bg-emerald-600 text-white shadow-sm"
                          : val === "FAIL" ? "bg-red-600 text-white shadow-sm"
                          : "bg-white text-slate-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}>
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-5 border-l border-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider shrink-0">Class:</span>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="text-xs bg-slate-100 border-0 rounded-lg px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {sections.map((sec) => (
                    <option key={sec} value={sec}>{sec === "ALL" ? "All Sections" : sec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sort:</span>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  {([
                    { value: "name" as SortKey, label: "Name" },
                    { value: "marks" as SortKey, label: "Marks" },
                    { value: "percent" as SortKey, label: "%" },
                    { value: "roll" as SortKey, label: "Roll" },
                  ]).map((opt) => (
                    <button key={opt.value}
                      onClick={() => {
                        if (sortBy === opt.value) {
                          setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy(opt.value);
                          setSortDirection((opt.value === "marks" || opt.value === "percent") ? "desc" : "asc");
                        }
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        sortBy === opt.value
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}>
                      {opt.label}
                      {sortBy === opt.value && (
                        <svg className={`w-3.5 h-3.5 transition-transform ${sortDirection === "asc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAnalytics((v) => !v)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    showAnalytics
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {showAnalytics ? "Hide Analytics" : "Show Analytics"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Analytics Panel ── */}
          {showAnalytics && analyticsStudents.length > 0 && (
            <Analytics students={analyticsStudents} scope={scope} />
          )}

          {/* ── Empty ── */}
          {filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <p className="text-slate-700 font-semibold">No students found</p>
              <p className="text-slate-400 text-sm">Try adjusting your filters or search query</p>
              <button
                onClick={() => { setSearchQuery(""); setFilterResult("ALL"); setFilterSection("ALL"); }}
                className="mt-1 text-blue-600 hover:text-blue-800 text-sm font-medium underline underline-offset-2"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* ── Student Grid ── */}
          {displayedStudents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedStudents.map((student, i) => (
                <StudentCard
                  key={student.rollNumber}
                  student={student}
                  scope={scope}
                  rank={(sortBy === "marks" || sortBy === "percent") ? studentRanks[i] : undefined}
                />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={loaderRef} className="flex justify-center py-8" aria-label="Loading more">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {/* End of list */}
          {!hasMore && displayedStudents.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-400 shadow-sm">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All {filteredStudents.length} records displayed
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© 2026 CBSE Results Portal · Amity International School, Sec 46 Gurgaon</p>
          <p>For official results, visit <span className="text-blue-500">cbse.gov.in</span></p>
        </div>
      </footer>

      {/* Scroll to Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </>
  );
}
