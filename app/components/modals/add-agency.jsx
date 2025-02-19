"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Card, Modal, Radio, Label } from "flowbite-react";
import useSWR from "swr";
import { validateByRegex } from "../common/validateByRegex";
import { doAgencyOrgModelWork } from "../common/doAgencyOrgModelWork";

export default function AddAgencyModal(props) {

  const [spreadIndex, setSpreadIndex] = useState(-1);
  const role = props.role;
  const [orgId, setOrgId] = useState(role.orgId);
  const [agencyId, setAgencyId] = useState(
    props.openModal?.idId === "aid" ? props.openModal.idVal : ""
  );

  // These state pairs are for use by any of the dialogs since only one can be active at a time.
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [active, setActive] = useState(true);
  const [contact, setContact] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [audioEle, setAudioEle] = useState(null);
  const [duration, setDuration] = useState(0);

  const clearedFilters = {
    dates: { from: "", thru: "" },
    models: { all: new Array(), sel: new Array() },
    quintiles: [false, false, false, false, false],
    positive: { operator: "", operand: null },
    negative: { operator: "", operand: null },
    required: { operator: "", operand: null },
    combined: { operator: "", operand: null },
  };

  const [activeCard, setActiveCard] = useState(null);
  const [selectedAgency, setSelectedAgency] = useState("");
  const leftRef = useRef();
  const rightRef = useRef();

  const cardChosen = (e) => {
    setActiveCard(e.target.value);
    let x, y, h, w;
    if (e.target.value === "leftCardActive") {
      // left side is active; blank out right side entries
      setName("");
      setContact("");
      setCity("");
      setState("");
      setContactEmail("");
      setContactPhone("");
      // cover right side card with a screen
      // x = rightRef.current.clientLeft
      // y = rightRef.current.clientTop
      // h = rightRef.current.clientHeight
      // w = rightRef.current.clientWidth
    } else if (e.target.value === "rightCardActive") {
      // right side is active; unselect possible left side choice
      setSelectedAgency("");
      let ele = document.getElementsByName("list-radio");
      for (let i = 0; i < ele.length; i++) {
        ele[i].checked = false;
      }
      // cover left side card with a screen
      // x = leftRef.current.clientLeft
      // y = leftRef.current.clientTop
      // h = leftRef.current.clientHeight
      // w = leftRef.current.clientWidth
    }
  };
  const agencySelected = (e) => {
    setSelectedAgency(e.target.value);
  };
  const isApplyDisabled = () => {
    let ret = true;
    if (activeCard === "leftCardActive") {
      // there must be a selectedAgency
      if (selectedAgency && selectedAgency.length > 0) {
        return false;
      }
    } else if (activeCard === "rightCardActive") {
      if (
        name.length &&
        city.length &&
        state.length &&
        contact.length &&
        contactEmail.length &&
        contactPhone.length
      ) {
        return false;
      }
    }
    return ret;
  };

  const {
    data: userResponse,
    error: userResponseError,
    isLoading: userResponseIsLoading,
  } = useSWR(`/api/users`);
  const {
    data: agencyResponse,
    error: agencyResponseError,
    isLoading: agencyResponseIsLoading,
  } = useSWR(`/api/agencies`);
  const {
    data: allResultsFromOrgAgencyPair,
    error: allResultsFromOrgAgencyPairError,
    isLoading: allResultsFromOrgAgencyPairIsLoading,
  } = useSWR(
    role.orgId.length > 0 &&
      props.openModal?.idId === "aid" &&
      props.openModal?.idVal.length > 0
      ? `/api/results?orgId=${role.orgId}&agencyIds=${props.openModal.idVal}`
      : []
  );

  useEffect(() => {
    if (audioEle) {
      // setDuration(audioEle.duration)
    }
  }, [audioEle]);

  // useEffect(() => {
  //   // Our parent component is orgcommon.tsx. That component passes us a different key property
  //   // every time the Add Agency button is clicked. That forces re-initialization to run here.
  //   // This means useStates reinitialize and useEffect([]) runs again. We use it to set up choices
  //   // from scratch.
  //   setShowVersion(-1)
  // }, [])

  useEffect(() => {
    if (props.openModal?.modalId === "add-agency") {
      setName("");
      setCity("");
      setState("");
      setContact("");
      setContactPhone("");
      setContactEmail("");
      setActive(true);
    }
  }, [props.openModal?.idVal, props.openModal?.modalId]);

  if (
    userResponseError ||
    agencyResponseError ||
    allResultsFromOrgAgencyPairError
  ) {
    return <div>A data fetch error has occurred</div>;
  }
  if (
    userResponseIsLoading ||
    agencyResponseIsLoading ||
    allResultsFromOrgAgencyPairIsLoading
  ) {
    return <div>Loading</div>;
  }

  const orgIsNotAlreadyLinkedToAgency = (ag) => {
    const usersOrgId = role.orgId;
    // Agency ag contains an array of orgs that are linked to it.
    // See if any item from [] ag.orgs has orgId === usersOrgId.
    // Return false if agency and org are already linked; true if not.
    let ret = true;
    ag.orgs.forEach((org) => {
      if (org.orgId === usersOrgId) {
        ret = false;
      }
    });
    return ret;
  };

  // We will build agenciesAvailableToChoose for the orgcommon button Add Agency.
  // It will be an array of agencies from which the org admin (the user)
  // may choose one to link to his org.
  // To build the list start with all agencies (agencyResponse.agencies),
  // filter out all internal agencies,
  // filter out all agencies that the current Org is already working with (linked to),
  // and sort the remaining agencies by name.
  let agenciesAvailableToChoose = agencyResponse?.agencies
    .filter((a) => a.name.indexOf("_internal") < 0)
    .filter((a) => orgIsNotAlreadyLinkedToAgency(a))
    .sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

  const invalidOrEmptyField = () => {
    let res = false;
    if (!name.length || !city.length || !state.length || !contact.length) {
      res = true;
    } else {
      let badEmail = !validateByRegex("email", contactEmail);
      let badPhone = !validateByRegex("phone", contactPhone);
      if (badEmail || badPhone) {
        res = true;
      }
    }
    return res;
  };

  const maxString = (txt, len) => {
    return txt.substring(0, len) + " ...";
  };

  async function handleResponse(response) {
    const contentType = response.headers.get("Content-Type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = isJson
        ? data.message || response.statusText
        : response.statusText;
      throw new Error(message);
    }

    return data;
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // ADD AGENCY
  // This method handles 2 case: link org to existing agency and link it to a new agency.
  //////////////////////////////////////////////////////////////////////////////////////
  const handleSubmitAddAgency = async (e) => {
    e.preventDefault();

    try {
      let theModel = {};

      if (activeCard === "rightCardActive") {
        // ADD NEW AGENCY FROM INPUTS
        //////////////////////////////////////////////////////////////////////////////////////

        // We are adding a new agency. User has filled in all text inputs. Admin's email and
        // phone will be validated. Other new agency fields have been validated.
        // We will upsert the user. After adding the agency and upserting the user,
        // we will link the agency to user and org. And we'll do files.com directory stuff.
        let badEmail = !validateByRegex("email", contactEmail);
        let badPhone = !validateByRegex("phone", contactPhone);

        if (badEmail || badPhone) {
          throw new Error(`Invalid email addr and/or phone number`);
        }

        const newAgency = { name, city, state, active };
        const agencyRes = await fetch(`/api/agencies`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newAgency),
        });
        if (agencyRes.ok) {
          const result = await agencyRes.json();
          let theAgency = result.data.agency;

          // Do an upsert on user using contactEmail to see if we already have user record
          let theUser = userResponse?.data?.users.find(
            (u) => u.email === contactEmail
          );

          if (!theUser) {
            // Could not find user by email. Must create user.
            const newUser = {
              name: contact,
              email: contactEmail,
              phone: contactPhone,
            };
            const userRes = await fetch(`/api/users`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(newUser),
            });
            if (userRes.ok) {
              const result = await userRes.json();
              theUser = { ...result.data.user };
            } else {
              throw new Error("Did not work to create the user in the DB");
            }
          }

          // At this point we have theAgency and theUser and org's id is in role.orgId.

          // Create a unique (default) model and then link it to theAgency and to the org whose id is role.orgId.

          // First, we need theOrg (already have theAgency.)
          const orgRes = await fetch(`/api/orgs/${role.orgId}`)
          const theOrgRes = await orgRes.json()
          const theOrg = theOrgRes.data.org

          const modelWorkResponse = await doAgencyOrgModelWork(
            theAgency.id, theAgency.name,
            theOrg.id, theOrg.name
          );
          if (!modelWorkResponse.ok) {
            throw new Error(`Agency-org-model work failed`);
          }
          // model work finished successfully. Continue onward.
          const modelResult = await modelWorkResponse.json()
          theModel = { ...modelResult.data.model }
  
          // Link user with agency.
          const usersOnAgenciesRes = await fetch(`/api/usersonagencies`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agencyId: theAgency.id,
              userId: theUser?.id,
              isAgencyAdmin: true,
            }),
          });
          if (usersOnAgenciesRes.ok) {
            const result = await usersOnAgenciesRes.json();
          } else {
            throw new Error(`Did not work to connect user and new agency`);
          }

          /////////////////////////////////////////////////
          // Connect agency and org. Connection is not 'internal'.
          /////////////////////////////////////////////////
          let responseAgenciesOnOrgs = await fetch(`/api/agenciesonorgs`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orgId: role.orgId,
              agencyId: theAgency.id,
              isInternalAgency: false,
              activeModelId: theModel.id,
            }),
          });
          if (responseAgenciesOnOrgs.ok) {
            const result = await responseAgenciesOnOrgs.json();
            // don't believe I need to hold the join or look at it more
          } else {
            throw new Error(
              "Did not work to connect org and agency in the DB"
            );
          }
        } else {
          throw new Error("Did not work to add an agency");
        }
      } else {
        // LINK EXISTING AGENCY
        //////////////////////////////////////////////////////////////////////////////////////

        // User has selected an agency that was already in our DB from the droplist.
        // The org is guaranteed not to be linked already to this agency.
        // We will link it with org with id role.orgId.

        // Create a unique (default) model and then link it to selectedAgency and to org with id role.orgId.

        // First, we need theAgency and theOrg.
        const orgRes = await fetch(`/api/orgs/${role.orgId}`)
        const theOrgRes = await orgRes.json()
        const theOrg = theOrgRes.data.org
        const agencyRes = await fetch(`/api/agencies/${selectedAgency}`)
        const theAgencyRes = await agencyRes.json()
        const theAgency = theAgencyRes.data.agency

        const modelWorkResponse = await doAgencyOrgModelWork(
          theAgency.id,
          theAgency.name,
          theOrg.id,
          theOrg.name
        );
        if (!modelWorkResponse.ok) {
          throw new Error(`Agency-org-model work failed`)
        }
        // model work finished successfully. Continue onward.
        const modelResult = await modelWorkResponse.json()
        theModel = { ...modelResult.data.model }

        const agenciesOnOrgsRes = await fetch(`/api/agenciesonorgs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orgId: role.orgId,
            agencyId: selectedAgency,
            isInternalAgency: false,
            activeModelId: theModel.id,
          }),
        });
        if (agenciesOnOrgsRes.ok) {
        } else {
          throw new Error("Did not work to connect org and agency in the DB");
        }
      }
    } catch (error) {
      alert(`Received error: ${error?.message}`);
    } finally {
      props.setOpenModal(undefined);
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////
  // CLOSE MODAL
  //////////////////////////////////////////////////////////////////////////////////////
  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined);
  };

  const shittilyRemoveTheT = (dt) => {
    return dt.replace("T", " ").replace("Z", "");
  };

  const sendAudioEleToParent = (audioEle) => {
    setAudioEle(audioEle);
  };

  return (
    <>
      {/* ADD AGENCY */}
      <Modal
        // root={document.body}
        dismissible
        show={props?.openModal?.modalId === "add-agency"}
        onClose={handleCloseModal}
      >
        <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Radio
                id="united-state"
                name="countries"
                value="leftCardActive"
                className="mr-2 ml-4"
                onChange={cardChosen}
              />
              <Label htmlFor="united-state">Choose an existing Agency</Label>
              <Card className="mt-2 w-full">
                {agenciesAvailableToChoose.length > 0 && (
                  <div>
                    <ul className="w-60 max-h-72 overflow-y-auto text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      {agenciesAvailableToChoose.map((a) => {
                        return (
                          <li
                            className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600"
                            key={a.id}
                          >
                            <div className="flex items-center ps-2">
                              <input
                                id={a.id}
                                type="radio"
                                value={a.id}
                                name="list-radio"
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                onChange={agencySelected}
                                disabled={activeCard !== "leftCardActive"}
                              />
                              <label
                                htmlFor={a.id}
                                className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                              >
                                {`${a.name} (${a.city}, ${a.state})`}
                              </label>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="text-black text-xs italic mt-1.5">
                      City and state are shown for disambiguation.
                    </p>
                  </div>
                )}
                {agenciesAvailableToChoose.length === 0 && (
                  <p className="text-black">
                    There are no unaffiliated Agencies to choose from.
                  </p>
                )}
              </Card>
            </div>
            <div>
              <Radio
                id="europe"
                name="countries"
                value="rightCardActive"
                className="mr-2 ml-4"
                onChange={cardChosen}
              />
              <Label htmlFor="europe">Create a new Agency</Label>
              <Card className="mt-2 w-full">
                <div className="grid grid-cols-1 gap-2 h-80">
                  <div className="relative z-0 w-full group">
                    <input
                      type="text"
                      name="floating_name"
                      id="floating_name"
                      className="block py-3 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                      placeholder=" "
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={activeCard !== "rightCardActive"}
                    />
                    <label
                      htmlFor="floating_name"
                      className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Agency Name
                    </label>
                  </div>
                  <div className="relative z-0 w-full group">
                    <input
                      type="text"
                      name="floating_city"
                      id="floating_city"
                      className="block py-3 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                      placeholder=" "
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={activeCard !== "rightCardActive"}
                    />
                    <label
                      htmlFor="floating_city"
                      className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      City
                    </label>
                  </div>
                  <div className="relative z-0 w-full group">
                    <input
                      type="text"
                      name="floating_state"
                      id="floating_state"
                      className="block py-3 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                      placeholder=" "
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={activeCard !== "rightCardActive"}
                    />
                    <label
                      htmlFor="floating_state"
                      className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      State
                    </label>
                  </div>
                  <div className="relative z-0 w-full group">
                    <input
                      type="text"
                      name="floating_contact"
                      id="floating_contact"
                      className="block py-3 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                      placeholder=" "
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      disabled={activeCard !== "rightCardActive"}
                    />
                    <label
                      htmlFor="floating_email"
                      className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Admin Name
                    </label>
                  </div>
                  <div className="relative z-0 w-full group">
                    <input
                      type="text"
                      name="floating_email"
                      id="floating_email"
                      className="block py-3 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                      placeholder=" "
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      disabled={activeCard !== "rightCardActive"}
                    />
                    <label
                      htmlFor="floating_email"
                      className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Admin Email
                    </label>
                  </div>
                  <div className="relative z-0 w-full mb-2 group">
                    <input
                      type="tel"
                      pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                      name="floating_phone"
                      id="floating_phone"
                      className="block py-3 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                      placeholder=" "
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      disabled={activeCard !== "rightCardActive"}
                    />
                    <label
                      htmlFor="floating_phone"
                      className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Admin Phone
                    </label>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            outline
            gradientMonochrome="info"
            onClick={handleSubmitAddAgency}
            disabled={isApplyDisabled()}
          >
            Apply
          </Button>
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
  );
}
