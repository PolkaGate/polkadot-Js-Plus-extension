// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description This component shows my selected pool's information
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '../../../../../extension-chains/src/types';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo } from '../../../util/plusTypes';

import { Grid, Paper } from '@mui/material';
import React, { useEffect, useState } from 'react';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress, ShowAddress } from '../../../components';
import Pool from './Pool';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  staker: AccountsBalanceType;
  myPool: MyPoolInfo | undefined | null;
  poolsMembers: MembersMapEntry[] | undefined
}

function PoolTab({ api, chain, myPool, poolsMembers }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [points, setPoints] = useState<string | undefined>();

  const balance = myPool?.rewardPool && api ? api.createType('Balance', myPool.rewardPool.balance) : undefined;
  const totalEarnings = myPool?.rewardPool && api ? api.createType('Balance', myPool.rewardPool.totalEarnings) : undefined;
  const staked = myPool?.ledger && api ? api.createType('Balance', myPool.ledger.active) : undefined;
  const rewardClaimable = myPool?.rewardClaimable && api ? api.createType('Balance', myPool.rewardClaimable) : undefined;

  useEffect(() => {
    if (!(api && myPool)) return;

    let poolPoints = myPool.rewardPool.points ?? 0;

    if (poolPoints) {
      const temp = api.createType('Balance', poolPoints).toHuman();
      const token = api.registry.chainTokens[0];

      poolPoints = temp.replace(token, '');
    }

    setPoints(poolPoints);
  }, [api, myPool]);

  return (
    <Grid container sx={{ px: '25px' }}>
      {api && myPool !== undefined
        ? myPool
          ? <>
            <Pool api={api} chain={chain} pool={myPool} poolsMembers={poolsMembers} showAction />

            <Grid item sx={{ fontSize: 12, p: '25px 10px 5px' }} xs={12}>
              {t('Roles')}
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: '10px' }}>
                <ShowAddress address={myPool.bondedPool.roles.root} chain={chain} role={'Root'} />
                <ShowAddress address={myPool.bondedPool.roles.depositor} chain={chain} role={'Depositor'} />
                <ShowAddress address={myPool.bondedPool.roles.nominator} chain={chain} role={'Nominator'} />
                <ShowAddress address={myPool.bondedPool.roles.stateToggler} chain={chain} role={'State toggler'} />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ px: '10px' }}>
                <ShowAddress address={myPool.accounts.stashId} chain={chain} role={'Stash id'} />
                <ShowAddress address={myPool.accounts.rewardId} chain={chain} role={'Reward id'} />
              </Paper>
            </Grid>
          </>
          : <Grid item sx={{ fontSize: 12, pt: 7, textAlign: 'center' }} xs={12}>
            {t('No active pool found')}
          </Grid>
        : <Progress title={t('Loading ...')} />
      }
    </Grid>

  );
}

export default React.memo(PoolTab);