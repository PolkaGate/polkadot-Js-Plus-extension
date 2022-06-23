// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, fireEvent, Matcher, render } from '@testing-library/react';
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
    staker = {
      address: '5GBc8VPqhKhUzHBe7UoG9TSaH1UPFeydZZLVmY8f22s7sKyQ',
      balanceInfo: { available: amountToMachine(availableBalance, chainInfo.decimals), decimals: chainInfo.decimals },
      chain: 'westend',
      name: 'Amir khan'
    };
  });

  test('Checking the existance of elements', () => {
    const { getAllByRole, getByRole, queryByLabelText, queryByText } = render(
      <EditPool
        api={chainInfo.api}
        chain={chain}
        newPool={pool('')}
        pool={pool('')}
        setNewPool={useStateNewPool}
        setState={setState}
        showEditPoolModal={true}
        staker={staker}
      />
    );

    expect(getByRole('textbox', { hidden: true, name: 'Pool metadata' })).toBeTruthy();
    expect(getByRole('textbox', { hidden: true, name: 'Pool metadata' })?.hasAttribute('disabled')).toBeFalsy();
    expect(getByRole('textbox', { hidden: true, name: 'Pool metadata' }).getAttribute('value')).toEqual(pool('').metadata);

    expect(getByRole('textbox', { hidden: true, name: 'Pool Id' })).toBeTruthy();
    expect(getByRole('textbox', { hidden: true, name: 'Pool Id' })?.hasAttribute('disabled')).toBeTruthy();
    expect(getByRole('textbox', { hidden: true, name: 'Pool Id' })?.getAttribute('value')).toEqual(pool('').poolId.toString());

    expect(queryByText('Roles')).toBeTruthy();

    expect(getAllByRole('combobox', { hidden: true }).length).toBe(4);

    expect(queryByLabelText('Depositor')).toBeTruthy();
    expect(getAllByRole('combobox', { hidden: true })[0]?.getAttribute('value')).toEqual(pool('').bondedPool?.roles.depositor);
    expect(getAllByRole('combobox', { hidden: true })[0]?.hasAttribute('disabled')).toBe(true);

    expect(queryByLabelText('Root')).toBeTruthy();
    expect(getAllByRole('combobox', { hidden: true })[1]?.getAttribute('value')).toEqual(pool('').bondedPool?.roles.root);
    expect(getAllByRole('combobox', { hidden: true })[1]?.hasAttribute('disabled')).toBe(false);

    expect(queryByLabelText('Nominator')).toBeTruthy();
    expect(getAllByRole('combobox', { hidden: true })[2]?.getAttribute('value')).toEqual(pool('').bondedPool?.roles.nominator);
    expect(getAllByRole('combobox', { hidden: true })[2]?.hasAttribute('disabled')).toBe(false);

    expect(queryByLabelText('State toggler')).toBeTruthy();
    expect(getAllByRole('combobox', { hidden: true })[3]?.getAttribute('value')).toEqual(pool('').bondedPool?.roles.stateToggler);
    expect(getAllByRole('combobox', { hidden: true })[3]?.hasAttribute('disabled')).toBe(false);

    expect(queryByText('Next')).toBeTruthy();
    expect(queryByText('Next')?.parentNode?.hasAttribute('disabled')).toBeTruthy();
  });

  test('When options change in valid way', () => {
    const newPool = pool('');

    newPool.bondedPool.roles.root = '';

    const { getAllByRole, queryByText } = render(
      <EditPool
        api={chainInfo.api}
        chain={chain}
        newPool={newPool}
        pool={pool('')}
        setNewPool={useStateNewPool}
        setState={setState}
        showEditPoolModal={true}
        staker={staker}
      />
    );

    const emptyRole = '';

    fireEvent.change(getAllByRole('combobox', { hidden: true })[1] as Element, { target: { value: emptyRole } });
    expect(getAllByRole('combobox', { hidden: true })[1]?.getAttribute('value')).toEqual('');
    expect(queryByText('Next')?.parentNode?.hasAttribute('disabled')).toBeFalsy();
  });

  test('When options change in invalid way', () => {
    const newPool = pool('');

    const shityText = 'invalid account address';
    const invalidAddress = '5sfkbjkdbfjkdfuhdsvfhdshgfvdshfvhdshvvhdsvhgdf';

    newPool.bondedPool.roles.root = shityText;
    newPool.bondedPool.roles.stateToggler = invalidAddress;

    const { getAllByRole, queryByText } = render(
      <EditPool
        api={chainInfo.api}
        chain={chain}
        newPool={newPool}
        pool={pool('')}
        setNewPool={useStateNewPool}
        setState={setState}
        showEditPoolModal={true}
        staker={staker}
      />
    );

    fireEvent.change(getAllByRole('combobox', { hidden: true })[1] as Element, { target: { value: shityText } });
    expect(getAllByRole('combobox', { hidden: true })[1]?.getAttribute('value')).toEqual(shityText);
    fireEvent.change(getAllByRole('combobox', { hidden: true })[3] as Element, { target: { value: invalidAddress } });
    expect(getAllByRole('combobox', { hidden: true })[3]?.getAttribute('value')).toEqual(invalidAddress);

    expect(queryByText('Next')?.parentNode?.hasAttribute('disabled')).toBeTruthy();
  });
});
