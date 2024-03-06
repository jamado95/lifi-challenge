import { getModelForClass, prop, index } from '@typegoose/typegoose';
import { Event } from './event';

const Collection = 'EventListenerStates';

export class State {
  @prop({ required: true, type: Number })
  public lastFetchedBlock!: number;
}

@index({ blockchain: 1, contract: 1, event: 1 }, { unique: true })
export class EventListenerState extends Event {
  @prop({ required: true, _id: false, type: () => State })
  public state!: State;
}

export const EventListenerStateModel = getModelForClass(EventListenerState, { options: { customName: Collection }});