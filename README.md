# LI.FI Challenge

Generic, EVM compatible blockchain event listener service that actively scrapes `FeesCollected` events from LI.FI `FeeCollector` contract. For more details see [Challenge Specification](https://lifi.notion.site/Take-home-Assignment-Working-with-Events-4cfdeb285466412a90fbfa2f9aa14784).

It was a fun challenge!

To run the project:
1. Clone repo to local
```sh
git clone https://github.com/jamado95/lifi-challenge.git
```
2. Install node modules (node v18.18.2, all packages use latest version)
```sh
npm ci
```
3. Build project (optional)
```sh
npm run build
```
4. Setup local **MONGODB_URL, PORT, POLYGON_PROVIDER_URL and POLYGON_FEE_COLLECTOR_CONTRACT** configurations in `.env` file. See working example bellow.
```sh
# Remove flag to disable debug logs. Recommend keep enabled for better visibility
DEBUG=true

PORT=3000
MONGODB_URL=mongodb://localhost:27017/test

BLOCKCHAIN=POLYGON
POLYGON_PROVIDER_URL=https://polygon-rpc.com
POLYGON_FEE_COLLECTOR_CONTRACT=0xbD6C7B0d2f68c2b7805d88388319cfB6EcB50eA9
```
5. Run unit tests ⚠️ Ensure you're using a clean/empty dedicated testing database.
```sh
npm run test
```
6. Run project with **ts-node**.
```sh
npm run dev
```

The project has been tested locally and should be working as expected and described in the challenge according to my best interpretation of the specs. Feel welcome to reach out with any questions, or issues while trying to run the project!

## Implementation Notes

The repo contains a generic implementation of an EVM compatible, statefull event listener that can be found at `src/ContractEventListener.ts`. The listener implements a basic backoff strategy with limited retry attempts for handling errors related to provider timeouts, *too many events* errors and *oversized block query space* errors.

The listener will start to scrape the selected blockchain network (`.env:BLOCKCHAIN`) between **[*latest_block - MAX_BLOCK_DIFF*, *latest_block*]** where **MAX_BLOCK_DIFF** is set to 2000 blocks (see `src/ContractEventListener.MAX_BLOCK_DIFF`). The listener can be started and stopped at will, and its expected to resume operations from it left off. 

Scrapping happens every `src/ContractEventListener.SCRAPE_INTERVAL` milliseconds. Feel free to reduce this interval for testinf purposes (recommended 10seconds);

Alter the `EventListenerState.state.lastFetchedBlock` in the database to determine the staring block from which the listener will start scrapping the blockchain for events.

### API Endpoint
The service implements a paginated endpoint to retrieve scrapped `FeesCollected` events. The endpoint's implementation along with its interface can be found at `src/router.ts`.

The endpoint can be accessed at `http://<host>:<PORT>/events/fees-collected/:integrator?offset=0&limit=10` where `integrator` is the checksummed address of the desired integrator, and `PORT` is defined at `.env` file. The paginated parameters are optional and default to the 10 oldest events stored in the database. 

Example endpoint call: `http://localhost:3000/events/fees-collected/0x1aC3EF0ECF4E0ed23D62cab448f3169064230624?offset=0&limit=10`

### Possible areas of improvement
- Add unit testing to API endpoint;
- Enable historical event scrapping in the codebase (the listener has this functionality enalbed and working, but it must be managed by directly updating its state on the database);
- Endpoint interface type and schema validators, caching and authentication;
- Redundant mechanisms to ensure strong data consistency, with focus on avoiding duplicate events in the database;
- Improvements on `src/technical/provider` module including fallback provider and support for multiple concurrent providers;
- Support for multiple `ContractEventListener` instances;
- Handle blockchain reorgs with strong data consistency (ex. discard events from the database that no longer appear in the canonical blockchain path);
