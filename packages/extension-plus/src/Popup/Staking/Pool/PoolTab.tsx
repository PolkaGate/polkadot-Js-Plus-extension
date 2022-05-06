// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *
 * */

import type { Balance } from '@polkadot/types/interfaces';
import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';
import type { AccountsBalanceType, PoolInfo } from '../../../util/plusTypes';

import { Add as AddIcon, AddCircleOutline as AddCircleOutlineIcon } from '@mui/icons-material';
import { Box, Button, Divider, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

import { Chain } from '../../../../../extension-chains/src/types';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress, ShowAddress } from '../../../components';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  poolsInfo: PoolInfo[] | undefined;
  staker: AccountsBalanceType;
  myPool: PalletNominationPoolsPoolMember | undefined;
}

export default function PoolTab({ api, chain, myPool, poolsInfo, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [points, setPoints] = useState<Balance | undefined>();

  useEffect(() => {
    if (!(api && poolsInfo && myPool)) return;

    const poolPoints = (poolsInfo[myPool.poolId.subn(1)]?.bondedPools?.points ?? 0) as number;

    console.log('myPool:', myPool)
    console.log('poolPoints:', poolPoints)

    setPoints(api.createType('Balance', poolPoints));
  }, [api, myPool, poolsInfo]);

  return (
    <Grid container sx={{ px: '25px' }}>
      {poolsInfo && api
        ? myPool
          ? <>
            <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 0px 5px 10px', width: '100%' }}>
              <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
                <Grid item sx={{ textAlign: 'left' }} xs={1}>
                  {t('Index')}
                </Grid>
                <Grid item sx={{ textAlign: 'left' }} xs={4}>
                  {t('Name')}
                </Grid>
                <Grid item sx={{ textAlign: 'left' }} xs={1}>
                  {t('state')}
                </Grid>
                <Grid item sx={{ textAlign: 'center' }} xs={3}>
                  {t('Balance')}
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
              <Paper elevation={2} sx={{ backgroundColor: grey[100], mt: '4px', p: '1px 15px 2px 15px', width: '100%' }}>
                <Grid alignItems='center' container sx={{ fontSize: 12 }}>
                  <Grid item sx={{ textAlign: 'left' }} xs={1}>
                    {myPool.poolId.toNumber()}
                  </Grid>
                  <Grid item sx={{ textAlign: 'left' }} xs={4}>
                    {myPool.metadata ?? t('no name')}
                  </Grid>
                  <Grid item sx={{ textAlign: 'left' }} xs={1}>
                    {myPool.bondedPools.state}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={3}>
                    {points?.toHuman()}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={2}>
                    {myPool.bondedPools.memberCounter}
                  </Grid>
                  <Grid item sx={{ textAlign: 'center' }} xs={1}>
                    <AddIcon color='warning' fontSize='small' sx={{ cursor: 'pointer' }} />
                  </Grid>
                </Grid>
              </Paper>
            }

            <Grid item sx={{ pt: 1 }} xs={12}>
              <Paper elevation={3}>
                <Grid container item justifyContent='flex-start' sx={{ fontSize: 12, p: '10px', textAlign: 'center' }}>
                  <Grid item xs={12}>
                    <ShowAddress address={myPool.bondedPools.roles.root} chain={chain} role={'Root'} />
                  </Grid>
                  <Grid item  xs={12}>
                    <ShowAddress address={myPool.bondedPools.roles.depositor} chain={chain} role={'Depositor'} />
                  </Grid>
                  <Grid item  xs={12}>
                    <ShowAddress address={myPool.bondedPools.roles.nominator} chain={chain} role={'Nominator'} />
                  </Grid>
                  <Grid item  xs={12}>
                    <ShowAddress address={myPool.bondedPools.roles.stateToggler} chain={chain} role={'State Toggler'} />
                  </Grid>

                  <Grid item sx={{ p: '0px 0px 10px' }} xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={4}>
                    {t('Balance')}{': '}{myPool.rewardPools.balance}
                  </Grid>
                  <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={4}>
                    {t('Points')}{': '}{myPool.rewardPools.points}
                  </Grid>
                  <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={4}>
                    {t('Total earnings')}{': '}{myPool.rewardPools.totalEarnings}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid container item justifyContent='space-between' sx={{ pt: '5px' }} xs={12}>
              {/* <Grid item sx={{ fontSize: 13, textAlign: 'left' }}>
                <FormControlLabel
                  control={<Checkbox
                    color='default'
                    defaultChecked
                    // onChange={filterOverSubscribeds}
                    size='small'
                  />
                  }
                  label={<Box fontSize={12} sx={{ whiteSpace: 'nowrap' }}>{t('Show only my pools')}</Box>}
                />
              </Grid> */}

              <Grid item>
                <Button
                  // onClick={handleStopNominating}
                  color='warning'
                  size='medium'
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ textTransform: 'none' }}
                  variant='text'
                >
                  {t('Set/Change nominees')}
                </Button>
              </Grid>
            </Grid>
          </>
          : <Grid item sx={{ textAlign: 'center', fontSize: 12, pt: 7 }} xs={12}>
            {t('No active pool found')}
          </Grid>
        : <Progress title={t('Loading pool ....')} />
      }
    </Grid>

  );
}
