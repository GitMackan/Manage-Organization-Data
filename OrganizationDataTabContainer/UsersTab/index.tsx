import { Column } from "react-table"
import { useMemo } from "react"
import styles from "./styles.module.scss"
import { GetOrganizationChildrenNodes as ChildOrganization } from "graphql-api"
import { Persona, Tooltip } from "@saits/bibban"
import { useAppDataContext } from "components/AppDataProvider"
import { Text } from "components/Text"
import { TableChart } from "../TableChart"
import { Table } from "../Table"
import { getClassNameByPositivity, formatDiffAsPercentage } from "../AllTab/index"

export const UsersTab = ({ childOrganizations, daysAgo, onSetDaysAgo }: UsersTabProps) => {
  const { theme } = useAppDataContext()

  const data = useMemo(
    () =>
      childOrganizations?.map(organization => ({
        academy: organization,
        state: organization.state,
        organizationCreated: organization.createdAt,
        students: {
          activeStudents: organization.statistics?.activeStudentUsers.groupBy.map(
            value => value.value
          ),
          totalStudents: organization.statistics?.studentUsers.totalCount,
          previousActiveStudents: organization.statistics?.activeStudentUsersPreviousPeriod.groupBy.map(
            value => value
          ),
          graphCurrentActiveStudents: organization.statistics?.currentActiveUsers.groupBy,
          graphPreviousActiveStudents: organization.statistics?.previousActiveUsers.groupBy,
        },
        staff: {
          activeStaff: organization.statistics?.activeStaffUsers.totalCount,
          staffTotalCount: organization.statistics?.activeStaffUsers.totalCount,
        },
        activeClassrooms: organization.statistics?.classrooms.totalCount,
        packages: organization.packages?.totalCount,
        lastOrganizationActivity: organization.activeAt,
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
            Header: "Academy",
            accessor: "academy",
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
            Cell: cell => {
              const cellValue = cell.value as {
                previousActiveStudents: number | undefined
                activeStudents: number | undefined
                totalStudents: number | undefined
                graphCurrentActiveStudents:
                  | {
                      __typename: "GroupedBy"
                      value?: number | null | undefined
                    }[]
                  | undefined
                graphPreviousActiveStudents:
                  | {
                      __typename: "GroupedBy"
                      value?: number | null | undefined
                    }[]
                  | undefined
              }
              const val = (cellValue.previousActiveStudents || 0) - (cellValue.activeStudents || 0)
              const difference = Math.round(
                (val / Number(cellValue.previousActiveStudents) || 0) * 100
              )

              const graphCurrentActiveStudents = cellValue.graphCurrentActiveStudents
              const graphPreviousActiveStudents = cellValue.graphPreviousActiveStudents

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
                          {formatDiffAsPercentage(percentage)}
                          compared to previous period.
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
                        ({Math.round(percentage)}%)
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

              const aTotal = aVal?.reduce((acc, value) => acc + value, 0) || 0
              const bTotal = bVal?.reduce((acc, value) => acc + value, 0) || 0

              if (a.academy.statistics && b.academy.statistics) {
                return aTotal > bTotal ? 1 : -1
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
    ],
    [daysAgo]
  )

  return <Table onSetDaysAgo={onSetDaysAgo} daysAgo={daysAgo} columns={columns} data={data} />
}

interface UsersTabProps {
  childOrganizations?: ChildOrganization[]
  daysAgo: number
  onSetDaysAgo: (daysAgo: number) => void
}
