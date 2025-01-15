### *Emailer* app
The *emailer* app is a Nextjs web server. It runs on the AWS server, listening on port 3050. (The main app web server, *app*, listens on port 3000.) Its purpose is to wait for an admin user to click a link embedded in the email that is sent to all org admins just after midnight (Eastern time) every night. The email contains an array with one entry for each of the admin's org's agencies. Each entry identifies the agency and displays the number of recorded calls that that agency processed (sent in) during the preceding day for the org. Each row has a clickable hyperlink. Clicking it opens a browser and navigates to the *emailer* web server, passing in org id, agency id and the date of the data to fetch and display. The date is specified because in this first release of emailer all links apply to a single specific date, but we are prepared to handle saved old emails as well as new ones.

*emailer* is launched with 3 URL parameters: *orgId*, *agencyId* and *date*.


