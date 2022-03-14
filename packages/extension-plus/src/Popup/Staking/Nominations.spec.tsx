// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, Validators } from '../../util/plusTypes';
import { nominatedValidators, stakingConsts, validatorsIdentities, validatorsName } from '../../util/test/testHelper';
import Nominations from './Nominations';

const activeValidator: DeriveStakingQuery = {};
const chain: Chain = { name: 'westend' };
const StakedInHuman = '1';
const noStakedInHuman = '0';
const state = '';
const validatorsInfo: Validators = {
  current: [...validatorsName.slice(4)],
  waiting: [...validatorsName]
};
let chainInfo: ChainInfo;

jest.setTimeout(20000);
ReactDOM.createPortal = jest.fn((modal) => modal);

describe('Testing Nominations component', () => {
  beforeAll(async () => chainInfo = await getChainInfo('westend'));
  test('Checking existing elements when not staked and nominated yet', () => {
    const { queryByText } = render(
      <Nominations
        activeValidator={activeValidator}
        chain={chain}
        chainInfo={chainInfo}
        currentlyStakedInHuman={noStakedInHuman}
        noNominatedValidators={true}
        nominatedValidators={null}
        stakingConsts={stakingConsts}
        state={state}
        validatorsIdentities={[]}
        validatorsInfo={validatorsInfo}
      />);

    expect(queryByText('No nominated validators found')).toBeTruthy();
  });

  test('Checking existing elements when staked but not nominated', () => {
    const { queryByText } = render(
      <Nominations
        activeValidator={activeValidator}
        chain={chain}
        chainInfo={chainInfo}
        currentlyStakedInHuman={StakedInHuman}
        noNominatedValidators={true}
        nominatedValidators={null}
        stakingConsts={stakingConsts}
        state={state}
        validatorsIdentities={[]}
        validatorsInfo={validatorsInfo}
      />);

    expect(queryByText('No nominated validators found')).toBeTruthy();
    expect(queryByText('Set nominees')).toBeTruthy();
  });

  test('Checking existing elements when staked and nominated', () => {
    const { queryByText } = render(
      <Nominations
        activeValidator={activeValidator}
        chain={chain}
        chainInfo={chainInfo}
        currentlyStakedInHuman={StakedInHuman}
        noNominatedValidators={false}
        nominatedValidators={nominatedValidators}
        stakingConsts={stakingConsts}
        state={state}
        validatorsIdentities={validatorsIdentities}
        validatorsInfo={validatorsInfo}
      />);

    expect(queryByText('More')).toBeTruthy();
    expect(queryByText('Identity')).toBeTruthy();
    expect(queryByText('Staked')).toBeTruthy();
    expect(queryByText('Comm.')).toBeTruthy();
    expect(queryByText('Nominators')).toBeTruthy();

    for (const nominatedValidator of nominatedValidators) {
      validatorsIdentities.map((acc) => {
        if (acc.accountId === nominatedValidator.accountId) {
          expect(queryByText(acc.identity.display)).toBeTruthy();
        }
      });
      expect(queryByText(nominatedValidator.exposure.total.toLocaleString())).toBeTruthy();
      expect(queryByText(nominatedValidator.exposure.others.length)).toBeTruthy();
      expect(queryByText(`${nominatedValidator.validatorPrefs.commission / (10 ** 7)}%`)).toBeTruthy();
    }

    expect(queryByText('Stop nominating')).toBeTruthy();
    expect(queryByText('Change validators')).toBeTruthy();

    expect(queryByText('No nominated validators found')).toBeFalsy();
    expect(queryByText('Set nominees')).toBeFalsy();
  });
});
