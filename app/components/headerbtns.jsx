"use client"

import { useState, useContext, useReducer } from "react"
import { UserContext } from "../context/UserContext"
import { useSession, signOut } from "next-auth/react"
import { useUser } from "../hooks/useUser"
import { useRouter } from "next/navigation"
import { Button } from "flowbite-react"
import HelpModal from "./modals/help"
import ProfileModal from "./modals/profile"

export default function HeaderBtns() {
  const router = useRouter()

  const outtaHere = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const [openModal, setOpenModal] = useState()
  const props = { openModal, setOpenModal }

  const [counterKey, incrementCounterKey] = useReducer(c => c + 1, 0)

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
      {status === "authenticated" && (
        <div className="flex">
          <Button
            outline
            gradientMonochrome="info"
            onClick={() => {
              incrementCounterKey();
              props.setOpenModal("profile-modal")
            }}
          >
            Profile
          </Button>
          <Button
            outline
            gradientMonochrome="info"
            onClick={() => {
              props.setOpenModal("help-modal")
            }}
          >
            Help &amp; Support
          </Button>
          <Button outline gradientMonochrome="info" onClick={outtaHere}>
            Sign Out
          </Button>
        </div>
      )}
      {status !== "authenticated" && (
        <>
          <span className="mr-4">
            Not signed in. Enter your email address to begin.
          </span>
          <Button
            outline
            gradientMonochrome="info"
            onClick={() => {
              props.setOpenModal("help-modal")
            }}
          >
            Help &amp; Support
          </Button>
        </>
      )}

      <HelpModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
      />
      <ProfileModal
        openModal={props.openModal}
        setOpenModal={props.setOpenModal}
        key={counterKey}
        mykey={counterKey}
      />
    </>
  )
}
