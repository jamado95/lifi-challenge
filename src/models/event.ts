import { getModelForClass, getDiscriminatorModelForClass, prop, index, modelOptions } from '@typegoose/typegoose';
import { Blockchain } from '#types';

const Collection = 'Events';

@modelOptions({
  schemaOptions: { discriminatorKey: 'event' }
})
export class Event {
  @prop({ required: true, type: String })
  public blockchain!: Blockchain;

  @prop({ required: true, type: String })
  public contract!: string;

  @prop({ required: true, type: String })
  public event!: string;
}

class EventBlock extends Event {
  @prop({ required: true, type: Number, index: true })
  public blockNumber!: number;

  @prop({ required: true, type: String })
  public blockHash!: string;
}

export class FeesCollectedEvent extends EventBlock {
  @prop({ required: true, type: String })
  public token!: Blockchain;

  @prop({ required: true, type: String, index: true })
  public integrator!: string;

  @prop({ required: true, type: String })
  public integratorFee!: string;

  @prop({ required: true, type: String })
  public lifiFee!: string;
}

export const EventBlockModel = getModelForClass(EventBlock, { options: { customName: Collection }});
export const FeesCollectedEventModel = getDiscriminatorModelForClass(EventBlockModel, FeesCollectedEvent, 'FeesCollected');