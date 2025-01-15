import React, { useCallback } from "react";

export default function OrgsUsingAgencyLinkRenderer(props) {

  const onClick = useCallback(() => {

    props.setOpenModal({
      modalId: 'upload-call-recordings',
      idId: 'oid',
      idVal: props.data.id,
      modalHdr: `Upload call recordings for ${props.data["org name"]}`,
      orgName: props.data["org name"],
      // agencyId: props.data.agencyId,
      // agencyName: props.data.agencyName
    })

  }, [props])

  return (
    <div
      className="text-blue-500 font-semibold hover:italic cursor-pointer"
      onClick={onClick}
    >
      Upload call recordings
    </div>
  )
}
