// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useContext, useEffect, useState } from 'react';

import { createWsEndpoints } from '@polkadot/apps-config';
import { Chain } from '@polkadot/extension-chains/types';

import { AccountContext } from '../../../extension-ui/src/components/contexts';
import { savedMetaData } from '../util/plusTypes';

export default function useEndPoint (address: string | null | undefined, chain: Chain | null | undefined): string | undefined {
  const { accounts } = useContext(AccountContext);
  const [endpoint, setEndpoint] = useState('');

  useEffect(() => {
    if (!accounts?.length || !chain) { return; }

    const chainName = chain?.name?.replace(' Relay Chain', '');
    const account = accounts.find((account) => account.address === address);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const endPointFromStore: savedMetaData = account?.endpoint ? JSON.parse(account.endpoint) : null;

    if (endPointFromStore && endPointFromStore?.chainName === chainName) {
      setEndpoint(endPointFromStore.metaData as string);
    } else {
      const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);
      const endpoints = allEndpoints.filter((e) => String(e.text)?.toLowerCase() === chainName?.toLowerCase());

      setEndpoint(endpoints[0].value);
    }
  }, [accounts, accounts?.length, address, chain, chain?.name]);

  return endpoint;
}
