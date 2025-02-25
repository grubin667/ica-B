import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Endpoints for GET (all) helps.

export async function GET(request: NextRequest) {

  try {

    let helps = await prisma.markdown.findMany({
      orderBy: {
        order: "asc"
      }
    })

    let json_response = {
      status: "success",
      results: helps.length,
      helps
    };

    return NextResponse.json(json_response);
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
