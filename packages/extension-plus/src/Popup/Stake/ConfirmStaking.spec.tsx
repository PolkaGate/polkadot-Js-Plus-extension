// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import '@polkadot/extension-mocks/chrome';

import type { StakingLedger } from '@polkadot/types/interfaces';

import { fireEvent, render, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { Chain } from '../../../../extension-chains/src/types';
import getChainInfo from '../../util/getChainInfo';
import { BalanceType, ChainInfo } from '../../util/plusTypes';
import { amountToHuman, amountToMachine } from '../../util/plusUtils';
import { stakingConsts, validatorsIdentities, validatorsList } from '../../util/test/testHelper';
import ConfirmStaking from './ConfirmStaking';

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

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
const state = ['stakeAuto', 'stakeManual', 'stakeKeepNominated', 'changeValidators', 'setNominees', 'unstake', 'withdrawUnbound', 'stopNominating'];
const setState = () => null;

describe('Testing ConfirmStaking component', () => {
  beforeAll(async () => chainInfo = await getChainInfo('westend'));

  test('when state is stakeAuto, stakeManual, stakeKeepNominated', async () => {
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
    await waitFor(() => queryByText('Password is not correct'), { timeout: 5000 });
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

    expect(queryByText('REDEEM')).toBeTruthy();
    expect(queryByText('Available balance after redeem will be', { exact: false })).toBeTruthy();
  });
});
