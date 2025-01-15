"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Modal, Table } from "flowbite-react";
import { Tabs } from "flowbite-react";
import useSWR from "swr";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DragAndDrop1 from "../common/doDragAndDrop1";
import { FaAngleRight, FaAngleLeft } from "react-icons/fa";
import { stringify } from "csv-stringify";
import * as XLSX from "xlsx";
import { format } from 'date-fns';

export default function EditModelsModalNew(props) {
  const role = props.role;
  const [orgId, setOrgId] = useState(role.orgId);
  const [agencyId, setAgencyId] = useState(
    props.openModal?.idId === "aid" ? props.openModal.idVal : ""
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // This dialog is used to create a new model for an existing org/agency pair.
  // read current active model using agencyId and orgId by adding agencyId and orgId to the url to call the models catch route handler.
  // We are calling the model's catch route handler because it returns the current active model for the org/agency pair.
  const {
    data: modelResponse,
    error: modelResponseError,
    isLoading: modelResponseIsLoading,
  } = useSWR(
    role.orgId.length > 0 &&
      props.openModal?.idId === "aid" &&
      props.openModal?.idVal.length > 0
      ? `/api/models?orgId=${role.orgId}&agencyId=${props.openModal.idVal}`
      : []
  );

  useEffect(() => {
    if (props.openModal?.modalId === "edit-models") {
      setOrgId(role.orgId);
      setAgencyId(props.openModal?.idVal);
    }
  }, [
    props.openModal?.idVal,
    props.openModal?.modalId,
    role.orgId,
    setAgencyId,
  ]);

  if (modelResponseError) {
    return <div>Data fetch error occurred</div>;
  }
  if (modelResponseIsLoading) {
    return <div>Loading</div>;
  }

  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined);
  };

  const handleDownloadBtnClick = (e) => {

    // create an empty workboox to hold pos, neg and req
    const workbook = XLSX.utils.book_new();

    const params = JSON.parse(modelResponse.models[0].params);
    // params is an object with 3 properties: positive, negative, and required.
    const pos = params.positive.words;
    // positive is an object with 2 props: weight (weighting of positive words taken together) and words (
    // array of all words in this, the positive, list);
    // words is an array of objects, each with properties: w (word), wt (weight), wc (count).
    const neg = params.negative.words;
    const req = params.required.words;

    // We're skipping *.weight and *.count columns. So pos, new and req are simply arrays of objects. Nothing else.

    // XLSX.utils contains various functions to convert data to a worksheet, choosing
    // the function that matching the type of data held in the object.

    const pos_sheet = XLSX.utils.json_to_sheet(pos);
    const neg_sheet = XLSX.utils.json_to_sheet(neg);
    const req_sheet = XLSX.utils.json_to_sheet(req);

    // use XLSX.utils.book_append_sheet to add each worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, pos_sheet, "positive");
    XLSX.utils.book_append_sheet(workbook, neg_sheet, "negative");
    XLSX.utils.book_append_sheet(workbook, req_sheet, "required");

    // TODO: customize header names; maybe cols
    // XLSX.utils.sheet_add_aoa(worksheet, [
    //   ["Product ID", "Product Name", "Product Category"],
    // ]);

    let dateStr = format(new Date(), "yyyy-MM-dd");

    // XLSX.writeFile saves workbook to downloads; not giving user a choice
    XLSX.writeFile(workbook, `scoring-model ${dateStr}.xlsx`, { compression: true });
  }

  const getCount = (word) => {
    return word.trim().split(/\s+/).length;
  }

  const val = (sheet) => {
    // sheet is of the form: [ { w: 'word', wt: 1, wc: 1 }, { w: 'two words', wt: 1.5, wc: 2}, { w: 'three words', wt: 2, wc: 3 }, ... ]
    let ret = "";
    // loop through all words in sheet
    // enforce these rules:
    // 1. w must be non-empty; if empty, reject sheet/workbook
    // 2. if wt is empty or 0, set = 1
    // 3. calc and set wc
    for (let i = 0; i < sheet.length; i++) {
      if (typeof sheet[i].w !== "string" || sheet[i].w.length === 0) {
        ret += `Word on row ${i + 2} is blank.\n`;
      }
      if (typeof sheet[i].wt !== "number" || sheet[i].wt.length === 0 || sheet[i].wt === 0) {
        sheet[i].wt = 1;
      }
      sheet[i].wc = getCount(sheet[i].w)
    }
    return ret;
  }

  const validateSheets = (pos, neg, req) => {
    let ret = "";
    ret = val(pos);
    if (ret.length) return ret;
    ret = val(neg);
    if (ret.length) return ret;
    ret = val(req);
    if (ret.length) return ret;
    return ret;
  }

  const updateName = (name) => {
    return name;
  }
  const updateDescription = (description) => {
    return description;
  }

  const handleUploadBtnClick = async (e) => {

    // (1) Using a file picker, have the user select an .xlsx file;
    //     read it in;
    //     extract its 3 sheets into pos, neg and req;
    //     validate user edits;
    //     abort with toast if any error.

    // File picker returns a Promise whose fulfillment handler receives an Array of FileSystemFileHandle objects for the file(s) selected by user.
    // We limit user to selecting 1 file by using option multiple: false.
    const pickerOpts = {
      types: [{
        description: 'Spreadsheets',
        accept: { 'application/vnd.ms-excel': ['.xlsx', '.xls', '.xlsb', /*...*/] }
      }],
      startIn: "downloads",
      excludeAcceptAllOption: true,
      multiple: false
    }
    const [hFile] = await window.showOpenFilePicker(pickerOpts);
    // If user cancels the picker without selecting a file, it will throw a DOMException. We catch at bottom.
    // Otherwise, it returns an Array of FileSystemFileHandle objects - an array of 1 item since we pass in multiple: false.

    // getFile returns a Promise whose fulfillment handler receives a File object.
    // Use arrayBuffer to read in the workbook.
    const ab = await (await hFile.getFile()).arrayBuffer();
    const wb = XLSX.read(ab); // got the workbook in wb

    // Extract the 3 sheets from the workbook
    const pos = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const neg = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]]);
    const req = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[2]]);

    // (2) Construct a new model object ('newModel') with updated versions of old model name and description and params built from pos, neg and req.
    try {

      // pos, neg and req are each of the form: [ { w: 'word', wt: 1, wc: 1 }, { w: 'two words', wt: 1.5, wc: 2}, { w: 'three words', wt: 2, wc: 3 }, ... ]

      // validate the user's edits.
      // recalculate wc for each word in pos, neg and req while validating.
      // abort with toast if any error.
      const valResult = validateSheets(pos, neg, req);
      if (valResult.length) {
        throw new Error(valResult);
      }

      const newModel = {
        name: updateName(modelResponse.models[0].name), // add date or something
        description: updateDescription(modelResponse.models[0].description), // ditto
        params: JSON.stringify({
          positive: {
            weight: 1,
            words: { ...pos }
          },
          negative: {
            weight: 1,
            words: { ...neg }
          },
          required: {
            weight: 1,
            words: { ...req }
          }
        })
      }

      // Set aside the id of the model being expired.
      const oldModelId = modelResponse.models[0].id;

      // (3) Add new model (newModel) to the DB.
      //     Call the POST endpoint in /api/models/route.js with body containing newModel to add the new model record to the DB.
      //     Get back its id; hold it in newModelId.
      let modelPOSTResponse = await fetch(`/api/models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newModel)
      })
      if (!modelPOSTResponse.ok) {
        throw new Error(`HTTP error reading old model: ${modelPOSTResponse.status}`);
      }
      const modelResponseJson = await modelPOSTResponse.json();
      const newModelId = modelResponseJson.data.model.id; // newModelId will be used when adding the junction record for it.

      // The latest model for this agency/org pair is now in the DB. It's id is newModelId.
      // We now have to do modelsonagenciesonorgs work. We'll do all 3 of these tasks in a single POST call.
      //   (1) Find and expire the junction record for the old model.
      //   (2) Construct a new junction record linking the new model, agency and org.
      //   (3) Post the new junction record to the DB.

      let junctionPOSTResponse = await fetch(`/api/modelsonagenciesonorgs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          oldModelId: oldModelId,
          newModelId: newModelId,
          orgId: role.orgId,
          agencyId: props.openModal.idVal
        })
      })
      if (!junctionPOSTResponse.ok) {
        throw new Error(`HTTP error! status: ${junctionPOSTResponse.status}`);
      }

      handleCloseModal();

    } catch (err) {
      if (err instanceof DOMException) {
        // assuming user cancelled - just close the dialog
        handleCloseModal();
      } else {
        // display other error to user
        toast.error(err.message);
      }
    }
  }

  return (
    <>
      <Modal
        // root={document.body}
        dismissible
        size={"6xl"}
        show={props?.openModal?.modalId === "edit-models"}
        onClose={handleCloseModal}
      >
        <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
        <Modal.Body className="text-black">

          <p class="mb-3 text-gray-700 dark:text-gray-400">
            Scoring Models contain the parameterrs for scoring calls.
            There is always exactly one active Scoring Model connecting an Org with each of its agencies.
          </p>
          <p class="mb-3 text-gray-700 dark:text-gray-400">
            To modify the current active model, replacing the current set of word lists with a new set of word lists:
          </p>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <p class="mb-3 text-gray-700 dark:text-gray-400 outline outline-offset-4 outline-1">
              Generate an Excel file containing the latest active model&apos;s word lists (use the Download button on the left). The .xlsx file will be downloaded to your computer.
            </p>
            <p class="mb-3 text-gray-700 dark:text-gray-400 outline outline-offset-4 outline-1">
              Following our formatting rules (contained in the Excel file itself for your reference), edit the downloaded file using Excel or an equivalent editor.
            </p>
            <p class="mb-3 text-gray-700 dark:text-gray-400 outline outline-offset-4 outline-1">
              Import the edited Excel file (use the Upload button on the right). As part of the import process, we will validate your changes; expire the former active model;
              add the new model to the database; and make it active.
              (We do keep all old Scoring Models in the database and can help you recover one if you need to.)
            </p>
          </div>
          <br />
          <div className="flex flex-wrap gap-2">
            <Button
              outline
              gradientMonochrome={"info"}
              onClick={(e) => {
                { handleDownloadBtnClick(e) }
              }}
            >Download Excel workbook so you can edit the word lists</Button>
            <Button
              outline
              gradientMonochrome={"info"}
              onClick={(e) => {
                { handleUploadBtnClick(e) }
              }}
            >Upload modified workbook, creating a new active model</Button>
          </div>
        </Modal.Body>
      </Modal>
      <ToastContainer autoClose={8000} />
    </>
  )
}
