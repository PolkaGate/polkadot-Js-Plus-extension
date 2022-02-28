// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getChainInfo from '../getChainInfo.ts';

async function getAllValidatorsId (_chain, _accountIds) {
  try {
    const { api } = await getChainInfo(_chain);
    const accountInfo = await Promise.all(_accountIds.map((i) => api.derive.accounts.info(i)));

    return JSON.parse(JSON.stringify(accountInfo));
  } catch (error) {
    console.log('something went wrong while getting validators id, err:', error);

    return null;
  }
}

onmessage = (e) => {
  const { chain, validatorsAccountIds } = e.data;

  // eslint-disable-next-line no-void
  void getAllValidatorsId(chain, validatorsAccountIds).then((info) => { postMessage(info); });
};
