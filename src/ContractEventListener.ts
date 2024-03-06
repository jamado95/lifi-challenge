import { BaseContract } from 'ethers';
import { Blockchain } from '#types';
import { Common as CommonTypes } from '#contracts';

import { StateManager } from '#technical/StateManager';
import { Provider, getProviderErrorType, ProviderErrorType } from '#technical/provider';
import { ILogger } from '#technical/logger';

export class ContractEventListener<E extends CommonTypes.TypedContractEvent> {

  static SCRAPE_INTERVAL = 30_000;
  static MAX_BLOCK_DIFF = 2_000;
  static BACKOFF_RATIO = 2;
  static MAX_RETRY_ATTEMPTS = 3;

  private CurrentMaxBlockDiff: number = ContractEventListener.MAX_BLOCK_DIFF;

  private readonly eventName: E['name'];
  private readonly contract: BaseContract;
  private readonly state: StateManager;
  private readonly logger: ILogger;
  private eventsProcessor?: (event: CommonTypes.TypedEventLog<E>[]) => Promise<unknown>;

  private running: boolean = false;

  constructor(
    contract: BaseContract,
    eventName: string,
    blockchain: Blockchain,
    logger: ILogger,
  ) {
    this.contract = contract;
    this.eventName = eventName;
    this.logger = logger;

    this.state = new StateManager(blockchain, contract.target.toString(), eventName);
  }

  /**
   * Register function to process events collected during sweep.
   * Error handling 
   * 
   * @param processor callback function to execute for collected events
   */
  registerEventsProcessor(processor: (event: CommonTypes.TypedEventLog<E>[]) => Promise<unknown>) {
    // Error handling is the processor's responsability
    this.eventsProcessor = processor;
  }

  async start(fromBlockOverride?: number) {
    this.running = true;

    // Iniate scrapping / live listener loop
    while(this.running) {
      this.CurrentMaxBlockDiff = ContractEventListener.MAX_BLOCK_DIFF; // Reset CurrentMaxBlockDiff to maximum allowed value
      const startTimeMs = Date.now();
      const state = await this.state.load();
      const toBlock = await Provider.getBlockNumber();
      const fromBlock = fromBlockOverride ?? state?.lastFetchedBlock ?? toBlock - this.CurrentMaxBlockDiff;
      
      try {
        await this.fetchEvents(fromBlock, toBlock);
      } catch(error) {
        this.stop();
        throw error;
      }

      // Dynamically computed next run time. Essential to ensure state consistency
      const executionTimeMs = Date.now() - startTimeMs;
      const timeToNextRunMs = ContractEventListener.SCRAPE_INTERVAL - (executionTimeMs % ContractEventListener.SCRAPE_INTERVAL);
      this.logger.debug(`[ContractEventListener] Next run in ${timeToNextRunMs}ms\n`);
      await new Promise((resolve) => setTimeout(resolve, timeToNextRunMs));
    }
  }

  /**
   * Terminates event fetching loop
   */
  async stop() {
    if(!this.running) {
      this.logger.debug('[ContractEventListener] Event listener not started');
      return;
    }
    
    this.running = false;
    this.logger.debug('[ContractEventListener] Stopped');
  }

  private async fetchEvents(fromBlock: number, toBlock: number, retries = ContractEventListener.MAX_RETRY_ATTEMPTS) {
    this.logger.debug(`[ContractEventListener] Fetching events for range [${fromBlock}, ${toBlock}] with ${retries} retries left`);
    try {
      const contractEvent = this.contract.getEvent(this.eventName);

      // Breakdown [fromBlock, toBlock] range in MAX_BLOCK_DIFF intervals
      const scrappingIntervals = Math.ceil((toBlock - fromBlock) / this.CurrentMaxBlockDiff);
      for (let interval = 0; interval < scrappingIntervals && this.running; interval++) {
        let fromBlockInterval = fromBlock + interval * this.CurrentMaxBlockDiff;
        let toBlockInterval = Math.min(toBlock, fromBlock + (interval + 1) * this.CurrentMaxBlockDiff - 1);

        this.logger.debug(`[ContractEventListener] Interval fetching for range [${fromBlockInterval}, ${toBlockInterval}]`);

        const events = (await this.contract.queryFilter(contractEvent, fromBlockInterval, toBlockInterval)) as CommonTypes.TypedEventLog<E>[];

        // Processes event logs through registered events processor callback 
        try {
          await this.eventsProcessor?.(events);
        } catch(error) {
          // Ignore processor errors. Improvement area
          this.logger.error(`[ContractEventListener] [OnEvent] Callback failed with error ${error}`);
        }
        
        // Save current state
        await this.state.save({ lastFetchedBlock: toBlockInterval + 1 });
      }
    } catch(err: any) {
      const providerErrorType = retries > 0 ? getProviderErrorType(err) : null;
      
      switch(providerErrorType) {
        case ProviderErrorType.TOO_MANY_EVENTS:
        case ProviderErrorType.REQUEST_TIMEOUT:
        case ProviderErrorType.BLOCK_RANGE_TOO_WIDE:
          // Apply simple backoff strategy
          this.CurrentMaxBlockDiff = this.CurrentMaxBlockDiff / ContractEventListener.BACKOFF_RATIO;
          await this.fetchEvents(fromBlock, toBlock, retries - 1);
          break;
        default:
          this.logger.error(`[ContractEventListener] Failed to fetch, or process events. Stopping listener`);
          throw err; 
      } 
    }
  }
}