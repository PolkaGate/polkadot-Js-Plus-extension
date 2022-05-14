// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description showing a pool general info in a row
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Balance } from '@polkadot/types/interfaces';
import type { FrameSystemAccountInfo, PalletNominationPoolsBondedPoolInner, PalletNominationPoolsPoolMember, PalletNominationPoolsRewardPool, PalletStakingNominations } from '@polkadot/types/lookup';
import type { Chain } from '../../../../../extension-chains/src/types';
import type { MembersMapEntry, AccountsBalanceType, MyPoolInfo } from '../../../util/plusTypes';

import { AddCircleOutline as AddCircleOutlineIcon, MoreVert as MoreVertIcon, StopRounded as StopRoundedIcon, BlockRounded as BlockRoundedIcon } from '@mui/icons-material';
import { Box, Button, Checkbox, FormControlLabel, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useState, useEffect } from 'react';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../../components';
import PoolInfo from './PoolInfo';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  pool: MyPoolInfo | undefined;
  poolsMembers: MembersMapEntry[][] | undefined

}

export default function Pool({ api, chain, pool, poolsMembers }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showPoolInfo, setShowPoolInfo] = useState(false);
  const [staked, setStaked] = useState<Balance | undefined>();

  // const rewardClaimable = pool?.rewardClaimable && api ? api.createType('Balance', pool.rewardClaimable) : undefined;
  // const balance = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.balance) : undefined;
  // const totalEarnings = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.totalEarnings) : undefined;

  const poolId = pool?.poolId ?? pool?.member?.poolId;

  const handleMorePoolInfoOpen = useCallback(() => {
    setShowPoolInfo(true);
  }, []);

  const handleMorePoolInfoClose = useCallback((i) => {
    setShowPoolInfo(false);
  }, []);

  useEffect(() => {
    if (!(api && pool)) return;

    const mayPoolBalance = pool?.ledger?.active ?? pool?.bondedPool?.points
    const staked = mayPoolBalance ? api.createType('Balance', mayPoolBalance) : undefined;

    setStaked(staked);
  }, [api, pool]);

  return (
    <Grid container sx={{ p: 0 }}>
      {pool !== undefined && api
        ? pool
          ? <>
            <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 0px 5px 5px', width: '100%' }}>
              <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {t('More')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {t('Index')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={3}>
                  {t('Name')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {t('State')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={3}>
                  {t('Staked')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={2}>
                  {t('Members')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {t('Actions')}
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={2} sx={{ backgroundColor: grey[100], mt: '4px', p: '1px 0px 2px 5px', width: '100%' }}>
              <Grid alignItems='center' container sx={{ fontSize: 12 }}>

                <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={1}>
                  <MoreVertIcon fontSize='small' onClick={handleMorePoolInfoOpen} sx={{ cursor: 'pointer' }} />
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {String(poolId)}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={3}>
                  {pool.metadata ?? t('no name')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {pool.bondedPool.state}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={3}>
                  {staked?.toHuman() ?? 0}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={2}>
                  {pool.bondedPool.memberCounter}
                </Grid>
                <Grid alignItems='center' container direction='row' item justifyContent='space-around' sx={{ textAlign: 'center' }} xs={1}>
                  <Grid item>
                    <StopRoundedIcon color='secondary' fontSize='small' sx={{ cursor: 'pointer' }} />
                  </Grid>
                  <Grid item>
                    <BlockRoundedIcon color='warning' sx={{ cursor: 'pointer', fontSize: 13, pb: '0.8px' }} />
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </>
          : <Grid item sx={{ fontSize: 12, pt: 7, textAlign: 'center' }} xs={12}>
            {t('No active pool found')}
          </Grid>
        : <Progress title={t('Loading pool ....')} />
      }
      {showPoolInfo &&
        <PoolInfo
          api={api}
          chain={chain}
          handleMorePoolInfoClose={handleMorePoolInfoClose}
          pool={pool}
          poolsMembers={poolsMembers}
          setShowPoolInfo={setShowPoolInfo}
          showPoolInfo={showPoolInfo}
        />
      }
    </Grid>
  );
}
