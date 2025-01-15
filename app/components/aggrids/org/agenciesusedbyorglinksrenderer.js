import React, { useCallback } from "react";

export default function AgenciesUsedByOrgLinksRenderer(props) {

  const onClickEAS = useCallback(() => {
    props.setOpenModal({
      modalId: 'edit-agency',
      idId: 'aid',
      idVal: props.data.id,
      modalHdr: `Edit Agency ${props.data["agency name"]}`
    })
  }, [props])

  const onClickESM = useCallback(() => {
    props.incrementCounterKey();
    props.setOpenModal({
      modalId: 'edit-models',
      idId: 'aid',
      idVal: props.data.id,
      modalHdr: `Edit Active Scoring Model for the ${props.data["org name"]} / ${props.data["agency name"]} Pair`
    })
  }, [props])

  return (
    <div className="flex gap-6">
      <div
        className="text-blue-500 font-semibold hover:italic cursor-pointer"
        onClick={onClickEAS}
      >
        Edit agency settings
      </div>
      <div
        className="text-blue-500 font-semibold hover:italic cursor-pointer"
        onClick={onClickESM}
      >
        Edit scoring model
      </div>
    </div>
  )
}