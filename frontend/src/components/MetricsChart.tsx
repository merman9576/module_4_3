'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { MetricDataPoint } from '@/types/metrics';

interface MetricsChartProps {
  data: MetricDataPoint[];
  title: string;
  color: string;
  unit: string;
  yDomain?: [number | 'auto', number | 'auto'];
}

export default function MetricsChart({
  data,
  title,
  color,
  unit,
  yDomain = [0, 100],
}: MetricsChartProps) {
  // timestamp를 시간 형식으로 포맷
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // peak 찾기 (최댓값)
  const peak = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((max, point) =>
      point.value > max.value ? point : max
    );
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {title}
        {peak && (
          <span className="text-sm text-red-500 ml-2 font-normal">
            🔴 Peak: {peak.value.toFixed(1)}{unit}
          </span>
        )}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#6b7280"
          />
          <YAxis domain={yDomain} unit={unit} stroke="#6b7280" />
          <Tooltip
            labelFormatter={formatTime}
            formatter={(value: number, name: string, props: any) => {
              const isPeak = peak && props.payload.timestamp === peak.timestamp;
              return [
                `${value}${unit}${isPeak ? ' 🔴 Peak' : ''}`,
                name
              ];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={title}
          />

          {/* Peak 표시 - 빨간 점 */}
          {peak && (
            <ReferenceDot
              x={peak.timestamp}
              y={peak.value}
              r={6}
              fill="#ef4444"
              stroke="white"
              strokeWidth={2}
              label={{
                value: `Peak: ${formatTime(peak.timestamp)}`,
                position: 'top',
                fill: '#ef4444',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
