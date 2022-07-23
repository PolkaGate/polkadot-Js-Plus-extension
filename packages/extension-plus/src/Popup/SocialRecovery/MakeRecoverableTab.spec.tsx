// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { fireEvent, render, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { chain, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import MakeRecoverable from './MakeRecoverableTab';

jest.setTimeout(240000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
let recoveryConsts: RecoveryConsts;
let recoveryInfo: PalletRecoveryRecoveryConfig | null | undefined;

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
  describe('Making a account recoverable', () => {
    test('Good boy testing', () => {
      const { getByRole, queryByText } = render(
        <MakeRecoverable
          account={accountWithId[0]} // undefined
          accountsInfo={accountWithId} // undefined
          addresesOnThisChain={addresesOnThisChain} // empty
          api={chainInfo.api} // undefined
          chain={chain('kusama')} // null
          recoveryConsts={recoveryConsts} // undeifend
          recoveryInfo={recoveryInfo} // undefined | null
        />
      );

      expect(queryByText('Make recoverable')).toBeTruthy();
      expect(queryByText('Your recovery friends :')).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'addFriend' })).toBeTruthy();
      expect(queryByText('No friends are added yet!')).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' })).toBeTruthy();
      expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);
    });

    test.only('Bad boy testing', () => {
      const { debug, getByRole, queryByText } = render(
        <MakeRecoverable
          account={undefined}
          accountsInfo={undefined}
          addresesOnThisChain={[]}
          api={undefined}
          chain={null}
          recoveryConsts={undefined}
          recoveryInfo={undefined} // null
        />
      );
      debug(undefined, 30000)
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
