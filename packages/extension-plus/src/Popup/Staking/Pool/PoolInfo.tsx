// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 *  this component shows a pool's info in a page including its members/roles list and links to subscan
 * */

import type { MembersMapEntry, MyPoolInfo } from '../../../util/plusTypes';

import { BubbleChart as BubbleChartIcon } from '@mui/icons-material';
import { Container, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useMemo } from 'react';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';
import Identicon from '@polkadot/react-identicon';
import { BN } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShortAddress, ShowAddress } from '../../../components';
import { SELECTED_COLOR } from '../../../util/constants';
import getPoolAccounts from '../../../util/getPoolAccounts';
import Pool from './Pool';

interface Props {
  chain: Chain;
  api: ApiPromise;
  showPoolInfo: boolean;
  handleMorePoolInfoClose: () => void;
  setShowPoolInfo: Dispatch<SetStateAction<boolean>>;
  pool: MyPoolInfo | undefined;
  poolId: BN;
  poolsMembers: MembersMapEntry[] | undefined
}

export default function PoolInfo({ api, chain, handleMorePoolInfoClose, pool, poolId, poolsMembers, setShowPoolInfo, showPoolInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const staked = (pool?.ledger || pool?.bondedPool?.points) && api ? api.createType('Balance', pool?.ledger?.active || pool?.bondedPool?.points) : undefined;
  const myPoolMembers = poolsMembers && pool ? poolsMembers[poolId] : undefined;
  const roleIds = useMemo(() => Object.values(pool?.bondedPool?.roles), [pool]);

  return (
    <Popup handleClose={handleMorePoolInfoClose} id='scrollArea' showModal={showPoolInfo}>
      <PlusHeader action={handleMorePoolInfoClose} chain={chain} closeText={'Close'} icon={<BubbleChartIcon fontSize='small' />} title={'Pool Info'} />
      <Container sx={{ p: '0px 20px' }}>
        <Pool api={api} chain={chain} pool={pool} poolsMembers={poolsMembers} showIds showMore={false} showRoles showRewards />
        <Grid item xs={12} sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, textAlign: 'center', p: '10px 0px 1px' }}>
          {t('Members')} ({myPoolMembers?.length ?? 0})
        </Grid>
        <Grid item sx={{ bgcolor: 'background.paper', height: '200px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%', p: '10px 15px' }} xs={12}>
          {myPoolMembers?.map(({ accountId, member }, index) => {
            const points = api.createType('Balance', member.points); // FIXME: it is pointsnot balance!!

            return (
              <Paper elevation={2} key={index} sx={{ bgcolor: roleIds.includes(String(accountId)) ? SELECTED_COLOR : '', my: 1, p: '1px' }}>
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
