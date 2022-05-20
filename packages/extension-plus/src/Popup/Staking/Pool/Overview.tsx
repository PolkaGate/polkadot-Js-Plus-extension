// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */
/* eslint-disable react/jsx-first-prop-new-line */

/**
 * @description
 *  render an overview of current staking state of an account like currently staked/redemmable amount,
 *  claimable reward, etc.
 * */

import type { MyPoolInfo } from '../../../util/plusTypes';

import { Redeem as RedeemIcon, SystemUpdateAltOutlined as SystemUpdateAltOutlinedIcon } from '@mui/icons-material';
import { Grid, Menu, MenuItem, Paper, Skeleton } from '@mui/material';
import React, { useEffect, useState, useMemo } from 'react';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Hint, ShowBalance2 } from '../../../components';

interface Props {
  availableBalanceInHuman: string,
  api: ApiPromise | undefined;
  handleWithdrawUnbounded: () => void;
  handleWithdrawClaimable: () => void;
  handleViewChart: () => void;
  myPool: MyPoolInfo | undefined | null;

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

export default function Overview({ api, availableBalanceInHuman, handleWithdrawClaimable, myPool, handleViewChart, handleWithdrawUnbounded }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [unlockingAmount, setUnlockingAmount] = useState<BN | undefined>();

  const decimals = api && api.registry.chainDecimals[0];
  const token = api?.registry?.chainTokens[0] ?? '';

  const staked = !myPool?.member?.points ? BN_ZERO : new BN(myPool.member.points);
  const claimable = !myPool?.myClaimable ? BN_ZERO : new BN(myPool.myClaimable);
  const redeemable = useMemo(() => !myPool?.redeemable ? BN_ZERO : new BN(myPool.redeemable), [myPool]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAdvanceMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (myPool === undefined || !api) { return; }

    let unlockingValue = BN_ZERO;

    if (myPool === null) { return setUnlockingAmount(unlockingValue); }

    for (const [era, unbondingPoint] of Object.entries(myPool.member?.unbondingEras)) {
      unlockingValue = unlockingValue.add(new BN(unbondingPoint as string));
    }

    setUnlockingAmount(redeemable ? unlockingValue.sub(redeemable) : unlockingValue);
  }, [myPool, api, redeemable]);

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
                <ShowBalance2 api={api} balance={staked} direction='column' title={t('Staked')} />
              </Grid>
            </Grid>
            <Grid container item justifyContent='space-between' sx={{ textAlign: 'center' }}>
              <Grid item xs={4}>
                <ShowBalance2 api={api} balance={claimable} direction='column'
                  title={
                    <Grid container item justifyContent='center'>
                      <Grid item>
                        {t('Claimable')}
                      </Grid>
                      <Grid item>
                        <Hint id='claim' place='top' tip={t('Claim reward')}>
                          <SystemUpdateAltOutlinedIcon color={claimable.gtn(0) ? 'warning' : 'disabled'} onClick={handleWithdrawClaimable} sx={{ cursor: 'pointer', fontSize: 15 }} />
                        </Hint>
                      </Grid>
                    </Grid>
                  }
                />
              </Grid>

              <Grid container item justifyContent='center' xs={4}>
                <ShowBalance2 api={api} balance={redeemable} direction='column'
                  title={
                    <Grid container item justifyContent='center'>
                      <Grid item>
                        {t('Redeemable')}
                      </Grid>
                      <Grid item>
                        <Hint id='redeem' place='top' tip={t('Withdraw unbounded')}>
                          <RedeemIcon color={redeemable.gtn(0) ? 'warning' : 'disabled'} onClick={handleWithdrawUnbounded} sx={{ cursor: 'pointer', fontSize: 15 }} />
                        </Hint>
                      </Grid>
                    </Grid>
                  }
                />
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
