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

import { AutoDeleteRounded as AutoDeleteRoundedIcon, BlockRounded as BlockRoundedIcon, ExpandMore, PlayArrowRounded as PlayArrowRoundedIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Button, Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { Progress, ShowAddress } from '../../../components';
import Pool from './Pool';

interface Props {
  chain: Chain;
  api: ApiPromise | undefined;
  staker: AccountsBalanceType;
  pool: MyPoolInfo | undefined | null;
  poolsMembers: MembersMapEntry[] | undefined;
  setState: React.Dispatch<React.SetStateAction<string>>;
  handleConfirmStakingModaOpen: () => void;
}

function PoolTab({ api, chain, handleConfirmStakingModaOpen, pool, poolsMembers, setState, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showAction, setShowAction] = useState<boolean | undefined>();
  const [expanded, setExpanded] = useState<string>('roles');

  const handleAccordionChange = useCallback((panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  }, []);

  const handleStateChange = useCallback((state: string) => {
    if (!api) return;

    console.log('going to change state to ', state);
    setState(state);
    handleConfirmStakingModaOpen();
  }, [api, handleConfirmStakingModaOpen, setState]);

  useEffect(() => {
    if (!pool) return;

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
                        <ShowAddress address={pool.bondedPool.roles.root} chain={chain} role={'Root'} />
                        <ShowAddress address={pool.bondedPool.roles.depositor} chain={chain} role={'Depositor'} />
                        <ShowAddress address={pool.bondedPool.roles.nominator} chain={chain} role={'Nominator'} />
                        <ShowAddress address={pool.bondedPool.roles.stateToggler} chain={chain} role={'State toggler'} />
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
              <Grid container item justifyContent='space-between' sx={{ padding: '5px 10px' }} xs={12}>
                <Grid item>
                  <Button
                    disabled={pool?.bondedPool?.state?.toLowerCase() === 'destroying'}
                    onClick={() => handleStateChange('destroying')}
                    size='medium'
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
                    size='medium'
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
                    size='medium'
                    startIcon={<PlayArrowRoundedIcon />}
                    sx={{ textTransform: 'none' }}
                    variant='text'
                  >
                    {t('Open')}
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
    </Grid>

  );
}

export default React.memo(PoolTab);
