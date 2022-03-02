// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description this component shows an individual validators info in a row in a table shape 
 * */

import type { AccountId } from '@polkadot/types/interfaces';

import { DirectionsRun as DirectionsRunIcon, MoreVert as MoreVertIcon, ReportProblemOutlined as ReportProblemOutlinedIcon } from '@mui/icons-material';
import { Grid, IconButton, Paper, Switch } from '@mui/material';
import React from 'react';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';

import { ShortAddress } from '../../components';
import Hint from '../../components/Hint';
import Identity from '../../components/Identity';
import { StakingConsts } from '../../util/plusTypes';

interface Props {
  key: number;
  chain: Chain;
  stakingConsts: StakingConsts | null;
  validator: DeriveStakingQuery;
  showSwitch?: boolean;
  handleSwitched?: (arg0: React.MouseEvent<unknown>, arg1: DeriveStakingQuery) => void;
  handleMoreInfo: (arg0: DeriveStakingQuery) => void;
  isSelected?: (arg0: DeriveStakingQuery) => boolean;
  isInNominatedValidators?: (arg0: DeriveStakingQuery) => boolean;
  validatorsIdentities: DeriveAccountInfo[] | null;
  activeValidator?: DeriveStakingQuery;
}

export default function showValidator({ activeValidator, chain, handleMoreInfo, handleSwitched, isInNominatedValidators, isSelected, key, showSwitch = false, stakingConsts, validator, validatorsIdentities }: Props) {
  const isItemSelected = isSelected && isSelected(validator);
  const rowBackground = isInNominatedValidators && (isInNominatedValidators(validator) ? '#fffbed' : '');
  const getAccountInfo = (id: AccountId): DeriveAccountInfo => validatorsIdentities?.find((v) => v.accountId === id);
  const nominatorCount = validator.exposure.others.length;
  const isActive = validator.accountId === activeValidator?.accountId;
  const isOverSubscribed = validator.exposure.others.length > stakingConsts.maxNominatorRewardedPerValidator;

  return (
    <Paper elevation={2} key={key} sx={{ backgroundColor: rowBackground, borderRadius: '10px', margin: '5px 0px 1px', p: '1px' }}>
      <Grid alignItems='center' container sx={{ fontSize: 11 }}>

        <Grid alignItems='center' item xs={1}>
          <IconButton aria-label='more info' component='span' onClick={() => handleMoreInfo(validator)}>
            <MoreVertIcon fontSize={showSwitch ? 'medium' : 'small'} />
          </IconButton>
        </Grid>

        <Grid item sx={{ fontSize: 11 }} xs={showSwitch ? 6 : 5}>
          {validatorsIdentities
            ? <Identity
              accountInfo={getAccountInfo(validator?.accountId)}
              chain={chain}
              iconSize={showSwitch ? 24 : 20}
              totalStaked={validator.exposure.total && showSwitch ? `Total staked: ${Number(validator.exposure.total).toLocaleString()}` : ''}
            />
            : <ShortAddress address={String(validator?.accountId)} />
          }
        </Grid>

        {!showSwitch &&
          <Grid item sx={{ textAlign: 'left' }} xs={2}>
            {validator.exposure.total ? Number(validator.exposure.total).toLocaleString() : ''}
          </Grid>
        }

        <Grid item sx={{ textAlign: 'center' }} xs={2}>
          {Number(validator.validatorPrefs.commission) === 1 ? 0 : Number(validator.validatorPrefs.commission) / (10 ** 7)}%
        </Grid>

        <Grid alignItems='center' item xs={2}>
          <Grid item sx={{ textAlign: 'center' }} xs={6}>
            {!!nominatorCount &&
              <>
                {isActive &&
                  <Hint id='active' place='left' tip='Active'>
                    <DirectionsRunIcon color='primary' sx={{ fontSize: '20px' }} />
                  </Hint>
                }
                {isOverSubscribed &&
                  <Hint id='oversubscribed' place='left' tip='Oversubscribed'>
                    <ReportProblemOutlinedIcon color='warning' sx={{ fontSize: '20px' }} />
                  </Hint>
                }
              </>}
          </Grid>
          <Grid item sx={{ textAlign: 'center' }} xs={6}>
            {nominatorCount || 'waiting'}
          </Grid>
        </Grid>

        {showSwitch && <Grid item xs={1}>
          <Switch checked={isItemSelected} color='warning' onChange={(e) => handleSwitched(e, validator)} size='small' />
        </Grid>
        }

      </Grid>
    </Paper>
  );
}
