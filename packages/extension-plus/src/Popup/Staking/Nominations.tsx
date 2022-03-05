// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE here nominated validators are listed, which shows very usefull information/notifications like current active nominator,
 *  oversubscribds, noActive in this era, stuff like that, and also stop/change nomination is provided. */
import { StopCircle as StopCircleIcon, TrackChanges as TrackChangesIcon } from '@mui/icons-material';
import { Button as MuiButton, Grid } from '@mui/material';
import React, { useCallback } from 'react';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import { NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import { ChainInfo, StakingConsts, Validators } from '../../util/plusTypes';
import ValidatorsList from './ValidatorsList';

interface Props {
  activeValidator: DeriveStakingQuery | undefined;
  currentlyStakedInHuman: string | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  stakingConsts: StakingConsts | null;
  noNominatedValidators: boolean;
  chain: Chain;
  chainInfo: ChainInfo;
  validatorsIdentities: DeriveAccountInfo[] | null;
  validatorsInfo: Validators | null;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  handleSelectValidatorsModalOpen: (isSetNominees: boolean) => void;
  handleStopNominating: () => void;
}

export default function Nominations({ activeValidator, chain, chainInfo, currentlyStakedInHuman, handleSelectValidatorsModalOpen, handleStopNominating, noNominatedValidators, nominatedValidators, setState, stakingConsts, state, validatorsIdentities, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const handleSetNominees = useCallback((): void => {
    setState('setNominees');
    handleSelectValidatorsModalOpen(true);
  }, [handleSelectValidatorsModalOpen, setState]);

  return (
    <>
      {nominatedValidators?.length && stakingConsts && !noNominatedValidators
        ? <Grid container sx={{ p: 0 }}>
          <Grid item xs={12}>
            <ValidatorsList
              activeValidator={activeValidator}
              chain={chain}
              chainInfo={chainInfo}
              height={220}
              stakingConsts={stakingConsts}
              validatorsIdentities={validatorsIdentities}
              validatorsInfo={nominatedValidators}
            />
          </Grid>
          <Grid container item justifyContent='space-between' sx={{ padding: '10px 10px 0px' }} xs={12}>
            <Grid item xs={5}>
              <MuiButton
                onClick={handleStopNominating}
                size='medium'
                startIcon={<StopCircleIcon />}
                sx={{ color: 'black', textTransform: 'none' }}
                variant='text'>
                {t('Stop nominating')}
              </MuiButton>
            </Grid>
            <Grid item sx={{ textAlign: 'right' }} xs={6}>
              <MuiButton
                color='warning'
                onClick={() => handleSelectValidatorsModalOpen(false)}
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
            <Grid sx={{ fontSize: 13, margin: '60px 10px 30px', textAlign: 'center' }} xs={12}>
              {t('No nominated validators found')}
            </Grid>
            <Grid item>
              {Number(currentlyStakedInHuman) >= stakingConsts?.minNominatorBond &&
                <NextStepButton
                  data-button-action='Set Nominees'
                  isBusy={validatorsInfo && state === 'setNominees'}
                  onClick={handleSetNominees}
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
