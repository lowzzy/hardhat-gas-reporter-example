require('@nomiclabs/hardhat-waffle');
require('hardhat-gas-reporter');

module.exports = {
  solidity: '0.8.4',
  // https://hardhat.org/metamask-issue.html
  networks: {
    hardhat: {
      chainId: 137,
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'JPY',
    showTimeSpent: true,
    showMethodSig: true,
    coinmarketcap: 'b7d62a59-7758-4be6-8438-1a5f7a705989',
    gasPriceApi:
      'https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice',
  },
};
