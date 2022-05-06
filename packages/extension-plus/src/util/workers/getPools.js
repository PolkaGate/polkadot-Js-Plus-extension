// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

async function getPools (endpoint) {
  const api = await getApi(endpoint);

  const lastPoolId = await api.query.nominationPools.lastPoolId();

  console.log('gepools for lastPoolId.toNumber()', lastPoolId.toNumber());
  if (!lastPoolId) return null;

  const queries = [];

  for (let pooldId = 1; pooldId <= lastPoolId.toNumber(); pooldId++) {
    queries.push(Promise.all([
      api.query.nominationPools.metadata(pooldId),
      api.query.nominationPools.bondedPools(pooldId),
      api.query.nominationPools.rewardPools(pooldId)
    ]));
  }

  const info = await Promise.all(queries);

  const poolsInfo = info.map((i) => {
    return {
      bondedPools: i[1].isSome ? i[1].unwrap() : null,
      metadata: i[0].length
        ? i[0].isUtf8
          ? i[0].toUtf8()
          : i[0].toString()
        : null,
      rewardPools: i[2].isSome ? i[2].unwrap() : null
    };
  });

  console.log('info in worker', poolsInfo);

  return JSON.stringify(poolsInfo);
}

onmessage = (e) => {
  const { endpoint } = e.data;

  // eslint-disable-next-line no-void
  void getPools(endpoint).then((poolsInfo) => {
    postMessage(poolsInfo);
  });
};
