import { JsonRpcProvider } from 'ethers';
import { BlockchainNetworks, Blockchain } from '#types';

export const ActiveBlockchain = process.env.BLOCKCHAIN as Blockchain;
if(!ActiveBlockchain || !BlockchainNetworks.includes(ActiveBlockchain)) {
  throw Error('Missing or invalid BLOCKCHAIN config');
}

export const BlockchainProviderURL = process.env[`${ActiveBlockchain}_PROVIDER_URL`];
if(!BlockchainProviderURL) {
  throw Error(`Missing ${ActiveBlockchain}_PROVIDER_URL config`);
}

export const Provider = new JsonRpcProvider(BlockchainProviderURL);

export enum ProviderErrorType {
  TOO_MANY_EVENTS = 'TOO_MANY_EVENTS',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  BLOCK_RANGE_TOO_WIDE = 'BLOCK_RANGE_TOO_WIDE'
};

export function getProviderErrorType(error: Error): ProviderErrorType | null {
  if(error.message.includes('returned more than 10000 results')){
    return ProviderErrorType.TOO_MANY_EVENTS;
  } else if(error.message.includes('query timeout exceeded')){
    return ProviderErrorType.REQUEST_TIMEOUT;
  } else if(error.message.includes('block range is too wide')) {
    return ProviderErrorType.BLOCK_RANGE_TOO_WIDE;
  }

  return null;
}