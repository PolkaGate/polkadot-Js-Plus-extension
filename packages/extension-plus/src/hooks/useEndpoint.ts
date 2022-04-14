// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { createWsEndpoints } from '@polkadot/apps-config';
import { LinkOption } from '@polkadot/apps-config/settings/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';

import { savedMetaData } from '../util/plusTypes';

interface Option {
  text: string;
  value: string;
}

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

export default function (accounts: AccountJson[], address: string | null | undefined, chain: Chain | null | undefined): string | undefined {
  let endpoint = '';
  const chainName = chain?.name?.replace(' Relay Chain', '');
  const account = accounts.find((account) => account.address === address);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const endPointFromStore: savedMetaData = account?.endpoint ? JSON.parse(account.endpoint) : null;

  if (endPointFromStore && endPointFromStore?.chainName === chainName) {
    endpoint = endPointFromStore.metaData as string;
  }

  const endpointOptions: Option[] = useMemo(() => {
    const endpoints = allEndpoints.filter((e) => String(e.text)?.toLowerCase() === chainName?.toLowerCase());

    return endpoints.map((e) => ({ text: e.value, value: e.value }));
  }, [chainName]);

  if (!endpoint && endpointOptions?.length) {
    endpoint = endpointOptions[0].value;
  }

  return endpoint;
}
