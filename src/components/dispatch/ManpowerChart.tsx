"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status: "pending" | "confirmed" | "declined";
  groupId: string | null;
  crewTime?: string | null;
}

interface CrewTime {
  name: string;
  time: string;
  workers: Worker[];
}

interface Group {
  id: string;
  name: string;
  location?: string;
  startTime: string;
  workers: Worker[];
  crewTimes?: CrewTime[];
}

interface ManpowerChartProps {
  groups: Group[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

export default function ManpowerChart({ groups }: ManpowerChartProps) {
  // Calculate total workers per project
  const data = groups
    .filter(g => g.id !== "unassigned")
    .map((group, index) => {
      // Count workers in group + workers in crew times
      const directWorkers = group.workers.length;
      const crewWorkers = group.crewTimes?.reduce((acc, crew) => acc + (crew.workers?.length || 0), 0) || 0;
      const totalWorkers = directWorkers + crewWorkers;

      return {
        name: group.name,
        value: totalWorkers,
        percentage: 0 // Will calculate after
      };
    })
    .filter(item => item.value > 0); // Only show projects with workers

  // Calculate percentages
  const totalWorkers = data.reduce((acc, item) => acc + item.value, 0);
  data.forEach(item => {
    item.percentage = totalWorkers > 0 ? Math.round((item.value / totalWorkers) * 100) : 0;
  });

  if (data.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700 p-4 h-[calc(100vh-14rem)]">
        <h3 className="text-sm font-semibold text-white mb-3">Manpower Distribution</h3>
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          No workers assigned to projects
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded p-2 shadow-lg">
          <p className="text-white text-xs font-semibold">{payload[0].name}</p>
          <p className="text-gray-300 text-xs">
            {payload[0].value} workers ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700 p-4 h-[calc(100vh-14rem)] w-64">
      <h3 className="text-sm font-semibold text-white mb-3">Manpower Distribution</h3>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={75}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 space-y-1 max-h-[calc(100vh-30rem)] overflow-y-auto">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-300 truncate">{item.name}</span>
            </div>
            <span className="text-white font-medium ml-2">
              {item.value} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Total Workers</span>
          <span className="text-white font-semibold">{totalWorkers}</span>
        </div>
      </div>
    </div>
  );
}