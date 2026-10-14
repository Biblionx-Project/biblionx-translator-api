import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import env from '../../config/environments/environment';
import queueConnection from '../util/queueConnection';
import redisConnection from '../util/redisConnection';
import { cacheError } from '../util/debugger';
import Translation from './Translation';
import Hit from './Hit';
import { TRANSLATOR_ERROR } from '../../config/error';
import {
  CHANNEL_CLOSE_TIMEOUT,
  TRANSLATION_TIMEOUT,
  TRANSLATION_PAYLOAD_TTL,
} from '../../config/timeout';
import phraseBreaker from '../util/phraseBreaker';

/**
 * Asynchronous stores the statistics of the traslator at the DB.
 *
 * @param {Request} req - The http(s) request.
 */
async function storeStats(req) {
  const phrases = await phraseBreaker(req.body.text);

  phrases.forEach(async (phrase) => {
    await Hit.findOneAndUpdate(
      { text: phrase },
      { $inc: { hits: 1 } },
      { upsert: true },
    );
  });
}

const textTranslator = async function textTranslatorController(req, res, next) {
  try {
    const uid = uuidv4();
    const AMQPConnection = await queueConnection();
    const AMQPChannel = await AMQPConnection.createChannel();

    const { consumerCount } = await AMQPChannel.assertQueue(
      env.TRANSLATOR_QUEUE,
      { durable: false },
    );

    if (consumerCount === 0) {
      return next(createError(500, TRANSLATOR_ERROR.unavailable));
    }

    setTimeout(storeStats, 10, req); // 10miliseconds means now.

    const translationRequest = new Translation({
      text: req.body.text,
      requester: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    AMQPChannel.consume(
      env.API_CONSUMER_QUEUE,
      async (message) => {
        setTimeout(() => {
          try {
            AMQPChannel.close();
          } catch (channelAlreadyClosedError) { /* empty */ }
        }, CHANNEL_CLOSE_TIMEOUT);

        if (message.properties.correlationId !== uid) {
          return next(createError(500, TRANSLATOR_ERROR.wrongResponse));
        }

        const content = JSON.parse(message.content.toString());
        if (content.error !== undefined) {
          return next(createError(500, content.error));
        }
        res.status(200).send(content.translation);

        if (req.body.textHash) {
          try {
            const redisClient = await redisConnection();
            await redisClient.set(
              req.body.textHash,
              content.translation,
              'EX',
              env.CACHE_EXP,
            );
          } catch (error) {
            cacheError(`SET ${error.message}`);
          }
        }

        try {
          await Translation.findByIdAndUpdate(
            translationRequest._id,
            { translation: content.translation },
          ).exec();
        } catch (mongoNetworkError) { /* empty */ }

        return undefined;
      },
      { noAck: true },
    );

    setTimeout(() => {
      if (!res.headersSent) {
        try {
          AMQPChannel.close();
        } catch (channelAlreadyClosedError) { /* empty */ }
        return next(createError(408, TRANSLATOR_ERROR.timeout));
      }
      return undefined;
    }, TRANSLATION_TIMEOUT);

    const payload = JSON.stringify({ text: req.body.text });

    await AMQPChannel.publish(
      '',
      env.TRANSLATOR_QUEUE,
      Buffer.from(payload),
      {
        correlationId: uid,
        replyTo: env.API_CONSUMER_QUEUE,
        expiration: TRANSLATION_PAYLOAD_TTL,
      },
    );

    return await translationRequest.save();
  } catch (error) {
    return next(error);
  }
};

export default textTranslator;
