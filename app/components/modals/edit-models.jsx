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

export default function EditModelsModal(props) {
  const role = props.role;
  const [orgId, setOrgId] = useState(role.orgId);
  const [agencyId, setAgencyId] = useState(
    props.openModal?.idId === "aid" ? props.openModal.idVal : ""
  );
  const [poscb, setPoscb] = useState(false);
  const [negcb, setNegcb] = useState(false);
  const [reqcb, setReqcb] = useState(false);

  const tabsRef = useRef(1);
  const activeTabRef = useRef(1);
  const setActiveTab = (index) => {
    activeTabRef.current = index;
    // tabsRef.current.children[index].click()
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [posWeighting, setPosWeighting] = useState(0);
  const [negWeighting, setNegWeighting] = useState(0);
  const [reqWeighting, setReqWeighting] = useState(0);

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

  //#region Upload
  //////////////////////////////////////////////////////////////////////////////////////////////
  // These methods service Uploading, validating and storing a new Model into the DB.
  // There are no methods here! It's all done in /api/upload POST which calls /api/models PATCH.
  //
  // Here's what gets done and where:
  // - edit-models.jsx is used for collecting and validating .csv files. This is done, for the most
  //   part in doDragDrop1.tsx (which at this time doesn't support drag and drop--the name is held over).
  //   edit-models calls POST at the endpoint /api/upload/route.ts passing a FormData holding keys
  //   usage, orgId, agencyId and files[].
  //
  // - /api/upload/route.js extracts usage, orgId, agencyId and some files. This endpoint supports
  //   2 usages, "models" and "calls". We're describing only "models" here, "calls" being used for uploading
  //   recorded call audio files from .... /api/upload validates its parameters (a bit) and loads the actual
  //   file content into memory using const buffer = Buffer.from(await file.arrayBuffer()); for
  //   each file in files[]. It then produces fullResult.
  //////////////////////////////////////////////////////////////////////////////////////////////

  //#region Download
  //////////////////////////////////////////////////////////////////////////////////////////////
  // These methods service Downloading for editing (or just for looking).
  // We use npm pkg "csv" for all conversions between csv and JSON. See CSV.md.
  //////////////////////////////////////////////////////////////////////////////////////////////
  // const jsonToCsv = (items) => {
  //   // const header = Object.keys(items[0]);
  //   const headerString = "word,weighting";
  //   const rowItems = items.map((row) => {
  //     let word = row.w;
  //     let weighting = row.wt;
  //     let ret = `\"${word}\",${weighting}`;
  //     return ret;
  //   })
  //   // join header and body, and break into separate lines
  //   const csv = [headerString, ...rowItems].join('\r\n');
  //   return csv;
  // }

  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined);
  };

  const doSet = (modelParams, which) => {
    // The signature is stringify(records, [options], callback).
    // The callback example receives an array and a callback function.
    // The input is serialised into a string unless an error occurred.
    stringify(
      modelParams[which].words,
      {
        header: true,
        columns: [
          { key: "w", header: "word" },
          { key: "wt", header: "weighting" },
          // { key: "wc", header: "count" } count is no longer included; it is calculated on re-import
        ],
        quoted_string: true,
      },
      (err, csv) => {
        if (err) {
          console.error(err);
          return;
        }

        // csv is a string with each line ending in \n (line feed). Example:
        // "word","weighting"\n
        // "and",12\n
        // "discrete",2\n
        //      ...

        // TODO check what happens with embedded quotes, commas, LF, NL, etc.

        console.log(csv);

        const blob = new Blob([csv]);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob, { type: "text/plain" });
        a.download = `${which}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    );
  };

  const handleSubmitExportModel = async (e) => {
    e.preventDefault();

    const modelParams = JSON.parse(modelResponse.models[0].params);
    if (poscb) {
      doSet(modelParams, "positive");
    }
    if (negcb) {
      doSet(modelParams, "negative");
    }
    if (reqcb) {
      doSet(modelParams, "required");
    }

    toast(`Done...your file(s) are in your default Downloads directory.`);
    handleCloseModal();
  };

  const setUpSublistWeightings = () => {
    // extract name and description from model so user can edit
    setName(modelResponse.models[0].name);
    setDescription(modelResponse.models[0].description);

    // extract 3 weighting factors from modelParams so they can be changed if user wants.
    const modelParams = JSON.parse(modelResponse.models[0].params);
    setPosWeighting(modelParams.positive.weight);
    setNegWeighting(modelParams.negative.weight);
    setReqWeighting(modelParams.required.weight);
  };

  // MARK: Render
  return (
    <>
      {/* MANAGE MODELS */}
      <Modal
        // root={document.body}
        dismissible
        size={"6xl"}
        show={props?.openModal?.modalId === "edit-models"}
        onClose={handleCloseModal}
      >
        <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
        <Modal.Body className="text-black">
          <Tabs.Group
            aria-label="Tabs"
            style="underline"
            ref={tabsRef}
            onActiveTabChange={(tab) => {
              setActiveTab(tab);
              // if (tab === 2 || tab === 3) {
              //   setUpSublistWeightings();
              // }
            }}
          >
            {/* Tab 0 - EXPLANATION */}
            <Tabs.Item title="EXPLANATION">
              <div className="container overflow-y-auto h-64 mx-auto bg-teal-200 text-sm ring-1 ring-black ring-offset-0 rounded">
                <p className="mb-4">
                  A scoring model provides a consistent way to measure agents&apos;
                  compliance with rules handed down from your org to the agencies
                  making calls on your behalf. Put simply, it counts up how many times an agent
                  has used certain words in specific calls.
                  <br />
                  <br />
                  Each scoring model contains three lists of words or
                  phrases: those you encourage agents to use
                  (&quot;positive&quot;); words best never used
                  (&quot;negative&quot;); and words you very much want agents to
                  try and include in every call (&quot;required&quot;).
                  <br />
                  <br />
                  Each word or phrase has a <i>weighting factor</i> (1 by
                  default). For example, a single occurrence of a word with a
                  weighting factor of 2 will count twice as much as a word with
                  a weight of 1, assuming they both occur the same number of
                  times. We calculate an average weighted score for each sublist
                  by adding up each weighted score and dividing by the number of
                  words in the sublist.
                  <br />
                  <br />
                  To calculate a single overall score for a call, we combine the
                  three sublists&apos; scores using sublist-specific weighting
                  factors.
                </p>
                <p className="mb-4">
                  Agencies, both internal and external, make various types of
                  calls (appointment confirmation, information, collections,
                  etc.) on behalf of the orgs for whom they work. Scoring models
                  exist to help you measure the performance of these
                  agencies&apos; calls by measuring the agencies&apos; adherence
                  to rules that you, the org, set for them and communicate to
                  them.
                  <br />
                  <br />
                  Each org/agency pair is assigned a scoring model when they are
                  first linked. There is always a single, active scoring model
                  for each pair. A new scoring model goes into effect the moment
                  you upload its edits.
                  <br />
                  <br />
                  The default scoring model may not be entirely suitable for
                  your business. For example, there could be a mismatch between
                  the word lists and your type of business. That&apos;s the
                  primary reason you&apos;d want to edit the lists. Or you may
                  simply want to assign different weighting factors to the words
                  in the model. Take care when making any changes to your scoring
                  model. There&apos;s time to fine-tune it. (Just be cognizant that, if
                  you make edits to the &quot;negative&quot; list, its words are
                  often particularly vile.)
                </p>
                <p className="mb-4">
                  Agencies, both internal and external, make various types of
                  calls (appointment confirmation, information, collections,
                  etc.) on behalf of the orgs for whom they work. Scoring models
                  exist to help you measure the performance of these
                  agencies&apos; calls by measuring the agencies&apos; adherence
                  to rules that you, the org, set for them and communicate to
                  them.
                  <br />
                  <br />
                  Each org/agency pair is assigned a scoring model when they are
                  first linked. There is always a single, active scoring model
                  for each pair. A new scoring model goes into effect the moment
                  you upload its edits.
                  <br />
                  <br />
                  The default scoring model may not be entirely suitable for
                  your business. For example, there could be a mismatch between
                  the word lists and your type of business. That&apos;s the
                  primary reason you&apos;d want to edit the lists. Or you may
                  simply want to assign different weighting factors to the words
                  in the model. Take care when making any changes to your scoring
                  model. There&apos;s time to fine-tune it. (Just be cognizant that, if
                  you make edits to the &quot;negative&quot; list, its words are
                  often particularly vile.)
                </p>
              </div>
            </Tabs.Item>

            {/* Tab 1 - Why would I edit one? */}
            {/* <Tabs.Item title="Why would I edit one?">
              <div className="container overflow-y-auto h-64 mx-auto bg-teal-200 text-sm ring-1 ring-black ring-offset-0 rounded">
              </div>
            </Tabs.Item> */}

            {/* Tab 2 - How do I edit one? */}
            {/* <Tabs.Item title="How do I edit one?">
              <div className="container overflow-y-auto h-64 mx-auto bg-teal-200 text-sm ring-1 ring-black ring-offset-0 rounded">
              </div>
            </Tabs.Item> */}

            {/* Tab 3 - EXPORT LATEST */}
            <Tabs.Item active title="EXPORT LATEST">
              <div className="container overflow-y-auto h-64 mx-auto bg-teal-200 text-sm ring-1 ring-black ring-offset-0 rounded">
                <p>
                  Select one, two or all three of the sublists to export for
                  editing. Each sublist will be saved to its own file in your
                  computer&apos;s default file download location. It will be
                  saved as a 2-column list of comma-separated values (
                  <i>.csv</i>), ready for easy opening, editing and saving in
                  Excel<sup>&reg;</sup>. (In Windows open a .csv file by
                  double-clicking the sublist&apos;s filename. On Mac
                  you&apos;ll need to perform some one-time setup to get
                  double-clicking to work the same way. See{" "}
                  <i>
                    <u>
                      <a
                        href="https://www.process.st/how-to/make-microsoft-excel-default-on-mac/"
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        this article
                      </a>
                    </u>
                  </i>{" "}
                  for help.)
                  <br />
                  <br />
                  Column 1 will contain the word or phrase in quotation marks.
                  Column 2 will hold the its weighting factor wrt other words in
                  the same sublist.
                  <br />
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  {/* POSITIVE */}
                  <div className="bg-white rounded-lg shadow-lg p-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="pos-checkbox"
                        value={""}
                        checked={poscb}
                        onChange={() => {
                          setPoscb(!poscb);
                        }}
                      />
                      <label
                        htmlFor="pos-checkbox"
                        className="ml-2 text-xl font-bold text-gray-800"
                      >
                        Positive words
                      </label>
                    </div>
                    <span className="ml-6">Filename: positive.csv*</span>
                    <div className="flex">
                      <span className="ml-6">
                        Positive sublist weighting factor**:
                      </span>
                      <span className="ml-2">{posWeighting}</span>
                    </div>
                  </div>

                  {/* NEGATIVE */}
                  <div className="bg-white rounded-lg shadow-lg p-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="neg-checkbox"
                        value={""}
                        checked={negcb}
                        onChange={() => {
                          setNegcb(!negcb);
                        }}
                      />
                      <label
                        htmlFor="neg-checkbox"
                        className="ml-2 text-xl font-bold text-gray-800"
                      >
                        Negative words
                      </label>
                    </div>
                    <span className="ml-6">Filename: negative.csv*</span>
                    <div className="flex">
                      <span className="ml-6">
                        Negative sublist weighting factor**:
                      </span>
                      <span className="ml-2">{negWeighting}</span>
                    </div>
                  </div>

                  {/* REQUIRED */}
                  <div className="bg-white rounded-lg shadow-lg p-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="req-checkbox"
                        value={""}
                        checked={reqcb}
                        onChange={() => {
                          setReqcb(!reqcb);
                        }}
                      />
                      <label
                        htmlFor="req-checkbox"
                        className="ml-2 text-xl font-bold text-gray-800"
                      >
                        Required words
                      </label>
                    </div>
                    <span className="ml-6">Filename: required.csv*</span>
                    <div className="flex">
                      <span className="ml-6">
                        Required sublist weighting factor**:
                      </span>
                      <span className="ml-2">{reqWeighting}</span>
                    </div>
                  </div>
                </div>
                <p className="text-black text-xs pb-1">
                  <span>
                    * Name of the .csv file cannot be changed; operating system
                    will append (2,3,4,...) to make unique.
                  </span>
                  <br />
                  <span>
                    ** Sublist weighting factors are used for computing a single
                    combined score for an audio file.
                  </span>
                </p>
              </div>
            </Tabs.Item>

            {/* Tab 4 - IMPORT EDITED */}
            <Tabs.Item title="IMPORT EDITED">
              <div className="container overflow-y-auto h-64 mx-auto ring-1 ring-black ring-offset-0 bg-teal-200 text-sm rounded">
                <p>
                  When you are finished editing the sublist(s),
                  <i> and you&apos;re sure there is nothing missing or extra</i>
                  , save it from Excel back to the same .csv file(s) you edited.
                  Use the{" "}
                  <u className="text-blue-900 font-semibold">Browse files</u>{" "}
                  link below to select your edited files. You will be able to
                  upload 1, 2 or 3 .csv files at the same time. Your edits will
                  replace the corresponding sublists in your current active
                  Scoring Model (for your org and this agency), creating a new
                  Scoring Model which will become the pair&apos;s active scoring
                  model immediately. It will remain active until you import
                  changes again.
                </p>
                <div className="flex justify-center items-start">
                  <div className="grid grid-cols-2">
                    <DragAndDrop1
                      options={{
                        usage: "models",
                        instructions: `You may upload 1-3 .csv files that you have edited. They must each apply to a different sublist, i.e.,
                          at most 1 for positive words; 1 for negative words; and 1 for required words.`,
                        btntext: ["Validate", "Upload to create new model"],
                        orgId,
                        agencyId,
                        name,
                        description,
                        posWeighting,
                        negWeighting,
                        reqWeighting,
                        setOpenModal: props.setOpenModal,
                      }}
                    />
                    <div className="bg-teal-100 rounded-lg m-8 outline-black outline outline-2">
                      <p className="m-4">
                        <b>Tip:</b> When you successfully Validate and Upload
                        your sublist(s), a new Scoring Model will be created and
                        activated. Edit the following fields before uploading.
                        Changes are optional, but it is recommended that you
                        enter a new Name field--for use when you Explore scoring.
                      </p>
                      <table className="ml-6">
                        <tbody>
                          <tr>
                            <td>Name</td>
                            <td>
                              <input
                                type="text"
                                required
                                className="ml-2 h-1 w-48 text-xs mr-2"
                                value={name}
                                onChange={(e) => { setName(e.target.value) }}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td>Description</td>
                            <td>
                              <input
                                type="text"
                                required
                                className="ml-2 h-1 w-48 text-xs mr-2"
                                value={description}
                                onChange={(e) => { setDescription(e.target.value) }}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td>Positive weighting factor (1-100)</td>
                            <td>
                              <input
                                type="number"
                                required
                                min="1"
                                max="100"
                                className="ml-2 h-1 w-18 text-xs mr-2"
                                value={posWeighting}
                                onChange={(e) => {
                                  setPosWeighting(parseInt(e.target.value, 10));
                                }}
                              />
                              <span className="validity"></span>
                            </td>
                          </tr>
                          <tr>
                            <td>Negative weighting factor (1-100)</td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                className="ml-2 h-1 w-18 text-xs mr-2"
                                value={negWeighting}
                                onChange={(e) => {
                                  setNegWeighting(parseInt(e.target.value, 10));
                                }}
                              />
                              <span className="validity"></span>
                            </td>
                          </tr>
                          <tr>
                            <td>Required weighting factor (1-100)</td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                className="ml-2 h-1 w-18 text-xs mr-2"
                                value={reqWeighting}
                                onChange={(e) => {
                                  setReqWeighting(parseInt(e.target.value, 10));
                                }}
                              />
                              <span className="validity"></span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Item>
          </Tabs.Group>
        </Modal.Body>
        <Modal.Footer>
          {/*
            Buttons shown depend on activeTabRef.current:
            0 Next           Cancel
            1 Next           Cancel
            2 Next           Cancel
            3 Next           Download csv(s)      Cancel
            4 Upload csv(s)  Cancel
          */}
          {activeTabRef.current === 0 && (
            <Button
              outline
              gradientMonochrome="info"
              onClick={() => tabsRef.current?.setActiveTab(1)}
            >
              Next tab&nbsp;
              <FaAngleRight />
            </Button>
          )}
          {activeTabRef.current === 1 && (
            <Button
              outline
              gradientMonochrome="info"
              onClick={() => tabsRef.current?.setActiveTab(2)}
            >
              Next tab&nbsp;
              <FaAngleRight />
            </Button>
          )}
          {activeTabRef.current === 2 && (
            <Button
              outline
              gradientMonochrome="info"
              onClick={() => tabsRef.current?.setActiveTab(3)}
            >
              Next tab&nbsp;
              <FaAngleRight />
            </Button>
          )}
          {activeTabRef.current === 3 && (
            <>
              <Button
                outline
                gradientMonochrome="info"
                onClick={() => tabsRef.current?.setActiveTab(4)}
              >
                Next tab&nbsp;
                <FaAngleRight />
              </Button>
              <Button
                outline
                gradientMonochrome="info"
                disabled={!poscb && !negcb && !reqcb}
                onClick={handleSubmitExportModel}
              >
                Download csv(s)
              </Button>
            </>
          )}
          {activeTabRef.current === 4 && (
            <Button
              outline
              gradientMonochrome="info"
              onClick={() => tabsRef.current?.setActiveTab(0)}
            >
              <FaAngleLeft />
              &nbsp;First tab
            </Button>
          )}
          <Button outline gradientMonochrome="info" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer autoClose={9000} />
    </>
  );
}
