import path from 'path';
import dotenv from 'dotenv';

const loadEnvironments = function loadEnviromentsVariables() {
  let loaded = {};
  if (process.env.NODE_ENV === 'dev') {
    const dotEnvFile = path.join(__dirname, `.env.${process.env.NODE_ENV}`);
    loaded = dotenv.config({ path: dotEnvFile }).parsed || {};
  } else {
    loaded = { ...process.env };
  }

  // Support BIBLIONX_* aliases with fallback to standard names
  const envMap = {
    PORT: loaded.BIBLIONX_PORT || loaded.PORT || process.env.BIBLIONX_PORT || process.env.PORT || '3000',
    LOGGER_FORMAT: loaded.BIBLIONX_LOGGER_FORMAT || loaded.LOGGER_FORMAT || process.env.BIBLIONX_LOGGER_FORMAT || process.env.LOGGER_FORMAT || 'combined',
    DB_HOST: loaded.BIBLIONX_DB_HOST || loaded.DB_HOST || process.env.BIBLIONX_DB_HOST || process.env.DB_HOST || 'localhost',
    DB_PORT: loaded.BIBLIONX_DB_PORT || loaded.DB_PORT || process.env.BIBLIONX_DB_PORT || process.env.DB_PORT || '27017',
    DB_NAME: loaded.BIBLIONX_DB_NAME || loaded.DB_NAME || process.env.BIBLIONX_DB_NAME || process.env.DB_NAME || 'biblionx-db',
    DB_USER: loaded.BIBLIONX_DB_USER || loaded.DB_USER || process.env.BIBLIONX_DB_USER || process.env.DB_USER,
    DB_PASS: loaded.BIBLIONX_DB_PASS || loaded.DB_PASS || process.env.BIBLIONX_DB_PASS || process.env.DB_PASS,
    CACHE_HOST: loaded.BIBLIONX_CACHE_HOST || loaded.CACHE_HOST || process.env.BIBLIONX_CACHE_HOST || process.env.CACHE_HOST || 'localhost',
    CACHE_PORT: loaded.BIBLIONX_CACHE_PORT || loaded.CACHE_PORT || process.env.BIBLIONX_CACHE_PORT || process.env.CACHE_PORT || '6379',
    CACHE_NAME: loaded.BIBLIONX_CACHE_NAME || loaded.CACHE_NAME || process.env.BIBLIONX_CACHE_NAME || process.env.CACHE_NAME || 'biblionx-cache',
    CACHE_PASS: loaded.BIBLIONX_CACHE_PASS || loaded.CACHE_PASS || process.env.BIBLIONX_CACHE_PASS || process.env.CACHE_PASS,
    CACHE_SIZE: loaded.BIBLIONX_CACHE_SIZE || loaded.CACHE_SIZE || process.env.BIBLIONX_CACHE_SIZE || process.env.CACHE_SIZE || '104857600',
    CACHE_EXP: loaded.BIBLIONX_CACHE_EXP || loaded.CACHE_EXP || process.env.BIBLIONX_CACHE_EXP || process.env.CACHE_EXP || '604800',
    AMQP_PROTOCOL: loaded.BIBLIONX_AMQP_PROTOCOL || loaded.AMQP_PROTOCOL || process.env.BIBLIONX_AMQP_PROTOCOL || process.env.AMQP_PROTOCOL || 'amqp',
    AMQP_HOST: loaded.BIBLIONX_AMQP_HOST || loaded.AMQP_HOST || process.env.BIBLIONX_AMQP_HOST || process.env.AMQP_HOST || 'localhost',
    AMQP_PORT: loaded.BIBLIONX_AMQP_PORT || loaded.AMQP_PORT || process.env.BIBLIONX_AMQP_PORT || process.env.AMQP_PORT || '5672',
    AMQP_USER: loaded.BIBLIONX_AMQP_USER || loaded.AMQP_USER || process.env.BIBLIONX_AMQP_USER || process.env.AMQP_USER || 'guest',
    AMQP_PASS: loaded.BIBLIONX_AMQP_PASS || loaded.AMQP_PASS || process.env.BIBLIONX_AMQP_PASS || process.env.AMQP_PASS || 'guest',
    TRANSLATOR_QUEUE: loaded.BIBLIONX_TRANSLATOR_QUEUE || loaded.TRANSLATOR_QUEUE || process.env.BIBLIONX_TRANSLATOR_QUEUE || process.env.TRANSLATOR_QUEUE || 'translate.to_text',
    VIDEOMAKER_QUEUE: loaded.BIBLIONX_VIDEOMAKER_QUEUE || loaded.VIDEOMAKER_QUEUE || process.env.BIBLIONX_VIDEOMAKER_QUEUE || process.env.VIDEOMAKER_QUEUE || 'translate.to_video',
    API_CONSUMER_QUEUE: loaded.BIBLIONX_API_CONSUMER_QUEUE || loaded.API_CONSUMER_QUEUE || process.env.BIBLIONX_API_CONSUMER_QUEUE || process.env.API_CONSUMER_QUEUE || 'amq.rabbitmq.reply-to',
  };

  // Populate process.env so modules reading process.env directly receive the values
  Object.keys(envMap).forEach((key) => {
    if (envMap[key] !== undefined && process.env[key] === undefined) {
      process.env[key] = envMap[key];
    }
  });

  return { ...loaded, ...envMap };
};

const env = loadEnvironments();

export default env;
