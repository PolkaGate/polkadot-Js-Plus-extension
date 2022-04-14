// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { MAX_NOMINATIONS } from '../constants';
import getChainInfo from '../getChainInfo.ts';

async function getStackingConsts (_chain) {
  try {
    const { api } = await getChainInfo(_chain);
    const at = await api.rpc.chain.getFinalizedHead();
    const apiAt = await api.at(at);
    const maxNominations = apiAt.consts.staking.maxNominations?.toNumber() || MAX_NOMINATIONS;
    const maxNominatorRewardedPerValidator = apiAt.consts.staking.maxNominatorRewardedPerValidator.toNumber();
    const existentialDeposit = apiAt.consts.balances.existentialDeposit.toString();
    const bondingDuration = apiAt.consts.staking.bondingDuration.toNumber();
    const minNominatorBond = await apiAt.query.staking.minNominatorBond();

    return {
      bondingDuration: bondingDuration,
      existentialDeposit: BigInt(existentialDeposit), // FIXME, sometimes make issue while reading from local storge
      maxNominations: maxNominations,
      maxNominatorRewardedPerValidator: maxNominatorRewardedPerValidator,
      minNominatorBond: BigInt(minNominatorBond)
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
