// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component shows a validator's info in a page including its nominators listand a link to subscan
 * */

import { BubbleChart as BubbleChartIcon } from '@mui/icons-material';
import { Avatar, Container, Divider, Grid, Link, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShortAddress } from '../../../components';
import { AccountsBalanceType } from '../../../util/plusTypes';
import Identity from '../../components/Identity';
import { SELECTED_COLOR } from '../../util/constants';
import getLogo from '../../util/getLogo';

interface Props {
  chain: Chain;
  api: ApiPromise;
  info: any;
  staker?: AccountsBalanceType;
  showPoolInfo: boolean;
  handleMorePoolInfoClose: () => void;
}

export default function ShowPool({ api, chain, handleMorePoolInfoClose, info, showPoolInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <Popup handleClose={handleMorePoolInfoClose} id='scrollArea' showModal={showPoolInfo}>
      <PlusHeader action={handleMorePoolInfoClose} chain={chain} closeText={'Close'} icon={<BubbleChartIcon fontSize='small' />} title={'Pool Info'} />
      <Container sx={{ p: '0px 20px' }}>
        <Grid item sx={{ p: 1 }} xs={12}>
          <Paper elevation={3}>
            <Grid container item justifyContent='flex-start' sx={{ fontSize: 12, p: '20px 10px 20px', textAlign: 'center' }}>

              <Grid item sx={{ py: 1, textAlign: 'left' }} xs={12}>
                <b>{t('Root')}</b>{': '}{info.bondedPools.roles.root}
              </Grid>
              <Grid item sx={{ p: '10px 0px 20px' }} xs={12}>
                <Divider />
              </Grid>
              <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={12}>
                {t('Depositor')}{': '}{info.bondedPools.roles.depositor}
              </Grid>
              <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={12}>
                {t('Nominator')}{': '}{info.bondedPools.roles.nominator}
              </Grid>
              <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={12}>
                {t('State Toggler')}{': '}{info.bondedPools.roles.stateToggler}
              </Grid>
              <Grid item sx={{ p: '10px 0px 20px' }} xs={12}>
                <Divider />
              </Grid>
              <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={4}>
                {t('Balance')}{': '}{info.rewardPools.balance}
              </Grid>
              <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={4}>
                {t('Points')}{': '}{info.rewardPools.points}
              </Grid>
              <Grid item sx={{ pb: 1, textAlign: 'left' }} xs={4}>
                {t('Total earnings')}{': '}{info.rewardPools.totalEarnings}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid container item justifyContent='center' spacing={1} xs={12}>
          <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, textAlign: 'center', p: '10px 0px 5px' }}>
            {t('Pool members')}
          </Grid>
          <Grid item sx={{ fontSize: 12 }}>
            ({info.bondedPools.memberCounter})
          </Grid>
        </Grid>
        {/* <Grid item sx={{ bgcolor: 'background.paper', height: '300px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%', p: 2 }} xs={12}>
          {sortedNominators.map(({ value, who }, index) => {
            const staked = api.createType('Balance', value);

            return (
              <Paper elevation={2} key={index} sx={{ bgcolor: index === myIndex ? SELECTED_COLOR : '', my: 1, p: '5px' }}>
                <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12 }}>
                  <Grid item xs={1}>
                    <Identicon
                      prefix={chain?.ss58Format ?? 42}
                      size={30}
                      theme={chain?.icon || 'polkadot'}
                      value={who}
                    />
                  </Grid>
                  <Grid item sx={{ textAlign: 'left' }} xs={6}>
                    <ShortAddress address={who} charsCount={8} fontSize={12} />
                  </Grid>
                  <Grid item sx={{ textAlign: 'right' }} xs={5}>
                    {staked.toHuman()}
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Grid> */}
      </Container>
    </Popup>
  );
}
