"use client"
import { useState, useRef, useContext } from "react"
import { UserContext } from "../../context/UserContext"
import { useSession } from "next-auth/react"
import { Button, Modal } from "flowbite-react"

import { useUser } from "../../hooks/useUser"

export default function TestingModal(props) {

  // const initialRoleName = "Select..."

  // const { state: userState, update: updateUserState } = useContext(UserContext)
  // const { data: session, status } = useSession()
  // let userId = session?.user?.id
  // const {
  //   user,
  //   mutate,
  //   role: nativeRole,
  //   ec: availableRoles,
  //   isLoading,
  //   error
  // } = useUser(userId)
  // const emulatedRole = userState.emulatedRole
  // const role =
  //   emulatedRole && Object.keys(emulatedRole).length > 0
  //     ? emulatedRole
  //     : nativeRole

  return (
    <>
      {/* Modal testing-modal */}
      <Modal
        // root={document.body}
        dismissible
        size={"xxlg"}
        show={props?.openModal?.modalId === "testing-modal"}
        onClose={() => props.setOpenModal(undefined)}
      >
        <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
        <Modal.Body  className="text-black">
          <>
            {Object.keys(props).map((key, index) => <div key={index} value={key}>
              {`${key}=`}
              {JSON.stringify(props[key])}
            </div>)}
          </>
        </Modal.Body>
        <Modal.Footer>
          <Button
            outline
            gradientMonochrome="info"
            onClick={() => props.setOpenModal(undefined)}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
