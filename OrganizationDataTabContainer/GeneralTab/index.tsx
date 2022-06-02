import { Column } from "react-table"
import { useMemo } from "react"
import { GetOrganizationChildrenNodes as ChildOrganization } from "graphql-api"
import { Persona } from "@saits/bibban"
import { useAppDataContext } from "components/AppDataProvider"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Text } from "components/Text"
import { Table } from "../Table"
import styles from "../GeneralTab/styles.module.scss"

export const GeneralTab = ({ childOrganizations }: TableProps) => {
  const { theme } = useAppDataContext()

  const data = useMemo(
    () =>
      childOrganizations?.map(organization => ({
        id: organization.id,
        academy: organization,
        state: organization.state,
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
    ],
    []
  )

  return <Table data={data} columns={columns} />
}

interface TableProps {
  childOrganizations?: ChildOrganization[]
}
