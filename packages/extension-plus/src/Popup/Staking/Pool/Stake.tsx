// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * render stake tab in pool staking
 * */

import type { AccountsBalanceType, MyPoolInfo, PoolInfo, PoolStakingConsts } from '../../../util/plusTypes';

import { Alert, Avatar, Badge, Box, Button as MuiButton, FormControl, FormControlLabel, FormLabel, Grid, InputAdornment, Radio, RadioGroup, Stack, TextField } from '@mui/material';
import { blue, deepOrange, green, grey } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';
import { BN, BN_ZERO } from '@polkadot/util';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../../components';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../../util/plusUtils';
import CreatePool from './CreatePool';

interface Props {
  api: ApiPromise | undefined;
  chain: Chain;
  currentlyStakedInHuman: string | undefined | null;
  nextToStakeButtonBusy: boolean;
  setStakeAmount: React.Dispatch<React.SetStateAction<BN>>
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  state: string;
  poolStakingConsts: PoolStakingConsts | undefined;
  handleConfirmStakingModaOpen: () => void;
  myPool: MyPoolInfo | undefined | null;
  nextPoolId: BN;
  setNewPool: React.Dispatch<React.SetStateAction<PoolInfo | undefined>>
}

export default function Stake({ api, chain, currentlyStakedInHuman, handleConfirmStakingModaOpen, myPool, nextPoolId, nextToStakeButtonBusy, poolStakingConsts, setNewPool, setStakeAmount, setState, staker, state }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [alert, setAlert] = useState<string>('');
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>();
  const [zeroBalanceAlert, setZeroBalanceAlert] = useState(false);
  const [nextButtonCaption, setNextButtonCaption] = useState<string>(t('Next'));
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);
  const [validatorSelectionType, setValidatorSelectionType] = useState<string>('Auto');
  const [minStakeable, setMinStakeable] = useState<number>(0);
  const [maxStakeable, setMaxStakeable] = useState<number>(0);
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [showCreatePoolModal, setCreatePoolModalOpen] = useState<boolean>(false);

  const decimals = api && api.registry.chainDecimals[0];
  const token = api ? api.registry.chainTokens[0] : '';
  const existentialDeposit = useMemo(() => api ? new BN(api.consts.balances.existentialDeposit.toString()) : BN_ZERO, [api]);

  useEffect(() => {
    decimals && setStakeAmount(new BN(String(amountToMachine(stakeAmountInHuman, decimals))));
  }, [decimals, setStakeAmount, stakeAmountInHuman]);

  useEffect(() => {
    if (!staker?.balanceInfo?.available) { return; }

    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker, staker?.balanceInfo?.available]);

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

  const handleStakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    let value = event.target.value;

    if (Number(value) < 0) {
      value = String(-Number(value));
    }

    handleStakeAmountInput(value);
  }, [handleStakeAmountInput]);

  const handleValidatorSelectionType = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setValidatorSelectionType(event.target.value);
    // setConfirmStakingModalOpen(false);
  }, [setValidatorSelectionType]);

  const handleManualPoolStakingOpen = useCallback((): void => {
    setCreatePoolModalOpen(true);
  }, []);

  const handleCreatePool = useCallback((): void => {
    if (staker?.balanceInfo?.available) {
      handleManualPoolStakingOpen();
      if (!state) setState('createPool');
    }
  }, [staker?.balanceInfo?.available, handleManualPoolStakingOpen, state, setState]);


  const handleNextToStake = useCallback((): void => {
    if (Number(stakeAmountInHuman) >= minStakeable) {
      switch (validatorSelectionType) {
        case ('Auto'):
          handleConfirmStakingModaOpen();
          if (!state) setState('stakeAuto');
          break;
        case ('Manual'):
          handleManualPoolStakingOpen();
          if (!state) setState('createPool'); // will be different from solo staking
          break;
        default:
          console.log('unknown!!');
      }
    }
  }, [stakeAmountInHuman, minStakeable, validatorSelectionType, handleConfirmStakingModaOpen, state, setState, handleManualPoolStakingOpen]);

  useEffect(() => {
    if (!poolStakingConsts || !decimals || existentialDeposit === undefined) return;
    const ED = Number(amountToHuman(existentialDeposit.toString(), decimals));
    let max = Number(fixFloatingPoint(Number(availableBalanceInHuman) - 3 * ED)); // 3: one goes to pool rewardId, 2 others remain as my account ED + some fee (FIXME: ED is lowerthan fee in some chains like KUSAMA)
    const { minCreateBond, minJoinBond, minNominatorBond } = poolStakingConsts;
    // const m = bnMax(minNominatorBond, minCreateBond, minJoinBond, existentialDeposit);
    let min = Number(amountToHuman(minJoinBond.toString(), decimals));

    if (min > max) {
      min = max = 0;
    }

    setMaxStakeable(max);
    setMinStakeable(min);
  }, [availableBalanceInHuman, poolStakingConsts, decimals, existentialDeposit]);

  useEffect(() => {
    if (stakeAmountInHuman && minStakeable <= Number(stakeAmountInHuman) && Number(stakeAmountInHuman) <= maxStakeable) {
      setNextToStakeButtonDisabled(false);
    }
  }, [minStakeable, maxStakeable, stakeAmountInHuman]);

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

    if (Number(stakeAmountInHuman) && Number(stakeAmountInHuman) < minStakeable) {
      setNextToStakeButtonDisabled(true);
    }
  }, [stakeAmountInHuman, t, minStakeable, staker?.balanceInfo?.available, decimals]);

  const handleMinStakeClicked = useCallback(() => {
    handleStakeAmountInput(String(minStakeable));
  }, [handleStakeAmountInput, minStakeable]);

  const handleMaxStakeClicked = useCallback(() => {
    handleStakeAmountInput(String(maxStakeable));
  }, [handleStakeAmountInput, maxStakeable]);

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
    <Stack direction='row' justifyContent='center' spacing={8} sx={{ pt: 5 }}>
      <StyledBadge
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        overlap='circular'
        variant='dot'
      >
        <Avatar sx={{ bgcolor: '#1c4a5a', color: '#ffb057', cursor: 'pointer', height: 110, width: 110 }}>{t('Join pool')}</Avatar>
      </StyledBadge>
      <Avatar onClick={handleCreatePool} sx={{ bgcolor: '#ffb057', color: '#1c4a5a', cursor: 'pointer', height: 110, width: 110 }}>{t('Create pool')}</Avatar>
    </Stack>

  );

  const PoolSelectionRadionButtons = () => (
    <FormControl fullWidth>
      <Grid alignItems='center' container justifyContent='center'>
        <Grid item sx={{ fontSize: 12 }} xs={3}>
          <FormLabel sx={{ color: 'black', fontSize: 12, fontWeight: '500' }}>{t('Pool selection')}:</FormLabel>
        </Grid>
        <Grid item sx={{ textAlign: 'right' }} xs={9}>
          <RadioGroup defaultValue='Auto' onChange={handleValidatorSelectionType} row value={validatorSelectionType}>
            <FormControlLabel
              control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
              disabled={myPool === undefined}
              label={
                <Box fontSize={12}> {t('Auto')}
                  <Box component='span' sx={{ color: 'gray' }}>
                    ({t('best return')})
                  </Box>
                </Box>
              }
              value='Auto'
            />
            <FormControlLabel
              control={<Radio sx={{ fontSize: 12, '& .MuiSvgIcon-root': { fontSize: 14 } }} />}
              disabled={myPool === undefined}
              label={<Box fontSize={12}> {t('Manual')} </Box>}
              sx={{ fontSize: 12 }}
              value='Manual'
            />
          </RadioGroup>
        </Grid>
      </Grid>
    </FormControl>
  );

  return (
    <>
      {currentlyStakedInHuman === undefined
        ? <Progress title={'Loading ...'} />
        : currentlyStakedInHuman === null || currentlyStakedInHuman === '0'
          ? <StakeInitialChoice />
          : <>
            <Grid container sx={{ height: '222px' }}>
              <Grid item sx={{ p: '10px 30px 0px' }} xs={12}>
                <TextField
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
                  autoFocus
                  color='warning'
                  error={zeroBalanceAlert}
                  fullWidth
                  helperText={zeroBalanceAlert ? t('No available fund to stake') : ''}
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

              <Grid container item xs={12}>
                {!zeroBalanceAlert && token
                  ? <Grid container item justifyContent='space-between' sx={{ p: '0px 30px 10px' }} xs={12}>
                    <Grid item sx={{ fontSize: 12 }}>
                      {t('Min')}:
                      <MuiButton onClick={handleMinStakeClicked} variant='text'>
                        {`${minStakeable} ${token}`}
                      </MuiButton>
                    </Grid>
                    <Grid item sx={{ fontSize: 12 }}>
                      {t('Max')}{': ~ '}
                      <MuiButton onClick={handleMaxStakeClicked} variant='text'>
                        {`${maxStakeable} ${token}`}
                      </MuiButton>
                    </Grid>
                  </Grid>
                  : <Grid container item sx={{ p: '23px' }} xs={12}></Grid>
                }
                <Grid container item sx={{ fontSize: 13, fontWeight: '600', textAlign: 'center', p: '5px 30px 5px' }} xs={12}>
                  {alert
                    ? <Grid item xs={12}>
                      <Alert severity='error' sx={{ fontSize: 12 }}>
                        {alert}
                      </Alert>
                    </Grid>
                    : <Grid item sx={{ paddingTop: '45px' }} xs={12}></Grid>
                  }
                </Grid>
                {myPool?.member?.poolId
                  ? <Grid item sx={{ color: grey[500], fontSize: 12, textAlign: 'center' }} xs={12}>
                    {t('You are staking in "{{poolName}}" pool (index: {{poolId}}).', { replace: { poolId: myPool.member.poolId, poolName: myPool.metadata ?? 'no name' } })}
                  </Grid>
                  : <Grid item justifyContent='center' sx={{ textAlign: 'center' }} xs={12}>
                    <PoolSelectionRadionButtons />
                  </Grid>
                }
              </Grid>
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
      {showCreatePoolModal &&
        <CreatePool
          poolStakingConsts={poolStakingConsts}
          setStakeAmount={setStakeAmount}
          api={api}
          chain={chain}
          handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
          nextPoolId={nextPoolId}
          setCreatePoolModalOpen={setCreatePoolModalOpen}
          setNewPool={setNewPool}
          setState={setState}
          showCreatePoolModal={showCreatePoolModal}
          staker={staker}
        />
      }

    </>
  );
}
