// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 * 
 * */

import type { DeriveOwnContributions } from '@polkadot/api-derive/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, PoolInfo, PoolStakingConsts, SavedMetaData, StakingConsts, Validators } from '../../../util/plusTypes';

import { AddCircleRounded as AddCircleRoundedIcon, GroupWorkOutlined,PersonAddAlt1Rounded as PersonAddAlt1RoundedIcon } from '@mui/icons-material';
import { Grid, InputAdornment, Tab, Tabs, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { ApiPromise } from '@polkadot/api';
import { createWsEndpoints } from '@polkadot/apps-config';
import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountsStore } from '@polkadot/extension-base/stores';
import { Chain } from '@polkadot/extension-chains/types';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';
import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShowAddress } from '../../../components';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;

  className?: string;
  showManualPoolStakingModal: boolean;
  chain: Chain;
  staker: AccountsBalanceType | undefined;
  handleStakeAmount: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  stakeAmountInHuman: string;
  setManualPoolStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  nextPoolId: BN
}

function ManualStaking({ api, chain, nextPoolId, className, handleStakeAmount, setManualPoolStakingModalOpen, showManualPoolStakingModal, stakeAmountInHuman, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('create');
  const [poolName, setPoolName] = useState<string | undefined>();

  const token = api && api.registry.chainTokens[0];

  useEffect(() => {

  }, []);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  const handlePoolStakingModalClose = useCallback(() => {
    setManualPoolStakingModalOpen(false);
  }, []);

  return (
    <>
      <Popup handleClose={handlePoolStakingModalClose} showModal={showManualPoolStakingModal}>
        <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<GroupWorkOutlined fontSize='small' />} title={'Manual Staking'} />
        <Grid alignItems='center' container sx={{ p: '0px 24px' }}>
          <Grid item xs={12}>
            <Tabs
              indicatorColor='secondary'
              onChange={handleTabChange}
              sx={{ minHeight: '60px' }}
              textColor='secondary'
              value={tabValue}
              variant='fullWidth'>
              <Tab
                icon={<AddCircleRoundedIcon fontSize='small' />}
                iconPosition='start'
                label='Create a pool'
                sx={{ fontSize: 11, minHeight: '60px', px: '5px' }}
                value='create'
              />
              <Tab
                icon={<PersonAddAlt1RoundedIcon fontSize='small' />}
                iconPosition='start'
                label='Join a pool'
                sx={{ fontSize: 11, minHeight: '60px', px: '5px' }}
                value='join'
              />
            </Tabs>
          </Grid>
        </Grid>
        <Grid container sx={{ pt: 2 }}>

          <Grid item sx={{ p: '20px 40px' }} xs={12}>
            <TextField
              InputLabelProps={{ shrink: true }}
              disabled
              fullWidth
              label={t('Pool Id')}
              name='nextPoolId'
              sx={{ height: '20px' }}
              type='text'
              value={String(nextPoolId)}
              variant='outlined'
            />
          </Grid>

          <Grid item sx={{ p: '20px 40px' }} xs={12}>
            <TextField
              InputLabelProps={{ shrink: true }}
              InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
              autoFocus
              color='warning'
              fullWidth
              inputProps={{ step: '.01' }}
              label={t('Amount')}
              name='stakeAmount'
              onChange={handleStakeAmount}
              placeholder='0.0'
              sx={{ height: '20px' }}
              type='number'
              value={stakeAmountInHuman}
              variant='outlined'
            />
          </Grid>

          <Grid item sx={{ p: '40px' }} xs={12}>
            <TextField
              InputLabelProps={{ shrink: true }}
              autoFocus
              color='warning'
              fullWidth
              helperText={''}
              label={t('Pool name')}
              name='poolName'
              onChange={(e) => setPoolName(e.target.value)}
              placeholder='enter a pool name'
              sx={{ height: '20px' }}
              type='text'
              value={poolName}
              variant='outlined'
            />
          </Grid>
        </Grid>

        <Grid item sx={{ p: '20px 40px' }} xs={12}>
          <ShowAddress address={staker?.address} chain={chain} role={t('depositor')} />
        </Grid>

        <Grid item sx={{ p: '30px 30px' }} xs={12}>
          <NextStepButton
            data-button-action='next to stake'
          // isBusy={nextToStakeButtonBusy}
          // isDisabled={nextToStakeButtonDisabled}
          // onClick={handleNextToStake}
          >
            {t('Next')}
          </NextStepButton>
        </Grid>

      </Popup>
    </>
  );
}

export default styled(ManualStaking)`
      height: calc(100vh - 2px);
      overflow: auto;
      scrollbar - width: none;

      &:: -webkit - scrollbar {
        display: none;
      width:0,
       }
      .empty-list {
        text - align: center;
  }`;
