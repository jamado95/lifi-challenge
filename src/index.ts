import * as mongoose from 'mongoose';

import { FeeCollectorContract, FeeCollectorTypes, Common as CommonTypes } from "#contracts";
import { ActiveBlockchain } from '#technical/provider';
import { MockLogger } from '#technical/logger';

import { FeesCollectedEventModel } from '#models';

import { ContractEventListener } from'./ContractEventListener';


const MONGODB_URL = process.env.MONGODB_URL;
if(!MONGODB_URL) {
  throw Error('Missing MONGODB_URL config');
}

const FEE_COLLECTOR_ADDRESS = process.env[`${ActiveBlockchain}_FEE_COLLECTOR_CONTRACT`];
if(!FEE_COLLECTOR_ADDRESS) {
  throw Error(`Missing ${ActiveBlockchain}_FEE_COLLECTOR_CONTRACT config`);
}

const feeCollectorContract = FeeCollectorContract.at(FEE_COLLECTOR_ADDRESS);

// Parses and stores FeesCollected events to the database
const feesCollectedEventsProcessor = async (events: FeeCollectorTypes.FeesCollectedEvent.Log[]) => {
  if(!events.length) return;

  const parsedEvents = events.map(event => ({
    blockchain: ActiveBlockchain,
    contract: feeCollectorContract.target,
    token: event.args._token,
    blockNumber: event.blockNumber,
    blockHash: event.blockHash,
    integrator: event.args._integrator,
    integratorFee: event.args._integratorFee,
    lifiFee: event.args._lifiFee
  }));

  // Batch inserts
  await FeesCollectedEventModel.insertMany(parsedEvents);
};

const listener = new ContractEventListener<FeeCollectorTypes.FeesCollectedEvent.Event>(feeCollectorContract, 'FeesCollected', ActiveBlockchain, MockLogger);

(async function init() {
  await mongoose.connect(MONGODB_URL);
  MockLogger.debug(`Successfully connected to database at ${MONGODB_URL}\n`);

  // Setup and start listener
  listener.registerEventsProcessor(feesCollectedEventsProcessor);
  listener.start();
})();

async function shutdown() {
  await listener.stop();
  await mongoose.disconnect();
  MockLogger.debug(`Successfully disconnected from database at ${MONGODB_URL}`);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/**
 * TODO
 * 
 * Create API endpoint
 * Create Dockerfile
 * 
 * !!!! Error Handling !!!!
 * !!!! Handle blockchain regorgs (errors where end_block_number < begin_block_number):
 *  - Remove all events stored to DB since begin_block_number and reset listener state to begin_block_number
 * 
 * Fetch Historic events functionality
 * 
 * Cleanup codebase: types, functions, imports
 * Refactor repo structure (if needed)
 * 
 */