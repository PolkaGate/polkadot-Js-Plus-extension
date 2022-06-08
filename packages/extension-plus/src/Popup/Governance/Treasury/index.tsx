// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AccountBalance as AccountBalanceIcon, SummarizeOutlined as SummarizeOutlinedIcon, VolunteerActivismSharp as VolunteerActivismSharpIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { DeriveTreasuryProposals } from '@polkadot/api-derive/types';
import { BN, BN_MILLION, BN_ZERO, u8aConcat } from '@polkadot/util';

import useMetadata from '../../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../../components';
import getTips from '../../../util/api/getTips';
import { ChainInfo, Tip } from '../../../util/plusTypes';
import { remainingTime } from '../../../util/plusUtils';
import ProposalOverview from './proposals/Overview';
import TipOverview from './tips/Overview';

interface Props {
  address: string;
  showTreasuryModal: boolean;
  chainInfo: ChainInfo | undefined;
  setTreasuryModalOpen: Dispatch<SetStateAction<boolean>>;
}
const EMPTY_U8A_32 = new Uint8Array(32);

export default function Treasury({ address, chainInfo, setTreasuryModalOpen, showTreasuryModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState('proposals');
  const [proposals, setProposals] = useState<DeriveTreasuryProposals | undefined>();
  const [activeProposalCount, setActiveProposalCount] = useState<number | undefined>();

  const [tips, setTips] = useState<Tip[] | undefined | null>();
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
    // get all treasury tips and just show proposedTips
    // eslint-disable-next-line no-void
    void getTips(chainInfo.chainName, 0, 30).then((res) => {
      console.log('tips:', res);
      const tipList = res?.data?.list;
      const proposedTips = tipList?.filter((tip) => tip.status === 'proposed');

      setTips(proposedTips);
    }).catch((e) => {
      console.error(e);
      setTips(null);
    });
  }, [chainInfo]);

  useEffect(() => {
    if (!chainInfo) return;
    const api = chainInfo.api;
    const treasuryAccount = u8aConcat(
      'modl',
      api.consts.treasury && api.consts.treasury.palletId
        ? api.consts.treasury.palletId.toU8a(true)
        : 'py/trsry',
      EMPTY_U8A_32
    ).subarray(0, 32);

    console.log('treasuryAccountt:', treasuryAccount.toString());

    // eslint-disable-next-line no-void
    void api.derive.chain.bestNumber().then((bestNumber) => {
      const spendPeriod = new BN(api.consts.treasury?.spendPeriod) ?? BN_ZERO;

      console.log('remaining spent period:', remainingTime(spendPeriod.sub(bestNumber.mod(spendPeriod)).toNumber()));
    }).catch(console.error);

    // eslint-disable-next-line no-void
    void api.derive.balances?.account(treasuryAccount).then((b) => {
      const treasuryBalance = api.createType('Balance', b.freeBalance)
      console.log('available treasury balance:', treasuryBalance?.toHuman());

      const burn = api.consts.treasury.burn.mul(treasuryBalance).div(BN_MILLION);
      console.log('burn:', api.createType('Balance', burn)?.toHuman());
    }).catch(console.error);

    // eslint-disable-next-line no-void
    void api.derive.bounties?.bounties()?.then((bounties) => {
      const pendingBounties = bounties.reduce((total, { bounty: { status, value } }) =>
        total.iadd(status.isApproved ? value : BN_ZERO), new BN(0)
      )

      console.log('treasury pendingBounties:', api.createType('Balance', pendingBounties)?.toHuman());
    }).catch(console.error);

    // eslint-disable-next-line no-void
    void api.derive.treasury?.proposals()?.then((treasuryProposals) => {
      const pendingProposals = treasuryProposals.approvals.reduce((total, { proposal: { value } }) =>
        total.iadd(value), new BN(0)
      )

      console.log('treasury pendingProposals:', api.createType('Balance', pendingProposals)?.toHuman());
    }).catch(console.error);
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
            <Tab
              icon={<SummarizeOutlinedIcon fontSize='small' />}
              iconPosition='start'
              label={`Proposals (${activeProposalCount ?? 0}/${proposals?.proposalCount ?? 0})`}
              sx={{ fontSize: 11 }}
              value='proposals'
            />
            <Tab
              icon={<VolunteerActivismSharpIcon fontSize='small' />}
              iconPosition='start'
              label={`Tips (${tips?.length ?? 0})`}
              sx={{ fontSize: 11 }}
              value='tips'
            />
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
