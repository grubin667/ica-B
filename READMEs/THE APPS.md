## Overview
There are four apps running on ICA's AWS server:
1. the main web server
1. mailer
1. reejob
1. ilewatcherlocal

## *ICA app*
*ICA app* is the primary **Nextjs web server** serving our clients. It listens on port 3000. It serves the full ICA web site.

## *Emailer* app
*emailer* is a **Nextjs web server**. It listens on port 3050. Its purpose is to wait for an admin user to click the hyperlink embedded in the email sent by *breejob* that is sent to all org admins just after midnight (Eastern time) every night. The email contains an array with one entry for each of the admin's org's agencies. Each entry identifies the agency and displays the number of recorded calls that that agency processed (sent in) during the preceding day. Each row has a clickable hyperlink. Clicking it opens a browser and navigates to the *emailer* web server, passing in org id, agency id and the date of the data to fetch and display. The date is specified because in this first release of emailer all links apply to a single specific date, but we are prepared to handle older saved emails as well as new ones.

*emailer* is launched with 3 URL parameters: *orgId*, *agencyId* and *date*.

## *Breejob* app
*breejob* is a **service app**. It runs once a day, just after midnight Eastern. It prepares and transmits an email to every org admin in the system. (If an org has more than one admin user, each receives the same email.) The emails display a table with one row for each of the org's agencies. Eeach row has three columns: Agency Name; Quantity of Call Recordings uploaded during the previous 24-hour period (and, thus, saved to the DB); a hyperlink that opens a web site that essentially is the bottom part of the Explore Scoring component.

## *Filewatcherlocal* app
*filewatcher* is a **service app**. Using Bree, it runs every 2,400 seconds (40 minutes) in production and every 60 seconds in dev. It queries the results table of the DB for newly added reults records (restatus === 'NEW'). Then it loops through the records, processes each one, and updates the result to fill in its scoring information.

Typically, result processing consists of these steps:
 - read audio file from S3;
 - call Deepgram with the audio content for transcription;
 - score it;
 - run query to update the record in the results table, changing its restatus and storing transcription and scoring info.

