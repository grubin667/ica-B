## The Problem
We've got a couple of problems with authentication, at least the way we're currently handling it.
- Unknown users, i.e., ones who aren't already in the DB, are getting added to the Users table, but, because they're unknown except for email address, they're not connected to an Org or an Agency and they have no role, name, phone number, etc.
- We want to text a token to new or signing in users as an additional verification step. This needs to be added into the flow.

## 2 Choices
1. Use next-auth callbacks to recognize and handle the various cases (returning, just signed in, just signed out, just added, etc.). See Callbacks section below. One could say this is the standard method.
2. Once the user enters an Email, in the Magic Link button handler, check the database or something before calling the next-auth signIn function. See the Preprocess section below. This method is non-standard.

### The Callbacks Method
Callbacks are asynchronous functions you can use to control what happens when an action is performed. Callbacks are extremely powerful, especially in scenarios involving JSON Web Tokens as they allow you to implement access controls without a database and to integrate with external databases or APIs. If you want to pass data such as an Access Token or User ID to the browser when using JSON Web Tokens, you can persist the data in the token when the jwt callback is called, then pass the data through to the browser in the session callback.

Note: we're using the JWT strategy for session management. We're also using a database, because it's required when using the Email (Magic Link) provider. No (or little useful) auth data is being kept in the database. The JWT is sent to the browser in a cookie. The cookie containing session is created on sign in and deleted on sign out.

#### How signing in with Magic Link works
A user has just entered an email and clicked a signin button. This signIn callback is called to determine what to do with that email address:
-  send it a magic link email to allow the user to complete signing in;
-  or redirect the user to a different flow (typically to registration--but not in our case).

The signIn callback normally determines if the user already exists in the Users collection in the database. Typically, if that were so, we know of the user; he'd been here before; and we'd send an email containing a magic link to the user. By clicking the magic link, the user has convinced us he's in the database, has a place in our structure and controls the entered email address.

In our design, however, a user doesn't self-register. A superadmin or an org or agency admin adds a new user (to an org or an agency) by entering the user's name, email, cell phone, role, etc. There is no need for user-driven registration. In fact, a brand new user looks exactly like a user who has actively signed out or is accessing via a new browser.

So we modify a bit what we return from this callback. There are 3 cases:
  1. The user is not found in the database.
  2. The user is in the database and left last time without signing out.
  3. The user is in the database but is signed out, either by having clicked the signout button
     at the top of every page or by accessing the site for the first time or from a browser that has not
     yet signed into the site. HOW DO WE RECOGNIZE THIS CASE?

Here are the actions we want to take in these 3 cases:
  1. Return a link to an error page that informs the user to contact his admin to add his user record correctly.
  2. Return true so that the auth system will send out a magic link.
  3. Return a link to a token entry page, explaining that, since the user is not presently signed in, we require
     the entry of such a token and that we will send the token to the user's cell phone at AAA-XXX-NNNN.
     Upon the user's click we generate a 5-digit random token, send it via SMS to the user's cell phone
     and await entry by the user. If the token is entered correctly, we sign the user in (HOW?) and take the
     user to his home page. If not, the user is DOA.

### The Preprocess Method
This method requires one important change to our process: a new user must be added either to an org or an agency by the org or agency admin; the user must be completely filled in.

Before processing the signIn method, we can check an entered email address against our Users table in the DB. This lets us take several actions.

If a user is not found with the entered email address, we can switch to an error escape page telling the user that he needs to be added to an Org or an Agency before he can sign in. There's no more we can do.

If a user is found in the database table, we know its data is complete (because we enforce that when the user is added). So we just have to determine if the user we signed in or signed out when he last visited the site. (If this is the first use of the site, this should look like being signed out.) We check sign in or signed out simply by the existence of a session cookie.

- Signed in:
- Signed out: