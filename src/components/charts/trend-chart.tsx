import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/types";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="deposits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f9f6e" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#0f9f6e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="payments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f2c94c" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f2c94c" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d9e3dd" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="deposits" stroke="#0f9f6e" fill="url(#deposits)" strokeWidth={2} />
          <Area type="monotone" dataKey="payments" stroke="#d1a31d" fill="url(#payments)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
