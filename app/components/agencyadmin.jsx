"use client"

import { useEffect, useState } from "react"
import { Button } from "flowbite-react"
import AllCompsCommon from "./allcompscommon"
import AgencyCommon from "./agencycommon"
import useSWR from "swr"
import { HiPlus } from "react-icons/hi"
import AddUserAgencyModal from "./modals/add-user-agency"
import EditUserAgencyModal from "./modals/edit-user-agency"

import AgGridAllUsersInAgency from "./aggrids/agency/allusersinagency"
import AllUsersInAgencyLinkRenderer from "./aggrids/agency/allusersinagencylinkrenderer"

// Called with props.role = {admin:true, agencyId:agencyId}.
// Renders AgencyCommon to render table of orgs using by this agency (which has no
// per row links or a button to add anything).
// Below AgencyCommon it renders a table of users in this agency which includes an
// Edit user link on each row and an Add New User button to the right.
export default function AgencyAdmin({ role, user, roleIsEmulated }) {
  
  const [openModal, setOpenModal] = useState()
  const props = { openModal, setOpenModal }

  const {
    data: thisAgency,
    error: thisAgencyError,
    isLoading: thisAgencyIsLoading
  } = useSWR(`/api/agencies/${role.agencyId}`)
  const {
    data: usersInAgency,
    error: usersInAgencyError,
    isLoading: usersInAgencyIsLoading
  } = useSWR(`/api/users?aid=${role.agencyId}`)
  const {
    data: userResponse,
    error: userResponseError,
    isLoading: userResponseIsLoading
  } = useSWR(`/api/users`)

  const [rowDataAllUsersInAgency, setRowDataAllUsersInAgency] = useState([])
  const [colDefsAllUsersInAgency, setColDefsAllUsersInAgency] = useState([
    { field: "name" },
    { field: "phone" },
    { field: "email" },
    { field: "active" },
    {
      field: "action",
      cellRenderer: AllUsersInAgencyLinkRenderer,
      cellRendererParams: {
        setOpenModal: setOpenModal
      }
    }
  ])

  useEffect(() => {
    if (usersInAgency?.users.length > 0) {
      const holdRows = []
      usersInAgency.users.forEach(ag => {
        holdRows.push(ag)
      })
      setRowDataAllUsersInAgency(holdRows)
    }
  }, [usersInAgency?.users])

  if (thisAgencyError || usersInAgencyError || userResponseError) {
    return <div>Error loading data</div>
  }
  if (thisAgencyIsLoading || usersInAgencyIsLoading || userResponseIsLoading) {
    return <div>loading...</div>
  }

  return (
    <>
      <div className="flex flex-col">
        <AllCompsCommon />
        <div className="mt-8 text-black h-full flex flex-col items-center">
          <AgencyCommon
            role={role}
            user={user}
            roleIsEmulated={roleIsEmulated}
          />

          <div className="h-full flex items-center justify-start">
            {/* USERS IN THIS AGENCY */}
            <div className="flex flex-row items-center">
              <div className="flex mt-10 p-2 text-black">
                <div className="border-2 border-black shadow-xl w-[1015px]">
                  <div className="grid">
                    {usersInAgency.users.length > 0 && (
                      <>
                        <span className="ml-4 font-bold">
                          Users in {thisAgency.data.agency.name}
                        </span>
                        <AgGridAllUsersInAgency
                          rowDataAllUsersInAgency={rowDataAllUsersInAgency}
                          colDefsAllUsersInAgency={colDefsAllUsersInAgency}
                        />
                      </>
                    )}
                    {usersInAgency.users.length === 0 && (
                      <div className="outline-1 ml-12 h-fit px-8">
                        <span>
                          Strangely, there are no users in this agency.
                        </span>
                      </div>
                    )}

                    <Button
                      outline
                      gradientMonochrome="info"
                      className="justify-self-end mt-4 mb-4 mr-8"
                      onClick={() => {
                        setOpenModal({
                          modalId: "add-user-agency",
                          modalHdr: `Add New User to ${thisAgency.data.agency.name}`,
                          agencyId: role.agencyId
                        })
                      }}
                    >
                      <HiPlus className="mr-2 h-5 w-5" />
                      Add&nbsp;New&nbsp;User
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddUserAgencyModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        userResponse={userResponse}
      />
      <EditUserAgencyModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        userResponse={userResponse}
      />
    </>
  )
}
