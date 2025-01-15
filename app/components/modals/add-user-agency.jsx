"use client"

import { useState, useEffect } from "react"
import { Modal, Button } from "flowbite-react"
import { validateByRegex } from "../common/validateByRegex"

export default function AddUserAgencyModal(props) {
  // props:
  // {
  //    openModal,          object consisting of {modalId, modalHdr, agencyId}
  //    setOpenModal,       method used to close dialog by props.setOpenModal(undefined)
  //    userResponse    all users
  // }

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const active = true // everyone is added as active
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    if (props.openModal?.modalId === "add-user-agency") {
      setName("")
      setEmail("")
      setPhone("")
      setAdmin(false)
    }
  }, [props.openModal?.modalId])

  const invalid_emailOrPhone = () => {
    let badEmail = !validateByRegex("email", email)
    let badPhone = !validateByRegex("phone", phone)
    return badEmail || badPhone
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // CLOSE MODAL
  //////////////////////////////////////////////////////////////////////////////////////
  const handleCloseModal = (/*e*/) => {
    // e.preventDefault();
    props.setOpenModal(undefined)
  }

  //////////////////////////////////////////////////////////////////////////////////////
  // ADD USER
  //////////////////////////////////////////////////////////////////////////////////////
  const handleSubmitAddUser = async e => {
    e.preventDefault()
    const newUser = {
      user: {
        name,
        email,
        phone,
        active
      },
      connection: {
        agencyId: props.openModal.agencyId,
        admin
      }
    }
    try {
      const response = await fetch(`/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newUser)
      })
      if (response.ok) {
        const result = await response.json()
      } else {
        throw new Error("Did not work to add a user")
      }
    } catch (error) {
      alert(`Error received from addUser: ${error}`)
    }
    props.setOpenModal(undefined)
  }

  return (
    <>
      {/* ADD NEW USER */}
      <Modal
        // root={document.body}
        dismissible
        show={props?.openModal?.modalId === "add-user-agency"}
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
                Name
              </label>
            </div>

            <div className="relative z-0 w-full group">
              <input
                type="text"
                name="floating_email"
                id="floating_email"
                className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                placeholder=" "
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <label
                htmlFor="floating_email"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Email
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
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <label
                htmlFor="floating_phone"
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Phone
              </label>
            </div>

            <div className="relative z-0 w-full mt-4 group">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800"
                value={""}
                checked={admin}
                onChange={e => setAdmin(!admin)}
              />
              <label
                htmlFor="remember"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Add new user as an agency admin
              </label>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="submit"
            outline
            gradientMonochrome="info"
            disabled={name.length === 0 || invalid_emailOrPhone() === true}
            onClick={handleSubmitAddUser}
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
