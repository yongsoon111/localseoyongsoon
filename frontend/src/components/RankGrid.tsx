import type { GridPoint } from '../types'

interface RankGridProps {
  gridPoints: GridPoint[]
  gridSize: number
}

const getRankColor = (rank: number | null): string => {
  if (rank === null) return 'bg-gray-100 text-gray-500'
  if (rank >= 1 && rank <= 3) return 'bg-green-100 text-green-800'
  if (rank >= 4 && rank <= 7) return 'bg-lime-100 text-lime-800'
  if (rank >= 8 && rank <= 12) return 'bg-yellow-100 text-yellow-800'
  if (rank >= 13 && rank <= 17) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

const getRankDisplay = (rank: number | null): string => {
  return rank === null ? '-' : rank.toString()
}

export default function RankGrid({ gridPoints, gridSize }: RankGridProps) {
  const createGrid = (): (GridPoint | null)[][] => {
    const grid: (GridPoint | null)[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null))

    gridPoints.forEach((point) => {
      if (point.grid_row < gridSize && point.grid_col < gridSize) {
        grid[point.grid_row][point.grid_col] = point
      }
    })

    return grid
  }

  const grid = createGrid()

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">순위 그리드</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
            <span>1-3위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-lime-100 border border-lime-300 rounded" />
            <span>4-7위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
            <span>8-12위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded" />
            <span>13-17위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
            <span>18-20위</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
            <span>Not Found</span>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <tbody>
          {grid.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => (
                <td
                  key={colIdx}
                  className={`
                    border border-gray-300 p-4 text-center font-semibold
                    ${cell ? getRankColor(cell.rank ?? null) : 'bg-white'}
                  `}
                >
                  {cell ? getRankDisplay(cell.rank ?? null) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
