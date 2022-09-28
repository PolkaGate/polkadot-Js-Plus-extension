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

import { AutoDeleteRounded as AutoDeleteRoundedIcon, BlockRounded as BlockRoundedIcon, PlayCircleOutlined as PlayCircleOutlinedIcon, Output as OutputIcon, SettingsApplicationsOutlined as SettingsApplicationsOutlinedIcon } from '@mui/icons-material';
import { Button, Divider, Grid, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState, useMemo } from 'react';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../../components';
import EditPool from './EditPool';
import Pool from './Pool';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  staker: AccountsBalanceType;
  pool: MyPoolInfo | undefined | null;
  poolsMembers: MembersMapEntry[] | undefined;
  setState: React.Dispatch<React.SetStateAction<string>>;
  handleConfirmStakingModalOpen: () => void;
  setNewPool: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>;
  newPool: MyPoolInfo | undefined;
}

function PoolTab({ api, chain, handleConfirmStakingModalOpen, newPool, pool, poolsMembers, setNewPool, setState, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [canChangePoolState, setCanChangePoolState] = useState<boolean | undefined>();
  const [canEditPool, setCanEditPool] = useState<boolean | undefined>();
  const [showEditPoolModal, setEditPoolModalOpen] = useState<boolean>(false);
  const canCickAll = useMemo(() => pool?.bondedPool && staker?.address && [String(pool.bondedPool.roles.root), String(pool.bondedPool.roles.stateToggler)].includes(staker.address), [staker?.address, pool]);

  const handleStateChange = useCallback((state: string) => {
    if (!api) { return; }

    setState(state);
    handleConfirmStakingModalOpen();
  }, [api, handleConfirmStakingModalOpen, setState]);

  const handleKickAll = useCallback(() => {
    handleStateChange('kickAll');
  }, [handleStateChange]);

  const handleEditPool = useCallback(() => {
    setState('editPool');
    setEditPoolModalOpen(true);
  }, [setState]);

  useEffect(() => {
    if (!pool) { return; }

    const canChangeState = pool?.bondedPool && staker?.address && [String(pool.bondedPool.roles.root), String(pool.bondedPool.roles.stateToggler)].includes(staker.address);
    const canEdit = pool?.bondedPool && staker?.address && String(pool.bondedPool.roles.root) === staker.address;

    setCanChangePoolState(!!canChangeState);
    setCanEditPool(!!canEdit);
  }, [api, pool, staker.address]);

  return (
    <Grid container px='5px'>
      {api && pool !== undefined
        ? pool
          ? <>
            <Pool api={api} chain={chain} pool={pool} poolsMembers={poolsMembers} showIds={!canChangePoolState && !canEditPool} showRoles />
            <Grid container item justifyContent='space-between' sx={{ p: '15px 1px' }} xs={12}>
              {canChangePoolState &&
                <Grid container item xs={8}>
                  <Grid item>
                    <Button
                      disabled={pool?.bondedPool?.state && String(pool.bondedPool.state).toLowerCase() === 'destroying'}
                      onClick={() => handleStateChange('destroying')}
                      size='small'
                      startIcon={<AutoDeleteRoundedIcon fontSize='small' />}
                      sx={{ color: 'red', textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Destroy')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      disabled={['blocked', 'destroying'].includes(String(pool?.bondedPool?.state).toLowerCase())}
                      onClick={() => handleStateChange('blocked')}
                      size='small'
                      startIcon={<BlockRoundedIcon />}
                      sx={{ color: 'black', textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Block')}
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      color='warning'
                      disabled={['open', 'destroying'].includes(String(pool?.bondedPool?.state).toLowerCase())}
                      onClick={() => handleStateChange('open')}
                      size='small'
                      startIcon={<PlayCircleOutlinedIcon />}
                      sx={{ textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Open')}
                    </Button>
                  </Grid>
                </Grid>
              }
              {canCickAll &&
                <>
                  <Grid item>
                    <Divider orientation='vertical' />
                  </Grid>
                  <Grid item>
                    <Button
                      color='warning'
                      disabled={['open'].includes(String(pool?.bondedPool?.state).toLowerCase())}
                      onClick={handleKickAll}
                      size='medium'
                      startIcon={<OutputIcon />}
                      sx={{ textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Kick all')}
                    </Button>
                  </Grid>
                </>}
              {canEditPool &&
                <>
                  <Grid item>
                    <Divider orientation='vertical' />
                  </Grid>
                  <Grid item>
                    <Button
                      color='warning'
                      disabled={['destroying'].includes(String(pool?.bondedPool?.state).toLowerCase())}
                      onClick={handleEditPool}
                      size='medium'
                      startIcon={<SettingsApplicationsOutlinedIcon />}
                      sx={{ textTransform: 'none' }}
                      variant='text'
                    >
                      {t('Edit')}
                    </Button>
                  </Grid>
                </>}
            </Grid>
          </>
          : <Grid item sx={{ fontSize: 12, pt: 7, textAlign: 'center' }} xs={12}>
            {t('No active pool found')}
          </Grid>
        : <Progress title={t('Loading ...')} />
      }
      {showEditPoolModal && pool &&
        <EditPool
          api={api}
          chain={chain}
          handleConfirmStakingModalOpen={handleConfirmStakingModalOpen}
          newPool={newPool}
          pool={pool}
          setEditPoolModalOpen={setEditPoolModalOpen}
          setNewPool={setNewPool}
          setState={setState}
          showEditPoolModal={showEditPoolModal}
        />
      }
    </Grid>

  );
}

export default React.memo(PoolTab);