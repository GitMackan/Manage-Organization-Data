import { Column } from "react-table"
import { useMemo } from "react"
import styles from "./styles.module.scss"
import { GetOrganizationChildrenNodes as ChildOrganization } from "graphql-api"
import { Persona, Tooltip } from "@saits/bibban"
import { useAppDataContext } from "components/AppDataProvider"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { DateTime } from "luxon"
import { Text } from "components/Text"
import { TableChart } from "../TableChart"
import { Table } from "../Table"

export const formatDiffAsPercentage = (change: number) => {
  if (change === Infinity || change === 0) return undefined

  return change > 0 ? `(+${change}%)` : `(${change}%)`
}

export const getClassNameByPositivity = (value: number) => {
  if (value === 0 || value === undefined) return undefined
  if (value > 0) return styles.success
  return styles.danger
}

export const AllTab = ({ childOrganizations, daysAgo, onSetDaysAgo }: AllTabProps) => {
  const { theme } = useAppDataContext()

  const data = useMemo(
    () =>
      childOrganizations?.map(organization => ({
        id: organization.id,
        academy: organization,
        state: organization.state,
        organizationCreated: organization.createdAt,
        createdBy: organization,
        students: {
          activeStudents: organization.statistics?.activeStudentUsers.groupBy.map(
            value => value.value
          ),
          totalStudents: organization.statistics?.studentUsers.totalCount,
          previousActiveStudents: organization.statistics?.activeStudentUsersPreviousPeriod.groupBy.map(
            value => value
          ),
          graph_currentActiveStudent: organization.statistics?.currentActiveUsers.groupBy,
          graph_previousActiveStudent: organization.statistics?.previousActiveUsers.groupBy,
        },
        staff: {
          activeStaff: organization.statistics?.activeStaffUsers.totalCount,
          staffTotalCount: organization.statistics?.activeStaffUsers.totalCount,
        },
        activeClassrooms: organization.statistics?.classrooms.groupBy.map(value => value.value),
        packages: {
          packageCount: organization.packages?.totalCount,
          packageNames: organization.packages?.nodes.map(id => id.authorizationPackage),
        },
        lastOrganizationActivity: organization.activeAt,
        completedActivity: {
          completed: organization.statistics?.completed.totalCount,
          total: organization.statistics?.activitesLast14Days.totalCount,
        },
        scheduledActivity: organization.statistics?.activitesLast14Days.totalCount,
        waitingActivity: {
          waiting: organization.statistics?.waitingToBeGraded.totalCount,
          total: organization.statistics?.activitesLast14Days.totalCount,
        },
        missedActivity: {
          missed: organization.statistics?.missed.totalCount,
          total: organization.statistics?.activitesLast14Days.totalCount,
        },
        impressions: {
          positive: organization.statistics?.positiveImpressions.groupBy.map(value => value.value),
          negative: organization.statistics?.negativeImpressions.groupBy.map(value => value.value),
          total: organization.statistics?.totalImpressions.groupBy.map(value => value.value),
        },
        averageStudentTime: {
          student: organization.statistics?.studentPresent14DaysAverageTimeSpentOnPlatformInMs.groupBy.map(
            value => value.value
          ),
          previousStudentTime: organization.statistics?.studentFourteenDaysBeforePresentAverageTimeSpentOnPlatformInMs.groupBy.map(
            value => value.value
          ),
        },
        averageStaffTime: {
          staff: organization.statistics?.staffPresent14DaysAverageTimeSpentOnPlatformInMs.groupBy.map(
            value => value.value
          ),
          previousStaffTime: organization.statistics?.staffFourteenDaysBeforePresentAverageTimeSpentOnPlatformInMs.groupBy.map(
            value => value.value
          ),
        },
      })) || [],
    [childOrganizations]
  )

  const columns: Column[] = useMemo(
    () => [
      {
        Header: "General",
        columns: [
          {
            Header: "Academy",
            accessor: "academy",
            filter: (rows, ids, filterValue) => {
              return rows.filter(row => {
                const academy = row.values[ids[0]]
                return academy.name.toLowerCase().includes(filterValue.toLowerCase())
              })
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              return a.academy.name.toLowerCase() > b.academy.name.toLowerCase() ? 1 : -1
            },
            Cell: cell => {
              const organization: ChildOrganization = cell.value
              return (
                <Persona
                  size="extra-small"
                  name={organization.name}
                  avatar={
                    organization.configItems.nodes.find(
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
            Header: "Status",
            accessor: "state",
            Cell: cell => {
              return (
                <Text fontSize="small">
                  {cell.value}{" "}
                  <FontAwesomeIcon icon={["far", "chevron-down"]} className={styles.status} />
                </Text>
              )
            },
          },
        ],
      },
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
                        {cellValue.missed} out of {cellValue.total} ({isNaN(missed) ? "0" : missed}
                        %) activities missed over the last {daysAgo} days
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

              const completedActivities = Math.round(
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
                        {isNaN(completedActivities) ? "0" : completedActivities}%) activities
                        completed over the last {daysAgo} days
                      </Text>
                    </div>
                  }
                  tooltipClassName={styles.toolTip}
                >
                  <Text fontSize="small" bold>
                    {cellValue.completed}{" "}
                    <Text variant="muted" renderAs="span">
                      {isNaN(completedActivities) ? "" : `(${completedActivities}%)`}
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
            Header: () => (
              <Text>
                Waiting<br></br> for grading
              </Text>
            ),
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
      {
        Header: () => (
          <div className={styles.tableHeadContainer}>
            <Text bold>Users</Text>
            <Text className={styles.tableSubHeading} fontSize="small" variant="muted">
              <Text bold>Period:</Text> {daysAgo} days
            </Text>
          </div>
        ),
        id: "users",
        columns: [
          {
            Header: () => (
              <>
                <Text bold fontSize="small">
                  Active Students
                </Text>
                <Text variant="muted" fontWeight="medium">
                  Compared to previous period
                </Text>
              </>
            ),
            accessor: "students",
            id: "students",
            Cell: cell => {
              const cellValue = cell.value as {
                previousActiveStudents: number | undefined
                activeStudents: number | undefined
                totalStudents: number | undefined
                graph_currentActiveStudent:
                  | {
                      __typename: "GroupedBy"
                      value?: number | null | undefined
                    }[]
                  | undefined
                graph_previousActiveStudent:
                  | {
                      __typename: "GroupedBy"
                      value?: number | null | undefined
                    }[]
                  | undefined
              }
              const studentSum =
                (cellValue.previousActiveStudents || 0) - (cellValue.activeStudents || 0)
              const difference = Math.round(
                (studentSum / Number(cellValue.previousActiveStudents) || 0) * 100
              )

              const graphCurrentActiveStudents = cellValue.graph_currentActiveStudent
              const graphPreviousActiveStudents = cellValue.graph_previousActiveStudent

              const currentActiveStudents =
                graphCurrentActiveStudents?.map(value => value.value || 0) || []
              const activeStudents =
                currentActiveStudents?.reduce((acc, value) => acc + (value || 0), 0) || 0

              const previousActiveStudents =
                graphPreviousActiveStudents?.map(value => value.value || 0) || []
              const activeStudentsPrev =
                previousActiveStudents.reduce((acc, value) => acc + (value || 0), 0) || 0

              const previousMinusCurrent = activeStudents - activeStudentsPrev
              const percentage = (previousMinusCurrent / activeStudentsPrev) * 100 || 0

              if (!isNaN(difference)) {
                return (
                  <Tooltip
                    tooltip={
                      <>
                        <Text fontSize="medium" bold>
                          Active Students compared to previous period
                        </Text>
                        <Text fontSize="small" variant="muted">
                          Has {previousMinusCurrent >= 0 ? "increased" : "decreased"} by{" "}
                          {Math.abs(previousMinusCurrent)} students{" "}
                          {formatDiffAsPercentage(percentage)} compared to previous period.
                        </Text>
                      </>
                    }
                    tooltipClassName={styles.toolTip}
                  >
                    <div className={styles.chartContainer}>
                      <Text fontSize="small" bold>
                        {activeStudents}/{cellValue.totalStudents}{" "}
                        <span className={getClassNameByPositivity(previousMinusCurrent)}>
                          {formatDiffAsPercentage(percentage)}
                        </span>
                      </Text>
                    </div>
                  </Tooltip>
                )
              }
              return (
                <div className={styles.chartContainer}>
                  <div className={styles.chartContainerInfo}>
                    <Text fontSize="small" bold>
                      {cellValue.activeStudents}/{cellValue.totalStudents}{" "}
                      <span className={getClassNameByPositivity(previousMinusCurrent)}>
                        {formatDiffAsPercentage(percentage)}
                      </span>
                    </Text>
                  </div>
                </div>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              const aVal = a.academy.statistics?.activeStudentUsers.groupBy.map(
                value => value.value as number
              )
              const bVal = b.academy.statistics?.activeStudentUsers.groupBy.map(
                value => value.value as number
              )

              if (aVal && bVal) {
                return (aVal?.reduce((acc, value) => acc + value, 0) || 0) >
                  (bVal?.reduce((acc, value) => acc + value, 0) || 0)
                  ? 1
                  : -1
              }
              return 1
            },
          },
          {
            Header: "Active Staff",
            accessor: "staff",
            Cell: cell => {
              const cellValue = cell.value as {
                activeStaff: number | undefined
                staffTotalCount: number | undefined
              }
              return (
                <Text fontSize="small" bold>
                  {cellValue.activeStaff}/{cellValue.staffTotalCount}
                </Text>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              if (a.academy.statistics && b.academy.statistics)
                return a.academy.statistics?.activeStaffUsers.totalCount >
                  b.academy.statistics?.activeStaffUsers.totalCount
                  ? 1
                  : -1
              return 1
            },
          },
          {
            Header: () => (
              <>
                <Text bold fontSize="small">
                  Average time on platform per student
                </Text>
                <Text variant="muted" fontWeight="medium">
                  Compared to previous period
                </Text>
              </>
            ),
            accessor: "averageStudentTime",
            Cell: cell => {
              const cellValue = cell.value as {
                student: (number | null | undefined)[] | undefined
                previousStudentTime: (number | null | undefined)[] | undefined
              }
              const lastPeriod = (cellValue.student || []) as number[]
              const lastPeriodAverageTime =
                lastPeriod?.reduce((acc, value) => acc + (value || 0), 0) / 60000

              const previousPeriod = (cellValue.previousStudentTime || []) as number[]
              const previousAverageTime =
                previousPeriod?.reduce((acc, value) => acc + value || 0, 0) / 60000

              const differenceInMinutes = lastPeriodAverageTime - previousAverageTime

              const studentData = lastPeriod?.map(value => (value || 0) / 60000 || 0) || []
              const previousStudentData =
                previousPeriod?.map(value => (value || 0) / 60000 || 0) || []

              const dataSum = studentData.reduce((acc, value) => acc + value, 0 || 0)
              const previousDataSum = previousStudentData.reduce(
                (acc, value) => acc + value,
                0 || 0
              )

              const difference = dataSum - previousDataSum || 0
              const percentage = Math.round((difference / previousDataSum) * 100)
              return (
                <Tooltip
                  tooltip={
                    <>
                      <Text fontSize="medium" bold>
                        Average time on platform per student
                      </Text>
                      <Text fontSize="small" variant="muted">
                        The average time has {differenceInMinutes < 0 ? "decreased" : "increased"}{" "}
                        by {Math.abs(differenceInMinutes).toFixed(1)} minutes{" "}
                        {previousDataSum !== 0 && formatDiffAsPercentage(percentage)} per student
                        compared to previous period.
                      </Text>
                    </>
                  }
                  tooltipClassName={styles.toolTip}
                >
                  <div className={styles.chartContainer}>
                    <div className={styles.chartContainerInfo}>
                      <Text bold fontSize="small">
                        {lastPeriodAverageTime.toFixed(1)} minutes{" "}
                        <span className={getClassNameByPositivity(percentage)}>
                          {previousDataSum !== 0 && formatDiffAsPercentage(percentage)}
                        </span>
                      </Text>
                      <Text variant="muted" fontSize="small">
                        {previousAverageTime.toFixed(1)} minutes
                      </Text>
                    </div>
                    <div className={styles.chart}>
                      <TableChart data={studentData} previousData={previousStudentData} />
                    </div>
                  </div>
                </Tooltip>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              const valueOne = a.academy.statistics?.studentPresent14DaysAverageTimeSpentOnPlatformInMs.groupBy.map(
                value => value.value
              ) as number[]
              const valueTwo = b.academy.statistics?.studentPresent14DaysAverageTimeSpentOnPlatformInMs.groupBy.map(
                value => value.value
              ) as number[]
              return valueOne?.reduce((acc, value) => acc + value, 0) >
                valueTwo?.reduce((acc, value) => acc + value, 0)
                ? 1
                : -1
            },
          },
          {
            Header: () => (
              <>
                <Text bold fontSize="small">
                  Average time on platform per staff
                </Text>
                <Text variant="muted" fontWeight="medium">
                  Compared to previous period
                </Text>
              </>
            ),
            accessor: "averageStaffTime",
            Cell: cell => {
              const cellValue = cell.value as {
                staff: (number | null | undefined)[] | undefined
                previousStaffTime: (number | null | undefined)[] | undefined
              }
              const lastPeriod = (cellValue.staff || []) as number[]
              const lastPeriodAverageTime =
                lastPeriod?.reduce((acc, value) => acc + (value || 0), 0) / 60000

              const previousPeriod = (cellValue.previousStaffTime || []) as number[]
              const previousAverageTime =
                previousPeriod?.reduce((acc, value) => acc + value || 0, 0) / 60000

              const differenceInMinutes = lastPeriodAverageTime - previousAverageTime

              const staffData = lastPeriod?.map(value => (value || 0) / 60000 || 0) || []
              const previousStaffData =
                previousPeriod?.map(value => (value || 0) / 60000 || 0) || []

              const dataSum = staffData.reduce((acc, value) => acc + value, 0 || 0)
              const previousDataSum = previousStaffData.reduce((acc, value) => acc + value, 0 || 0)

              const difference = dataSum - previousDataSum || 0
              const percentage = Math.round((difference / previousDataSum) * 100)

              return (
                <Tooltip
                  tooltip={
                    <>
                      <Text fontSize="medium" bold>
                        Average time on platform per student
                      </Text>
                      <Text fontSize="small" variant="muted">
                        The average time has {differenceInMinutes < 0 ? "decreased" : "increased"}{" "}
                        by {Math.abs(differenceInMinutes).toFixed(1)} minutes{" "}
                        {previousDataSum !== 0 && formatDiffAsPercentage(percentage)} per student
                        compared to previous period.
                      </Text>
                    </>
                  }
                  tooltipClassName={styles.toolTip}
                >
                  <div className={styles.chartContainer}>
                    <div className={styles.chartContainerInfo}>
                      <Text bold fontSize="small">
                        {lastPeriodAverageTime.toFixed(1)} minutes{" "}
                        <span className={getClassNameByPositivity(percentage)}>
                          {previousDataSum !== 0 && formatDiffAsPercentage(percentage)}
                        </span>
                      </Text>
                      <Text variant="muted" fontSize="small">
                        {previousAverageTime.toFixed(1)} minutes
                      </Text>
                    </div>
                    <div className={styles.chart}>
                      <TableChart data={staffData} previousData={previousStaffData} />
                    </div>
                  </div>
                </Tooltip>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              const valOne = a.academy.statistics?.staffPresent14DaysAverageTimeSpentOnPlatformInMs.groupBy.map(
                value => value.value
              ) as number[]
              const valTwo = b.academy.statistics?.staffPresent14DaysAverageTimeSpentOnPlatformInMs.groupBy.map(
                value => value.value
              ) as number[]
              return valOne?.reduce((acc, value) => acc + value, 0) >
                valTwo?.reduce((acc, value) => acc + value, 0)
                ? 1
                : -1
            },
          },
        ],
      },
      {
        Header: () => (
          <div className={styles.tableHeadContainer}>
            <Text bold>Organizations</Text>
            <Text className={styles.tableSubHeading} fontSize="small" variant="muted">
              <Text bold>Period:</Text> {daysAgo} days
            </Text>
          </div>
        ),
        id: "organizations",
        columns: [
          {
            Header: "Active classrooms",
            accessor: "activeClassrooms",
            Cell: cell => {
              const classrooms: number[] = cell.value
              const activeClassrooms = classrooms.reduce((acc, value) => acc + value, 0)

              return (
                <Text fontSize="small" bold>
                  {activeClassrooms}
                </Text>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              const aVal = a.academy.statistics?.classrooms.groupBy.map(
                value => value.value
              ) as number[]
              const bVal = b.academy.statistics?.classrooms.groupBy.map(
                value => value.value
              ) as number[]

              const aTotal = aVal?.reduce((acc, value) => acc + value, 0) || 0
              const bTotal = bVal?.reduce((acc, value) => acc + value, 0) || 0

              if (a.academy.statistics && b.academy.statistics) {
                return aTotal > bTotal ? 1 : -1
              }
              return 1
            },
          },
          {
            Header: "Last organization activity",
            accessor: "lastOrganizationActivity",
            Cell: cell => {
              return (
                <Text fontSize="small" bold>
                  {cell.value
                    ? DateTime.fromISO(cell.value).toFormat("HH:mm - MMM d yyyy")
                    : "No activity yet"}
                </Text>
              )
            },
          },
          {
            Header: "Organization created",
            accessor: "organizationCreated",
            Cell: cell => {
              return (
                <Text fontSize="small" bold>
                  {DateTime.fromISO(cell.value).toFormat("MMM d yyyy")}
                </Text>
              )
            },
          },
          {
            Header: "Created by",
            accessor: "createdBy",
            minWidth: "195px",
            Cell: cell => {
              const val: ChildOrganization = cell.value
              return val.createdBy ? (
                <Persona
                  size="extra-small"
                  name={val.createdBy?.protectedInformation?.name}
                  avatar={val.createdBy?.account.avatar.originalUrl}
                />
              ) : (
                <Text fontSize="small" bold className={styles.createdBy}>
                  -
                </Text>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }

              const aValue = a.academy.createdBy?.protectedInformation?.name || ""
              const bValue = b.academy.createdBy?.protectedInformation?.name || ""

              return aValue.toLowerCase() > bValue.toLowerCase() ? 1 : -1
            },
          },
          {
            Header: "Packages",
            accessor: "packages",
            Cell: cell => {
              const cellValue = cell.value as {
                packageCount: number | undefined
                packageNames:
                  | (
                      | {
                          __typename: "AuthorizationPackage"
                          name: string
                          id: string
                        }
                      | null
                      | undefined
                    )[]
                  | undefined
              }
              if ((cellValue.packageCount || 0) > 0) {
                return (
                  <Tooltip
                    tooltip={
                      <div>
                        <Text fontSize="medium" bold>
                          Packages
                        </Text>
                        <ul className={styles.packageList}>
                          {cell.value.packageNames.map((value: ChildOrganization) => {
                            return (
                              <li key={value.id} className={styles.packageListItem}>
                                <Text renderAs="span" fontSize="small" variant="muted">
                                  {value.name}
                                </Text>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    }
                  >
                    <Text fontSize="small" bold>
                      {cellValue.packageCount}
                    </Text>
                  </Tooltip>
                )
              }
              return (
                <Tooltip tooltip={<Text fontSize="small">No packages found</Text>}>
                  <Text fontSize="small" bold>
                    {cellValue.packageCount}
                  </Text>
                </Tooltip>
              )
            },
            sortType: (aRow, bRow) => {
              const a = aRow.original as { academy: ChildOrganization }
              const b = bRow.original as { academy: ChildOrganization }
              if (
                a.academy.packages?.totalCount === null ||
                b.academy.packages?.totalCount === null
              ) {
                return 1
              }
              return a.academy.packages?.totalCount! > b.academy.packages?.totalCount! ? 1 : -1
            },
          },
        ],
      },
    ],
    [daysAgo]
  )

  return <Table onSetDaysAgo={onSetDaysAgo} daysAgo={daysAgo} columns={columns} data={data} />
}

interface AllTabProps {
  childOrganizations?: ChildOrganization[]
  daysAgo: number
  onSetDaysAgo: (daysAgo: number) => void
}
