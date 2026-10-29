import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { handler } from "../src/handler";

const ddb = mockClient(DynamoDBDocumentClient);

const branch = {
  locationId: "123456",
  locationName: "Dallas Branch",
  city: "Dallas",
  state: "Texas",
  country: "United States",
};
const branchLatLong = {
  ...branch,
  latitude: "33.0053254",
  longitude: "-96.8206378",
};

const gwEvent = (routeKey: string, body?: unknown, locationId?: string) =>
  ({
    routeKey,
    body: JSON.stringify(body),
    pathParameters: locationId ? { locationId } : undefined,
  }) as unknown as APIGatewayProxyEventV2;

const mockNominatim = (lat: string, lon: string) =>
  jest
    .spyOn(global, "fetch")
    .mockResolvedValue(new Response(JSON.stringify([{ lat, lon }])));

beforeEach(() => {
  ddb.reset();
  jest.restoreAllMocks();
});

test("POST location", async () => {
  mockNominatim("33.0053254", "-96.8206378");
  ddb.on(PutCommand).resolves({});

  const res = await handler(gwEvent("POST /locations", branch));

  expect(res.statusCode).toBe(200);
  expect(ddb.commandCalls(PutCommand)[0].args[0].input.Item).toEqual(
    branchLatLong,
  );
});

test("PUT location", async () => {
  mockNominatim("33.0136764", "-96.6925096"); // Plano
  ddb.on(PutCommand).resolves({});
  const locInfo = { ...branch, city: "Plano" };

  const res = await handler(
    gwEvent("PUT /locations/{locationId}", locInfo, branch.locationId),
  );

  expect(res.statusCode).toBe(200);
  expect(ddb.commandCalls(PutCommand)[0].args[0].input.Item).toEqual({
    ...branch,
    city: "Plano",
    latitude: "33.0136764",
    longitude: "-96.6925096",
  });
});

test("GET Location by ID", async () => {
  ddb.on(GetCommand).resolves({ Item: branchLatLong });

  const res = await handler(
    gwEvent("GET /locations/{locationId}", undefined, branch.locationId),
  );

  expect(res.statusCode).toBe(200);
  expect(JSON.parse(res.body!)).toEqual(branchLatLong);
});

test("GET all locations", async () => {
  ddb.on(ScanCommand).resolves({
    Items: [branchLatLong, { ...branchLatLong, locationId: "654321" }],
  });

  const res = await handler(gwEvent("GET /locations"));

  expect(res.statusCode).toBe(200);
  expect(JSON.parse(res.body!)).toHaveLength(2);
});
