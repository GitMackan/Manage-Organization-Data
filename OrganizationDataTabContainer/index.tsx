import { TabContainer } from "@saits/bibban"
import { AllTab } from "./AllTab"
import {
  GetOrganizationOverviewStatsOrganization as Organization,
  useGetOrganizationChildrenQuery,
} from "graphql-api"
import { GeneralTab } from "./GeneralTab"
import { ActivitiesTab } from "./ActivitiesTab"
import { UsersTab } from "./UsersTab"
import { OrganizationsTab } from "./OrganizationsTab"
import { AcademyGroupGeneralStats } from "../../OverviewTab/AcademyGroupGeneralStats"
import { DateTime } from "luxon"
import { useState } from "react"

export const OrganizationDataTabContainer = ({
  organization,
}: OrganizationDataTabContainerProps) => {
  const [daysAgo, setDaysAgo] = useState(14)
  const { data } = useGetOrganizationChildrenQuery({
    variables: {
      id: organization.id,
      timePeriodStart: DateTime.local()
        .minus({ days: daysAgo })
        .toFormat("yyyy-MM-dd"),
      timePeriodEnd: DateTime.local().toFormat("yyyy-MM-dd"),
      previousTimePeriodstart: DateTime.local()
        .minus({ days: daysAgo * 2 })
        .toFormat("yyyy-MM-dd"),
      previousTimePeriodEnd: DateTime.local()
        .minus({ days: daysAgo })
        .toFormat("yyyy-MM-dd"),
    },
  })

  return (
    <div>
      <AcademyGroupGeneralStats
        organization={organization}
        childOrganizations={data?.organization.descendingOrganizations?.nodes}
      />
      <TabContainer
        tabs={[
          {
            id: "all",
            label: "All",
            componentProps: {
              childOrganizations: data?.organization.descendingOrganizations?.nodes,
              daysAgo,
              onSetDaysAgo: setDaysAgo,
            },
            component: AllTab,
          },
          {
            id: "general",
            label: "General",
            componentProps: {
              childOrganizations: data?.organization.descendingOrganizations?.nodes,
              daysAgo,
              onSetDaysAgo: setDaysAgo,
            },
            component: GeneralTab,
          },
          {
            id: "activities",
            label: "Activities",
            componentProps: {
              childOrganizations: data?.organization.descendingOrganizations?.nodes,
              daysAgo,
              onSetDaysAgo: setDaysAgo,
            },
            component: ActivitiesTab,
          },
          {
            id: "users",
            label: "Users",
            componentProps: {
              childOrganizations: data?.organization.descendingOrganizations?.nodes,
              daysAgo,
              onSetDaysAgo: setDaysAgo,
            },
            component: UsersTab,
          },
          {
            id: "organizations",
            label: "Organizations",
            componentProps: {
              childOrganizations: data?.organization.descendingOrganizations?.nodes,
              daysAgo,
              onSetDaysAgo: setDaysAgo,
            },
            component: OrganizationsTab,
          },
        ]}
      />
    </div>
  )
}

interface OrganizationDataTabContainerProps {
  organization: Organization
}
