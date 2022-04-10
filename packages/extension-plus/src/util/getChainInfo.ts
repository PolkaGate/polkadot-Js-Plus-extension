// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { Chain } from '@polkadot/extension-chains/types';

import Memoize from 'memoize-one';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { createWsEndpoints } from '@polkadot/apps-config';
import { LinkOption } from '@polkadot/apps-config/endpoints/types';

import { ChainInfo } from './plusTypes';

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

async function getChainInfo(searchKeyWord: Chain | string, endpointName?: string): Promise<ChainInfo> {
  const chainName = (searchKeyWord as Chain)?.name?.replace(' Relay Chain', '') ?? searchKeyWord as string;
  const condition = (input: LinkOption) => String(input.text)?.toLowerCase() === chainName?.toLowerCase() || input.genesisHash === searchKeyWord
  // if (!searchKeyWord) return null;
  let endpoint;

  // endpointName = 'onfinality';// for test

  if (endpointName) {
    const endpoints = allEndpoints.filter((e) => condition(e));

    endpoint = endpoints.find((e) => e.value.includes(endpointName));
    endpoint = endpoint || endpoints[0];
  } else {
    endpoint = allEndpoints.find((e) => condition(e));
  }

  const wsProvider = new WsProvider(endpoint?.value as string);

  const api = await ApiPromise.create({ provider: wsProvider });

  return {
    api: api,
    chainName: String(endpoint?.text),
    coin: api.registry.chainTokens[0],
    decimals: api.registry.chainDecimals[0],
    genesisHash: endpoint?.genesisHash as string,
    url: (endpoint?.value as string).toLowerCase()
  };
}

export default Memoize(getChainInfo);
