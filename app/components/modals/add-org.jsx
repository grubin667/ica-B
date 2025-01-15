"use client"
import { useState, useEffect } from "react"
import { Button, Modal } from "flowbite-react"
import { validateByRegex } from "../common/validateByRegex"
import { doAgencyOrgModelWork } from "../common/doAgencyOrgModelWork";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AddOrgModal(props) {
  // Opened by superadmin.
  // props composition:
  // {
  //    openModal,          object consisting of {modalId, idId, idVal, modalHdr}
  //    setOpenModal,       method used to close dialog by props.setOpenModal(undefined)
  //    orgResponse,    each org in orgResponse.orgs includes arrays of linked agencies and users
  //    userResponse    each user in userResponse.users includes arrays of linked orgs and agencies
  // }

  // The following state pairs are available for use by any of the dialogs since only one will be active at a time.
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [active, setActive] = useState(true)
  const [contact, setContact] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [userId, setUserId] = useState("")

  // async function handleResponse<T>(response: Response): Promise<T> {
  //   const contentType = response.headers.get("Content-Type") || "";
  //   const isJson = contentType.includes("application/json");
  //   const data = isJson ? await response.json() : await response.text();

  //   if (!response.ok) {
  //     const message = isJson
  //       ? data.message || response.statusText
  //       : response.statusText;
  //     throw new Error(message);
  //   }
  //   return data as T;
  // }

  useEffect(() => {
    if (props.openModal?.modalId === "add-org") {
      setName("")
      setContact("")
      setContactPhone("")
      setContactEmail("")
      setActive(true)
    }
  }, [
    props.openModal?.idVal,
    props.openModal?.modalId,
    props.orgResponse?.orgs
  ])

  //////////////////////////////////////////////////////////////////////////////////////
  // ADD ORG
  //
  // Create org, org's internal agency, its repo at files.com, including Share Link,
  // and whatever file structure we need on our server.
  // (This process is very similar to what will happen when an org admin adds a new
  // agency or connects with an existing one. Both will likely be handled by the same code.)
  //
  //////////////////////////////////////////////////////////////////////////////////////
  const handleSubmitAddOrg = async (e) => {
    e.preventDefault()

    try {
      let badEmail = !validateByRegex("email", contactEmail)
      let badPhone = !validateByRegex("phone", contactPhone)

      if (badEmail || badPhone) {
        throw new Error(`Invalid email addr and/or phone number`)
      }

      const newOrg = {
        name,
        contact,
        contactPhone,
        contactEmail
      }
      const newAgency = {
        name: name + "_internal",
        // contact,
        // contactPhone,
        // contactEmail,
        city: "Warwick",
        state: "RI"
      }

      let theOrg, theAgency, theUser, theModel

      // There are a lot of steps involved in adding an org. It's a lot like seeding, but a bit more complicated.
      // SuperAdmin entered org name and org admin (user) info, name, email, phone.

      /////////////////////////////////////////////////
      // Add the agency. It does not already exist. Yes, we're doing this before adding the org.
      /////////////////////////////////////////////////
      let responseAgency = await fetch(`/api/agencies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newAgency)
      })
      if (responseAgency.ok) {
        const result = await responseAgency.json()
        theAgency = { ...result.data.agency }
      } else {
        throw new Error("Did not work to create the agency in the DB")
      }

      /////////////////////////////////////////////////
      // Add the org. It must not exist already, but this will be handled by the DB.
      /////////////////////////////////////////////////
      let responseOrg = await fetch(`/api/orgs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newOrg)
      })
      if (responseOrg.ok) {
        const result = await responseOrg.json()
        theOrg = { ...result.data.org }
      } else {
        throw new Error(
          `Did not work to create the org in the DB. Does one exist already named ${name}?`
        )
      }

      /////////////////////////////////////////////////
      // Upsert the user. Since we don't know a possibly existing user's id, try to find it by email.
      /////////////////////////////////////////////////
      theUser = props.userResponse.users.find(u => u.email === contactEmail)
      if (!theUser) {
        // Could not find user by email. Must create user.
        const newUser = {
          name: contact,
          email: contactEmail,
          phone: contactPhone
        }
        let responseUser = await fetch(`/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newUser)
        })
        if (responseUser.ok) {
          const result = await responseUser.json()
          theUser = { ...result.data.user }
        } else {
          throw new Error("Did not work to create the user in the DB")
        }
      }

      /////////////////////////////////////////////////
      // Have created theOrg, theAgency and theUser in the DB. Add to multiple junction tables.
      // Still need to create and link their model.
      /////////////////////////////////////////////////

      /////////////////////////////////////////////////
      // Connect user and agency. Connection is as its admin.
      /////////////////////////////////////////////////
      let responseUsersOnAgencies = await fetch(`/api/usersonagencies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agencyId: theAgency.id,
          userId: theUser.id,
          isAgencyAdmin: true
        })
      })
      if (responseUsersOnAgencies.ok) {
        const result = await responseUsersOnAgencies.json()
        // don't think I need anything from the join
      } else {
        throw new Error("Did not work to connect user and agency in the DB")
      }

      /////////////////////////////////////////////////
      // Connect user and org. Connection is as its admin.
      /////////////////////////////////////////////////
      let responseUsersOnOrgs = await fetch(`/api/usersonorgs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orgId: theOrg.id,
          userId: theUser.id,
          isOrgAdmin: true
        })
      })
      if (responseUsersOnOrgs.ok) {
        const result = await responseUsersOnOrgs.json()
        // don't think I need anything from the join
      } else {
        throw new Error("Did not work to connect user and org in the DB")
      }

      /////////////////////////////////////////////////
      // Create a unique (default) model and then link it to theAgency and to theOrg.
      // This is handled in doAgencyOrgModelWork.
      /////////////////////////////////////////////////
      const modelWorkResponse = await doAgencyOrgModelWork(
        theAgency.id,
        theAgency.name,
        theOrg.id,
        theOrg.name
      );
      if (modelWorkResponse.ok) {
        const modelResult = await modelWorkResponse.json()
        theModel = { ...modelResult.data.model }
      } else {
        throw new Error(`Agency-org-model work failed`)
      }

      /////////////////////////////////////////////////
      // Connect agency and org. Connection is of type 'internal'.
      /////////////////////////////////////////////////
      let responseAgenciesOnOrgs = await fetch(`/api/agenciesonorgs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orgId: theOrg.id,
          agencyId: theAgency.id,
          isInternalAgency: true,
          activeModelId: theModel.id
        })
      })
      if (responseAgenciesOnOrgs.ok) {
        const result = await responseAgenciesOnOrgs.json()
        // don't believe I need to hold the join or look at it more
      } else {
        throw new Error("Did not work to connect org and agency in the DB")
      }
    } catch (error) {
      alert(`Error received from addOrg: ${error?.message}`)
    }

    toast(`Added org ${name} and related data`)
    props.setOpenModal(undefined)
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // CLOSE MODAL
  //////////////////////////////////////////////////////////////////////////////////////
  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined)
  }

  return (
    <>
      {/* ADD NEW ORG */}
      <Modal
        // root={document.body}
        dismissible
        show={props?.openModal?.modalId === "add-org"}
        onClose={handleCloseModal}
      >
        <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative z-0 w-full group">
              <input
                type="text"
                name="floating_name"
                id="floating_name"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <label
                htmlFor="floating_name"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Org Name
              </label>
            </div>
            <div className="relative z-0 w-full group">
              <input
                type="text"
                name="floating_contact"
                id="floating_contact"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={contact}
                onChange={e => setContact(e.target.value)}
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
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
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
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
              />
              <label
                htmlFor="floating_phone"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Admin Phone
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between h-5 mt-4 mb-1">
            <div className="flex">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800"
                value={""}
                checked={active}
                onChange={e => setActive(!active)}
              />
              <label
                htmlFor="remember"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Active
              </label>
            </div>
            <div className="ml-2 text-sm text-gray-700 italic w-full">
              <p>
                After adding this org, we&apos;ll create its internal agency and
                present the details to you.
              </p>
              <p>All fields are required.</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            outline
            gradientMonochrome="info"
            disabled={
              !name.length ||
              !contact.length ||
              !contactEmail ||
              !contactPhone ||
              !active
            }
            onClick={handleSubmitAddOrg}
          >
            Save
          </Button>
          <Button outline gradientMonochrome="info" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer autoClose={9000} />
    </>
  )
}
