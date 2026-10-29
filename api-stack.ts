import * as path from "path";
import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface ApiStackProps extends StackProps {
  table: dynamodb.ITableV2;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { table } = props;

    const locationsFn = new NodejsFunction(this, "LocationsFn", {
      entry: path.join(__dirname, "src", "handler.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadWriteData(locationsFn);

    const integration = new HttpLambdaIntegration(
      "LocationsIntegration",
      locationsFn,
    );
    const api = new apigw.HttpApi(this, "HttpApi", {
      description: "Branch location REST API",
    });

    api.addRoutes({
      path: "/locations",
      methods: [apigw.HttpMethod.GET, apigw.HttpMethod.POST],
      integration,
    });
    api.addRoutes({
      path: "/locations/{locationId}",
      methods: [apigw.HttpMethod.GET, apigw.HttpMethod.PUT],
      integration,
    });

    new CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
  }
}
