import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// This is the "catch-route" handler for the results table (/app/api/results/route.ts).
// There is also a "slug-route" handler (/app/api/results/[id]/route.ts).
// (See READMEs/routes.md for definitions.)
//
// This GET endpoint is called with 1 - 3 searchParams: orgId, date and agencyIds.
//    orgId is mandatory. It is a single org id.
//    date is optional. date, if used, is a string in mm/dd/yyyy format.
//    agencyIds is optional. If used, agencyIds is a string of comma-separated agency ids.
//
//  Called by:                                     Uses these searchParam(S):
//    a) emailserver/src/app/page.tsx                orgId, date, agencyIds (exactly 1 agencyId)
//        Returns all results uploaded by agency
//        agencyIds on date on behalf of org orgId.
//    b) app/components/modals/add-agency.jsx        orgId, agencyIds
//        Returns all results uploaded by ??? on 
//        behalf of org orgId for all dates.
//        WHY DOES THIS CARE ABOUT results???????????????????????
//    c) app/components/modals/explore-scoring.jsx   orgId (date and agency filtering are done back in explore-scoring)
//        Returns all results for org orgId uploaded 
//        by any agencies for all dates.
//
//
// Note:

// NOT IMPLEMENTED: If agencyIds is missing, return all results for the org across all its agencies.

// NEW 2/17/2025: added one more optional parameter, date.
// date will usually be used along with orgId. agencyIds is currently commented out. The inclusion of date
// means retrieve calls saved to the DB ony time on date.

export async function GET(request: NextRequest) {
  
  const orgId: string = request.nextUrl.searchParams.get("orgId") || "";
  const date: string = request.nextUrl.searchParams.get("date") || "";
  const agencyIds: string = request.nextUrl.searchParams.get("agencyIds") || ""; 

  try {

    let rslts, modelIdArray, expandedRslts

    // if (!agencyIds), get all results (for date, if present) for org orgId across all of its agencies

    modelIdArray = await prisma.modelsOnAgenciesOnOrgs.findMany({
      where: { orgId: orgId },
      select: { modelId: true }
    })

    // TODO need to modify so that each item in the rslts array is augmented with 
    // agency.id and agency.name. but I don't quite know how so I'm doing it below.
    // that's very inefficient and will need to be fixed.
    
    if (modelIdArray.length) {
    
      let xxx = modelIdArray.map(m => m.modelId)

      // TODO think about manually adding model with id [default] to xxx since there may be results with that modelId;
      // problem 1: in the result.findMany just below, we're calling for including model; this will
      //            fail unless we have a [default] model in the seed code; we do;
      // problem 2: in the block of code starting 10 lines down, we'd need to do something in
      //            modelsOnAgenciesOnOrgs, too; like either have every org/agency combo represented in
      //            the table with model [default]; note: these rows don't actually have to be in the
      //            table; they could be added manually;

      // rslts = await prisma.result.findMany({
      //   where: {
      //     modelId: { in: xxx }
      //   },
      //   include: {
      //     model: true,
      //   },
      //   orderBy: {
      //     transcriptionDatetime: 'desc'
      //   }
      // })
      rslts = await prisma.result.findMany()

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

