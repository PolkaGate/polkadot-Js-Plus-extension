// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import '@polkadot/extension-mocks/chrome';

import { render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo } from '../../util/plusTypes';
import { toHuman } from '../../util/plusUtils';
import { nominatorInfoFalse, stakingConsts } from '../../util/test/testHelper';
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
  });

  test('Checking the existence of elements when loading is done', async () => {
    chainInfo = await getChainInfo('westend');
    const { api } = chainInfo;
    const currentEraIndex = Number(await chainInfo.api.query.staking.currentEra());
    const { queryByTestId, queryByText } = render(
      <Info
        chainInfo={chainInfo}
        currentEraIndex={currentEraIndex}
        minNominated={nominatorInfoFalse.minNominated}
        stakingConsts={stakingConsts}
      />);

    expect(queryByText('Welcome to Staking')).toBeTruthy();
    expect(queryByText('Information you need to know about')).toBeTruthy();
    expect(queryByTestId('info')?.children.item(2)?.children.item(0)?.textContent).toEqual(`Maximum validators you can select: ${stakingConsts.maxNominations} `);
    expect(queryByTestId('info')?.children.item(2)?.children.item(1)?.textContent).toEqual(`Minimum {{symbol}}s to be a staker (threshold): ${toHuman(api, stakingConsts.minNominatorBond)}`);
    expect(queryByTestId('info')?.children.item(2)?.children.item(2)?.textContent).toEqual(`Minimum {{symbol}}s to recieve rewards today (era: {{eraIndex}}):${toHuman(api, nominatorInfoFalse.minNominated)}`);
    expect(queryByTestId('info')?.children.item(2)?.children.item(3)?.textContent).toEqual(`Maximum nominators of a validator, who may receive rewards: ${stakingConsts.maxNominatorRewardedPerValidator} `);
    expect(queryByTestId('info')?.children.item(2)?.children.item(4)?.textContent).toEqual(`Days it takes to receive your funds back after unstaking:  ${stakingConsts.bondingDuration} days`);
    expect(queryByTestId('info')?.children.item(2)?.children.item(5)?.textContent).toEqual(`Minimum {{symbol}}s that must remain in your account (existential deposit): ${toHuman(api, stakingConsts.existentialDeposit.toString())}`);
  });
});
