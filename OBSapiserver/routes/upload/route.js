import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { formatISO } from "date-fns";
import { parse } from "csv-parse/sync";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// This endpoint supports file uploads to S3 when called by edit-models or upload-call-recordings via their
// embedded DragAndDrop1 and DragAndDrop2 components.
// They switch on formData.usage ("calls" or "models") after a small amount of common setup.
// See each code block (in the switch statement below) for more details.

const client = new S3Client({});

export async function POST(request) {

  try {

    const formData = await request.formData()

    // formData contains these fields (based on the value of usage):
    //
    // for both "calls" and "models":
    //      usage
    //      orgId
    //      agencyId
    //
    // only for "models":
    //      posFile   "" or string containing content of .csv file for positive; 
    //      negFile   "" or string containing content of .csv file for negative; 
    //      reqFile   "" or string containing content of .csv file for required; 
    //      name; 
    //      description; 
    //      posWeighting; 
    //      negWeighting; 
    //      reqWeighting; 
    //
    // only for "calls":
    //      file      a FileList

    const usage = formData.get("usage") // "calls" or "models"
    const orgId = formData.get("orgId") || ""
    const agencyId = formData.get("agencyId") || ""

    const emptyOrgId = orgId.length === 0
    const emptyAgencyId = agencyId.length === 0
    let org, agency

    switch (usage) {

      case "calls":
        /////////////////////////////////////////////////////////////////////////////////////
        // audio file uploading
        /////////////////////////////////////////////////////////////////////////////////////

        // Collect names of files that were or couldn't be saved to /surrogate/**.
        // On completion we'll return the 2 lists to client so they can be handled there,
        // e.g., delete successes from the grid while keeping failures, pointing out the problem.
        // Even if there are some erroredFilenames, we return success if any were saved.
        // Even though some validation was performed in DragAndDrop2, it could be spoofed.
        // To have reached this point, all the files have an audio mime type. The only failures
        // I can envision are disk problems, bad characters in filenames, etc.
        const erroredFilenames = []
        const savedFilenames = []

        try {

          const files = formData.getAll("file")
          console.log(`${files.length} files received for usage "${usage}"`)
          
          // 7 Aug 2024: New stuff uploads to AWS S3.
          // 1. check existence of bucket; create if missing
          //    1a. really shouldn't happen
          // 2. prepend agency-name/org-name/ onto filename to create "folder" structure
          // 3. write object to S3
          // 4. create record in database

          // AWS params for S3 differ for dev and prod
          // const aKey = process.env.AWS_ACCESS_KEY
          // const sKey = process.env.AWS_SECRET_ACCESS_KEY
          const bName = process.env.AWS_BUCKET_NAME

          if (emptyOrgId || emptyAgencyId || bName.length === 0) {
            let error_response = {
              status: "fail",
              message: "Invalid Agency or Org ID or S3 bucket name not found"
            }
            return new NextResponse(JSON.stringify(error_response), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            })
          }

          org = await prisma.org.findUnique({
            where: {
              id: orgId
            }
          })
          // console.log(JSON.stringify(org))

          agency = await prisma.agency.findUnique({
            where: {
              id: agencyId
            }
          })
          // console.log(JSON.stringify(agency))

          if (!org || !agency) {
            let error_response = {
              status: "fail",
              message: "Invalid Agency or Org ID"
            }
            return new NextResponse(JSON.stringify(error_response), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            })
          }

          // loop through all files, uploading one at a time
          for (let i = 0; i < files.length; i++) {

            const file = files[i]
            console.log(`Processing file ${i + 1} out of ${files.length}: ${file.name}...`)
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const key = `${agency.name}/${org.name}/${file.name}`

            let command = new PutObjectCommand({
              Bucket: bName,
              Key: key,
              Body: buffer
            })

            try {

              let response = await client.send(command);
              console.log(JSON.stringify(response))
              savedFilenames.push(file.name)

              // since we're assuming that errors will be thrown, if we get here, we assume success;
              // write an incomplete record in the results table of the database; it will be updated
              // later when the audio file is transcribed and scored.
              await prisma.result.create({
                data: {
                  bucketName: bName,
                  agencyName: agency.name,
                  orgName: org.name,
                  objectName: file.name,
                  // restatus: NEW by default
                }
              })
            } catch (e) {
              // TODO errors: is try/catch the real way to handle errors?
              // TODO what causes errors?
              // let error_response = {
              //   status: "error",
              //   message: "Error while trying to write audio file to surrogate"
              // }
              // return new NextResponse(JSON.stringify(error_response), {
              //   status: 500,
              //   headers: { "Content-Type": "application/json" }
              // })
              // throw new Error(file.name)
              console.error(e)
              erroredFilenames.push(file.name)
            }
          }

          let json_response = {
            status: "success",
            data: {
              erroredFilenames,
              savedFilenames
            }
          }
          return NextResponse.json(json_response);
        } catch (error) {

          
        }
      case "models":
        /////////////////////////////////////////////////////////////////////////////////////
        // edited .csv file(s) uploading
        //
        // Create new model and link to org/agency pair identified by orgId and agencyId.
        // Expire the former active model for the pair.
        /////////////////////////////////////////////////////////////////////////////////////

        // The edited csv strings are in posFile, negFile and reqFile.
        // At least 1 will be non-blank.

        if (emptyOrgId || emptyAgencyId) {
          let error_response = {
            status: "fail",
            message: "Invalid Agency or Org ID"
          }
          return new NextResponse(JSON.stringify(error_response), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          })
        }

        org = await prisma.org.findUnique({
          where: {
            id: orgId
          }
        })
        agency = await prisma.agency.findUnique({
          where: {
            id: agencyId
          }
        })

        if (!org || !agency) {
          let error_response = {
            status: "fail",
            message: "Invalid Agency or Org ID"
          }
          return new NextResponse(JSON.stringify(error_response), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          })
        }

        // (The Files in files have been validated on the client side. We can just use them here.)
        // Set up editContents as an array with 1, 2 or 3 elements; each looks like:
        // {
        //   name: "req" or "pos" or "neg"
        //   csv: [
        //     {w: 'and', wt: '1'},
        //     ...
        //   ]
        // }
        const editedContents = [];

        try {

          // The signature is parse(data, [options], callback).
          // The callback example takes the CSV string in the first argument (input),
          // options in the second argument, and a user callback in the third argument.
          // The callback receives any error thrown by the CSV parser in the first parameter (err),
          // or an array of records in the second argument (output). It returns an array.
          const options = {
            columns: true, // field names will be discovered in the first row
            skip_empty_lines: true,
          }

          let csv

          csv = formData.get("posFile");
          if (csv.length > 0) {
            editedContents.push(
              {
                name: 'pos',
                csv: parse(csv, options)
              }
            );
          }

          csv = formData.get("negFile");
          if (csv.length > 0) {
            editedContents.push(
              {
                name: 'neg',
                csv: parse(csv, options)
              }
            );
          }

          csv = formData.get("reqFile");
          if (csv.length > 0) {
            editedContents.push(
              {
                name: 'req',
                csv: parse(csv, options)
              }
            );
          }

          // Remember there are 5 additional fields in formData.
          // Extract them now and use them below.
          const name = formData.get("name")
          const description = formData.get("description")
          const posWeighting = parseInt(formData.get("posWeighting"), 10)
          const negWeighting = parseInt(formData.get("negWeighting"), 10)
          const reqWeighting = parseInt(formData.get("reqWeighting"), 10)

          // console.log(`editedContents: ${JSON.stringify(editedContents)}`)

          // parse and replace wt and add a 3rd col to each object in each csv - it is wc: word count
          for (let outer = 0; outer < editedContents.length; outer++) {
            const r = editedContents[outer]
            for (let inner = 0; inner < r.csv.length; inner++) {
              const c = r.csv[inner] // c is the is 1 element like {w: "facist", wt: 1}
              const word = c.word // the word or phrase whose words we need to count
              const weighting = parseInt(c.weighting, 10)
              const wordArray = word.trim().split(/\s+/) // word or phrase broken apart
              const wordCount = wordArray.length // num words in word or phrase

              r.csv[inner] = {
                w: word,
                wt: weighting,
                wc: wordCount
              }
            }
          }

          // console.log(`editedContents after parsing and counting: ${JSON.stringify(editedContents)}`)

          // console.log(`executing what used to be models PATCH`)

          // 1. The current active ModelsOnAgenciesOnOrgs should be last, so we get it with findFirst and take: -1.
          // console.log(`prisma finding 3-way join`)
          const step_1 = await prisma.modelsOnAgenciesOnOrgs.findFirst({
            where: {
              AND: [{ orgId: orgId }, { agencyId: agencyId }]
            },
            take: -1
          })
          // console.log(`prisma finding 3-way join - got back ${JSON.stringify(step_1)} - done`)
          const modelId = step_1?.modelId
          const id = step_1?.id
          // console.log(`${id} ${modelId}`)

          // 2. expire the 3-way junction record
          // console.log(`prisma expiring modelsOnAgenciesOnOrgs record with id=${id} 3-way join`)
          const activeThru = formatISO(new Date())
          const step_2 = await prisma.$executeRaw(
            Prisma.sql`UPDATE modelsonagenciesonorgs SET activeThru = ${activeThru} WHERE id = ${id}`
          )
          // console.log(`prisma expiring 3-way join - got back ${step_2} updated records - done`)

          // 3. fetch the Model user has edited and we are expiring...
          // console.log(`prisma fetching model we are expiring`)
          const theModel = await prisma.model.findUnique({
            where: { id: modelId }
          })
          // console.log(`prisma fetching model we are expiring - got back ${JSON.stringify(theModel)} - done`)

          // Set name and description in theModel.
          theModel.name = name
          theModel.description = description
          let modelParams = theModel.params

          // ...and update its params using whatever's included in editedContents...
          // console.log(`merging new data over old`)
          const params = JSON.parse(modelParams || "")

          // QUESTION: Do we want to set each sublist's weighting factor only if that list is being updated?
          // ANSWER: No. If we always set the weightings, it will be easier for someone to change just weighting factors.
          //         Therefore, we set weightings outside the forEach.
          params.positive.weight = posWeighting;
          params.negative.weight = negWeighting;
          params.required.weight = reqWeighting;

          editedContents.forEach(fr => {
            let prefix = fr.name.substring(0, 3)
            if (prefix === "pos") {
              params.positive.words = [...fr.csv]
            } else if (prefix === "neg") {
              params.negative.words = [...fr.csv]
            } else if (prefix === "req") {
              params.required.words = [...fr.csv]
            }
          })
          theModel.params = JSON.stringify(params)

          // before creating new one, remove last one's id prop
          delete theModel.id

          // ...and finally create the new Model record in the DB and return it
          // console.log(`prisma creating new model record from ${JSON.stringify(theModel)}`)
          const lastStep = await prisma.model.create({
            data: { ...theModel }
          })
          // console.log(`prisma creating new model record - got back ${JSON.stringify(lastStep)} - done`)

          const latest_step = { ...lastStep }

          const newJunctionRecord = {
            ...step_1,
            modelId: latest_step.id,
            activeThru: null
          }
          delete newJunctionRecord.id;
          // console.log(`adding this new junction table record - ${JSON.stringify(newJunctionRecord)}`)
          const reallyIsTheLastStep = await prisma.modelsOnAgenciesOnOrgs.create({
            data: { ...newJunctionRecord }
          })
          // console.log(`adding new junction table record - done`)

          // console.log(`returning success`)
          const json_response = {
            status: "success",
            data: { ...reallyIsTheLastStep }
          }
          return NextResponse.json(json_response)

          // }
        } catch (e) {

          return NextResponse.json(
            { error: e.message },
            { status: 500 }
          )

        }

      default:
        // console.log("Invalid usage")
        return NextResponse.json(
          { error: "Invalid usage setting." },
          { status: 500 }
        )
    }
  } catch (error) {

    let error_response = {
      status: "error",
      message: error.message,
    };
    return new Response(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
