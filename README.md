# `airdropcli` <!-- omit in toc -->

Command-line interface for claiming airdrop.

## Table of Contents <!-- omit in toc -->
- [Setup](#setup)
- [Configuration](#configuration)
  - [Specifying LCD settings](#specifying-lcd-settings)
- [Usage](#usage)
  - [Execute](#execute)
  - [Query](#query)
- [Examples](#examples)
  - [Claim Airdrop](#Claim Airdrop)
  - [Query Airdrop State](#Query Airdrop State of An Address)
- [License](#license)
## Setup

**Requirements**

- Node.js 12+
- NPM,
- [`terracli`](https://github.com/terra-project/core) in your path.

`airdropcli` can be installed off NPM.
****
```bash
$ npm install -g @anchor-protocol/airdropcli
```
The entrypoint `airdropcli` should then be available in your `path`:

<pre>
         <div align="left">
        <strong>$ airdropcli</strong>
        
        Usage: airdropcli [options] [exec_command]

        Command-line interface for claiming ANC airdrop

        Options:
          -V, --version   output the version number
          -v,--verbose    Show verbose error logs
          -h, --help      display help for exec_command

        Commands:
          exec|x             Execute a function on a smart contract
          query|q [options]  Query state of airdrop
          help [exec_command]  display help for exec_command
        </div>
</pre>

## Configuration
By default, `airdropcli` works with the default configuration which is set to be for contracts on `columbus-4`. 
This setting provides the address of contracts and specifies the setting for LCD provider, gas prices for fee estimation.

### Specifying LCD settings
Each network config should define how to connect to the Terra blockchain via LCD parameters.
```json
{
  "lcd": {
    "chainID": "columbus-4",
    "URL": "https://lcd.terra.dev",
    "gasPrices": {
      "uluna": 0.15,
      "usdr": 0.1018,
      "uusd": 0.15,
      "ukrw": 178.05,
      "umnt": 431.6259
    },
    "gasAdjustment": 1.2
  }
}
```

## Usage

`airdropcli` allows you to:

- [**execute**](#execute) state-changing functions on Airdrop smart contracts
- [**query**](#query) readonly data endpoints on Airdrop state

### Execute

**USAGE: `airdropcli exec|x claim-airdrop [options] [exec_command]`**

```
Execute a function on a smart contract

Options:
  --yaml                        Encode result as YAML instead of JSON
  -y,--yes                      Sign transaction without confirming (yes)
  --home <string>               Directory for config of terracli
  --from <key-name>             *Name of key in terracli keyring
  --generate-only               Build an unsigned transaction and write it to stdout
  -G,--generate-msg             Build an ExecuteMsg (good for including in poll)
  --base64                      For --generate-msg: returns msg as base64
  -b,--broadcast-mode <string>  Transaction broadcasting mode (sync|async|block) (default: sync) (default: "sync")
  --chain-id <string>           Chain ID of Terra node
  -a,--account-number <int>     The account number of the signing account (offline mode)
  -s,--sequence <int>           The sequence number of the signing account (offline mode)
  --memo <string>               Memo to send along with transaction
  --fees <coins>                Fees to pay along with transaction
  --gas <int|auto>              *Gas limit to set per-transaction; set to "auto" to calculate required gas automatically
  --gas-adjustment <float>      Adjustment factor to be multiplied against the estimate returned by the tx simulation
  --gas-prices <coins>          Gas prices to determine the transaction fee (e.g. 10uluna,12.5ukrw)

```

### Query

**USAGE: `airdropcli query|q  state [options] [exec_command]`**

```
Query state of airdrop

Arguments:
  address     (AccAddress) account to query

Options:
  -h, --help  display help for command

```
## Examples
This section illustrates the usage of `airdropcli` through some use cases. 
All examples assume you have a key in `terracli` keychain called `test1`.

### Claim Airdrop
```bash
airdropcli x claim-airdrop --from test1 --gas auto --fees=1000000uusd 
```
### Query Airdrop State of An Address
you can get information for your address with the following query: 
```bash
airdropcli q state $USER_ADDRESS
```
## License

This software is licensed under the Apache 2.0 license. Read more about it [here](./LICENSE).

© 2021 Anchor Protocol