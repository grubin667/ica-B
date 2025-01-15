import React, { useCallback } from "react";

export default function FilteredResultsLinkRenderer(props) {

  const onClick = useCallback(() => {

    props.handleClickEvent(parseInt(props.node.id, 10))

  }, [props])

  return (
    <>
      <div
        className="text-blue-500 font-semibold hover:italic cursor-pointer"
        onClick={onClick}
      >
        +
      </div>
    </>
  )
}
