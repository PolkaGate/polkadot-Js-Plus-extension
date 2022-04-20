// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import getApi from '../getApi.ts';

async function getAllValidatorsId (endpoint, _accountIds) {
  try {
    const api = await getApi(endpoint);
    const accountInfo = await Promise.all(_accountIds.map((i) => api.derive.accounts.info(i)));

    return JSON.parse(JSON.stringify(accountInfo));
  } catch (error) {
    console.log('something went wrong while getting validators id, err:', error);

    return null;
  }
}

onmessage = (e) => {
  const { endpoint, validatorsAccountIds } = e.data;

  // eslint-disable-next-line no-void
  void getAllValidatorsId(endpoint, validatorsAccountIds).then((info) => { postMessage(info); });
};
