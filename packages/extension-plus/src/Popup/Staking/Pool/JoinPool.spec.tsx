// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, Matcher, render, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import { Chain } from '../../../../../extension-chains/src/types';
import getChainInfo from '../../../util/getChainInfo';
import { AccountsBalanceType, ChainInfo } from '../../../util/plusTypes';
import { amountToMachine } from '../../../util/plusUtils';
import { poolsInfo, poolsMembers, poolStakingConst } from '../../../util/test/testHelper';
import JoinPool from './JoinPool';

ReactDOM.createPortal = jest.fn((modal) => modal);
jest.setTimeout(60000);
const chain: Chain = {
  name: 'westend'
};
const availableBalance = '5.4321';
let chainInfo: ChainInfo;
let staker: AccountsBalanceType;

const setStakeAmount = jest.fn();
const setPool = jest.fn();
const setState = jest.fn();

describe('Testing JoinPool component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend');
    staker = { address: '5GBc8VPqhKhUzHBe7UoG9TSaH1UPFeydZZLVmY8f22s7sKyQ', chain: 'westend', name: 'Amir khan', balanceInfo: { available: amountToMachine(availableBalance, chainInfo.decimals), decimals: chainInfo.decimals } };
  });

  test('Checking the existance of elements', () => {
    const { debug, queryByText, queryByRole } = render(
      <JoinPool
        api={chainInfo.api}
        chain={chain}
        poolStakingConsts={poolStakingConst}
        poolsInfo={poolsInfo}
        poolsMembers={poolsMembers}
        setPool={setPool}
        setStakeAmount={setStakeAmount}
        setState={setState}
        showJoinPoolModal={true}
        staker={staker}
      />
    );

    debug(undefined, 30000);
    expect(queryByText('Join Pool')).toBeTruthy();
    expect(queryByRole('textbox', { name: 'Amount' })).toBeTruthy();
    expect(queryByText('Fee:')).toBeTruthy();
    expect(queryByText('Min:')).toBeTruthy();
    expect(queryByText('Max: ~ ')).toBeTruthy();
    expect(queryByText('Choose a pool to join')).toBeTruthy();
    expect(queryByText('More')).toBeTruthy();
    expect(queryByText('Index')).toBeTruthy();
    expect(queryByText('Name')).toBeTruthy();
    expect(queryByText('Staked')).toBeTruthy();
    expect(queryByText('Members')).toBeTruthy();
    expect(queryByText('Choose')).toBeTruthy();
  });
});
