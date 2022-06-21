// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import '@polkadot/extension-mocks/chrome';

import { cleanup, Matcher, render, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import getChainInfo from '../../../util/getChainInfo';
import { AccountsBalanceType, ChainInfo } from '../../../util/plusTypes';
import { amountToMachine } from '../../../util/plusUtils';
import { chain, makeShortAddr, poolStakingConst } from '../../../util/test/testHelper';
import CreatePool from './CreatePool';

ReactDOM.createPortal = jest.fn((modal) => modal);
jest.setTimeout(60000);
let chainInfo: ChainInfo;
const availableBalance = '5.4321';
let staker: AccountsBalanceType;
const nextPoolId = new BN('105');
const setStakeAmount = () => null;
const setNewPool = () => null;

describe('Testing CreatePool component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend');
    staker = { address: '5GBc8VPqhKhUzHBe7UoG9TSaH1UPFeydZZLVmY8f22s7sKyQ', chain: 'westend', name: 'Amir khan', balanceInfo: { available: amountToMachine(availableBalance, chainInfo.decimals), decimals: chainInfo.decimals } };
  });

  test('Checking the existance of elements', async () => {
    const { debug, queryByText, queryByLabelText } = render(
      <CreatePool
        api={chainInfo.api} // bob
        chain={chain()}
        nextPoolId={nextPoolId}
        poolStakingConsts={poolStakingConst} // bob
        setNewPool={setNewPool}
        setStakeAmount={setStakeAmount}
        showCreatePoolModal={true}
        staker={staker}
      />
    );
    // debug(undefined, 30000);

    expect(queryByText('Create Pool')).toBeTruthy();
    expect(queryByLabelText('Pool name')).toBeTruthy();
    expect(queryByLabelText('Pool Id')).toBeTruthy();
    expect(queryByLabelText('Amount')).toBeTruthy();
    expect(queryByText('Fee:')).toBeTruthy();
    // expect(queryByText('Min:')).toBeTruthy();

    await waitFor(() => expect(queryByText('Min:')).toBeTruthy(), { timeout: 30000 });
    expect(queryByText('Max: ~ ')).toBeTruthy();
    expect(queryByLabelText('Depositor')).toBeTruthy();
    expect(queryByLabelText('Root')).toBeTruthy();
    expect(queryByLabelText('Nominator')).toBeTruthy();
    expect(queryByLabelText('State toggler')).toBeTruthy();
  });
});
