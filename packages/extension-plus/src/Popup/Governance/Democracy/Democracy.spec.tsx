// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { Codec } from '@polkadot/types/types';

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveReferendumExt } from '@polkadot/api-derive/types';
import { AccountContext, SettingsContext } from '@polkadot/extension-ui/components';
import { buildHierarchy } from '@polkadot/extension-ui/util/buildHierarchy';
import { Balance } from '@polkadot/types/interfaces';

import Extension from '../../../../../extension-base/src/background/handlers/Extension';
import getCurrentBlockNumber from '../../../util/api/getCurrentBlockNumber';
import getReferendums from '../../../util/api/getReferendums';
import getChainInfo from '../../../util/getChainInfo';
import { ChainInfo } from '../../../util/plusTypes';
import { amountToHuman, formatMeta, remainingTime } from '../../../util/plusUtils';
import { accounts, chain, convictions, createAcc, createExtension, firstSuri } from '../../../util/test/testHelper';
import DemocracyProposals from './proposals/overview';
import ReferendumsOverview from './referendums/overview';
import Vote from './referendums/Vote';

jest.setTimeout(90000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
let availableBalance: Balance;
let referendum: DeriveReferendumExt[] | null;
let votingBalance: Balance;
let currentBlockNumber: number;
let description: string[];
let index: string;
let end: string;
let delay: string;
let value;
let meta;
let threshold: string;
let totalAye: string;
let totalNay: string;
const voteInfo = {
  refId: '54',
  voteType: 1
};
const SettingsStruct = { prefix: 0 };
let extension: Extension;
let address: string;

describe('Testing Democracy component', () => {
  beforeAll(async () => {
    currentBlockNumber = await getCurrentBlockNumber(chain.name);
    chainInfo = await getChainInfo(chain.name);

    extension = await createExtension();
    address = await createAcc(firstSuri, chainInfo.genesisHash, extension);

    await chainInfo.api.query.system.account(accounts[0].address).then((balance: Codec) => {
      availableBalance = chainInfo.api.createType('Balance', (balance.data.free).sub(balance.data.miscFrozen));
    });

    await chainInfo.api.derive.balances?.all(accounts[0].address).then((b) => {
      votingBalance = b?.votingBalance;
    });

    referendum = await getReferendums(chain.name);

    if (referendum?.length) {
      value = referendum[0].image?.proposal;
      meta = value?.registry.findMetaCall(value.callIndex);
      description = formatMeta(meta?.meta);
      index = String(referendum[0].index);
      end = referendum[0].status.end.toString();
      delay = referendum[0].status.delay.toString();
      threshold = referendum[0].status.threshold.toString();
      totalAye = Number(amountToHuman(referendum[0].status.tally.ayes.toString(), chainInfo.decimals)).toLocaleString();
      totalNay = Number(amountToHuman(Number(referendum[0].status.tally.nays).toString(), chainInfo.decimals)).toLocaleString();
    }
  });

  test('Checking the Referendums\'s tab elements', () => {
    const { getByRole, queryByText } = render(
      <ReferendumsOverview
        chain={chain}
        chainInfo={chainInfo}
        convictions={convictions}
        currentBlockNumber={currentBlockNumber}
        referendums={[referendum[0]]}
      />
    );

    if (referendum?.length) {
      expect(queryByText('No active referendum')).toBeFalsy();
      if (value) expect(queryByText(`${meta.section}. ${meta.method}`)).toBeTruthy();
      expect(queryByText(`#${index}`)).toBeTruthy();
      expect(queryByText(`End: #${end}`)).toBeTruthy();
      expect(queryByText(`Delay: ${delay}`)).toBeTruthy();
      expect(queryByText(`Threshold: ${threshold}`)).toBeTruthy();
      expect(queryByText(`Aye(${referendum[0].allAye?.length})`)).toBeTruthy();
      expect(queryByText(`Nay(${referendum[0].allNay?.length})`)).toBeTruthy();
      expect(queryByText(`${totalAye} ${chainInfo.coin}`)).toBeTruthy();
      expect(getByRole('progressbar')).toBeTruthy();
      expect(queryByText('Remaining Time', { exact: false })?.textContent).toEqual(`Remaining Time:  ${remainingTime(currentBlockNumber, referendum[0].status.end)}`);
      expect(queryByText(`${totalNay} ${chainInfo.coin}`)).toBeTruthy();
      expect(getByRole('button', { name: 'Aye' })).toBeTruthy();
      expect(getByRole('button', { name: 'Nay' })).toBeTruthy();
    } else {
      expect(queryByText('No active referendum')).toBeTruthy();
    }
  });

  test('Checking the Vote elements', async () => {
    const { container, queryByLabelText, queryByTestId, queryByText } = render(
      <SettingsContext.Provider value={SettingsStruct}>
        <AccountContext.Provider
          value={{
            accounts: accounts,
            hierarchy: buildHierarchy(accounts)
          }}
        >
          <Vote
            address={address}
            chain={chain}
            chainInfo={chainInfo}
            convictions={convictions}
            showVoteReferendumModal={true}
            voteInfo={voteInfo}
          />
        </AccountContext.Provider>
      </SettingsContext.Provider>
    );

    expect(queryByText(`Vote to ${voteInfo.refId}`)).toBeTruthy();
    expect(queryByText('Voter:')).toBeTruthy();
    expect(container.querySelectorAll('option')).toHaveLength(convictions.length);

    await waitFor(() => {
      expect(queryByTestId('balance')?.textContent).toEqual(`Available: ${availableBalance.toHuman()}`);
    }, { timeout: 10000 });
    await waitFor(() => {
      expect(queryByTestId('showBalance')?.textContent).toEqual(`Voting balance: ${votingBalance.toHuman()}`);
    }, { timeout: 10000 });
    expect(queryByLabelText('Vote value')).toBeTruthy();
    expect(queryByText('This value is locked for the duration of the vote')).toBeTruthy();
    expect(queryByText('Fee', { exact: false })).toBeTruthy();
    expect(queryByText('Locked for')).toBeTruthy();
    expect(queryByText('The conviction to use for this vote with appropriate lock period')).toBeTruthy();
    expect(queryByLabelText('Password')).toBeTruthy();
    expect(queryByText('Please enter the account password')).toBeTruthy();
    expect(queryByTestId('confirmButton')).toBeTruthy();
  });

  // TODO
  test('Checking the Proposal\'s tab elements', () => {
    const { queryByText } = render(
      <DemocracyProposals
        chain={chain}
        chainInfo={chainInfo}
        proposalsInfo={[]}
      />
    );

    expect(queryByText('No active proposal')).toBeTruthy();
  });
});
