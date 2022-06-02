import { BaseChart } from "components/BaseChart"

export const TableChart = ({ data, previousData }: ChartProps) => {
  return (
    <>
      <BaseChart
        config={{
          type: "line",
          data: {
            labels: data.map(() => ""),
            datasets: [
              {
                data: data,
                borderColor: "white",
                backgroundColor: "white",
                pointBorderColor: "white",
                borderWidth: 2,
              },
              {
                data: previousData,
                borderColor: "grey",
                backgroundColor: "grey",
                pointBorderColor: "grey",
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            elements: {
              line: { tension: 0.2, borderWidth: 3 },
            },
            scales: {
              x: {
                grid: { borderWidth: 0, lineWidth: 0 },
              },
              y: {
                grid: { borderWidth: 0, lineWidth: 0 },
                ticks: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: { display: false },
            },
          },
        }}
      />
    </>
  )
}

interface ChartProps {
  data: number[]
  previousData: number[]
}
