// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { encodeAddress } from '@polkadot/util-crypto';

import getApi from '../getApi.ts';

async function isRecovering(_address, endpoint, chain) {
  if (!_address) {
    return null;
  }

  const api = await getApi(endpoint);

  const activeRecoveries = await api.query.recovery.activeRecoveries.entries();

  for (let i = 0; i < activeRecoveries.length; i++) {
    const [key, option] = activeRecoveries[i];

    if (encodeAddress('0x' + key.toString().slice(82, 146), chain?.ss58Format) === _address) { // if this is lostAccount Id
      return {
        accountId: encodeAddress('0x' + key.toString().slice(162), chain?.ss58Format),
        option: JSON.parse(JSON.stringify(option))
      }; // return rescuer
    }
  }

  return undefined;
}

onmessage = (e) => {
  const { formattedAddress, chain, endpoint } = e.data;

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  isRecovering(formattedAddress, endpoint, chain).then((rescuer) => {
    postMessage(rescuer);
  });
};
