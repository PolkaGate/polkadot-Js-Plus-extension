// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { createWsEndpoints } from '@polkadot/apps-config';
import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';

interface Option {
  text: string;
  value: string;
}

export default function (genesisHash: string | null | undefined): Option[] {
  if (!genesisHash) return [];

  const genesisOptions = useGenesisHashOptions();

  const endpoints: Option[] = useMemo(() => {
    const option = genesisOptions?.find((o) => o.value === genesisHash);
    const chainName = option?.text?.replace(' Relay Chain', '');
    const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

    const endpoints = allEndpoints.filter((e) => String(e.text)?.toLowerCase() === chainName?.toLowerCase());

    return endpoints.map((e) => ({ text: e.value, value: e.value }));
  }, [genesisHash, genesisOptions]);

  return endpoints;
}
