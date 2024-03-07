import Fastify from 'fastify';

import { IPaginatedQuery, IPaginatedReply } from '#types';
import { FeesCollectedEventModel, FeesCollectedEvent } from '#models';

export const app = Fastify();

interface IGetFeesCollectedEventsParams {
  integrator: string;
}

interface IGetFeesCollectedEvents {
  Querystring: IPaginatedQuery;
  Params: IGetFeesCollectedEventsParams;
  Reply: IPaginatedReply<FeesCollectedEvent>;
}

app.get<IGetFeesCollectedEvents>('/events/fees-collected/:integrator', async (request, reply) => {
  const { integrator } = request.params;
  const { offset = 0, limit = 10 } = request.query;

  const data = await FeesCollectedEventModel.find({ integrator })
    .select('-_id -__v')
    .sort({ blockNumber: 1 })
    .skip(offset)
    .limit(limit)
    .exec();

  if(!data.length) {
    return reply.code(404).send();
  }

  if(data.length < limit) {
    return reply.send({ offset, limit, data });
  }

  const next = `${request.originalUrl}?offset=${limit}&limit=${limit}`;
  reply.send({ offset, limit, data, next });
});