import { Column } from "react-table"
import { useMemo } from "react"
import styles from "./styles.module.scss"
import { GetOrganizationChildrenNodes as ChildOrganization } from "graphql-api"
import { Persona, Tooltip } from "@saits/bibban"
import { useAppDataContext } from "components/AppDataProvider"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Text } from "components/Text"
import { toPercentage } from "utils/numberUtils"
import { Table } from "../Table"

export const ActivitiesTab = ({
  childOrganizations,
  daysAgo,
  onSetDaysAgo,
}: ActivitiesTabProps) => {
  const { theme } = useAppDataContext()

  const data = useMemo(
    () =>
      childOrganizations?.map(organization => ({
        academy: organization,
        completedActivity: {
          completed: organization.statistics?.completed.totalCount,
          total: organization.statistics?.activitesLast14Days.totalCount,
        },
        waitingActivity: {
          waiting: organization.statistics?.waitingToBeGraded.totalCount,
          total: organization.statistics?.waitingToBeGraded.totalCount,
        },
        missedActivity: {
          missed: organization.statistics?.missed.totalCount,
          total: organization.statistics?.activitesLast14Days.totalCount,
        },
        scheduledActivity: organization.statistics?.activitesLast14Days.totalCount,
        impressions: {
          positive: organization.statistics?.positiveImpressions.groupBy.map(value => value.value),
          negative: organization.statistics?.negativeImpressions.groupBy.map(value => value.value),
          total: organization.statistics?.totalImpressions.groupBy.map(value => value.value),
        },
      })) || [],
    [childOrganizations]
  )
  const columns: Column[] = useMemo(
    () => [
      {
        Header: () => (
          <div className={styles.tableHeadContainer}>
            <Text bold>Activities</Text>
            <Text className={styles.tableSubHeading} fontSize="small" variant="muted">
              <Text bold>Period:</Text> {daysAgo} days
            </Text>
          </div>
        ),
        id: "activites",
        columns: [
          {
            Header: "Academy",
            accessor: "academy",
            autoResetSortBy: false,
            filter: (rows, ids, filterValue) => {
              return rows.filter(row => {
                const val = row.values[ids[0]]
                return val.name.toLowerCase().includes(filterValue.toLowerCase())
              })
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              return a.academy.name.toLowerCase() > b.academy.name.toLowerCase() ? 1 : -1
            },
            Cell: cell => {
              const val: ChildOrganization = cell.value
              return (
                <Persona
                  size="extra-small"
                  name={val.name}
                  avatar={
                    val.configItems.nodes.find(
                      item =>
                        item.configKey.identifier ===
                        (theme === "light" ? "lightmode_organization_logo" : "organization_logo")
                    )?.attachment?.url
                  }
                />
              )
            },
          },
          {
            Header: "Missed",
            accessor: "missedActivity",
            Cell: cell => {
              const cellValue = cell.value as {
                missed: number | undefined
                total: number | undefined
              }

              const missed = Math.round(((cellValue.missed || 0) / (cellValue.total || 0)) * 100)

              return (
                <Tooltip
                  tooltip={
                    <div>
                      <Text fontSize="medium" bold>
                        Missed
                      </Text>
                      <Text fontSize="small" variant="muted">
                        {cellValue.missed} out of {cellValue.total} (
                        {toPercentage((cellValue.missed || 0) / (cellValue.total || 0))}) activities
                        missed over the last {daysAgo} days
                      </Text>
                    </div>
                  }
                  tooltipClassName={styles.toolTip}
                >
                  <Text fontSize="small" bold>
                    {cellValue.missed}{" "}
                    <Text variant="muted" renderAs="span">
                      ({isNaN(missed) ? "0" : missed}%)
                    </Text>
                  </Text>
                </Tooltip>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              if (a.academy.statistics && b.academy.statistics) {
                return a.academy.statistics?.missed.totalCount >
                  b.academy.statistics?.missed.totalCount
                  ? 1
                  : -1
              }
              return 1
            },
          },
          {
            Header: "Completed",
            accessor: "completedActivity",
            Cell: cell => {
              const cellValue = cell.value as {
                completed: number | undefined
                total: number | undefined
              }

              const completed = Math.round(
                ((cellValue.completed || 0) / (cellValue.total || 0)) * 100
              )
              return (
                <Tooltip
                  tooltip={
                    <div>
                      <Text fontSize="medium" bold>
                        Completed
                      </Text>
                      <Text fontSize="small" variant="muted">
                        {cellValue.completed} out of {cellValue.total} (
                        {isNaN(completed) ? "0" : completed}) activities completed over the last{" "}
                        {daysAgo} days
                      </Text>
                    </div>
                  }
                  tooltipClassName={styles.toolTip}
                >
                  <Text fontSize="small" bold>
                    {cellValue.completed}{" "}
                    <Text variant="muted" renderAs="span">
                      ({isNaN(completed) ? "0" : completed})
                    </Text>
                  </Text>
                </Tooltip>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              if (a.academy.statistics && b.academy.statistics) {
                return a.academy.statistics?.completed.totalCount >
                  b.academy.statistics?.completed.totalCount
                  ? 1
                  : -1
              }
              return 1
            },
          },
          {
            Header: "Waiting for grading",
            accessor: "waitingActivity",
            Cell: cell => {
              const cellValue = cell.value as {
                waiting: number | undefined
                total: number | undefined
              }
              return (
                <Tooltip
                  tooltip={
                    <div>
                      <Text fontSize="medium" bold>
                        Missed
                      </Text>
                      <Text fontSize="small" variant="muted">
                        {cellValue.waiting} out of {cellValue.total} submissions over the last{" "}
                        {daysAgo} days are waiting to be graded
                      </Text>
                    </div>
                  }
                  tooltipClassName={styles.toolTip}
                >
                  <Text fontSize="small" bold>
                    {cellValue.waiting}
                  </Text>
                </Tooltip>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              if (a.academy.statistics && b.academy.statistics) {
                return a.academy.statistics?.waitingToBeGraded.totalCount >
                  b.academy.statistics?.waitingToBeGraded.totalCount
                  ? 1
                  : -1
              }
              return 1
            },
          },
          {
            Header: "Scheduled",
            accessor: "scheduledActivity",
            Cell: cell => {
              const cellValue = cell.value as number | undefined
              return (
                <Tooltip
                  tooltip={
                    <div>
                      <Text fontSize="medium" bold>
                        Missed
                      </Text>
                      <Text fontSize="small" variant="muted">
                        {cellValue} activities are schedueled over the upcoming {daysAgo} days
                      </Text>
                    </div>
                  }
                  tooltipClassName={styles.toolTip}
                >
                  <Text fontSize="small" bold>
                    {cellValue}
                  </Text>
                </Tooltip>
              )
            },
          },
          {
            Header: "Impressions",
            accessor: "impressions",
            Cell: cell => {
              const cellValue = cell.value as {
                positive: (number | null | undefined)[] | undefined
                negative: (number | null | undefined)[] | undefined
                total: (number | null | undefined)[] | undefined
              }

              const postitiveImpressions =
                cellValue.positive?.reduce((acc, value) => (acc || 0) + (value || 0), 0) || 0

              const negativeImpressions =
                cellValue.negative?.reduce((acc, value) => (acc || 0) + (value || 0), 0) || 0

              const totalImpressions =
                cellValue.total?.reduce((acc, value) => (acc || 0) + (value || 0), 0) || 0

              const impressionPercentage = (impression: number, total: number) => {
                return Math.round((impression / total) * 100) || 0
              }

              return (
                <Tooltip
                  tooltip={
                    <>
                      <Text bold>Impressions</Text>
                      <div>
                        {totalImpressions} impressions have been submitted over the last 14 days.{" "}
                        <Text fontSize="small" variant="muted">
                          Postive={impressionPercentage(postitiveImpressions, totalImpressions)}%
                        </Text>
                        <Text fontSize="small" variant="muted">
                          Negative={impressionPercentage(negativeImpressions, totalImpressions)}%
                        </Text>
                      </div>
                    </>
                  }
                  tooltipClassName={styles.toolTip}
                >
                  <Text renderAs="span">
                    <Text fontSize="small" bold className={styles.impression}>
                      <FontAwesomeIcon icon={["far", "thumbs-up"]} /> {postitiveImpressions}
                    </Text>
                    <Text fontSize="small" bold>
                      <FontAwesomeIcon icon={["far", "thumbs-down"]} /> {negativeImpressions}
                    </Text>
                  </Text>
                </Tooltip>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              const aImpressions = a.academy.statistics?.positiveImpressions.groupBy.map(
                value => value.value
              )
              const bImpressions = b.academy.statistics?.positiveImpressions.groupBy.map(
                value => value.value
              )

              if (aImpressions && bImpressions) {
                return (aImpressions?.reduce((acc, value) => (acc || 0) + (value || 0), 0) || 0) >
                  (bImpressions?.reduce((acc, value) => (acc || 0) + (value || 0), 0) || 0)
                  ? 1
                  : -1
              }
              return 1
            },
          },
        ],
      },
    ],
    [daysAgo]
  )

  return <Table onSetDaysAgo={onSetDaysAgo} daysAgo={daysAgo} data={data} columns={columns} />
}

interface ActivitiesTabProps {
  childOrganizations?: ChildOrganization[]
  daysAgo: number
  onSetDaysAgo: (daysAgo: number) => void
}
