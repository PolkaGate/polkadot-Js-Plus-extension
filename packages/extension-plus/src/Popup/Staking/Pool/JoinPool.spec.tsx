// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { fireEvent, render, waitFor } from '@testing-library/react';
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
jest.setTimeout(260000);
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

  test('Checking the existance of elements', async () => {
    const { debug, getAllByRole, queryByRole, queryByText } = render(
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

    let poolsLength = 0;

    poolsInfo.map((p) => {
      if (String(p?.bondedPool?.state) === 'Open') {
        poolsLength++;
      }
    });
    debug(undefined, 30000)
    expect(queryByText('Join Pool')).toBeTruthy();
    expect(queryByRole('spinbutton', { hidden: true, name: 'Amount' })).toBeTruthy();
    expect(queryByText('Fee:')).toBeTruthy();

    await waitFor(() => expect(queryByText('min:')).toBeTruthy(), {
      timeout: 20000
    });

    expect(queryByText('max', { exact: false })).toBeTruthy()
    expect(queryByText('Choose a pool to join')).toBeTruthy();

    expect(queryByText('More')).toBeTruthy();
    expect(queryByText('Index')).toBeTruthy();
    expect(queryByText('Name')).toBeTruthy();
    expect(queryByText('Staked')).toBeTruthy();
    expect(queryByText('Members')).toBeTruthy();
    expect(queryByText('Choose')).toBeTruthy();

    expect(getAllByRole('checkbox', { hidden: true })).toHaveLength(poolsLength);
    expect(getAllByRole('checkbox', { checked: true, hidden: true })).toHaveLength(1);

    expect(queryByText('Next')).toBeTruthy();
    expect(queryByText('Next')?.parentNode?.hasAttribute('disabled')).toBe(true);

    fireEvent.change(queryByRole('spinbutton', { hidden: true, name: 'Amount' }), { target: { value: 2 } });
    // debug(undefined, 30000)

    expect(queryByText('Next')).toBeTruthy();
    expect(queryByText('Next')?.parentNode?.hasAttribute('disabled')).toBe(false);
  });
});
