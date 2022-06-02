import { Column } from "react-table"
import { useMemo } from "react"
import styles from "./styles.module.scss"
import { GetOrganizationChildrenNodes as ChildOrganization } from "graphql-api"
import { Persona, Tooltip } from "@saits/bibban"
import { useAppDataContext } from "components/AppDataProvider"
import { DateTime } from "luxon"
import { Text } from "components/Text"
import { Table } from "../Table"

export const OrganizationsTab = ({
  childOrganizations,
  daysAgo,
  onSetDaysAgo,
}: OrganizationsTabProps) => {
  const { theme } = useAppDataContext()

  const data = useMemo(
    () =>
      childOrganizations?.map(organization => ({
        academy: organization,
        organizationCreated: organization.createdAt,
        activeClassrooms: organization.statistics?.classrooms.groupBy.map(value => value.value),
        packages: {
          packageCount: organization.packages?.totalCount,
          packageNames: organization.packages?.nodes.map(id => id.authorizationPackage),
        },
        createdBy: organization,
        lastOrganizationActivity: organization.activeAt,
      })) || [],
    [childOrganizations]
  )

  const columns: Column[] = useMemo(
    () => [
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
                          {cellValue.packageNames?.map(value => {
                            return (
                              <li key={value?.id} className={styles.packageListItem}>
                                <Text renderAs="span" fontSize="small" variant="muted">
                                  {value?.name}
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

    []
  )

  return <Table onSetDaysAgo={onSetDaysAgo} daysAgo={daysAgo} columns={columns} data={data} />
}

interface OrganizationsTabProps {
  childOrganizations?: ChildOrganization[]
  daysAgo: number
  onSetDaysAgo: (daysAgo: number) => void
}
