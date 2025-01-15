"use client"

import { useRef } from "react"
import { Modal } from "flowbite-react"
import useSWR from "swr"
import Transcription from "../transcription"

// See complete docs for what's going on here in /READMEs/PLAYING AUDIOS.md.

export default function ResultsModal(props) {
  const audioRef = useRef()
  const mimeRef = useRef()

  const handleCloseResultsModal = () => {
    props.setOpenModalLvl2(undefined)
  }

  const getMimeTypeFor = filename => {
    return "audio/mpeg"
  }

  const shouldFetch = props?.openModalLvl2?.idVal?.length > 0
  const { data: thisResult, error, isLoading } = useSWR(
    shouldFetch ? `/api/results/${props?.openModalLvl2?.idVal}` : null
  )

  if (error) return <div>Error loading data</div>
  if (isLoading) return <div>loading...</div>

  // We have the results row in thisResult. There are 3 possible outcomes:
  //     1. thisResult.onDisk === false: show a message instead of the audio player
  //     2. use thisResult.diskFilename to fetch the audio file;
  //     3. fetching the audio file fails

  // if (thisResult?.onDisk) {

  audioRef.current = `/api/audio/${thisResult?.id}`
  mimeRef.current = getMimeTypeFor(thisResult?.filename)
  // }

  return (
    <>
      <Modal
        // root={document.body}
        dismissible
        size={"6xl"}
        show={props?.openModalLvl2?.modalId === "work-result"}
        onClose={handleCloseResultsModal}
      >
        <Modal.Header>{props?.openModalLvl2?.modalHdr}</Modal.Header>
        <Modal.Body className="text-black">
          <div className="grid grid-cols-2 divide-x h-fit">
            <Transcription result={thisResult} />
            <div className="grid grid-cols-1 gap-2">
              <span>{audioRef.current}</span>
              {/* {audioRef.current.length > 10 &&
              <audio controls>
                <source src={audioRef.current} type={mimeRef.current} />
              </audio>
            } */}
              {audioRef.current.length < 10 && (
                <p className="text-black">
                  The audio file is no longer accessible on our server. It has
                  been removed for security purposes.
                </p>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer></Modal.Footer>
      </Modal>
    </>
  )
}
