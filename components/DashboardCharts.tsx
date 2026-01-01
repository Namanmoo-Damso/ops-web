"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const MOOD_COLORS = {
  positive: "#22c55e",
  neutral: "#f59e0b",
  negative: "#ef4444",
};

type WeeklyTrendData = {
  dayLabel: string;
  calls: number;
  emergencies: number;
};

type MoodData = {
  name: string;
  value: number;
  color: string;
};

type OrgData = {
  name: string;
  wardCount: number;
  callCount: number;
};

export function WeeklyTrendChart({ data }: { data: WeeklyTrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="dayLabel" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="calls"
          stroke="#3b82f6"
          strokeWidth={2}
          name="통화"
        />
        <Line
          type="monotone"
          dataKey="emergencies"
          stroke="#ef4444"
          strokeWidth={2}
          name="비상"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MoodPieChart({ data }: { data: MoodData[] }) {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={60}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function OrganizationBarChart({ data }: { data: OrgData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
        <YAxis
          dataKey="name"
          type="category"
          stroke="#9ca3af"
          fontSize={12}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
          }}
        />
        <Legend />
        <Bar dataKey="wardCount" fill="#3b82f6" name="피보호자" />
        <Bar dataKey="callCount" fill="#22c55e" name="통화" />
      </BarChart>
    </ResponsiveContainer>
  );
}

type KeywordData = {
  keyword: string;
  count: number;
};

export function KeywordsBarChart({ data }: { data: KeywordData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
        <YAxis type="category" dataKey="keyword" stroke="#9ca3af" fontSize={12} width={60} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />
        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { MOOD_COLORS };
