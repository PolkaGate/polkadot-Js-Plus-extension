// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AccountBalance as AccountBalanceIcon, SummarizeOutlined as SummarizeOutlinedIcon, VolunteerActivismSharp as VolunteerActivismSharpIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DeriveTreasuryProposals } from '@polkadot/api-derive/types';

import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../../components';
import getCurrentBlockNumber from '../../../util/api/getCurrentBlockNumber';
import getTips from '../../../util/api/getTips';
import { ChainInfo, ProposalsInfo } from '../../../util/plusTypes';
import ProposalOverview from './proposals/Overview';
import TipOverview from './tips/Overview';

interface Props {
  address: string;
  showTreasuryModal: boolean;
  chainInfo: ChainInfo | undefined;
  setTreasuryModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Treasury({ address, chainInfo, setTreasuryModalOpen, showTreasuryModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('proposals');
  const [proposals, setProposals] = useState<DeriveTreasuryProposals | undefined>();
  const [activeProposalCount, setActiveProposalCount] = useState<number | undefined>();

  const [tips, setTips] = useState<any[]>();
  const chain = useMetadata(chainInfo?.genesisHash, true);// TODO:double check to have genesisHash here

  useEffect(() => {
    if (!chainInfo) return;
    setProposals(undefined); // to clear when change changed

    // get all treasury proposals including approved
    chainInfo?.api.derive.treasury.proposals().then((p) => {
      setProposals(p);
      if (p) setActiveProposalCount(p.proposals.length + p.approvals.length);
      console.log('proposals:', JSON.parse(JSON.stringify(p.proposals)));
    }).catch(console.error);
  }, [chainInfo]);

  useEffect(() => {
    if (!chainInfo?.chainName) return;
    // get all treasury tips
    // eslint-disable-next-line no-void
    void getTips(chainInfo.chainName, 0, 10).then((res) => {
      console.log('tips:', res);

      setTips(res?.data?.list);
    }).catch(console.error);

    // eslint-disable-next-line no-void
    // void getCurrentBlockNumber(chainInfo.chainName).then((n) => {
    //   setCurrentBlockNumber(n);
    // });
  }, [chainInfo]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  const handleTreasuryModalClose = useCallback((): void => {
    setTreasuryModalOpen(false);
  }, [setTreasuryModalOpen]);

  return (
    <Popup handleClose={handleTreasuryModalClose} showModal={showTreasuryModal}>
      <PlusHeader action={handleTreasuryModalClose} chain={chainInfo?.chainName} closeText={'Close'} icon={<AccountBalanceIcon fontSize='small' />} title={'Treasury'} />
      <Grid container>
        <Grid item sx={{ margin: '0px 30px' }} xs={12}>
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab icon={<SummarizeOutlinedIcon fontSize='small' />} iconPosition='start' label={`Proposals (${activeProposalCount ?? 0}/${proposals?.proposalCount ?? 0})`} sx={{ fontSize: 11 }} value='proposals' />
            <Tab icon={<VolunteerActivismSharpIcon fontSize='small' />} iconPosition='start' label='Tips' sx={{ fontSize: 11 }} value='tips' />
          </Tabs>
        </Grid>

        {tabValue === 'proposals' &&
          <Grid item sx={{ height: 450, overflowY: 'auto' }} xs={12}>
            {chainInfo && proposals !== undefined
              ? <ProposalOverview address={address} chain={chain} chainInfo={chainInfo} proposalsInfo={proposals} />
              : <Progress title={t('Loading proposals ...')} />}
          </Grid>
        }

        {tabValue === 'tips' &&
          <Grid item sx={{ height: 450, overflowY: 'auto' }} xs={12}>
            {chainInfo && tips !== undefined
              ? <TipOverview address={address} chain={chain} chainInfo={chainInfo} tips={tips} />
              : <Progress title={t('Loading tips ...')} />}
          </Grid>
        }
      </Grid>
    </Popup>
  );
}
