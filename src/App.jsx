import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale);

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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch("/data/students.json")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((student) => student.total_degree <= 320);
        const ranked = filtered
          .sort((a, b) => b.total_degree - a.total_degree)
          .map((student, index) => ({ ...student, rank: index + 1 }));
        setStudents(ranked);
      });
  }, []);

  const handleSearch = () => {
    const filtered = students.filter((student) =>
      normalizeArabic(student.arabic_name).includes(normalizeArabic(query))
    );
    setResults(filtered);
  };

  const handleReset = () => {
    setQuery("");
    setResults([]);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const chartData = {
    labels: students.map((s) => s.seating_no),
    datasets: [
      {
        label: "Total Degree",
        data: students.map((s) => s.total_degree),
        backgroundColor: darkMode ? "#818cf8" : "#6366f1",
      },
    ],
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"} min-h-screen py-10 px-4 font-sans transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-center w-full">نتيجة الثانوية العامة - 2025</h1>
          <button
            onClick={toggleDarkMode}
            className="absolute top-4 right-4 px-4 py-1 text-sm bg-gray-300 dark:bg-gray-700 dark:text-white text-black rounded shadow hover:bg-gray-400 dark:hover:bg-gray-600"
          >
            {darkMode ? "☀️ وضع النهار" : "🌙 الوضع الليلي"}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-6">
          <input
            type="text"
            placeholder="اكتب جزء من الاسم..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
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
                <p className="text-lg font-medium">
                  {student.arabic_name}
                  {student.rank <= 10 && (
                    <span className="ml-2 text-yellow-400 text-sm font-bold">🎖️ من الأوائل</span>
                  )}
                </p>
                <p className="text-sm">المجموع: <strong>{student.total_degree}</strong></p>
                <p className="text-sm">الترتيب على الجمهورية: <strong>{student.rank}</strong></p>
              </div>
            ))}
          </div>
        )}

        <div className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-xl shadow border`}>
          <h2 className="text-lg font-semibold mb-4">ملخص النتائج (عينة)</h2>
          <Bar data={chartData} />
        </div>
      </div>
    </div>
  );
}
