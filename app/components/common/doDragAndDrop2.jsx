"use client";

import { useRef, useState, useEffect } from "react";
import { Button, Card, Radio, Label } from "flowbite-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { fileOpen, directoryOpen } from 'browser-fs-access';
import useDeepCompareEffect from 'use-deep-compare-effect';

const CHUNK_SIZE = 20

export default function DragAndDrop2(props) {

  // The DragAndDrop1 and 2 components are rendered in two places: (for 1) edit-models and (for 2) upload-call-recordings.
  // The two versions are quite similar, but do have some differences. props.options holds
  // configuration options, especially usage, which is "models" for (1) and "calls" for (2).
  // (1) supports only file browsing, while (2) supports browsing and drag/drop (no more!) for both files and directories.

  const options = { ...props.options }

  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const gridRef = useRef()
  const [files, setFiles] = useState([]);
  const [btnstate, setBtnstate] = useState(0)
  const [selectedMethod, setSelectedMethod] = useState("individual")

  const [rowDataUploadsPreUpload, setRowDataUploadsPreUpload] = useState([])
  const [colDefsUploadsPreUpload, setColDefsUploadsPreUpload] = useState([
    { field: "name", flex: 1 }, // width: 354 },
  ])

  // This useEffect reloads files into grid when files array changes.
  // Since it needs deep comparison, we're substituting useDeepCompareEffect (from Kent C. Dodds) for useEffect.
  useDeepCompareEffect(() => {

    setRowDataUploadsPreUpload([...files])
  }, [files, files.length])

  const doCallsValidate = () => {

    let ret = true

    if (files.length === 0) {
      ret = false
      toast("No files selected")
    } else {

      // check each file in files for audio mime type
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        if (!file.type.startsWith("audio")) {
          ret = false
          toast(`Non-audio file selected: ${file.name}`)
        }
      }
    }
    return ret
  }

  let accumErroredFilenames = [];
  let accumSavedFilenames = [];
  const toastId = useRef(null);
  const notify = () => toastId.current = toast(`Uploading chunk 1`, { autoClose: 9000 });
  const update = (chunkNum) => toast.update(toastId.current, {
    render: `Uploading chunk ${chunkNum + 1}`,
    autoClose: 5000
  });

  const doUpload = async (chunkNum, totNumChunks, chunk, finalChunkLen) => {

    if (chunkNum === 0) {

      // processing first chunk
      accumErroredFilenames = [];
      accumSavedFilenames = [];

      if (totNumChunks === 1) {
        toast(`Uploading audio files to the server in 1 chunk containing ${chunk.length} file${chunk.length === 1 ? "" : "s"}.`);
      } else {
        if (finalChunkLen === CHUNK_SIZE) {
          toast(`Uploading audio files to the server in ${totNumChunks} chunks of ${CHUNK_SIZE} files each.`);
        } else {
          toast(`Uploading audio files to the server in ${totNumChunks - 1} chunks of ${CHUNK_SIZE} files each followed by a final chunk with ${finalChunkLen} file${finalChunkLen === 1 ? "" : "s"}.`);
        }
      }
    }
    if (chunkNum === 0) {
      notify();
    } else {
      update(chunkNum);
    }

    const formData = new FormData();

    for (let i = 0; i < chunk.length; i++) {
      formData.append("file", chunk[i]);
    }

    // add usage to formData
    formData.append("usage", options.usage);

    // add orgId, orgName and agencyId to formData
    formData.append("orgId", options.orgId)
    formData.append("agencyId", options.agencyId)
    formData.append("orgName", options.orgName)

    // also add usage-specific info, if any, to formData.
    // if (options.usage === "calls") {
    //
    // } else if (options.usage === "models") {
    //
    // }

    // To summarize, in both usages formData contains usage ("calls" or "models"), some number of files,
    // and a few additional fields, mostly the same for each usage, like orgId and agencyId.
    const resp = await fetch("api/upload",
      {
        body: formData,
        method: "POST"
      }
    )
    if (resp.ok) {

      // reset btn to Validate
      setBtnstate(0)
      const result = await resp.json()
      // result contains: data: { erroredFilenames, savedFilenames }
      accumErroredFilenames = [...accumErroredFilenames, ...result.data.erroredFilenames];
      accumSavedFilenames = [...accumSavedFilenames, ...result.data.savedFilenames];

      if (chunkNum === totNumChunks - 1) {
        if (accumSavedFilenames.length > 0) {
          toast(`${accumSavedFilenames.length > 1 ? "A total of" : ""} ${accumSavedFilenames.length} file${accumSavedFilenames.length === 1 ? " was" : "s were"} saved to server. ${accumSavedFilenames.length === 1 ? "It" : "They"} will be processed immediately, and an Admin at ${options.orgName} will be notified.`, { autoClose: 12000 })
        }
        if (accumErroredFilenames.length > 0) {
          toast(`A total of ${accumErroredFilenames.length} file${accumErroredFilenames.length === 1 ? " was" : "s were"} couldn't be saved on server. ${accumErroredFilenames.length === 1 ? "Its filename" : "Their filenames"} will be left in the list.`)
        }

        // remove files that were saved
        const newFiles = files.filter(file => !accumSavedFilenames.includes(file.name))
        setFiles([...newFiles])
      }
    } else {
      toast(`File upload failed: ${JSON.stringify(resp)}`)
      console.log(resp)
    }
  }

  const handleButtonClick = async (e) => {
    if (btnstate === 0) {
      if (doCallsValidate()) {
        setBtnstate(1)
        toast("All files passed Validation. Press Upload Audio Files to continue")
      } else {
        toast("Correct error to continue")
      }
    } else if (btnstate === 1) {
      const chunks = [];
      const filesCopy = Array.from(files);
      while (filesCopy.length > 0) {
        chunks.push(filesCopy.splice(0, CHUNK_SIZE));
      }
      const finalChunkLen = chunks[chunks.length - 1].length;
      for (let i = 0; i < chunks.length; i++) {
        await doUpload(i, chunks.length, chunks[i], finalChunkLen);
      }
    }
  }

  // MARK: Pickers
  const openFileBrowser = async () => {
    const blobs = await fileOpen({
      description: "Audio files",
      mimeTypes: ['audio/*'],
      multiple: true,
      id: 'ica',
    });
    // Add new files to files. This will trigger useEffect that calls setRowDataUploadsPreUpload
    // to update grid's rowData. 
    setFiles((prevState) => [...prevState, ...blobs])
    setBtnstate(0)
  }

  const openDirectoryBrowser = async () => {
    const blobsInDirectory = await directoryOpen({
      recursive: true,
      id: 'ica',
    });
    // same comment as above
    setFiles((prevState) => [...prevState, ...blobsInDirectory])
    setBtnstate(0)
  }

  const methodSelected = (e) => {
    setSelectedMethod(e.target.value);
  }

  // MARK: Render
  return (
    <>
      <p className="text-black font-normal mb-2">{options.intro}</p>
      <div className="flex flex-row items-center">

        <div className="py-2 container mx-auto ring-1 ring-black ring-offset-0 bg-teal-200 text-sm rounded">

          <div className="py-2 container mx-auto text-black font-bold ring-1 ring-black ring-offset-0 flex justify-between">
            <fieldset className="inline-block">
              <span className="mb-4 inline">Choose file selection method:</span>
              <div className="items-center inline ml-4">
                <Radio className="mb-1" id="individual" name="selmethod" value="individual" defaultChecked onChange={methodSelected} />
                <Label className="ml-1" htmlFor="individual">Individual files</Label>
              </div>
              <div className="items-center inline ml-3">
                <Radio className="mb-1" id="directory" name="selmethod" value="directory" onChange={methodSelected} />
                <Label className="ml-1" htmlFor="directory">By directory (recursively)</Label>
              </div>
            </fieldset>
            <Label
              className="underline cursor-pointer text-cyan-700 hover:italic"
              onClick={() => {
                if (selectedMethod === "individual") {
                  openFileBrowser();
                } else if (selectedMethod === "directory") {
                  openDirectoryBrowser();
                }
              }}
            >Browse files using selected method</Label>
          </div>

          <div className="mt-2">
            <div>
              <span className="text-black font-bold">So far, you have selected these audio files:</span>
            </div>
            {files.length >= 0 &&
              <>
                <div className="grid grid-cols-2 justify-items-center mt-2">
                  <div>
                    <div className="ag-theme-quartz" style={{ height: '140px', width: '540px' }}>
                      <AgGridReact
                        ref={gridRef}
                        rowData={rowDataUploadsPreUpload}
                        columnDefs={colDefsUploadsPreUpload}
                        rowSelection={"multiple"}
                        headerHeight={21}
                        rowHeight={18}
                      />
                    </div>
                    <Button
                      className="w-[540px] h-6"
                      disabled={files.length === 0}
                      onClick={_ => {
                        // remove selected files from files array, causing useEffect to recreate rowDataUploadsPreUpload
                        // which will update the rows in the grid, too.
                        const forDeletion = gridRef.current.api.getSelectedRows()
                        if (forDeletion.length > 0) {
                          const newFiles = files.filter((file) => {
                            return !forDeletion.includes(file)
                          })
                          setFiles([...newFiles])
                        }
                      }}
                    >
                      To remove files: (multi-)select and click here; or close dialog and restart.
                    </Button>
                  </div>
                  <Button
                    className="h-fit w-fit outline rounded flex justify-center items-center mt-16"
                    disabled={files.length === 0}
                    onClick={handleButtonClick}
                  >
                    {options.btntext[btnstate] + ` (${files.length} files)`}
                  </Button>
                </div>
              </>}
          </div>
        </div>

      </div>
      <p className="text-black font-normal mt-2">{options.instructions}</p>
    </>
  )
}
