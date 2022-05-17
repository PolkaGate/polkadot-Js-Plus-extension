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
import { Button, Grid, InputAdornment, Tab, Tabs, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  chain: Chain;
  className?: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  showCreatePoolModal: boolean;
  staker: AccountsBalanceType;
  setCreatePoolModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  nextPoolId: BN;
  handleConfirmStakingModaOpen: () => void;
  setNewPool: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>
  poolStakingConsts: PoolStakingConsts | undefined;
  setStakeAmount: React.Dispatch<React.SetStateAction<BN>>
}

function CreatePool({ api, chain, nextPoolId, className, setStakeAmount, poolStakingConsts, setNewPool, handleConfirmStakingModaOpen, setState, setCreatePoolModalOpen, showCreatePoolModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [alert, setAlert] = useState<string>('');
  const [tabValue, setTabValue] = useState('create');
  const [poolName, setPoolName] = useState<string>(`${EXTENSION_NAME}-${nextPoolId}`);
  const [rootId, setRootId] = useState<string>(staker.address);
  const [nominatorId, setNominatorId] = useState<string>(staker.address);
  const [stateTogglerId, setStateTogglerId] = useState<string>(staker.address);
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>();
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [minStakeable, setMinStakeable] = useState<number>(0);
  const [maxStakeable, setMaxStakeable] = useState<number>(0);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();

  const decimals = api ? api.registry.chainDecimals[0] : 1;
  const token = api ? api.registry.chainTokens[0] : '';
  const existentialDeposit = useMemo(() => api ? new BN(api.consts.balances.existentialDeposit.toString()) : BN_ZERO, [api]);

  useEffect(() => {
    const realStakingAmount = new BN(String(amountToMachine(stakeAmountInHuman, decimals))).sub(existentialDeposit);// an ED goes to rewardId

    decimals && setStakeAmount(realStakingAmount);
  }, [decimals, existentialDeposit, setStakeAmount, stakeAmountInHuman]);

  useEffect(() => {
    const stakeAmount = new BN(String(amountToMachine(stakeAmountInHuman, decimals)));

    api && api.tx.nominationPools.create(stakeAmount, rootId, nominatorId, stateTogglerId).paymentInfo(staker.address).then((i) => {
      const createFee = i?.partialFee;

      api.tx.nominationPools.setMetadata(nextPoolId, poolName).paymentInfo(staker.address)
        .then((i) => setEstimatedFee(api.createType('Balance', createFee.add(i?.partialFee))))
        .catch(console.error);
    });
  }, [api, decimals, nextPoolId, nominatorId, poolName, rootId, stakeAmountInHuman, staker.address, stateTogglerId]);

  // useEffect(() => {
  //   if (!poolStakingConsts || !decimals || existentialDeposit === undefined || !estimatedFee || !staker?.balanceInfo?.available) return;
  //   const ED = Number(amountToHuman(existentialDeposit.toString(), decimals));
  //   // let max = Number(fixFloatingPoint(Number(availableBalanceInHuman) - 2 * ED)); // FIXME: ED is lower than fee in some chains like KUSAMA
  //   let maxTemp= new BN(staker.balanceInfo.available.toString()).sub(existentialDeposit.muln(2)).sub(new BN(estimatedFee));
  //   let max = Number(amountToHuman(maxTemp.toString(), decimals));

  //   const { minCreateBond, minJoinBond, minNominatorBond } = poolStakingConsts;
  //   const minTemp = minCreateBond.add(existentialDeposit);
  //   let min = Number(amountToHuman(minTemp.toString(), decimals));

  //   if (min > max) {
  //     min = max = 0;
  //   }

  //   setMaxStakeable(max);
  //   setMinStakeable(min);
  // }, [availableBalanceInHuman, poolStakingConsts, decimals, existentialDeposit]);

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

  useEffect(() => {
    if (!staker?.balanceInfo?.available) { return; }

    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker, staker?.balanceInfo?.available]);

  const handlePoolStakingModalClose = useCallback(() => {
    setCreatePoolModalOpen(false);
    setState('');
  }, [setCreatePoolModalOpen, setState]);

  const handleStakeAmountInput = useCallback((value: string): void => {
    setAlert('');

    if (value && Number(value) < minStakeable) {
      setAlert(t(`Staking amount is too low, it must be at least ${minStakeable} ${token}`));
    }

    if (Number(value) > maxStakeable && Number(value) < Number(availableBalanceInHuman)) {
      setAlert(t('Your account might be reaped!'));
    }

    setStakeAmountInHuman(fixFloatingPoint(value));
  }, [availableBalanceInHuman, maxStakeable, minStakeable, t, token]);

  const handleMinStakeClicked = useCallback(() => {
    handleStakeAmountInput(String(minStakeable));
  }, [handleStakeAmountInput, minStakeable]);

  const handleMaxStakeClicked = useCallback(() => {
    handleStakeAmountInput(String(maxStakeable));
  }, [handleStakeAmountInput, maxStakeable]);

  const handleStakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    handleStakeAmountInput(value);
  }, [handleStakeAmountInput]);

  return (
    <>
      <Popup handleClose={handlePoolStakingModalClose} showModal={showCreatePoolModal}>
        <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<GroupWorkOutlined fontSize='small' />} title={'Create Pool'} />
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

          <Grid item sx={{ p: '10px 40px 1px' }} xs={12}>
            <TextField
              InputLabelProps={{ shrink: true }}
              InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
              inputProps={{ style: { padding: '12px' } }}
              color='warning'
              // error={zeroBalanceAlert}
              fullWidth
              // helperText={zeroBalanceAlert ? t('No available fund to stake') : ''}
              inputProps={{ step: '.01' }}
              label={t('Amount')}
              name='stakeAmount'
              onChange={handleStakeAmount}
              placeholder='0.0'
              type='number'
              value={stakeAmountInHuman}
              variant='outlined'
            />
          </Grid>
          <Grid container item justifyContent='space-between' sx={{ p: '0px 40px 10px' }} xs={12}>
            <Grid item sx={{ fontSize: 12 }}>
              {t('Min')}:
              <Button onClick={handleMinStakeClicked} variant='text'>
                {`${minStakeable} ${token}`}
              </Button>
            </Grid>
            <Grid item sx={{ fontSize: 12 }}>
              {t('Max')}{': ~ '}
              <Button onClick={handleMaxStakeClicked} variant='text'>
                {`${maxStakeable} ${token}`}
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={'15px'} item sx={{ fontSize: 12, p: '15px 40px 5px' }}>
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

          <Grid container item sx={{ p: '10px 34px' }} xs={12}>
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
      </Popup>
    </>
  );
}

export default styled(CreatePool)`
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
