/* eslint-disable react/jsx-max-props-per-line */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { DeriveCollectiveProposal } from '@polkadot/api-derive/types';

import { AutoAwesomeMotion as AutoAwesomeMotionIcon, Groups as GroupsIcon, People as PeopleIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../../components';
import getCouncilAll from '../../../util/api/getCouncilAll';
import getCurrentBlockNumber from '../../../util/api/getCurrentBlockNumber';
import { ChainInfo, CouncilInfo } from '../../../util/plusTypes';
import Motions from './motions/Motions';
import Overview from './overview/Overview';

interface Props {
  chainName: string;
  chainInfo: ChainInfo | undefined;
  showCouncilModal: boolean;
  setCouncilModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function CouncilIndex({ chainInfo, chainName, setCouncilModalOpen, showCouncilModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('council');
  const [councilInfo, setCouncilInfo] = useState<CouncilInfo>();
  // const [motions, setMotions] = useState<MotionsInfo>();
  const [motions, setMotions] = useState<DeriveCollectiveProposal[]>();
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number>();
  const [totalMotionsSofar, setTotalMotionsSofar] = useState<number>(0);
  const [currentMotionsCount, setCurrentMotionsCount] = useState<number>(0);

  useEffect(() => {
    if (!chainInfo) return;

    // eslint-disable-next-line no-void
    void chainInfo.api.query.council.proposalCount().then((c) => {
      setTotalMotionsSofar(c.toNumber());
    });

    // eslint-disable-next-line no-void
    void chainInfo.api.derive.council?.proposals().then((p) => {
      if (p) {
        setMotions(JSON.parse(JSON.stringify(p)));

        if (p?.length) { setCurrentMotionsCount(p.length); }
      }
    });
  }, [chainInfo]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getCouncilAll(chainName).then((c) => {
      setCouncilInfo(c);
    });

    // // eslint-disable-next-line no-void
    // void getMotions(chainName).then((m) => {
    //   setMotions(m);

    //   if (m?.proposals?.length) { setCurrentMotionsCount(m?.proposals?.length); }
    // });

    // eslint-disable-next-line no-void
    void getCurrentBlockNumber(chainName).then((n) => {
      setCurrentBlockNumber(n);
    });
  }, []);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  const handleCouncilModalClose = useCallback((): void => {
    setCouncilModalOpen(false);
  }, [setCouncilModalOpen]);

  return (
    <Popup handleClose={handleCouncilModalClose} showModal={showCouncilModal}>
      <PlusHeader action={handleCouncilModalClose} chain={chainName} closeText={'Close'} icon={<GroupsIcon />} title={'Council'} />
      <Grid container>
        <Grid item sx={{ margin: '0px 30px' }} xs={12}>
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab icon={<PeopleIcon fontSize='small' />} iconPosition='start' label='councillors' sx={{ fontSize: 11 }} value='council' />
            <Tab icon={<AutoAwesomeMotionIcon fontSize='small' />} iconPosition='start' label={`Motions (${currentMotionsCount}/${totalMotionsSofar})`} sx={{ fontSize: 11 }} value='motions' />
          </Tabs>
        </Grid>
        {tabValue === 'council'
          ? <>{chainInfo && councilInfo
            ? <Overview chainInfo={chainInfo} councilInfo={councilInfo} />
            : <Progress title={'Loading members info ...'} />}
          </>
          : ''}

        {tabValue === 'motions'
          ? <>{chainInfo && motions
            ? <Motions chainInfo={chainInfo} currentBlockNumber={currentBlockNumber} motions={motions} />
            : <Progress title={'Loading motions ...'} />}
          </>
          : ''}

      </Grid>
    </Popup>
  );
}
