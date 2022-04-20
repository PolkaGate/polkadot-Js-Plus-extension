// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * @description
 * find endpoints based on chainName and also omit light client which my be add later
 */
import { useMemo } from 'react';

import { createWsEndpoints } from '@polkadot/apps-config';
import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';
import useTranslation from '@polkadot/extension-ui/hooks/useTranslation';

interface Option {
  text: string;
  value: string;
}

export default function (genesisHash: string | null | undefined): Option[] {
  const { t } = useTranslation();
  const allEndpoints = createWsEndpoints(t);

  if (!genesisHash) return [];

  const genesisOptions = useGenesisHashOptions();

  const endpoints: Option[] = useMemo(() => {
    const option = genesisOptions?.find((o) => o.value === genesisHash);
    const chainName = option?.text?.replace(' Relay Chain', '');

    const endpoints = allEndpoints?.filter((e) => String(e.text)?.toLowerCase() === chainName?.toLowerCase());

    return endpoints?.filter((e) => e.value.startsWith('wss')).map((e) => ({ text: e.textBy, value: e.value }));
  }, [allEndpoints, genesisHash, genesisOptions]);

  return endpoints ?? [];
}
