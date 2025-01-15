import React, { useCallback } from "react";

export default function AllAgenciesLinkRenderer(props) {

  const onClick = useCallback(() => {

    props.setOpenModal({
      modalId: 'edit-agency',
      idId: 'aid',
      idVal: props.data.id,
      modalHdr: `Edit Agency ${props.data.name}`
    })

  }, [props])

return (
    <div
      className="text-blue-500 font-semibold hover:italic cursor-pointer"
      onClick={onClick}
    >
      Edit agency
    </div>
  )
}