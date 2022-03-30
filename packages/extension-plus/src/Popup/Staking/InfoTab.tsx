// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component shows some general staking informathion including minNominatorBond, maxNominatorRewardedPerValidator, etc.  */
import { Box, Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress, ShowBalance, ShowValue } from '../../components';
import { ChainInfo, StakingConsts } from '../../util/plusTypes';
import { amountToHuman } from '../../util/plusUtils';

interface Props {
  chainInfo: ChainInfo | undefined;
  stakingConsts: StakingConsts | null;
  minNominated: bigint | undefined;
  currentEraIndex: number | undefined;
}

function InfoTab({ chainInfo, currentEraIndex, minNominated, stakingConsts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container data-testid='info' sx={{ paddingTop: '15px', textAlign: 'center' }}>
      <Grid sx={{ color: grey[600], fontSize: 15, fontWeight: '600' }} xs={12}>
        {t('Welcome to Staking')}
      </Grid>
      <Grid sx={{ fontSize: 11, pt: '5px', pb: 2 }} xs={12}>
        {t('Information you need to know about')}
        <Divider light />
      </Grid>

      <Grid container item sx={{ px: '5px' }} xs={12}>

        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Maximum validators you can select: ')}
          </Grid>
          <Grid item>
            <ShowValue value={stakingConsts?.maxNominations} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Minimum {{symbol}}s to be a staker (threshold): ', { replace: { symbol: chainInfo?.coin } })}
          </Grid>
          <Grid item>
            <ShowBalance balance={stakingConsts?.minNominatorBond} chainInfo={chainInfo} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Minimum {{symbol}}s to recieve rewards today (era: {{eraIndex}})', { replace: { symbol: chainInfo?.coin, eraIndex: currentEraIndex } })}:
          </Grid>
          <Grid item>
            <ShowBalance balance={minNominated} chainInfo={chainInfo} decimalDigits={4} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Maximum nominators of a validator, who may receive rewards: ')}
          </Grid>
          <Grid item>
            <ShowValue value={stakingConsts?.maxNominatorRewardedPerValidator} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Days it takes to receive your funds back after unstaking:  ')}
          </Grid>
          <Grid item>
            <ShowValue unit={t('days')} value={stakingConsts?.bondingDuration} />
          </Grid>
        </Grid>

        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Minimum {{symbol}}s that must remain in your account (existential deposit): ', { replace: { symbol: chainInfo?.coin } })}
          </Grid>
          <Grid item>
            <ShowBalance balance={stakingConsts?.existentialDeposit} chainInfo={chainInfo} />
            {/* <span>{`s ${t('plus some fees')}`}</span> */}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default React.memo(InfoTab);
