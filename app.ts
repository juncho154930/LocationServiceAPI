import { App } from "aws-cdk-lib";
import { ApiStack } from "./api-stack";
import { DataStack } from "./data-stack";

const app = new App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const data = new DataStack(app, "LocationService-Data", {
  env,
  description: "DynamoDB",
});
new ApiStack(app, "LocationService-Api", {
  env,
  description: "API Gateway, Lambda",
  table: data.table,
});
