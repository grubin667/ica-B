import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

// Endpoint serve GET (one row by id).

// This is for help files.

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  
  const id = params.id;
  const res = await prisma.markdown.findUnique({
    where: {
      id,
    }
  });

  if (!res) {
    let error_response = {
      status: "fail",
      message: "No markdown item with the provided ID Found",
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let json_response = {
    status: "success",
    data: {
      help: res,
    },
  };
  return NextResponse.json(json_response);
}
