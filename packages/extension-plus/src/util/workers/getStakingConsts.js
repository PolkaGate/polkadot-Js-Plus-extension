// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { MAX_NOMINATIONS } from '../constants';
import getChainInfo from '../getChainInfo.ts';

async function getStackingConsts (_chain) {
  try {
    const { api, decimals } = await getChainInfo(_chain);

    const maxNominations = api.consts.staking.maxNominations?.toNumber() || MAX_NOMINATIONS;
    const maxNominatorRewardedPerValidator = api.consts.staking.maxNominatorRewardedPerValidator.toNumber();
    const existentialDeposit = api.consts.balances.existentialDeposit.toString();
    const bondingDuration = api.consts.staking.bondingDuration.toNumber();
    const minNominatorBond = await api.query.staking.minNominatorBond();

    return {
      bondingDuration: bondingDuration,
      existentialDeposit: BigInt(existentialDeposit),
      maxNominations: maxNominations,
      maxNominatorRewardedPerValidator: maxNominatorRewardedPerValidator,
      minNominatorBond: Number(minNominatorBond) / (10 ** decimals)
    };
  } catch (error) {
    console.log('something went wrong while getStackingConsts. err: ' + error);

    return null;
  }
}

onmessage = (e) => {
  const { chain } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getStackingConsts(chain).then((consts) => {
    console.log('StackingConsts in worker: %o', consts);
    postMessage(consts);
  });
};
