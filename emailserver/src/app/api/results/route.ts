import exp from "constants";
// import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Endpoint serves only get with 1 or 2 searchParams: orgId (req.) and agencyIds (opt.).
// orgId is always required.
// agencyIds may be left off the request. If present it will be a single id or a string of multiple
// comma-separated ids. In either case it's probably best to put it in quotation marks.
// If both are present, return results matching orgId across all agencyIds entered.
// If agencyIds is missing, return all results for the org across all its agencies.

export async function GET(request: NextRequest) {
  
  const orgId: string = request.nextUrl.searchParams.get("orgId") || "";
  // let agencyIds: string = request.nextUrl.searchParams.get("agencyIds");

  try {

    let rslts, modelIdArray, expandedRslts

    // if (!agencyIds) {
    // get all results for org orgId across all of its agencies

    // modelIdArray = await prisma.modelsOnAgenciesOnOrgs.findMany({
    //   where: { orgId: orgId },
    //   select: { modelId: true }
    // })

    // TODO need to modify so that each item in the rslts array is augmented with 
    // agency.id and agency.name. but I don't quite know how so I'm doing it below.
    // that's very inefficient and will need to be fixed.
    if (modelIdArray.length) {

      let xxx = modelIdArray.map(m => m.modelId)

      // TODO think about manually adding model with id [default] to xxx since there may be results with that modelId;
      // problem 1: in the result.findMany just below, we're calling for including model; this will
      //            fail unless we have a [default] model in the seed code;
      // problem 2: in the block of code starting 10 lines down, we'd need to do something in
      //            modelsOnAgenciesOnOrgs, too; like either have every org/agency combo represented in
      //            the table with model [default]; note: these rows don't actually have to be in the
      //            table; they could be added manually;

      rslts = await prisma.result.findMany({
        where: {
          modelId: { in: xxx }
        },
        include: {
          model: true,
        },
        orderBy: {
          transcriptionDatetime: 'desc'
        }
      })

      // the following is what needs to be incorporated into the findMany above.
      expandedRslts = []
      for ( const rslt of rslts ) {
        // rslt contains a modelId prop.
        // use modelId to get agencyId from modelsOnAgenciesOnOrgs. I think it'll be unique.
        // also use agencyId to get agency.name.
        // add them to rslt and push to expandedRslts.
        let modelId = rslt.model.id
        let moaoo = await prisma.modelsOnAgenciesOnOrgs.findFirst({
          where: {
            modelId: modelId
          },
        })
        let agencyName = await prisma.agency.findUnique({
          where: {
            id: moaoo?.agencyId
          },
          select: {
            name: true
          }
        })
        expandedRslts.push({ ...rslt, agencyId: moaoo?.agencyId, agencyName: agencyName})
      }

    } else {
      expandedRslts = []
    }

    let json_response = {
      status: 'success',
      results: expandedRslts.length,
      rslts: expandedRslts
    }
    return NextResponse.json(json_response)
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

// } 
// else {
//   // get only thos results that match org orgId AND agencyId in agencyIds

//   let agencyIdsArray = agencyIds.split('.');
//   modelIdArray = await prisma.modelsOnAgenciesOnOrgs.findMany({
//     where: {
//       AND: [
//         { orgId: orgId },
//         { agencyId: { in: agencyIdsArray } }
//       ]
//     },
//     select: { modelId: true }
//   })

//   if (modelIdArray.length) {
//     let xxx = modelIdArray.map(m => m.modelId)
//     rslts = await prisma.result.findMany({
//       where: {
//         modelId: { in: xxx }
//       },
//       include: {
//         model: true,
//       },
//       orderBy: {
//         transcriptionDatetime: 'desc'
//       }
//     })
//   } else {
//     rslts = []
//   }

//   let json_response = {
//     status: 'success',
//     results: rslts.length,
//     rslts,
//   }
//   return NextResponse.json(json_response)
// }

// try {

//   let rslts, modelIdArray

//   if (orgId && agencyId) {

//     modelIdArray = await prisma.modelsOnAgenciesOnOrgs.findMany({
//       where: {
//         AND: [
//           { orgId: orgId },
//           { agencyId: agencyId }
//         ]
//       },
//       select: { modelId: true }
//     })
//     if (modelIdArray.length) {
//       let xxx = modelIdArray.map(m => m.modelId)
//       rslts = await prisma.result.findMany({
//         where: {
//           modelId: {in: xxx}
//         },
//         include: {
//           model: true,
//         },
//         orderBy: {
//           transcriptionDatetime: 'desc'
//         }
//       })
//     } else {
//       rslts = []
//     }
//   } else {
//     rslts = await prisma.result.findMany({
//       orderBy: {
//         transcriptionDatetime: 'desc'
//       },
//       include: {
//         model: true
//       }
//     })
//   }

//   let json_response = {
//     status: 'success',
//     results: rslts.length,
//     rslts,
//   }
//   return NextResponse.json(json_response)

