import React, { useState, useEffect } from "react";

function normalizeArabic(text) {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و");
}

export default function App() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch("/data/students.json")
      .then((res) => res.json())
      .then((data) => {
        const valid = data.filter((student) => student.total_degree <= 320);
        const ranked = valid
          .sort((a, b) => b.total_degree - a.total_degree)
          .map((student, index) => ({
            ...student,
            rank: index + 1,
            normalizedName: normalizeArabic(student.arabic_name),
          }));
        setStudents(ranked);
        setIsLoading(false);
      });
  }, []);

  const handleSearch = () => {
    setSearchPerformed(true);
    setIsSearching(true);
    const trimmed = query.trim();
    let filtered = [];
    if (/^\d+$/.test(trimmed)) {
      // Search by ID (partial match)
      filtered = students.filter((s) =>
        s.seating_no.toString().includes(trimmed)
      );
    } else {
      // Search by normalized name
      const norm = normalizeArabic(trimmed);
      filtered = students.filter((s) =>
        s.normalizedName.includes(norm)
      );
    }
    setResults(filtered);
    setIsSearching(false);
  };

  const handleReset = () => {
    setQuery("");
    setResults([]);
    setSearchPerformed(false);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const Spinner = () => (
    <div className="flex justify-center my-6 space-x-2">
      <div
        className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
      <div
        className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce"
        style={{ animationDelay: "0.4s" }}
      ></div>
    </div>
  );

  return (
    <div
      className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"} min-h-screen py-10 px-4 font-sans transition-colors duration-300`}
    >
      <div className="max-w-4xl mx-auto relative">
        <button
          onClick={toggleDarkMode}
          className="absolute top-4 right-4 px-4 py-1 text-sm bg-gray-300 dark:bg-gray-700 dark:text-white text-black rounded shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition"
        >
          {darkMode ? "☀️ وضع النهار" : "🌙 الوضع الليلي"}
        </button>

        <h1 className="text-3xl font-bold text-center mb-8">
          نتيجة الثانوية العامة - 2025
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-6">
          <input
            type="text"
            placeholder="اكتب جزء من الاسم أو رقم الجلوس..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white bg-white dark:bg-gray-800"
          />
          <button
            onClick={handleSearch}
            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded shadow hover:bg-indigo-700 transition"
          >
            بحث
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2 bg-gray-300 text-gray-800 font-semibold rounded shadow hover:bg-gray-400 transition"
          >
            إعادة ضبط
          </button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {isSearching && <Spinner />}

            {searchPerformed && !isSearching && (
              <>
                <p className="text-center mb-4">
                  {results.length > 0
                    ? `عدد النتائج: ${results.length}`
                    : "لا يوجد نتائج مطابقة"}
                </p>

                {results.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {results.map((student) => (
                      <div
                        key={student.seating_no}
                        className={`p-4 rounded-xl shadow border transition ${
                          student.rank <= 10
                            ? darkMode
                              ? "border-yellow-400 bg-yellow-900"
                              : "border-yellow-400 bg-yellow-50"
                            : darkMode
                            ? "border-gray-700 bg-gray-800"
                            : "bg-white border-indigo-100"
                        }`}
                      >
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          رقم الجلوس: <strong>{student.seating_no}</strong>
                        </p>
                        <p className="text-lg font-medium">
                          {student.arabic_name}
                          {student.rank <= 10 && (
                            <span className="ml-2 text-yellow-400 text-sm font-bold">
                              🎖️ من الأوائل
                            </span>
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
          </>
        )}
      </div>
    </div>
  );
}
