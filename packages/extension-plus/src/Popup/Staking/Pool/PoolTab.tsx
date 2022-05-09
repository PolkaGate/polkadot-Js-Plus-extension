// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description This component shows my selected pool's information
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Balance } from '@polkadot/types/interfaces';
import type { Chain } from '../../../../../extension-chains/src/types';
import type { AccountsBalanceType, MyPoolInfo, PoolInfo } from '../../../util/plusTypes';

import { StopRounded as StopRoundedIcon } from '@mui/icons-material';
import { Divider, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useEffect, useState } from 'react';

import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';
import { hexToBn } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress, ShowAddress } from '../../../components';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  staker: AccountsBalanceType;
  myPool: MyPoolInfo | undefined | null;
}

function PoolTab({ api, chain, myPool, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [points, setPoints] = useState<string | undefined>();

  const balance = myPool?.rewardPool && api ? api.createType('Balance', myPool.rewardPool.balance) : undefined;
  const totalEarnings = myPool?.rewardPool && api ? api.createType('Balance', myPool.rewardPool.totalEarnings) : undefined;
  const staked = myPool?.ledger && api ? api.createType('Balance', myPool.ledger.active) : undefined;
  const rewardClaimable = myPool?.rewardClaimable && api ? api.createType('Balance', myPool.rewardClaimable) : undefined;

  useEffect(() => {
    if (!(api && myPool)) return;

    let poolPoints = myPool.rewardPool.points ?? 0;

    if (poolPoints) {
      const temp = api.createType('Balance', poolPoints).toHuman();
      const token = api.registry.chainTokens[0];

      poolPoints = temp.replace(token, '');
    }

    setPoints(poolPoints);
  }, [api, myPool]);

  return (
    <Grid container sx={{ px: '25px' }}>
      {api && myPool !== undefined
        ? myPool
          ? <>
            <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 0px 5px 10px', width: '100%' }}>
              <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
                <Grid item sx={{ textAlign: 'center' }} xs={1}>
                  {t('Index')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={4}>
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
                  {t('Action')}
                </Grid>
              </Grid>
            </Paper>

            {myPool &&
              <Paper elevation={2} sx={{ backgroundColor: grey[100], mt: '4px', p: '1px 0px 2px 10px', width: '100%' }}>
                <Grid alignItems='center' container sx={{ fontSize: 12 }}>
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    {myPool.member.poolId}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={4}>
                    {myPool.metadata ?? t('no name')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    {myPool.bondedPool.state}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={3}>
                    {staked?.toHuman() ?? 0}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={2}>
                    {myPool.bondedPool.memberCounter}
                  </Grid>
                  <Grid item justifyContent='center' sx={{ textAlign: 'center' }} xs={1}>
                    <StopRoundedIcon color='warning' fontSize='small' sx={{ cursor: 'pointer' }} />
                  </Grid>
                </Grid>
              </Paper>
            }

            <Grid item sx={{ pt: 1 }} xs={12}>
              <Paper elevation={3}>
                <Grid container item justifyContent='flex-start' sx={{ fontSize: 11, p: '10px', textAlign: 'center' }}>
                  <Grid item xs={12}>
                    <ShowAddress address={myPool.bondedPool.roles.root} chain={chain} role={'Root'} />
                  </Grid>
                  <Grid item xs={12}>
                    <ShowAddress address={myPool.bondedPool.roles.depositor} chain={chain} role={'Depositor'} />
                  </Grid>
                  <Grid item xs={12}>
                    <ShowAddress address={myPool.bondedPool.roles.nominator} chain={chain} role={'Nominator'} />
                  </Grid>
                  <Grid item xs={12}>
                    <ShowAddress address={myPool.bondedPool.roles.stateToggler} chain={chain} role={'State toggler'} />
                  </Grid>
                  <Grid item xs={12}>
                    <ShowAddress address={myPool.accounts.stashId} chain={chain} role={'Stash id'} />
                  </Grid>
                  <Grid item xs={12}>
                    <ShowAddress address={myPool.accounts.rewardId} chain={chain} role={'Reward id'} />
                  </Grid>

                  <Grid item sx={{ p: '0px 0px 10px' }} xs={12}>
                    <Divider />
                  </Grid>

                  <Grid container item justifyContent='space-between' sx={{ pb: 1 }} xs={12}>
                    <Grid item>
                      {t('Claimable')}{': '}{rewardClaimable?.toHuman() ?? 0}
                    </Grid>

                    <Grid item>
                      {t('Total earnings')}{': '}{totalEarnings?.toHuman() ?? 0}
                    </Grid>
                  </Grid>

                </Grid>
              </Paper>
            </Grid>
          </>
          : <Grid item sx={{ fontSize: 12, textAlign: 'center', pt: 7 }} xs={12}>
            {t('No active pool found')}
          </Grid>
        : <Progress title={t('Loading ...')} />
      }
    </Grid>

  );
}

export default React.memo(PoolTab);