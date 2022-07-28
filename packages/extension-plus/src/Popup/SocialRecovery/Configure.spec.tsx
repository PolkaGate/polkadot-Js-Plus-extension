// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { fireEvent, Matcher, render } from '@testing-library/react';
import getChainInfo from '../../util/getChainInfo';
import { ChainInfo, nameAddress, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import React from 'react';
import ReactDOM from 'react-dom';
import { BN } from '@polkadot/util';

import { chain, makeShortAddr, validatorsIdentities as accountWithId, validatorsName as accountWithName } from '../../util/test/testHelper';

import Configure from './Configure';

jest.setTimeout(240000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
let recoveryConsts: RecoveryConsts;
const rescuer: Rescuer = {
  accountId: accountWithId[1].accountId,
  option: {
    created: new BN('11907021'),
    deposit: new BN('5000000000000'),
    friends: ['5G6TeiXHZJFV3DtPABJ22thuLguSEPJgH7FkqcRPrn88mFKh']
  }
};
const addresesOnThisChain: nameAddress[] = [accountWithName[0], accountWithName[1], accountWithName[2]];
let status = [undefined, 'makeRecoverable', 'removeRecovery', 'closeRecovery'];

describe('Testing the Configure component', () => {
  beforeAll(async () => {
    chainInfo = await getChainInfo('kusama') as ChainInfo;

    recoveryConsts = {
      configDepositBase: chainInfo.api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: chainInfo.api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: chainInfo.api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: chainInfo.api.consts.recovery.recoveryDeposit as unknown as BN
    };
  });

  test('Checking the existence of the element While ', () => {
    const { debug } = render(
      <Configure
        account={accountWithId[1]}
        api={chainInfo.api}
        chain={chain('kusama')}
        rescuer={rescuer}
        setConfigureModalOpen={undefined}
        showConfigureModal={true}
        accountsInfo={accountWithId}
        addresesOnThisChain={addresesOnThisChain}
        recoveryConsts={recoveryConsts}
        recoveryInfo={null} // Condition to make recoverable modal open 
        recoveryStatus={status[0]} // Condition to open RecoveryChecking component
      />
    );

    debug(undefined, 30000);
  });
});
