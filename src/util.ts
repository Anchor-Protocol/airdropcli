import {Command } from 'commander';
import * as commander from 'commander';
import * as yaml from 'yaml';
import fetch from 'cross-fetch';

import {
  LCDClient,
  MsgExecuteContract,
  Coins,
  StdSignMsg,
  StdFee
} from '@terra-money/terra.js';
import {
  AddressMap,
  AddressProviderFromJson,
  fabricateAirdropClaim
} from '@anchor-protocol/anchor.js';
import { CLIKey } from '@terra-money/terra.js/dist/key/CLIKey';
const yesno = require('yesno');

interface Airdrop {
  createdAt: string; // date string
  id: number;
  stage: number;
  address: string;
  staked: string;
  total: string;
  rate: string;
  amount: string;
  proof: string; // JsonString<Array<string>>
  merkleRoot: string;
  claimable: boolean;
}

interface IsClaimedResponse {
  is_claimed: boolean;
}

const config = {
  chainID: 'columbus-4',
  URL: 'https://lcd.terra.dev',
  gasPrices: {
    uluna: 0.15,
    usdr: 0.1018,
    uusd: 0.15,
    ukrw: 178.05,
    umnt: 431.6259
  },
  gasAdjustment: '1.2'
};

const contracts = {
  bLunaHub: 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts',
  blunaToken: 'terra1kc87mu460fwkqte29rquh4hc20m54fxwtsx7gp',
  blunaReward: 'terra17yap3mhph35pcwvhza38c2lkj7gzywzy05h7l0',
  blunaAirdrop: 'terra199t7hg7w5vymehhg834r6799pju2q3a0ya7ae9',
  mmInterestModel: 'terra1kq8zzq5hufas9t0kjsjc62t2kucfnx8txf547n',
  mmOracle: 'terra1cgg6yef7qcdm070qftghfulaxmllgmvk77nc7t',
  mmMarket: 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s',
  mmOverseer: 'terra1tmnqgvg567ypvsvk6rwsga3srp7e3lg6u0elp8',
  mmCustody: 'terra1ptjp2vfjrwh0j0faj9r6katm640kgjxnwwq9kn',
  mmLiquidation: 'terra1w9ky73v4g7v98zzdqpqgf3kjmusnx4d4mvnac6',
  mmDistributionModel: 'terra14mufqpr5mevdfn92p4jchpkxp7xr46uyknqjwq',
  aTerra: 'terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu',
  terraswapblunaLunaPair: 'terra1jxazgm67et0ce260kvrpfv50acuushpjsz2y0p',
  terraswapblunaLunaLPToken: 'terra1nuy34nwnsh53ygpc4xprlj263cztw7vc99leh2',
  terraswapAncUstPair: 'terra1gm5p3ner9x9xpwugn9sp6gvhd0lwrtkyrecdn3',
  terraswapAncUstLPToken: 'terra1gecs98vcuktyfkrve9czrpgtg0m3aq586x6gzm',
  gov: 'terra1f32xyep306hhcxxxf7mlyh0ucggc00rm2s9da5',
  distributor: 'terra1mxf7d5updqxfgvchd7lv6575ehhm8qfdttuqzz',
  collector: 'terra14ku9pgw5ld90dexlyju02u4rn6frheexr5f96h',
  community: 'terra12wk8dey0kffwp27l5ucfumczlsc9aned8rqueg',
  staking: 'terra1897an2xux840p9lrh6py3ryankc6mspw49xse3',
  ANC: 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76',
  airdrop: 'terra146ahqn6d3qgdvmj8cj96hh03dzmeedhsf0kxqm'
};

const addresses = new AddressProviderFromJson(<AddressMap>contracts);

async function get_airdrops(address: string): Promise<Airdrop[]> {
  return fetch(
    `https://airdrop.anchorprotocol.com/api/get?address=${address}&chainId=columbus-4`
  ).then((response) => {
    if (!response.ok) {
      console.log('ERROR');
    }
    return response.json();
  });
}

async function send_claim(address: string): Promise<MsgExecuteContract[]> {
  const airdrops = await get_airdrops(address);
  let msgs: MsgExecuteContract[] = [];

  for (const stageData of airdrops) {
    const claimable = await isClaimed(stageData.stage, address);
    if (!claimable.is_claimed) {
      const airdrop_claim = await fabricateAirdropClaim({
        address: address,
        amount: stageData.amount,
        proof: JSON.parse(stageData.proof.toString()) as [string],
        stage: stageData.stage
      })(addresses);

      msgs.push(airdrop_claim[0]);
    }
  }
  return msgs;
}

function createExecMenu(name: string, description: string): commander.Command {
  const exec = new commander.Command(name);
  exec
    .description(description)
    .option('--yaml', 'Encode result as YAML instead of JSON')
    .option('-y,--yes', 'Sign transaction without confirming (yes)')
    .option('--home <string>', 'Directory for config of terracli')
    .option('--from <key-name>', '*Name of key in terracli keyring')
    .option(
      '--generate-only',
      'Build an unsigned transaction and write it to stdout'
    )
    .option(
      '-G,--generate-msg',
      'Build an ExecuteMsg (good for including in poll)'
    )
    .option('--base64', 'For --generate-msg: returns msg as base64')
    .option(
      '-b,--broadcast-mode <string>',
      'Transaction broadcasting mode (sync|async|block) (default: sync)',
      'sync'
    )
    // StdSignMsg
    .option('--chain-id <string>', 'Chain ID of Terra node')
    .option(
      '-a,--account-number <int>',
      'The account number of the signing account (offline mode)'
    )
    .option(
      '-s,--sequence <int>',
      'The sequence number of the signing account (offline mode)'
    )
    .option('--memo <string>', 'Memo to send along with transaction')
    // Fees & Gas
    .option('--fees <coins>', 'Fees to pay along with transaction')
    .option(
      '--gas <int|auto>',
      '*Gas limit to set per-transaction; set to "auto" to calculate required gas automatically'
    )
    .option(
      '--gas-adjustment <float>',
      'Adjustment factor to be multiplied against the estimate returned by the tx simulation'
    )
    .option(
      '--gas-prices <coins>',
      'Gas prices to determine the transaction fee (e.g. 10uluna,12.5ukrw)'
    );

  return exec;
}

function createQueryMenu(name: string, description: string): commander.Command {
  const query = new commander.Command(name);
  query
    .description(description)
    .option('--yaml', 'Encode result as YAML instead of JSON');
  return query;
}

async function handleExecCommand(
  exec: commander.Command,
  createMsg: MsgExecuteContract[]
) {
  if (!exec.generateMsg) {
    if (exec.from === undefined) {
      throw new Error(
        `--from <key-name> must be provided if not --generate-msg`
      );
    }

    if (exec.gas === undefined) {
      throw new Error(
        `--gas <int|auto> must be provided if not --generate-msg`
      );
    }
  }

  const lcd = new LCDClient({
    chainID: config.chainID,
    URL: config.URL,
    gasPrices: config.gasPrices,
    gasAdjustment: config.gasAdjustment
  });
  const key = new CLIKey({ keyName: exec.from, home: exec.home });
  const wallet = lcd.wallet(key);
  const msgs = createMsg;

  const chainId: string = exec.chainId ? exec.chainId : lcd.config.chainID;

  const memo: string = exec.memo ? exec.memo : '';

  let accountNumber: number;
  let sequence: number;

  if (!!exec.accountNumber || !!exec.sequence) {
    // don't look up account-number and sequence values from blockchain
    // ensure that both account number and sequence number are set
    if (exec.accountNumber === undefined || exec.sequence === undefined) {
      throw new Error(
        `both account-number and sequence must be provided if one is provided.`
      );
    }
    accountNumber = +exec.accountNumber;
    sequence = +exec.sequence;
  } else {
    // looks up wallet values from blockchain
    const accountInfo = await wallet.accountNumberAndSequence();
    accountNumber = accountInfo.account_number;
    sequence = accountInfo.sequence;
  }

  let gas: number;
  let feeAmount: Coins = new Coins({});

  if (exec.gas === 'auto') {
    // estimate gas
    const estimatedFee = (
      await lcd.tx.create(key.accAddress, {
        msgs,
        account_number: accountNumber,
        sequence,
        gasPrices: exec.gasPrices,
        gasAdjustment: exec.gasAdjustment,
        memo
      })
    ).fee;

    gas = estimatedFee.gas;

    if (exec.fees === undefined) {
      feeAmount = estimatedFee.amount;
    } else {
      feeAmount = Coins.fromString(exec.fees);
    }
  } else {
    if (exec.fees === undefined) {
      feeAmount = new Coins({});
    } else {
      feeAmount = Coins.fromString(exec.fees);
    }

    gas = Number.parseInt(exec.gas);
  }

  const unsignedTx = new StdSignMsg(
    chainId,
    accountNumber,
    sequence,
    new StdFee(gas, feeAmount),
    msgs,
    memo
  );

  if (exec.generateOnly) {
    if (exec.yaml) {
      console.log(yaml.stringify(unsignedTx.toStdTx().toData()));
    } else {
      console.log(unsignedTx.toStdTx().toData());
    }
  } else {
    if (!exec.yes) {
      let msg = unsignedTx.msgs[0].toData() as any;
      msg.value.execute_msg = (unsignedTx
        .msgs[0] as MsgExecuteContract).execute_msg;
      console.log(
        yaml.stringify({
          chainId,
          msg,
          fee: unsignedTx.fee.toData(),
          memo
        })
      );

      const ok = await yesno({
        question: `Confirm and sign transaction with key ${exec.from}? (y/N)`,
        defaultValue: false
      });

      if (!ok) {
        console.log('Process aborted.');
        process.exit(1);
      }
    }
    const signedTx = await key.signTx(unsignedTx);
    let result;
    switch (exec.broadcastMode) {
      case 'sync':
        result = await lcd.tx.broadcastSync(signedTx);
        break;
      case 'async':
        result = await lcd.tx.broadcastAsync(signedTx);
        break;
      case 'block':
        result = await lcd.tx.broadcast(signedTx);
        break;
      default:
        throw new Error(
          `invalid broadcast-mode '${exec.broadcastMode}' - must be sync|async|block`
        );
    }
    if (exec.yaml) {
      console.log(yaml.stringify(result));
    } else {
      console.log(result);
    }
  }
}

interface Option {
  address?: string;
}
export const exec_command = new Command('exec');
exec_command.alias('x');
exec_command.description('Execute a airdrop claim on a smart contract');

const exec = createExecMenu(
  'claim-airdrop',
  'Search the airdrop state of the address and send claim airdrop message'
);

const claimAirdrop = exec.action(async () => {
  const key = new CLIKey({ keyName: exec.from, home: exec.home });
  const msgs = await send_claim(key.accAddress);
  if (msgs.length === 0) {
    console.log('No Airdrops to claim');
  } else {
    await handleExecCommand(exec, msgs);
  }
});

exec_command.addCommand(exec);

const query = createQueryMenu('query', 'Query state of airdrop');
query.alias('q');

const queryState = query
  .command('state <address>')
  .description('Query state of airdrop', {
    address: '(AccAddress) account to query'
  })
  .action(async (address: string) => {
    let airdrops = await get_airdrops(address);
    for (const stageData of airdrops) {
      const claimed = await isClaimed(stageData.stage, address);
      stageData.claimable = claimed.is_claimed;
    }
    console.log(yaml.stringify(airdrops));
  });

async function isClaimed(
  stage: number,
  address: string
): Promise<IsClaimedResponse> {
  const lcd = new LCDClient({
    chainID: config.chainID,
    URL: config.URL,
    gasPrices: config.gasPrices,
    gasAdjustment: config.gasAdjustment
  });

  const query: IsClaimedResponse = await lcd.wasm.contractQuery(
    contracts.airdrop,
    {
      is_claimed: {
        stage: stage,
        address: address
      }
    }
  );
  return query;
}

export default {
  exec_command,
  query
};
