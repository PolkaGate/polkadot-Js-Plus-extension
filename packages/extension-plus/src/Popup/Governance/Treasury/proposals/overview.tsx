// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveTreasuryProposals } from '@polkadot/api-derive/types';

import { Grid } from '@mui/material';
import React from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { ChainInfo } from '../../../../util/plusTypes';
import Proposals from './Proposals';

interface Props {
  proposalsInfo: DeriveTreasuryProposals | null;
  chain: Chain;
  chainInfo: ChainInfo;
  currentBlockNumber: number;
}

export default function Overview({ chain, chainInfo, currentBlockNumber, proposalsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chainName = chain?.name.replace(' Relay Chain', '');

  if (!proposalsInfo) {
    return (
      <Grid sx={{ fontSize: 12, paddingTop: 3, textAlign: 'center' }} xs={12}>
        {t('No proposals')}
      </Grid>
    );
  }

  const { approvals, proposalCount, proposals } = proposalsInfo;

  return (
    <>
      <Proposals chain={chain} chainInfo={chainInfo} proposals={proposals} title={t('Proposals')} />
      <Proposals chain={chain} chainInfo={chainInfo} proposals={approvals} title={t('Approved')} />
    </>
  );
}
