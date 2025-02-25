

export async function POST(request) {

  try {

    const json = await request.json();

    const url = "https://messaging.esendex.us/Messaging.svc/SendMessage";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        'Body': `"These aren't the droids you're looking for." But this is the token: "${json.token}"`,
        'LicenseKey': json.key,
        'To': [json.to],
        'UseMMS': false
      }),
    });
    const messages = await response.json();

    let json_response = {
      status: 'success',
      results: messages
    }
    return Response.json(json_response)
  } catch (error) {

    let error_response = {
      status: "error",
      message: error.message,
    };
    return new Response(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
