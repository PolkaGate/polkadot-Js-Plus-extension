// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component shows some general staking informathion including minNominatorBond, maxNominatorRewardedPerValidator, etc.
 * */

import type { PoolStakingConsts } from '../../../util/plusTypes';

import { Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import { ApiPromise } from '@polkadot/api';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { ShowBalance2, ShowValue } from '../../../components';

interface Props {
  api: ApiPromise | undefined;
  info: PoolStakingConsts | undefined;
}

function InfoTab({ api, info }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const token = api && api.registry.chainTokens[0];

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

        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
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

        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
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
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
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

export default React.memo(InfoTab);
