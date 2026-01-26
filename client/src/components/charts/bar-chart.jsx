import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useState } from "react"
import { Cell } from "recharts"
import { useMediaQuery } from "@/customHooks/desktop"



const chartConfig = {
    value: {
        label: "Total Sales",
        color: "var(--chart-1)",
    },
}



export default function TabSalesBarChart({
    title = "Tab Sales",
    description = "Click on any tab to view its deployment drill down table",
    data,
    xKey,
    yKey,
    onBarClick
}) {
    console.log(data);
    

    const [hoverIndex, setHoverIndex] = useState(null)
    const isDesktop = useMediaQuery("(min-width: 1024px)")

    return (
        <Card className="min-w-0 flex flex-col justify-between w-full md:basis-[60%]">
            <CardHeader >
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent className="flex min-h-100">
                <ChartContainer config={chartConfig} className="w-full">
                        <BarChart
                            data={data}
                            barSize={20}
                            margin={isDesktop?{
                                top: 10,
                                right:20,
                                left: 0,
                                bottom: data.length > 6 ? 60 : 20
                            }:{
                                top: 10,
                                right: 10,
                                left: -40,
                                bottom: data.length > 6 ? 50 : 10
                            }
                        }
                        >
                            <CartesianGrid vertical={false} />

                            <XAxis
                                dataKey={xKey}
                                padding={{ left: 0, right: 0 }}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                interval={0}
                                tick={{
                                    angle: data.length > 6 ? data.length > 25 ? -90 : -45 : 0,
                                    textAnchor: data.length > 5 ? "end" : "middle",
                                    fontSize: data.length > 6 ? data.length > 15 ? 8 : 12 : 12,
                                }}
                            />

                            

                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => {
                                    if (value >= 1e7) {
                                        const cr = value / 1e7;
                                        return cr % 1 === 0 ? `${cr} Cr` : `${cr.toFixed(1)} Cr`;
                                    }
                                    if (value >= 1e5) {
                                        const lakh = value / 1e5;
                                        return lakh % 1 === 0 ? `${lakh} L` : `${lakh.toFixed(1)} L`;
                                    }
                                    if (value >= 1e3) {
                                        const k = value / 1e3;
                                        return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
                                    }

                                    return value;
                                }}

                            />

                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

                            <Bar
                                dataKey={yKey}
                                radius={8}
                                onClick={onBarClick}
                                onMouseLeave={() => setHoverIndex(null)}
                                className="cursor-pointer"
                            >
                                {data.map((_, index) => (
                                    <Cell
                                        key={index}
                                        fill={hoverIndex === index ? "var(--chart-6)" : "var(--chart-1)"}
                                        onMouseEnter={() => setHoverIndex(index)}
                                    />
                                ))}
                            </Bar>

                        </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
