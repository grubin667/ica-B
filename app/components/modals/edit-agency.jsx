"use client"
import { useState, useEffect } from "react"
import { Button, Modal } from "flowbite-react"

const fetcher = url => fetch(url).then(res => res.json())

export default function EditAgencyModal(props) {
  // Opened by superadmin, orgcommon.
  // props composition:
  // {
  //    openModal,          object consisting of {modalId, idId, idVal, modalHdr}
  //    setOpenModal,       method used to close dialog by props.setOpenModal(undefined)
  //    agencyResponse  each agency in agencyResponse.agencies includes arrays of linked orgs and users
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
    if (props.openModal?.modalId === "edit-agency") {
      // Editing an agency is more complicated than editing a user.
      // If the admin fields (the contact fields) aren't touched,
      // then only the Active bool is mutable. This case doesn't
      // deserve special handling, so we'll assume active may have
      // been changed and also admin name, email or phone has been edited.
      // This means we'll need to update the agency and the user.
      //
      // To set props into state name and active are directly in the agency with id = props.openModal.idVal.
      // But contact, contactPhone and contactEmail are in a user in the chosen agency's array of users.
      const a = props.agencyResponse.agencies.find(r => r.id === props.openModal.idVal)
      setName(a.name) // not editable
      setActive(a.active)
      
      // Find the first user in a.users with isAgencyAdmin = true.
      // Set name, email and phone from that user
      for (let i = 0; i < a.users.length; i++) {
        let u = a.users[i]
        if (u.isAgencyAdmin) {
          setContact(u.user.name || "")
          setContactPhone(u.user.phone || "")
          setContactEmail(u.user.email || "")
          // save user.id for use in submit processing
          setUserId(u.user.id || "")
          return
        }
      }
    }
  }, [
    props.agencyResponse?.agencies,
    props.openModal?.idVal,
    props.openModal?.modalId
  ])

  //////////////////////////////////////////////////////////////////////////////////////
  // EDIT AGENCY (see MANAGE ORG for comments)
  //////////////////////////////////////////////////////////////////////////////////////
  const handleSubmitEditAgency = async e => {
    e.preventDefault()
    try {
      let response = await fetch(`/api/agencies/${props.openModal.idVal}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ active })
      })
      if (response.ok) {
        const thisAgency = props.agencyResponse.agencies.find(
          a => a.id === props.openModal.idVal
        )
        const preEditUser = thisAgency.users.find(u => u.user.id === userId)
          .user
        if (preEditUser.email === contactEmail) {
          response = await fetch(`/api/users/${userId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: contact, phone: contactPhone })
          })
          if (response.ok) {
          } else {
          }
        } else {
          let theUser
          const newUser = {
            name: contact,
            email: contactEmail,
            phone: contactPhone
          }
          response = await fetch(`/api/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(newUser)
          })
          if (response.ok) {
            const result = await response.json()
            theUser = { ...result.data.user }

            response = await fetch(`/api/usersonagencies`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                agencyId: props.openModal.idVal,
                userId: theUser.id,
                isAgencyAdmin: true
              })
            })
            if (response.ok) {
              const result = await response.json()
            } else {
              throw new Error(
                "Did not work to connect user and agency in the DB"
              )
            }
          } else {
            throw new Error("Did not work to create the user in the DB")
          }
        }
      } else {
        alert("Update agency failed")
        return
      }
    } catch (error) {
      alert(`Error received updating agency: ${error}`)
    }
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
      {/* MANAGE AGENCY */}
      <Modal
        // root={document.body}
        dismissible
        show={props?.openModal?.modalId === "edit-agency"}
        onClose={handleCloseModal}
      >
        <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-2 gap-6">
            <div className="relative z-0 w-full group">
              <input
                type="text"
                name="floating_name"
                id="floating_name"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={name}
                disabled
                readOnly
              />
              <label
                htmlFor="floating_name"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Name (cannot edit)
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
            <div className="flex items-center h-5">
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
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            outline
            gradientMonochrome="info"
            onClick={handleSubmitEditAgency}
          >
            Save
          </Button>
          <Button outline gradientMonochrome="info" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
