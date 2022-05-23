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
import { Grid, Menu, MenuItem, Paper } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Hint, ShowBalance2 } from '../../../components';

interface Props {
  availableBalance: BN,
  api: ApiPromise | undefined;
  handleWithdrawUnbounded: () => void;
  handleWithdrawClaimable: () => void;
  handleViewChart: () => void;
  myPool: MyPoolInfo | undefined | null;
  redeemable: BN | undefined;
  unlockingAmount: BN | undefined;
}

export default function Overview({ api, availableBalance, handleViewChart, handleWithdrawClaimable, handleWithdrawUnbounded, myPool, redeemable, unlockingAmount }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const staked = myPool === undefined ? undefined : new BN(myPool?.member?.points ?? 0);
  const claimable = myPool === undefined ? undefined : new BN(myPool?.myClaimable ?? 0);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAdvanceMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Paper elevation={4} sx={{ borderRadius: '10px', fontSize: 12, height: 95, margin: '25px 30px 10px', p: 2, width: '90%' }}>
        <Grid container>
          <Grid item sx={{ flexGrow: 1 }}>
            <Grid alignItems='center' container item justifyContent='space-between' sx={{ pb: '20px', textAlign: 'center' }}>
              <Grid item xs={4}>
                <ShowBalance2 api={api} balance={availableBalance} direction='column' title={t('Available')} />
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
                        {t('Rewards')}
                      </Grid>
                      <Grid item>
                        <Hint id='claim' place='top' tip={t('Claim rewards')}>
                          <SystemUpdateAltOutlinedIcon color={claimable?.gtn(0) ? 'warning' : 'disabled'} onClick={handleWithdrawClaimable} sx={{ cursor: 'pointer', fontSize: 15 }} />
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
                          <RedeemIcon color={redeemable?.gtn(0) ? 'warning' : 'disabled'} onClick={handleWithdrawUnbounded} sx={{ cursor: 'pointer', fontSize: 15 }} />
                        </Hint>
                      </Grid>
                    </Grid>
                  }
                />
              </Grid>

              <Grid item xs={4}>
                <ShowBalance2 api={api} balance={unlockingAmount} direction='column' title={t('Unstaking')} />
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
      </Menu>
    </>
  );
}
