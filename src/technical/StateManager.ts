import { Blockchain } from '#types';
import { EventListenerStateModel, State } from '#models';

export class StateManager {
  private readonly blockchain: Blockchain;
  private readonly contractAddress: string;
  private readonly eventName: string;

  constructor(blockchain: Blockchain, contract: string, eventName: string) {
    this.blockchain = blockchain;
    this.contractAddress = contract;
    this.eventName = eventName;
  }

  async save(state: State) {
    await EventListenerStateModel.updateOne(
      {
        blockchain: this.blockchain,
        contract: this.contractAddress,
        event: this.eventName
      },
      { state },
      { upsert: true }
    );
  }

  async load(): Promise<State | undefined> {
    const listenerState = await EventListenerStateModel.findOne(
      {
        blockchain: this.blockchain,
        contract: this.contractAddress,
        event: this.eventName
      }
    )
      .select('state')
      .lean();

    return listenerState?.state;
  }
}