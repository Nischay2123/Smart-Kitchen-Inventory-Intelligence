import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
} from "recharts"

const COLORS = {
  STAR: "#22c55e",
  PUZZLE: "#6366f1",
  PLOWHORSE: "#f59e0b",
  DOG: "#ef4444",
}

import Lottie from "lottie-react";
import noDataAnimation from "@/assets/no-data.json";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow text-xs space-y-1">
      <div className="font-semibold">{d.itemName}</div>
      <div>Qty: {d.qty}</div>
      <div>Profit: ₹{d.profit.toFixed(2)}</div>
      <div className="font-medium">
        Category: <span style={{ color: COLORS[d.category] }}>{d.category}</span>
      </div>
    </div>
  )
}

export default function MenuEngineeringMatrix({ data = [] }) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Menu Engineering Matrix</CardTitle>
        </CardHeader>
        <CardContent className="h-105 flex flex-col items-center justify-center text-muted-foreground">
          <Lottie
            animationData={noDataAnimation}
            loop={true}
            className="w-40 h-40"
          />
          <p className="text-sm font-medium mt-2">
            No data available for selected period
          </p>
        </CardContent>
      </Card>
    )
  }
  // console.log(data);

  const avgQty =
    data.reduce((a, b) => a + b.qty, 0) / data.length

  const avgProfit =
    data.reduce((a, b) => a + b.profit, 0) / data.length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Menu Engineering Matrix</CardTitle>
        <p className="text-sm text-muted-foreground">
          Popularity vs Profit classification of menu items
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="relative w-full h-105">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="profit"
                name="Profit"
                tickFormatter={(v) => `₹${v}`}
                label={{
                  value: "Profit →",
                  position: "insideBottomRight",
                  offset: -10,
                }}
              />

              <YAxis
                type="number"
                dataKey="qty"
                name="Quantity"
                label={{
                  value: "Popularity →",
                  angle: -90,
                  position: "insideLeft",
                }}
              />

              <ZAxis range={[60, 200]} />

              <Tooltip content={<CustomTooltip />} />

              {/* Quadrant Center Lines */}
              <ReferenceLine
                x={avgProfit}
                stroke="#64748b"
                strokeDasharray="4 4"
              />
              <ReferenceLine
                y={avgQty}
                stroke="#64748b"
                strokeDasharray="4 4"
              />

              {Object.keys(COLORS).map((cat) => (
                <Scatter
                  key={cat}
                  data={data.filter((d) => d.category === cat)}
                  fill={COLORS[cat]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Legend title="STAR" color={COLORS.STAR} desc="Promote aggressively" />
          <Legend title="PUZZLE" color={COLORS.PUZZLE} desc="Improve placement / upsell" />
          <Legend title="PLOWHORSE" color={COLORS.PLOWHORSE} desc="Reprice or reduce portion" />
          <Legend title="DOG" color={COLORS.DOG} desc="Consider removing" />
        </div>
      </CardContent>
    </Card>
  )
}

const Legend = ({ title, color, desc }) => (
  <div className="flex items-center gap-2">
    <span
      className="h-3 w-3 rounded-full"
      style={{ background: color }}
    />
    <div>
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  </div>
)
