import React, { useCallback } from "react";

export default function AllUsersLinkRenderer(props) {

  const onClick = useCallback(() => {

    props.setOpenModal({
      modalId: 'edit-user',
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