import { format, formatISO, interval, lastDayOfDecade, subDays } from 'date-fns';
import path from 'node:path';
import fs from 'node:fs';
import { sgMail } from '../getSgMail.cjs';
import { mariadb } from '../getMaria.cjs'; // will be enabled when using results table in DB
import Handlebars from 'handlebars';
import { parentPort } from 'node:worker_threads';
import process from 'node:process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                       THE FULL STORY: a fairly deep dive
//
// TODO: THE FOLLOWING IS A BIT OBSOLETE. IT NEEDS TO BE EDITED.
//
// Agencies use the ICA website to upload call recordings to our server throughout the day. Filewatchlocal watches
// the directory (structure) where they are accumulated. When one arrives, it is sent to Deepgram for transcription.
// We then use the scoring model currently in place for the agency and its org. We use it along with our proprietary
// scoring algorithm to calculate several compliance metrics for the audio recording. These scores are stored in the
// results table in the DB, and the audio file is moved to a cool storage area, always to be accessible for listening,
// reprocessing, etc.
//
// Every night, just after midnight, we query the database for results uploaded during the preceding day and set up emails
// to each active org in the DB. The emails will be sent to each of each active org's admin users. (We do not distinguish
// between org admins in an org; they are all treated equally and they will all receive the same email.)
//
// The file you're reading (Breejob) contains the code that runs at midnight every night. It fetches the information
// needed for us to compose each org's (admin's) email. Each email contains a 3-column table (agency name, number of
// results yesterday, and a link so that a recipient can view the results of that agency's results by jumping directly
// into the Explore Scoring page with appropriate parameters).
//
// Here is a description of the steps we take to fetch and send the emails.
//
// - We are called (in production) at 12:01am every night.
// - We open a connection (conn) to the DB along with performing a few other setup tasks.
// - We use conn.execute() to fetch all active orgs and each of their admins from the DB.
// - Because we connected with options containing rowsAsArray=true, we got back an array of rows
//   where each row is for a single org, but it isn't quite formatted as we want and it is missing the org's agencies.
// - In an async loop over each row, we build the org object we want to send an email to. 
// - For each row's org, build an org object using the format shown in dbFormat.
//   Fetch all of its active agencies from the DB.
// - For each agency, we fetch the number of results uploaded yesterday.
// - Use org, now that it is complete, to build an email to go to each org's admin user.
// - Execute the template-based function and send the returned HTML email to the admin.
// - Close the connection.
//
// We open and close the connection each time we're called. In production, this makes sense, since that's
// every 24 hours. In development, we don't care about the performance hit.
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// INITIALIZATION.

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  process.exit(1);
});

let conn;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// declare and set __dirname and __filename since they're not available when using ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register several custom Handlebars helpers.

Handlebars.registerHelper('formatDate', () => {
  return format(subDays(new Date(), 1), 'EEEE, MMMM d, yyyy');
});

Handlebars.registerHelper("link", function (text, url) {
  var url = Handlebars.escapeExpression(url),
    text = Handlebars.escapeExpression(text)
  return new Handlebars.SafeString("<a href='" + url + "'>" + text + "</a>");
});

// Fetch and precompile our handlebars template, final.hbs, creating a templating function that will be
// used to construct each org admin email we're going to send.
const emailTemplate = fs.readFileSync(path.join(__dirname, "./templates/final.hbs"), "utf8");
const templateFunction = Handlebars.compile(emailTemplate);

// things to change:
//   we assume no leading or trailing spaces
//   also we may want to combine these 2 calls into a single one
const first = (fullName) => {
  return fullName.split(' ')[0];
}
const last = (fullName) => {
  return fullName.split(' ')[1];
}

try {

  // DB connection - options are appended to the DB URL
  conn = await mariadb.createConnection(process.env.DB_URL); // top-level await
  console.log("Connected to DB! connection id is " + conn.threadId);

  // Retrieve all orgs joined with their admins
  const sqlString1 = `
    SELECT
      o.name AS orgName,
      o.id AS orgId,
      u.name AS adminName,
      u.email AS adminEmail
    FROM orgs o
      INNER JOIN usersonorgs uoo
        ON uoo.orgId = o.id
      INNER JOIN users u
        ON u.id = uoo.userId
    WHERE uoo.isOrgAdmin = 1
    AND o.active = 1;
  `;

  const orgs = await conn.execute(sqlString1);

  if (orgs.length === 0) {
    console.log(`*** Received no rows from orgs query ***`)
    throw new Error(`*** Received no rows from orgs query ***`);
  }

  //////////////////////////////////////////////////////////////////////
  // HAVE array containing info for all orgs (w/o their agencies and not suitably formatted
  //   for use with the template).
  // LOOP through the org objects. For each one, format it into a real org object as expected by template.
  // FETCH all of current org's active agencies; model covering org, agency, yesterday;
  //   results counts; and create and send the email.
  // PROCEED to the next org.
  //////////////////////////////////////////////////////////////////////

  // Each row in orgs represents a single org and contains one of its admin users.
  // If an org has more than 1 admin, we'll send identical emails to each of them.
  // Loop through the orgs/admins in an async-friendly way; i.e., not using forEach.
  // Fetch the agencies that belong to the org. For each agency associated with the org
  // retrieve the results counts (from yesterday) for that agency.
  // Add the agencies to the org. Process the org, resulting in an email to the org's admin(s).

  for (let i = 0; i < orgs.length; i++) {

    const dbOrg = orgs[i];

    const org = {
      orgName: dbOrg.orgName,
      orgId: dbOrg.orgId,
      admin: {
        firstName: first(dbOrg.adminName),
        lastName: last(dbOrg.adminName),
        email: dbOrg.adminEmail
      },
      orgAgencies: []
    };

    //////////////////////////////////////////////////////////////////////
    // HAVE a single org, now formatted and including admins. But w/o agencies.
    //////////////////////////////////////////////////////////////////////

    // Get all of the current org's active agencies.
    const sqlString2 = `
      SELECT agencies.id as agencyId, agencies.name as agencyName
      FROM agenciesonorgs
          INNER JOIN
          agencies
          ON agenciesonorgs.agencyId = agencies.id
      WHERE agenciesonorgs.orgId = ? AND
            agencies.active = 1
      ;`;
    const values2 = [org.orgId];
    const agencies = await conn.execute(sqlString2, [...values2]);

    //////////////////////////////////////////////////////////////////////
    // HAVE array containing info for all agencies for current org
    // LOOP through the agencies. For each org/agency pair, determine modelId
    //   for model that was active yesterday and use it to fetch results counts for
    //   the org/agency/yesterday combo. Compose agency object and push to orgAgencies array in org.
    //////////////////////////////////////////////////////////////////////

    // For each agency, fetch the number of results uploaded yesterday.
    // const sqlString3 = `
    //         select count(*) as numResults from results
    //               where STR_TO_DATE(transcriptionDatetime, '%Y-%m-%dT%T') >= NOW() - INTERVAL 1 DAY
    //                 and STR_TO_DATE(transcriptionDatetime, '%Y-%m-%dT%T') < NOW();
    //     `;
    // const values = [orgName, agencyName];
    // const counts = await conn.execute(sqlString3, [...values]);

    for (let j = 0; j < agencies.length; j++) {

      const dbAgency = agencies[j];

      // HAVE org and, now, dbAgency.
      // FETCH modelId for yesterday serving these this org/agency pair.
      // const sqlString4 = `
      //       select modelId from modelsonagenciesonorgs
      //             where orgId = ?
      //               and agencyId = ?
      //               and active = 1
      //               and STR_TO_DATE(created, '%Y-%m-%dT%T') >= NOW() - INTERVAL 1 DAY
      //               and STR_TO_DATE(created, '%Y-%m-%dT%T') < NOW();
      //   `;
      // TODO the following will need to be changed - it doesn't use date yesterday
      const sqlString4 = `
        SELECT modelId FROM modelsonagenciesonorgs
          WHERE orgId = ? AND agencyId = ?
          ORDER BY activeFrom DESC
          LIMIT 1
        ;
      `;
      const values = [org.orgId, dbAgency.agencyId];
      const modelId = await conn.execute(sqlString4, [...values]);

      if (modelId.length === 0) {
        console.log(`*** modelId not found for org ${org.orgName} and agency ${dbAgency.agencyName} ***`)
        continue;
      }
      const modelIdValue = modelId[0].modelId;

      // HAVE org, agency, and modelId.
      // FETCH number of results for this model.
        const sqlString5 = `
            select count(*) as numResults from results
                  where modelId = ?
                    and STR_TO_DATE(transcriptionDatetime, '%Y-%m-%dT%T') >= NOW() - INTERVAL 1 DAY
                    and STR_TO_DATE(transcriptionDatetime, '%Y-%m-%dT%T') < NOW();
        `;
      const values5 = [modelIdValue];
      const counts = await conn.execute(sqlString5, [...values5]);
      const numResultsValue = counts[0].numResults;

      const emailClickUrlTemplate = process.env.EMAIL_CLICK_URL_TEMPLATE;
      console.log(org.id)
      console.log(dbAgency.agencyId)
      console.log(date)
      const substStr = `orgId=${org.id}&agencyId=${dbAgency.agencyId}&date=${date}`;
      console.log(substStr)
      const url = emailClickUrlTemplate.replace("<append params>", substStr);
      console.log(url)

      org.orgAgencies.push({
        agencyName: dbAgency.agencyName,
        numResults: numResultsValue,
        agencyId: dbAgency.agencyId,
        url: url // ilClickUrl(org.id, dbAgency.agencyId, date)
      });
    }

    // org is complete. gen and send the email. then move on to next org.

    const messageBody = (templateFunction(org))

    const msg = {
      to: process.env.NODE_ENV === 'development' ? 'jerry@callauditors.com' : org.admin.email,
      from: "info@callauditors.com",
      subject: 'Your results for the past 24 hours',
      text: 'Hello',
      html: messageBody
    }

    sgMail
      .send(msg)
      .then((response) => {
        console.log('status code: ', response[0].statusCode)
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        // If we just processed the last item in orgs, send message to parent process and exit.
        if (i === orgs.length - 1) {
          if (parentPort) parentPort.postMessage('done');
          else process.exit(0);
        }
      })
  }
} catch (err) {
  console.log("SQL error in establishing a connection: ", err);
} finally {
  if (conn) conn.close();
}
