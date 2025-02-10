# This is important info about writing and fetching to/from the database.
Whenever a client component needs to read from or write to the database, it calls an endpoint in /app/api. There are two ways to do so: if the component is fetching data from the DB, it uses SWR to call the endpoint; for all other purposes, it uses the fetch API which has replaced XMLHttpRequest in the JS ecosystem. There's not much difference between the SWR and fetch approaches, and with Next's expansion of fetch there's even less difference.

The routes in /app/api are kept in folders depending on which database table they're using. Inside each of those folders there is an "[id]" folder containing a route.ts that is used for id-specific access and another route.ts for all non-id-specifc access. We'll refer to them as slug-route and catch-route, respectively.

***Slug-routes*** serve endpoints that require an id. They refer to one database record. These are the GET, PATCH and DELETE request methods. GET fetches one record, identified by id, from the DB. PATCH updates one record, usually applying partial modifications to the resource with only the props being changed included in req.body. PATCH returns response code 204 if it doesn't carry a payload or code 200 if it does. DELETE (which isn't being used anywhere in the app at this time) deletes the database record identified by id. Note: Not all of the methods require or allow a body as part of the request.

***Catch-routes*** serve endpoints for GET and POST. These methods are id-free, but they may contain query strings. GET returns multiple records (optionally using explicit search params to limit results). POST is used to add a new database record. For POST, the data, everything that's needed but the id, is sent in req.body.

Examples:
- To get a user with id ***xxx*** use: /api/users/xxx (slug CATCH)
- To get all users use: /api/users (catch GET)
- To get 10 users starting on page 3 use: /api/users?page=3&limit=10 (catch GET)
- To get all users attached to org ***xyz*** use: /api/users?oid=xyz (catch GET)

**Note:** In this app, fetching users, whether one or many, always returns user objects {user, availableRoles} with the user containing a role property object {admin, orgId, agencyId} and availableRoles being an array of emulation choices. To fetch all user records without roles and availableRoles, we could use: /api/users?bare=true. Similarly, if we want just a single user record as it comes from the database, we could use: /api/users/xxx?bare=true. (Fetching doesn't handle these last two cases at this time.)

