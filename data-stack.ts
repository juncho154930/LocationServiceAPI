import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DataStack extends Stack {
  readonly table: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.table = new dynamodb.TableV2(this, "LocationsTable", {
      partitionKey: { name: "locationId", type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new CfnOutput(this, "TableName", { value: this.table.tableName });
  }
}
