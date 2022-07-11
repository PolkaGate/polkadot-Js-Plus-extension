/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component renders make/remove recoverable tab in social recovery
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
import { grey } from '@mui/material/colors';

interface Props {
  handleAddFriend: () => void
  friends: DeriveAccountInfo[];
  chain: Chain | null;
  handleDeleteFriend: (index: number) => void;
  recoveryThreshold: number;
  handleRecoveryDelay: (event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => void;
  recoveryDelay: number;
  handleRecoveryThreshold: (event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleNext: () => void;
  recoveryInfo: PalletRecoveryRecoveryConfig | undefined | null;
}

function MakeRecoverableTab({ chain, friends, handleAddFriend, handleDeleteFriend, handleNext, handleRecoveryDelay, handleRecoveryThreshold, recoveryDelay, recoveryInfo, recoveryThreshold }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Grid alignItems='center' container item justifyContent='space-between' sx={{ py: '15px' }} xs={12}>
        <Grid item py='7px'>
          <Typography sx={{ color: 'text.primary' }} variant='body2'>
            {t('Your recovery friends')} {!!friends?.length && `(${friends?.length})`}:
          </Typography>
        </Grid>
        <Grid item>
          {!recoveryInfo &&
            <Hint id='addFriend' place='left' tip={t('add a friend')}>
              <IconButton aria-label='addFriend' color='warning' onClick={handleAddFriend} size='small'>
                <AddCircleRoundedIcon sx={{ fontSize: 25 }} />
              </IconButton>
            </Hint>
          }
        </Grid>
      </Grid>
      <Grid alignItems='center' container item justifyContent='center' sx={{ bgcolor: 'white', border: '1px solid', borderColor: grey[600], borderRadius: 5, fontSize: 12, height: '190px', overflowY: 'auto' }} xs={12}>
        {friends?.length
          ? friends?.map((f, index) => (
            <Grid alignItems='flex-start' container item justifyContent='space-between' key={index} sx={{ pl: 1 }} xs={12}>
              <Grid item xs={11}>
                <Identity accountInfo={f} chain={chain} showAddress />
              </Grid>
              {!recoveryInfo &&
                <Grid item xs={1}>
                  <Hint id='deleteFriend' place='left' tip={t('add a friend')}>
                    <IconButton aria-label='deleteFriend' color='error' onClick={() => handleDeleteFriend(index)} size='small'>
                      <ClearIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Hint>
                </Grid>
              }
            </Grid>
          ))
          : <Grid alignItems='center' container justifyContent='center' sx={{ px: 3 }} xs={12}>
            <Grid item>
              <Typography sx={{ color: 'text.secondary' }} variant='caption'>
                {t('No friends are added yet!')}
              </Typography>
            </Grid>
          </Grid>
        }
      </Grid>
      <Grid container item justifyContent='space-between' spacing={1.5} sx={{ pt: '30px' }} xs={12}>
        <Grid item xs={6}>
          <TextField
            InputLabelProps={{ shrink: true }}
            InputProps={{ endAdornment: (<InputAdornment position='end'>{t('friend(s)')}</InputAdornment>) }}
            color='warning'
            disabled={!!recoveryInfo}
            error={!recoveryThreshold || recoveryThreshold > friends?.length}
            fullWidth
            helperText={
              <Hint icon id='recoveryThreshold' tip='The threshold of vouches that is to be reached to recover the account'>
                {t('Vouches requiered for recovery')}
              </Hint>
            }
            inputProps={{ step: '1' }}
            label={t('Recovery threshold')}
            name='recoveryThreshold'
            onChange={handleRecoveryThreshold}
            placeholder='0'
            type='number'
            value={recoveryThreshold}
            variant='outlined'
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            InputLabelProps={{ shrink: true }}
            InputProps={{ endAdornment: (<InputAdornment position='end'>{t('day(s)')}</InputAdornment>) }}
            color='warning'
            disabled={!!recoveryInfo}
            fullWidth
            helperText={
              <Hint icon id='recoveryDelay' tip='The delay between vouching and the availability of the recovered account'>
                {t('The delay after vouching ')}
              </Hint>
            }
            inputProps={{ step: '1' }}
            label={t('Recovery delay')}
            name='recoveryDelay'
            onChange={handleRecoveryDelay}
            placeholder='0'
            type='number'
            value={recoveryDelay}
            variant='outlined'
          />
        </Grid>
      </Grid>
      <Grid item sx={{ pt: '10px' }} xs={12}>
        <NextStepButton
          data-button-action='next'
          isDisabled={!recoveryThreshold || !friends?.length || recoveryThreshold > friends?.length}
          onClick={handleNext}
        >
          {recoveryInfo ? t('Next to remove recovery') : t('Next')}
        </NextStepButton>
      </Grid>
    </>
  );
}

export default React.memo(MakeRecoverableTab);
