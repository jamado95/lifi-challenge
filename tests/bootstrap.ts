import * as mongoose from 'mongoose';

export async function mochaGlobalSetup() {
  const { MONGODB_URL } = process.env;
    if (!MONGODB_URL) {
      throw new Error('Missing MONGODB_URL config');
    }
    
    await mongoose.connect(MONGODB_URL);
    console.log(`[MochaGlobalSetup] Successfully connected to database at ${MONGODB_URL}`);
}

export async function mochaGlobalTeardown() {
  await mongoose.disconnect();
}

export async function clearCollections() {
  const collections = await mongoose.connections[0].db.collections();
  await Promise.all(
    collections.map(async (collection) => {
      const isCapped = await collection.isCapped();
      return isCapped
        ? collection.drop().catch(console.error)
        : collection.deleteMany({});
    })
  );
}