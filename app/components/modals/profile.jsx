"use client"
import { useState, useRef, useContext } from "react"
import { UserContext } from "../../context/UserContext"
import { useSession } from "next-auth/react"
import { Button, Modal } from "flowbite-react"
import { Tabs } from "flowbite-react"
import { HiAdjustments, HiUserCircle } from "react-icons/hi"
import { MdDashboard } from "react-icons/md"
import { useUser } from "../../hooks/useUser"
import { setEmulatedRole } from "../../context/userReducer"

export default function ProfileModal(props) {
  const initialRoleName = "Select..."
  const [selectedRole, setSelectedRole] = useState(initialRoleName)
  const emulatedRoleRef = useRef(null)

  const { state: userState, update: updateUserState } = useContext(UserContext)
  const { data: session, status } = useSession()
  let userId = session?.user?.id
  const {
    user,
    mutate,
    role: nativeRole,
    ec: availableRoles,
    isLoading,
    error
  } = useUser(userId)
  const emulatedRole = userState.emulatedRole
  const role =
    emulatedRole && Object.keys(emulatedRole).length > 0
      ? emulatedRole
      : nativeRole

  return (
    <>
      {/* Modal dialog profile-modal */}
      <Modal
        // root={document.body}
        dismissible
        size={"lg"}
        show={props.openModal === "profile-modal"}
        onClose={() => props.setOpenModal(undefined)}
      >
        <Modal.Header>Profile</Modal.Header>
        <Modal.Body>
          <Tabs.Group aria-label="Tabs with icons" style="underline">
            <Tabs.Item active icon={MdDashboard} title="Emulate Role">
              <p className="font-medium text-gray-800 dark:text-white">
                Choose a Role to emulate.{" "}
                {emulatedRole && Object.keys(emulatedRole).length > 0 && (
                  <span>
                    Return to your Native Role by clicking{" "}
                    <span
                      className="inline text-red-500 text-lg font-bold cursor-pointer hover:italic"
                      onClick={() => {
                        updateUserState(setEmulatedRole({}))
                        props.setOpenModal(undefined)
                      }}
                    >
                      HERE
                    </span>
                    . You may also select a different Role to emulate. If you
                    leave the ICA website and return, you&apos;ll re-enter in
                    your Native Role.
                  </span>
                )}
              </p>
              <select
                id="roles"
                // defaultValue={initialRoleName}
                className="mt-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={selectedRole}
                onChange={e => {
                  let sel = e.target.value
                  setSelectedRole(sel) // this is just for the <select to use
                  if (sel !== initialRoleName) {
                    // Set the assumed role for use if Apply btn is subsequently clicked
                    // Search availableRoles for sel in displayName property.
                    availableRoles?.forEach(ar => {
                      if (ar.displayName === sel) {
                        // set aside ar.eRole
                        emulatedRoleRef.current = ar.eRole
                        // would like to break
                      }
                    })
                  }
                }}
              >
                <option value={initialRoleName}>{`${initialRoleName}`}</option>
                {availableRoles &&
                  availableRoles.map(c => {
                    return (
                      <option key={c.displayName} value={c.displayName}>
                        {c.displayName}
                      </option>
                    )
                  })}
              </select>
            </Tabs.Item>
            <Tabs.Item icon={HiUserCircle} title="Role">
              <p className="font-medium text-gray-800 dark:text-white">
                Your user is....
              </p>
            </Tabs.Item>
            <Tabs.Item icon={HiAdjustments} title="Settings">
              <p className="font-medium text-gray-800 dark:text-white">
                Settings tab&apos;s associated content
              </p>
            </Tabs.Item>
          </Tabs.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            outline
            gradientMonochrome="info"
            onClick={() => {
              if (emulatedRoleRef.current) {
                updateUserState(setEmulatedRole(emulatedRoleRef.current))
              }
              props.setOpenModal(undefined)
            }}
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
  )
}
