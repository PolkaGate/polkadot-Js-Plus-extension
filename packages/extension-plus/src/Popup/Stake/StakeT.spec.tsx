// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import '@polkadot/extension-mocks/chrome';

import type { StakingLedger } from '@polkadot/types/interfaces';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, StakingConsts, ValidatorsName } from '../../util/plusTypes';
import { amountToMachine } from '../../util/plusUtils';
import Stake from './Stake';

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

const validatorsName: ValidatorsName[] = [
  { address: '5HNJ3k2Xr3CKiygecfWnpsq9dDJvFGMbNu1ckDqAUJHwf45P', name: 'Chris' },
  { address: '5Dt2dFSLVwiKtEHC7VrVEiJDiVLRiDbaFRBdh8MBSvwuvDCD', name: 'Amir' },
  { address: '5DviS2M1kyyqs1GzMxHAjS3Si49hS3N2Jib9jz4Yx7pJgQHu', name: 'Diego' },
  { address: '5DVDZcaxCDLStUgnqkx67ZrYP9ZQ4hpSiVsHiUmfJh8VTo8S', name: 'Moly' },
  { address: '5GVzG3QJvRc6MEtxaJZnLB3PAhQT8eMgesqgHxYiiQJE4HNv', name: 'Mary' }
];
const others = [
  { who: validatorsName[0].address, value: 2331341969325348 },
  { who: validatorsName[1].address, value: 2233136292040751 },
  { who: validatorsName[2].address, value: 1102408869404150 },
  { who: validatorsName[3].address, value: 536346326599754 },
  { who: validatorsName[4].address, value: 123257089339220 }
];
const availableBalance = '5.4321';
let chainInfo: ChainInfo;
const nextToStakeButtonBusy = false;
const nominatedValidators: DeriveStakingQuery[] = [
  { accountId: validatorsName[0].address, exposure: { others: others.slice(1), total: 1.23456 }, validatorPrefs: { commission: 200000000 } },
  { accountId: validatorsName[1].address, exposure: { others: others.slice(0, 1), total: 12.3456 }, validatorPrefs: { commission: 210000000 } },
  { accountId: validatorsName[2].address, exposure: { others: others.slice(3), total: 123.456 }, validatorPrefs: { commission: 150000000 } },
  { accountId: validatorsName[3].address, exposure: { others: others.slice(2), total: 1234.56 }, validatorPrefs: { commission: 90000000 } },
  { accountId: validatorsName[4].address, exposure: { others: others, total: 12345.6 }, validatorPrefs: { commission: 750000000 } }
];
const stakingConsts: StakingConsts = {
  bondingDuration: 28,
  existentialDeposit: 10000000000n,
  maxNominations: 16,
  maxNominatorRewardedPerValidator: 64,
  minNominatorBond: 1
};
const state = '';
let staker;

const setStakeAmount = () => { };

const ledger: StakingLedger = {
  active: 0n
};
const invalidHugeAmountForStaking = '123456789';
const invalidTinyAmountForStaking = '0.12345';
const validAmount = 1;

describe('Testing EasyStaking component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend');
    staker = { balanceInfo: { available: amountToMachine(availableBalance, chainInfo.decimals), decimals: chainInfo.decimals } };
  });

  test('Checking the exist component', async () => {
    const { debug, queryAllByRole, queryByLabelText, queryByRole, queryByText } = render(
      <Stake
        chainInfo={chainInfo}
        ledger={ledger}
        nextToStakeButtonBusy={nextToStakeButtonBusy}
        nominatedValidators={nominatedValidators}
        setStakeAmount={setStakeAmount}
        staker={staker}
        stakingConsts={stakingConsts}
        state={state}
      />);

    expect(queryByLabelText('Amount')).toBeTruthy();
    await waitFor(() => queryByText('Min:'), { timeout: 10000 });
    expect(queryByText('Min:')).toBeTruthy();
    expect(queryByText('Max: ~')).toBeTruthy();
    expect(queryByText('Validator selection:')).toBeTruthy();
    expect(queryByText('Auto')).toBeTruthy();
    expect(queryByText('Manual')).toBeTruthy();
    expect(queryByText('Keep nominated')).toBeTruthy();
    expect(queryByText('Next')).toBeTruthy();
    const minButton = queryAllByRole('button')[0];
    const maxButton = queryAllByRole('button')[1];
    const nextStepButton = queryAllByRole('button')[2];
    const amountInput = queryByRole('spinbutton');

    expect(nextStepButton.hasAttribute('disabled')).toBe(true);

    fireEvent.click(minButton);
    expect(nextStepButton.hasAttribute('disabled')).toBe(false);
    expect(Number(amountInput.value)).toEqual(stakingConsts.minNominatorBond);

    fireEvent.click(maxButton);
    expect(nextStepButton.hasAttribute('disabled')).toBe(false);
    expect(Number(amountInput.value)).toBeLessThanOrEqual(Number(availableBalance));

    fireEvent.change(amountInput, { target: { value: validAmount } });
    expect(nextStepButton.hasAttribute('disabled')).toBe(false);
  });

  test('Checking the exist component', () => {
    const { queryAllByRole, queryByRole, queryByText } = render(
      <Stake
        chainInfo={chainInfo}
        ledger={ledger}
        nextToStakeButtonBusy={nextToStakeButtonBusy}
        nominatedValidators={nominatedValidators}
        setStakeAmount={setStakeAmount}
        staker={staker}
        stakingConsts={stakingConsts}
        state={state}
      />
    );
    const nextStepButton = queryAllByRole('button')[2];
    const amountInput = queryByRole('spinbutton');

    expect(amountInput).toBeTruthy();
    fireEvent.change(amountInput, { target: { value: invalidHugeAmountForStaking } });
    expect(queryByText('Insufficient Balance')).toBeTruthy();
    expect(nextStepButton.hasAttribute('disabled')).toBe(true);

    fireEvent.change(amountInput, { target: { value: invalidTinyAmountForStaking } });
    expect(queryByText('Staking amount is too low, it must be at least 1 WND')).toBeTruthy();
    expect(nextStepButton.hasAttribute('disabled')).toBe(true);
  });
});
