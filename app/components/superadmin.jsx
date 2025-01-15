"use client"
import { useState, useContext, useEffect } from "react"
import { UserContext } from "../context/UserContext"
import useSWR from "swr"
import { useUser } from "../hooks/useUser"
import { useSession } from "next-auth/react"
import { HiPlus } from "react-icons/hi"
import { Button } from "flowbite-react"
import AllCompsCommon from "./allcompscommon"
import AllChart from "./allchart"

import AddOrgModal from "./modals/add-org"
import EditAgencyModal from "./modals/edit-agency"
import EditOrgModal from "./modals/edit-org"
import EditUserModal from "./modals/edit-user"

import AgGridAllOrgs from "./aggrids/superadmin/allorgs"
import AgGridAllAgencies from "./aggrids/superadmin/allagencies"
import AgGridAllUsers from "./aggrids/superadmin/allusers"
import AllOrgsLinkRenderer from "./aggrids/superadmin/allorgslinkrenderer"
import AllAgenciesLinkRenderer from "./aggrids/superadmin/allagencieslinkrenderer"
import AllUsersLinkRenderer from "./aggrids/superadmin/alluserslinkrenderer"

export default function SuperAdmin() {
  /**
   * This is the Super Admin component.
   * The signed in user, is fetched here (via useUser which uses useSWR).
   * After useUser retrieved the user from the database, it called /lib/getDefaultRole
   * to set nativeRole and availableRoles in UserContext. UserContext is used
   * only for the single signed in user, not for the array of all users fetched below.
   *
   * superadmin uses swr to fetch all orgs, agencies and users. It displays them in tables.
   * The org and agency tables have a stack (or just 1) of buttons to their right. Org has
   * Add New Org. This will also gen a token (once I settle on final method) and
   * will need to set up directories on the server and on files.com.
   *
   * The Agency table might not have an Add New Agency button, since that function
   * could be left to the Org admin for the Org introducing the Agency.
   * Orgs (and probably agencies) will have a Manage button to go into edit mode and more.
   * Users will, too.
   *
   * Remember: editing in the user table (via the manage link) isn't for editing the signed in user.
   * It's for editing the user in the table on the row containing the manage link.
   *
   * The manage and add new buttons all launch a dialog where managing (editing and working with)
   * and adding new take place.
   */

  // openModal state variable is an object. Read the code for details.
  const [openModal, setOpenModal] = useState()
  const props = { openModal, setOpenModal }

  const { state: userState, update: updateUserState } = useContext(UserContext)
  const { data: session, status } = useSession()
  let userId = session?.user?.id
  const {
    user,
    mutate,
    role: nativeRole,
    ec: availableRoles,
    isLoading,
    error
  } = useUser(userId)
  const emulatedRole = userState.emulatedRole
  const role =
    emulatedRole && Object.keys(emulatedRole).length > 0
      ? emulatedRole
      : nativeRole

  // Note: we don't access nativeRole or emulatedRole here,
  // but we do use it in <AllCompsCommon />.

  const {
    data: agencyResponse,
    error: agencyResponseError,
    isLoading: agencyResponseIsLoading
  } = useSWR(`/api/agencies`)
  const {
    data: orgResponse,
    error: orgResponseError,
    isLoading: orgResponseIsLoading
  } = useSWR(`/api/orgs`)
  const {
    data: userResponse,
    error: userResponseError,
    isLoading: userResponseIsLoading
  } = useSWR(`/api/users`)

  const [rowDataAllOrgs, setRowDataAllOrgs] = useState([])
  const [colDefsAllOrgs, setColDefsAllOrgs] = useState([
    { field: "name" },
    { field: "admin" },
    { field: "phone" },
    { field: "email" },
    { field: "active" },
    { field: "role" },
    {
      field: "action",
      cellRenderer: AllOrgsLinkRenderer,
      cellRendererParams: {
        setOpenModal: setOpenModal
      }
    }
  ])
  const [rowDataAllAgencies, setRowDataAllAgencies] = useState([])
  const [colDefsAllAgencies, setColDefsAllAgencies] = useState([
    { field: "name" },
    { field: "admin" },
    { field: "phone" },
    { field: "email" },
    { field: "active" },
    { field: "role" },
    {
      field: "action",
      cellRenderer: AllAgenciesLinkRenderer,
      cellRendererParams: {
        setOpenModal: setOpenModal
      }
    }
  ])
  const [rowDataAllUsers, setRowDataAllUsers] = useState([])
  const [colDefsAllUsers, setColDefsAllUsers] = useState([
    { field: "name" },
    { field: "phone" },
    { field: "email" },
    { field: "active" },
    {
      field: "action",
      cellRenderer: AllUsersLinkRenderer,
      cellRendererParams: {
        setOpenModal: setOpenModal
      }
    }
  ])

  useEffect(() => {
    const getMyRoleAtOrg = org => {
      // Look up org.id in user.xxx to see if user is connected. If not, return '' or 'no cxn'.
      // Else, if user's cxn is isOrgAdmin, return 'admin'. Else return 'member'.
      let defCxn = "no cxn"
      user.orgs.forEach(o => {
        if (o.orgId === org.id) {
          defCxn = o.isOrgAdmin ? "admin" : "member"
        }
      })
      return defCxn
    }
    const getMyRoleAtAgency = agency => {
      // Look up agency.id in user.xxx to see if user is connected. If not, return 'no cxn'.
      // Else, if user's cxn is isAgencyAdmin, return 'admin'. Else return 'member'.
      let defCxn = "no cxn"
      user.agencies.forEach(a => {
        if (a.agencyId === agency.id) {
          defCxn = a.isAgencyAdmin ? "admin" : "member"
        }
      })
      return defCxn
    }
    const getUserContactPropertyForAgency = (ag, field) => {
      // Agency ag contains an array called users that was taken from UsersOnAgencies.
      // Each item in users contains the info from that junction table (agencyId, userId,
      // isAgencyAdmin) PLUS a fully hydrated user object.
      // Return info from the first item where isAgencyAdmin is true. There has to be at least one.
      for (let i = 0; i < ag.users.length; i++) {
        let u = ag.users[i]
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
    const getUserContactPropertyForOrg = (og, field) => {
      // Ditto, but for Org.
      for (let i = 0; i < og.users.length; i++) {
        let u = og.users[i]
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

    if (orgResponse?.orgs.length > 0) {
      const holdRows = []
      orgResponse.orgs.forEach(or => {
        holdRows.push({
          name: or.name,
          admin: getUserContactPropertyForOrg(or, "name"),
          phone: getUserContactPropertyForOrg(or, "phone"),
          email: getUserContactPropertyForOrg(or, "email"),
          active: or.active,
          role: getMyRoleAtOrg(or),
          action: "Edit Org Btn",
          id: or.id
        })
      })
      setRowDataAllOrgs(holdRows)
    }

    if (agencyResponse?.agencies.length > 0) {
      const holdRows = []
      agencyResponse.agencies.forEach(ar => {
        holdRows.push({
          name: ar.name,
          admin: getUserContactPropertyForAgency(ar, "name"),
          phone: getUserContactPropertyForAgency(ar, "phone"),
          email: getUserContactPropertyForAgency(ar, "email"),
          active: ar.active,
          role: getMyRoleAtAgency(ar),
          action: "Edit Agency Btn",
          id: ar.id
        })
      })
      setRowDataAllAgencies(holdRows)
    }

    if (userResponse?.users.length > 0) {
      const holdRows = []
      userResponse.users.forEach(ur => {
        holdRows.push(ur)
      })
      setRowDataAllUsers(holdRows)
    }
  }, [
    agencyResponse?.agencies,
    orgResponse?.orgs,
    user?.agencies,
    user?.orgs,
    userResponse?.users
  ])

  if (agencyResponseError || orgResponseError || userResponseError) {
    return <div>Error loading data</div>
  }
  if (
    agencyResponseIsLoading ||
    orgResponseIsLoading ||
    userResponseIsLoading
  ) {
    return <div>loading...</div>
  }

  // const getMyRoleAtAgency = (agency) => {
  //   // Look up agency.id in user.xxx to see if user is connected. If not, return 'no cxn'.
  //   // Else, if user's cxn is isAgencyAdmin, return 'admin'. Else return 'member'.
  //   let defCxn = 'no cxn'
  //   user.agencies.forEach(a => {
  //     if (a.agencyId === agency.id) {
  //       defCxn = a.isAgencyAdmin ? 'admin' : 'member'
  //     }
  //   })
  //   return defCxn
  // }

  return (
    <>
      <div className="flex flex-col">
        <AllCompsCommon />

        <div className="mt-8 text-black h-full flex flex-col items-center">
        {/* <div className="h-full flex flex-col items-center justify-start"> */}
          <div className="flex flex-row items-center">
            <div className="flex mt-10 p-2 text-black">
              <div className="border-2 border-black shadow-xl w-[1406px]">
                <div className="grid">
                  {orgResponse && (
                    <>
                      <span className="ml-4 font-bold">All Orgs</span>
                      <AgGridAllOrgs
                        rowDataAllOrgs={rowDataAllOrgs}
                        colDefsAllOrgs={colDefsAllOrgs}
                      />
                    </>
                  )}
                  {!orgResponse && <div className="border"></div>}

                  <Button
                    outline
                    gradientMonochrome="info"
                    className="justify-self-end mt-4 mb-4 mr-8"
                    onClick={() => {
                      props.setOpenModal({
                        modalId: "add-org",
                        modalHdr: "Add New Org"
                      })
                    }}
                  >
                    <HiPlus className="mr-2 h-5 w-5" />
                    Add&nbsp;New&nbsp;Org
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center">
            <div className="flex mt-10 p-2 text-black">
              <div className="border-2 border-black shadow-xl w-[1406px]">
                <div className="grid">
                  {agencyResponse && (
                    <>
                      <span className="ml-4 font-bold">All Agencies</span>
                      <AgGridAllAgencies
                        rowDataAllAgencies={rowDataAllAgencies}
                        colDefsAllAgencies={colDefsAllAgencies}
                      />
                    </>
                  )}
                  {!agencyResponse && <div className="border"></div>}

                  <span className="justify-self-end mt-4 mb-4 mr-8">
                    Add an agency by emulating an org admin. Start by clicking
                    the{" "}
                    <span className="text-black rounded-lg py-0 px-1 bg-white font-semibold border-4 border-solid border-blue-500">
                      Profile
                    </span>{" "}
                    button.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center">
            <div className="flex mt-10 p-2 text-black">
              <div className="border-2 border-black shadow-xl w-[1015px]">
                <div className="grid">
                  {userResponse && (
                    <>
                      <span className="ml-4 font-bold">All Users</span>
                      <AgGridAllUsers
                        rowDataAllUsers={rowDataAllUsers}
                        colDefsAllUsers={colDefsAllUsers}
                      />
                    </>
                  )}

                  <span className="justify-self-end mt-4 mb-4 mr-8">
                    Add a user by emulating an org or agency admin. Start by
                    clicking the{" "}
                    <span className="text-black rounded-lg py-0 px-1 bg-white font-semibold border-4 border-solid border-blue-500">
                      Profile
                    </span>{" "}
                    button.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-black mt-10 shadow-xl bg-white">
            <span className="text-black text-sm font-bold h-6 w-full bg-teal-50 grid">
              &nbsp;&nbsp;&nbsp;All orgs and their agencies
            </span>
            <AllChart />
          </div>

          <div>
            <br />
            &nbsp;
            <br />
          </div>
        </div>
      </div>

      <AddOrgModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        orgResponse={orgResponse}
        userResponse={userResponse}
      />
      <EditAgencyModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        agencyResponse={agencyResponse}
      />
      <EditOrgModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        orgResponse={orgResponse}
      />
      <EditUserModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        userResponse={userResponse}
      />
    </>
  )
}
