import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Endpoint serves:
//   POST to create new record that is missing shareLink

export async function POST(request: Request) {
  try {
    const json = await request.json();
    console.log(` in agenciesonorgs/route: json = ${JSON.stringify(json)}`);
    await prisma.agenciesOnOrgs.create({
      data: json,
    });

    let json_response = {
      msg: "success linking agency to org"
    };
    return new NextResponse(JSON.stringify(json_response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      let error_response = {
        status: "fail",
        message: "Agency/Org junction already exists",
      };
      return new NextResponse(JSON.stringify(error_response), {
        status: 409,
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
