import { prisma } from "../../../lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { format } from 'date-fns';

// Endpoint serves PATCH (update 1 modelsonagenciesonorgs to expire it)
// We do this a bit non-standardly. The id that's passed in in the url
// is the id of the model that we want to mark as expired, because we're
// about to replace it with a new one.

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {

    const id = params.id;
    let json = await request.json();

    // id is id of the model whose junction record is going to be expired.

    // const updated_modelsonagenciesonorgs = await prisma.modelsOnAgenciesOnOrgs.update({
    //   where: { modelId: id },
    //   data: json,
    // });
    console.log(id)
    await prisma.$executeRaw(
      Prisma.sql`UPDATE modelsOnAgenciesOnOrgs SET activeThru = ${format(new Date(), "yyyy-MM-dd")} WHERE modelId = ${id}`
    )

    let json_response = {
      status: "success",
      // data: {
      //   model: updated_modelsonagenciesonorgs
      // },
    };
    return NextResponse.json(json_response);
  } catch (error: any) {
    
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No modelsonagenciesonorgs with the provided ID Found",
      };
      return new NextResponse(JSON.stringify(error_response), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

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
