"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button, Alert, Modal, TextInput, Label } from "flowbite-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EnterEmail() {
  const [email, setEmail] = useState("");
  const [signInState, setSignInState] = useState("init");
  const [signInErrorMessage, setSignInErrorMessage] = useState("");
  const [openModal, setOpenModal] = useState(0);
  // openModal 0 no modal
  //           1 - Permission for Text Message
  //           2 - Enter token received
  //           3 - Text Message Failed to Send
  const [thisUser, setThisUser] = useState({});
  const [token, setToken] = useState("");
  const [showError, setShowError] = useState(false);
  const [entry, setEntry] = useState("");
  const [notokperm, setNotokperm] = useState(false);

  const checkIfCookieExists = () => {
    return document.cookie
      .split(";")
      .some((item) => item.trim().startsWith("next-auth.session-token="));
  };

  const theyMatch = () => {
    return entry === token;
  };

  const saveEntry = (e) => {
    setEntry(e.currentTarget.value);
    setShowError(false);
  };

  const sanitized = (dirtyNumber) => {
    return dirtyNumber.replaceAll(/\D/g, '');
  }

  const doGetStarted = async (e) => {

    e.preventDefault();
    const response = await fetch(`/api/users?email=${email}`);
    if (response.ok) {
      console.log(`got user back from the DB`)
      let userObj = await response.json();
      setThisUser(userObj.user);
      if (checkIfCookieExists()) {
        console.log(`user found in DB and cookie exists. Proceed with Magic Link sign in.`)
        signIn("email", {
          email,
        });
      } else {
        toast(`Your user record was found in the database, but you're not
        signed in yet. We'll explain the process as we go along.`)
        setOpenModal(1);
      }
    } else {
      toast(`No user with your email was found in our database. Did you type it correctly? If you did, notify the
      admin of your Org or Agency to correct your user record.`, { autoClose: 8000 })
    }
  };

  var now = new Date();
  var hour = now.getHours();
  var daypart =
    hour < 4
      ? "You're still up?"
      : hour < 9
        ? "Wow, you're up early! Good morning."
        : hour < 12
          ? "Good morning."
          : hour < 17
            ? "Good afternoon."
            : hour < 22
              ? "Good evening."
              : "You do know it's time for bed?";

  // (Coming through home-page.jsx, if we determined that a user was still signed in from last time,
  // we navigated to superadmin or one of the agency... or org... pages. So we never arrive here.)
  //
  // Since we determined that there was no signed in user (i.e., no user with an
  // active session), we came here to begin the sign-in process. The user enters his email address
  // and clicks the [Let's Get Started] button. However, we don't just begin the Magic Link process by calling
  // next-auth's signIn method.
  //
  // First, we fetch the user from the users table in the DB. If the user is found, the record will have these
  // properties: id, name, email and (cell) phone. Users don't add themselves. A new user had to have been added
  // by a superadmin or by an org or agency admin. Validation on user creation means that all four of these properties
  // will be filled in.
  //
  // If the user record is not found in the DB, we tell him that an admin has to add him or her to the database before
  // signing in will work. We don't know what level that admin is or what org or agency the user should be connected with
  // and in what capacity (admin or non-admin). We've done all we can here, UNLESS the user entered his email
  // incorrectly. So we do have to provide a [Take me back to re-enter my email address] button.
  //
  // If the user record has been found, we check for a session cookie named "next-auth-session-token". This isn't
  // really necessary. The case would have been caught in home-page.tsx processing, and the user would have
  // proceeded into the site, skipping this enteremail component. But still....
  //

  /*
    Spiffing up the "entry/login" experience. 
    
    We'll still save a session cookie so that a user will usually be taken to his start page 
    without having to type anything at all.

    However, there are several cases where the session cookie won't exist: 
      (1) if the user clicked the Sign out button last time he used the site; 
      (2) if the user switched browsers or cleared cookies; 
      (3) if it's a new user logging in for the first time; 
      (4) if a certain amount time has passed (probably a month) since the last "full" 
          login process (known as a "session timeout").

    We'll continue to use the Magic Link system, but before getting to it the user will have to 
    go through our new multi-factor authentication procedure. This procedure is pretty much 
    what you've seen lately with a bit more states to handle both typing errors and processing errors. 
    Here's how it will work.

    Step 1. 
        User enters email address and clicks the button that currently says "Send me a Magic Link". 
        We try to fetch the user from the DB by email address. If that fails, we inform the user and 
        stay there for user to fix the email address or leave and speak with his admin. If we find 
        the user's record in the DB, we proceed to Step 2.
    Step 2. 
        We explain how we need to confirm that the user is the user by sending a token to his 
        cell number via SMS text message. We ask the user to check a box to give us permission 
        to send this message and to acknowledge that messaging costs may apply to this message. 
        There are three buttons at the bottom: 
          (1) (disabled until the check box is checked) Send me the Token; 
          (2) Go back to the Email Address entry page (which is pretty useless since the email 
              worked and we found the user in the DB); 
          (3) Cancel - I have to contact my admin - my phone number is incorrect - I'll be back.
    Step 3. 
        We try to send the token via SMS. This will either work or it won't. The program knows. 
        If it didn't work, which it won't until our relationship with Esendex is straightened out, 
        we actually the token to the user and have him enter it into a text field. If it did work, 
        the user is asked to enter the token in that very same text field. The user types in the 
        token and clicks Button 1 (disabled until a 5-digit number is entered by the user). 
        Verify the token and send me a Magic Link. If the numbers match, we initiate the Magic Link 
        process. If not, we tell the user he messed up and stay right there for re-entry. There 
        doesn't need to be a button saying I fixed the token so try to verify it again. Button 1 
        will still work. Button 2 will be to Go back to Step 2 to re-send the token (or a different 
        one?). Button 3 will take the user back to the email entry screen. Maybe.
    Step 4. 
        The email is sent. Etc. Etc. Same as now.
  */
  const completeWizardStep = async () => {
    try {
      switch (openModal) {
        case 1:
          // generate the token
          const randomNumber = (
            Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000
          ).toString();
          setToken(randomNumber);

          // Get it sent.
          // We call our own API endpoint which in turn will call the Esendex SendMessage API endpoint,
          // passing in the token, our Esendex API key and the user's cell phone number.
          const pkg = {
            token: randomNumber,
            key: process.env.NEXT_PUBLIC_ESENDEX_LICENSE_KEY,
            to: sanitized(thisUser.phone)
          }

          // The following circumvents calling Esendex to deliver the token. Instead, we'll
          // following the path taken when sending the SMS didn't work. THIS IS TEMPORARY.

          const response = await fetch(`/api/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(pkg)
          })
          if (response.ok) {
            const val = await response.json() // val hold messages array in case there's something in it
            setOpenModal(2)
          } else {
            setOpenModal(3)
          }
          break;
        case 2:

          // Compare entered token against the token in state.
          // If they match, set openModal = 0; call next-auth signIn.
          // If they don't match, tell the user. Stay here.
          if (theyMatch() === true) {
            setOpenModal(0);
            signIn("email", {
              email,
            });
          } else {
            setShowError(true);
          }
          break;
        case 3:
          // Compare entered token against the token in state.
          // If they match, set openModal = 0; call next-auth signIn.
          // If they don't match, tell the user. Stay here.
          if (theyMatch() === true) {
            setOpenModal(0);
            signIn("email", {
              email,
            });
          } else {
            setShowError(true);
          }
          break;
      }
    } catch (error) {
      // sending the SMS didn't work. what to do? we'll give them the answer.
      setOpenModal(3);
    }
  };

  return (
    <>
      <main className="flex min-h-screen flex-col items-center p-24 text-black">
        <nav className="flex flex-col">
          <p className="mt-10 text-center text-xl">
            {daypart} Thanks for coming. Let&apos;s get you signed in.
          </p>
          <p className="mt-3 text-center text-lg">
            Enter your email address and click the button.
          </p>
        </nav>
        <div className="mt-3 mb-3 pt-0">
          <input
            type="text"
            placeholder="Your email address"
            className="px-3 py-3 placeholder-slate-300 text-slate-600 relative bg-white rounded text-sm border-0 shadow outline-none focus:outline-none focus:ring w-full"
            value={email}
            onChange={(e) => {
              setEmail(e.currentTarget.value);
            }}
          />
        </div>
        <Button
          gradientMonochrome="info"
          disabled={email.length === 0}
          onClick={doGetStarted}
        >
          Let&apos;s Get Started!
        </Button>
        {/* <div className="mt-16">
            <p>
              &dagger;&nbsp;<b>Magic Links</b> provide a type of login that
              allows you to sign in to an account by entering only your email
              address. There&apos;s no password involved. We send you an email.
              You click the link it contains. We then know that you are you.
              <br />
              (For more information about Magic Links click&nbsp;
              <Link
                href="/magiclinks"
                className="text-red-500 italic hover:underline hover:text-teal-800"
              >
                here
              </Link>
              .)
            </p>
          </div> */}
        <ToastContainer autoClose={6000} />
      </main>

      <Modal
        dismissible={false}
        show={openModal === 1}
        onClose={() => setOpenModal(0)}
      >
        <Modal.Header>Signin Wizard - Permission for Text Message</Modal.Header>
        <Modal.Body className="text-black">
          <p>
            Occasionally, we need to verify your cell number by sending an SMS
            message to your phone and having you enter the token you received.
            This is one of those times.
            <br />
            <br />
            We have your number on file as {thisUser.phone}. Please give us permission
            to send you the token by checking here:
            <br />
            <br />
            <input
              type="checkbox"
              className="mb-2"
              id="tokperm"
              value={notokperm}
              checked={notokperm}
              onChange={() => setNotokperm(!notokperm)}
            />
            <label
              htmlFor="tokperm"
              className="ml-2 mt-2 text-lg font-semibold text-gray-800"
            >
              I agree to receive a text message from Independent Call Auditors.
            </label>
            <br />
            <span className="text-sm ml-8">
              (Message and data rates may apply.)
            </span>
            <br />
            <br />
            If the number is incorrect or is not a cell number, please contact
            your admin and ask that it be changed. Sorry, you cannot change your
            own number.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            outline
            gradientMonochrome="info"
            onClick={completeWizardStep}
            disabled={!notokperm}
          >
            Send me the Token
          </Button>
          <Button
            outline
            gradientMonochrome="info"
            onClick={() => {
              setOpenModal(0)
              toast(`Start over....`, { autoClose: 4000 })
            }}
          >
            Go back
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        dismissible={false}
        show={openModal === 2}
        onClose={() => setOpenModal(0)}
      >
        <Modal.Header>Signin Wizard - Enter token received</Modal.Header>
        <Modal.Body className="text-black">
          <form className="flex max-w-md flex-col gap-4">
            <>
              <div className="flex">
                <Label
                  className="mt-1"
                  htmlFor="token"
                  value="Enter the Token you just received:"
                />
                <TextInput
                  id="token"
                  className="w-32 ml-4"
                  type="numeric"
                  required
                  onChange={saveEntry}
                />
              </div>
            </>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="submit"
            outline
            gradientMonochrome="info"
            onClick={completeWizardStep}
          >
            Verify the Token
          </Button>
          <Button
            outline
            gradientMonochrome="info"
            onClick={() => setOpenModal(1)}
          >
            Cancel
          </Button>
          {showError === true && (
            <span className="text-red-700 font-bold">They do not match</span>
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        dismissible={false}
        show={openModal === 3}
        onClose={() => setOpenModal(0)}
      >
        <Modal.Header>Signin Wizard - Text Message Failed to Send</Modal.Header>
        <Modal.Body className="text-black">
          <form className="flex max-w-md flex-col gap-4">
            <div>
              <>
                <p>
                  It appears that sending the token to you via SMS didn&apos;t
                  work. Our devs have been notified. While we&apos;re working
                  on the problem, we&apos;ll trust that you are you;
                  here&apos;s the token: {token}. Enter it below as if you
                  just received it on your phone.
                  <br />
                  <br />
                </p>
                <div className="flex">
                  <Label
                    className="mt-1"
                    htmlFor="token"
                    value="Enter the Token:"
                  />
                  <TextInput
                    id="token"
                    className="w-32 ml-4"
                    type="numeric"
                    required
                    onChange={saveEntry}
                  />
                </div>

              </>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="submit"
            outline
            gradientMonochrome="info"
            onClick={completeWizardStep}
          >
            Verify the Token
          </Button>
          <Button
            outline
            gradientMonochrome="info"
            onClick={() => setOpenModal(1)}
          >
            Send a new token
          </Button>
          {showError === true && (
            <span className="text-red-700 font-bold">They do not match</span>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}
