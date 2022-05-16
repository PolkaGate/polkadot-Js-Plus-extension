// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 * 
 * */

import type { ApiPromise } from '@polkadot/api';
import type { DeriveOwnContributions } from '@polkadot/api-derive/types';
import type { LinkOption } from '@polkadot/apps-config/endpoints/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { ThemeProps } from '../../../../../extension-ui/src/types';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, PoolInfo, PoolStakingConsts, SavedMetaData, StakingConsts, Validators } from '../../../util/plusTypes';

import { AddCircleRounded as AddCircleRoundedIcon, GroupWorkOutlined, PersonAddAlt1Rounded as PersonAddAlt1RoundedIcon } from '@mui/icons-material';
import { Grid, InputAdornment, Tab, Tabs, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { createWsEndpoints } from '@polkadot/apps-config';
import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { BackButton, NextStepButton } from '../../../../../extension-ui/src/components';
import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses2, PlusHeader, Popup, ShowAddress } from '../../../components';
import { EXTENSION_NAME } from '../../../util/constants';
import { amountToMachine } from '../../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  chain: Chain;
  className?: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  showManualPoolStakingModal: boolean;
  staker: AccountsBalanceType;
  stakeAmountInHuman: string;
  setManualPoolStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  nextPoolId: BN;
  handleConfirmStakingModaOpen: () => void;
  setNewPool: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>
}

function ManualStaking({ api, chain, nextPoolId, className, setNewPool, handleConfirmStakingModaOpen, setState, setManualPoolStakingModalOpen, showManualPoolStakingModal, stakeAmountInHuman, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [tabValue, setTabValue] = useState('create');
  const [poolName, setPoolName] = useState<string>(`${EXTENSION_NAME}-${nextPoolId}`);
  const [rootId, setRootId] = useState<string>(staker.address);
  const [nominatorId, setNominatorId] = useState<string>(staker.address);
  const [stateTogglerId, setStateTogglerId] = useState<string>(staker.address);

  const decimals = api && api.registry.chainDecimals[0];

  useEffect(() => {
    setNewPool({
      bondedPool: {
        memberCounter: 0,
        points: amountToMachine(stakeAmountInHuman, decimals),
        roles: {
          depositor: staker.address,
          nominator: nominatorId,
          root: rootId,
          stateToggler: stateTogglerId
        },
        state: 'Creating'
      },
      metadata: poolName ?? null,
      poolId: nextPoolId,
      rewardPool: null
    });
  }, [decimals, nominatorId, poolName, rootId, setNewPool, stakeAmountInHuman, staker.address, stateTogglerId]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  const handlePoolStakingModalClose = useCallback(() => {
    setManualPoolStakingModalOpen(false);
    setState('');
  }, [setManualPoolStakingModalOpen, setState]);

  return (
    <>
      <Popup handleClose={handlePoolStakingModalClose} showModal={showManualPoolStakingModal}>
        <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<GroupWorkOutlined fontSize='small' />} title={'Manual Staking'} />
        <Grid alignItems='center' container sx={{ p: '10px 24px' }}>
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
        {tabValue === 'create' &&
          <Grid container sx={{ pt: 2 }}>

            <Grid container item justifyContent='space-between' sx={{ fontSize: 12, p: '5px 40px' }}>
              <Grid item xs={2}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  disabled
                  fullWidth
                  inputProps={{ style: { padding: '12px', textAlign: 'center' } }}
                  label={t('Pool Id')}
                  name='nextPoolId'
                  type='text'
                  value={String(nextPoolId)}
                  variant='outlined'
                />
              </Grid>

              <Grid item xs={9}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  autoFocus
                  color='warning'
                  fullWidth
                  helperText={''}
                  inputProps={{ style: { padding: '12px' } }}
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

            <Grid container spacing={'15px'} item sx={{ fontSize: 12, p: '45px 40px 5px' }}>
              <Grid item xs={12}>
                <AllAddresses2 api={api} chain={chain} disabled freeSolo selectedAddress={staker?.address} title={t('Depositor')} />
              </Grid>
              <Grid item xs={12}>
                <AllAddresses2 api={api} chain={chain} disabled freeSolo selectedAddress={rootId} setSelectedAddress={setRootId} title={t('Root')} />
              </Grid>
              <Grid item xs={12}>
                <AllAddresses2 api={api} chain={chain} freeSolo selectedAddress={nominatorId} setSelectedAddress={setNominatorId} title={t('Nominator')} />
              </Grid>
              <Grid item xs={12}>
                <AllAddresses2 api={api} chain={chain} freeSolo selectedAddress={stateTogglerId} setSelectedAddress={setStateTogglerId} title={t('State toggler')} />
              </Grid>
            </Grid>

            <Grid container item sx={{ p: '15px 34px' }} xs={12}>
              <Grid item xs={1} >
                <BackButton onClick={handlePoolStakingModalClose} />
              </Grid>
              <Grid item xs sx={{ pl: 1 }}>
                <NextStepButton
                  data-button-action='next to stake'
                  // isBusy={nextToStakeButtonBusy}
                  isDisabled={!rootId || !nominatorId || !stateTogglerId || !poolName}
                  onClick={handleConfirmStakingModaOpen}
                >
                  {t('Next')}
                </NextStepButton>
              </Grid>
            </Grid>

          </Grid>
        }
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
