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

  useEffect(() => {
    fetch("/data/students.json")
      .then((res) => res.json())
      .then((data) => setStudents(data));
  }, []);

  const filtered = students
    .filter((student) => student.total_degree <= 320)
    .filter((student) =>
      normalizeArabic(student.arabic_name).includes(normalizeArabic(query))
    )
    .sort((a, b) => b.total_degree - a.total_degree)
    .map((student, idx) => ({ ...student, rank: idx + 1 }));

  const chartData = {
    labels: students.map((s) => s.seating_no),
    datasets: [
      {
        label: "Total Degree",
        data: students.map((s) => (s.total_degree <= 320 ? s.total_degree : null)),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">نتيجة الثانوية العامة - بحث بالاسم</h1>
      <input
        type="text"
        placeholder="اكتب جزء من الاسم..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((student) => (
          <div key={student.seating_no} className="border p-4 rounded">
            <p><strong>الاسم:</strong> {student.arabic_name}</p>
            <p><strong>المجموع:</strong> {student.total_degree}</p>
            <p><strong>الترتيب:</strong> {student.rank}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">ملخص النتائج</h2>
        <Bar data={chartData} />
      </div>
    </div>
  );
}