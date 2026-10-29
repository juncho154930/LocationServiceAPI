// We need to store the Location ID, Location Name, City, State, Longitude, Latitude, and Country where the branch is located.
export interface LocationInput {
  locationId: string;
  locationName: string;
  city: string;
  state: string;
  country: string;
}

export interface Location extends LocationInput {
  latitude: string;
  longitude: string;
}
