
export async function POST(request) {

  try {

    const { name } = await request.json();

    // Get agency.
    const agency = await prisma.org.findUnique({
      where: {
        name
      },
    });

    const json_response = {
      name
    }
    return new Response(JSON.stringify(json_response), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {

  }
}
