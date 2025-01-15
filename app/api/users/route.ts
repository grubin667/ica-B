import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Endpoints for GET (all or a limited number of users or 1 by email) and POST (create new).
// The email parameter is used at email entry/sign in.

export async function GET(request: NextRequest) {

  try {

    let uidArray

    // possible parameters
    const page_str = request.nextUrl.searchParams.get("page");
    const limit_str = request.nextUrl.searchParams.get("limit");
    const oid_str = request.nextUrl.searchParams.get("oid");
    const aid_str = request.nextUrl.searchParams.get("aid");
    const email_str = request.nextUrl.searchParams.get("email");

    let users;
    let user;

    // All we retrieve in this GET is users.
    // We can send back a pageful. Not in use at this time.
    // We can return all users in a specific org.
    // We can return all users in a specific agency.
    // We can return the single user with a specific email.

    if (page_str && limit_str) {

      const page = parseInt(page_str, 10) // page_str ? parseInt(page_str, 10) : 1;
      const limit = parseInt(limit_str, 10) // limit_str ? parseInt(limit_str, 10) : 10;
      const skip = (page - 1) * limit;

      users = await prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          orgs: { include: { org: true } },
          agencies: { include: { agency: true } }
        },
      });
    } else if (oid_str) {
      uidArray = await prisma.usersOnOrgs.findMany({
        where: { orgId: oid_str },
        // select: { agencyId: true }
      })
      users = await prisma.user.findMany({
        where: {
          id: { in: uidArray.map(u => u.userId) }
        },
        orderBy: {
          email: "asc"
        },
      })
    } else if (aid_str) {
      uidArray = await prisma.usersOnAgencies.findMany({
        where: { agencyId: aid_str },
        // select: { orgId: true }
      })
      users = await prisma.user.findMany({
        where: {
          id: { in: uidArray.map(u => u.userId) }
        },
        orderBy: {
          email: "asc"
        },
      })
    } else if (email_str) {
      user = await prisma.user.findUnique({
        where: { email: email_str }
      })
      if (user) {
        let json_response = {
          status: "success",
          results: 1,
          user
        };
        return NextResponse.json(json_response);
      } else {
        return new NextResponse(JSON.stringify({ status: "error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      users = await prisma.user.findMany({
        orderBy: {
          email: "asc"
        },
        include: {
          orgs: { include: { org: true } },
          agencies: { include: { agency: true } }
          // nothing else is available at this time
        },
      })
    }

    let json_response = {
      status: "success",
      results: users.length,
      users,
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

export async function POST(request: Request) {

  try {
    const json = await request.json();

    const user = await prisma.user.create({
      data: json,
    });

    let json_response = {
      status: "success",
      data: {
        user,
      },
    };
    return new NextResponse(JSON.stringify(json_response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      let error_response = {
        status: "fail",
        message: "User with email already exists",
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
