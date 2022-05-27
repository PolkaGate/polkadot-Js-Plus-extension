// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * render stake tab in pool staking
 * */

import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, PoolInfo, PoolStakingConsts } from '../../../util/plusTypes';

import { Alert, Avatar, Badge, Box, Button as MuiButton, FormControl, FormControlLabel, FormLabel, Grid, InputAdornment, Radio, RadioGroup, Stack, TextField } from '@mui/material';
import { blue, deepOrange, green, grey } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';
import { BN, BN_ZERO } from '@polkadot/util';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { FormatBalance, Progress, ShowBalance2 } from '../../../components';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../../util/plusUtils';
import CreatePool from './CreatePool';
import JoinPool from './JoinPool';

interface Props {
  api: ApiPromise | undefined;
  chain: Chain;
  currentlyStaked: BN | undefined | null;
  nextToStakeButtonBusy: boolean;
  setStakeAmount: React.Dispatch<React.SetStateAction<BN>>
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  state: string;
  poolStakingConsts: PoolStakingConsts | undefined;
  handleConfirmStakingModaOpen: () => void;
  myPool: MyPoolInfo | undefined | null;
  nextPoolId: BN | undefined;
  poolsInfo: PoolInfo[] | undefined | null;
  setNewPool: React.Dispatch<React.SetStateAction<PoolInfo | undefined>>
  poolsMembers: MembersMapEntry[] | undefined
}

export default function Stake({ api, chain, currentlyStaked, handleConfirmStakingModaOpen, myPool, nextPoolId, nextToStakeButtonBusy, poolStakingConsts, poolsInfo, poolsMembers, setNewPool, setStakeAmount, setState, staker, state }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<string>('');
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>();
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);
  const [minStakeable, setMinStakeable] = useState<BN>(BN_ZERO);
  const [minStakeableAsNumber, setMinStakeableAsNumber] = useState<number>(0);
  const [maxStakeable, setMaxStakeable] = useState<BN>(BN_ZERO);
  const [maxStakeableAsNumber, setMaxStakeableAsNumber] = useState<number>(0);
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [showCreatePoolModal, setCreatePoolModalOpen] = useState<boolean>(false);
  const [showJoinPoolModal, setJoinPoolModalOpen] = useState<boolean>(false);

  const decimals = api && api.registry.chainDecimals[0];
  const token = api ? api.registry.chainTokens[0] : '';
  const existentialDeposit = useMemo(() => api ? new BN(api.consts.balances.existentialDeposit.toString()) : BN_ZERO, [api]);

  useEffect(() => {
    decimals && setStakeAmount(new BN(String(amountToMachine(stakeAmountInHuman, decimals))));
  }, [decimals, setStakeAmount, stakeAmountInHuman]);

  // useEffect(() => {
  //   if (!staker?.balanceInfo?.available) { return; }

  //   setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  // }, [staker, staker?.balanceInfo?.available]);

  const handleStakeAmountInput = useCallback((value: string): void => {
    if (!api || !decimals || !staker?.balanceInfo?.available) return;

    setAlert('');
    const valueAsBN = new BN(String(amountToMachine(value, decimals)));

    if (value && valueAsBN.lt(minStakeable)) {
      const minStakeableAsBalance = api.createType('Balance', minStakeable);

      setAlert(t(`Staking amount is too low, it must be at least ${minStakeableAsBalance.toHuman()}`));
    }

    if (valueAsBN.gt(maxStakeable) && valueAsBN.lt(new BN(String(staker.balanceInfo.available)))) {
      setAlert(t('Your account might be reaped!'));
    }

    setStakeAmountInHuman(fixFloatingPoint(value));
  }, [api, decimals, maxStakeable, minStakeable, staker?.balanceInfo?.available, t]);

  const handleStakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    handleStakeAmountInput(value);
  }, [handleStakeAmountInput]);

  const handleCreatePool = useCallback((): void => {
    if (staker?.balanceInfo?.available) {
      setCreatePoolModalOpen(true);
      if (!state) setState('createPool');
    }
  }, [staker?.balanceInfo?.available, state, setState]);

  const handleJoinPool = useCallback((): void => {
    if (staker?.balanceInfo?.available) {
      setJoinPoolModalOpen(true);
      if (!state) setState('joinPool');
    }
  }, [staker?.balanceInfo?.available, state, setState]);

  const handleNextToStake = useCallback((): void => {
    if (!decimals) return;

    if (Number(stakeAmountInHuman) >= Number(amountToHuman(minStakeable.toString(), decimals))) {
      handleConfirmStakingModaOpen();
      if (!state) setState('bondExtra');
    }
  }, [stakeAmountInHuman, minStakeable, decimals, handleConfirmStakingModaOpen, state, setState]);

  useEffect(() => {
    if (!poolStakingConsts || existentialDeposit === undefined || !staker?.balanceInfo?.available) return;
    // const ED = Number(amountToHuman(existentialDeposit.toString(), decimals));
    let max = new BN(String(staker.balanceInfo.available)).sub(existentialDeposit.muln(3)); // 3: one goes to pool rewardId, 2 others remain as my account ED + some fee (FIXME: ED is lowerthan fee in some chains like KUSAMA)
    // const { minCreateBond, minJoinBond, minNominatorBond } = poolStakingConsts;
    // const m = bnMax(minNominatorBond, minCreateBond, minJoinBond, existentialDeposit);
    let min = poolStakingConsts.minJoinBond;

    if (min.gt(max)) {
      min = max = BN_ZERO;
    }

    setMaxStakeable(max);
    setMinStakeable(min);
  }, [poolStakingConsts, existentialDeposit, staker?.balanceInfo?.available]);

  useEffect(() => {
    if (!decimals) return;

    const minStakeableAsNumber = Number(amountToHuman(minStakeable.toString(), decimals));
    const maxStakeableAsNumber = Number(amountToHuman(maxStakeable.toString(), decimals));

    setMinStakeableAsNumber(minStakeableAsNumber);
    setMaxStakeableAsNumber(maxStakeableAsNumber);
  }, [minStakeable, maxStakeable, decimals]);

  useEffect(() => {
    if (stakeAmountInHuman && minStakeableAsNumber <= Number(stakeAmountInHuman) && Number(stakeAmountInHuman) <= maxStakeableAsNumber) {
      setNextToStakeButtonDisabled(false);
    }
  }, [maxStakeableAsNumber, minStakeableAsNumber, stakeAmountInHuman]);

  useEffect(() => {
    if (!decimals) { return; }

    if (!staker?.balanceInfo?.available) {
      return setZeroBalanceAlert(true);
    } else {
      setZeroBalanceAlert(false);
    }

    setNextButtonCaption(t('Next'));

    const balanceIsInsufficient = staker?.balanceInfo?.available <= amountToMachine(stakeAmountInHuman, decimals);

    if (balanceIsInsufficient || !Number(stakeAmountInHuman)) {
      setNextToStakeButtonDisabled(true);
    }

    if (Number(stakeAmountInHuman) && balanceIsInsufficient) {
      setNextButtonCaption(t('Insufficient Balance'));
    }

    if (Number(stakeAmountInHuman) && Number(stakeAmountInHuman) < minStakeableAsNumber) {
      setNextToStakeButtonDisabled(true);
    }
  }, [stakeAmountInHuman, t, minStakeableAsNumber, staker?.balanceInfo?.available, decimals]);

  const handleMinStakeClicked = useCallback(() => {
    if (myPool?.bondedPool?.state?.toLowerCase() === 'destroying') { return; }

    handleStakeAmountInput(String(minStakeableAsNumber));
  }, [handleStakeAmountInput, minStakeableAsNumber, myPool?.bondedPool?.state]);

  const handleMaxStakeClicked = useCallback(() => {
    if (myPool?.bondedPool?.state?.toLowerCase() === 'destroying') { return; }

    handleStakeAmountInput(String(maxStakeableAsNumber));
  }, [handleStakeAmountInput, maxStakeableAsNumber, myPool?.bondedPool?.state]);

  const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: '#44b700',
      color: '#44b700',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      },
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  }));

  const StakeInitialChoice = () => (
    <Grid container justifyContent='center' sx={{ pt: 5 }}>
      <Grid container item justifyContent='center' spacing={0.5} sx={{ fontSize: 12 }} xs={6}>
        <Grid item sx={{ pb: 1, textAlign: 'center' }} xs={12}>
          <StyledBadge
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            overlap='circular'
            variant='dot'
          >
            <Avatar onClick={handleJoinPool} sx={{ bgcolor: '#1c4a5a', boxShadow: `2px 4px 10px 4px ${grey[400]}`, color: '#ffb057', cursor: 'pointer', height: 110, width: 110 }}>{t('Join pool')}</Avatar>
          </StyledBadge>
        </Grid>
        <Grid item>
          {t('Min to join')}:
        </Grid>
        <Grid item>
          <ShowBalance2 api={api} balance={poolStakingConsts?.minJoinBond} />
        </Grid>
      </Grid>

      <Grid container item justifyContent='center' spacing={0.5} sx={{ fontSize: 12 }} xs={6}>
        <Grid container item justifyContent='center' sx={{ pb: 1 }} xs={12}>
          <Grid item>
            <Avatar onClick={handleCreatePool} sx={{ bgcolor: '#ffb057', boxShadow: `2px 4px 10px 4px ${grey[400]}`, color: '#1c4a5a', cursor: 'pointer', height: 110, width: 110 }}>{t('Create pool')}</Avatar>
          </Grid>
        </Grid>
        <Grid item>
          {t('Min to create')}:
        </Grid>
        <Grid item>
          <ShowBalance2 api={api} balance={poolStakingConsts?.minCreateBond?.add(existentialDeposit)} />
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <>
      {currentlyStaked === undefined
        ? <Progress title={'Loading ...'} />
        : (currentlyStaked === null || currentlyStaked?.isZero()) && !myPool
          ? <StakeInitialChoice />
          : <>
            <Grid item sx={{ p: '10px 30px 0px' }} xs={12}>
              <TextField
                InputLabelProps={{ shrink: true }}
                InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
                autoFocus
                color='warning'
                disabled={myPool?.bondedPool?.state?.toLowerCase() === 'destroying'}
                error={zeroBalanceAlert}
                fullWidth
                helperText={zeroBalanceAlert ? t('No available fund to stake') : ''}
                inputProps={{ step: '.01' }}
                label={t('Amount')}
                name='stakeAmount'
                onChange={handleStakeAmount}
                placeholder='0.0'
                sx={{ height: '50px' }}
                type='number'
                value={stakeAmountInHuman}
                variant='outlined'
              />
            </Grid>

            <Grid container sx={{ height: '160px' }}>
              {!zeroBalanceAlert && token &&
                <Grid container item justifyContent='space-between' sx={{ p: '0px 30px 0px' }} xs={12}>
                  <Grid item sx={{ fontSize: 12 }}>
                    {t('Min')}:
                    <MuiButton onClick={handleMinStakeClicked} variant='text'>
                      <FormatBalance api={api} value={minStakeable} />
                    </MuiButton>
                  </Grid>
                  <Grid item sx={{ fontSize: 12 }}>
                    {t('Max')}{': ~ '}
                    <MuiButton onClick={handleMaxStakeClicked} variant='text'>
                      <FormatBalance api={api} value={maxStakeable} />
                    </MuiButton>
                  </Grid>
                </Grid>
              }
              <Grid container item sx={{ fontSize: 13, fontWeight: '600', p: '15px 30px 5px', textAlign: 'center' }} xs={12}>
                {alert &&
                  <Grid item xs={12}>
                    <Alert severity='error' sx={{ fontSize: 12 }}>
                      {alert}
                    </Alert>
                  </Grid>
                }
              </Grid>

              {myPool?.member?.poolId && myPool?.bondedPool?.state?.toLowerCase() !== 'destroying'
                ? <Grid item sx={{ color: grey[500], fontSize: 12, textAlign: 'center' }} xs={12}>
                  {t('You are staking in "{{poolName}}" pool (index: {{poolId}}).', { replace: { poolId: myPool.member.poolId, poolName: myPool.metadata ?? 'no name' } })}
                </Grid>
                : <Grid item sx={{ color: grey[500], fontSize: 12, textAlign: 'center' }} xs={12}>
                  {t('"{{poolName}}" pool is in {{state}} state, hence can not stake anymore.',
                    { replace: { poolId: myPool.member.poolId, poolName: myPool.metadata ?? 'no name', state: myPool?.bondedPool?.state } })}
                </Grid>
              }
            </Grid>

            <Grid item sx={{ p: '0px 10px 0px' }} xs={12}>
              <NextStepButton
                data-button-action='next to stake'
                isBusy={nextToStakeButtonBusy}
                isDisabled={nextToStakeButtonDisabled}
                onClick={handleNextToStake}
              >
                {nextButtonCaption}
              </NextStepButton>
            </Grid>
          </>
      }
      {showCreatePoolModal && nextPoolId &&
        <CreatePool
          api={api}
          chain={chain}
          handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
          nextPoolId={nextPoolId}
          poolStakingConsts={poolStakingConsts}
          setCreatePoolModalOpen={setCreatePoolModalOpen}
          setNewPool={setNewPool}
          setStakeAmount={setStakeAmount}
          setState={setState}
          showCreatePoolModal={showCreatePoolModal}
          staker={staker}
        />
      }
      {showJoinPoolModal && poolsInfo &&
        <JoinPool
          api={api}
          chain={chain}
          handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
          poolStakingConsts={poolStakingConsts}
          poolsInfo={poolsInfo}
          poolsMembers={poolsMembers}
          setJoinPoolModalOpen={setJoinPoolModalOpen}
          setPool={setNewPool}
          setStakeAmount={setStakeAmount}
          setState={setState}
          showJoinPoolModal={showJoinPoolModal}
          staker={staker}
        />
      }

    </>
  );
}
