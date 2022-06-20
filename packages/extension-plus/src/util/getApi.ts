// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

// import * as smoldot from '@substrate/smoldot-light';
import Memoize from 'memoize-one';

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

async function getApi(endpoint: string): Promise<ApiPromise> {
  const isLight = endpoint?.startsWith('light://');
  //   let client;
  //   let chain;

  //   if (isLight) {
  //     // A single client can be used to initialize multiple chains.
  //     client = await smoldot.start();

  //     const chain = await client.addChain({
  //       getWellKnownChain(endpoint.replace('light://substrate-connect/', '')),
  //       jsonRpcCallback: (jsonRpcResponse) => {
  //           // Called whenever the client emits a response to a JSON-RPC request,
  //           // or an incoming JSON-RPC notification.
  //           console.log(jsonRpcResponse)
  //   }
  // })  }

  const wsProvider = isLight
    ? new ScProvider(getWellKnownChain(endpoint.replace('light://substrate-connect/', '')))
    : new WsProvider(endpoint);

  isLight && await wsProvider.connect();

  return await ApiPromise.create({ provider: wsProvider });
}

export default Memoize(getApi);
