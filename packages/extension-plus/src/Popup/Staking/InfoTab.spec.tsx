// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import '@polkadot/extension-mocks/chrome';

import { render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo } from '../../util/plusTypes';
import { amountToHuman } from '../../util/plusUtils';
import { stakingConsts } from '../../util/test/testHelper';
import Info from './InfoTab';

let chainInfo: ChainInfo | null = null;

ReactDOM.createPortal = jest.fn((modal) => modal);
jest.setTimeout(60000);

describe('Testing Info component', () => {
  test('Checking exist element while loading!', () => {
    const { queryByText } = render(
      <Info
        chainInfo={chainInfo}
        stakingConsts={stakingConsts}
      />);

    expect(queryByText('Welcome to Staking')).toBeTruthy();
    expect(queryByText('Information you need to know about')).toBeTruthy();
    // expect(queryByText('Loading information ...')).toBeTruthy();
  });

  test('Checking the existence of elements when loading is done', async () => {
    chainInfo = await getChainInfo('westend');
    const { queryByTestId, queryByText } = render(
      <Info
        chainInfo={chainInfo}
        stakingConsts={stakingConsts}
      />);

    expect(queryByText('Welcome to Staking')).toBeTruthy();
    expect(queryByText('Information you need to know about')).toBeTruthy();
    expect(queryByTestId('info').children.item(3).textContent).toEqual(`Maximum validators you can select:   ${stakingConsts.maxNominations}`);
    expect(queryByTestId('info').children.item(4).textContent).toEqual(`Minimum ${chainInfo.coin}s to be a staker:   ${amountToHuman(stakingConsts.minNominatorBond, chainInfo.decimals)} ${chainInfo.coin}s`);
    expect(queryByTestId('info').children.item(5).textContent).toEqual(`Maximum nominators of a validator, who may receive rewards:   ${stakingConsts.maxNominatorRewardedPerValidator}`);
    expect(queryByTestId('info').children.item(6).textContent).toEqual(`Days it takes to receive your funds back after unstaking:    ${stakingConsts.bondingDuration}  days`);
    expect(queryByTestId('info').children.item(7).textContent).toEqual(`Minimum ${chainInfo.coin}s that must remain in your account: ${amountToHuman(stakingConsts.existentialDeposit.toString(), chainInfo.decimals)} ${chainInfo.coin}`);
    // expect(queryByTestId('info').children.item(7).textContent).toEqual(`Minimum ${chainInfo.coin}s that must remain in your account: ${amountToHuman(stakingConsts.existentialDeposit.toString(), chainInfo.decimals)} ${chainInfo.coin}s plus some fees`);
  });
});
