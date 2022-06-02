import {
  GetOrganizationProfileOrganization as Organization,
  OrganizationTypeEnum,
  ProgramParticipantTypeEnum,
  useGetOrganizationOverviewStatsQuery,
} from "graphql-api"
import { useEffect, useState } from "react"
import { SelectOption } from "@saits/bibban"
import { DateTime } from "luxon"
import { OrganizationDataTabContainer } from "./OrganizationDataTabContainer"
import { usePermission } from "hooks/usePermisson"
import { StatisticsFilter } from "../OverviewTab/StatisticsFilter"
import { EmptyState } from "components/EmptyState"

export const formatStatisticsFilter = ({
  excludeTestUsers,
  excludeEmployees,
  selectedOrganizations,
  selectedSources,
}: OrganizationOverviewStatisticsFilter) => {
  return {
    excludeTestUsers,
    excludeEmployees,
    organizationIds: selectedOrganizations.map(({ value }) => value),
    sources: selectedSources.map(({ value }) => value) as ProgramParticipantTypeEnum[],
  }
}

/* MY CODE */
export const InsightsTab = ({ organization }: OverviewTabProps) => {
  const [statisticsFilter, setStatisticsFilter] = useState<OrganizationOverviewStatisticsFilter>({
    excludeTestUsers: true,
    excludeEmployees: true,
    selectedOrganizations: [],
    selectedSources: [],
  })

/* ----- */ 


  const { data, previousData } = useGetOrganizationOverviewStatsQuery({
    variables: {
      organizationId: organization.id,
      ...formatStatisticsFilter(statisticsFilter),
      scheduledAfter: DateTime.local()
        .minus({ days: 14 })
        .toFormat("yyyy-MM-dd"),
      scheduledBefore: DateTime.local().toFormat("yyyy-MM-dd"),
    },
  })

  const { use: hasPermission } = usePermission("manage_organization_data")

  useEffect(() => {
    setStatisticsFilter(curr => ({ ...curr, selectedOrganizations: [] }))
  }, [organization.id])

  return (
    <>
    {/* MY CODE */ }
      <StatisticsFilter
        statisticsFilter={statisticsFilter}
        descendingOrganizations={data?.organization.descendingOrganizations?.nodes}
        isAcademyGroup={organization.type === OrganizationTypeEnum.AcademyGroup}
        onSetStatisticsFilter={setStatisticsFilter}
      />
      {/* -------- */ }

      {(data || previousData) && (
        <>
          {organization.type === OrganizationTypeEnum.AcademyGroup && hasPermission ? (
            <>
              <OrganizationDataTabContainer organization={(data || previousData!).organization} />
            </>
          ) : (
            <>
              <EmptyState title="Not supported for academies yet." />
            </>
          )}
        </>
      )}
    </>
  )
}

export interface OrganizationOverviewStatisticsFilter {
  excludeTestUsers: boolean
  excludeEmployees: boolean
  selectedOrganizations: SelectOption[]
  selectedSources: SelectOption[]
}

interface OverviewTabProps {
  organization: Organization
}
