// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-return-assign */

import '@polkadot/extension-mocks/chrome';
import 'jsdom-worker-fix';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route } from 'react-router';

import getChainInfo from '../../util/getChainInfo';
import { ChainInfo } from '../../util/plusTypes';
import { amountToHuman, remainingTime } from '../../util/plusUtils';
import { auction, endpoints } from '../../util/test/testHelper';
import AuctionTab from './AuctionTab';
import CrowdloanTab from './CrowdloanTab';
import Crowdloans from './index';

jest.setTimeout(60000);

let chainInfo: ChainInfo;

describe('Testing Crowdloans component', () => {
  test('Checking the existence of elements', () => {
    const { queryAllByRole, queryByRole, queryByText } = render(
      <MemoryRouter initialEntries={['/auction-crowdloans']}>
        <Route path='/auction-crowdloans'><Crowdloans className='amir' /></Route>
      </MemoryRouter>
    );

    expect(queryByText('Crowdloan')).toBeTruthy();
    expect(queryByText('Relay chain')).toBeTruthy();
    expect(queryAllByRole('option')).toHaveLength(4);
    expect(queryByText('Please select a relay chain')).toBeTruthy();
    expect(queryByText('Auction')).toBeTruthy();
    expect(queryByText('Crowdloans')).toBeTruthy();
    fireEvent.change(queryByRole('combobox'), { target: { value: 'kusama' } });
    expect(queryByText('Loading Auction/Crowdloans of Kusama ...')).toBeTruthy();
  });
});

describe('Testing Auction component', () => {
  beforeAll(async () => chainInfo = await getChainInfo('westend'));
  test('Checking the AuctionTab\'s elements', () => {
    const { queryByText } = render(
      <AuctionTab
        auction={auction}
        chainInfo={chainInfo}
        endpoints={endpoints}
      />
    );

    // Auction
    expect(queryByText('Auction')).toBeTruthy();
    expect(queryByText(`Lease: ${Number(auction.auctionInfo[0])} - ${Number(auction.auctionInfo[0]) + Number(chainInfo.api.consts.auctions.leasePeriodsPerSlot.toString()) - 1}`)).toBeTruthy();
    expect(queryByText(`Ending stage : ${Number(auction.auctionInfo[1])} - ${Number(auction.auctionInfo[1]) + Number(chainInfo.api.consts.auctions?.endingPeriod.toString())}`)).toBeTruthy();
    expect(queryByText(`Current block: ${auction.currentBlockNumber}`)).toBeTruthy();
    expect(queryByText('Remaining Time:', { exact: false }).textContent).toEqual(`Remaining Time:  ${remainingTime(auction.currentBlockNumber, (Number(auction.auctionInfo[1]) + Number(chainInfo.api.consts.auctions?.endingPeriod.toString())))}`);

    // Bids
    expect(queryByText('Bids')).toBeTruthy();
    expect(queryByText(display.slice(0, 15))).toBeTruthy();
    expect(queryByText(`Parachain Id: ${auction.winning[0][1].replace(/,/g, '')}`)).toBeTruthy();
    expect(queryByText(`Leases: ${String(crowdloan.fund.firstPeriod)} - ${String(crowdloan.fund.lastPeriod)}`)).toBeTruthy();
    expect(queryByText(`End: # ${crowdloan.fund.end}`)).toBeTruthy();
    expect(queryByText(`${Number(amountToHuman(crowdloan.fund.raised, chainInfo.decimals)).toLocaleString()}`)).toBeTruthy();
    expect(queryByText(`/${Number(amountToHuman(crowdloan.fund.cap, chainInfo.decimals)).toLocaleString()}Raised/Cap (${chainInfo.coin})`)).toBeTruthy();
  });
});

describe('Testing CrowdloansTab component', () => {
  test('Checking the CrowdloanTab\'s elements', () => {
    const { queryAllByText, queryByText } = render(
      <CrowdloanTab
        auction={auction}
        chainInfo={chainInfo}
        endpoints={endpoints}
        // eslint-disable-next-line react/jsx-no-bind
        handleContribute={() => true}
      />
    );

    expect(queryByText('view active crowdloans')).toBeTruthy();
    expect(queryByText('view auction winners')).toBeTruthy();
    expect(queryByText('view ended crowdloans')).toBeTruthy();
    expect(queryByText(`Actives(${actives.length})`)).toBeTruthy();
    expect(queryByText(`Winners(${winners.length})`)).toBeTruthy();
    expect(queryByText('Ended(0)')).toBeTruthy();

    // active crowdloans
    for (const active of actives) {
      display = active.identity.info.legal || active.identity.info.display || getText(active.fund.paraId);
      expect(queryByText(display.slice(0, 15))).toBeTruthy();
      expect(queryByText(`Parachain Id: ${active.fund.paraId}`)).toBeTruthy();
      expect(queryByText(`${Number(amountToHuman(active.fund.raised, chainInfo.decimals)).toLocaleString()}`)).toBeTruthy();
    }

    expect(queryAllByText('Next')).toHaveLength(actives.length);

    // winner crowdloans
    for (const winner of winners) {
      display = winner.identity.info.legal || winner.identity.info.display || getText(winner.fund.paraId);
      expect(queryByText(display.slice(0, 15))).toBeTruthy();
      expect(queryByText(`Parachain Id: ${winner.fund.paraId}`)).toBeTruthy();
      expect(queryByText(`${Number(amountToHuman(winner.fund.raised, chainInfo.decimals)).toLocaleString()}`)).toBeTruthy();
    }

    // ended crowdloans
    expect(queryByText('There is no item to show')).toBeTruthy();
  });
});

const winning = auction?.winning.find((x) => x);
const crowdloan = auction?.crowdloans.find((c) => c.fund.paraId === winning[1].replace(/,/g, ''));
const getText = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.text as string);
let display = crowdloan.identity.info.legal || crowdloan.identity.info.display || getText(crowdloan.fund.paraId);
const actives = auction.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber && !c.fund.hasLeased);
const winners = auction.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber || c.fund.hasLeased);
