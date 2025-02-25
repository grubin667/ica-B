import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

// Endpoint serves PATCH (update 1 model by id)

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {

    const id = params.id;
    let json = await request.json();

    // id is id of the model where 

    const updated_model = await prisma.model.update({
      where: { id },
      data: json,
    });

    let json_response = {
      status: "success",
      data: {
        model: updated_model
      },
    };
    return NextResponse.json(json_response);
  } catch (error: any) {
    
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No Model with the provided ID Found",
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
