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
import type { DrawdownStrategy } from '@/utils/projectionEngine';

/**
 * AssetBurndownChart
 * A touch-first mobile chart showing the breakdown of asset pots over time.
 */
interface TouchTooltipBridgeProps {
  active?: boolean;
  payload?: any[];
  onPointUpdate: (point: any) => void;
}

const TouchTooltipBridge: React.FC<TouchTooltipBridgeProps> = ({ active, payload, onPointUpdate }) => {
  React.useEffect(() => {
    if (active && payload && payload.length > 0) {
      onPointUpdate(payload[0].payload);
    }
  }, [active, payload, onPointUpdate]);

  return null;
};

interface AssetBurndownChartProps {
  drawdownStrategy?: DrawdownStrategy;
}

const AssetBurndownChart: React.FC<AssetBurndownChartProps> = ({ drawdownStrategy }) => {
  const { data, isReady, p1Name, p2Name } = useLifetimeProjection(drawdownStrategy);
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

  // Custom X-Axis Tick
  const CustomTick = (props: any) => {
    const { x, y, payload } = props;
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

  // Recharts 3.x Tooltip formatter fix (as per memory)
  const tooltipFormatter = (value: any) => {
    return formatCurrency(Number(value) || 0);
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm touch-pan-y select-none relative">
      {/* TOUCH READOUT DATA HEADER PANEL */}
      <div className="mb-4 pt-2">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(displayPoint.liquidAssets)}
          </div>
          <div className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {displayPoint.calendarYear}
          </div>
        </div>

        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          {p1Name}: Age {displayPoint.ageP1} {p2Name ? `• ${p2Name}: Age ${displayPoint.ageP2}` : ''}
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-slate-800">
          <div>
            <span className="block text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Taxable</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatCurrency(displayPoint.potBalances.taxable)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Tax-Free</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatCurrency(displayPoint.potBalances.taxFree)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-amber-600 tracking-wider">Pensions</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatCurrency(displayPoint.potBalances.pensions)}
            </span>
          </div>
        </div>

        {/* Secondary Financial Metrics Sub-Grid */}
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-slate-800">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Annual Outgoings</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {formatCurrency(displayPoint.annualBudget || 0)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Cashflow</span>
            <span className={`text-sm font-bold ${(displayPoint.netCashFlow || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {(displayPoint.netCashFlow || 0) >= 0 ? '+' : ''}{formatCurrency(displayPoint.netCashFlow || 0)}
            </span>
          </div>
        </div>

        {/* Milestones Row */}
        {displayPoint.milestones && displayPoint.milestones.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-slate-800">
            <span className="block text-[10px] uppercase font-bold text-primary tracking-wider mb-1">Milestones</span>
            <div className="flex flex-wrap gap-1">
              {displayPoint.milestones.map((m: string, i: number) => (
                <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* THE RECHARTS GRAPH CANVAS */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#E5E7EB"
            />

            <XAxis
              dataKey="calendarYear"
              axisLine={false}
              tickLine={false}
              interval={Math.floor(data.length / 6)}
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
              cursor={{ stroke: '#4B0082', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={<TouchTooltipBridge onPointUpdate={setActivePoint} />}
              formatter={tooltipFormatter}
            />

            <Area
              type="monotone"
              dataKey="potBalances.pensions"
              stackId="1"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.6}
              animationDuration={1000}
            />
            <Area
              type="monotone"
              dataKey="potBalances.taxFree"
              stackId="1"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
              animationDuration={1000}
            />
            <Area
              type="monotone"
              dataKey="potBalances.taxable"
              stackId="1"
              stroke="#4B0082"
              fill="#4B0082"
              fillOpacity={0.6}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-1 mt-2 text-[10px] text-gray-400 absolute bottom-6 left-4">
        <span>{p1Name}</span>
        <span>{p2Name}</span>
      </div>
    </div>
  );
};

export default AssetBurndownChart;
