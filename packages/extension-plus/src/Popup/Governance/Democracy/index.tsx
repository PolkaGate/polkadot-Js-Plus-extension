// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { BatchPrediction as BatchPredictionIcon, HowToVote as HowToVoteIcon, WhereToVote as WhereToVoteIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DeriveReferendumExt } from '@polkadot/api-derive/types';

import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../../components';
import getCurrentBlockNumber from '../../../util/api/getCurrentBlockNumber';
import getProposals from '../../../util/api/getProposals';
import getReferendums from '../../../util/api/getReferendums';
import createConvictions from '../../../util/createConvictions';
import { ChainInfo, Conviction, ProposalsInfo } from '../../../util/plusTypes';
import Proposals from './proposals/overview';
import Referendums from './referendums/overview';

interface Props {
  chainName: string;
  showDemocracyModal: boolean;
  chainInfo: ChainInfo;
  setDemocracyModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Democracy({ chainInfo, chainName, setDemocracyModalOpen, showDemocracyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('referendums');
  const [referendums, setReferenduns] = useState<DeriveReferendumExt[]>();
  const [proposalsInfo, setProposalsInfo] = useState<ProposalsInfo>();
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number>();
  const [convictions, setConvictions] = useState<Conviction[]>();
  const chain = useMetadata(chainInfo?.genesisHash, true);// TODO:double check to have genesisHash here

  useEffect(() => {
    // eslint-disable-next-line no-void
    void createConvictions(chain, t).then((c) => {
      setConvictions(c);
    });
  }, [chain, t]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getReferendums(chainName).then(r => {
      setReferenduns(r);
    });

    // eslint-disable-next-line no-void
    void getProposals(chainName).then(r => {
      setProposalsInfo(r);
    });

    // eslint-disable-next-line no-void
    void getCurrentBlockNumber(chainName).then((n) => {
      setCurrentBlockNumber(n);
    });
  }, [chainName]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  const handleDemocracyModalClose = useCallback(
    (): void => { setDemocracyModalOpen(false);
    },[setDemocracyModalOpen]);

  return (
    <Popup handleClose={handleDemocracyModalClose} showModal={showDemocracyModal}>
      <PlusHeader action={handleDemocracyModalClose} chain={chainName} closeText={'Close'} icon={<HowToVoteIcon fontSize='small' />} title={'Democracy'} />
      <Grid container>
        <Grid item sx={{ margin: '0px 30px' }} xs={12}>
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab icon={<WhereToVoteIcon fontSize='small' />} iconPosition='start' label='Referendums' sx={{ fontSize: 11 }} value='referendums' />
            <Tab icon={<BatchPredictionIcon fontSize='small' />} iconPosition='start' label='Proposals' sx={{ fontSize: 11 }} value='proposals' />
          </Tabs>
        </Grid>

        {tabValue === 'referendums'
          ? <Grid item sx={{ height: 450, overflowY: 'auto' }} xs={12}>
            {referendums
              ? <Referendums chain={chain} chainInfo={chainInfo} convictions={convictions} currentBlockNumber={currentBlockNumber} referendums={referendums} />
              : <Progress title={'Loading referendums ...'} />}
          </Grid>
          : ''}

        {tabValue === 'proposals'
          ? <Grid item sx={{ height: 450, overflowY: 'auto' }} xs={12}>
            {proposalsInfo
              ? <Proposals chain={chain} chainInfo={chainInfo} proposalsInfo={proposalsInfo} />
              : <Progress title={'Loading proposals ...'} />}
          </Grid>
          : ''}
      </Grid>
    </Popup>
  );
}
