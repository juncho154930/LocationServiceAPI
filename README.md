# Location Service API

Estimate: 4-5h  
Time spent pre-planning, architecture, documentation: 1h  
Time spent building infra: 1h  
Time spent building API: 2.5h  
Time spent testing: .5h  
Time spent total: 5h

`primarily evaluating your engineering judgment, solution design, coding practices, and
decision-making process`  
Used some existing code I had for initial setup of CDK infra, my decision making for infra is explained below.

### Example API: https://pki2k7yf25.execute-api.us-east-1.amazonaws.com

GET /locations - List all branch locations.

```
curl 'https://pki2k7yf25.execute-api.us-east-1.amazonaws.com/locations'
```

## Tools used

VSCode  
https://nominatim.openstreetmap.org/  
Postman  
Minimal AI usage  
Typescript, Jest

## AI Usage

- Search nominatim API documentation for required auth/headers - requires User-Agent
- Checked some test cases

## Requirements

IT requires that we set up a new service on AWS where our users can store
and query our branch locations, including the city where they are located, by interacting with a
RESTful API.

1. Creation of a new location record for a branch.
2. Updating of an existing record by Location ID.
3. Get an existing location record by Location ID.
4. List all branch locations.

## Approach, Architecture

### Infra

Deployed manually throuch CDK  
Lambda - simple query computes  
DynamoDB - NoSQL for this simple demo, faster setup when accounting for time constraint  
API Gateway - connect lambda to public internet

### REST endpoints

- POST /locations - Creation of a new location record for a branch.
- PUT /locations/{locationId} - Updating of an existing record by Location ID.
- GET /locations/{locationId} - Get an existing location record by Location ID.
- GET /locations - List all branch locations.

API Gateway endpoint: https://pki2k7yf25.execute-api.us-east-1.amazonaws.com

### Schema

We need to store the Location ID, Location Name, City, State, Longitude, Latitude, and Country
where the branch is located.

When a location is first created or updated, we have the requirement that the longitude and latitude
is stored alongside the Location record in "Longitude" and "Latitude" fields; which will be used by
our logistics side of the business.

### Assumptions

client will set location ID  
Grab the first item available from nominatim (can happen when address is not specific enough)

## Trade-offs

- Lambda vs EC2: I chose lambda as we are querying a 3rd party api, serverless, and don't expect much usage for this demo. If we expect to use another api that would require large quantity of queries and connections kept open, we should use EC2.

- SQL vs NoSQL: In real world scenario, it makes sense for our db to be relational in case we need to query our data against another table lookup such as users in locations. Originally I was going to go with Aurora serverless, but setting up a managed SQL was taking too long with VPCs, credentials, schema setup etc. So for our demo I went with DynamoDB.

## Problem solving

- Had issue with hitting nominatim endpoint through postman - it was easiest to use AI to find documentation for header or auth requirements
- Time constraint with setting up DB. Went with DynamoDB that pushes off larger scale problems down the road.

## Further productionize this service

- Additional error handling and test cases - 4xx, 5xx, etc
- I think in this case it would be beneficial to use SQL rather than current DynamoDB. Currently all we need is to search by Location ID, however at scale we probably want to do more complex queries e.g. joins with "users" etc.
- We could have better schema control using something like Zod or prisma (if sql)
- One thing to note with lambda + SQL is we probably need to use some sort of RDS Proxy so we don't run into issues with SQL connection limits.
- Pagination, other filtering in "list all" useful once list of locations/information grows large
- Auth can use something like AWS Cognito depending on who our users are and requriements.
- Rate limit our own endpoint
- Deployment handled through CodePipeline, dev/prod environments, versioning
- To expand on this, we can have a blue/green prod environment for deployments and handling versions.
- Another compute service - either something like Fargate or EKS if we expect steady high loads.
- Since this is mostly HTTP based, we can add ALB for load balancing if we go with EC2
- If we stick with lambda, we can use something like EventBridge to pub/sub events.
- It would help to have some sort of caching like ElastiCache for common api calls.
- We need to a way to handle rate limits since this 3rd party API is heavily limited (1 call/s). However, in real production we would request for a higher API rate limit.
- While we can use API Gateway to handle truely synchronous requests, we can run into issues with large volume of requests in the case where we have to cap lambda concurrencies (due to db connections etc).
- Another option is to use SQS for our lambdas to queue up async requests, I would strongly consider this due to the api call limitation.
- If clients expect some sort of UI, easiest way is to deploy a static Cloudfront, S3 site + DNS. Useful for documentation like OpenAPI
- We need some sort of logging/metrics/alert. Something like Cloudwatch, Opentelemetry etc.
- Important to have some sort of firewall like WAF. If there is any security compliance required from our API we can protect service with AWS services such as AWS Inspector, Guard duty, etc. or any 3rd party gateway we have to route through. If user data needs to be secure with 3rd party we can connect through AWS Private link etc.
