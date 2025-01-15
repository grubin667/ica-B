import React, { useCallback } from "react";

export default function AllUsersInAgencyLinkRenderer(props) {

  const onClick = useCallback(() => {

    props.setOpenModal({
      modalId: 'edit-user-agency',
      idId: 'uid',
      idVal: props.data.id,
      modalHdr: `Edit User ${props.data.name}`,
      // agencyId: props.data.agencyId,
      // agencyName: props.data.agencyName
    })

  }, [props])

return (
    <div
      className="text-blue-500 font-semibold hover:italic cursor-pointer"
      onClick={onClick}
    >
      Edit user
    </div>
  )
}