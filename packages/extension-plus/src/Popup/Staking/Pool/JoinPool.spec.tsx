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
import { makeShortAddr, poolStakingConst } from '../../../util/test/testHelper';
import JoinPool from './JoinPool';

ReactDOM.createPortal = jest.fn((modal) => modal);
jest.setTimeout(60000);
const setState = () => null;
const chain: Chain = {
  name: 'westend'
};
const availableBalance = '5.4321';
let chainInfo: ChainInfo;
let staker: AccountsBalanceType;

describe('Testing JoinPool component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend');
    staker = { address: '5GBc8VPqhKhUzHBe7UoG9TSaH1UPFeydZZLVmY8f22s7sKyQ', chain: 'westend', name: 'Amir khan', balanceInfo: { available: amountToMachine(availableBalance, chainInfo.decimals), decimals: chainInfo.decimals } };
  });

  test('Checking the existance of elements', () => {
    const {debug}=render(
      <JoinPool
        api={chainInfo.api}
        chain={chain}
        poolStakingConsts={poolStakingConst}
        poolsInfo={}
        poolsMembers={}
        setState={setState}
        staker={staker}
      />
    );
  });
});
