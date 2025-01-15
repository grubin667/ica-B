"use client"
import { useState, useEffect } from "react"
import { Button, Modal } from "flowbite-react"

const fetcher = url => fetch(url).then(res => res.json())

export default function EditOrgModal(props) {
  // Opened by superadmin.
  // props composition:
  // {
  //    openModal,          object consisting of {modalId, idId, idVal, modalHdr}
  //    setOpenModal,       method used to close dialog by props.setOpenModal(undefined)
  //    orgResponse.data,    each org in orgResponse.data.orgs includes arrays of linked agencies and users
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

  useEffect(() => {
    if (props.openModal?.modalId === "edit-org") {
      const o = props.orgResponse.orgs.find(r => r.id === props.openModal.idVal)
      setName(o.name) // not editable
      setActive(o.active)
      for (let i = 0; i < o.users.length; i++) {
        let u = o.users[i]
        if (u.isOrgAdmin) {
          setContact(u.user.name || "")
          setContactPhone(u.user.phone || "")
          setContactEmail(u.user.email || "")
          // save user.id for use in submit processing
          setUserId(u.user.id || "")
          return
        }
      }
    }
  }, [props.openModal?.idVal, props.openModal?.modalId, props.orgResponse.orgs])

  //////////////////////////////////////////////////////////////////////////////////////
  // MANAGE ORG
  //////////////////////////////////////////////////////////////////////////////////////
  const handleSubmitManageOrg = async e => {
    e.preventDefault()
    // name and id are org props and are immutable. active is an org prop and is mutable.
    // contact, contactPhone and contactEmail are user props and are mutable. All are required.

    // Update active field in the org in the unlikely event it was changed.
    try {
      let response = await fetch(`/api/orgs/${props.openModal.idVal}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ active })
      })
      if (response.ok) {
        // We've updated the org in the DB. Now it's time to find the user record and update its name and phone.
        // Complication: contactEmail is mutable in the org, but immutable in the user; and user is
        // linked to the org by its user.id.
        //
        // Step 2. a. If user.email hasn't been edited, update the user record with possible changes
        // to name (from contact) and phone (from contactPhone). Check for this case by comparing
        // contactEmail with user.email in the user prop in the org from orgResponse.data.
        const thisOrg = props.orgResponse.orgs.find(
          o => o.id === props.openModal.idVal
        )
        const preEditUser = thisOrg.users.find(u => u.user.id === userId).user
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
          // Step 2. b. Since user.email *was* changed, need to unlink original user from the org (probably)
          // and then link a different user to the org. But that different user may or may not exist yet.
          // Only its email address can be used to check. So have to upsert the user and link that user
          // to the org. (Adapt the code from handleSubmitAddOrg following the // Upsert the user comment.)
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

            // Connect user and org. Connection is as its admin.
            response = await fetch(`/api/usersonorgs`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                orgId: props.openModal.idVal,
                userId: theUser.id,
                isOrgAdmin: true
              })
            })
            if (response.ok) {
              const result = await response.json()
              // don't think I need to hold the join
            } else {
              throw new Error("Did not work to connect user and org in the DB")
            }
          } else {
            throw new Error("Did not work to create the user in the DB")
          }
        }
      } else {
        alert("Update org failed")
        return
      }
    } catch (error) {
      alert(`Error received updating org: ${error}`)
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
      {/* MANAGE ORG */}
      <Modal
        // root={document.body}
        dismissible
        show={props?.openModal?.modalId === "edit-org"}
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
            onClick={handleSubmitManageOrg}
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
