import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Endpoint serves POST (create new).

export async function POST(request: Request) {
  try {
    const json = await request.json();

    await prisma.usersOnAgencies.create({
      data: json,
    });

    let json_response = {
      status: "success"
    };
    return new NextResponse(JSON.stringify(json_response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      let error_response = {
        status: "fail",
        message: "Agency/User junction already exists",
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
