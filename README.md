# LI.FI Challenge

Generic, EVM compatible blockchain event listener service that actively scrapes `FeesCollected` events from LI.FI `FeeCollector` contract. For more details see [Challenge Specification](https://lifi.notion.site/Take-home-Assignment-Working-with-Events-4cfdeb285466412a90fbfa2f9aa14784).

It was a fun and pleasureable challenge!

To run the project:
1. Install node modules
```sh
npm run install
```

## Implementation Notes

The repo contains a generic implementation of an EVM compatible, statefull event listener that can be found at `src/ContractEventListener.ts`. The listener implements a basic backoff strategy with limited retry attempts for handling errors related to provider timeouts, *too many events* errors and *oversized block query space* errors.

The listener will start to scrape the selected blockchain network (`.env:BLOCKCHAIN`) between **[*latest_block - MAX_BLOCK_DIFF*, *latest_block*]** where **MAX_BLOCK_DIFF** is set to 2000 blocks (see `src/ContractEventListener.MAX_BLOCK_DIFF`). The listener can be started and stopped at will, and its expected to resume operations from it left off. 

Scrapping happens every `src/ContractEventListener.SCRAPE_INTERVAL` milliseconds. Feel free to reduce this interval for testinf purposes (recommended 10seconds);

Alter the `EventListenerState.state.lastFetchedBlock` in the database to determine the staring block from which the listener will start scrapping the blockchain for events.

### API Endpoint
The service implements a paginated endpoint to retrieve scrapped `FeesCollected` events. The endpoint's implementation along with its interface can be found at `src/router.ts`.

The endpoint can be accessed at `http://<host>:<PORT>/events/fees-collected/:integrator` where `integrator` is the checksummed address of the desired integrator. The paginated parameters are optional and default to the 10 oldest events stored in the database. 

Example endpoint call: `http://localhost:3000/events/fees-collected/0x1aC3EF0ECF4E0ed23D62cab448f3169064230624?offset=0&limit=10`

### Possible areas of improvement
- Enable historical event scrapping in the codebase (the listener has this functionality enalbed and working, but it must be managed by directly updating its state on the database);
- Endpoint interface type and schema validators, caching and authentication;
- Redundant mechanisms to ensure strong data consistency, with focus on avoiding duplicate events in the database;
- Improvements on `src/technical/provider` module including fallback provider and support for multiple concurrent providers;
- Support for multiple `ContractEventListener` instances;
- Handle blockchain reorgs with strong data consistency (ex. discard events from the database that no longer appear in the canonical blockchain path);
