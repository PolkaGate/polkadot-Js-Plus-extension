// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  render unstake tab in easy staking component
 * */

import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';

import { Alert, Button as MuiButton, Grid, InputAdornment, TextField } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

import { NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { StakingConsts } from '../../../util/plusTypes';
import { amountToHuman, amountToMachine, fixFloatingPoint } from '../../../util/plusUtils';

interface Props {
  api: ApiPromise | undefined;
  stakingConsts: StakingConsts | undefined;
  setUnstakeAmount: React.Dispatch<React.SetStateAction<BN>>
  currentlyStakedInHuman: string | undefined | null;
  member: PalletNominationPoolsPoolMember | undefined;
  nextToUnStakeButtonBusy: boolean;
  availableBalance: BN;
  setState: React.Dispatch<React.SetStateAction<string>>;
  handleConfirmStakingModaOpen: () => void
}

export default function Unstake({ api, availableBalance, currentlyStakedInHuman, handleConfirmStakingModaOpen, member, nextToUnStakeButtonBusy, setState, setUnstakeAmount, stakingConsts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [unstakeAmountInHuman, setUnstakeAmountInHuman] = useState<string | null>(null);
  const [nextToUnStakeButtonDisabled, setNextToUnStakeButtonDisabled] = useState(true);
  const [alert, setAlert] = useState<string>('');

  const UnableToPayFee = availableBalance === BN_ZERO;

  const decimals = api?.registry?.chainDecimals[0];
  const token = api?.registry?.chainTokens[0];

  const handleNextToUnstake = useCallback((): void => {
    // if (!state) 
    setState('unstake');
    handleConfirmStakingModaOpen();
  }, [handleConfirmStakingModaOpen, setState]);

  const handleUnstakeAmountChanged = useCallback((value: string): void => {
    if (!decimals) return;

    setAlert('');
    value = fixFloatingPoint(value);
    setUnstakeAmountInHuman(value);

    if (!Number(value)) { return; }

    const currentlyStaked = member ? new BN(member.points) : BN_ZERO;

    if (Number(value) > Number(currentlyStakedInHuman)) {
      setAlert(t('It is more than already staked!'));

      return;
    }

    const remainStaked = currentlyStaked.sub(new BN(String(amountToMachine(value, decimals))));

    // to remove dust from just comparision
    const remainStakedInHuman = Number(amountToHuman(remainStaked.toString(), decimals));

    console.log(`remainStaked ${remainStaked}  currentlyStaked ${currentlyStaked} amountToMachine(value, decimals) ${amountToMachine(value, decimals)}`);

    if (remainStakedInHuman > 0 && remainStakedInHuman < Number(amountToHuman(stakingConsts?.minNominatorBond, decimals))) {
      setAlert(`Remained stake amount: ${amountToHuman(remainStaked.toString(), decimals)} should not be less than ${amountToHuman(stakingConsts?.minNominatorBond, decimals)} ${token}`);

      return;
    }

    if (currentlyStakedInHuman && currentlyStakedInHuman === value) {
      // to include even dust
      setUnstakeAmount(member ? new BN(member.points) : BN_ZERO);
    } else {
      setUnstakeAmount(Number(value) ? new BN(String(amountToMachine(value, decimals))) : BN_ZERO);
    }

    setNextToUnStakeButtonDisabled(false);
  }, [member, currentlyStakedInHuman, decimals, stakingConsts?.minNominatorBond, t, token, setUnstakeAmount]);

  const handleUnstakeAmount = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setNextToUnStakeButtonDisabled(true);
    let value = event.target.value;

    if (Number(value) < 0) { value = String(-Number(value)); }

    handleUnstakeAmountChanged(value);
  }, [handleUnstakeAmountChanged]);

  const handleMaxUnstakeClicked = useCallback(() => {
    if (currentlyStakedInHuman) { handleUnstakeAmountChanged(currentlyStakedInHuman); }
  }, [currentlyStakedInHuman, handleUnstakeAmountChanged]);

  return (
    <>
      <Grid container sx={{ height: '222px' }} title='Unstake'>
        <Grid item sx={{ p: '10px 30px 0px' }} xs={12}>
          <TextField
            InputLabelProps={{ shrink: true }}
            InputProps={{ endAdornment: (<InputAdornment position='end'>{token}</InputAdornment>) }}
            autoFocus
            color='info'
            error={!currentlyStakedInHuman || Number(unstakeAmountInHuman) > Number(currentlyStakedInHuman) || UnableToPayFee}
            fullWidth
            helperText={
              <>
                {currentlyStakedInHuman === undefined &&
                  <Grid xs={12}>
                    {t('Fetching data from blockchain ...')}
                  </Grid>}

                {currentlyStakedInHuman === '0' &&
                  <Grid xs={12}>
                    {t('Nothing to unstake')}
                  </Grid>
                }
                {currentlyStakedInHuman && currentlyStakedInHuman !== '0' && UnableToPayFee &&
                  <Grid xs={12}>
                    {t('Unable to pay fee')}
                  </Grid>
                }
              </>
            }
            inputProps={{ step: '.01' }}
            label={t('Amount')}
            name='unstakeAmount'
            onChange={handleUnstakeAmount}
            placeholder='0.0'
            sx={{ height: '10px' }}
            type='number'
            value={unstakeAmountInHuman}
            variant='outlined'
          />
        </Grid>

        <Grid container item xs={12}>
          <Grid container item justifyContent='flex-end' sx={{ p: '0px 30px 10px' }} xs={12}>
            <Grid item sx={{ fontSize: 12 }}>
              {!!member?.points &&
                <>
                  {t('Max')}:
                  <MuiButton
                    onClick={handleMaxUnstakeClicked}
                    variant='text'
                  >
                    {`${String(currentlyStakedInHuman)} ${token}`}
                  </MuiButton>
                </>
              }
            </Grid>
          </Grid>
          {/* } */}
          <Grid container item sx={{ fontSize: 13, fontWeight: '600', padding: '5px 30px 5px', textAlign: 'center' }} xs={12}>
            {alert
              ? <Grid item xs={12}>
                <Alert severity='error' sx={{ fontSize: 12 }}>
                  {alert}
                </Alert>
              </Grid>
              : <Grid item sx={{ paddingTop: '45px' }} xs={12}></Grid>
            }
          </Grid>
        </Grid>
      </Grid>
      <Grid item sx={{ padding: '0px 10px 0px' }} xs={12}>
        <NextStepButton
          data-button-action='next to unstake'
          isBusy={nextToUnStakeButtonBusy}
          isDisabled={nextToUnStakeButtonDisabled || UnableToPayFee}
          onClick={handleNextToUnstake}
        >
          {t('Next')}
        </NextStepButton>
      </Grid>

    </>
  );
}

