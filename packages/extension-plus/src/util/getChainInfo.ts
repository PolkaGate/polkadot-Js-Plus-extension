// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { Chain } from '@polkadot/extension-chains/types';

import getChainInfo from 'memoize-one';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { createWsEndpoints } from '@polkadot/apps-config';

import { ChainInfo } from './plusTypes';

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);
console.log('allEndpoints:', allEndpoints);

async function gChainInfo(searchKeyWord: Chain | string): Promise<ChainInfo> {
  const chainName = (searchKeyWord as Chain)?.name?.replace(' Relay Chain', '') ?? searchKeyWord as string;

  // if (!chainName) return null;
  // console.log('allEndpoints',allEndpoints)
  const endpoint = allEndpoints.find((e) => String(e.text)?.toLowerCase() === chainName?.toLowerCase() ||
    e.genesisHash === searchKeyWord);
  // const endpoints = allEndpoints.filter((e) => (String(e.text)?.toLowerCase() === chainName?.toLowerCase()));
  // const onfinalityEndpoint = endpoints.find((e) => e.value.includes('onfinality'));
  // console.log('endpoints:', endpoints)
  // const endpoint = onfinalityEndpoint || endpoints[0];
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

export default getChainInfo(gChainInfo);