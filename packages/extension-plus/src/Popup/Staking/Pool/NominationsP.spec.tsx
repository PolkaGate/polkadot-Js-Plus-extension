// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, render } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../../extension-chains/src/types';
import getChainInfo from '../../../util/getChainInfo';
import { AccountsBalanceType, BalanceType, ChainInfo, Validators } from '../../../util/plusTypes';
import { amountToMachine } from '../../../util/plusUtils';
import { nominatedValidators, pool, poolStakingConst, stakingConsts, validatorsIdentities, validatorsName } from '../../../util/test/testHelper';
import Nominations from './Nominations';

const activeValidator: DeriveStakingQuery = {};
const chain: Chain = { name: 'westend' };
const validatorsInfo: Validators = {
  current: [...validatorsName.slice(4)],
  waiting: [...validatorsName]
};
let chainInfo: ChainInfo;
let staker: AccountsBalanceType;
let balanceInfo: BalanceType;
const availableBalanceInHuman = 15; // WND

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

describe('Testing Nominations component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend');

    balanceInfo = {
      available: amountToMachine(availableBalanceInHuman.toString(), chainInfo.decimals),
      coin: 'WND',
      decimals: chainInfo.decimals,
      total: amountToMachine(availableBalanceInHuman.toString(), chainInfo.decimals)
    };

    staker = {
      address: '5GBc8VPqhKhUzHBe7UoG9TSaH1UPFeydZZLVmY8f22s7sKyQ',
      balanceInfo: balanceInfo,
      chain: 'westend',
      name: 'Amir khan'
    };
  });

  test('Checking existing elements while loading..! ', () => {
    for (let i = 1; i <= 6; i++) {
      const { queryByText } = render(
        <Nominations
          activeValidator={activeValidator} // don't care
          api={chainInfo.api} // don't care
          chain={chain} // don't care
          endpoint={'don\'t care!'} // don't care
          // getPoolInfo={emptyFunction()}
          // handleSelectValidatorsModalOpen={emptyFunction()}
          // handleStopNominating={emptyFunction()}
          myPool={pool} // don't care
          noNominatedValidators={i % 2 === 0 ? undefined : false}
          nominatedValidators={i % 2 === 0 ? null : nominatedValidators}
          poolStakingConsts={i % 2 === 0 ? poolStakingConst : undefined}
          // setNoNominatedValidators={emptyFunction()}
          staker={staker} // don't care
          stakingConsts={stakingConsts} // don't care
          state={'state'} // don't care
          validatorsIdentities={[]} // don't care
          validatorsInfo={validatorsInfo} // don't care
        />);

      expect(queryByText('Loading ...')).toBeTruthy();
      cleanup();
    }
  });

  test('user hasn\'t staked, chilled or doesn\'t set nominees', () => {
    for (let i = 1; i <= 4; i++) {
      const { queryByText } = render(
        <Nominations
          activeValidator={activeValidator} // don't care
          api={chainInfo.api} // don't care
          chain={chain} // don't care
          endpoint={'don\'t care!'} // don't care
          // getPoolInfo={emptyFunction()}
          // handleSelectValidatorsModalOpen={emptyFunction()}
          // handleStopNominating={emptyFunction()}
          myPool={i % 2 === 0 ? pool() : pool('joinPool')} // don't care
          noNominatedValidators={true}
          nominatedValidators={i % 2 === 0 ? null : nominatedValidators}
          poolStakingConsts={i % 2 === 0 ? poolStakingConst : undefined}
          // setNoNominatedValidators={emptyFunction()}
          staker={staker} // don't care
          stakingConsts={stakingConsts} // don't care
          state={'state'} // don't care
          validatorsIdentities={[]} // don't care
          validatorsInfo={validatorsInfo} // don't care
        />);

      expect(queryByText('No nominated validators found')).toBeTruthy();
      i % 2 === 0
        ? expect(queryByText('Set nominees')).toBeTruthy()
        : expect(queryByText('Set nominees')).toBeFalsy();
      cleanup();
    }
  });

  test('Checking existing elements when staked and nominated', () => {
    const { queryAllByText, queryByText } = render(
      <Nominations
        activeValidator={activeValidator}
        api={chainInfo.api}
        chain={chain}
        endpoint={'don\'t care!'} // don't care
        myPool={pool('joinPool')}
        noNominatedValidators={false}
        nominatedValidators={nominatedValidators}
        poolStakingConsts={poolStakingConst}
        staker={staker}
        stakingConsts={stakingConsts}
        state={'state'} // don't care
        validatorsIdentities={validatorsIdentities}
        validatorsInfo={validatorsInfo}
      />);

    expect(queryByText('More')).toBeTruthy();
    expect(queryByText('Identity')).toBeTruthy();
    expect(queryByText('Staked')).toBeTruthy();
    expect(queryByText('Comm.')).toBeTruthy();
    expect(queryByText('Nominators')).toBeTruthy();

    for (const nominatedValidator of nominatedValidators) {
      validatorsIdentities.forEach((acc) => {
        if (acc.accountId === nominatedValidator.accountId) {
          expect(queryByText(acc.identity.display)).toBeTruthy();
        }
      });
      const total = chainInfo.api.createType('Balance', nominatedValidator.exposure.total);

      expect(queryAllByText(total.toHuman())).toBeTruthy();
      expect(queryAllByText(nominatedValidator.exposure.others.length)).toBeTruthy();
      expect(queryAllByText(`${nominatedValidator.validatorPrefs.commission / (10 ** 7)}%`)).toBeTruthy();
    }

    expect(queryByText('Change validators')).toBeTruthy();

    expect(queryByText('No nominated validators found')).toBeFalsy();
    expect(queryByText('Set nominees')).toBeFalsy();
  });
});
