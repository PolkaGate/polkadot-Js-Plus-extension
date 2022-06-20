// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { ScProvider, WellKnownChain } from '@polkadot/rpc-provider/substrate-connect';

function getWellKnownChain(chain = 'polkadot') {
  switch (chain) {
    case 'kusama':
      return WellKnownChain.ksmcc3;
    case 'polkadot':
      return WellKnownChain.polkadot;
    case 'rococo':
      return WellKnownChain.rococo_v2_2;
    case 'westend':
      return WellKnownChain.westend2;
    default:
      throw new Error(`Unable to construct light chain ${chain}`);
  }
}

export default function (endpoint: string | undefined): ApiPromise | undefined {
  const [api, setApi] = useState<ApiPromise | undefined>();
  const isLight = endpoint?.startsWith('light://');

  useEffect(() => {
    if (!endpoint) { return; }

    const wsProvider = isLight
      ? new ScProvider(getWellKnownChain(endpoint.replace('light://substrate-connect/', '')))
      : new WsProvider(endpoint);

    isLight && wsProvider.connect();

    ApiPromise.create({ provider: wsProvider }).then((api) => setApi(api)).catch(console.error);
  }, [endpoint, isLight]);

  return api;
}
