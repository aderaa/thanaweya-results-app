import React, { useState, useEffect, useMemo, useRef } from "react";
import Fuse from "fuse.js";

function normalizeArabic(text) {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و");
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${Math.floor(milliseconds / 100)}`;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const abortRef = useRef(false);
  const startTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);

  // Load and preprocess students
  useEffect(() => {
    fetch("/data/students.json")
      .then((res) => res.json())
      .then((data) => {
        const valid = data.filter((s) => s.total_degree <= 320);
        const ranked = valid
          .sort((a, b) => b.total_degree - a.total_degree)
          .map((student, idx) => ({
            ...student,
            rank: idx + 1,
            normalizedName: normalizeArabic(student.arabic_name),
            idString: student.seating_no.toString(),
          }));
        setStudents(ranked);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Create Fuse index only once when students change
  const fuse = useMemo(() => {
    if (students.length === 0) return null;
    return new Fuse(students, {
      keys: ["normalizedName", "idString"],
      threshold: 0.2,
      ignoreLocation: true,
    });
  }, [students]);

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed || !fuse) return;
    const hasLetter = /\D/.test(trimmed);
    if (hasLetter && trimmed.length < 5) {
      setError("يرجى إدخال اسم لا يقل عن 5 أحرف");
      return;
    }
    setError("");
    abortRef.current = false;
    setSearchPerformed(true);
    setIsSearching(true);
    setResults([]);
    setElapsedTime(0);
    startTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);

    setTimeout(() => {
      if (abortRef.current) {
        clearInterval(timerIntervalRef.current);
        setIsSearching(false);
        setResults([]);
        return;
      }
      const norm = normalizeArabic(trimmed);
      const fuseResults = fuse.search(norm);
      const matched = fuseResults.map(({ item }) => item);
      clearInterval(timerIntervalRef.current);
      setElapsedTime(Date.now() - startTimeRef.current);
      setResults(matched);
      setIsSearching(false);
    }, 0);
  };

  const handleStop = () => {
    abortRef.current = true;
    clearInterval(timerIntervalRef.current);
    setIsSearching(false);
  };

  const handleReset = () => {
    abortRef.current = true;
    clearInterval(timerIntervalRef.current);
    setQuery("");
    setResults([]);
    setSearchPerformed(false);
    setIsSearching(false);
    setError("");
    setElapsedTime(0);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const Spinner = () => (
    <div className="flex flex-col items-center my-6">
      <svg
        className="animate-spin h-8 w-8 text-indigo-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        ></path>
      </svg>
      <p className="mt-2 text-sm">
        الوقت المستغرق: {formatTime(elapsedTime)}
      </p>
    </div>
  );

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"} min-h-screen py-10 px-4 font-sans transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto relative">
        <button onClick={toggleDarkMode} className="absolute top-4 right-4 px-4 py-1 bg-gray-300 dark:bg-gray-700 dark:text-white text-black rounded shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition">
          {darkMode ? "☀️ وضع النهار" : "🌙 الوضع الليلي"}
        </button>

        <h1 className="text-3xl font-bold text-center mb-8">نتيجة الثانوية العامة - 2025</h1>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-4">
          <input
            type="text"
            placeholder="اكتب جزء من الاسم أو رقم الجلوس..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError("");
            }}
            className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white bg-white dark:bg-gray-800"
          />
          {!isSearching && (
            <button onClick={handleSearch} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded shadow hover:bg-indigo-700 transition">
              بحث
            </button>
          )}
          {isSearching && (
            <button onClick={handleStop} className="px-5 py-2 bg-red-600 text-white font-semibold rounded shadow hover:bg-red-700 transition">
              إيقاف البحث
            </button>
          )}
          <button onClick={handleReset} className="px-5 py-2 bg-gray-300 text-gray-800 font-semibold rounded shadow hover:bg-gray-400 transition">
            إعادة ضبط
          </button>
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {isLoading && <Spinner />}
        {!isLoading && isSearching && <Spinner />}

        {!isLoading && searchPerformed && !isSearching && (
          <>
            <p className="text-center mb-4">
              {results.length > 0
                ? `عدد النتائج: ${results.length} | الوقت: ${formatTime(elapsedTime)}`
                : "لا يوجد نتائج مطابقة"}
            </p>
            {results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {results.map((student) => (
                  <div
                    key={student.seating_no}
                    className={`p-4 rounded-xl shadow border transition ${
                      student.rank <= 10
                        ? (darkMode
                          ? "border-yellow-400 bg-yellow-900"
                          : "border-yellow-400 bg-yellow-50")
                        : (darkMode
                          ? "border-gray-700 bg-gray-800"
                          : "bg-white border-indigo-100")
                    }`}
                  >
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      رقم الجلوس: <strong>{student.seating_no}</strong>
                    </p>
                    <p className="text-lg font-medium">
                      {student.arabic_name}
                      {student.rank <= 10 && (
                        <span className="ml-2 text-yellow-400 text-sm font-bold">🎖️ من الأوائل</span>
                      )}
                    </p>
                    <p className="text-sm">
                      المجموع: <strong>{student.total_degree}</strong>
                    </p>
                    <p className="text-sm">
                      الترتيب على الجمهورية: <strong>{student.rank}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
