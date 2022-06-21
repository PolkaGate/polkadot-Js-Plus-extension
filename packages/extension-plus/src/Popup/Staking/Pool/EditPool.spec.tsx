// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, Matcher, render, fireEvent } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import { Chain } from '../../../../../extension-chains/src/types';
import getChainInfo from '../../../util/getChainInfo';
import { AccountsBalanceType, ChainInfo } from '../../../util/plusTypes';
import { amountToMachine } from '../../../util/plusUtils';
import { makeShortAddr, pool, poolStakingConst } from '../../../util/test/testHelper';
import EditPool from './EditPool';

ReactDOM.createPortal = jest.fn((modal) => modal);
jest.setTimeout(60000);
const setState = () => null;
const chain: Chain = {
  name: 'westend'
};
const availableBalance = '5.4321';
let chainInfo: ChainInfo;
let staker: AccountsBalanceType;

const useStateNewPool = jest.fn();

describe('Testing CreatePool component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend');
    staker = { address: '5GBc8VPqhKhUzHBe7UoG9TSaH1UPFeydZZLVmY8f22s7sKyQ', chain: 'westend', name: 'Amir khan', balanceInfo: { available: amountToMachine(availableBalance, chainInfo.decimals), decimals: chainInfo.decimals } };
  });

  test('Checking the existance of elements', () => {
    const { queryByLabelText, queryByText,queryAllByTestId,queryByTestId, getByRole, debug } = render(
      <EditPool
        api={chainInfo.api}
        chain={chain}
        newPool={undefined}
        pool={pool('')}
        setNewPool={useStateNewPool}
        setState={setState}
        showEditPoolModal={true}
        staker={staker}
      />
    );
    debug(undefined, 30000)


    console.log('queryAllByTestId(input)', queryByTestId('autoCompleteDepositor'))
    expect(queryByLabelText('Pool metadata')).toBeTruthy();
    expect(queryByLabelText('Pool metadata')?.hasAttribute('disabled')).toBeFalsy();
    expect(queryByLabelText('Pool Id')).toBeTruthy();
    expect(queryByLabelText('Pool Id')?.hasAttribute('disabled')).toBeTruthy();

    expect(queryByText('Roles')).toBeTruthy();

    expect(queryByLabelText('Depositor')).toBeTruthy();
    expect(queryByLabelText('Depositor')?.closest('input')?.value).toEqual(pool('').bondedPool?.roles.depositor);
    fireEvent.change(queryByLabelText('Depositor')?.closest('input') as Element, { target: { value: 'invalidPassword' } });
    expect(queryByLabelText('Depositor')?.closest('input')?.value).toEqual('invalidPassword');
    // debug(undefined,30000)

    // expect(queryByLabelText('Root')?.closest('input')).toBeTruthy();
    // expect(queryByLabelText('Root')?.closest('input')?.value).toEqual(pool('').bondedPool?.roles.root);

    // expect(queryByLabelText('Nominator')?.closest('input')).toBeTruthy();
    // expect(queryByLabelText('Nominator')?.closest('input')?.value).toEqual(pool('').bondedPool?.roles.nominator);

    // expect(queryByLabelText('State toggler')?.closest('input')).toBeTruthy();
    // expect(queryByLabelText('State toggler')?.closest('input')?.value).toEqual(pool('').bondedPool?.roles.stateToggler);

    expect(queryByText('Next')).toBeTruthy();
    expect(queryByText('Next')?.hasAttribute('disabled')).toBeTruthy();
  });
});
