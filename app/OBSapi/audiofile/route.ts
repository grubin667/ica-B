import fs from "fs";
import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Endpoint serves only get with 1 required parameter: resultId.
// For safety, if resultId is missing, return empty result.

export async function GET(request: NextRequest) {

  // const resultId = request.nextUrl.searchParams.get("resultId");
  // let audioFile: any = null

  // try {

  //   if (resultId) {

  //     const resultObj = await prisma.result.findUnique({
  //       where: {
  //         id: resultId
  //       },
  //     })

  //     if (!resultObj) {

  //     }

  //     // Go get file at resultObj.diskFilename. Put it in audioFile.
  //     fs.readFile(resultObj?.diskFilename, (error, data) => {
  //       if (error) {
  //         throw error
  //       }
  //       audioFile = data;
  //     })
  //   }

  //   let json_response = {
  //     status: 'success',
  //     results: audioFile?.length ? 1 : 0,
  //     audioFile
  //   }
  //   return NextResponse.json(json_response)

  // } catch (error: any) {

    return new NextResponse(
      JSON.stringify(
        {
          status: "fail",
          message: "Could not read audio file from disk"
        }
      ), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  // }
}
