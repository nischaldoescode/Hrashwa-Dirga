/**
 * Question Performance Chart Component
 * Visualizes question success rates using bar chart
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface QuestionPerformanceChartProps {
  data: {
    totalAttempts: number
    correctAttempts: number
    successRate: string
    totalHintsUsed: number
  }
}

export const QuestionPerformanceChart = ({
  data,
}: QuestionPerformanceChartProps) => {
  const chartData = [
    {
      name: 'Attempts',
      correct: data.correctAttempts,
      incorrect: data.totalAttempts - data.correctAttempts,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Attempts</p>
              <p className="text-2xl font-bold">{data.totalAttempts}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-green-500">
                {data.successRate}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hints Used</p>
              <p className="text-2xl font-bold">{data.totalHintsUsed}</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="correct" fill="hsl(var(--primary))" name="Correct" />
              <Bar dataKey="incorrect" fill="hsl(var(--destructive))" name="Incorrect" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}