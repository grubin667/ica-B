// import fs from 'fs-extra';
import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Called with GET method at .../api/audio?id=<resultId>.
// On success, returns {status:"success",Results:1,data:"audio file content in base64"}

export async function GET(req: NextRequest) {

  try {
    const id = req.nextUrl.searchParams.get("id")

    if (!id) {
      let error_response = {
        status: "error",
        message: "No id received in request"
      }
      return new NextResponse(JSON.stringify(error_response), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`id on entry to /audio?id= route: ${id}`)

    // Retrieve results record from DB to get fields with which to construct bucketParams.
    const row = await prisma.result.findUnique({
      where: { id },
    });

    if (!row) {
      let error_response = {
        status: "error",
        message: "Unable to fetch audio file url: bad results.id"
      }
      return new NextResponse(JSON.stringify(error_response), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log(`Fetching audio file url from S3`)
    const s3 = new S3Client({});

    // const audioFile = await get_audio_file_url(row, s3);

    // // Send it back as object:
    // let json_response = {
    //   status: "success",
    //   audioFile
    // }
    // return new NextResponse(JSON.stringify(json_response))

    const oKey = `${row.agencyName}/${row.orgName}/${row.objectName}`
    const bucketParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: oKey,
    }
    const command = new GetObjectCommand(bucketParams);
    const audioFileUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // send audioFileUrl back as object:
    let json_response = {
      status: "success",
      audioFileUrl
    }
    return new NextResponse(JSON.stringify(json_response))

  } catch (error: any) {

    let error_response = {
      status: "error",
      message: error.message,
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
