/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component renders make recoverable tab in social recovery
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { AddCircleRounded as AddCircleRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';
import { Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import React from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Hint, Identity } from '../../components';

import { NextStepButton } from '@polkadot/extension-ui/components';
import { Chain } from '@polkadot/extension-chains/types';

interface Props {
  handleAddFreind: () => void
  friends: DeriveAccountInfo[];
  chain: Chain | null;
  handleDeleteFreind: (index: number) => void;
  recoveryThreshold: number;
  handleRecoveryDelay: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  recoveryDelay: number;
  handleRecoveryThreshold: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  handleNext: () => void;
  recoverable: PalletRecoveryRecoveryConfig;
  account: DeriveAccountInfo | undefined
}

function RemoveRecoveryTab({ account, chain, friends, handleAddFreind, handleDeleteFreind, handleNext, handleRecoveryDelay, handleRecoveryThreshold, recoverable, recoveryDelay, recoveryThreshold }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  console.log('recoverable', recoverable)
  console.log('recoverable?.friends', recoverable?.friends)

  return (
    <>
      <Grid container item sx={{ pt: '15px' }} xs={12}>
        <Grid item>
          <Typography sx={{ color: 'text.primary', p: '20px 0px 10px' }} variant='caption'>
            {t('Recoverable account:')}
          </Typography>
        </Grid>
        <Grid container item sx={{ fontFamily: 'sans-serif', fontSize: 11, fontWeight: 'bold', pl: 6 }} xs={12}>
          <Identity accountInfo={account} chain={chain} showAddress />
        </Grid>
      </Grid>

      <Grid item xs={12} sx={{ pt: 3 }}>
        <Typography sx={{ color: 'text.primary', p: '20px 0px 10px' }} variant='caption'>
          {t('Friends:')}
        </Typography>
      </Grid>
      <Grid container item sx={{ fontSize: 12, height: '150px', overflowY: 'auto', bgcolor: 'white' }} xs={12}>
        {recoverable?.friends?.length &&
          recoverable?.friends?.map((friend, index) => (
            <Grid alignItems='flex-start' container item justifyContent='space-between' key={index} sx={{ pl: 1 }} xs={12}>
              <Grid item xs={12}>
                {friend.toString()}
              </Grid>
            </Grid>
          ))}
      </Grid>

      <Grid container item justifyContent='space-between' spacing={1.5} sx={{ pt: '20px' }} xs={12}>
        <Grid item xs={5}>
          <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
            <Grid item>
              {t('Recovery threshold')}:
            </Grid>
            <Grid item>
              {recoverable.threshold.toNumber()}
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={5}>
          <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
            <Grid item>
              {t('Recovery delay')}:
            </Grid>
            <Grid item>
              {recoverable.delayPeriod.toNumber()}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      <Grid item sx={{ pt: '10px' }} xs={12}>
        <NextStepButton
          data-button-action='next'
          // isDisabled={!recoveryThreshold || !friends?.length || recoveryThreshold > friends?.length}
          onClick={handleNext}
        >
          {t('Cancel')}
        </NextStepButton>
      </Grid>
    </>
  );
}

export default React.memo(RemoveRecoveryTab);
