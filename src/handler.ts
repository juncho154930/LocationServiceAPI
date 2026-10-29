import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { LocationInput } from "./data";
import {
  createLocation,
  getLocation,
  listLocations,
  updateLocation,
} from "./db";
import { geocode } from "./geocode";

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

function parseInput(
  body: string | undefined,
  locationId?: string,
): LocationInput {
  const res = JSON.parse(body ?? "{}");
  const id = locationId ?? res.locationId;

  if (!id || !res.locationName || !res.city || !res.state || !res.country) {
    throw new Error("missing required fields");
  }

  return {
    locationId: id,
    locationName: res.locationName,
    city: res.city,
    state: res.state,
    country: res.country,
  };
}

export const handler = async (event: APIGatewayProxyEventV2) => {
  const locationId = event.pathParameters?.locationId;

  try {
    switch (event.routeKey) {
      case "POST /locations": {
        const input = parseInput(event.body);
        const location = { ...input, ...(await geocode(input)) };
        await createLocation(location);
        return json(200, location);
      }

      case "PUT /locations/{locationId}": {
        const input = parseInput(event.body, locationId);
        const location = { ...input, ...(await geocode(input)) };
        await updateLocation(location);
        return json(200, location);
      }

      case "GET /locations/{locationId}": {
        const location = await getLocation(locationId!);
        if (!location) throw new Error("location not found");
        return json(200, location);
      }

      case "GET /locations":
        return json(200, await listLocations());

      default:
        throw new Error("invalid route");
    }
  } catch (err) {
    console.error(err);
    return json(400, { message: (err as Error).message });
  }
};
