import React, { useCallback } from "react";

export default function UploadsPreUploadLinkRenderer(props) {

  const onClick = useCallback(() => {

    props.removeFile(
      props.node.rowIndex
    )

  }, [props])

return (
    <div
      className="text-blue-500 font-semibold hover:italic cursor-pointer"
      onClick={onClick}
    >
      Remove
    </div>
  )
}
