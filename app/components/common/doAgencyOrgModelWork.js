
import { NextRequest, NextResponse } from "next/server";
import { getDefaultParamsJSON } from "./getDefaultParamsJSON";

export async function doAgencyOrgModelWork(agencyId, agencyName, orgId, orgName) {

  // doAgencyOrgModelWork is called by add-agency and add-org (which adds an internal agency).
  // It is called with agencyId, agencyName, orgId and orgName. The agency and org
  // are already in the DB.
  // Create a default model. Call /api/models/route (w/POST) to insert it into the Model table.
  // Set it aside (with its new id) in theModel.
  // Create a new record in ModelsOnAgenciesOnOrgs, using agencyId, orgId, modelId, linking the 3 objects.

  try {

    let theModel

    // Create a new default model.
    const newModel = {
      name: `default`,
      description: `model for ${agencyName}/${orgName}`,
      params: getDefaultParamsJSON("J") //build default model params obj and returns it stringified
    }

    console.log(2) // 2. Write new model to the DB. Save to theModel.

    let modelResponse = await fetch(`/api/models`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newModel)
    })

    console.log(3) // 3

    if (modelResponse.ok) {

      console.log(4) // 4

      const result = await modelResponse.json()

      console.log(5) // 5

      theModel = { ...result.data.model }
      // not returning to caller just yet - more to do below - then we'll return theModel

    } else {
      console.log(6) // 6
      throw new Error(
        `Did not work to create a new default model in the DB.`
      )
    }

    console.log(7) // 7. Write new modelsOnAgenciesOnOrgs to the DB. No need to save it.

    let modelsOnAgenciesOnOrgsResponse = await fetch(`/api/modelsonagenciesonorgs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        agencyId: agencyId,
        orgId: orgId,
        modelId: theModel.id
      })
    })

    console.log(8) // 8

    if (modelsOnAgenciesOnOrgsResponse.ok) {

      console.log(9) // 9

      const result2 = await modelsOnAgenciesOnOrgsResponse.json()
      // nothing else to do here, really, beyond returning success along with theModel

      console.log(10) // 10

      // send model back to caller
      let json_response = {
        status: "success",
        data: {
          model: theModel
        }
      }
      return NextResponse.json(json_response);
  
    } else {

      console.log(11) // 11

      throw new Error("Could not connect new default model with agency and org in the DB")
    }
  } catch (error) {

    // alert(`Error received from someplace in process of assigning default model to agency/org pair: ${error.message}`)
    let error_response = {
      status: "error",
      message: error.message
    }
    return new Response(JSON.stringify(error_response), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
