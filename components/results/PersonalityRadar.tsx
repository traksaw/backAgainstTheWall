'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Radar } from 'recharts';
import { QuizScores } from '@/types/quiz';

function normalize(scores: QuizScores): { key: string; value: number; label: string }[] {
  const entries = Object.entries(scores) as [string, number][];
  const max = Math.max(1, ...entries.map(([, v]) => v));
  const allUnder100 = entries.every(([, v]) => v <= 100);
  return entries.map(([k, v]) => ({
    key: k,
    label: k, // swap for emojis if you want
    value: Math.round(allUnder100 ? v : (v / max) * 100),
  }));
}

export default function PersonalityRadar({ scores }: { scores: QuizScores }) {
  const data = normalize(scores);
  return (
    <div className="w-full h-72 rounded-2xl bg-amber-50/60 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar dataKey="value" fillOpacity={0.35} />
          <Tooltip formatter={(v: number) => `${v}%`} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
