'use client';

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
} from 'recharts';

const MOOD_COLORS = {
  positive: '#22c55e',
  neutral: '#f59e0b',
  negative: '#ef4444',
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
        <CartesianGrid strokeDasharray="3 3" stroke="#E9F0DF" />
        <XAxis dataKey="dayLabel" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#F0F5E8',
            border: '1px solid #C2D5A8',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="calls"
          stroke="#8FA963"
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
            backgroundColor: '#F0F5E8',
            border: '1px solid #C2D5A8',
            borderRadius: '8px',
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
        <CartesianGrid strokeDasharray="3 3" stroke="#E9F0DF" />
        <XAxis type="number" stroke="#64748b" fontSize={12} />
        <YAxis
          dataKey="name"
          type="category"
          stroke="#64748b"
          fontSize={12}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#F0F5E8',
            border: '1px solid #C2D5A8',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar dataKey="wardCount" fill="#8FA963" name="피보호자" />
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
        <CartesianGrid strokeDasharray="3 3" stroke="#E9F0DF" />
        <XAxis type="number" stroke="#64748b" fontSize={12} />
        <YAxis
          type="category"
          dataKey="keyword"
          stroke="#64748b"
          fontSize={12}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#F0F5E8',
            border: '1px solid #C2D5A8',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="count" fill="#8FA963" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { MOOD_COLORS };
