// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';
import 'jsdom-worker-fix';

import { fireEvent, render, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter, Route } from 'react-router';

import { AccountContext, SettingsContext } from '@polkadot/extension-ui/components';
import { buildHierarchy } from '@polkadot/extension-ui/util/buildHierarchy';
import { BN } from '@polkadot/util';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, RecoveryConsts } from '../../util/plusTypes';
import { accounts, chain, SettingsStruct } from '../../util/test/testHelper';
import SocialRecoveryIndex from './index';

jest.setTimeout(120000);
ReactDOM.createPortal = jest.fn((modal) => modal);

const validAddress = '5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX';
const kusamaGenesisHash = chain('kusama').definition.genesisHash;
let recoveryConsts: RecoveryConsts;
let chainInfo: ChainInfo;

describe('Testing Social Recovery component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('kusama') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };
  });

  test('Checking the existance of elements', async () => {
    const { getByRole, queryAllByTestId, queryByText } = render(
      <SettingsContext.Provider value={SettingsStruct}>
        <AccountContext.Provider
          value={{
            accounts,
            hierarchy: buildHierarchy(accounts)
          }}
        >
          <MemoryRouter initialEntries={[`/socialRecovery/${kusamaGenesisHash}/${validAddress}`]}>
            <Route path='/socialRecovery/:genesisHash/:address'>
              <SocialRecoveryIndex />
            </Route>
          </MemoryRouter>
        </AccountContext.Provider>
      </SettingsContext.Provider>
    );

    await waitFor(() => expect(queryByText(`Social Recovery on ${chain('kusama').definition.chain}`)).toBeTruthy(), { timeout: 30000 });

    expect(queryByText('CONFIGURE MY ACCOUNT')).toBeTruthy();
    expect(queryByText('You can make your account "recoverable", remove recovery from an already recoverable account, or close a recovery process that is initiated by a (malicious) rescuer account.')).toBeTruthy();

    expect(queryByText('RESCUE ANOTHER ACCOUNT')).toBeTruthy();
    expect(queryByText('You can try to rescue another account. As a "rescuer", you can recover a lost account, or as a "friend", you can "vouch" to confirm the recovery of a lost account by a rescuer account.')).toBeTruthy();

    // Configure my account component's elements
    fireEvent.click(queryByText('CONFIGURE MY ACCOUNT') as Element);
    // Header Text
    expect(queryByText('Configure my account')).toBeTruthy();
    // Tab's
    expect(getByRole('tab', { hidden: true, name: 'Configuration' })).toBeTruthy();
    expect(getByRole('tab', { hidden: true, name: 'Info' })).toBeTruthy();

    // Configuration tab's elements while loading informations
    expect(getByRole('progressbar', { hidden: true })).toBeTruthy();
    expect(queryByText('Checking if the account is recoverable')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByText('Checking if the account is recoverable'), { timeout: 20000 });

    // Info tab's elemnts
    fireEvent.click(getByRole('tab', { hidden: true, name: 'Info' }));
    expect(queryByText('Welcome to account recovery')).toBeTruthy();
    expect(queryByText('Information you need to know')).toBeTruthy();
    expect(queryByText('The base {{token}}s must be reserved to create a recovery:')).toBeTruthy();
    await waitFor(() => expect(queryAllByTestId('ShowBalance2')[0].textContent).toEqual('0.0166 ' + chain('kusama').tokenSymbol.toUpperCase()), { timeout: 30000 });
    expect(queryByText('{{token}}s to be reserved for each added friend :')).toBeTruthy();
    expect(queryAllByTestId('ShowBalance2')[1].textContent).toEqual('0.0016 ' + chain('kusama').tokenSymbol.toUpperCase());
    expect(queryByText('Maximum allowed number of friends:')).toBeTruthy();
    expect(queryByText(recoveryConsts.maxFriends)).toBeTruthy();
    expect(queryByText('The base {{token}}s needed to be reserved for starting a recovery:')).toBeTruthy();
    expect(queryAllByTestId('ShowBalance2')[2].textContent).toEqual('0.0166 ' + chain('kusama').tokenSymbol.toUpperCase());

    // Configuration tab's elemnts while loading finished and account is not recoverable
    fireEvent.click(getByRole('tab', { hidden: true, name: 'Configuration' }));
    expect(queryByText('Make recoverable')).toBeTruthy();
    expect(queryByText('Your recovery friends :')).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'addFriend' })).toBeTruthy();
    expect(queryByText('No friends are added yet!')).toBeTruthy();
    expect(getByRole('spinbutton', { hidden: true, name: 'Recovery threshold' })).toBeTruthy();
    expect(getByRole('spinbutton', { hidden: true, name: 'Recovery delay' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' })).toBeTruthy();
    expect(getByRole('button', { hidden: true, name: 'Next' }).hasAttribute('disabled')).toBe(true);

    fireEvent.click(queryByText('Close') as Element);

    // Rescue another account component's element
    fireEvent.click(queryByText('RESCUE ANOTHER ACCOUNT') as Element);
    // Header Text
    expect(queryByText('Rescue another account')).toBeTruthy();
    // Choises
    expect(queryByText('as Rescuer')).toBeTruthy();
    expect(queryByText('A rescuer can initiate the recovery of a lost account. If it receives enough vouchers, the lost account can be claimed.')).toBeTruthy();
    expect(queryByText('as Friend')).toBeTruthy();
    expect(queryByText('An account, who has been set as a friend of a lost account, can vouch for recovering the lost account by a rescuer.')).toBeTruthy();
  });
});
