// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here a pool privileged user can kick all members
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';
import type { ThemeProps } from '../../../../../extension-ui/src/types';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo } from '../../../util/plusTypes';

import { Output as OutputIcon } from '@mui/icons-material';
import { Button, Grid, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShowValue } from '../../../components';
import { remainingTimeCountDown } from '../../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  className?: string;
  chain: Chain;
  setKickAllModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  setState: React.Dispatch<React.SetStateAction<string>>;
  showKickAllModal: boolean;
  handleConfirmStakingModalOpen: () => void;
  pool: MyPoolInfo;
  poolsMembers: MembersMapEntry[] | undefined
  staker: AccountsBalanceType;
}

interface SessionIfo {
  eraLength: number;
  eraProgress: number;
  currentEra: number;
}

interface MemberPoint {
  accountId: string;
  points: BN;
}

const steps = ['Unbound All', 'Wait', 'Kick All'];
const STEP_MAP = { UNBOUND: 0, WAIT: 1, KICK: 2 };

function KickAll({ api, chain, handleConfirmStakingModalOpen, pool, poolsMembers, setKickAllModalOpen, setState, showKickAllModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});
  const [remainingSecondsToKickAll, setRemainingSecondsToKickAll] = useState<number>();// in seconds
  const [sessionInfo, setSessionInfo] = useState<SessionIfo>();
  const [kickEraIndex, setKickEraIndex] = useState<number>();

  const resetPage = useCallback(() => {
    setActiveStep(STEP_MAP.UNBOUND);
    setCompleted({});
  }, []);

  const members = useMemo(() => {
    if (!poolsMembers) {
      return false;
    }

    return poolsMembers[pool.poolId]?.map((m) => ({ accountId: m.accountId, points: m.member.points }));
  }, [pool, poolsMembers]);

  const needsUnboundAll = useMemo(() => {
    if (!members) {
      return false;
    }

    const allMembersPoints = members.reduce((sum: BN, { points }) => sum.add(points), BN_ZERO);
    const myPoint = members.find((m) => m.accountId === staker.address)?.points ?? BN_ZERO;

    console.log('members', members)
    console.log('allMembersPoints.sub(myPoint)', allMembersPoints.sub(myPoint).toString())

    return !allMembersPoints.sub(myPoint).isZero();
  }, [members, staker?.address]);

  useEffect(() => {
    if (!members) {
      return;
    }

    let latestEra = 0;
    const aRandomMember = members.find((m) => m.accountId !== staker.address);

    aRandomMember && api && api.query.nominationPools.poolMembers(aRandomMember.accountId).then((m) => {
      const member = m?.isSome ? m.unwrap() : undefined;

      const unbondingEras = JSON.parse(JSON.stringify(member.unbondingEras));

      for (const [era, _] of Object.entries(unbondingEras)) {
        if (Number(era) > latestEra) {
          latestEra = Number(era);
        }
      }

      setKickEraIndex(latestEra);
    });
  }, [api, members, staker]);

  useEffect(() => {
    if (needsUnboundAll) {
      return setActiveStep(STEP_MAP.UNBOUND);
    }

    setCompleted((pre) => {
      pre[STEP_MAP.UNBOUND] = true;

      return completed;
    });

    if (sessionInfo && kickEraIndex && sessionInfo?.currentEra < kickEraIndex) {
      return setActiveStep(STEP_MAP.WAIT);
    }

    if (sessionInfo && kickEraIndex && sessionInfo?.currentEra >= kickEraIndex) {
      setActiveStep(STEP_MAP.KICK);
      setCompleted((pre) => {
        pre[STEP_MAP.WAIT] = true;

        return completed;
      });
    }
  }, [completed, kickEraIndex, needsUnboundAll, sessionInfo, sessionInfo?.currentEra]);

  useEffect(() => {
    api && api.rpc.chain.getFinalizedHead().then((at) => {
      api.at(at).then(async (apiAt) => {
        const sessionsPerEra = apiAt.consts.staking.sessionsPerEra.toNumber();
        const sessionDuration = apiAt.consts.babe.epochDuration.toNumber();
        const expectedBlockTime = api.consts.babe.expectedBlockTime.toNumber();
        const sessionDurationInSeconds = sessionDuration * expectedBlockTime / 1000;
        const currentSessionIndex = await api.query.session.currentIndex();
        console.log('sessionsPerEra:', Number(sessionsPerEra));
        console.log('currentSessionIndex:', Number(currentSessionIndex));

        const sessionInfo = await api.derive.session?.progress();
        const activeEraStart = sessionInfo?.activeEraStart.unwrapOr(null);

        console.log('sessionInfo:', JSON.parse(JSON.stringify(sessionInfo)));
        console.log('activeEraStart:', activeEraStart);
        console.log('sessionInfo.sessionLength:', Number(sessionInfo.sessionLength));
        console.log('sessionInfo.activeEra:', Number(sessionInfo.activeEra));
        console.log('sessionInfo.eraLength:', Number(sessionInfo.eraLength));
        console.log('sessionInfo.sessionProgress:', Number(sessionInfo.sessionProgress));
        console.log('sessionInfo.sessionsPerEra:', Number(sessionInfo.sessionsPerEra));
        console.log('sessionInfo.eraProgress:', Number(sessionInfo.eraProgress));
        console.log('sessionInfo.activeEraStart:', Number(sessionInfo.activeEraStart));
        console.log('sessionInfo.currentEra:', Number(sessionInfo.currentEra));
        console.log('sessionInfo.currentIndex:', Number(sessionInfo.currentIndex));
      }).catch(console.error);
    }).catch(console.error);
  }, [api]);

  useEffect(() => {
    api && api.derive.session?.progress().then((sessionInfo) => {
      setSessionInfo({
        currentEra: Number(sessionInfo.currentEra),
        eraLength: Number(sessionInfo.eraLength),
        eraProgress: Number(sessionInfo.eraProgress)
      });
    }).catch(console.error);
  }, [api]);

  useEffect(() => {
    if (!sessionInfo || !kickEraIndex) {
      return;
    }

    if (sessionInfo.currentEra >= kickEraIndex) {
      return setRemainingSecondsToKickAll(0);
    }

    const diff = kickEraIndex - sessionInfo.currentEra;

    setRemainingSecondsToKickAll(((diff - 1) * sessionInfo.eraLength + (sessionInfo.eraLength - sessionInfo.eraProgress)) * 6);
  }, [kickEraIndex, sessionInfo]);

  useEffect((): void => {
    remainingSecondsToKickAll && remainingSecondsToKickAll > 0 && setTimeout(() => setRemainingSecondsToKickAll((remainingSecondsToKickAll) => remainingSecondsToKickAll - 1), 1000);
  }, [remainingSecondsToKickAll]);

  const handleKickAllModalClose = useCallback(() => {
    setKickAllModalOpen(false);
    setState('');
  }, [setKickAllModalOpen, setState]);

  const handleKickAll = useCallback((state: string) => {
    setKickAllModalOpen(false);
    setState(state);
    handleConfirmStakingModalOpen();
  }, [handleConfirmStakingModalOpen, setKickAllModalOpen, setState]);

  return (
    <>
      <Popup handleClose={handleKickAllModalClose} showModal={showKickAllModal}>
        <PlusHeader action={handleKickAllModalClose} chain={chain} closeText={'Close'} icon={<OutputIcon fontSize='small' />} title={'Kick All'} />
        <Grid item sx={{ bgcolor: grey[200], borderBottom: 1, borderColor: 'divider', p: '25px 15px' }} xs={12}>
          <Stepper activeStep={activeStep} nonLinear>
            {steps.map((label, index) =>
              <Step completed={completed[index]} key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            )}
          </Stepper>
        </Grid>
        <Grid container sx={{ p: '20px 30px' }}>
          <Typography sx={{ py: '20px' }} variant='body1'>
            {t('You are going to kicking all members out, which needs two actions.')}
          </Typography>
          <Typography sx={{ p: '20px 10px 20px' }} variant='subtitle2'>
            {t('1. Unbound all members')}:
          </Typography>
          <Grid container justifyContent='center'>
            <Button
              color='warning'
              disabled={!needsUnboundAll}
              onClick={() => handleKickAll('unboundAll')}
              sx={{ textTransform: 'none', width: '50%' }}
              variant='contained'
            >
              {needsUnboundAll ? t('Unbound All') : t('Already unbounded')}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ p: '50px 10px 20px' }} variant='body2'>
              {t('Wait for unlocking period to pass')}:
            </Typography>
          </Grid>
          <Grid container justifyContent='center'>
            {needsUnboundAll ? '...' : remainingTimeCountDown(remainingSecondsToKickAll)}
          </Grid>
          <Typography sx={{ p: '50px 10px 20px' }} variant='subtitle2'>
            {t('2. Kick all members out')}:
          </Typography>
          <Grid container justifyContent='center'>
            <Button
              color='warning'
              disabled={needsUnboundAll || (sessionInfo && sessionInfo.currentEra < kickEraIndex)}
              onClick={() => handleKickAll('kickAll')}
              sx={{ textTransform: 'none', width: '50%' }}
              variant='contained'
            >
              {t('Kick All')}
            </Button>
          </Grid>
        </Grid>
      </Popup>
    </>
  );
}

export default styled(KickAll)`
      height: calc(100vh - 2px);
      overflow: auto;
      scrollbar - width: none;

      &:: -webkit - scrollbar {
        display: none;
      width:0,
       }
      .empty-list {
        text - align: center;
  }`;
