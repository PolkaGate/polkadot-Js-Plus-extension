// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-return-assign */

import '@polkadot/extension-mocks/chrome';

import { render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, StakingConsts, Validators, ValidatorsName } from '../../util/plusTypes';
import Nominations from './Nominations';

const validatorsName: ValidatorsName[] = [
  { address: '5HNJ3k2Xr3CKiygecfWnpsq9dDJvFGMbNu1ckDqAUJHwf45P', name: 'Chris' },
  { address: '5Dt2dFSLVwiKtEHC7VrVEiJDiVLRiDbaFRBdh8MBSvwuvDCD', name: 'Adam' },
  { address: '5DviS2M1kyyqs1GzMxHAjS3Si49hS3N2Jib9jz4Yx7pJgQHu', name: 'Diego' },
  { address: '5DVDZcaxCDLStUgnqkx67ZrYP9ZQ4hpSiVsHiUmfJh8VTo8S', name: 'Moly' },
  { address: '5GVzG3QJvRc6MEtxaJZnLB3PAhQT8eMgesqgHxYiiQJE4HNv', name: 'Mary' },
  { address: '5CPDNHdbZMNNeHLq7t9Cc434CM1fBL6tkaifiCG3kaQ8KHv8', name: 'NewYork Times' },
  { address: '5CFPcUJgYgWryPaV1aYjSbTpbTLu42V32Ytw1L9rfoMAsfGh', name: 'Amir' },
  { address: '5C864nyotaG4cNoR3YBUqnPVnnvqF1NN1s9t9CuAebyQkQGF', name: 'Olivia' },
  { address: '5GYaYNVq6e855t5hVCyk4Wuqssaf6ADTrvdPZ3QXyHvFXTip', name: 'Emma' },
  { address: '5Ek5JCnrRsyUGYNRaEvkufG1i1EUxEE9cytuWBBjA9oNZVsf', name: 'Mia' }
];
const validatorsIdentities: DeriveAccountInfo[] = [
  { accountId: validatorsName[0].address, identity: { display: validatorsName[0].name } },
  { accountId: validatorsName[1].address, identity: { display: validatorsName[1].name } },
  { accountId: validatorsName[2].address, identity: { display: validatorsName[2].name } },
  { accountId: validatorsName[3].address, identity: { display: validatorsName[3].name } },
  { accountId: validatorsName[4].address, identity: { display: validatorsName[4].name } },
  { accountId: validatorsName[5].address, identity: { display: validatorsName[5].name } },
  { accountId: validatorsName[6].address, identity: { display: validatorsName[6].name } },
  { accountId: validatorsName[7].address, identity: { display: validatorsName[7].name } },
  { accountId: validatorsName[8].address, identity: { display: validatorsName[8].name } },
  { accountId: validatorsName[9].address, identity: { display: validatorsName[9].name } }
];
const activeValidator: DeriveStakingQuery = {};
const chain: Chain = { name: 'westend' };
const StakedInHuman = '1';
const noStakedInHuman = '0';
const others = [
  { who: validatorsName[0].address, value: 2331341969325348 },
  { who: validatorsName[1].address, value: 2233136292040751 },
  { who: validatorsName[2].address, value: 1102408869404150 },
  { who: validatorsName[3].address, value: 536346326599754 },
  { who: validatorsName[4].address, value: 123257089339220 }
];
const nominatedValidators: DeriveStakingQuery[] = [
  { accountId: validatorsName[5].address, exposure: { others: others.slice(1), total: 1.23456 }, validatorPrefs: { commission: 200000000 } },
  { accountId: validatorsName[6].address, exposure: { others: others.slice(0, 1), total: 12.3456 }, validatorPrefs: { commission: 210000000 } },
  { accountId: validatorsName[7].address, exposure: { others: others.slice(3), total: 123.456 }, validatorPrefs: { commission: 150000000 } },
  { accountId: validatorsName[8].address, exposure: { others: others.slice(2), total: 1234.56 }, validatorPrefs: { commission: 90000000 } },
  { accountId: validatorsName[9].address, exposure: { others: others, total: 12345.6 }, validatorPrefs: { commission: 750000000 } }
];
const stakingConsts: StakingConsts = {
  bondingDuration: 28,
  existentialDeposit: 10000000000n,
  maxNominations: 16,
  maxNominatorRewardedPerValidator: 64,
  minNominatorBond: 1
};
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
    expect(queryByText('Commission')).toBeTruthy();
    expect(queryByText('Nominators')).toBeTruthy();

    for (const nominatedValidator of nominatedValidators) {
      console.log('hey uuuuu')
      validatorsIdentities.map((acc) => {
        if (acc.accountId === nominatedValidator.accountId) {
          expect(queryByText(acc.identity.display)).toBeTruthy();
          console.log('yohoooo');
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
