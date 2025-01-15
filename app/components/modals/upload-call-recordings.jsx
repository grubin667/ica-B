"use client"

import { useState, useEffect } from "react"
import { Button, Modal } from "flowbite-react"
import DragAndDrop2 from "../common/doDragAndDrop2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UploadCallRecordingsModal(props) {
  // Opened by agencycommon.
  // props composition:
  // {
  //    openModal,          object consisting of {modalId, idId, idVal, modalHdr}
  //    setOpenModal,       method used to close dialog by props.setOpenModal(undefined)
  // }

  // const [name, setName] = useState("")
  const role = props.role;
  const agencyId = role.agencyId;
  // const agencyName = role.openModal?.agencyName;
  const orgId = props.openModal?.idVal;
  const orgName = props.openModal?.orgName;

  //////////////////////////////////////////////////////////////////////////////////////
  // CLOSE MODAL
  //////////////////////////////////////////////////////////////////////////////////////
  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined)
  }

  return (
    <>
      {/* UPLOAD CALL RECORDINGS */}
      <Modal
        // root={document.body}
        dismissible
        size={"7xl"}
        show={props?.openModal?.modalId === "upload-call-recordings"}
        onClose={handleCloseModal}
      >
        <Modal.Header>
          {props?.openModal?.modalHdr}
        </Modal.Header>
        <Modal.Body>

          <DragAndDrop2
            options={
              {
                usage: "calls",
                intro: "Set the selection method and click the Browse link to open a File Explorer (in Windows) or a Finder (in Mac) and locate your audio files. Once they've been selected, click the Validate button to check them out. If everything's OK, the button will change to say Upload Audio Files. Click it. You're done!",
                instructions: "Select any number of audio recording files. If you select a directory, we will process it recursively, collecting all the audio files in it and in its contained subdirectories.",
                btntext: ["Validate", "Upload audio files"],
                orgId,
                agencyId,
                orgName,
                // agencyName,
              }
            }
          />

        </Modal.Body>
        <Modal.Footer>
          <Button outline gradientMonochrome="info" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer autoClose={6000} />
    </>
  )
}
