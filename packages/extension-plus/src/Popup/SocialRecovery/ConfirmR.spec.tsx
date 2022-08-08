// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { cleanup, Matcher, render, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { BN } from '@polkadot/util';

import { ShowBalance2 } from '../../components';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import { chain, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';
import Confirm from './Confirm';

jest.setTimeout(100000);
ReactDOM.createPortal = jest.fn((modal) => modal);
let chainInfo: ChainInfo;
let recoveryConsts: RecoveryConsts;
const friends = [accountWithId[1], accountWithId[2]];
const showConfirmModal = () => true;
const setConfirmModalOpen = jest.fn();
const setState = jest.fn();
const states = ['makeRecoverable', 'removeRecovery', 'closeRecovery', 'initiateRecovery', 'vouchRecovery', 'withdrawAsRecovered', 'withdrawWithClaim'];
const recoveryDelay = 2; // 2 Days
const recoveryThreshold = 1; // 1 friend
const signerAcc = accountWithId[0];
const lostAccount = accountWithId[3];
const rescuerAcc = accountWithId[4].accountId;
const rescuer: Rescuer = {
  accountId: rescuerAcc,
  identity: {
    display: accountWithName[3].name
  },
  option: {
    created: new BN('11907021'),
    deposit: new BN('5000000000000'),
    friends: [accountWithName[3].address]
  }
};

const ShowValue = (value: BN, title = '') => {
  return render(
    <ShowBalance2
      api={chainInfo.api}
      balance={value}
      title={title}
    />
  ).asFragment().textContent;
};

describe('Testing Confirm component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('westend') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };
  });

  test('Confirm: Make recoverable - Remove Recovery - Close Recovery', async () => {
    for (let i = 0; i <= 4; i++) {
      const { debug, getByRole, queryAllByTestId, queryByLabelText, queryByText } = render(
        <Confirm
          account={signerAcc}
          api={chainInfo.api} // don't care
          chain={chain('westend')} // don't care
          friends={friends}
          lostAccount={i === 3 || i === 4 ? lostAccount : signerAcc}
          otherPossibleRescuers={undefined}
          recoveryConsts={recoveryConsts} // don't care
          recoveryDelay={i === 2 ? undefined : recoveryDelay}
          recoveryThreshold={i === 2 ? undefined : recoveryThreshold}
          rescuer={i === 2 || i === 4 ? rescuer : undefined}
          setConfirmModalOpen={setConfirmModalOpen} // don't care
          setState={setState} // don't care
          showConfirmModal={showConfirmModal()} // don't care
          state={states[i]}
          withdrawAmounts={undefined} // don't care
        />
      );

      const depositForMakeRecoverable = recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(friends.length));
      const depositForInitiateRecovery = recoveryConsts.recoveryDeposit;

      // Header text
      (i === 0) && expect(queryByText('Make Recoverable')).toBeTruthy();
      (i === 1) && expect(queryByText('Remove Recovery')).toBeTruthy();
      (i === 2) && expect(queryByText('Close Recovery')).toBeTruthy();
      (i === 3) && expect(queryByText('Initiate Recovery')).toBeTruthy();
      (i === 4) && expect(queryByText('Vouch Recovery')).toBeTruthy();
      // Transaction information
      expect(queryByText('Recoverable account')).toBeTruthy();

      if (i === 3 || i === 4) {
        expect(queryByText(lostAccount.identity.display as unknown as Matcher)).toBeTruthy();
        expect(queryByText(String(lostAccount.accountId))).toBeTruthy();
      } else {
        expect(queryByText(signerAcc.identity.display as unknown as Matcher)).toBeTruthy();
        expect(queryByText(String(signerAcc.accountId))).toBeTruthy();
      }

      expect(queryByText('Fee')).toBeTruthy();
      expect(queryAllByTestId('ShowBalance2')[0]?.textContent).toEqual('Fee');

      if (i === 0 || i === 3 || i === 4) {
        expect(queryByText('Recovery threshold')).toBeTruthy();
        expect(queryByText(`${recoveryThreshold} friends`)).toBeTruthy();
        expect(queryByText('Deposit')).toBeTruthy();
        i === 0 && expect(queryAllByTestId('ShowBalance2')[1]?.textContent).toEqual(ShowValue(depositForMakeRecoverable, 'Deposit'));
        i === 3 && expect(queryAllByTestId('ShowBalance2')[1]?.textContent).toEqual(ShowValue(depositForInitiateRecovery, 'Deposit'));
        i === 4 && expect(queryByText('Deposit')).toBeFalsy();
        expect(queryByText('Recovery delay')).toBeTruthy();
        expect(queryByText(`${recoveryDelay} days`)).toBeTruthy();
        i === 0 && expect(queryByText('List of friends')).toBeTruthy();
        i === 0 && friends.forEach((friend) => {
          expect(queryByText(friend.identity.display as unknown as Matcher)).toBeTruthy();
          expect(queryByText(friend.accountId?.toString() as unknown as Matcher)).toBeTruthy();
        });
      }

      (i === 1) && expect(queryByText('Removing your account configuration as recoverable. Your {{deposit}} deposit will be unlocked')).toBeTruthy();
      (i === 3) && expect(queryByText('Initiating recovery for the recoverable account, with the following friend(s)')).toBeTruthy();
      (i === 4) && expect(queryByText('Vouching to rescue the recoverable account using the rescuer account')).toBeTruthy();

      if (i === 2) {
        expect(queryByText('Recovery threshold')).toBeFalsy();
        expect(queryByText('Deposit')).toBeFalsy();
        expect(queryByText('Recovery delay')).toBeFalsy();
        expect(queryByText('List of friends')).toBeFalsy();

        expect(queryByText('The recoverable account will receive the recovery deposit {{deposit}} placed by the rescuer account')).toBeTruthy();
        expect(queryByText('Rescuer account')).toBeTruthy();
        expect(queryByText(rescuer.identity.display as unknown as Matcher)).toBeTruthy();
        expect(queryByText(String(rescuer.accountId))).toBeTruthy();
      }

      if (i === 4) {
        expect(queryByText('Rescuer account')).toBeTruthy();
        expect(queryByText(rescuer.identity.display as unknown as Matcher)).toBeTruthy();
        expect(queryByText(String(rescuer.accountId))).toBeTruthy();
      }

      expect(queryByLabelText('Password')).toBeTruthy();
      expect(queryByLabelText('Password')?.hasAttribute('disabled')).toBe(true);
      await waitFor(() => expect(queryAllByTestId('ShowBalance2')[0]?.textContent).not.toEqual('Fee'), { timeout: 10000 });
      expect(queryByLabelText('Password')?.hasAttribute('disabled')).toBe(false);
      expect(getByRole('button', { hidden: true, name: 'Confirm' })).toBeTruthy();
      expect(getByRole('button', { hidden: true, name: 'Confirm' }).hasAttribute('disabled')).toBe(false);
      cleanup();
    }
  });
});
