// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo.ts';

async function needsRebag (chain, currentAccount) {
  console.log(`needsRebag is running for ${currentAccount}`);

  const { api } = await getChainInfo(chain);

  const at = await api.rpc.chain.getFinalizedHead();
  const apiAt = await api.at(at);

  const currentCtrl = (await apiAt.query.staking.bonded(currentAccount)).unwrap();

  const currentWeight = api.createType('Balance', (await apiAt.query.staking.ledger(currentCtrl)).unwrapOrDefault().active);
  const unwrapedCurrentNode = await apiAt.query.bagsList.listNodes(currentCtrl);
  const currentNode = unwrapedCurrentNode.isSome ? unwrapedCurrentNode.unwrap() : undefined;

  if (!currentNode) {
    // account probably has done stopNominated
    return { currentBagThreshold: '0.00 DOT', shouldRebag: false };
  }

  const currentUpper = api.createType('Balance', currentNode.bagUpper);

  if (currentWeight.gt(currentUpper)) {
    console.log(`\t ☝️ ${currentAccount} needs a rebag from ${currentUpper.toHuman()} to a higher [real weight = ${currentWeight.toHuman()}]`);

    return { currentBagThreshold: currentUpper.toHuman(), shouldRebag: true };
  } else {
    console.log(`\t ${currentAccount} doesn't need a rebag. Its weight is ${currentWeight.toHuman()} and its upper's weight is ${currentUpper.toHuman()}`);

    return { currentBagThreshold: currentUpper.toHuman(), shouldRebag: false };
  }
}

onmessage = (e) => {
  const { chain, stakerAddress } = e.data;

  // eslint-disable-next-line no-void
  void needsRebag(chain, stakerAddress).then((rebag) => {
    postMessage(rebag);
  });
};
