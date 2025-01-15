"use client"
import { useState, useEffect } from "react"
import { Button, Modal, Sidebar, Card } from "flowbite-react"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import useSWR from "swr"

export default function HelpModal(props) {
  const [showMdIndex, setShowMdIndex] = useState(-1)
  useEffect(() => {
    // Our parent component is headerbtns.tsx. That component passes us a different key property
    // every time the Help & Support button is clicked. That forces re-initialization to run here.
    // This means useStates reinitialize and useEffect([]) runs again. We use it to set up choices
    // from scratch.
    setShowMdIndex(-1)
  }, [])

  // const { state: userState, update: updateUserState } = useContext(UserContext);
  // const { data: session, status } = useSession()
  // let userId = session?.user?.id;
  // const { user, mutate, role: nativeRole, ec: availableRoles, isLoading, error } = useUser(userId)
  // const emulatedRole = userState.emulatedRole;
  // const role: { admin: boolean, orgId: number, agencyId: number } = emulatedRole && Object.keys(emulatedRole).length > 0 ? emulatedRole : nativeRole;

  const {
    data: helpsResponse,
    error: helpsResponseError,
    isLoading: helpsResponseIsLoading
  } = useSWR(`/api/helps`)
  if (helpsResponseError) {
    return <div>Error occurred loading data</div>
  }
  if (helpsResponseIsLoading) {
    return <div>Loading</div>
  }

  return (
    <>
      {/* Modal dialog help-modal */}
      <Modal
        // root={document.body}
        dismissible
        size={"6xl"}
        show={props.openModal === "help-modal"}
        onClose={() => props.setOpenModal(undefined)}
      >
        <Modal.Header>Help &amp; Support</Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-4 gap-4">
            <Sidebar aria-label="help and support">
              <Sidebar.Logo href="#" img="/logo-ICA.png" className="" imgAlt="ICA logo">
                ICA
              </Sidebar.Logo>
              <Sidebar.Items>
                <Sidebar.ItemGroup>
                  {helpsResponse?.data?.helps.map((h, index) => {
                    return (
                      <Sidebar.Item key={h.id}>
                        <p
                          onClick={() => {
                            setShowMdIndex(index)
                          }}
                        >
                          {h.name}
                        </p>
                      </Sidebar.Item>
                    )
                  })}
                </Sidebar.ItemGroup>
              </Sidebar.Items>
            </Sidebar>

            {showMdIndex > -1 && (
              <Card className="bg-red-300 col-start-2 col-span-3 text-black">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {helpsResponse.data.helps[showMdIndex].md.toString()}
                </ReactMarkdown>
              </Card>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
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
