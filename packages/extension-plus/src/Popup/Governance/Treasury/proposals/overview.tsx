// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveTreasuryProposals } from '@polkadot/api-derive/types';

import { Avatar, Button, Divider, Grid, Link, Paper } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import Hint from '../../../../components/Hint';
import Identity from '../../../../components/Identity';
import getLogo from '../../../../util/getLogo';
import { ChainInfo } from '../../../../util/plusTypes';
import { amountToHuman, formatMeta } from '../../../../util/plusUtils';

interface Props {
  proposalsInfo: DeriveTreasuryProposals | null;
  chain: Chain;
  chainInfo: ChainInfo;
}


export default function Proposals({ chain, chainInfo, proposalsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chainName = chain?.name.replace(' Relay Chain', '');

  if (!proposalsInfo) return (<></>);

  const { approvals, proposals, proposalCount } = proposalsInfo;

  return (
    <>
      {approvals?.length
        ? approvals.map((p, index) => {
          // const proposerId= chainInfo.api.derive.accounts.info(p?.proposal.proposer)

          return (
            <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 20px' }}>
              <Grid container justifyContent='space-between'>

                <Grid item sx={{ fontSize: 13, textAlign: 'center' }} xs={4}>
                  {String(p?.id)} {' '}
                </Grid>
                <Grid item sx={{ fontSize: 12, textAlign: 'center' }} xs={4}>
                  {t('Value')}:{amountToHuman(String(p?.proposal.value), chainInfo?.decimals)} {chainInfo.coin}
                </Grid>
                <Grid item sx={{ fontSize: 12, textAlign: 'center' }} xs={4}>
                  {t('Bond')}:{amountToHuman(String(p?.proposal.bond), chainInfo?.decimals)} {chainInfo.coin}
                </Grid>

                <Grid item sx={{ fontSize: 13, textAlign: 'center' }} xs={12}>
                  {String(p?.proposal.proposer)} {' '}
                </Grid>

                <Grid item sx={{ fontSize: 13, textAlign: 'center' }} xs={12}>
                  {String(p?.proposal.beneficiary)} {' '}
                </Grid>


              </Grid>

              <Grid item>
                <Divider />
              </Grid>



              {/*               
              <Grid item sx={{ fontSize: 12 }} xs={12}>
                {p?.proposal.proposer &&
                  <Identity accountInfo={accountsInfo[index]} chain={chain} showAddress title={t('Proposer')} />
                }
              </Grid> */}



            </Paper>);
        })
        : <Grid sx={{ fontSize: 12, paddingTop: 3, textAlign: 'center' }} xs={12}>
          {t('No proposal')}
        </Grid>}
    </>
  );
}
