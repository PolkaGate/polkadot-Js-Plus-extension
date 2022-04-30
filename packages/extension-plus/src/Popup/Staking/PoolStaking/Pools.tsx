// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description 
 * 
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { MoreVert as MoreVertIcon, Add as AddIcon, AddCircleOutline as AddCircleOutlineIcon } from '@mui/icons-material';
import { Box, Button, Button as MuiButton, Checkbox, FormControlLabel, Grid, Paper } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Hint, Progress } from '../../../components';
import { AccountsBalanceType, PutInFrontInfo, RebagInfo, StakingConsts, Validators } from '../../util/plusTypes';
import { grey } from '@mui/material/colors';
import PoolInfo from './PoolInfo';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  poolsInfo: any | undefined;
  staker: AccountsBalanceType;
}

export default function Nominations({ api, chain, poolsInfo, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [info, setInfo] = useState(undefined);
  const [showPoolInfo, setShowPoolInfo] = useState(false);

  const handleMorePoolInfoOpen = useCallback((i) => {
    setInfo(i);
    setShowPoolInfo(true);
  }, []);

  const handleMorePoolInfoClose = useCallback((i) => {
    setInfo(undefined);
    setShowPoolInfo(false);
  }, []);


  return (
    <Grid container sx={{ p: 0 }}>
      {!!poolsInfo?.length && api
        ?
        <>
          <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 15px 5px', width: '100%' }}>
            <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
              <Grid alignItems='center' item xs={1}>
                {t('More')}
              </Grid>
              <Grid item sx={{ textAlign: 'left' }} xs={1}>
                {t('Index')}
              </Grid>
              <Grid item sx={{ textAlign: 'left' }} xs={3}>
                {t('Name')}
              </Grid>
              <Grid item sx={{ textAlign: 'left' }} xs={1}>
                {t('state')}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={3}>
                {t('Points')}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={2}>
                {t('Members')}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={1}>
                {t('Join')}
              </Grid>
            </Grid>
          </Paper>
          <Box sx={{ bgcolor: 'background.paper', height: 200, overflowY: 'auto', scrollbarWidth: 'none', width: '100%' }}>
            <Grid id='body' item xs={12}>
              {poolsInfo.map((p, index: number) => {
                const points = api.createType('Balance', p.bondedPools.points);

                return (
                  <Paper elevation={2} key={index} sx={{ backgroundColor: '', borderRadius: '10px', mt: '4px', p: '1px 10px 2px 0px' }}>
                    <Grid alignItems='center' container sx={{ fontSize: 11 }}>

                      <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={1}>
                        <MoreVertIcon fontSize='small' onClick={() => handleMorePoolInfoOpen(p)} sx={{ cursor: 'pointer' }} />
                      </Grid>
                      <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={1}>
                        {index + 1}
                      </Grid>
                      <Grid alignItems='center' item sx={{ textAlign: 'left' }} xs={3}>
                        {p.metadata}
                      </Grid>
                      <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={1}>
                        {p.bondedPools.state}
                      </Grid>
                      <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={3}>
                        {points.toHuman()}
                      </Grid>
                      <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={2}>
                        {p.bondedPools.memberCounter}
                      </Grid>
                      <Grid alignItems='center' item sx={{ textAlign: 'center' }} xs={1}>
                        <AddIcon color='warning' fontSize='small' sx={{ cursor: 'pointer' }} />
                      </Grid>
                    </Grid>
                  </Paper>
                );
              }
              )}
            </Grid>
          </Box>

          <Grid container item justifyContent='space-between' sx={{ padding: '5px 10px 0px' }} xs={12}>
            <Grid item sx={{ fontSize: 13, textAlign: 'left' }}>
              <FormControlLabel
                control={<Checkbox
                  color='default'
                  defaultChecked
                  // onChange={filterOverSubscribeds}
                  size='small'
                />
                }
                label={<Box fontSize={12} sx={{ whiteSpace: 'nowrap' }}>{t('Show only my pools')}</Box>}
              />
            </Grid>

            <Grid item>
              <Button
                // onClick={handleStopNominating}
                color='warning'
                size='medium'
                startIcon={<AddCircleOutlineIcon />}
                sx={{ textTransform: 'none' }}
                variant='text'
              >
                {t('Add pool')}
              </Button>
            </Grid>
          </Grid>
        </>
        : <Progress title={t('Loading pools ....')} />
      }
      {showPoolInfo && info &&
        <PoolInfo
          api={api}
          chain={chain}
          handleMorePoolInfoClose={handleMorePoolInfoClose} 
          info={info}
          showPoolInfo={showPoolInfo}
        />
      }
    </Grid>

  );
}
