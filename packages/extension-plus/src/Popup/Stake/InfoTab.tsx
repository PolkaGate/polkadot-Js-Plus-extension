// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component shows some general staking informathion including minNominatorBond, maxNominatorRewardedPerValidator, etc.  */
import { Box, Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import { ChainInfo, StakingConsts } from '../../util/plusTypes';
import { amountToHuman } from '../../util/plusUtils';

interface Props {
  chainInfo: ChainInfo;
  stakingConsts: StakingConsts | null;
}

function InfoTab({ chainInfo, stakingConsts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Grid container data-testid='info' sx={{ paddingTop: '20px', textAlign: 'center' }}>
      <Grid sx={{ color: grey[600], fontSize: 15, fontWeight: '600' }} xs={12}>
        {t('Welcome to Staking')}
      </Grid>
      <Grid sx={{ fontSize: 11 }} xs={12}>
        {t('Information you need to know about')}
      </Grid>
      <Grid sx={{ p: '5px 70px 40px' }} xs={12}>
        <Divider light />
      </Grid>
      {stakingConsts && chainInfo
        ? <>
          <Grid sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
            {t('Maximum validators you can select: ')}<Box component='span' sx={{ fontWeight: 'bold' }}>  {stakingConsts?.maxNominations}</Box>
          </Grid>
          <Grid sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
            {t('Minimum')} {chainInfo.coin}s {t('to be a staker: ')} <Box component='span' sx={{ fontWeight: 'bold' }}> {stakingConsts?.minNominatorBond}</Box> {chainInfo.coin}s
          </Grid>
          <Grid sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
            {t('Maximum stakers of a validator, who receives rewards: ')} <Box component='span' sx={{ fontWeight: 'bold' }}> {stakingConsts?.maxNominatorRewardedPerValidator}</Box>
          </Grid>
          <Grid sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
            {t('Days it takes to receive your funds back after unstaking:  ')}<Box component='span' sx={{ fontWeight: 'bold' }}>  {stakingConsts?.bondingDuration}</Box>  {t('days')}
          </Grid>
          <Grid sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
            {t('Minimum')} {chainInfo.coin}s {t('that must remain in you account: ')}
            <Box component='span' sx={{ fontWeight: 'bold' }}>
              {amountToHuman(stakingConsts.existentialDeposit.toString(), chainInfo.decimals, 6)}
            </Box>
            {' '}{chainInfo.coin}s {t('plus some fees')}
          </Grid>
        </>
        : <Progress title={'Loading information ...'} />
      }
    </Grid>
  );
}

export default React.memo(InfoTab);
