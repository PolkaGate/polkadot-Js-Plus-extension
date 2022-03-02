// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/** NOTE render an overview of current staking state of an account like currently staked/redemmable amount, total reward received, etc.  */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { Redeem as RedeemIcon } from '@mui/icons-material';
import { Box, Grid, IconButton, Paper, Skeleton } from '@mui/material';
import React from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import Hint from '../../components/Hint';
import { ChainInfo } from '../../util/plusTypes';
import { amountToHuman } from '../../util/plusUtils';

interface Props {
  availableBalanceInHuman: string,
  chainInfo: ChainInfo;
  ledger: StakingLedger | null;
  redeemable: bigint | null;
  currentlyStakedInHuman: string | null;
  totalReceivedReward: string | null;
  handleWithdrowUnbound: () => void;
  unlockingAmount: bigint;
}

export default function Overview({ availableBalanceInHuman, chainInfo, currentlyStakedInHuman, handleWithdrowUnbound, ledger, redeemable, totalReceivedReward, unlockingAmount }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
 
  return (
    <Paper elevation={4} sx={{ fontSize: 12, borderRadius: '10px', margin: '25px 30px 10px', p: 3, width: '90%' }}>
      <Grid container item>
        <Grid container item justifyContent='space-between' sx={{ padding: '10px 0px 20px' }}>
          <Grid item>
            <b> {t('Available')}: </b> <Box component='span' sx={{ fontWeight: 600 }}> {availableBalanceInHuman}</Box>
          </Grid>
          <Grid item>
            <b> {t('Staked')}: </b> {!ledger
              ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
              : <Box component='span' sx={{ fontWeight: 600 }}>
                {currentlyStakedInHuman !== '0' ? currentlyStakedInHuman : '0.00'}
              </Box>
            }
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between'>
          <Grid item>
            <b> {t('Reward')}: </b>{!totalReceivedReward
              ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
              : <Box component='span' sx={{ fontWeight: 600 }}> {totalReceivedReward}</Box>
            }
          </Grid>
          <Grid item>
            <b>{t('Redeemable')} : </b>{redeemable === null
              ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
              : <Box component='span' sx={{ fontWeight: 600 }}>
                {redeemable ? amountToHuman(String(redeemable), chainInfo?.decimals) : '0.00'}   {' '}
              </Box>
            }
            <Hint id='redeem' place='top' tip={t('Withdraw unbounded')}>
              <IconButton disabled={!redeemable} edge='start' onClick={handleWithdrowUnbound} size='small'>
                <RedeemIcon color={redeemable ? 'warning' : 'disabled'} fontSize='inherit' />
              </IconButton>
            </Hint>
          </Grid>
          <Grid item>
            <b> {t('Unstaking')}:</b> {!ledger
              ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
              : <Box component='span' sx={{ fontWeight: 600 }}>
                {unlockingAmount ? amountToHuman(String(unlockingAmount), chainInfo?.decimals) : '0.00'}
              </Box>
            }
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
