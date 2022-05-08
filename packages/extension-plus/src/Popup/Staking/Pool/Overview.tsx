// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */
/* eslint-disable react/jsx-first-prop-new-line */

/**
 * @description
 *  render an overview of current staking state of an account like currently staked/redemmable amount,
 *  total reward received, etc.
 * */

import type { Balance } from '@polkadot/types/interfaces';
import type { FrameSystemAccountInfo, PalletNominationPoolsBondedPoolInner, PalletNominationPoolsPoolMember, PalletNominationPoolsRewardPool, PalletStakingNominations } from '@polkadot/types/lookup';

import { BarChart as BarChartIcon, MoreVert as MoreVertIcon, Redeem as RedeemIcon } from '@mui/icons-material';
import { Grid, Menu, MenuItem, Paper, Skeleton } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Hint, ShowBalance2 } from '../../../components';
import { amountToHuman } from '../../../util/plusUtils';

interface Props {
  availableBalanceInHuman: string,
  api: ApiPromise | undefined;
  handleWithdrowUnbound: () => void;
  handleViewChart: () => void;
  myPool: any | undefined | null;
}

interface BalanceProps {
  label: string | Element;
  amount: string | null;
  coin: string;
}

function Balance0({ amount, coin, label }: BalanceProps): React.ReactElement<BalanceProps> {
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

export default function Overview({ api, availableBalanceInHuman, myPool, handleViewChart, handleWithdrowUnbound }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [unlockingAmount, setUnlockingAmount] = useState<BN | undefined>();

  const decimals = api && api.registry.chainDecimals[0];
  const token = api?.registry?.chainTokens[0] ?? '';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAdvanceMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!myPool || !api) { return; }

    let value = BN_ZERO;

    for (const [era, unbondingPoint] of Object.entries(myPool.member?.unbondingEras)) {
      value = value.add(new BN(unbondingPoint));
    }

    setUnlockingAmount(value);
  }, [myPool, api]);

  return (
    <>
      <Paper elevation={4} sx={{ borderRadius: '10px', fontSize: 12, height: 95, margin: '25px 30px 10px', p: 2, width: '90%' }}>
        <Grid container>
          <Grid item sx={{ flexGrow: 1 }}>
            <Grid alignItems='center' container item justifyContent='space-between' sx={{ pb: '20px', textAlign: 'center' }}>
              <Grid item xs={4}>
                <Balance0 amount={availableBalanceInHuman} coin={token} label={t('Available')} />
              </Grid>
              <Grid item xs={4}>
                <ShowBalance2 api={api} balance={myPool?.member?.points} direction='column' title={t('Staked')} />
              </Grid>
            </Grid>
            <Grid container item justifyContent='space-between' sx={{ textAlign: 'center' }}>
              <Grid item xs={4}>
                <ShowBalance2 api={api} balance={myPool?.myClaimable} direction='column' title={t('Claimable')} />
              </Grid>

              <Grid container item justifyContent='center' xs={4}>
                <Grid container item justifyContent='center' xs={12}>
                  <Balance0
                    amount={amountToHuman(String('0'), decimals)}
                    coin={token}
                    label={
                      <Grid container item justifyContent='center'>
                        <Grid item>
                          {t('Redeemable')}
                        </Grid>
                        {/* <Grid item>
                          <Hint id='redeem' place='top' tip={t('Withdraw unbounded')}>
                            <RedeemIcon color={redeemable ? 'warning' : 'disabled'} onClick={handleWithdrowUnbound} sx={{ cursor: 'pointer', fontSize: 15 }} />
                          </Hint>
                        </Grid> */}
                      </Grid>
                    }
                  />
                </Grid>
              </Grid>

              <Grid item xs={4}>
                <ShowBalance2 api={api} balance={unlockingAmount} direction='column' title={t('Unstaking')} />

                {/* <Balance amount={amountToHuman(String('0'), decimals)} coin={token} label={t('Unstaking')} /> */}
              </Grid>
            </Grid>
          </Grid>
          {/* <Grid alignItems='center' direction='column' item>
            <Hint id='advancedMenu' place='top' tip={t('Advanced')}>
              <MoreVertIcon onClick={handleAdvanceMenuClick} sx={{ cursor: 'pointer', fontSize: 15 }} />
            </Hint>
          </Grid> */}
        </Grid>
      </Paper>
      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={open}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleClose} sx={{ fontSize: 12 }}>Set payee</MenuItem>
        <MenuItem onClick={handleClose} sx={{ fontSize: 12 }}>Set controller</MenuItem>
      </Menu></>
  );
}
