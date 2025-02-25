import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Endpoints serve GET (get many) and POST (create new).

export async function GET(request: NextRequest) {
  try {

    let aidArray

    // possible parameters
    const page_str = request.nextUrl.searchParams.get("page");
    const limit_str = request.nextUrl.searchParams.get("limit");
    const oid_str = request.nextUrl.searchParams.get("oid");
    let agencies

    // All we retrieve in this GET is agencies.
    // We can send back a pageful. Not in use at this time.
    // We can return all agencies used by a specific org. Used by orgcommon.
    // If no parameters, we will return all agencies, as used in superadmin.

    if (page_str && limit_str) {
      const page = page_str ? parseInt(page_str, 10) : 1;
      const limit = limit_str ? parseInt(limit_str, 10) : 10;
      const skip = (page - 1) * limit;

      agencies = await prisma.agency.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (oid_str) {
      
      aidArray = await prisma.agenciesOnOrgs.findMany({
        where: { orgId: oid_str},
      })

      agencies = await prisma.agency.findMany({
        where: {
          id: { in: aidArray.map(a => a.agencyId) }
        },
        orderBy: {
          name: "asc"
        },
        include: {
          users: { include: { user: true } },
        }
      })
    } else {
      agencies = await prisma.agency.findMany({
        orderBy: {
          name: "asc"
        },
        include: {
          // orgs and users are related to agencies by models AgenciesOnOrgs and UsersOnAgencies. These 2 models
          // have an agencyId and info about the related entity. So, within each agency every item in orgs and users
          // will have agencyId = the id of the agency.
          // If we were to use, e.g., {orgs: true}, the orgs property in each agency would consist of only the fields
          // in the AgenciesOnOrgs junction table.
          // By using {orgs: { include: { org: true } }}, the org object is added to each record from the junction table.
          // We use the same style for users because we need several user properties in our table.
          orgs: { include: { org: true } },
          users: { include: { user: true } },
          // models might be available
        },
      })
    }

    let json_response = {
      status: "success",
      results: agencies.length,
      agencies,
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
    const agency = await prisma.agency.create({
      data: json,
    });
    let json_response = {
      status: "success",
      data: {
        agency,
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
        message: "Agency with name already exists",
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
