// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo';

const bigIntMin = (...args) => args.reduce((m, e) => e < m ? e : m);

async function getNominatorInfo (_chain, _nominatorAddress) {
  const { api } = await getChainInfo(_chain);

  // a map of all nominators
  const assignments = new Map();
  const currentEra = (await api.query.staking.currentEra()).unwrap();
  const stakers = await api.query.staking.erasStakers.entries(currentEra);

  stakers.map((x) => x[1].others).flat().forEach((x) => {
    const nominator = String(x.who);
    const amount = BigInt(x.value);

    if (assignments.get(nominator)) {
      assignments.set(nominator, amount + (assignments.get(nominator)));
    } else {
      assignments.set(nominator, amount);
    }
  });

  return {
    isInList: !!assignments.get(_nominatorAddress),
    minNominated: bigIntMin(...assignments.values())
  };
}

onmessage = (e) => {
  const { chain, stakerAddress } = e.data;

  // eslint-disable-next-line no-void
  void getNominatorInfo(chain, stakerAddress).then((info) => {
    postMessage(info);
  });
};