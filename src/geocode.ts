import type { LocationInput } from "./data";

export async function geocode({ city, state, country }: LocationInput) {
  // We need to store the Location ID, Location Name, City, State, Longitude, Latitude, and Country where the branch is located.
  // county is not part of requirement
  const params = new URLSearchParams({
    city,
    country,
    state,
    format: "jsonv2",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { "User-Agent": "location-service-api" }, // required by nominatim
    },
  );
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

  const results = (await res.json()) as { lat: string; lon: string }[];
  const firstRes = results[0];
  if (!firstRes) throw new Error("location could not be found");

  return { latitude: firstRes.lat, longitude: firstRes.lon };
}
/**
 * GET https://nominatim.openstreetmap.org/search?city=Dallas&county=Collin&state=Texas&country=United+States&format=jsonv2
 * [{
        "place_id": 331018859,
        "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        "osm_type": "way",
        "osm_id": 1457993706,
        "lat": "33.0053254",
        "lon": "-96.8206378",
        "category": "landuse",
        "type": "residential",
        "place_rank": 24,
        "importance": 0.08007641489280534,
        "addresstype": "residential",
        "name": "Champions of North Dallas",
        "display_name": "Champions of North Dallas, 4912, Dallas, Collin County, Texas, 75287, United States",
        "boundingbox": [
            "33.0039856",
            "33.0066427",
            "-96.8224718",
            "-96.8187876"
        ]
    } 
    ...]
 */
