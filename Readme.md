[![Build Status](https://travis-ci.com/ClearBlade/asset-monitor.svg?branch=master)](https://travis-ci.com/ClearBlade/asset-monitor)

# Overview

This npm module is a boilerplate for Asset Monitoring Solution when developing solutions on ClearBlade Platform. This package has been designed to abstract the internal working of the Asset Monitoring Solution. An API is exposed to the Solutions Developer to add the custom logic for it, described in the later sections.

Version 1.0.0 supports just the normlizer.

## Setup your System to develop locally

Developer can perform the following steps to set up his existing/new system to work locally:

### Export the System

Go to your terminal and perform the following steps:

-   `cd <parent_folder>` into the desired parent folder
-   `cb-cli export -email=<DEVELOPER_EMAIL> -url=<PLATFORM_URL> -messaging-url=<MESSAGING_URL> -system-key=<SYSTEM_KEY>`, enter the developer password when prompted
-   `cd` into the newly created folder

### Development Setup

-   `npm init -y`
-   `npm i --save @clearblade/cb-dev-kit @clearblade/asset-monitor`

## Working with the Normalizer

The Normalizer library is designed to work with the Stream Service and Micro Service. Discussed below are the two approaches on how to leverage the Normalizer library for both the scenarios.

    Assumption: the developer is familiar with using the command line tool for importing/exporting ClearBlade Assets: [`cb-cli`](https://github.com/ClearBlade/cb-cli) & the ClearBlade Development Kit a.k.a. [`cb-dev-kit`](https://github.com/ClearBlade/cb-dev-kit).

### Stream Service Using the Normalizer

Steps to create your own Normlizer Stream Service to ingest data from a certain device & publish on relevant topics.

-   Create a Stream Service from the ClearBlade console.
-   Perform a `cb-cli pull -service=<SERVICE_NAME>`
-   Perform `npx cb-dev-kit generate` & then follow the prompts to generate the `.ts` file for the service, which is created in the `src/code/services/<SERVICE_NAME>` folder.
-   Use the snippet below to get started, filling the stub with some custom logic.

```typescript

import { normalizer, MessageParser } from "@clearblade/asset-monitor/lib/backend/normalizer";
import { GC } from "@clearblade/asset-monitor/lib/backend/global-config";

// @ts-ignore
var ClearBlade: CbServer.ClearBladeInt = global.ClearBlade;

// @ts-ignore
var log: { (s: any): void } = global.log;


function normalizerUsingLibSS(req: CbServer.BasicReq, resp:CbServer.Resp{

  const SERVICE_INSTANCE_ID = req.service_instance_id;
  log("SERVICE_INSTANCE_ID:: " + SERVICE_INSTANCE_ID);
  //TODO Replace the below topics with the topics the service listens on.
  let topics = ["$share/mygroup/mytopic1", "$share/othergroup/othertopic1"];

  ClearBlade.init({ request: req });
  let messageParser: MessageParser = function(err, msg, topic){
      //TODO Replace this stuff with custom logic to parse the data.
      return Promise.resolve([])
  }

  normalizer({req, resp, topics, messageParser});
}
```

-   There are few methods shared in the util library, which supports developer with the normalization process.

```typescript
import { isNormalizedDataValid, normalizeData } from '@clearblade/asset-monitor/lib/backend/util';
```

-   Developer can declare a normalizer config in their service as long as it satisfies the relevant type. An example config is shown below:

```typescript
let DEVICE_TO_CB_CONFIG: NormalizerDeviceMap = {
    location_x: 'locationCoordinate.x',
    location_y: 'locationCoordinate.y',
    location_z: 'locationCoordinate.z',
    location_unit: 'locationCoordinate.unit',
    location_type: 'INDOOR/GPS',
    latitude: 'geoCoordinate.latitude',
    longitude: 'geoCoordinate.longitude',
    last_updated: 'lastSeen',
    last_location_updated: 'lastSeen',
    id: 'deviceId',
    type: 'type',
};

// This method is invoked within the messageParser function
let assets: Array<Assets> = normalizeData(incomingData, DEVICE_TO_CB_CONFIG);
```

## How to update the Repo

Make changes to the src/ folder and then run `npm run build`. Update package version accordingly. Commit and Push.

## How to push a new NPM version

1. Commit your changes to src
2. Create a new npm version - `npm version [-—no-commit-hooks] <major|minor|patch>`
3. Publish the new version to npm - `npm publish`
4. Commit the changes from the build and push to master
