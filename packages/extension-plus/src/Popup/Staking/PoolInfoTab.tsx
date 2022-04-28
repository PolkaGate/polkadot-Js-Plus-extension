// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component shows some general staking informathion including minNominatorBond, maxNominatorRewardedPerValidator, etc.
 * */

import { Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useState, useEffect } from 'react';

import { ApiPromise } from '@polkadot/api';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ShowBalance2, ShowValue } from '../../components';
import { StakingConsts } from '../../util/plusTypes';

interface Props {
  api: ApiPromise | undefined;
}

function PoolInfoTab({ api }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [info, setInfo] = useState(undefined);
  const token = api && api.registry.chainTokens[0];

  useEffect(() => {
    // eslint-disable-next-line no-void
    api && Promise.all([
      api.query.nominationPools.maxPoolMembers(),
      api.query.nominationPools.maxPoolMembersPerPool(),
      api.query.nominationPools.maxPools(),
      api.query.nominationPools.minCreateBond(),
      api.query.nominationPools.minJoinBond(),
      api.query.staking.minNominatorBond(),
      api.query.nominationPools.lastPoolId()
    ]).then(([maxPoolMembers, maxPoolMembersPerPool, maxPools, minCreateBond, minJoinBond, minNominatorBond, lastPoolId]) => {
      setInfo({
        lastPoolId: String(lastPoolId as bigint),
        maxPoolMembers: maxPoolMembers.isSome ? maxPoolMembers.unwrap().toNumber() : 0,
        maxPoolMembersPerPool: maxPoolMembersPerPool.isSome ? maxPoolMembersPerPool.unwrap().toNumber() : 0,
        maxPools: maxPools.isSome ? maxPools.unwrap().toNumber() : 0,
        minCreateBond: minCreateBond,
        minJoinBond: minJoinBond,
        minNominatorBond: minNominatorBond
      });
    });
  }, [api]);

  return (
    <Grid container data-testid='info' sx={{ paddingTop: '15px', textAlign: 'center' }}>
      <Grid sx={{ color: grey[600], fontSize: 15, fontWeight: '600' }} xs={12}>
        {t('Welcome to pool Staking')}
      </Grid>
      <Grid sx={{ fontSize: 11, pt: '5px', pb: 2 }} xs={12}>
        {t('Information you need to know about')}
        <Divider light />
      </Grid>

      <Grid container item sx={{ px: '5px' }} xs={12}>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Curent pools count')}:
          </Grid>
          <Grid item>
            <ShowValue value={info?.lastPoolId} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Total pools')}:
          </Grid>
          <Grid item>
            <ShowValue value={info?.maxPoolMembersPerPool} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Maximum pool members')}:
          </Grid>
          <Grid item>
            <ShowValue value={info?.maxPoolMembers} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Maximum pool members per pool')}:
          </Grid>
          <Grid item>
            <ShowValue value={info?.maxPoolMembersPerPool} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Minimum pool creation bond')}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={info?.minCreateBond} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Minimum to join a pool')}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={info?.minJoinBond} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Minimum nominator bond')}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={info?.minNominatorBond} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default React.memo(PoolInfoTab);
