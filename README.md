# gotoartifact-challenge

Implementation of an ERC721 contract that limits the amount of tokens each address can mint.
See [Challenge Specification](https://docs.google.com/document/d/1rofuSjB9Z00DDyMOycPz-twY0RFT687kFnZN4Ai_RXo/edit#heading=h.g79izkef2lyx)

An instance of the LimitedMintNFT.sol is deployed on Mumbai Testnet and verified on PolygonScan and can be found [here](https://mumbai.polygonscan.com/address/0x2E9da9425Df470D1640b6E408F16d15425d213C2#code)

To run the project:
1. Install node modules
```sh
npm run install
```
2. Verify postinstall script was executed during (1). If not, execute
```sh
npm run postintall
```
3. Run unit tests. Requires a local network running @ 127.0.0.1:8545.
```sh
npm run test
```
To run a local test network, you can use ganache-cli that comes installed with this project.
```sh
npx ganache-cli
```
4. Deploy to Mumbai Testnet. Variables in .env file must be defined to run this command
```sh
npm run migrate:mumbai
```

5. Verify source code in PolygonScan
```sh
npm run verify:mumbai
```

## Implementation Notes

The implementation choices of the contract function `LimitedMintNFT.limitedMint(address)` relate to the interpretation of the challenge criteria _Ensure that each address can mint up to 5 NFTs._ 

The contract enforces a mint limit for any valid address, including EOA and Smart Contract Account addresses. To support this, the contract consideres the function caller to be the _minter_. 

However, to avoid allowing _minters_ to bypass the mint limit by calling the `limitedMint` function from other smart contracts (effectively turning the _minter_ into the caller contract itself), the function also checks if the transaction originator address has reached its mint limit. This check is only done in case the orliginator and the function caller are different addresses.