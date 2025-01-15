"use client"

import AllCompsCommon from "./allcompscommon"
import AgencyCommon from "./agencycommon"

// Called with props.role = {admin:false, agencyId:agencyId}.
// Renders AgencyCommon to render table of orgs using by this agency (which has no
// per row links or a button to add anything).
export default function AgencyNonAdmin({ role, user, roleIsEmulated }) {
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
        </div>
      </div>
    </>
  )
}
