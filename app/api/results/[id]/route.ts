import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

// This is the "slug-route" handler for the results table (/app/api/results/[id]/route.ts).
// There is also a "catch-route" handler (/app/api/results/route.ts).
// (See READMEs/routes.md for definitions.)
//

// This GET endpoint is called with a slug id holding desired resultId.
// It returns 1 row.

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
