"use client"

import { useEffect, useState } from "react"
import { Button } from "flowbite-react"
import useSWR from "swr"
import AllCompsCommon from "./allcompscommon"
import OrgCommon from "./orgcommon"
import { HiPlus } from "react-icons/hi"
import AddUserOrgModal from "./modals/add-user-org"
import EditUserOrgModal from "./modals/edit-user-org"

import AgGridAllUsersInOrg from "./aggrids/org/allusersinorg"
import AllUsersInOrgLinkRenderer from "./aggrids/org/allusersinorglinkrenderer"

// Called with props.role = {admin:true, orgId:orgId}.
// Renders <OrgCommon /> to render table of agencies used by this org containing 3 links
// per agency row and, since it's rendered from OrgAdmin, an Add Agency button.
// Below that, for an org admin, it shows users in this org with an Add New User button.
export default function OrgAdmin({ role, user, roleIsEmulated }) {
  const [openModal, setOpenModal] = useState()
  const props = { openModal, setOpenModal }

  const {
    data: thisOrg,
    error: thisOrgError,
    isLoading: thisOrgIsLoading
  } = useSWR(`/api/orgs/${role.orgId}`)
  const {
    data: usersInOrg,
    error: usersInOrgError,
    isLoading: usersInOrgIsLoading
  } = useSWR(`/api/users?oid=${role.orgId}`)
  const {
    data: userResponse,
    error: userResponseError,
    isLoading: userResponseIsLoading
  } = useSWR(`/api/users`)

  const [rowDataAllUsersInOrg, setRowDataAllUsersInOrg] = useState([])
  const [colDefsAllUsersInOrg, setColDefsAllUsersInOrg] = useState([
    { field: "name" },
    { field: "phone" },
    { field: "email" },
    { field: "active" },
    {
      field: "action",
      cellRenderer: AllUsersInOrgLinkRenderer,
      cellRendererParams: {
        setOpenModal: setOpenModal
      }
    }
  ])

  useEffect(() => {
    if (usersInOrg?.users.length > 0) {
      const holdRows = []
      usersInOrg.users.forEach(ur => {
        holdRows.push(ur)
      })
      setRowDataAllUsersInOrg(holdRows)
    }
  }, [usersInOrg?.users])
  // useEffect(() => {

  //   if (userResponse?.users.length > 0) {
  //     const holdRows: any[] = []
  //     userResponse.users.forEach(ur => {
  //       holdRows.push(ur)
  //     })
  //     setRowDataAllUsersInOrg(holdRows)
  //   }

  // }, [userResponse?.users])

  if (thisOrgError || usersInOrgError || userResponseError) {
    return <div>Error loading data</div>
  }
  if (thisOrgIsLoading || usersInOrgIsLoading || userResponseIsLoading) {
    return <div>loading...</div>
  }

  // MARK: Render
  return (
    <>
      <div className="flex flex-col">
        <AllCompsCommon />
        
        <div className="mt-8 text-black h-full flex flex-col items-center">
          <OrgCommon role={role} user={user} roleIsEmulated={roleIsEmulated} />

          <div className="h-full flex items-center justify-start">
            {/* USERS IN THIS ORG */}
            <div className="flex flex-row items-center">
              <div className="flex mt-10 p-2 text-black">
                <div className="border-2 border-black shadow-xl w-[1015px]">
                  <div className="grid">
                    {usersInOrg.users.length > 0 && (
                      <>
                        <span className="ml-4 font-bold">
                          All Users in {thisOrg.data.org.name}
                        </span>
                        <AgGridAllUsersInOrg
                          rowDataAllUsersInOrg={rowDataAllUsersInOrg}
                          colDefsAllUsersInOrg={colDefsAllUsersInOrg}
                        />
                      </>
                    )}
                    {usersInOrg.users.length === 0 && (
                      <div className="outline-1 ml-12 h-fit px-8">
                        <span>Strangely, there are no users in this org.</span>
                      </div>
                    )}

                    <Button
                      outline
                      gradientMonochrome="info"
                      className="justify-self-end mt-4 mb-4 mr-8"
                      onClick={() => {
                        props.setOpenModal({
                          modalId: "add-user-org",
                          modalHdr: `Add New User to ${thisOrg.data.org.name}`,
                          orgId: role.orgId
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

{/* MARK: Modals
 */}
      <AddUserOrgModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        userResponse={userResponse}
      />
      <EditUserOrgModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        userResponse={userResponse}
      />
    </>
  )
}
