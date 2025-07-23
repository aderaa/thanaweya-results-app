import React, { useState, useEffect, useRef } from "react";

function normalizeArabic(text) {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و");
}

function formatTime(ms) {
  if (ms < 1000) return `${ms} مللي ثانية`;
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(2)} ثانية`;
  const min = Math.floor(totalSec / 60);
  const sec = (totalSec % 60).toFixed(2);
  return `${min} دقيقة و ${sec} ثانية`;
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
  const timerRef = useRef(null);

  // Initial data load with timer
  useEffect(() => {
    abortRef.current = false;
    setIsLoading(true);
    setElapsedTime(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - start);
    }, 100);

    fetch("/data/students.json")
      .then((res) => res.json())
      .then((data) => {
        const valid = data.filter((s) => s.total_degree <= 320).
          sort((a, b) => b.total_degree - a.total_degree)
          .map((student, idx) => ({
            ...student,
            rank: idx + 1,
            normalizedName: normalizeArabic(student.arabic_name),
            idString: student.seating_no.toString(),
          }));
        setStudents(valid);
      })
      .finally(() => {
        clearInterval(timerRef.current);
        setElapsedTime(Date.now() - start);
        setIsLoading(false);
      });
  }, []);

  const CHUNK_SIZE = 500;

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed || !students.length) return;
    if (/\D/.test(trimmed) && trimmed.length < 5) {
      setError("يرجى إدخال اسم لا يقل عن 5 أحرف");
      return;
    }
    setError("");
    abortRef.current = false;
    setSearchPerformed(true);
    setIsSearching(true);
    setResults([]);
    setElapsedTime(0);

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - start);
    }, 100);

    const norm = normalizeArabic(trimmed);
    const matched = [];

    function processChunk(startIndex) {
      if (abortRef.current) {
        clearInterval(timerRef.current);
        setIsSearching(false);
        return;
      }
      const endIndex = Math.min(startIndex + CHUNK_SIZE, students.length);
      for (let i = startIndex; i < endIndex; i++) {
        const s = students[i];
        if (s.normalizedName.includes(norm) || s.idString.includes(trimmed)) {
          matched.push(s);
        }
      }
      if (endIndex < students.length) {
        setTimeout(() => processChunk(endIndex), 0);
      } else {
        clearInterval(timerRef.current);
        setElapsedTime(Date.now() - start);
        setResults(matched);
        setIsSearching(false);
      }
    }

    processChunk(0);
  };

  const handleStop = () => {
    abortRef.current = true;
    clearInterval(timerRef.current);
    setIsSearching(false);
  };

  const handleReset = () => {
    abortRef.current = true;
    clearInterval(timerRef.current);
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
      <p className="mt-2 text-sm">الوقت المستغرق: {formatTime(elapsedTime)}</p>
    </div>
  );

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"} min-h-screen py-10 px-4 font-sans transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto relative">
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 px-4 py-1 bg-gray-300 dark:bg-gray-700 dark:text-white text-black rounded shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition"
        >
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
          {!isSearching ? (
            <button
              onClick={handleSearch}
              className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded shadow hover:bg-indigo-700 transition"
            >
              بحث
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-5 py-2 bg-red-600 text-white font-semibold rounded shadow hover:bg-red-700 transition"
            >
              إيقاف البحث
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-5 py-2 bg-gray-300 text-gray-800 font-semibold rounded shadow hover:bg-gray-400 transition"
          >
            إعادة ضبط
          </button>
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {(isLoading || isSearching) && <Spinner />}

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
                    <p className="text-sm text-gray-500 dark:text-gray-400">رقم الجلوس: <strong>{student.seating_no}</strong></p>
                    <p className="text-lg font-medium">
                      {student.arabic_name}
                      {student.rank <= 10 && <span className="ml-2 text-yellow-400 text-sm font-bold">🎖️ من الأوائل</span>}
                    </p>
                    <p className="text-sm">المجموع: <strong>{student.total_degree}</strong></p>
                    <p className="text-sm">الترتيب على الجمهورية: <strong>{student.rank}</strong></p>
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
