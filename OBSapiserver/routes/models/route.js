import { prisma } from "../../lib/prisma"
import { NextResponse } from "next/server"

// Endpoints exist for these methods:
// GET -   returns the current unexpired model record matching orgId and agencyId;
//         called by SWR in edit-models-new with 2 parameters: orgId and agencyId;
//         queries ModelsOnAgenciesOnOrgs to retrieve the modelIds that match the orgId and agencyId;
//         narrows results to the 1 record for the org/agency pair that is currently not expired;
//         i.e., the one with activeThru = null;
//         there are a couple ways to do this:
//            1. modelsOnAgenciesOnOrgs.findFirst where orgId and agencyId and take -1 to get the last match
//            2. modelsOnAgenciesOnOrgs.findFirst where orgId and agencyId and activeThru = null
//         We're using method #1.
//         Once we have that modelId, we can use it to retrieve and return the model record for that modelId.
// POST -  called by components/common/doAgencyOrgModelWork after that component is called by add-agency or add-org;
//         adds a new Model record from request.body data;
//         it doesn't do anything with ModelsOnAgenciesOnOrgs, but doAgencyOrgModelWork does that immediately upon return;
//         since this is for a new org/agency pair, no old ModelsOnAgenciesOnOrgs needs to be expired;

export async function GET(request) {
  
  const orgId = request.nextUrl.searchParams.get("orgId")
  const agencyId = request.nextUrl.searchParams.get("agencyId")

  try {
    let models, modelIdArray

    if (orgId && agencyId) {
      modelIdArray = await prisma.modelsOnAgenciesOnOrgs.findFirst({
        where: {
          AND: [{ orgId: orgId }, { agencyId: agencyId }]
        },
        take: -1, // reverse the list
      })

      // let xxx = modelIdArray.map(m => m.modelId)

      models = await prisma.model.findMany({
        where: {
          id: modelIdArray.modelId
        },
        orderBy: {
          name: "asc"
        }
      })
    } else {
      models = []
    }

    let json_response = {
      status: "success",
      results: models.length,
      models
    }
    return NextResponse.json(json_response)
  } catch (error) {
    let error_response = {
      status: "error",
      message: error.message
    }
    return new NextResponse(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}

export async function POST(request) {
  try {
    const json = await request.json()

    const model = await prisma.model.create({
      data: json
    })

    let json_response = {
      status: "success",
      data: {
        model
      }
    }
    return new NextResponse(JSON.stringify(json_response), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    let error_response = {
      status: "error",
      message: error.message
    }
    return new NextResponse(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
