// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { Chain } from '@polkadot/extension-chains/types';

import getChainInfo from 'memoize-one';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { createWsEndpoints } from '@polkadot/apps-config';

import { ChainInfo } from './plusTypes';

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

async function gChainInfo(_chain: Chain | string): Promise<ChainInfo> {
  const chainName = (_chain as Chain)?.name?.replace(' Relay Chain', '') ?? _chain as string;

  // if (!chainName) return null;

  const endpoint = allEndpoints.find((e) => (String(e.text)?.toLowerCase() === chainName?.toLowerCase()));
  // const endpoints = allEndpoints.filter((e) => (String(e.text)?.toLowerCase() === chainName?.toLowerCase()));
  // const onfinalityEndpoint = endpoints.find((e) => e.value.includes('onfinality'));
  // console.log('endpoints:', endpoints)
  // const endpoint = onfinalityEndpoint || endpoints[0];
  const wsProvider = new WsProvider(endpoint?.value as string);

  const api = await ApiPromise.create({ provider: wsProvider });

  return {
    api: api,
    coin: api.registry.chainTokens[0],
    decimals: api.registry.chainDecimals[0],
    genesisHash: endpoint?.genesisHash as string,
    url: endpoint?.value as string
  };
}

export default getChainInfo(gChainInfo);