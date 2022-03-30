// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { ApiDecoration } from '@polkadot/api/types';
import { AccountId } from '@polkadot/types/interfaces/runtime';
import { PalletBagsListListNode } from '@polkadot/types/lookup';

import { RebagInfo } from '../plusTypes';

export default async function needsRebag(baseApi: ApiPromise, api: ApiDecoration<'promise'>, currentAccount: AccountId): Promise<RebagInfo> {
  const currentCtrl = (await api.query.staking.bonded(currentAccount)).unwrap();
  const currentWeight = baseApi.createType('Balance', (await api.query.staking.ledger(currentCtrl)).unwrapOrDefault().active);

  let currentNode: PalletBagsListListNode = (await api.query.bagsList.listNodes(currentCtrl)).unwrap();
  const currentUpper = baseApi.createType('Balance', currentNode.bagUpper);

  if (currentWeight.gt(currentUpper)) {
    console.log(`\t ☝️ ${currentAccount} needs a rebag from ${currentUpper.toHuman()} to a higher [real weight = ${currentWeight.toHuman()}]`);

    return { shouldRebag: true, currentBagThreshold: currentUpper };
  } else {
    console.log(`\t ${currentAccount} doesn't need a rebag. Its weight is ${currentWeight.toHuman()} and its upper's weight is ${currentUpper.toHuman()}`);

    return { shouldRebag: false, currentBagThreshold: currentUpper };
  }
}
