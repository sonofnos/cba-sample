import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PaymentMixPoint } from "@/lib/types";

const colors = ["#0f9f6e", "#f2c94c", "#1f6feb", "#c2410c"];

export function PaymentMixChart({ data }: { data: PaymentMixPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
