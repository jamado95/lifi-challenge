import { expect } from 'chai';
import * as sinon from 'sinon';

import { clearCollections } from './bootstrap';

import { Blockchain } from '../src/types';
import { ContractEventListener } from '../src/ContractEventListener';
import { FeeCollectorContract, FeeCollectorTypes } from '../src/contracts';
import { EventListenerStateModel, EventListenerState } from '../src/models';
import { ActiveBlockchain, Provider } from '../src/technical/provider';
import { MockLogger } from '../src/technical/logger';

const FEE_COLLECTOR_ADDRESS = process.env[`${ActiveBlockchain}_FEE_COLLECTOR_CONTRACT`];
if(!FEE_COLLECTOR_ADDRESS) {
  throw Error(`Missing ${ActiveBlockchain}_FEE_COLLECTOR_CONTRACT config`);
}

const EventName = 'FeesCollected';

describe('ContractEventListener', function () {
  const blockchain: Blockchain = ActiveBlockchain;
  let feeCollectorContract: FeeCollectorTypes.FeeCollector;
  let eventListener: ContractEventListener<FeeCollectorTypes.FeesCollectedEvent.Event>;

  beforeEach(async() => {
    feeCollectorContract = FeeCollectorContract.at(FEE_COLLECTOR_ADDRESS); 
    eventListener = new ContractEventListener(feeCollectorContract, EventName, blockchain, MockLogger);
  })

  afterEach(async () => {
    sinon.restore();
    await clearCollections();
  })

  describe('State Management', function() {
    beforeEach(async() => {
      feeCollectorContract = FeeCollectorContract.at(FEE_COLLECTOR_ADDRESS); 
      eventListener = new ContractEventListener(feeCollectorContract, EventName, blockchain, MockLogger);

      // Stub blockchain query
      const fakeQueryFilter = sinon.fake.resolves([]);
      sinon.replace(feeCollectorContract, 'queryFilter', fakeQueryFilter);
    })
  
    afterEach(async () => {
      sinon.restore();
      await clearCollections();
    })

    it('Properly stores last scrapped block after shutdown', async () => {  
      const fakeLatestBlock = 10_000;
      const fakeGetBlockNumber = sinon.fake.resolves(fakeLatestBlock);
      sinon.replace(Provider, 'getBlockNumber', fakeGetBlockNumber);
  
      // Start listener for a single loop
      eventListener.start();
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      eventListener.stop();
  
      // Retrieve last stored listerner state
      const initialState = await EventListenerStateModel.findOne(
        {
          blockchain,
          contract: feeCollectorContract.target,
          event: EventName
        }
      ).select('state');
  
      expect(initialState).to.not.be.undefined;
      expect(initialState!.state.lastFetchedBlock).to.equals(fakeLatestBlock);
    });
  
    it('Resumes event scrapping from last fetched blocked upon restart', async () => {
      const fakeLatestBlockLoop1 = 10_000;
      let fakeGetBlockNumber = sinon.fake.resolves(fakeLatestBlockLoop1);
      sinon.replace(Provider, 'getBlockNumber', fakeGetBlockNumber);
  
      // Start listener for a single loop
      eventListener.start();
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      eventListener.stop();
  
      // Retrieve last stored listerner state
      const initialState = await EventListenerStateModel.findOne(
        {
          blockchain,
          contract: feeCollectorContract.target,
          event: EventName
        }
      ).select('state');
  
      sinon.restore();
      const fakeLatestBlockLoop2 = 12_000;
      fakeGetBlockNumber = sinon.fake.resolves(fakeLatestBlockLoop2);
      sinon.replace(Provider, 'getBlockNumber', fakeGetBlockNumber);
      
      // Restart listener for a single loop
      eventListener.start();
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      eventListener.stop();
  
      const lastState = await EventListenerStateModel.findOne(
        {
          blockchain,
          contract: feeCollectorContract.target,
          event: EventName
        }
      ).select('state');
  
      expect(lastState).to.not.be.undefined;
      expect(lastState!.state.lastFetchedBlock).to.equals(initialState!.state.lastFetchedBlock + ContractEventListener.MAX_BLOCK_DIFF);
    });
  });


  it('Applies backoff strategy in case queried block range is too large ', async () => {
    // Throw BLOCK_RANGE_TOO_WIDE provider error
    const fakeQueryFilter = sinon.fake.rejects('block range is too wide');
    sinon.replace(feeCollectorContract, 'queryFilter', fakeQueryFilter);

    const fakeLatestBlockLoop1 = 10_000;
    let fakeGetBlockNumber = sinon.fake.resolves(fakeLatestBlockLoop1);
    sinon.replace(Provider, 'getBlockNumber', fakeGetBlockNumber);

    // Start listener for a single loop
    eventListener.start();
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    eventListener.stop();

    // Compute expected listener max block diff according to backoff strategy
    const expectedQueryBlockDiffAfterExhaustedRetries = ContractEventListener.MAX_BLOCK_DIFF / (ContractEventListener.BACKOFF_RATIO ** ContractEventListener.MAX_RETRY_ATTEMPTS);
    expect(eventListener.CurrentMaxBlockDiff).to.equals(expectedQueryBlockDiffAfterExhaustedRetries);
  });

  
  it('Executes registered events processor logic on scrapped events', async () => {
    // Stub fake
    const fakeQueryFilter = sinon.fake.resolves([]);
    sinon.replace(feeCollectorContract, 'queryFilter', fakeQueryFilter);

    const eventsProcessorCallback = sinon.fake(); 
    const mockEventsProcessor = async (events: FeeCollectorTypes.FeesCollectedEvent.Log[]) => { eventsProcessorCallback(events) } 
    eventListener.registerEventsProcessor(mockEventsProcessor);

    // Start listener for a single loop
    eventListener.start();
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    eventListener.stop();

    expect(eventsProcessorCallback.callCount).to.be.equals(1);
  });
});