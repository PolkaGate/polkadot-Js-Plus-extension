// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

async function getPools (endpoint) {
  const api = await getApi(endpoint);

  const lastPoolId = await api.query.nominationPools.lastPoolId();

  console.log(`gepools for lastPoolId.toNumber()`, lastPoolId.toNumber())
  if (!lastPoolId) return null;

  const queries = [];

  for (let pooldId = 1; pooldId <= lastPoolId.toNumber(); pooldId++) {
    queries.push(Promise.all([
      api.query.nominationPools.metadata(pooldId),
      api.query.nominationPools.bondedPools(pooldId),
      api.query.nominationPools.rewardPools(pooldId)
    ]));
  }

  console.log('queries in worker',queries)

  const poolsInfo = await Promise.all(queries);

  console.log('poolsInfo in worker',poolsInfo)


  const info = poolsInfo.map((poolInfo) => {
    return {
      metadata: poolInfo[0].length
        ? poolInfo[0].isUtf8
          ? poolInfo[0].toUtf8()
          : poolInfo[0].toString()
        : null,
      bondedPools: poolInfo[1].isSome ? poolInfo[1].unwrap() : null,
      rewardPools: poolInfo[1].isSome ? poolInfo[2].unwrap() : null
    };
  });

  console.log('info in worker',info)

  return JSON.stringify(info);
}

onmessage = (e) => {
  const { endpoint } = e.data;

  // eslint-disable-next-line no-void
  void getPools(endpoint).then((poolsInfo) => {
    postMessage(poolsInfo);
  });
};
