interface MiniBarChartProps {
  values: number[]
  labels: string[]
  accent?: 'primary' | 'accent'
}

export function MiniBarChart({ values, labels, accent = 'primary' }: MiniBarChartProps) {
  const max = Math.max(...values, 1)

  return (
    <svg
      viewBox={`0 0 ${values.length * 24} 48`}
      className="h-full w-full"
      role="img"
      aria-label="Session activity chart"
    >
      {values.map((value, index) => {
        const height = Math.max(4, (value / max) * 36)
        const x = index * 24 + 6
        const y = 40 - height
        return (
          <g key={`${labels[index]}-${index}`}>
            <rect
              x={x}
              y={y}
              width={12}
              height={height}
              rx={4}
              className={accent === 'accent' ? 'fill-accent/80' : 'fill-primary/70'}
            />
            <text
              x={x + 6}
              y={47}
              textAnchor="middle"
              className="fill-muted-foreground text-[6px]"
            >
              {labels[index]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
