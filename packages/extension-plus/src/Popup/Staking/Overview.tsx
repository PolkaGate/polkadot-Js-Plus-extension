// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/**
 * @description
 *  render an overview of current staking state of an account like currently staked/redemmable amount,
 *  total reward received, etc.
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { Redeem as RedeemIcon } from '@mui/icons-material';
import { Grid, IconButton, Paper, Skeleton } from '@mui/material';
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

interface BalanceProps {
  label: string;
  amount: string | null;
  coin: string;
}

function Balance({ amount, coin, label }: BalanceProps): React.ReactElement<BalanceProps> {
  return (<>
    <Grid item sx={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.8px', lineHeight: '16px' }} xs={12}>
      {label}
    </Grid>
    {amount === null || amount === 'NaN' || amount === undefined
      ? <Skeleton sx={{ display: 'inline-block', fontWeight: '400', lineHeight: '16px', width: '70px' }} />
      : <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', lineHeight: '16px' }}>
        {amount === '0' ? '0.00' : Number(amount).toLocaleString()}{' '}  {coin}
      </div>
    }
  </>);
}

export default function Overview({ availableBalanceInHuman, chainInfo, currentlyStakedInHuman, handleWithdrowUnbound, ledger, redeemable, totalReceivedReward, unlockingAmount }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Paper elevation={4} sx={{ borderRadius: '10px', fontSize: 12, height: 95, margin: '25px 30px 10px', p: 2, width: '90%' }}>
      <Grid container item>
        <Grid alignItems='center' container item justifyContent='space-between' sx={{ pb: '20px', textAlign: 'center' }}>
          <Grid item xs={4}>
            <Balance amount={availableBalanceInHuman} label={t('Available')} coin={chainInfo?.coin} />
          </Grid>
          <Grid item xs={4}>
            <Balance amount={currentlyStakedInHuman} label={t('Staked')} coin={chainInfo?.coin} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ textAlign: 'center' }}>
          <Grid item xs={4}>
            <Balance amount={totalReceivedReward} label={t('Reward')} coin={chainInfo?.coin} />
          </Grid>

          <Grid container item justifyContent='center' xs={4}>
            <Grid container item justifyContent='center' xs={12}>
              <Balance
                amount={amountToHuman(String(redeemable), chainInfo?.decimals)}
                label={
                  <Grid container item justifyContent='center'>
                    <Grid item >
                      {t('Redeemable')}
                    </Grid>
                    <Grid item>
                      <Hint id='redeem' place='top' tip={t('Withdraw unbounded')}>
                        <RedeemIcon color={redeemable ? 'warning' : 'disabled'} onClick={handleWithdrowUnbound} sx={{ cursor: 'pointer', fontSize: 15 }} />
                      </Hint>
                    </Grid>
                  </Grid>
                }
                coin={chainInfo?.coin} />
            </Grid>
          </Grid>

          <Grid item xs={4}>
            <Balance amount={amountToHuman(String(unlockingAmount), chainInfo?.decimals)} label={t('Unstaking')} coin={chainInfo?.coin} />
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
