// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { encodeAddress } from '@polkadot/util-crypto';

import getApi from '../getApi.ts';

async function hasRecovery (_address, endpoint, chain) {
  if (!_address) {
    return null;
  }

  const api = await getApi(endpoint);

  const activeRecoveries = await api.query.recovery.activeRecoveries.entries();

  for (let i = 0; i < activeRecoveries.length; i++) {
    const [key, _] = activeRecoveries[i];

    if (encodeAddress('0x' + key.toString().slice(82, 146), chain?.ss58Format) === _address) { // if this is lostAccount Id
      return encodeAddress('0x' + key.toString().slice(162), chain?.ss58Format); // return rescuer accountId
    }
  }

  return undefined;
}

onmessage = (e) => {
  const { address, chain, endpoint } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  hasRecovery(address, endpoint, chain).then((rescuer) => {
    postMessage(rescuer);
  });
};
