// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import '@polkadot/extension-mocks/chrome';

import { render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { Chain } from '@polkadot/extension-chains/types';
import { BN } from '@polkadot/util';

import ShowBalance2 from '../../../components/ShowBalance2';
import getChainInfo from '../../../util/getChainInfo';
import { AccountsBalanceType, ChainInfo } from '../../../util/plusTypes';
import { amountToMachine } from '../../../util/plusUtils';
import { pool, poolStakingConst } from '../../../util/test/testHelper';
import Stake from './Stake';

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);
const chain: Chain = {
  name: 'westend'
};
const availableBalance = '5.4321';
let chainInfo: ChainInfo;
const nextToStakeButtonBusy = false;
const state = '';
let staker: AccountsBalanceType;

const setStakeAmount = () => null;

const setState = () => null;

describe('Testing EasyStaking component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend');
    staker = { balanceInfo: { available: amountToMachine(availableBalance, chainInfo.decimals), decimals: chainInfo.decimals } };
  });

  test.skip('Checking the exist component while loading', () => {
    const { queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={undefined} // undefined == loading      // testfield
        handleConfirmStakingModaOpen={setState}
        myPool={undefined} // don't care
        nextPoolId={undefined} // don't care
        nextToStakeButtonBusy={nextToStakeButtonBusy}
        poolStakingConsts={poolStakingConst} // don't care
        poolsInfo={undefined} // don't care
        poolsMembers={undefined} // don't care
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );

    expect(queryByText('Loading ...'));
  });

  test.skip('Checking the exist component when account hasn\'t staked', () => {
    const { queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={null} // (null || zero) && !mypool chose to join or create
        handleConfirmStakingModaOpen={setState}
        myPool={null}
        nextPoolId={undefined} // don't care
        nextToStakeButtonBusy={nextToStakeButtonBusy}
        poolStakingConsts={poolStakingConst}
        poolsInfo={undefined} // don't care
        poolsMembers={undefined} // don't care
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );

    const ShowValue = (value: BN) => {
      return render(
        <ShowBalance2
          api={chainInfo.api}
          balance={value}
        />
      ).asFragment().textContent;
    };

    expect(queryByText('Create pool'));
    expect(queryByText('Min to join:'));
    expect(queryByText(`${ShowValue(poolStakingConst?.minJoinBond)}`));

    expect(queryByText('Join pool'));
    expect(queryByText('Min to create:'));
    expect(queryByText(`${ShowValue(poolStakingConst?.minCreationBond)}`));
  });

  test.skip('Checking the exist component while loading when account has staked and pool state is OPEN or BLOCKED also available balance > 0', () => {
    const currentlyStaked = pool('joinPool').member.points;

    const { queryByLabelText, queryByRole, queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={currentlyStaked}
        handleConfirmStakingModaOpen={setState}
        myPool={pool('joinPool')}
        nextPoolId={undefined}
        nextToStakeButtonBusy={nextToStakeButtonBusy}
        poolStakingConsts={poolStakingConst}
        poolsInfo={undefined}
        poolsMembers={undefined}
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );

    const amountInput = queryByRole('spinbutton');

    expect(queryByLabelText('Amount')).toBeTruthy();
    expect(queryByText('Min:')).toBeTruthy();
    expect(queryByText('Max: ~')).toBeTruthy();
    expect(queryByText('You are staking in "{{poolName}}" pool (index: {{poolId}}).'));
    expect(amountInput?.hasAttribute('disabled')).toBeFalsy();
  });

  test.skip('Checking the exist component while loading when account has staked and pool state is OPEN or BLOCKED also available balance > 0', () => {
    const currentlyStaked = pool('joinPool').member.points;

    staker.balanceInfo?.available = '0';

    const { queryByLabelText, queryByRole, queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={currentlyStaked}
        handleConfirmStakingModaOpen={setState}
        myPool={pool('joinPool')}
        nextPoolId={undefined}
        nextToStakeButtonBusy={nextToStakeButtonBusy}
        poolStakingConsts={poolStakingConst}
        poolsInfo={undefined}
        poolsMembers={undefined}
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );

    const amountInput = queryByRole('spinbutton');

    expect(queryByLabelText('Amount')).toBeTruthy();
    expect(queryByText('Min:')).toBeTruthy();
    expect(queryByText('Max: ~')).toBeTruthy();
    expect(queryByText('You are staking in "{{poolName}}" pool (index: {{poolId}}).'));
    expect(amountInput?.hasAttribute('disabled')).toBeFalsy();
  });

  test.only('Checking the exist component when account has staked and pool state is DESTROYING', () => {
    const currentlyStaked = pool('joinPool').member.points;

    const { queryByLabelText, queryByRole, queryByText } = render(
      <Stake
        api={chainInfo.api}
        chain={chain}
        currentlyStaked={currentlyStaked}
        handleConfirmStakingModaOpen={setState}
        myPool={pool('')}
        nextPoolId={undefined}
        nextToStakeButtonBusy={nextToStakeButtonBusy}
        poolStakingConsts={poolStakingConst}
        poolsInfo={undefined}
        poolsMembers={undefined}
        setNewPool={setState}
        setStakeAmount={setStakeAmount}
        setState={setState}
        staker={staker}
        state={state}
      />
    );
    const amountInput = queryByRole('spinbutton');

    expect(queryByLabelText('Amount')).toBeTruthy();
    expect(queryByText('Min:')).toBeTruthy();
    expect(queryByText('Max: ~')).toBeTruthy();
    expect(queryByText('You are staking in "{{poolName}}" pool (index: {{poolId}}).'));
    expect(amountInput?.hasAttribute('disabled')).toBeTruthy();
  });
});
