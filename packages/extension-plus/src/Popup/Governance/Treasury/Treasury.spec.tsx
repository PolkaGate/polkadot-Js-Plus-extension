// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveTreasuryProposals, DeriveTreasuryProposal } from '@polkadot/api-derive/types';
import { AccountContext, SettingsContext } from '@polkadot/extension-ui/components';
import { buildHierarchy } from '@polkadot/extension-ui/util/buildHierarchy';
import Extension from '../../../../../extension-base/src/background/handlers/Extension';

import getCurrentBlockNumber from '../../../util/api/getCurrentBlockNumber';
import getChainInfo from '../../../util/getChainInfo';
import { ChainInfo } from '../../../util/plusTypes';
import { amountToHuman, formatMeta, handleAccountBalance, remainingTime } from '../../../util/plusUtils';
import { accounts, chain, convictions, firstSuri, createExtension, createAcc } from '../../../util/test/testHelper';
import TipsOverview from './tips/overview';
import ProposalsOverview from './proposals/overview';
import Vote from './referendums/Vote';
import { Balance } from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types/types';
import getProposals from 'extension-plus/src/util/api/getProposals';

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
let proposal: DeriveTreasuryProposal;
let availableBalance: Balance;
let proposalsInfo: DeriveTreasuryProposals | null;
let currentBlockNumber: number;
let extension: Extension;
let address: string;

let toHuman: (value: bigint) => string;

describe('Testing Treasury component', () => {
  beforeAll(async () => {
    currentBlockNumber = await getCurrentBlockNumber(chain.name);
    chainInfo = await getChainInfo(chain.name);
    const { api } = chainInfo;

    toHuman = (value: bigint) => `${api.createType('Balance', value).toHuman()}`;

    extension = await createExtension();
    address = await createAcc(firstSuri, chainInfo.genesisHash, extension);

    await api.query.system.account(accounts[0].address).then((balance: Codec) => {
      availableBalance = chainInfo.api.createType('Balance', (balance.data.free).sub(balance.data.miscFrozen));
    });

    proposalsInfo = await chainInfo.api.derive.treasury.proposals();

    const { proposals } = proposalsInfo;

    console.log(proposalsInfo)
    if (proposals) proposal = proposals[0];
  });

  test('Checking the Proposals\'s tab elements, with no proposal', () => {
    const { queryByText } = render(
      <ProposalsOverview
        address={''}
        chain={chain}
        chainInfo={chainInfo}
        proposalsInfo={null}
      />
    );

    expect(queryByText('No active proposals')).toBeTruthy();
  });

  test('Checking the Proposals\'s tab elements', async () => {
    const { getByRole, queryAllByText, queryByText } = render(
      <ProposalsOverview
        address={''}
        chain={chain}
        chainInfo={chainInfo}
        proposalsInfo={proposalsInfo}
      />
    );

    if (proposal) {
      expect(getByRole('button', { name: 'Submit' })).toBeTruthy();
      expect(queryByText(`Payment: ${toHuman(proposal.proposal.value)}`)).toBeTruthy();
      expect(queryByText(`Bond: ${toHuman(proposal.proposal.bond)}`)).toBeTruthy();

      await waitFor(() => {
        expect(queryAllByText('Proposer')).toBeTruthy();
        expect(queryAllByText(proposal.proposal.proposer.toString())).toBeTruthy();

        expect(queryAllByText('Beneficiary')).toBeTruthy();
        expect(queryAllByText(proposal.proposal.beneficiary.toString())).toBeTruthy();
      }, { timeout: 10000 });
    }
  });

  // Tips tab
  // test('Checking the Tips\' tab elements, with no tips', () => {
  //   const { queryByText } = render(
  //     <TipsOverview
  //       address={''}
  //       chain={chain}
  //       chainInfo={chainInfo}
  //       tips={null}
  //     />
  //   );

  //   expect(queryByText('No active tips')).toBeTruthy();
  // });
});
