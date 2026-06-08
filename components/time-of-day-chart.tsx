"use client";

import { Pie, PieChart, Cell, Legend, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TimeOfDayData = {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
};

const chartConfig = {
  morning: {
    label: "Morning (6am–12pm)",
    color: "var(--chart-1)",
  },
  afternoon: {
    label: "Afternoon (12pm–5pm)",
    color: "var(--chart-2)",
  },
  evening: {
    label: "Evening (5pm–9pm)",
    color: "var(--chart-3)",
  },
  night: {
    label: "Night (9pm–6am)",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function TimeOfDayChart({ data }: { data: TimeOfDayData }) {
  const chartData = [
    { name: "morning", value: data.morning, fill: chartConfig.morning.color },
    {
      name: "afternoon",
      value: data.afternoon,
      fill: chartConfig.afternoon.color,
    },
    { name: "evening", value: data.evening, fill: chartConfig.evening.color },
    { name: "night", value: data.night, fill: chartConfig.night.color },
  ].filter((d) => d.value > 0);

  const totalClicks = data.morning + data.afternoon + data.evening + data.night;

  if (totalClicks === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clicks by Time of Day</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">
            No click data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Clicks by Time of Day</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
