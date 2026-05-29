import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useLifetimeProjection } from '@/hooks/useLifetimeProjection';

/**
 * LifetimeProjectionChart
 * A touch-first mobile chart module for lifetime cash flow projection.
 * Designed to prevent scroll hijacking and provide a clear readout header on scrub.
 */
const LifetimeProjectionChart: React.FC = () => {
  const { data, isReady, p1Name, p2Name, growthRate } = useLifetimeProjection();
  const [activePoint, setActivePoint] = useState<any>(null);

  // Loading State
  if (!isReady || !data || data.length === 0) {
    return (
      <div className="w-full h-[380px] bg-gray-50 animate-pulse rounded-xl" />
    );
  }

  // Determine point to display: Active touch point or default to first point (Day-0)
  const displayPoint = activePoint || data[0];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(value);

  const formatYAxis = (v: number) => `£${v / 1000}k`;

  // Custom X-Axis Tick to show stacked Dan & Freya ages
  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
    // Find the data point corresponding to this tick value
    const point = data.find((d: any) => d.calendarYear === payload.value);
    if (!point) return null;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={12}
          textAnchor="middle"
          fill="#6B7280"
          className="text-[10px] font-medium"
        >
          <tspan x="0" dy="1.2em">{point.ageP1}</tspan>
          <tspan x="0" dy="1.2em">{point.ageP2}</tspan>
        </text>
      </g>
    );
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm touch-pan-y select-none relative">
      {/* B. TOUCH READOUT DATA HEADER PANEL */}
      <div className="md:mb-6 pt-2">
        <div className="text-2xl font-bold text-gray-900 tracking-tight">
          {formatCurrency(displayPoint.liquidAssets)}
        </div>
        <div className="text-xs font-medium text-gray-500 mt-0.5">
          Year: {displayPoint.calendarYear} | {p1Name}: Age {displayPoint.ageP1} • {p2Name}: Age {displayPoint.ageP2}
        </div>
      </div>

      {/* A. STATIC ASSUMPTIONS OVERLAY BADGE */}
      <div className="mt-4 mb-6 md:mt-0 md:mb-0 relative block w-full md:absolute md:top-4 md:right-4 z-10 p-2 text-[10px] text-gray-500 md:max-w-[200px] rounded-lg bg-gray-50 border border-slate-100 leading-relaxed pointer-events-none">
        <span className="font-bold block mb-0.5">Assumptions</span>
        Real Investment Growth: {growthRate}% (net of fees). We use conservative growth assumptions given the unpredictability of stock/bond returns and inflation.
      </div>

      {/* C. THE RECHARTS GRAPH CANVAS */}
      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            onMouseMove={(e: any) => {
              if (e.activePayload) {
                setActivePoint(e.activePayload[0].payload);
              }
            }}
            onTouchMove={(e: any) => {
              if (e.activePayload) {
                setActivePoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <defs>
              <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4B0082" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4B0082" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#E5E7EB"
            />

            <XAxis
              dataKey="calendarYear"
              axisLine={false}
              tickLine={false}
              interval={Math.floor(data.length / 6)} // Dynamic interval for 5-6 ticks
              tick={<CustomTick />}
            />

            <YAxis
              width={42}
              axisLine={false}
              tickLine={false}
              fontSize={10}
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={formatYAxis}
            />

            <Tooltip
              content={() => null} // Hidden tooltip frame as per requirements
              cursor={{ stroke: '#4B0082', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            <Area
              type="monotone"
              dataKey="liquidAssets"
              stroke="#4B0082"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAssets)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Optional: Legend for Age Rows */}
      <div className="flex flex-col gap-1 mt-2 text-[10px] text-gray-400 absolute bottom-6 left-4">
        <span>{p1Name}</span>
        <span>{p2Name}</span>
      </div>
    </div>
  );
};

export default LifetimeProjectionChart;
