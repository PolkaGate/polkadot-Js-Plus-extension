
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component lists all active crowdloans,which can be selected to contribute to, also page shows winner parachains */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Grid } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Auction, ChainInfo, Crowdloan } from '../../util/plusTypes';
import CrowdloanList from './CrowdloanList';

interface Props extends ThemeProps {
  className?: string;
  auction: Auction;
  chainInfo: ChainInfo;
  endpoints: LinkOption[];
  handleContribute: (crowdloan: Crowdloan) => void;
}

function CrowdloanTab({ auction, chainInfo, className, endpoints, handleContribute }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [activeCrowdloans, setActiveCrowdloans] = useState<Crowdloan[] | undefined>(undefined);
  const [auctionWinners, setAuctionWinners] = useState<Crowdloan[] | undefined>(undefined);
  const [expanded, setExpanded] = React.useState<string>('');

  useEffect(() => {
    if (!auction) return;

    const actives = auction.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber && !c.fund.hasLeased);
    const winners = auction.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber || c.fund.hasLeased);

    if (actives?.length) setExpanded('Actives');
    else if (winners?.length) setExpanded('Winners');

    setActiveCrowdloans(actives);
    setAuctionWinners(winners);
  }, [auction]);

  const handleAccordionChange = useCallback((panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  }, []);

  return (
    <Grid container id='crowdloan-list'>
      <CrowdloanList chainInfo={chainInfo} crowdloans={activeCrowdloans} description={t('view active crowdloans')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={275} title={t('Actives')} />
      <CrowdloanList chainInfo={chainInfo} crowdloans={auctionWinners} description={t('view auction winners')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={225} title={t('Winners')} />
      <CrowdloanList chainInfo={chainInfo} crowdloans={[]} description={t('view ended crowdloans')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={200} title={t('Ended')} />
    </Grid>
  );
}

export default styled(CrowdloanTab)`
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
