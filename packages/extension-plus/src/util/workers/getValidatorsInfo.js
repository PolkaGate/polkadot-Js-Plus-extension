// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo.ts';
import { amountToHuman } from '../plusUtils.ts';

async function getAllValidators (_chain) {
  try {
    const { api, decimals } = await getChainInfo(_chain);

    const [elected, waiting, currentEra] = await Promise.all([

      api.derive.staking.electedInfo({ withController: true, withDestination: true, withExposure: true, withPrefs: true, withNominations: true, withLedger: true }),
      api.derive.staking.waitingInfo({ withController: true, withDestination: true, withExposure: true, withPrefs: true, withNominations: true, withLedger: true }),
      api.query.staking.currentEra()
    ]);
    let nextElectedInfo = elected.info.filter((e) =>
      elected.nextElected.find((n) =>
        String(n) === String(e.accountId)
      ));

    nextElectedInfo = JSON.parse(JSON.stringify(nextElectedInfo));
    nextElectedInfo = nextElectedInfo.map((n) => {
      n.exposure.own = amountToHuman(n.exposure.own, decimals);
      n.exposure.total = amountToHuman(n.exposure.total, decimals);
      n.stakingLedger.active = amountToHuman(n.stakingLedger.active, decimals);
      n.stakingLedger.total = amountToHuman(n.stakingLedger.total, decimals);

      return n;
    });

    let waitingInfo = JSON.parse(JSON.stringify(waiting.info));

    waitingInfo = waitingInfo.map((w) => {
      w.exposure.own = amountToHuman(w.exposure.own, decimals);
      w.exposure.total = amountToHuman(w.exposure.total, decimals);
      w.stakingLedger.active = amountToHuman(w.stakingLedger.active, decimals);
      w.stakingLedger.total = amountToHuman(w.stakingLedger.total, decimals);

      return w;
    });

    return JSON.parse(JSON.stringify({
      current: nextElectedInfo,
      currentEraIndex: currentEra.toHuman(),
      waiting: waitingInfo
    }));
  } catch (error) {
    console.log('something went wrong while getting validators info, err:', error);

    return null;
  }
}

onmessage = (e) => {
  const { chain } = e.data;

  // eslint-disable-next-line no-void
  void getAllValidators(chain).then((info) => { postMessage(info); });
};
