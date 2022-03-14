// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';
import 'intersection-observer';

import { fireEvent, render, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { AccountContext } from '@polkadot/extension-ui/components';
import { buildHierarchy } from '@polkadot/extension-ui/util/buildHierarchy';

import { STAKING_ACTIONS } from '../../util/constants';
import { AccountsBalanceType, BalanceType } from '../../util/plusTypes';
import { amountToMachine } from '../../util/plusUtils';
import { accounts } from '../../util/test/testHelper';
import History from './index';

const Chain = {
  name: 'westend'
};
const decimals = 12;
const availableBalanceInHuman = 0.2; // WND

const balanceInfo: BalanceType = {
  available: amountToMachine(availableBalanceInHuman.toString(), decimals),
  coin: 'WND',
  decimals: decimals,
  total: amountToMachine(availableBalanceInHuman.toString(), decimals)
};
const sender: AccountsBalanceType | null = {
  address: accounts[2].address,
  balanceInfo: balanceInfo,
  chain: 'westend',
  name: 'Amir khan'
};

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

describe('Testing History component', () => {
  const HistoryActions = [...STAKING_ACTIONS, 'send', 'receive'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const amPm = ['AM', 'PM'];
  let action: string | null | undefined;
  let amount: string | null | undefined;
  let toFrom: string | null | undefined;
  let date: string | null | undefined;
  let status: string | null | undefined;

  test('Checking the existence of elements', async () => {
    const { queryAllByText, queryByTestId, queryByText } = render(
      <AccountContext.Provider
        value={{
          accounts: accounts,
          hierarchy: buildHierarchy(accounts)
        }}
      >
        <History
          address={sender}
          chain={Chain}
          name={sender.name}
          showTxHistoryModal={true}
        />
      </AccountContext.Provider>
    );

    expect(queryAllByText('All')).toHaveLength(1);
    expect(queryAllByText('Transfers')).toHaveLength(1);
    expect(queryAllByText('Staking')).toHaveLength(1);
    expect(queryAllByText('Nothing to show')).toHaveLength(1);
    expect(queryAllByText('Loading ...')).toHaveLength(1);

    await waitForElementToBeRemoved(() => queryByText('Loading ...'), { timeout: 30000 });
    const children = queryByTestId('scrollArea')?.childNodes;

    if (!(children.length >= 3)) {
      console.log('There is not any history!');

      return;
    }

    action = queryByTestId('scrollArea')?.children.item(0)?.children.item(1)?.children.item(0)?.children.item(0)?.textContent;
    amount = queryByTestId('scrollArea')?.children.item(0)?.children.item(1)?.children.item(0)?.children.item(1)?.textContent;
    toFrom = queryByTestId('scrollArea')?.children.item(0)?.children.item(1)?.children.item(1)?.children.item(0)?.textContent;
    date = queryByTestId('scrollArea')?.children.item(0)?.children.item(1)?.children.item(1)?.children.item(1)?.textContent;
    status = queryByTestId('scrollArea')?.children.item(0)?.children.item(1)?.children.item(1)?.children.item(2)?.textContent;
    const txStatus = ['Success', 'Failed'];

    expect(HistoryActions.includes(action)).toBe(true);
    expect(amount.slice(-3)).toEqual(balanceInfo.coin);
    expect(toFrom.includes('To:') || toFrom.includes('From:')).toBe(true);
    expect(weekDays.includes(date.slice(0, 3))).toBe(true);
    expect(amPm.includes(date.slice(-2))).toBe(true);
    expect(txStatus.includes(status)).toBe(true);

    fireEvent.click(queryByTestId('scrollArea')?.children.item(0)?.children.item(2)?.children.item(0) as Element);
    expect(queryAllByText('Transaction Detail')).toHaveLength(1);
  });
});
