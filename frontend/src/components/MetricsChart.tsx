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
  data2?: MetricDataPoint[];      // 두 번째 라인용 (선택)
  title: string;
  color: string;                  // 첫 번째 라인 색상
  color2?: string;                // 두 번째 라인 색상 (선택)
  unit: string;
  yDomain?: [number | 'auto', number | 'auto'];
  dataKey1?: string;              // 첫 번째 라인 이름 (기본: "Value")
  dataKey2?: string;              // 두 번째 라인 이름
}

export default function MetricsChart({
  data,
  data2,
  title,
  color,
  color2,
  unit,
  yDomain = [0, 100],
  dataKey1 = 'Value',
  dataKey2 = 'Value 2',
}: MetricsChartProps) {
  // timestamp를 시간 형식으로 포맷
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // 두 데이터셋을 합쳐서 Recharts가 인식할 수 있도록 변환
  const mergedData = useMemo(() => {
    if (!data2) return data;

    // timestamp를 키로 데이터 병합
    const dataMap = new Map<number, any>();

    data.forEach(point => {
      dataMap.set(point.timestamp, {
        timestamp: point.timestamp,
        value1: point.value,
        rawValue1: point.rawValue
      });
    });

    data2.forEach(point => {
      const existing = dataMap.get(point.timestamp) || { timestamp: point.timestamp };
      dataMap.set(point.timestamp, {
        ...existing,
        value2: point.value,
        rawValue2: point.rawValue
      });
    });

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [data, data2]);

  // peak 찾기 (첫 번째 라인 최댓값)
  const peak1 = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((max, point) =>
      point.value > max.value ? point : max
    );
  }, [data]);

  // peak2 찾기 (두 번째 라인 최댓값)
  const peak2 = useMemo(() => {
    if (!data2 || data2.length === 0) return null;
    return data2.reduce((max, point) =>
      point.value > max.value ? point : max
    );
  }, [data2]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {title}
        {peak1 && (
          <span className="text-sm ml-2 font-normal" style={{ color }}>
            🔴 {dataKey1} Peak: {peak1.value.toFixed(1)}{unit}
          </span>
        )}
        {peak2 && (
          <span className="text-sm ml-2 font-normal" style={{ color: color2 }}>
            🔴 {dataKey2} Peak: {peak2.value.toFixed(1)}{unit}
          </span>
        )}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#6b7280"
          />
          <YAxis domain={yDomain} unit={unit} stroke="#6b7280" />
          <Tooltip
            labelFormatter={formatTime}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}${unit}`,
              name
            ]}
          />
          <Legend />

          {/* 첫 번째 라인 */}
          <Line
            type="monotone"
            dataKey={data2 ? "value1" : "value"}
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={dataKey1}
          />

          {/* 두 번째 라인 (있으면) */}
          {data2 && (
            <Line
              type="monotone"
              dataKey="value2"
              stroke={color2}
              strokeWidth={2}
              dot={false}
              name={dataKey2}
            />
          )}

          {/* Peak 표시 - 첫 번째 라인 */}
          {peak1 && (
            <ReferenceDot
              x={peak1.timestamp}
              y={peak1.value}
              r={6}
              fill={color}
              stroke="white"
              strokeWidth={2}
              label={{
                value: `${dataKey1} Peak: ${formatTime(peak1.timestamp)}`,
                position: 'top',
                fill: color,
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />
          )}

          {/* Peak 표시 - 두 번째 라인 */}
          {peak2 && (
            <ReferenceDot
              x={peak2.timestamp}
              y={peak2.value}
              r={6}
              fill={color2}
              stroke="white"
              strokeWidth={2}
              label={{
                value: `${dataKey2} Peak: ${formatTime(peak2.timestamp)}`,
                position: 'bottom',
                fill: color2,
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
