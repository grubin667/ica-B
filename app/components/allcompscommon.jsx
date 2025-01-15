"use client"

import { useContext } from "react"
import { UserContext } from "../context/UserContext"
import { useUser } from "../hooks/useUser"
import { useSession } from "next-auth/react"
import useSWR from "swr"

// AllCompsCommon serves 2 purposes:
// 1. It renders the title line for agencynonadmin, agencyadmin, orgadmin, orgnonadmin and superadmin.
// 2. Don't know yet....

export default function AllCompsCommon() {
  const { state: userState, update: updateUserState } = useContext(UserContext)
  const { data: session, status } = useSession()
  let userId = session?.user?.id
  let {
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

  // adata and odata are used to fetch agency and org names for building roles descriptions
  const {
    data: adata,
    error: adataError,
    isLoading: adataIsLoading
  } = useSWR(`/api/agencies`)
  const {
    data: odata,
    error: odataError,
    isLoading: odataIsLoading
  } = useSWR(`/api/orgs`)

  if (adataError || odataError) {
    return <div>Error loading data</div>
  }
  if (adataIsLoading || odataIsLoading) {
    return <div>loading...</div>
  }
  // if (typeof adata === 'undefined' || typeof adata === 'undefined') {
  //   return (<div>loading...</div>)
  // }

  const getOrgName = id => {
    for (let i = 0; i < odata?.orgs.length; i++) {
      if (odata.orgs[i].id === id) {
        return odata.orgs[i].name
      }
    }
    return `Org-${id}` // shouldn't happen
  }
  const getAgencyName = id => {
    for (let i = 0; i < adata?.agencies.length; i++) {
      if (adata.agencies[i].id === id) {
        return adata.agencies[i].name
      }
    }
    return `Agency-${id}` // shouldn't happen
  }

  const getRoleDescFromRole = (uroleAdmin, uroleOrgId, uroleAgencyId) => {
    // Build a description of urole. Do it in order and return when have result.
    // Everyone, at this point, is a super admin or is connected to an org or an agency.

    if (uroleAdmin && !uroleOrgId && !uroleAgencyId) {
      return "Super Admin"
    }
    if (uroleAdmin && uroleOrgId && !uroleAgencyId) {
      return `Admin of Org ${getOrgName(uroleOrgId)}`
    }
    if (uroleAdmin && !uroleOrgId && uroleAgencyId) {
      return `Admin of Agency ${getAgencyName(uroleAgencyId)}`
    }
    if (!uroleAdmin && uroleOrgId && !uroleAgencyId) {
      return `Member of Org ${getOrgName(uroleOrgId)}`
    }
    if (!uroleAdmin && !uroleOrgId && uroleAgencyId) {
      return `Member of Agency ${getAgencyName(uroleAgencyId)}`
    }
    return `You do not have a Role yet.`
  }

  // If emulatedRole exists, it takes pecendent over role, although both are displayed.
  if (emulatedRole && Object.keys(emulatedRole).length) {
    return (
      <div className="mt-8 text-black h-full flex justify-around">
        <div className="text-2xl font-semibold font-mono">
          {`Emulated Role: ${getRoleDescFromRole(
            emulatedRole?.admin,
            emulatedRole?.orgId,
            emulatedRole?.agencyId
          )}`}
        </div>
        <div className="flex">
          <div className="ml-8 pt-1">You are signed in as {user.email}</div>
          <div className="text-xl ml-4 font-medium font-mono">
            {`[Your Native Role: ${getRoleDescFromRole(
              nativeRole?.admin,
              nativeRole?.orgId,
              nativeRole?.agencyId
            )}]`}
          </div>
        </div>
      </div>
    )
  }

  // No emulatedRole exists for this user.
  return (
    <div className="mt-8 text-black h-full flex justify-around">
      <div className="text-2xl font-semibold font-mono">
        {`Your Role: ${getRoleDescFromRole(
          nativeRole?.admin,
          nativeRole?.orgId,
          nativeRole?.agencyId
        )}`}
      </div>
      <div className="ml-8">You are signed in as {user.email}</div>
    </div>
  )
}
