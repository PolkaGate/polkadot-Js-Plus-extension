// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import Extension from '../../../../extension-base/src/background/handlers/Extension';
import State, { AuthUrls } from '../../../../extension-base/src/background/handlers/State';
import { AccountsStore } from '../../../../extension-base/src/stores';
import { StakingConsts, ValidatorsName } from '../../util/plusTypes';
import { SHORT_ADDRESS_CHARACTERS } from '../constants';
import { Auction } from '../plusTypes';

const westendGenesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';
const type = 'sr25519';
const password = 'passw0rd';

export const auction: Auction = {
  auctionCounter: 10,
  auctionInfo: [
    7,
    9095310
  ],
  blockchain: 'polkadot',
  crowdloans: [{
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

export const endpoints: LinkOption[] = [
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

export function makeShortAddr (address: string) {
  return `${address.slice(0, SHORT_ADDRESS_CHARACTERS)}...${address.slice(-1 * SHORT_ADDRESS_CHARACTERS)}`;
}

export const validatorsName: ValidatorsName[] = [
  { address: '5HNJ3k2Xr3CKiygecfWnpsq9dDJvFGMbNu1ckDqAUJHwf45P', name: 'Chris' },
  { address: '5Dt2dFSLVwiKtEHC7VrVEiJDiVLRiDbaFRBdh8MBSvwuvDCD', name: 'Adam' },
  { address: '5DviS2M1kyyqs1GzMxHAjS3Si49hS3N2Jib9jz4Yx7pJgQHu', name: 'Diego' },
  { address: '5DVDZcaxCDLStUgnqkx67ZrYP9ZQ4hpSiVsHiUmfJh8VTo8S', name: 'Moly' },
  { address: '5GVzG3QJvRc6MEtxaJZnLB3PAhQT8eMgesqgHxYiiQJE4HNv', name: 'Mary' },
  { address: '5CPDNHdbZMNNeHLq7t9Cc434CM1fBL6tkaifiCG3kaQ8KHv8', name: 'NewYork Times' },
  { address: '5CFPcUJgYgWryPaV1aYjSbTpbTLu42V32Ytw1L9rfoMAsfGh', name: 'Amir' },
  { address: '5C864nyotaG4cNoR3YBUqnPVnnvqF1NN1s9t9CuAebyQkQGF', name: 'Olivia' },
  { address: '5GYaYNVq6e855t5hVCyk4Wuqssaf6ADTrvdPZ3QXyHvFXTip', name: 'Emma' },
  { address: '5Ek5JCnrRsyUGYNRaEvkufG1i1EUxEE9cytuWBBjA9oNZVsf', name: 'Mia' }
];

const others = [
  { who: validatorsName[0].address, value: 2331341969325348 },
  { who: validatorsName[1].address, value: 2233136292040751 },
  { who: validatorsName[2].address, value: 1102408869404150 },
  { who: validatorsName[3].address, value: 536346326599754 },
  { who: validatorsName[4].address, value: 536346326599754 },
  { who: validatorsName[5].address, value: 536346326599754 },
  { who: validatorsName[6].address, value: 536346326599754 },
  { who: validatorsName[7].address, value: 536346326599754 },
  { who: validatorsName[8].address, value: 536346326599754 },
  { who: validatorsName[9].address, value: 123257089339220 }
];

export const validatorsList: DeriveStakingQuery[] = [
  { accountId: validatorsName[0].address, exposure: { others: others.slice(0, 1), own: 0.12345, total: 1.23456 }, validatorPrefs: { commission: 200000000 } },
  { accountId: validatorsName[1].address, exposure: { others: others.slice(0, 2), own: 0.23451, total: 12.3456 }, validatorPrefs: { commission: 210000000 } },
  { accountId: validatorsName[2].address, exposure: { others: others.slice(0, 3), own: 0.34512, total: 123.456 }, validatorPrefs: { commission: 150000000 } },
  { accountId: validatorsName[3].address, exposure: { others: others.slice(0, 4), own: 0.45123, total: 1234.56 }, validatorPrefs: { commission: 90000000 } },
  { accountId: validatorsName[4].address, exposure: { others: others.slice(0, 6), own: 0.51234, total: 12345.6 }, validatorPrefs: { commission: 750000000 } },
  { accountId: validatorsName[5].address, exposure: { others: others.slice(0, 7), own: 0.11234, total: 1234567 }, validatorPrefs: { commission: 160000000 } },
  { accountId: validatorsName[6].address, exposure: { others: others.slice(0, 8), own: 0.22345, total: 12345678 }, validatorPrefs: { commission: 130000000 } }
];

export const validatorsIdentities: DeriveAccountInfo[] = [
  { accountId: validatorsList[0].accountId, identity: { display: validatorsName[0].name } },
  { accountId: validatorsList[1].accountId, identity: { display: validatorsName[1].name } },
  { accountId: validatorsList[2].accountId, identity: { display: validatorsName[2].name } },
  { accountId: validatorsList[3].accountId, identity: { display: validatorsName[3].name } },
  { accountId: validatorsList[4].accountId, identity: { display: validatorsName[4].name } },
  { accountId: validatorsList[5].accountId, identity: { display: validatorsName[5].name } },
  { accountId: validatorsList[6].accountId, identity: { display: validatorsName[6].name } }
];

export const stakingConsts: StakingConsts = {
  bondingDuration: 28,
  existentialDeposit: 10000000000n,
  maxNominations: 16,
  maxNominatorRewardedPerValidator: 64,
  minNominatorBond: 1
};

export const nominatedValidators: DeriveStakingQuery[] = [
  { accountId: validatorsName[5].address, exposure: { others: others.slice(1), total: 1.23456 }, validatorPrefs: { commission: 200000000 } },
  { accountId: validatorsName[6].address, exposure: { others: others.slice(0, 1), total: 12.3456 }, validatorPrefs: { commission: 210000000 } },
  { accountId: validatorsName[7].address, exposure: { others: others.slice(3), total: 123.456 }, validatorPrefs: { commission: 150000000 } },
  { accountId: validatorsName[8].address, exposure: { others: others.slice(2), total: 1234.56 }, validatorPrefs: { commission: 90000000 } },
  { accountId: validatorsName[9].address, exposure: { others: others, total: 12345.6 }, validatorPrefs: { commission: 750000000 } }
];

export async function createAccount (suri: string, extension: Extension): Promise<string> {
  await extension.handle('id', 'pri(accounts.create.suri)', {
    genesisHash: westendGenesisHash,
    name: 'Amir khan',
    password: password,
    suri: suri,
    type: type
  }, {} as chrome.runtime.Port);

  const { address } = await extension.handle('id', 'pri(seed.validate)', { suri: suri, type: type }, {} as chrome.runtime.Port);

  return address;
}

export async function createExtension (): Promise<Extension> {
  await cryptoWaitReady();

  keyring.loadAll({ store: new AccountsStore() });
  const authUrls: AuthUrls = {};

  authUrls['localhost:3000'] = {
    count: 0,
    id: '11',
    isAllowed: true,
    origin: 'example.com',
    url: 'http://localhost:3000'
  };
  localStorage.setItem('authUrls', JSON.stringify(authUrls));
  const state = new State();

  return new Extension(state);
}
