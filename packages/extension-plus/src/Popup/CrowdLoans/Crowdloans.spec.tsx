// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-return-assign */

import '@polkadot/extension-mocks/chrome';
import 'jsdom-worker-fix';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route } from 'react-router';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';

import getChainInfo from '../../util/getChainInfo';
import { Auction, ChainInfo } from '../../util/plusTypes';
import { amountToHuman, remainingTime } from '../../util/plusUtils';
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

const auction: Auction = {
  auctionCounter: 10,
  auctionInfo: [
    7,
    9095310
  ],
  blockchain: 'polkadot',
  crowdloans: [
    {
      fund: {
        depositor: '13pQt6LnK2tXZtXbiQ6PBYikEoNTi6MXkeBdQCeyR9hm6k1p',
        verifier: null,
        deposit: '5000000000000',
        raised: '3660257994777',
        end: 9388800,
        cap: '50000000000000000',
        lastContribution: {
          ending: 9117345
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 27,
        paraId: '2028',
        hasLeased: false
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '1zunQTaRifL1XULrRLPgSbf6YbkZnjeJiQfwZuxVoJR5mhA',
        verifier: null,
        deposit: '5000000000000',
        raised: '3393179616292899',
        end: 9388800,
        cap: '80000000000000000',
        lastContribution: {
          ending: 9136288
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 24,
        paraId: '2035',
        hasLeased: false
      },
      identity: {
        info: {
          display: 'Phala Genesis',
          web: 'https://phala.network'
        }
      }
    },
    {
      fund: {
        depositor: '14gZicKnmFj3238utrQ6B7CGWBeNGntKUyoUHqoTN85FnHWk',
        verifier: null,
        deposit: '5000000000000',
        raised: '24744466313081235',
        end: 9388800,
        cap: '500000000000000000',
        lastContribution: {
          ending: 9136445
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 15,
        paraId: '2032',
        hasLeased: false
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '12LxQoLA9hebiMSPT3G7ixz73LLuYomMNuRLqX7c9bRWxDFG',
        verifier: null,
        deposit: '5000000000000',
        raised: '76953774505455550',
        end: 9388800,
        cap: '500000000000000000',
        lastContribution: {
          ending: 8360909
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 20,
        paraId: '2021',
        hasLeased: true
      },
      identity: {
        info: {
          display: 'Efinity (EFI)',
          legal: 'Efinity',
          web: 'https://efinity.io/',
          twitter: '@enjin'
        }
      }
    },
    {
      fund: {
        depositor: '14r48SVtMrJKxUWD9ijDy8aQU3asTXja8qny9mzXTutdByju',
        verifier: null,
        deposit: '5000000000000',
        raised: '116666420470807',
        end: 9388800,
        cap: '60000000000000000',
        lastContribution: {
          ending: 9134561
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 16,
        paraId: '2027',
        hasLeased: false
      },
      identity: {
        info: {
          display: 'coinversation',
          legal: 'paul',
          web: 'http://coinversation.io/',
          twitter: '@Coinversation_'
        }
      }
    },
    {
      fund: {
        depositor: '13QrQ7Xos6bseivYW3xRjvi4T2iHihxVnTrQgyHmWGTNv972',
        verifier: null,
        deposit: '5000000000000',
        raised: '539223363758938',
        end: 9388800,
        cap: '50000000000000000',
        lastContribution: {
          ending: 9136317
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 13,
        paraId: '2008',
        hasLeased: false
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '1muqpuFcWvy1Q3tf9Tek882A6ngz46bWPsV6sWiYccnVjKb',
        verifier: null,
        deposit: '5000000000000',
        raised: '325159802323576263',
        end: 8179200,
        cap: '500000000000000000',
        lastContribution: {
          ending: 7756102
        },
        firstPeriod: 6,
        lastPeriod: 13,
        trieIndex: 0,
        paraId: '2000',
        hasLeased: true
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '14e4GmLj5CccWe9Rant9q6yQro1oysqvKiBiHcpCRoscZ1yY',
        verifier: null,
        deposit: '5000000000000',
        raised: '97524874268038525',
        end: 8179200,
        cap: '500000000000000000',
        lastContribution: {
          ending: 8159302
        },
        firstPeriod: 6,
        lastPeriod: 13,
        trieIndex: 5,
        paraId: '2002',
        hasLeased: true
      },
      identity: {
        info: {
          display: 'Clover',
          legal: 'Clover',
          web: 'https://clover.finance',
          email: 'info@clover.finance',
          twitter: '@clover_finance'
        }
      }
    },
    {
      fund: {
        depositor: '12jYuVktdKEC6C4g4d5fuW9MLgUDbxvJRhMBkhEGyqarUzbQ',
        verifier: null,
        deposit: '5000000000000',
        raised: '1279767453472237',
        end: 9388800,
        cap: '80000000000000000',
        lastContribution: {
          ending: 9134581
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 26,
        paraId: '2036',
        hasLeased: false
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '16RzEcgXVzXXn2gEQbqqp74Pw7MJSb7PKtz29BhVZmpXBKRn',
        verifier: null,
        deposit: '5000000000000',
        raised: '54573854554250',
        end: 9388800,
        cap: '4000000000000000',
        lastContribution: {
          ending: 9130216
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 23,
        paraId: '2017',
        hasLeased: false
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '14fhPR28n9EHZitNyf6wjYZVBPwKgcgogVjJPTzvCcb8qi9G',
        verifier: null,
        deposit: '5000000000000',
        raised: '12637919863332626',
        end: 9388800,
        cap: '77500000000000000',
        lastContribution: {
          ending: 9136419
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 19,
        paraId: '2011',
        hasLeased: false
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '12KHAurRWMFJyxU57S9pQerHsKLCwvWKM1d3dKZVx7gSfkFJ',
        verifier: {
          sr25519: '0x16732d1a045c9351606743bf786aad1db344e5dd51e15d6417deb3828044080e'
        },
        deposit: '5000000000000',
        raised: '357599313927924796',
        end: 8179199,
        cap: '1000000000000000000',
        lastContribution: {
          ending: 7815351
        },
        firstPeriod: 6,
        lastPeriod: 13,
        trieIndex: 2,
        paraId: '2004',
        hasLeased: true
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '12EXcpt1CwnSAF9d7YWrh91bQw6R5wmCpJUXPWi7vn2CZFpJ',
        verifier: null,
        deposit: '5000000000000',
        raised: '60754867365972247',
        end: 9388800,
        cap: '250000000000000000',
        lastContribution: {
          ending: 8562504
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 17,
        paraId: '2019',
        hasLeased: true
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '143pzStAtMv3RbYbcHyr2xHipWPkme8VjVgAr4QDQP8d3Xrc',
        verifier: null,
        deposit: '5000000000000',
        raised: '54351606709535446',
        end: 9388800,
        cap: '200000000000000000',
        lastContribution: {
          ending: 8764087
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 18,
        paraId: '2031',
        hasLeased: true
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '1Rp3mJJUxPD1nJ6gf179scdejMSSJb46eYoFyEktR6DYt6z',
        verifier: null,
        deposit: '5000000000000',
        raised: '24625428629746054',
        end: 9388800,
        cap: '80000000000000000',
        lastContribution: {
          ending: 8965708
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 25,
        paraId: '2034',
        hasLeased: true
      },
      identity: {
        info: {
          display: null,
          legal: null,
          web: null,
          email: null,
          twitter: null
        }
      }
    },
    {
      fund: {
        depositor: '15kjdKF4hRbYWzLjovPiohT5pVheXhhk8oKHr3DyTaxF2evd',
        verifier: null,
        deposit: '5000000000000',
        raised: '107515186195417478',
        end: 8179200,
        cap: '400000000000000000',
        lastContribution: {
          ending: 8058505
        },
        firstPeriod: 6,
        lastPeriod: 13,
        trieIndex: 6,
        paraId: '2012',
        hasLeased: true
      },
      identity: {
        info: {
          display: 'Parallel Finance - 2',
          web: 'https://parallel.fi/',
          twitter: 'https://twitter.com/ParallelFi'
        }
      }
    },
    {
      fund: {
        depositor: '16LKv69ct6xDzSiUjuz154vCg62dkyysektHFCeJe85xb6X',
        verifier: null,
        deposit: '5000000000000',
        raised: '8041687933258179',
        end: 9388800,
        cap: '250000000000000000',
        lastContribution: {
          ending: 9136045
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 14,
        paraId: '2026',
        hasLeased: false
      },
      identity: {
        info: {
          display: 'Nodle',
          twitter: '@NodleNetwork'
        }
      }
    },
    {
      fund: {
        depositor: '1EdsnniYSKNjHNAvDgvBfRNzKnSzi6kgsHQFCG4PhAyyJWH',
        verifier: null,
        deposit: '5000000000000',
        raised: '2824692492981460',
        end: 9388800,
        cap: '300000000000000000',
        lastContribution: {
          ending: 9135961
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 10,
        paraId: '2003',
        hasLeased: false
      },
      identity: {
        info: {
          display: 'Darwinia Dev'
        }
      }
    },
    {
      fund: {
        depositor: '1j5YyEGdcPd9BxkzVNNjKkqdi5f7g3Dd7JMgaGUhsMrZ6dZ',
        verifier: null,
        deposit: '5000000000000',
        raised: '103335520433166970',
        end: 8179200,
        cap: '350000010000000000',
        lastContribution: {
          ending: 7957704
        },
        firstPeriod: 6,
        lastPeriod: 13,
        trieIndex: 3,
        paraId: '2006',
        hasLeased: true
      },
      identity: {
        info: {
          display: 'Astar Network',
          legal: 'Astar Network',
          web: 'https://astar.network/',
          twitter: '@AstarNetwork'
        }
      }
    },
    {
      fund: {
        depositor: '152deMvsN7wxMbSmdApsds6LWNNNGgsJ8TTpZLTD2ipEHNg3',
        verifier: null,
        deposit: '5000000000000',
        raised: '4389963539740334',
        end: 9388800,
        cap: '120000000000000000',
        lastContribution: {
          ending: 9136025
        },
        firstPeriod: 7,
        lastPeriod: 14,
        trieIndex: 21,
        paraId: '2013',
        hasLeased: false
      },
      identity: {
        info: {
          display: 'Litentry',
          legal: 'Litentry',
          email: 'info@litentry.com'
        }
      }
    }
  ],
  currentBlockNumber: 9136492,
  minContribution: '50000000000',
  winning: [
    [
      '13UVJyLnbVp77Z2t6rgdY269yXtxjxjdsPXr1N3BwQVsktTK',
      '2,032',
      '23456145892351463'
    ]
  ]
};
const endpoints: LinkOption[] = [
  {
    info: 'statemint',
    isChild: true,
    paraId: 1000,
    text: 'Statemint',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://statemint-rpc.polkadot.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    info: 'statemint',
    isChild: true,
    paraId: 1000,
    text: 'Statemint',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://statemint.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-rpc-0.aca-api.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-rpc-1.aca-api.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-rpc-2.aca-api.network/ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-rpc-3.aca-api.network/ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala.polkawallet.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://acala.network/',
    info: 'acala',
    isChild: true,
    paraId: 2000,
    text: 'Acala',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://acala-polkadot.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://www.aresprotocol.io/',
    info: 'odyssey',
    isChild: true,
    paraId: 2028,
    text: 'Ares Odyssey',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://wss.odyssey.aresprotocol.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://astar.network',
    info: 'astar',
    isChild: true,
    paraId: 2006,
    text: 'Astar',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.astar.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://astar.network',
    info: 'astar',
    isChild: true,
    paraId: 2006,
    text: 'Astar',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://astar.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://clover.finance',
    info: 'clover',
    isChild: true,
    paraId: 2002,
    text: 'Clover',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc-para.clover.finance',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://clover.finance',
    info: 'clover',
    isChild: true,
    paraId: 2002,
    text: 'Clover',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://clover.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://efinity.io',
    info: 'efinity',
    isChild: true,
    paraId: 2021,
    text: 'Efinity',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.efinity.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://interlay.io/',
    info: 'interlay',
    isChild: true,
    paraId: 2032,
    text: 'Interlay',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://api.interlay.io/parachain',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://manta.network',
    info: 'manta',
    isChild: true,
    paraId: 2015,
    text: 'Manta',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://kuhlii.manta.systems',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://manta.network',
    info: 'manta',
    isChild: true,
    paraId: 2015,
    text: 'Manta',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://pectinata.manta.systems',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://moonbeam.network/networks/moonbeam/',
    info: 'moonbeam',
    isChild: true,
    paraId: 2004,
    text: 'Moonbeam',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://wss.api.moonbeam.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://moonbeam.network/networks/moonbeam/',
    info: 'moonbeam',
    isChild: true,
    paraId: 2004,
    text: 'Moonbeam',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://moonbeam.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://parallel.fi',
    info: 'parallel',
    isChild: true,
    paraId: 2012,
    text: 'Parallel',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://parallel.api.onfinality.io/public-ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://parallel.fi',
    info: 'parallel',
    isChild: true,
    paraId: 2012,
    text: 'Parallel',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.parallel.fi',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://polkadex.trade/',
    info: 'polkadex',
    isChild: true,
    paraId: 2036,
    text: 'Polkadex',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://mainnet.polkadex.trade/',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://dot.bifrost.app/?ref=polkadotjs',
    info: 'bifrost',
    isChild: true,
    isUnreachable: true,
    paraId: 2001,
    text: 'Bifrost',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://bifrost-dot.liebi.com/ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://centrifuge.io',
    info: 'centrifuge',
    isChild: true,
    isUnreachable: true,
    paraId: 2031,
    text: 'Centrifuge',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://fullnode.parachain.centrifuge.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'http://www.coinversation.io/',
    info: 'coinversation',
    isChild: true,
    isUnreachable: true,
    paraId: 2027,
    text: 'Coinversation',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.coinversation.io/',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://composable.finance/',
    info: 'composableFinance',
    isChild: true,
    isUnreachable: true,
    paraId: 2019,
    text: 'Composable Finance',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.composable.finance',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://crust.network',
    info: 'crustParachain',
    isChild: true,
    isUnreachable: true,
    paraId: 2008,
    text: 'Crust',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.crust.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://darwinia.network/',
    info: 'darwinia',
    isChild: true,
    isUnreachable: true,
    paraId: 2003,
    text: 'Darwinia',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://parachain-rpc.darwinia.network',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://equilibrium.io/',
    info: 'equilibrium',
    isChild: true,
    isUnreachable: true,
    paraId: 2011,
    text: 'Equilibrium',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://node.equilibrium.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://hydradx.io/',
    info: 'hydra',
    isChild: true,
    isUnreachable: true,
    paraId: 2034,
    text: 'HydraDX',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc-01.hydradx.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://crowdloan.litentry.com',
    info: 'litentry',
    isChild: true,
    isUnreachable: true,
    paraId: 2013,
    text: 'Litentry',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://parachain.litentry.io',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://nodle.com',
    info: 'nodle',
    isChild: true,
    isUnreachable: true,
    paraId: 2026,
    text: 'Nodle',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://rpc.nodle.com',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://phala.network',
    info: 'phala',
    isChild: true,
    isUnreachable: true,
    paraId: 2035,
    text: 'Phala Network',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://api.phala.network/ws',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'https://subdao.network/',
    info: 'subdao',
    isChild: true,
    isUnreachable: true,
    paraId: 2018,
    text: 'SubDAO',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://parachain-rpc.subdao.org',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  },
  {
    homepage: 'http://subgame.org/',
    info: 'subgame',
    isChild: true,
    isUnreachable: true,
    paraId: 2017,
    text: 'SubGame Gamma',
    isLightClient: false,
    isRelay: false,
    textBy: 'via {{host}}',
    value: 'wss://gamma.subgame.org/',
    genesisHashRelay: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    valueRelay: [
      'wss://rpc.polkadot.io',
      'wss://polkadot.api.onfinality.io/public-ws',
      'wss://polkadot-rpc.dwellir.com',
      'light://substrate-connect/polkadot'
    ]
  }
];
const winning = auction?.winning.find((x) => x);
const crowdloan = auction?.crowdloans.find((c) => c.fund.paraId === winning[1].replace(/,/g, ''));
const getText = (paraId: string): string | undefined => (endpoints.find((e) => e?.paraId === Number(paraId))?.text as string);
let display = crowdloan.identity.info.legal || crowdloan.identity.info.display || getText(crowdloan.fund.paraId);
const actives = auction.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber && !c.fund.hasLeased);
const winners = auction.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber || c.fund.hasLeased);
