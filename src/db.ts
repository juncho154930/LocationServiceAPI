import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Location } from "./data";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TableName = process.env.TABLE_NAME;

const put = (location: Location, condition: string) =>
  db.send(
    new PutCommand({
      TableName,
      Item: location,
      ConditionExpression: condition,
    }),
  );

// dynamo will handle put/post based on locationId

export function createLocation(location: Location) {
  return put(location, "attribute_not_exists(locationId)");
}

export function updateLocation(location: Location) {
  return put(location, "attribute_exists(locationId)");
}

export async function getLocation(locationId: string) {
  const { Item } = await db.send(
    new GetCommand({ TableName, Key: { locationId } }),
  );
  return Item as Location | undefined;
}

export async function listLocations() {
  const { Items } = await db.send(new ScanCommand({ TableName }));
  return (Items ?? []) as Location[];
}
