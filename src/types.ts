import { BlockTag } from 'ethers';

////////////// Blockchain Types //////////////
// Add EVM compatible blockchain networks at will to BlockchainNetworks array
export const BlockchainNetworks = ['POLYGON'] as const;
export type Blockchain = typeof BlockchainNetworks[number];

export const OldestBlockchainBlock: Record<Blockchain, BlockTag> = {
  POLYGON: 47961368
}

////////////// Endpoint Types //////////////
export interface IPaginatedQuery {
  offset?: number;
  limit?: number;
}

export interface IPaginatedReply<D> {
  offset: number;
  limit: number;
  data: D[];
  next?: string;
}