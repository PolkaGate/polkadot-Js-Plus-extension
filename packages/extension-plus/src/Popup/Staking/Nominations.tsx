// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here nominated validators are listed, which shows usefull information/notifications like current active nominator,
 *  oversubscribds, noActive in this era, Tune up to do rebag or putInFrontOf if needed, and also stop/change nominations are provided.
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { Adjust as AdjustIcon, StopCircle as StopCircleIcon, TrackChanges as TrackChangesIcon } from '@mui/icons-material';
import { Button as MuiButton, Grid } from '@mui/material';
import React, { useCallback } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import { NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Hint, Progress } from '../../components';
import { AccountsBalanceType, PutInFrontInfo, RebagInfo, StakingConsts, Validators } from '../../util/plusTypes';
import ValidatorsList from './ValidatorsList';

interface Props {
  activeValidator: DeriveStakingQuery | undefined;
  ledger: StakingLedger | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  stakingConsts: StakingConsts | null;
  noNominatedValidators: boolean;
  chain: Chain;
  api: ApiPromise | undefined;
  validatorsIdentities: DeriveAccountInfo[] | null;
  validatorsInfo: Validators | null;
  state: string;
  handleSelectValidatorsModalOpen: (arg0?: boolean) => void;
  handleStopNominating: () => void;
  handleRebag: () => void;
  nominatorInfo: { minNominated: bigint, isInList: boolean } | undefined;
  putInFrontInfo: PutInFrontInfo | undefined;
  rebagInfo: RebagInfo | undefined;
  staker: AccountsBalanceType;
}

export default function Nominations({ activeValidator, api, chain, handleRebag, handleSelectValidatorsModalOpen, handleStopNominating, ledger, noNominatedValidators, nominatedValidators, nominatorInfo, putInFrontInfo, rebagInfo, staker, stakingConsts, state, validatorsIdentities, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const currentlyStaked = BigInt(ledger ? ledger.active.toString() : '0');
  const tuneUpButtonEnable = !noNominatedValidators && nominatorInfo && !nominatorInfo?.isInList && (rebagInfo?.shouldRebag || putInFrontInfo?.shouldPutInFront);

  return (
    <>
      {nominatedValidators?.length && stakingConsts && !noNominatedValidators
        ? <Grid container sx={{ p: 0 }}>
          <Grid item sx={{height: '245px'}} xs={12}>
            <ValidatorsList
              activeValidator={activeValidator}
              api={api}
              chain={chain}
              height={220}
              staker={staker}
              stakingConsts={stakingConsts}
              validatorsIdentities={validatorsIdentities}
              validatorsInfo={nominatedValidators}
            />
          </Grid>

          <Grid container item justifyContent='space-between' sx={{ padding: '5px 10px 0px' }} xs={12}>
            <Grid item xs={5}>
              <MuiButton
                onClick={handleStopNominating}
                size='medium'
                startIcon={<StopCircleIcon />}
                sx={{ color: 'black', textTransform: 'none' }}
                variant='text'
              >
                {t('Stop nominating')}
              </MuiButton>
            </Grid>

            <Grid item sx={{ textAlign: 'center' }} xs={3}>
              <Hint id='rebag' place='top' tip='Rebag/putInFrontOf if needed'>
                <MuiButton
                  disabled={!tuneUpButtonEnable}
                  onClick={handleRebag}
                  size='medium'
                  startIcon={<AdjustIcon />}
                  sx={{ color: 'red', textTransform: 'none' }}
                  variant='text'
                >
                  {t('Tune up')}
                </MuiButton>
              </Hint>
            </Grid>

            <Grid item sx={{ textAlign: 'right' }} xs={4}>
              <MuiButton
                color='warning'
                onClick={() => handleSelectValidatorsModalOpen()}
                size='medium'
                startIcon={<TrackChangesIcon />}
                sx={{ textTransform: 'none' }}
                variant='text'
              >
                {t('Change validators')}
              </MuiButton>
            </Grid>
          </Grid>
        </Grid>
        : !noNominatedValidators
          ? <Progress title={'Loading ...'} />
          : <Grid container justifyContent='center'>
            <Grid item sx={{ fontSize: 13, margin: '60px 10px 30px', textAlign: 'center' }} xs={12}>
              {t('No nominated validators found')}
            </Grid>
            <Grid item>
              {api && stakingConsts && currentlyStaked >= stakingConsts?.minNominatorBond &&
                <NextStepButton
                  data-button-action='Set Nominees'
                  isBusy={validatorsInfo && state === 'setNominees'}
                  onClick={()=>handleSelectValidatorsModalOpen(true)}
                >
                  {t('Set nominees')}
                </NextStepButton>
              }
            </Grid>
          </Grid>
      }
    </>
  );
}
