import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { formatISO } from "date-fns";

// Endpoint serves POST
// It performs these separate functions:
      //   (1) Find and expire the junction record for the old model.
      //   (2) Construct a new junction record linking the new model, agency and org.
      //   (3) POST the new junction record, inserting it into the DB.

export async function POST(request) {
  try {

    const json = await request.json();
    const newModelId = json.modelId;
    const orgId = json.orgId;
    const agencyId = json.agencyId;

    // read in all modelsOnAgenciesOnOrgs records for the org and agency
    let oldModelJunc = await prisma.modelsOnAgenciesOnOrgs.findMany({
      where: {
        activeThru: null,
        orgId,
        agencyId
     }
    });
    console.log(`${oldModelJunc.length} modelsOnAgenciesOnOrgs records found for org ${orgId} and agency ${agencyId}`);

    if (oldModelJunc.length === 1) {
      console.log(`updating the 1 found junction record to expired`)
      await prisma.modelsOnAgenciesOnOrgs.update({
        where: { id: oldModelJunc[0].id },
        data: { activeThru: formatISO(new Date())}
      });
    } else if (oldModelJunc.length === 0) {
      console.log(`there were 0 non-expired junction records for org ${orgId} and agency ${agencyId}`)
      console.log(`so we will create one`)
      // fall through to create
    } else {
      console.log(`there should have been only 1 non-expired junction record for org ${orgId} and agency ${agencyId}`)
      throw new Error("oldModelJunc.length !== 1");
    }

    console.log(`creating a new junction record for model ${newModelId}, org ${orgId} and agency ${agencyId}`)

    await prisma.modelsOnAgenciesOnOrgs.create({
      data: {
        modelId: newModelId,
        orgId: orgId,
        agencyId: agencyId,
        activeThru: null
      },
    });

    console.log(`it worked!`)

    let json_response = {
      status: "success",
      data: {
        msg: "Model/Agency/Org junction created"
      },
  
    };
    return NextResponse.json(json_response, { status: 201 });

  } catch (error) {

    if (error.code === "P2002") {
      let error_response = {
        status: "error",
        message: "Model/Agency/Org junction already exists",
      };
      return NextResponse.json(error_response, { status: 409 });
    }

    let error_response = {
      status: "error",
      message: error.message,
    };
    return NextResponse.json(error_response, { status: 500 });
  }
}
