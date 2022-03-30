// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { ApiPromise } from '@polkadot/api';
import { ApiDecoration } from '@polkadot/api/types';
import { AccountId } from '@polkadot/types/interfaces/runtime';
import { PalletBagsListListBag, PalletBagsListListNode } from '@polkadot/types/lookup';
import { Option } from '@polkadot/types-codec';

export default async function needsPutInFrontOf(baseApi: ApiPromise, api: ApiDecoration<'promise'>, target: string): Promise<AccountId | undefined> {
  const targetAccount = baseApi.createType('AccountId', target);
  const targetCtrl = (await api.query.staking.bonded(targetAccount)).unwrap();
  const targetWeight = baseApi.createType('Balance', (await api.query.staking.ledger(targetCtrl)).unwrapOrDefault().active);

  const targetNode: PalletBagsListListNode = (await api.query.bagsList.listNodes(targetCtrl)).unwrap();

  const targetBag: PalletBagsListListBag = (await api.query.bagsList.listBags(targetNode.bagUpper)).unwrap();

  let lighterUnwrapped: Option<AccountId> = targetBag.head;
  let lighter: AccountId | undefined = undefined;

  while (lighterUnwrapped.isSome) {
    lighter = lighterUnwrapped.unwrap() as AccountId;

    if (lighter.eq(targetAccount)) {
      console.log(`No lighter `);

      return undefined
    }

    const lighterCtrl = (await api.query.staking.bonded(lighter)).unwrap() as AccountId;
    const lighterWeight = baseApi.createType('Balance', (await api.query.staking.ledger(lighterCtrl)).unwrapOrDefault().active) as Balance;
    console.log(` ${lighterCtrl}  : ${lighterWeight.toHuman()}`)

    if (lighterWeight.lt(targetWeight)) {
      return lighter;
    }

    lighterUnwrapped = (await api.query.bagsList.listNodes(lighter)).unwrap().next;
  }

  return lighter;
}
