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

import { AutoDeleteRounded as AutoDeleteRoundedIcon, BlockRounded as BlockRoundedIcon, ExpandMore, PlayCircleOutlined as PlayCircleOutlinedIcon, SettingsApplicationsOutlined as SettingsApplicationsOutlinedIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Button, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress, ShowAddress } from '../../../components';
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
  const [showAction, setShowAction] = useState<boolean | undefined>();
  const [expanded, setExpanded] = useState<string>('roles');
  const [showEditPoolModal, setEditPoolModalOpen] = useState<boolean>(false);

  const handleAccordionChange = useCallback((panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  }, []);

  const handleStateChange = useCallback((state: string) => {
    if (!api) { return; }

    console.log('going to change state to ', state);
    setState(state);
    handleConfirmStakingModalOpen();
  }, [api, handleConfirmStakingModalOpen, setState]);

  const handleEditPool = useCallback(() => {
    console.log('going to edit pool ');
    setState('editPool');
    setEditPoolModalOpen(true);
  }, [setState]);

  useEffect(() => {
    if (!pool) { return; }

    const hasPriviledge = [pool.bondedPool.roles.root, pool.bondedPool.roles.stateToggler].includes(staker.address);

    setShowAction(hasPriviledge);
  }, [api, pool, staker.address]);

  return (
    <Grid container sx={{ px: '25px' }}>
      {api && pool !== undefined
        ? pool
          ? <>
            <Pool api={api} chain={chain} pool={pool} poolsMembers={poolsMembers} />
            <Grid container sx={{ height: showAction && 180, pt: 1 }}>
              <Grid item xs={12}>
                <Accordion disableGutters expanded={expanded === 'roles'} onChange={handleAccordionChange('roles')} sx={{ backgroundColor: grey[200], flexGrow: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore sx={{ fontSize: 15 }} />} sx={{ fontSize: 11 }}>
                    {t('Roles')}
                  </AccordionSummary>
                  <AccordionDetails sx={{ overflowY: 'auto', p: 0 }}>
                    <Grid item xs={12}>
                      <Paper elevation={3} sx={{ p: '10px' }}>
                        {pool.bondedPool.roles.root && <ShowAddress address={pool.bondedPool.roles.root} chain={chain} role={'Root'} />}
                        {pool.bondedPool.roles.depositor && <ShowAddress address={pool.bondedPool.roles.depositor} chain={chain} role={'Depositor'} />}
                        {pool.bondedPool.roles.nominator && <ShowAddress address={pool.bondedPool.roles.nominator} chain={chain} role={'Nominator'} />}
                        {pool.bondedPool.roles.stateToggler && <ShowAddress address={pool.bondedPool.roles.stateToggler} chain={chain} role={'State toggler'} />}
                      </Paper>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
              {!showAction &&
                <Accordion disableGutters expanded={expanded === 'ids'} onChange={handleAccordionChange('ids')} sx={{ backgroundColor: grey[200], flexGrow: 1 }}>
                  <AccordionSummary sx={{ fontSize: 11 }} expandIcon={<ExpandMore sx={{ fontSize: 15 }} />}>
                    {t('Ids')}
                  </AccordionSummary>
                  <AccordionDetails sx={{ overflowY: 'auto', p: 0 }}>
                    <Grid item xs={12}>
                      <Paper elevation={3} sx={{ p: '10px' }}>
                        <ShowAddress address={pool.accounts.stashId} chain={chain} role={'Stash id'} />
                        <ShowAddress address={pool.accounts.rewardId} chain={chain} role={'Reward id'} />
                      </Paper>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              }
            </Grid>
            {showAction &&
              <Grid container item justifyContent='space-between' sx={{ padding: '5px 1px' }} xs={12}>
                <Grid container item xs={8}>
                  <Grid item>
                    <Button
                      disabled={pool?.bondedPool?.state?.toLowerCase() === 'destroying'}
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
                      disabled={['blocked', 'destroying'].includes(pool?.bondedPool?.state?.toLowerCase())}
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
                      disabled={['open', 'destroying'].includes(pool?.bondedPool?.state?.toLowerCase())}
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
                <Grid item>
                  <Button
                    color='warning'
                    disabled={['destroying'].includes(pool?.bondedPool?.state?.toLowerCase())}
                    onClick={handleEditPool}
                    size='medium'
                    startIcon={<SettingsApplicationsOutlinedIcon />}
                    sx={{ textTransform: 'none' }}
                    variant='text'
                  >
                    {t('Edit')}
                  </Button>
                </Grid>
              </Grid>
            }
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
          setEditPoolModalOpen={setEditPoolModalOpen}
          setState={setState}
          showEditPoolModal={showEditPoolModal}
          staker={staker}
          pool={pool}
          setNewPool={setNewPool}
          newPool={newPool}
        />
      }
    </Grid>

  );
}

export default React.memo(PoolTab);
