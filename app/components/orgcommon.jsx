// @ts-nocheck
"use client"

import { useState, useReducer, useEffect } from "react"
import useSWR from "swr"
import { Button } from "flowbite-react"
import { HiPlus } from "react-icons/hi"
import { GiBinoculars } from "react-icons/gi"
import AddAgencyModal from "./modals/add-agency"
import EditAgencyModal from "./modals/edit-agency"
import EditModelsModalNew from "./modals/edit-models-new"
import ExploreScoringModal from "./modals/explore-scoring"
import AgGridAgenciesUsedByOrg from "./aggrids/org/agenciesusedbyorg"
import AgenciesUsedByOrgLinksRenderer from "./aggrids/org/agenciesusedbyorglinksrenderer"
import GridDemoModal from "./modals/grid-demo";

// import TestingModal from "./testing/testing-modal"
// import TestingComponent from "./testing/testing-component"

// Called with props.role = {admin:true or false, orgId:orgId} from OrgAdmin or OrgNonAdmin.
// Both admins and non-admins will see a list of agencies that their org uses (is connected to).
// Each agency row in the table has 3 links that open dialogs for settings, scoring settings
// and scoring retrieval work.
// When called by an Org Admin, there will be a button to add a new or existing agency to the org.
export default function OrgCommon({ role, user, roleIsEmulated }) {

  const [openModal, setOpenModal] = useState()
  const props = { openModal, setOpenModal }

  const [counterKey, incrementCounterKey] = useReducer(c => c + 1, 0)

  const {
    data: thisOrg,
    error: thisOrgError,
    isLoading: thisOrgIsLoading
  } = useSWR(`/api/orgs/${role.orgId}`)
  const {
    data: agenciesInOrg,
    error: agenciesInOrgError,
    isLoading: agenciesInOrgIsLoading
  } = useSWR(`/api/agencies?oid=${role.orgId}`)
  const {
    data: agencyResponse,
    error: agencyResponseError,
    isLoading: agencyResponseIsLoading
  } = useSWR(`/api/agencies`)

  const [rowDataAgenciesUsedByOrg, setRowDataAgenciesUsedByOrg] = useState([])
  const [colDefsAgenciesUsedByOrg, setColDefsAgenciesUsedByOrg] = useState([
    { field: "agency name", width: 240 },
    { field: "admin", width: 180 },
    { field: "admin phone", width: 120 },
    { field: "admin email", width: 200 },
    { field: "agency city", width: 170 },
    { field: "state", width: 70 },
    { field: "active", width: 80 },
    {
      field: "actions",
      width: 456,
      cellRenderer: AgenciesUsedByOrgLinksRenderer, // renders 2 links in 1 field: edit agency; edit models
      cellRendererParams: {
        setOpenModal: setOpenModal,
        incrementCounterKey: incrementCounterKey
      }
    }
  ])

  useEffect(() => {
    const getUserContactPropertyForAgency = (ag, field) => {
      // Agency ag contains an array users that was taken from UsersOnAgencies.
      // Return info from the first item where isAgencyAdmin is true.
      for (let i = 0; i < ag.users.length; i++) {
        const u = ag.users[i]
        if (u.isAgencyAdmin) {
          return field === "name"
            ? u.user.name
            : field === "phone"
              ? u.user.phone
              : u.user.email
        }
      }
      return ""
    }

    if (agenciesInOrg?.agencies.length > 0) {
      const holdRows = []
      agenciesInOrg.agencies.forEach(ag => {
        holdRows.push({
          "agency name": ag.name,
          admin: getUserContactPropertyForAgency(ag, "name"),
          "admin phone": getUserContactPropertyForAgency(ag, "phone"),
          "admin email": getUserContactPropertyForAgency(ag, "email"),
          "agency city": ag.city,
          state: ag.state,
          active: ag.active,
          // extra data needed for modals:
          id: ag.id,
          "org name": thisOrg?.data.org.name
        })
      })
      setRowDataAgenciesUsedByOrg(holdRows)
    }
  }, [agenciesInOrg?.agencies, thisOrg?.data.org.name, thisOrg?.name])

  if (agenciesInOrgError || thisOrgError || agencyResponseError) {
    return <div>Error loading data</div>
  }
  if (agenciesInOrgIsLoading || thisOrgIsLoading || agencyResponseIsLoading) {
    return <div>loading...</div>
  }

  // const delay = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

  // MARK: Render
  return (
    <>
      <div className="h-full flex items-center justify-start">
        {/* AGENCIES USED BY THIS ORG */}
        <div className="flex flex-row items-center">
          <div className="flex mt-10 p-2 text-black">
            <div className="border-2 border-black shadow-xl w-[1525px]">
              <div className="grid">
                {agenciesInOrg?.agencies.length > 0 && (
                  <>
                    <span className="ml-4 font-bold">
                      Agencies Used by {thisOrg.data.org.name}
                    </span>
                    <AgGridAgenciesUsedByOrg
                      rowDataAgenciesUsedByOrg={rowDataAgenciesUsedByOrg}
                      colDefsAgenciesUsedByOrg={colDefsAgenciesUsedByOrg}
                    />
                    <div className="px-4 pb-3 w-[1500px]">
                      <p className="mt-1 leading-tight">
                        Use{" "}
                        <span className="text-blue-600 italic font-semibold whitespace-normal">
                          Edit agency settings
                        </span>{" "}
                        to edit an agency&apos;s properties, such as Admin
                        Contact info.
                      </p>
                      <p className="mt-2 leading-tight">
                        Use{" "}
                        <span className="text-blue-600 italic font-semibold whitespace-normal">
                          Edit scoring models
                        </span>{" "}
                        if you need to adjust the way call scoring, which can be
                        different for each of your agencies, is configured. When
                        you change call scoring settings, we create a
                        new scoring model, which goes into effect immediately.
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-self-end mr-8">

                  {/* {role.admin && !role.orgId && !role.agencyId && ( */}
                    {/* <Button
                      outline
                      gradientMonochrome="info"
                      className="mb-4 mr-8"
                      onClick={async () => {
                        props.setOpenModal({
                          modalId: "grid-demo",
                          modalHdr: "Grid Demo"
                        })
                      }}
                    >
                      Run grid demo
                    </Button> */}
                  {/* )} */}

                  <Button
                    outline
                    gradientMonochrome="info"
                    className="mb-4 mr-8"
                    onClick={async () => {
                      props.setOpenModal({
                        modalId: "explore-scoring",
                        modalHdr: "Explore Scoring"
                      })
                    }}
                  >
                    <GiBinoculars className="mr-2 h-5 w-5" />
                    Explore scoring results
                  </Button>

                  {role.admin && (
                    <Button
                      outline
                      gradientMonochrome="info"
                      className="mb-4 mr-8"
                      onClick={() => {
                        props.setOpenModal({
                          modalId: "add-agency",
                          modalHdr: "Add New Agency to Org"
                        })
                      }}
                    >
                      <HiPlus className="mr-2 h-5 w-5" />
                      Associate a new or existing Agency with your Org
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {agenciesInOrg?.agencies.length === 0 && (
        <div className="outline-1 ml-12 h-fit px-8">
          <span>
            Strangely, there are no agencies associated with this org.
          </span>
        </div>
      )}

      {/* MARK: Modals
*/}
      <AddAgencyModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        role={role}
      />
      <EditAgencyModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        agencyResponse={agencyResponse}
      />
      <EditModelsModalNew
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        role={role}
        key={counterKey}
        mykey={counterKey}
      />
      <ExploreScoringModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        role={role}
      />
      <GridDemoModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
      />
    </>
  )
}
