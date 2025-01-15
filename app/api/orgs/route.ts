import { prisma } from "../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Endpoints serve GET (all or a pageful) and POST (create new).

export async function GET(request: NextRequest) {
  try {

    let oidArray

    // possible parameters
    const page_str = request.nextUrl.searchParams.get("page");
    const limit_str = request.nextUrl.searchParams.get("limit");
    const aid_str = request.nextUrl.searchParams.get("aid");
    let orgs

    // All we retrieve in this GET is orgs.
    // We can send back a pageful. Not in use at this time.
    // We can return all orgs with which a specific agency does business. Not used yet.
    // If no parameters, we will return all orgs, as used in superadmin.

    if (page_str && limit_str) {
      const page = page_str ? parseInt(page_str, 10) : 1;
      const limit = limit_str ? parseInt(limit_str, 10) : 10;
      const skip = (page - 1) * limit;
  
      orgs = await prisma.org.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (aid_str) {
      oidArray = await prisma.agenciesOnOrgs.findMany({
        where: { agencyId: aid_str},
      })

      // oidArray is an array of full records from AgenciesOnOrgs having agencyId === aid_str.
      // Each record has orgId, of course, but also a shareLink (which may be empty, but just for seed data).
      // When fetching orgs, we need to add the shareLink to each org that is returned.
      orgs = await prisma.org.findMany({
        where: {
          id: { in: oidArray.map(o => o.orgId) }
        },
        orderBy: {
          name: "asc"
        },
        include: {
          users: { include: { user: true }},
        },
      })
      // Since I don't know how to add shareLinks to each record while in Prisma findMany, I'll do it now.
      orgs.forEach(o => {
        o.shareLink = oidArray.find((element) => element.orgId === o.id).shareLink || ''
      })
    } else {
      orgs = await prisma.org.findMany({
        orderBy: {
          name: "asc"
        },
        include: {
          // agencies and users are related to orgs by models AgenciesOnOrgs and UsersOnOrgs. These 2 models
          // have an orgId and info about the related entity. So, within each org every item in agencies and users
          // will have orgId = the id of the org.
          // If we were to use, e.g., {agencies: true}, the agencies property in each org would consist of only the fields
          // in the AgenciesOnOrgs junction table.
          // By using {agencies: { include: { agency: true } }}, the agency object is added to each record from the junction table.
          // We use the same style for users because we need several user properties in our table.
          agencies: { include: { agency: true } },
          users: { include: { user: true }},
          // models might be available
        },
      })
    }

    let json_response = {
      status: "success",
      results: orgs.length,
      orgs,
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

    const org = await prisma.org.create({
      data: json,
    });

    let json_response = {
      status: "success",
      data: {
        org,
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
        message: "Org with name already exists",
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
