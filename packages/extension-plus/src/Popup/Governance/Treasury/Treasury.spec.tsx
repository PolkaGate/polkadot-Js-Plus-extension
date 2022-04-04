// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-mocks/chrome';

import type { Codec } from '@polkadot/types/types';

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { DeriveTreasuryProposal,DeriveTreasuryProposals } from '@polkadot/api-derive/types';
import { Balance } from '@polkadot/types/interfaces';

import Extension from '../../../../../extension-base/src/background/handlers/Extension';
import getCurrentBlockNumber from '../../../util/api/getCurrentBlockNumber';
import getTips from '../../../util/api/getTips';
import getChainInfo from '../../../util/getChainInfo';
import { ChainInfo, Tip } from '../../../util/plusTypes';
import { accounts, chain, createAcc,createExtension, firstSuri } from '../../../util/test/testHelper';
import ProposalsOverview from './proposals/overview';
import TipsOverview from './tips/Overview';

jest.setTimeout(60000);
ReactDOM.createPortal = jest.fn((modal) => modal);

let chainInfo: ChainInfo;
let proposal: DeriveTreasuryProposal;
let tips: Tip[];
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
    if (proposals) proposal = proposals[0];

    // eslint-disable-next-line no-void
    // void getTips(chain.name, 0, 10).then((res) => {
    //   console.log('tips:', res);

    //   tips = res?.data?.list as Tip[];
    // }).catch(console.error);
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
  // test.only('Checking the Tips\' tab elements, with no tips', () => {
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
