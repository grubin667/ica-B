"use client"
import { useState, useEffect } from "react"
import { Button, Modal } from "flowbite-react"

export default function EditUserModal(props) {
  // EditUserModel is opened only on an Edit user click in the All Users table in superadmin.tsx.
  // Although it's likely that the user belongs to an org or an agency (or maybe more than one),
  // when opened from superadmin, we don't care which.
  //
  // props:
  // {
  //    openModal,          object consisting of {modalId, idId, idVal, modalHdr}
  //    setOpenModal,       method used to close dialog by props.setOpenModal(undefined)
  //    userResponse        all users in array
  // }

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [active, setActive] = useState(true)
  const [admin, setAdmin] = useState(false)
  const [userAssociations, setUserAssociations] = useState([])
  const [orgOrAgency, setOrgOrAgency] = useState("")
  const [whereAdded, setWhereAdded] = useState("")

  useEffect(() => {
    if (props.openModal?.modalId === "edit-user") {
      const u = props.userResponse.users.find(
        r => r.id === props.openModal.idVal
      )
      setName(u?.name || "")
      setEmail(u?.email) // not editable
      setPhone(u?.phone || "")
      setActive(u?.active)
      setAdmin(u?.admin)

      // construct info about all orgs, agencies and superadmin connections for this user.
      const uAs = []
      if (u?.superAdmin) {
        uAs.push("Super Admin")
      }
      u?.orgs.forEach(o => {
        if (o.isOrgAdmin) {
          uAs.push(`Admin at Org ${o.org.name}`)
        } else {
          uAs.push(`Member at Org ${o.org.name}`)
        }
      })
      u?.agencies.forEach(a => {
        if (a.isAgencyAdmin) {
          uAs.push(`Admin at Agency ${a.agency.name}`)
        } else {
          uAs.push(`Member at Agency ${a.agency.name}`)
        }
      })
      setUserAssociations(uAs)
    }
  }, [
    props.openModal?.idVal,
    props.openModal?.modalId,
    props.userResponse.users
  ])

  //////////////////////////////////////////////////////////////////////////////////////
  // CLOSE MODAL
  //////////////////////////////////////////////////////////////////////////////////////
  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined)
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // SUBMIT EDIT USER
  //////////////////////////////////////////////////////////////////////////////////////
  const handleSubmitEditUser = async e => {
    e.preventDefault()
    // name, phone and active are updatable; email is immutable.
    // id is in props.openModal.idVal and, of course, isn't editable either, it being the primary key.
    try {
      const response = await fetch(`/api/users/${props.openModal.idVal}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, phone, active })
      })
      if (response.ok) {
        const result = await response.json()
      } else {
        alert(`Update user failed`)
        return
      }
    } catch (error) {
      alert(`Error received updating user: ${error}`)
    }
    props.setOpenModal(undefined)
  }

  return (
    <>
      {/* EDIT USER */}
      <Modal
        // root={document.body}
        dismissible
        show={props?.openModal?.modalId === "edit-user"}
        onClose={handleCloseModal}
      >
        <Modal.Header>{props?.openModal?.modalHdr}</Modal.Header>
        <Modal.Body>
          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-6 group">
              <input
                type="text"
                name="floating_name"
                id="floating_name"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={name}
                onChange={e => {
                  e.preventDefault()
                  setName(e.target.value)
                }}
              />
              <label
                htmlFor="floating_name"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Name
              </label>
            </div>
            <div className="relative z-0 w-full mb-6 group">
              <input
                type="text"
                name="floating_email"
                id="floating_email"
                // className="block w-full text-sm mt-2 text-gray-900 bg-slate-200 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={email}
                disabled
                readOnly
              />
              <label
                htmlFor="floating_email"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Email (cannot edit)
              </label>
            </div>
          </div>
          <div className="grid md:grid-cols-2 md:gap-6">
            <div className="relative z-0 w-full mb-2 group">
              <input
                type="tel"
                pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                name="floating_phone"
                id="floating_phone"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={phone}
                onChange={e => {
                  e.preventDefault()
                  setPhone(e.target.value)
                }}
              />
              <label
                htmlFor="floating_phone"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Phone
              </label>
            </div>
            <div className="flex items-start mt-2 mb-6">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800"
                  value={""}
                  checked={active}
                  onChange={() => {
                    setActive(!active)
                  }}
                />
              </div>
              <label
                htmlFor="remember"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Active
              </label>
            </div>
          </div>
          <div className="flex flex-col text-sm ml-4">
            Associations:
            {userAssociations.map((uA, index) => {
              return (
                <div key={index} className="ml-8">
                  {uA}
                </div>
              )
            })}
            {userAssociations.length === 0 && (
              <div className="ml-8">
                User is a member of no Orgs or Agencies and is not a Super Admin
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            outline
            gradientMonochrome="info"
            onClick={handleSubmitEditUser}
          >
            Submit
          </Button>
          <Button outline gradientMonochrome="info" onClick={handleCloseModal}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
