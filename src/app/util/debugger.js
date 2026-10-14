import debug from 'debug';

export const serverInfo = debug('biblionx-translator-api:info');
export const serverError = debug('biblionx-translator-api:error');
export const cacheError = debug('biblionx-translator-cache:error');
export const databaseError = debug('biblionx-translator-db:error');
