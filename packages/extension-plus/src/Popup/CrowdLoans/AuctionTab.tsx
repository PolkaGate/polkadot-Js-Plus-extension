// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component renders auction tab which show an ongoing auction information along with a possible parachain bids/winning */
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Avatar, Grid, LinearProgress, Paper } from '@mui/material';
import { deepOrange, grey } from '@mui/material/colors';
import React from 'react';
import styled from 'styled-components';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { NothingToShow } from '../../components';
import { Auction, ChainInfo } from '../../util/plusTypes';
import { remainingTime } from '../../util/plusUtils';
import Fund from './Fund';

interface Props extends ThemeProps {
  className?: string;
  auction: Auction;
  chainInfo: ChainInfo;
  endpoints: LinkOption[];
}

function AuctionTab({ auction, chainInfo, className, endpoints }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const firstLease = auction?.auctionInfo && Number(auction?.auctionInfo[0]);
  const stage = auction?.auctionInfo && Number(auction?.auctionInfo[1]);
  const lastLease = Number(chainInfo.api.consts.auctions.leasePeriodsPerSlot.toString()) - 1;
  const endingPeriod = Number(chainInfo.api.consts.auctions?.endingPeriod.toString());

  const ShowBids = (): React.ReactElement => {
    const winning = auction?.winning.find((x) => x);

    if (!winning) return <div />;

    const crowdloan = auction?.crowdloans.find((c) => c.fund.paraId === winning[1].replace(/,/g, ''));

    if (!crowdloan) return <div />;

    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper elevation={3}>
            <Grid sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, paddingLeft: '10px' }}>
              {t('Bids')}
            </Grid>
            <Fund coin={chainInfo.coin} crowdloan={crowdloan} decimals={chainInfo.decimals} endpoints={endpoints} />
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const ShowAuction = () => (
    <Paper elevation={6} sx={{ backgroundColor: grey[100], margin: '20px' }}>
      <Grid container item justifyContent='flex-start' sx={{ padding: '15px 10px 15px' }}>
        <Grid item xs={1}>
          <Avatar sx={{ bgcolor: deepOrange[500], fontSize: 13, height: 30, width: 30 }}>
            #{auction.auctionCounter}
          </Avatar>
        </Grid>
        <Grid item sx={{ fontSize: 15, fontWeight: 'fontWeightBold' }} xs={3}>
          {t('Auction')}
        </Grid>
        <Grid item sx={{ fontSize: 12, textAlign: 'center' }} xs={4}>
          {t('Lease')}: {' '} {firstLease} {' - '}{firstLease + lastLease}
        </Grid>
        <Grid item sx={{ fontSize: 12, textAlign: 'right' }} xs={4}>
          {t('Current block')}{': '}{auction.currentBlockNumber}
        </Grid>

        <Grid item sx={{ fontSize: 12, textAlign: 'right' }} xs={12}>
          {t('Ending stage')} {': '} {stage}{' - '}{stage + endingPeriod}
        </Grid>
        <Grid item sx={{ pt: '20px' }} xs={12}>
          <LinearProgress
            color='warning'
            sx={{ backgroundColor: 'black' }}
            value={100 * (Number(auction.currentBlockNumber) - stage) / (endingPeriod)}
            variant='determinate'
          />
        </Grid>
        <Grid item sx={{ fontSize: 12, textAlign: 'center', color: 'green' }} xs={12}>
          {t('Remaining Time')}{': '} {remainingTime(auction.currentBlockNumber, stage + endingPeriod)}
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <>
      {auction && !auction?.auctionInfo &&
        <NothingToShow text={t('There is no active auction')} />
      }

      {auction && auction?.auctionInfo &&
        <>
          <ShowAuction />
          <ShowBids />
        </>
      }
    </>
  );
}

export default styled(AuctionTab)`
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
