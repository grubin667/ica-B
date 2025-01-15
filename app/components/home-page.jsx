"use client"

import { useContext } from "react"
import { UserContext } from "../context/UserContext"
import { useSession } from "next-auth/react"
import EnterEmail from "./enteremail"
import SuperAdmin from "./superadmin"
import OrgAdmin from "./orgadmin"
import OrgNonAdmin from "./orgnonadmin"
import AgencyAdmin from "./agencyadmin"
import AgencyNonAdmin from "./agencynonadmin"
import { useUser } from "../hooks/useUser"

// On entry to the site, we run layout.tsx, page.tsx and home-page.tsx. home-page uses some session-checking trickery
// to figure out if the user (a) last left the site without signing out, e.g., just closed the browser
// or (b) has no session cookie and isn't known to us yet. Case (b) can happen 3 ways: (1) user left by
// clicking the Sign Out button in the header; (2) the user is new or is using a browser that's new to him; or (3) the
// user's session timed out. The 3 ways are all the same to us here.
//
// In case (a) the user is taken to his "native home page" (superadmin, orgadmin, orgnonadmin, agencyadmin or
// agencynonadmin). In case (b) we take the user to enteremail.tsx. See enteremail.tsx for discussion there.

export default function HomePage() {
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

  if (status !== "authenticated" || !user || Object.keys(user).length === 0) {
    return <EnterEmail />
  }

  if (isLoading) {
    // this likely never happens anymore
    return <p>Loading</p>
  }

  const roleIsEmulated = false

  // An ordered list of role checks.
  if (role.admin && !role.orgId && !role.agencyId) {
    return <SuperAdmin />
  }
  if (role.orgId) {
    if (role.admin) {
      return (
        <OrgAdmin role={role} user={user} roleIsEmulated={roleIsEmulated} />
      )
    } else {
      return (
        <OrgNonAdmin role={role} user={user} roleIsEmulated={roleIsEmulated} />
      )
    }
  }
  if (role.agencyId) {
    if (role.admin) {
      return (
        <AgencyAdmin role={role} user={user} roleIsEmulated={roleIsEmulated} />
      )
    } else {
      return (
        <AgencyNonAdmin
          role={role}
          user={user}
          roleIsEmulated={roleIsEmulated}
        />
      )
    }
  }

  return <></>
}
