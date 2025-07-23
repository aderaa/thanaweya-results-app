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
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tooltip, setTooltip] = useState("");

  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const abortRef = useRef(false);
  const workerRef = useRef(null);

  const PAGE_SIZE = 24;
  const encouraging = [
    "أنت نجم ساطع! 🌟",
    "المستقبل مليء بالمغامرات الرائعة! 🚀",
    "كل خطوة تقربك من حلمك! 🏆",
    "استمر وستنال ما تريد! 💪",
    "ابتسم للمستقبل! 😊",
    "اليوم هو بداية نجاحاتك المتتالية! 🥇",
    "العلم نور، وأنت باذن الله منور! 📚",
    "باجتهادك تصنع مستقبلك بيدك! 🔧",
    "ثقتك بنفسك مفتاح التميز! 🔑",
    "كل تعب اليوم ثماره ستحصدها غدًا! 🌱",
    "ارسم أهدافك ولا تتوقف عن السعي! 🎯",
    "خطوة اليوم تصنع قصة نجاح الغد! 📖"
  ];

  // Load data with timer
  useEffect(() => {
    abortRef.current = false;
    setIsLoading(true);
    setElapsedTime(0);
    const start = Date.now();
    startTimeRef.current = start;
    timerRef.current = setInterval(() => setElapsedTime(Date.now() - start), 100);

    fetch("/data/students.json")
      .then(res => res.json())
      .then(data => {
        const valid = data
          .filter(s => s.total_degree <= 320)
          .sort((a, b) => b.total_degree - a.total_degree)
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

  // Setup Web Worker for resilient word matching
  useEffect(() => {
    if (!students.length) return;
    const code = `self.onmessage=e=>{const{students,terms,raw}=e.data;const m=students.filter(s=>terms.every(t=>s.normalizedName.includes(t))||s.idString.includes(raw));postMessage(m);}`;
    const blob = new Blob([code], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));
    workerRef.current.onmessage = e => {
      if (abortRef.current) return;
      clearInterval(timerRef.current);
      setElapsedTime(Date.now() - startTimeRef.current);
      setResults(e.data);
      setIsSearching(false);
      setCurrentPage(1);
      setTooltip(encouraging[Math.floor(Math.random() * encouraging.length)]);
    };
    return () => workerRef.current.terminate();
  }, [students]);

  const handleSearch = () => {
    const raw = query.trim();
    if (!raw || !students.length) return;
    if (/\D/.test(raw) && raw.length < 5) {
      setError("يرجى إدخال اسم لا يقل عن 5 أحرف");
      return;
    }
    setError("");
    abortRef.current = false;
    setSearchPerformed(true);
    setIsSearching(true);
    setResults([]);
    setElapsedTime(0);

    const normalized = normalizeArabic(raw);
    const terms = normalized.split(/\s+/).filter(t => t);
    const start = Date.now();
    startTimeRef.current = start;
    timerRef.current = setInterval(() => setElapsedTime(Date.now() - start), 100);

    workerRef.current.postMessage({ students, terms, raw });
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
    setCurrentPage(1);
  };

  const toggleDarkMode = () => setDarkMode(p => !p);

  const Spinner = () =>
    (isLoading || isSearching) && (
      <div className="flex flex-col items-center my-6">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="mt-2 text-sm">الوقت المستغرق: {formatTime(elapsedTime)}</p>
      </div>
    );

  const totalPages = Math.ceil(results.length / PAGE_SIZE) || 1;
  const paginated = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'} relative min-h-screen flex flex-col py-10 px-4 font-sans transition-colors duration-300`}>
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 px-3 py-1 bg-gray-300 dark:bg-gray-700 dark:text-white text-black rounded shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition"
      >{darkMode ? '☀️ وضع النهار' : '🌙 الوضع الليلي'}</button>

      {/* Page Title */}
      <h1 className="text-3xl font-bold text-center mb-8">نتيجة الثانوية العامة - 2025</h1>

      <div className="max-w-4xl mx-auto flex-grow">
        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-2">
          <input
            type="text"
            placeholder="اكتب جزء من الاسم أو رقم الجلوس..."
            value={query}
            disabled={isLoading || isSearching}
            onChange={e => { setQuery(e.target.value); if (error) setError(""); }}
            onKeyDown={e => e.key === 'Enter' && !isSearching && handleSearch()}
            className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white bg-white dark:bg-gray-800"
          />
          {!isSearching ? (
            <button onClick={handleSearch} disabled={isLoading} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded shadow hover:bg-indigo-700 transition">بحث</button>
          ) : (
            <button onClick={handleStop} className="px-5 py-2 bg-red-600 text-white font-semibold rounded shadow hover:bg-red-700 transition">إيقاف البحث</button>
          )}
          <button onClick={handleReset} className="px-5 py-2 bg-gray-300 text-gray-800 font-semibold rounded shadow hover:bg-gray-400 transition">إعادة ضبط</button>
        </div>

        {/* Tooltip & Error Messages */}
        {tooltip && <div className="mb-4 text-center text-indigo-500 italic">{tooltip}</div>}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Loading Spinner */}
        {Spinner()} 

        {/* Search Results */}
        {!isLoading && searchPerformed && !isSearching && (
          <>  
            <p className="text-center mb-4">
              {results.length > 0 
                ? `عدد النتائج: ${results.length} | الوقت: ${formatTime(elapsedTime)}` 
                : 'لا يوجد نتائج مطابقة'}
            </p>

            {results.length > 0 && (
              <>              
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {paginated.map(s => (
                    <div key={s.seating_no} className={`p-4 rounded-xl shadow border transition ${
                      s.rank <= 10 
                        ? (darkMode
                            ? 'border-yellow-400 bg-yellow-900'
                            : 'border-yellow-400 bg-yellow-50')
                        : (darkMode
                            ? 'border-gray-700 bg-gray-800'
                            : 'bg-white border-indigo-100')
                    }`}>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        رقم الجلوس: <strong>{s.seating_no}</strong>
                      </p>
                      <p className="text-lg font-medium">
                        {s.arabic_name}
                        {s.rank <= 10 && (
                          <span className="ml-2 text-yellow-400 text-sm font-bold">🎖️ من الأوائل</span>
                        )}
                      </p>
                      <p className="text-sm">
                        المجموع: <strong>{s.total_degree}</strong> (<strong>{((s.total_degree / 320) * 100).toFixed(1)}%</strong>)
                      </p>
                      <p className="text-sm">
                        الترتيب على الجمهورية: <strong>{s.rank}</strong> (<strong>{((s.rank / students.length) * 100).toFixed(1)}%</strong>)
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center items-center space-x-2 mb-8">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-black dark:text-white rounded disabled:opacity-50">السابق</button>
                  <span>صفحة {currentPage} من {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-black dark:text-white rounded disabled:opacity-50">التالي</button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer always visible */}
      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 mt-auto pt-4">
        هذا الموقع غير رسمي وغير تابع لوزارة التربية والتعليم، واستخدام البيانات على مسؤولية المستخدم.
      </footer>
    </div>
  );
}
