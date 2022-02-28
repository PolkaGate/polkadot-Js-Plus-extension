// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import '@polkadot/extension-mocks/chrome';

import { render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, StakingConsts } from '../../util/plusTypes';
import { amountToHuman } from '../../util/plusUtils';
import Info from './InfoTab';

let chainInfo: ChainInfo = null;
const stakingConsts: StakingConsts = {
  bondingDuration: 28,
  existentialDeposit: 10000000000n,
  maxNominations: 16,
  maxNominatorRewardedPerValidator: 64,
  minNominatorBond: 1
};

ReactDOM.createPortal = jest.fn((modal) => modal);

describe('Testing Info component', () => {
  test('Checking exist element while loading!', () => {
    const { queryByText } = render(
      <Info
        chainInfo={chainInfo}
        stakingConsts={stakingConsts}
      />);

    expect(queryByText('Welcome to Staking')).toBeTruthy();
    expect(queryByText('Information you need to know about')).toBeTruthy();
    expect(queryByText('Loading information ...')).toBeTruthy();
  });

  test('Checking exist element when loading is done', async () => {
    chainInfo = await getChainInfo('westend');
    const { queryByTestId, queryByText } = render(
      <Info
        chainInfo={chainInfo}
        stakingConsts={stakingConsts}
      />);

    expect(queryByText('Welcome to Staking')).toBeTruthy();
    expect(queryByText('Information you need to know about')).toBeTruthy();
    expect(queryByTestId('info').children.item(3).textContent).toEqual(`Maximum validators you can select:   ${stakingConsts.maxNominations}`);
    expect(queryByTestId('info').children.item(4).textContent).toEqual(`Minimum ${chainInfo.coin}s to be a staker:   ${stakingConsts.minNominatorBond} ${chainInfo.coin}s`);
    expect(queryByTestId('info').children.item(5).textContent).toEqual(`Maximum stakers of a validator, who receives rewards:   ${stakingConsts.maxNominatorRewardedPerValidator}`);
    expect(queryByTestId('info').children.item(6).textContent).toEqual(`Days it takes to receive your funds back after unstaking:    ${stakingConsts.bondingDuration}  days`);
    expect(queryByTestId('info').children.item(7).textContent).toEqual(`Minimum ${chainInfo.coin}s that must remain in you account: ${amountToHuman(stakingConsts.existentialDeposit.toString(), chainInfo.decimals)} ${chainInfo.coin}s plus some fees`);
  });
});
