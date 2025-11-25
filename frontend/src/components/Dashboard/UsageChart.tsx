import React, { useMemo } from "react"
import CanvasJSReact from "@canvasjs/react-charts"

const CanvasJSChart = (CanvasJSReact as any).CanvasJSChart

type Props = {
  mode: "requests" | "transfer"
  totalRequests: number
  totalDataGB: number
  points?: number
}

function generateSeries(total: number, points: number) {
  const out: { x: Date; y: number }[] = []
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  // spread across `points` days ending today
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now - i * dayMs)
    // simple seasonal-ish variation
    const base = total / points
    const variance = base * 0.6
    const noise = Math.round(base + Math.sin(i * 1.3) * (variance / 2) + (Math.random() - 0.5) * variance)
    out.push({ x: date, y: Math.max(0, noise) })
  }
  return out
}

const UsageChart = ({ mode, totalRequests, totalDataGB, points = 12 }: Props) => {
  const dataPoints = useMemo(() => {
    if (mode === "requests") {
      return generateSeries(totalRequests > 0 ? totalRequests : 1200, points)
    }
    // for transfer use totalDataGB converted to MB-ish numbers so chart looks sensible
    const gbTotal = totalDataGB > 0 ? totalDataGB : 6
    // scale to MB per day approximation
    const mbTotal = gbTotal * 1024
    return generateSeries(Math.max(1, Math.round(mbTotal)), points)
  }, [mode, totalRequests, totalDataGB, points])

  const options = useMemo(() => {
    const isRequests = mode === "requests"
    return {
      animationEnabled: true,
      theme: "light",
      axisX: {
        valueFormatString: "MMM D",
        labelFontSize: 11,
        labelAngle: -30,
      },
      axisY: {
        includeZero: true,
        labelFontSize: 11,
        suffix: isRequests ? "" : " MB",
      },
      data: [
        {
          type: isRequests ? "spline" : "area",
          markerSize: 0,
          color: isRequests ? "#0ea5e9" : "#34d399",
          fillOpacity: 0.12,
          dataPoints: dataPoints.map((p) => ({ x: p.x, y: p.y })),
        },
      ],
    }
  }, [mode, dataPoints])

  return (
    <div className="h-44 w-full">
      <CanvasJSChart options={options} />
    </div>
  )
}

export default UsageChart
