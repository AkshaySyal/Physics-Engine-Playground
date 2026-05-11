import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface RechartsRendererProps {
  chartType?: string | null;
  data?: Array<Record<string, unknown>> | null;
  xKey?: string | null;
  yKeys?: string[] | null;
  colors?: string[] | null;
  xLabel?: string | null;
  yLabel?: string | null;
  title?: string | null;
}

export function RechartsRenderer({ chartType, data, xKey, yKeys, colors }: RechartsRendererProps) {
  if (!data || !data.length || !xKey || !yKeys || !yKeys.length) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Invalid chart data</div>;
  }

  const defaultColors = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ec4899"];

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }} />
          <Legend />
          {yKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={(colors && colors[i]) || defaultColors[i % defaultColors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }} />
          <Legend />
          {yKeys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} fill={(colors && colors[i]) || defaultColors[i % defaultColors.length]} stroke={(colors && colors[i]) || defaultColors[i % defaultColors.length]} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default to line chart
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))" }} />
        <Legend />
        {yKeys.map((key, i) => (
          <Line key={key} type="monotone" dataKey={key} stroke={(colors && colors[i]) || defaultColors[i % defaultColors.length]} activeDot={{ r: 8 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
