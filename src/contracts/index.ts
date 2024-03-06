import { BaseContract } from 'ethers';

import { Provider } from '#technical/provider';

import FeeCollectorABI from './abi/FeeCollector.json';
import * as FeeCollectorTypes from './typechain/FeeCollector';


/**
 * Export contract and corresponding event types, and common types
 */
export { FeeCollectorTypes }
export * as Common from './typechain/common';

/**
 * Export typed contract factory
 */
export class FeeCollectorContract {
  static readonly abi = FeeCollectorABI;

  public static at(address: string): FeeCollectorTypes.FeeCollector {
    return new BaseContract(address, FeeCollectorContract.abi, Provider) as unknown as FeeCollectorTypes.FeeCollector;
  }
}
