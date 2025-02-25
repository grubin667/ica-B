import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

// This is a great model for an API route with an id that handles the three cases: GET, PATCH, DELETE.
// /api/orgs/[id]/route and /api/agencies/[id]/route use similar logic

// Endpoints for GET (one user by id), PATCH (update one user by id) and DELETE (one user by id).
// I believe that GET will be called only for the signed in user and only from
// the useUser hook. Once back in useUser we will calculate nativeRole and
// availableRoles (for emulation) and set them into UserContext.

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      orgs: { include: { org: true } },
      agencies: { include: { agency: true } }
    },
  });

  if (!user) {
    let error_response = {
      status: "fail",
      message: "No user with the provided ID found",
    };
    return new NextResponse(JSON.stringify(error_response), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let json_response = {
    status: "success",
    user,
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

    const updated_user = await prisma.user.update({
      where: { id },
      data: json,
    });

    let json_response = {
      status: "success",
      data: {
        user: updated_user,
      },
    };
    return NextResponse.json(json_response);
  } catch (error: any) {
    
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No user with the provided ID Found",
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
    await prisma.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === "P2025") {
      let error_response = {
        status: "fail",
        message: "No user with the provided ID Found",
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
