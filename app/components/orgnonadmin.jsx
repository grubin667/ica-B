"use client"

import AllCompsCommon from "./allcompscommon"
import OrgCommon from "./orgcommon"

// Called with props.role = {admin:false, orgId:orgId}.
// Renders OrgCommon to render table of agencies used by this org containing 3 links
// per agency row and, since it's not rendered from OrgAdmin, no Add Agency button.
export default function OrgNonAdmin({ role, user, roleIsEmulated }) {
  return (
    <>
      <div className="flex flex-col">
        <AllCompsCommon />
        <div className="mt-8 text-black h-full flex flex-col items-center">
          <OrgCommon role={role} user={user} roleIsEmulated={roleIsEmulated} />
        </div>
      </div>
    </>
  )
}
