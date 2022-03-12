
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component lists all active crowdloans,which can be selected to contribute to, also page shows winner parachains */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Grid } from '@mui/material';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
  const [expanded, setExpanded] = React.useState<string>('');

  const endeds = useMemo(() => auction.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber && !c.fund.hasLeased), [auction]);
  const activeCrowdloans = useMemo(() => auction.crowdloans.filter((c) => c.fund.end > auction.currentBlockNumber && !c.fund.hasLeased), [auction]);
  const auctionWinners = useMemo(() => auction.crowdloans.filter((c) => c.fund.end < auction.currentBlockNumber && c.fund.hasLeased), [auction]);

  useEffect(() => {
    if (activeCrowdloans?.length) setExpanded('Actives');
    else if (auctionWinners?.length) setExpanded('Winners');
  }, [activeCrowdloans, auctionWinners]);

  const handleAccordionChange = useCallback((panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : '');
  }, []);

  return (
    <Grid container id='crowdloan-list'>
      <CrowdloanList chainInfo={chainInfo} crowdloans={activeCrowdloans} description={t('view active crowdloans')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={275} title={t('Actives')} />
      <CrowdloanList chainInfo={chainInfo} crowdloans={auctionWinners} description={t('view auction winners')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={225} title={t('Winners')} />
      <CrowdloanList chainInfo={chainInfo} crowdloans={endeds} description={t('view ended crowdloans')} endpoints={endpoints} expanded={expanded} handleAccordionChange={handleAccordionChange} handleContribute={handleContribute} height={200} title={t('Ended')} />
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
