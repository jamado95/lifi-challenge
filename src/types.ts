import { BlockTag } from 'ethers';

// Add EVM compatible blockchain networks at will to BlockchainNetworks array
export const BlockchainNetworks = ['POLYGON'] as const;
export type Blockchain = typeof BlockchainNetworks[number];

export const OldestBlockchainBlock: Record<Blockchain, BlockTag> = {
  POLYGON: 47961368
}