## *Overview*
There are four apps running on ICA's AWS server:
1. the main web server
1. emailer
1. breejob
1. filewatcherlocal

## *ICA app*
*ICA app* is the primary **Nextjs web server** for ICA. It listens on port 3000. It serves the full ICA web site.

An agency uploads completed call recordings using UploadCallRecordingsModal. The modal imports DragAndDrop2 which in turn calls /api/upload/route.js (in "calls" mode) to save the selected audio files to S3, and it adds an incomplete record to the **results** table in the DB. The record is incomplete because the call has yet to be transcribed or scored.

## *Filewatcherlocal* app
*filewatcher* is a **service app** whose purpose is to complete the processing of newly uploaded call recordings. Using Bree (cron functionality in Node), it runs every 40 minutes in production or every 60 seconds in dev. It queries the **results** table of the DB for newly added records (where restatus = 'NEW' and transcription and scoring information are empty). They are not complete because they have recently been uploaded and written to the DB, and hasve not yet been submitted to Deepgram for transcription and subsequent scoring. *filewatcher* queries the new records, loops through each of them, and performs result processing on each. It updates the result record in the DB, filling in its scoring information.

Result processing consists of these steps:
 - acquire a URL from S3 for the associated audio file;
 - call Deepgram with the audio URL for transcription;
 - score it when the transcription is back;
 - run the query to update the record in the results table, changing its restatus to 'SCORED' and storing transcription and scoring info.

**TBD**:
- I believe it's finished.
- may need better error handling.

## *Breejob* app
*breejob* is a **service app** whose purpose is to send informational emails to each org's admin users with a listing of agencies that did work on behalf of the org in the prior 24 hours. It runs just after midnight Eastern. It prepares and transmits an email to every org admin in the system. (If an org has more than one admin user, each receives the same email.) The emails display a table with one row for each of the org's agencies. Eeach row has three columns: Agency Name; Quantity of Call Recordings uploaded during the previous 24-hour period (and, thus, saved to the DB); a hyperlink that opens a web site that essentially is the bottom part of the Explore Scoring component.

**TBD**:
- date is undefined in line 234
- there's a comment in org-admin-emails (line 202) that finding modelId needs to use date yesterday
- the hyperlink may not be correctly formatted yet
- may need a better way to test in dev
- may need better error handling.

## *Emailer* app
*emailer* is a **Nextjs web server**. It listens on port 3050. Its purpose is to wait for an admin user to click the hyperlink embedded in the email sent by *breejob* to all org admins just after midnight (Eastern time) every night. The email contains an array of the admin's org's agencies, one per table row. Each entry identifies the agency and displays the number of recorded calls that that agency processed (sent in) during the preceding 24 hours. Each row also has a clickable hyperlink. Clicking it opens a browser and navigates to the *emailer* web server, passing in org id, agency id and the date to fetch and display. Although all hyperlinks apply to a single specific date, we are prepared to handle older saved emails as well as the current ones.

*emailer* is launched with 3 URL parameters: *orgId*, *agencyId* and *date*.

**TBD**:
- a lot needs to be done
- needs to be testable in dev
- may need better error handling.
