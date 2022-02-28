// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import '@polkadot/extension-mocks/chrome';

import type { StakingLedger } from '@polkadot/types/interfaces';

import { fireEvent, render, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import getChainInfo from '../../util/getChainInfo';
import { BalanceType, ChainInfo, StakingConsts, ValidatorsName } from '../../util/plusTypes';
import { amountToHuman, amountToMachine } from '../../util/plusUtils';
import ConfirmStaking from './ConfirmStaking';

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

const validatorsName: ValidatorsName[] = [
  { address: '5HNJ3k2Xr3CKiygecfWnpsq9dDJvFGMbNu1ckDqAUJHwf45P', name: 'Chris' },
  { address: '5Dt2dFSLVwiKtEHC7VrVEiJDiVLRiDbaFRBdh8MBSvwuvDCD', name: 'Adam' },
  { address: '5DviS2M1kyyqs1GzMxHAjS3Si49hS3N2Jib9jz4Yx7pJgQHu', name: 'Diego' },
  { address: '5DVDZcaxCDLStUgnqkx67ZrYP9ZQ4hpSiVsHiUmfJh8VTo8S', name: 'Moly' },
  { address: '5GVzG3QJvRc6MEtxaJZnLB3PAhQT8eMgesqgHxYiiQJE4HNv', name: 'Mary' },
  { address: '5CPDNHdbZMNNeHLq7t9Cc434CM1fBL6tkaifiCG3kaQ8KHv8', name: 'NewYork Times' },
  { address: '5CFPcUJgYgWryPaV1aYjSbTpbTLu42V32Ytw1L9rfoMAsfGh', name: 'Amir' },
  { address: '5C864nyotaG4cNoR3YBUqnPVnnvqF1NN1s9t9CuAebyQkQGF', name: 'Olivia' },
  { address: '5GYaYNVq6e855t5hVCyk4Wuqssaf6ADTrvdPZ3QXyHvFXTip', name: 'Emma' },
  { address: '5Ek5JCnrRsyUGYNRaEvkufG1i1EUxEE9cytuWBBjA9oNZVsf', name: 'Mia' }
];
const others = [
  { who: validatorsName[0].address, value: 2331341969325348 },
  { who: validatorsName[1].address, value: 2233136292040751 },
  { who: validatorsName[2].address, value: 1102408869404150 },
  { who: validatorsName[3].address, value: 536346326599754 },
  { who: validatorsName[4].address, value: 536346326599754 },
  { who: validatorsName[5].address, value: 536346326599754 },
  { who: validatorsName[6].address, value: 536346326599754 },
  { who: validatorsName[7].address, value: 536346326599754 },
  { who: validatorsName[8].address, value: 536346326599754 },
  { who: validatorsName[9].address, value: 123257089339220 }
];
const validatorsList: DeriveStakingQuery[] = [
  { accountId: validatorsName[0].address, exposure: { others: others.slice(0, 1), own: 0.12345, total: 1.23456 }, validatorPrefs: { commission: 200000000 } },
  { accountId: validatorsName[1].address, exposure: { others: others.slice(0, 2), own: 0.23451, total: 12.3456 }, validatorPrefs: { commission: 210000000 } },
  { accountId: validatorsName[2].address, exposure: { others: others.slice(0, 3), own: 0.34512, total: 123.456 }, validatorPrefs: { commission: 150000000 } },
  { accountId: validatorsName[3].address, exposure: { others: others.slice(0, 4), own: 0.45123, total: 1234.56 }, validatorPrefs: { commission: 90000000 } },
  { accountId: validatorsName[4].address, exposure: { others: others.slice(0, 6), own: 0.51234, total: 12345.6 }, validatorPrefs: { commission: 750000000 } },
  { accountId: validatorsName[5].address, exposure: { others: others.slice(0, 7), own: 0.11234, total: 1234567 }, validatorPrefs: { commission: 160000000 } },
  { accountId: validatorsName[6].address, exposure: { others: others.slice(0, 8), own: 0.22345, total: 12345678 }, validatorPrefs: { commission: 130000000 } }
];
const validatorsIdentities: DeriveAccountInfo[] = [
  { accountId: validatorsList[0].accountId, identity: { display: validatorsName[0].name } },
  { accountId: validatorsList[1].accountId, identity: { display: validatorsName[1].name } },
  { accountId: validatorsList[2].accountId, identity: { display: validatorsName[2].name } },
  { accountId: validatorsList[3].accountId, identity: { display: validatorsName[3].name } },
  { accountId: validatorsList[4].accountId, identity: { display: validatorsName[4].name } },
  { accountId: validatorsList[5].accountId, identity: { display: validatorsName[5].name } },
  { accountId: validatorsList[6].accountId, identity: { display: validatorsName[6].name } }
];
const decimals = 12;
const validAmountToStake = 10;
const amountToUnstake = 7;
const invalidAmountToStake = 14.99;
const redeemAmount = 5;
const availableBalanceInHuman = 15; // WND
const balanceInfo: BalanceType = {
  available: amountToMachine(availableBalanceInHuman.toString(), decimals),
  coin: 'WND',
  decimals: decimals,
  total: amountToMachine(availableBalanceInHuman.toString(), decimals)
};

const chain: Chain = {
  name: 'westend'
};
let chainInfo: ChainInfo;
const ledger: StakingLedger = {
  active: 4000000000000n
};
const staker = {
  address: '5DaBEgUMNUto9krwGDzXfSAWcMTxxv7Xtst4Yjpq9nJue7tm',
  balanceInfo: balanceInfo,
  chain: 'westend',
  name: 'Amir khan'
};
const stakingConsts: StakingConsts = {
  bondingDuration: 28,
  existentialDeposit: 10000000000n,
  maxNominations: 16,
  maxNominatorRewardedPerValidator: 64,
  minNominatorBond: 1
};
const state = ['stakeAuto', 'stakeManual', 'stakeKeepNominated', 'changeValidators', 'setNominees', 'unstake', 'withdrawUnbound', 'stopNominating'];
// const validatorsToList: DeriveStakingQuery[] = validatorsList;
const setState = () => null;

describe('Testing ConfirmStaking component', () => {
  beforeAll(async () => chainInfo = await getChainInfo('westend'));

  test('when state is stakeAuto, stakeManual, stakeKeepNominated', () => {
    const amount = amountToMachine(validAmountToStake.toString(), decimals);

    const { queryAllByText, queryByLabelText, queryByTestId, queryByText } = render(
      <ConfirmStaking
        amount={amount}
        chain={chain}
        chainInfo={chainInfo}
        ledger={ledger}
        nominatedValidators={validatorsList}
        selectedValidators={validatorsList}
        setState={setState}
        showConfirmStakingModal={true}
        staker={staker}
        stakingConsts={stakingConsts}
        state={state[0]}
        validatorsIdentities={validatorsIdentities}
      />
    );
    const currentlyStaked = amountToHuman(ledger.active.toString(), chainInfo?.decimals);
    const amountToStakeInHuman = amountToHuman(amount.toString(), chainInfo?.decimals);
    const confirmButton = queryAllByText('Confirm')[1];

    expect(queryByText('STAKING OF')).toBeTruthy();
    expect(queryByTestId('amount').textContent).toEqual(`${amountToStakeInHuman}${chainInfo.coin}`);
    expect(queryByText('Currently staked')).toBeTruthy();
    expect(queryByText(`${currentlyStaked} ${chainInfo.coin}`)).toBeTruthy();
    expect(queryByText('Fee')).toBeTruthy();
    expect(queryByText('Total staked')).toBeTruthy();
    expect(queryByText(`${Number(currentlyStaked) + Number(amountToStakeInHuman)} ${chainInfo.coin}`)).toBeTruthy();

    expect(queryByText(`VALIDATORS (${validatorsList.length})`)).toBeTruthy();
    expect(queryByText('More')).toBeTruthy();
    expect(queryByText('Identity')).toBeTruthy();
    expect(queryByText('Staked')).toBeTruthy();
    expect(queryByText('Commission')).toBeTruthy();
    expect(queryByText('Nominators')).toBeTruthy();

    for (const validator of validatorsList) {
      expect(queryByText(validatorsIdentities[validatorsList.indexOf(validator)].identity.display)).toBeTruthy();
      expect(queryByText(validator.exposure.total.toLocaleString())).toBeTruthy();
      expect(queryByText(`${validator.validatorPrefs.commission / (10 ** 7)}%`)).toBeTruthy();
      expect(queryByText(validator.exposure.others.length)).toBeTruthy();
    }

    expect(queryByLabelText('Password')).toBeTruthy();
    fireEvent.change(queryByLabelText('Password'), { target: { value: 'invalidPassword' } });
    expect(queryByText('Please enter the account password')).toBeTruthy();
    fireEvent.click(confirmButton);
    expect(queryByText('Password is not correct')).toBeTruthy();
  });

  test('when auto adjust is needed (amount ~= available)', async () => {
    const { queryAllByText, queryByLabelText, queryByText } = render(
      <ConfirmStaking
        amount={staker.balanceInfo.available}
        chain={chain}
        chainInfo={chainInfo}
        ledger={ledger}
        nominatedValidators={validatorsList}
        selectedValidators={validatorsList}
        setState={setState}
        showConfirmStakingModal={true}
        staker={staker}
        stakingConsts={stakingConsts}
        state={state[0]}
        validatorsIdentities={validatorsIdentities}
      />
    );

    await waitForElementToBeRemoved(() => queryAllByText('Confirm')[1], { timeout: 20000 });
    expect(queryByText('Account reap issue, consider fee!')).toBeTruthy();

    expect(queryByLabelText('Adjust')).toBeTruthy();
    fireEvent.click(queryByLabelText('Adjust'));
    expect(queryAllByText('Confirm')).toHaveLength(2);
  });

  test('when state is stopNominating', () => {
    const { queryByTestId, queryByText } = render(
      <ConfirmStaking
        amount={null}
        chain={chain}
        chainInfo={chainInfo}
        ledger={ledger}
        nominatedValidators={validatorsList}
        selectedValidators={[]}
        setState={setState}
        showConfirmStakingModal={true}
        staker={staker}
        stakingConsts={stakingConsts}
        state={state[7]}
        validatorsIdentities={[]}
      />
    );

    expect(queryByText('STOP NOMINATING')).toBeTruthy();
    expect(queryByTestId('amount').textContent).toBeFalsy();
    expect(queryByText('Declaring no desire to nominate validators')).toBeTruthy();
  });

  test('when state is changeValidator, setNominees', () => {
    const { queryByTestId, queryByText } = render(
      <ConfirmStaking
        amount={null}
        chain={chain}
        chainInfo={chainInfo}
        ledger={ledger}
        nominatedValidators={validatorsList}
        selectedValidators={validatorsList}
        setState={setState}
        showConfirmStakingModal={true}
        staker={staker}
        stakingConsts={stakingConsts}
        state={state[3]}
        validatorsIdentities={validatorsIdentities}
      />
    );

    expect(queryByText('NOMINATING')).toBeTruthy();
    expect(queryByTestId('amount').textContent).toBeFalsy();
  });

  test('when state is unstake', () => {
    const amount = amountToMachine(amountToUnstake.toString(), decimals);

    const { queryByTestId, queryByText } = render(
      <ConfirmStaking
        amount={amount}
        chain={chain}
        chainInfo={chainInfo}
        ledger={ledger}
        nominatedValidators={[]}
        selectedValidators={[]}
        setState={setState}
        showConfirmStakingModal={true}
        staker={staker}
        stakingConsts={stakingConsts}
        state={state[5]}
        validatorsIdentities={[]}
      />
    );
    const amountToUnstakeInHuman = amountToHuman(amount.toString(), chainInfo?.decimals);

    expect(queryByText('UNSTAKING')).toBeTruthy();
    expect(queryByTestId('amount').textContent).toEqual(`${amountToUnstakeInHuman}${chainInfo.coin}`);
    expect(queryByText('Note: The unstaked amount will be redeemable after {{days}} days')).toBeTruthy();
  });

  test('when state is withdrawUnbound', () => {
    const amount = amountToMachine(redeemAmount.toString(), decimals);

    const { queryByText } = render(
      <ConfirmStaking
        amount={amount}
        chain={chain}
        chainInfo={chainInfo}
        ledger={ledger}
        nominatedValidators={[]}
        selectedValidators={[]}
        setState={setState}
        showConfirmStakingModal={true}
        staker={staker}
        stakingConsts={stakingConsts}
        state={state[6]}
        validatorsIdentities={[]}
      />
    );

    // await waitForElementToBeRemoved(() => queryByTestId('txInfo').children.item(1).children.item(1).children.item(0), { timeout: 50000 });
    // const fee = queryByTestId('txInfo').children.item(1).children.item(1).textContent.slice(0, 6);

    // const feeInMachine = amountToMachine(fee, chainInfo.decimals);
    // const newAavailable = amountToHuman(String(BigInt(amount + staker.balanceInfo.available) - feeInMachine), chainInfo.decimals);

    expect(queryByText('REDEEM')).toBeTruthy();
    expect(queryByText('Available balance after redeem will be', { exact: false })).toBeTruthy();
  });
});
