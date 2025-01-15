import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

// Endpoint serve GET (one row by id).

// This is for results.

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  
  const id = params.id;
  const res = await prisma.result.findUnique({
    where: {
      id,
    },
    include: {
      model: true,
    },
  });

  if (!res) {
    let error_response = {
      status: "fail",
      message: "No result with the provided ID Found",
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let json_response = {
    status: "success",
    data: {
      result: res,
    },
  };
  return NextResponse.json(json_response);
}
