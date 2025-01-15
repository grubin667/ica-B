"use client"

import { useRef, useState } from "react"
import { Button } from "flowbite-react"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function DragAndDrop1(props) {

  // The DragAndDrop1 component is rendered by edit-models. It used to support file drag and drop, but no longer.
  // A different version is called DragAndDrop2. It is used to select audio files for trnascription and scoring.
  // DragAndDrop2 doesn't do drag and drop either, but it may again.

  const options = { ...props.options }
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [btnstate, setBtnstate] = useState(0)
  const [xmitFiles, setXmitFiles] = useState([])

  function handleChange(e) {
    // This method is called when a user opens a file explorer by clicking our Browse Files button,
    // selects one or more files and clicks Open (or OK or Save, etc.).
    // The user can select only files, not directories. The
    // files aren't forced to the type we specified in the <input>, so validation will be needed.
    // When completed, files will hold an array of File objects.

    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      for (let i = 0; i < e.target.files["length"]; i++) {
        setFiles(prevState => [...prevState, e.target.files[i]])
      }
      // set btnState so click handler will validate
      setBtnstate(0)
    }
  }

  const validateCsvFiles = async () => {
    let ret = true

    // files array cannot be empty
    if (files.length === 0) {
      ret = false
      toast("No files selected")
    } else {
      // check each file in files for .csv
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        if (file.type !== "text/csv") {
          ret = false
          toast("Non-csv file selected")
        }
      }

      // at most 1 each of the 3 prefixes and none of any other prefix
      const founds = [false, false, false] // pos, neg, req
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        let prefix = file.name.substring(0, 3)
        const which = ["pos", "neg", "req"].indexOf(prefix)
        if (which === -1) {
          ret = false
          toast(
            "Selected files must be 'positive.csv', 'negative.csv' or 'required.csv'"
          )
        } else {
          if (founds[which] === true) {
            ret = false
            toast("You selected 2 of the same type")
          } else {
            founds[which] = true
          }
        }
      }

      // Additional tests required:
      // - correct internal format
      //more?

      const xmit = {pos: "", neg: "", req: ""};
      for (let i = 0; i < files.length; i++) {
        const content = await files[i].text();
        if (files[i].name.startsWith("pos")) {
          xmit.pos = content
        } else if (files[i].name.startsWith("neg")) {
          xmit.neg = content
        } else if (files[i].name.startsWith("req")) {
          xmit.req = content
        }
      }
      console.log(`xmit: ${JSON.stringify(xmit)}`)
      setXmitFiles(xmit)
    }
    return ret
  }

  const doUpload = async () => {
    
    const formData = new FormData()

    // add each file being sent to upload endpoint to formData

    // Question: .csv files are text, not binary. They're all we deal with here.
    // Why don't we read them here and send them as an array of strings?
    // for (let i = 0; i < files.length; i++) {
    //   formData.append("file", files[i])
    // }

    // Note: the items that can be appended to a FormData are Blob, File and string.
    // That's it. No other types (such as JavaScript objects) are allowed.
    // So I'm going to append 3 items: posFile, negFile and reqFile. Each is a string
    // containing file content or an empty string.
    formData.append("posFile", xmitFiles.pos);
    formData.append("negFile", xmitFiles.neg);
    formData.append("reqFile", xmitFiles.req);

    // add usage to endpoint
    formData.append("usage", options.usage)

    // add orgId and agencyId to formData
    formData.append("orgId", options.orgId)
    formData.append("agencyId", options.agencyId)

    // and model settings
    formData.append("name", options.name)
    formData.append("description", options.description)
    formData.append("posWeighting", options.posWeighting)
    formData.append("negWeighting", options.negWeighting)
    formData.append("reqWeighting", options.reqWeighting)

    // The  models case of the upload endpoint:
    // - parses fields out of formData
    // - builds editedContents and fullResult
    // - sends fullResult to /api/models (PATCH) to create new model, etc.
    const resp = await fetch("api/upload", {
      body: formData,
      method: "POST"
    })
    if (resp.ok) {
      // upload endpoint returns fullResult so we can send it to /api/models (PATCH)
      const respVal = await resp.json()
      // const resp2 = await fetch("api/models", {
      //   method: "PATCH",
      //   body: JSON.stringify(
      //     options.orgId,
      //     options.agencyId,
      //     respVal.fullResult
      //   )
      // })
      // if (resp2.ok) {
      toast("A new Scoring Model was created")
      options.setOpenModal(undefined)
      // } else {
      // }
    } else {
      // upload failed
    }
  }

  const handleButtonClick = e => {
    if (options.usage === "models") {
      if (btnstate === 0) {
        if (validateCsvFiles()) {
          setBtnstate(1)
        } else {
          toast("Correct error to continue")
        }
      } else if (btnstate === 1) {
        doUpload()
      }
    }
  }

  function removeFile(fileName, idx) {
    const newArr = [...files]
    newArr.splice(idx, 1)
    setFiles([])
    setFiles(newArr)
  }

  // Browse Files link click handler
  function openFileExplorer() {
    inputRef.current.value = ""
    inputRef.current.click()
  }

  // MARK: Render
  return (
    <div className="flex items-center justify-center m-8 rounded">
      <form
        className={`${dragActive
            ? "bg-yellow-100 outline-red-600"
            : "bg-teal-100 outline-black"
          }  p-4 rounded-lg  min-h-[10rem] text-center flex flex-col items-center justify-center static outline outline-2 max-w-lg`}
        onSubmit={e => e.preventDefault()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
          textRendering="geometricPrecision"
          imageRendering="optimizeQuality"
          fillRule="evenodd"
          clipRule="evenodd"
          viewBox="0 0 600 550"
          width="100"
          height="50"
        >
          <path
            fillRule="nonzero"
            d="M377.763 115.7c-9.42 2.733-18.532 6.86-27.591 12.155-9.256 5.41-18.373 12.031-27.649 19.629l-19.849-22.742c16.721-15.527 33.187-26.464 49.108-33.514-13.06-22.39-31.538-38.532-52.418-48.549-21.339-10.238-45.242-14.171-68.507-11.922-23.123 2.234-45.56 10.619-64.123 25.025-21.451 16.646-37.775 41.521-44.034 74.469l-1.959 10.309-10.27 1.801c-27.993 4.909-49.283 18.793-62.859 36.776-7.186 9.518-12.228 20.161-14.969 31.19-2.728 10.979-3.193 22.399-1.243 33.525 3.291 18.766 13.592 36.737 31.669 50.382 5.467 4.128 11.376 7.709 17.886 10.48 6.215 2.647 13.017 4.612 20.558 5.686h78.258v30.246h-78.827l-1.891-.178c-11.099-1.413-20.982-4.186-29.914-7.99-8.994-3.829-16.989-8.65-24.264-14.142C20.256 299.753 6.183 275.02 1.628 249.05c-2.669-15.225-2.027-30.868 1.715-45.929 3.73-15.012 10.524-29.404 20.167-42.177 16.233-21.507 40.501-38.514 71.737-46.241 9.014-35.904 28.299-63.573 53.057-82.786C171.438 13.963 199.327 3.521 228.021.748c28.551-2.76 57.975 2.11 84.339 14.758 28.095 13.479 52.661 35.696 68.986 66.815 13.827-2.201 27.042-1.521 39.42 1.5 18.862 4.603 35.493 14.611 49.212 28.159 13.36 13.193 23.994 29.797 31.216 48.001 16.814 42.377 15.209 93.978-13.361 131.996-9.299 12.37-21.252 22.45-35.572 30.468-13.811 7.735-29.884 13.593-47.949 17.787l-3.368.414h-66.346V310.4h64.727c14.501-3.496 27.297-8.212 38.168-14.299 10.794-6.045 19.62-13.396 26.238-22.2 21.842-29.066 22.745-69.34 9.463-102.815-5.698-14.359-13.999-27.371-24.363-37.605-10.007-9.882-21.906-17.126-35.154-20.36-6.654-1.625-13.721-2.248-21.145-1.705l-14.769 4.284zM205.205 265.348c-5.288 6.391-14.756 7.285-21.148 1.997-6.391-5.288-7.285-14.757-1.997-21.148l59.645-72.019c5.288-6.392 14.757-7.285 21.148-1.998a15.053 15.053 0 012.707 2.921l60.072 72.279c5.287 6.359 4.42 15.802-1.939 21.09-6.359 5.287-15.801 4.42-21.089-1.939l-34.288-41.256.202 146.628c0 8.273-6.707 14.98-14.98 14.98-8.274 0-14.981-6.707-14.981-14.98l-.202-146.582-33.15 40.027z"
          />
        </svg>

        <input
          placeholder="fileInput"
          className="hidden"
          ref={inputRef}
          type="file"
          multiple={true}
          onChange={handleChange}
          // Remember: user can actually choose anything so we have to check.
          accept={".csv"}
        />
        <p className="text-blue-900">{options.instructions}</p>
        <span className="text-blue-900">-----------------------</span>
        <span
          className="font-bold text-blue-600 cursor-pointer"
          onClick={openFileExplorer}
        >
          <u>Browse files</u>
        </span>

        <div className="flex flex-col items-center p-3">
          {files.map((file, idx) => (
            <div key={idx} className="flex flex-row space-x-5">
              <span>{file.name}</span>
              <span
                className="text-red-500 cursor-pointer"
                onClick={() => removeFile(file.name, idx)}
              >
                remove
              </span>
            </div>
          ))}
        </div>

        <Button
          outline
          gradientMonochrome="info"
          disabled={files.length === 0}
          onClick={handleButtonClick}
        >
          {options.btntext[btnstate]}
        </Button>
      </form>
    </div>
  )
}
