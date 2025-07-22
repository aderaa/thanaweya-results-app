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

  useEffect(() => {
    fetch("/data/students.json")
      .then((res) => res.json())
      .then((data) => setStudents(data));
  }, []);

  const handleSearch = () => {
    const filtered = students
      .filter((student) => student.total_degree <= 320)
      .filter((student) =>
        normalizeArabic(student.arabic_name).includes(normalizeArabic(query))
      )
      .sort((a, b) => b.total_degree - a.total_degree)
      .map((student, idx) => ({ ...student, rank: idx + 1 }));

    setResults(filtered);
  };

  const chartData = {
    labels: students.map((s) => s.seating_no),
    datasets: [
      {
        label: "Total Degree",
        data: students.map((s) => (s.total_degree <= 320 ? s.total_degree : null)),
        backgroundColor: "#4f46e5",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">نتيجة الثانوية العامة - 2025</h1>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-6">
          <input
            type="text"
            placeholder="اكتب جزء من الاسم..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded shadow hover:bg-indigo-700 transition"
          >
            بحث
          </button>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {results.map((student) => (
              <div key={student.seating_no} className="bg-white p-4 rounded-xl shadow">
                <p><strong>الاسم:</strong> {student.arabic_name}</p>
                <p><strong>المجموع:</strong> {student.total_degree}</p>
                <p><strong>الترتيب:</strong> {student.rank}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">ملخص النتائج</h2>
          <Bar data={chartData} />
        </div>
      </div>
    </div>
  );
}
