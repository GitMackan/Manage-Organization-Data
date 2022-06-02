import { useTable, useSortBy, useFilters, Column } from "react-table"
import { useCallback } from "react"
import styles from "./styles.module.scss"
import { RadioButtonGroup, SearchBar } from "@saits/bibban"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Text } from "components/Text"
import { useParams } from "react-router-dom"
import { GetOrganizationChildrenNodes as ChildOrganization } from "graphql-api"

export const Table = ({ onSetDaysAgo, daysAgo, columns, data }: TableProps) => {
  const params = useParams()

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, setFilter } = useTable(
    {
      columns,
      data,
      autoResetSortBy: false,
      disableSortRemove: true,
      initialState: { sortBy: [{ id: "students", desc: true }] },
    },
    useFilters,
    useSortBy
  )

  const changeSearchQuery = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setFilter("academy", e.target.value),
    []
  )

  return (
    <div>
      <SearchBar onChange={changeSearchQuery} placeholder="Search for something..." />
      {onSetDaysAgo && (
        <div className={styles.radioButtonContainer}>
          <div className={styles.period}>
            <FontAwesomeIcon icon={["far", "clock"]} />
            <Text fontSize="medium" bold>
              Period
            </Text>
          </div>
          <RadioButtonGroup
            options={[
              { value: "7", label: "7 days" },
              { value: "14", label: "14 days" },
              { value: "30", label: "1 month" },
              { value: "365", label: "1 year" },
            ]}
            name="period"
            value={daysAgo.toString()}
            onChange={e => {
              const numberValue = Number(e.target.value)
              if (isNaN(numberValue)) return
              onSetDaysAgo(numberValue)
            }}
            className={styles.radioButtons}
          />
        </div>
      )}
      <div className={styles.tableWrapper}>
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => {
              const headerGroupProps = headerGroup.getHeaderGroupProps()
              return (
                <tr {...headerGroupProps} key={headerGroupProps.key}>
                  {headerGroup.headers.map(column => {
                    const columnProps = column.getHeaderProps(column.getSortByToggleProps())
                    return (
                      <th
                        {...columnProps}
                        key={columnProps.key}
                        className={headerGroupProps.className}
                      >
                        {column.render("Header")}
                        <span>
                          {column.isSorted && (
                            <FontAwesomeIcon
                              icon={["far", column.isSortedDesc ? "chevron-up" : "chevron-down"]}
                            />
                          )}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              )
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row)
              const rowProps = row.getRowProps()
              return (
                <tr {...rowProps} key={rowProps.key}>
                  {row.cells.map(cell => {
                    const cellProps = cell.getCellProps()
                    const original = row.original as { academy: ChildOrganization }
                    if (original.academy.id !== params.id) {
                      return (
                        <td {...cellProps} key={cellProps.key}>
                          {cell.render("Cell")}
                        </td>
                      )
                    }
                    return ""
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface TableProps {
  onSetDaysAgo?: (daysAgo: number) => void
  daysAgo?: any
  data: any[]
  columns: Column[]
}
