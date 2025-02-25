import { prisma } from "../../../lib/prisma";
import { NextResponse } from 'next/server';

// Endpoints serve GET (one row by id), PATCH (update one row by id) and DELETE (one row by id).

// This is for agencies.

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const agency = await prisma.agency.findUnique({
    where: {
      id,
    },
  });

  if (!agency) {
    let error_response = {
      status: "fail",
      message: "No Agency with the provided ID Found",
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let json_response = {
    status: "success",
    data: {
      agency,
    },
  };
  return NextResponse.json(json_response);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    let json = await request.json();

    const updated_agency = await prisma.agency.update({
      where: { id },
      data: json,
    });

    let json_response = {
      status: "success",
      data: {
        agency: updated_agency,
      },
    };
    return NextResponse.json(json_response);
  } catch (error: any) {
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No Agency with the provided ID Found",
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await prisma.agency.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No Agency with the provided ID Found",
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
