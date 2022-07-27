// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { fireEvent, Matcher, render, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import { ShowBalance2 } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { chain, makeShortAddr, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import MakeRecoverable from './MakeRecoverableTab';

jest.setTimeout(240000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
let recoveryConsts: RecoveryConsts;
let recoveryInfo: PalletRecoveryRecoveryConfig | null;
let counter = 1;

describe('Testing MakerecoverableTab component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('kusama') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };

    await chainInfo.api.query.recovery.recoverable(accountWithId[0].accountId).then((r) => {
      recoveryInfo = r.isSome ? r.unwrap() as unknown as PalletRecoveryRecoveryConfig : null;
    });
  });

  describe('Making an account recoverable', () => {
    test('Good boy testing', () => {
      const { getByRole, queryAllByTestId, queryByText } = render(
        <MakeRecoverable
          account={accountWithId[0]} // undefined
          accountsInfo={accountWithId} // undefined
          addresesOnThisChain={addresesOnThisChain} // empty
          api={chainInfo.api} // undefined
          chain={chain('kusama')} // null
          recoveryConsts={recoveryConsts} // undeifend
          recoveryInfo={null} // null
        />
      );

      const ShowValue = (value: BN, title = '') => {
        return render(
          <ShowBalance2
            api={chainInfo.api}
            balance={value}
            title={title}
          />
        ).asFragment().textContent;
      };

      const addFriend = () => {
        fireEvent.click(getByRole('button', { hidden: true, name: 'addFriend' }) as Element);
        fireEvent.change(getByRole('combobox', { hidden: true, name: 'New friend' }), { target: { value: accountWithName[counter].address } });
        fireEvent.click(getByRole('button', { hidden: true, name: 'Add' }) as Element);
        counter++;
      };

      expect(queryByText('Make recoverable')).toBeTruthy();
      expect(queryByText('Your recovery friends (0)')).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'addFriend' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'addFriend' }).hasAttribute('disabled')).toBe(false);
      expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual(ShowValue(recoveryConsts.configDepositBase, 'Deposit:'));
      expect(queryByText('No friends are added yet!')).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' })).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);

      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 1 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);

      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' }), { target: { value: 1 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
      addFriend();
      expect(queryByText(accountWithName[1].name)).toBeTruthy();
      expect(queryByText(accountWithName[1].address)).toBeTruthy();

      expect(queryByText('Your recovery friends (1)')).toBeTruthy();
      expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual(ShowValue(recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor), 'Deposit:'));
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(false);

      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 2 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);

      for (let i = 2; i <= 9; i++) {
        addFriend();
        expect(queryByText(`Your recovery friends (${i})`)).toBeTruthy();

        if (i < 9) {
          expect(getByRole('button', { hidden: true, name: 'addFriend' }).hasAttribute('disabled')).toBe(false);
        } else {
          expect(getByRole('button', { hidden: true, name: 'addFriend' }).hasAttribute('disabled')).toBe(true);
        }

        expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual(ShowValue(recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(i)), 'Deposit:'));

        if (i < 7) {
          expect(queryByText(accountWithName[i].name)).toBeTruthy();
        } else {
          expect(queryByText(makeShortAddr(accountWithName[i].address) as unknown as Matcher)).toBeTruthy();
        }

        expect(queryByText(accountWithName[i].address)).toBeTruthy();
      }

      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 9 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(false);
      fireEvent.change(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' }), { target: { value: 10 } });
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
    });

    test('Bad boy testing', () => {
      const { debug, getByRole, queryByText } = render(
        <MakeRecoverable
          account={undefined}
          accountsInfo={undefined}
          addresesOnThisChain={[]}
          api={undefined}
          chain={null}
          recoveryConsts={undefined}
          recoveryInfo={null}
        />
      );

      debug(undefined, 30000);
      expect(queryByText('Make recoverable')).toBeTruthy();
      expect(queryByText('Your recovery friends :')).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'addFriend' })).toBeTruthy();
      expect(queryByText('No friends are added yet!')).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' })).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
    });
  });
});
