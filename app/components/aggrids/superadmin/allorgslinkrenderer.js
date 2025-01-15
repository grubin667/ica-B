import React, { useCallback } from "react";

export default function AllOrgsLinkRenderer(props) {

  const onClick = useCallback(() => {

      props.setOpenModal({
        modalId: 'edit-org',
        idId: 'oid',
        idVal: props.data.id,
        modalHdr: `Edit Org ${props.data.name}`
      })

    }, [props])

  return (
    <div
      className="text-blue-500 font-semibold hover:italic cursor-pointer"
      onClick={onClick}
    >
      Edit org
    </div>
  )
}