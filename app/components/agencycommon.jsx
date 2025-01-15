"use client"
import { useState, useEffect } from "react"
import useSWR from "swr"

import AgGridOrgsUsingAgency from "./aggrids/agency/orgsusingagency"
import OrgsUsingAgencyLinkRenderer from "./aggrids/agency/orgsusingagencylinkrenderer"

import UploadCallRecordingsModal from "./modals/upload-call-recordings";

// Called by AgencyAdmin or AgencyNonAdmin with props.role = {admin:true or false, agencyId:agencyId, orgId: null}.
// If user is emulating, role is the emulated role. Otherwise, it is the user's native role.

// Renders a table of orgs using this agency with possible functionality
// to open a new browser tab to drag/drop (upload) audio files.
export default function AgencyCommon({ role, user, roleIsEmulated }) {

  const [openModal, setOpenModal] = useState()
  const props = { openModal, setOpenModal }

  const {
    data: thisAgency,
    error: thisAgencyError,
    isLoading: thisAgencyIsLoading
  } = useSWR(`/api/agencies/${role.agencyId}`)
  const {
    data: orgsUsingAgency,
    error: orgsUsingAgencyError,
    isLoading: orgsUsingAgencyIsLoading
  } = useSWR(`/api/orgs?aid=${role.agencyId}`)

  const [rowDataOrgsUsingAgency, setRowDataOrgsUsingAgency] = useState([])
  const [colDefsOrgsUsingAgency, setColDefsOrgsUsingAgency] = useState([
    { field: "org name", width: 240 },
    { field: "admin name", width: 180 },
    { field: "admin phone", width: 140 },
    { field: "admin email", width: 200 },
    { field: "active", width: 80 },
    {
      field: "action",
      cellRenderer: OrgsUsingAgencyLinkRenderer,
      cellRendererParams: {
        setOpenModal: setOpenModal
      }
    }
  ])

  useEffect(() => {
    const getUserContactPropertyForOrg = (og, field) => {
      // Org og contains an array users that was taken from UsersOnOrgs.
      // Return info from the first item where isOrgAdmin is true.
      for (let i = 0; i < og.users.length; i++) {
        const u = og.users[i]
        if (u.isOrgAdmin) {
          return field === "name"
            ? u.user.name
            : field === "phone"
              ? u.user.phone
              : u.user.email
        }
      }
      return ""
    }

    if (orgsUsingAgency?.orgs.length > 0) {
      const holdRows = []
      orgsUsingAgency.orgs.forEach(org => {
        holdRows.push({
          "org name": org.name,
          "admin name": getUserContactPropertyForOrg(org, "name"),
          "admin phone": getUserContactPropertyForOrg(org, "phone"),
          "admin email": getUserContactPropertyForOrg(org, "email"),
          active: org.active,
          id: org.id
        })
      })
      setRowDataOrgsUsingAgency(holdRows)
    }
  }, [orgsUsingAgency?.orgs])

  if (orgsUsingAgencyError || thisAgencyError) {
    return <div>Error loading data</div>
  }
  if (orgsUsingAgencyIsLoading || thisAgencyIsLoading) {
    return <div>loading...</div>
  }

  return (
    <>
      <div className="h-full flex items-center justify-start">
        {/* ORGS USING THIS AGENCY */}
        <div className="flex flex-row items-center">
          <div className="flex mt-10 p-2 text-black">
            <div className="border-2 border-black shadow-xl ">
              <div>
                {orgsUsingAgency?.orgs.length > 0 && (
                  <>
                    <span className="ml-4 font-bold">
                      Orgs Using {thisAgency.data.agency.name}
                    </span>
                    <AgGridOrgsUsingAgency
                      rowDataOrgsUsingAgency={rowDataOrgsUsingAgency}
                      colDefsOrgsUsingAgency={colDefsOrgsUsingAgency}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
          {orgsUsingAgency?.orgs.length === 0 && (
            <div className="outline-1 ml-12 h-fit px-8">
              <span>
                Strangely, there are no orgs working with this agency.
              </span>
            </div>
          )}
        </div>
      </div>
      <UploadCallRecordingsModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        role={role}
      />
    </>
  )
}
