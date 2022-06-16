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
import type { Chain } from '../../../../../extension-chains/src/types';
import type { MembersMapEntry, MyPoolInfo, PoolInfo } from '../../../util/plusTypes';

import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Grid, Paper, Switch } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';

import { BN } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../../components';
import PoolMoreInfo from './PoolInfo';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  pool: MyPoolInfo | undefined;
  poolsMembers?: MembersMapEntry[] | undefined;
  showCheck?: boolean;
  showHeader?: boolean;
  selectedPool?: PoolInfo;
  setSelectedPool?: React.Dispatch<React.SetStateAction<PoolInfo | undefined>>
}

export default function Pool({ api, chain, pool, poolsMembers, selectedPool, setSelectedPool, showCheck = false, showHeader = true }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showPoolInfo, setShowPoolInfo] = useState(false);
  const [staked, setStaked] = useState<Balance | undefined>();

  const poolId = pool?.poolId || pool?.member?.poolId as BN;

  // const rewardClaimable = pool?.rewardClaimable && api ? api.createType('Balance', pool.rewardClaimable) : undefined;
  // const balance = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.balance) : undefined;
  // const totalEarnings = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.totalEarnings) : undefined;
  // const balance = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.balance) : undefined;
  // const totalEarnings = pool?.rewardPool && api ? api.createType('Balance', pool.rewardPool.totalEarnings) : undefined;
  // const staked = pool?.ledger && api ? api.createType('Balance', pool.ledger.active) : undefined;
  // const rewardClaimable = pool?.rewardClaimable && api ? api.createType('Balance', pool.rewardClaimable) : undefined;

  useEffect(() => {
    if (!(api && pool)) { return; }

    const mayPoolBalance = pool?.ledger?.active ?? pool?.bondedPool?.points
    const staked = mayPoolBalance ? api.createType('Balance', mayPoolBalance) : undefined;

    setStaked(staked);
  }, [api, pool, pool?.bondedPool?.points]);

  const handleMorePoolInfoOpen = useCallback(() => {
    setShowPoolInfo(true);
  }, []);

  const handleMorePoolInfoClose = useCallback(() => {
    setShowPoolInfo(false);
  }, []);

  return (
    <Grid container sx={{ p: 0 }}>
      {pool !== undefined && api
        ? pool
          ? <>
            {showHeader &&
              <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 0px 5px 5px', width: '100%' }}>
                <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
                  {pool?.bondedPool && String(pool.bondedPool.state) !== 'Creating' &&
                    <Grid item sx={{ textAlign: 'center' }} xs={1}>
                      {t('More')}
                    </Grid>
                  }
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    {t('Index')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={4}>
                    {t('Name')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    {t('State')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={String(pool?.bondedPool?.state) !== 'Creating' ? 3 : 4}>
                    {t('Staked')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={2}>
                    {t('Members')}
                  </Grid>
                </Grid>
              </Paper>
            }
            <Paper elevation={2} sx={{ backgroundColor: grey[100], mt: '4px', p: '1px 0px 2px 5px', width: '100%' }}>
              <Grid alignItems='center' container sx={{ fontSize: 11 }}>
                {pool?.bondedPool && String(pool.bondedPool.state) !== 'Creating' &&
                  <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={1}>
                    <MoreVertIcon fontSize='small' onClick={handleMorePoolInfoOpen} sx={{ cursor: 'pointer' }} />
                  </Grid>
                }
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {String(poolId)}
                </Grid>
                <Grid item sx={{ overflow: 'hidden', textAlign: 'center', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} xs={4}>
                  {pool.metadata ?? t('no name')}
                </Grid>
                {!showCheck &&
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    {pool?.bondedPool?.state}
                  </Grid>
                }
                <Grid item sx={{ textAlign: 'center' }} xs={String(pool?.bondedPool?.state) !== 'Creating' ? 3 : 4}>
                  {staked?.toHuman() ?? 0}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={2}>
                  {pool?.bondedPool?.memberCounter}
                </Grid>
                {showCheck &&
                  <Grid item xs={1}>
                    <Switch checked={selectedPool && selectedPool.poolId.eq(poolId)} color='warning' onChange={() => setSelectedPool(pool)} size='small' />
                  </Grid>
                }
              </Grid>
            </Paper>
          </>
          : <Grid item sx={{ fontSize: 12, pt: 7, textAlign: 'center' }} xs={12}>
            {t('No active pool found')}
          </Grid>
        : <Progress title={t('Loading pool ....')} />
      }
      {
        showPoolInfo && api && pool?.rewardPool &&
        <PoolMoreInfo
          api={api}
          chain={chain}
          handleMorePoolInfoClose={handleMorePoolInfoClose}
          pool={pool}
          poolId={poolId}
          poolsMembers={poolsMembers}
          setShowPoolInfo={setShowPoolInfo}
          showPoolInfo={showPoolInfo}
        />
      }
    </Grid>
  );
}
