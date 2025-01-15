import React, { useCallback } from "react";

export default function AllUsersInOrgLinkRenderer(props) {

  const onClick = useCallback(() => {

    props.setOpenModal({
      modalId: 'edit-user-org',
      idId: 'uid',
      idVal: props.data.id,
      modalHdr: `Edit User ${props.data.name}`
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