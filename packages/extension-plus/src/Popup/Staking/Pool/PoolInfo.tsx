// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component shows a validator's info in a page including its nominators listand a link to subscan
 * */

import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo } from '../../../util/plusTypes';

import { BubbleChart as BubbleChartIcon } from '@mui/icons-material';
import { Container, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback } from 'react';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShortAddress, ShowAddress } from '../../../components';
import { SELECTED_COLOR } from '../../../util/constants';
import Pool from './Pool';

interface Props {
  chain: Chain;
  api: ApiPromise;
  showPoolInfo: boolean;
  handleMorePoolInfoClose: () => void;
  setShowPoolInfo: Dispatch<SetStateAction<boolean>>;
  pool: MyPoolInfo | undefined;
  poolsMembers: MembersMapEntry[][] | undefined
}

export default function PoolInfo({ api, chain, handleMorePoolInfoClose, pool, poolsMembers, setShowPoolInfo, showPoolInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chainName = chain?.name.replace(' Relay Chain', '');
  const poolId = pool?.poolId ?? pool?.member?.poolId;
  const staked = pool?.ledger && api ? api.createType('Balance', pool.ledger.active) : undefined;

  const myPoolMembers = poolsMembers && pool ? poolsMembers[pool.member.poolId] : undefined;
  console.log('myPoolMembers:', myPoolMembers);

  return (
    <Popup handleClose={handleMorePoolInfoClose} id='scrollArea' showModal={showPoolInfo}>
      <PlusHeader action={handleMorePoolInfoClose} chain={chain} closeText={'Close'} icon={<BubbleChartIcon fontSize='small' />} title={'Validator Info'} />
      <Container sx={{ p: '0px 20px' }}>
        <Grid item sx={{ p: 1 }} xs={12}>

          <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 0px 5px 5px', width: '100%' }}>
            <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
              <Grid item sx={{ textAlign: 'center' }} xs={1}>
                {t('Index')}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={4}>
                {t('Name')}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={1}>
                {t('State')}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={4}>
                {t('Staked')}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={2}>
                {t('Members')}
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ backgroundColor: grey[100], mt: '4px', p: '1px 0px 2px 5px', width: '100%' }}>
            <Grid alignItems='center' container sx={{ fontSize: 12 }}>
              <Grid item sx={{ textAlign: 'center' }} xs={1}>
                {String(poolId)}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={4}>
                {pool.metadata ?? t('no name')}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={1}>
                {pool.bondedPool.state}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={4}>
                {staked?.toHuman() ?? 0}
              </Grid>
              <Grid item sx={{ textAlign: 'center' }} xs={2}>
                {pool.bondedPool.memberCounter}
              </Grid>
            </Grid>
          </Paper>


          <Grid item xs={12} sx={{ fontSize: 12, p: '25px 10px 10px' }}>
            {t('Roles')}
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={3}>
              <Grid container item justifyContent='flex-start' sx={{ fontSize: 11, p: '10px', textAlign: 'center' }}>
                <Grid item xs={12}>
                  <ShowAddress address={pool.bondedPool.roles.root} chain={chain} role={'Root'} />
                </Grid>
                <Grid item xs={12}>
                  <ShowAddress address={pool.bondedPool.roles.depositor} chain={chain} role={'Depositor'} />
                </Grid>
                <Grid item xs={12}>
                  <ShowAddress address={pool.bondedPool.roles.nominator} chain={chain} role={'Nominator'} />
                </Grid>
                <Grid item xs={12}>
                  <ShowAddress address={pool.bondedPool.roles.stateToggler} chain={chain} role={'State toggler'} />
                </Grid>
                <Grid item xs={12}>
                  <ShowAddress address={pool.accounts.stashId} chain={chain} role={'Stash id'} />
                </Grid>
                <Grid item xs={12}>
                  <ShowAddress address={pool.accounts.rewardId} chain={chain} role={'Reward id'} />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

        </Grid>

        <Grid container item justifyContent='center' spacing={1} xs={12}>
          <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, textAlign: 'center', p: '10px 0px 5px' }}>
            {t('Members')}
          </Grid>
          <Grid item sx={{ fontSize: 12 }}>
            ({myPoolMembers?.length ?? 0})
          </Grid>
        </Grid>
        <Grid item sx={{ bgcolor: 'background.paper', height: '300px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%', p: 2 }} xs={12}>
          {myPoolMembers.map(({ accountId, member }, index) => {
            const points = api.createType('Balance', member.points); // TFIXME: it is pointsnot balance!!

            return (
              <Paper elevation={2} key={index} sx={{ bgcolor: String(pool?.bondedPool?.roles).includes[String(accountId)] ? SELECTED_COLOR : '', my: 1, p: '5px' }}>
                <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12 }}>
                  <Grid item xs={1}>
                    <Identicon
                      prefix={chain?.ss58Format ?? 42}
                      size={30}
                      theme={chain?.icon || 'polkadot'}
                      value={accountId}
                    />
                  </Grid>
                  <Grid item sx={{ textAlign: 'left' }} xs={6}>
                    <ShortAddress address={accountId} charsCount={8} fontSize={12} />
                  </Grid>
                  <Grid item sx={{ textAlign: 'right' }} xs={5}>
                    {points.toHuman()}
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Grid>
      </Container>
    </Popup>
  );
}
