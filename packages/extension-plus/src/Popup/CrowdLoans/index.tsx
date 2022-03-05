// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component opens crowdloan page, which shows auction and crowdloan tab,
 * where a relay chain can be selected to view available auction/crowdloans */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Gavel as GavelIcon, Payments as PaymentsIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { createWsEndpoints } from '@polkadot/apps-config';
import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import { Progress } from '../../components';
import SelectRelay from '../../components/SelectRelay';
import getChainInfo from '../../util/getChainInfo';
import { Auction, ChainInfo, Crowdloan } from '../../util/plusTypes';
import AuctionTab from './AuctionTab';
import Contribute from './Contribute';
import CrowdloanTab from './CrowdloanTab';

interface Props extends ThemeProps {
  className?: string;
}

const allEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);

function Crowdloans({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [contributingTo, setContributingTo] = useState<Crowdloan | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [tabValue, setTabValue] = React.useState('auction');
  const [contributeModal, setContributeModalOpen] = useState<boolean>(false);
  const [endpoints, setEndpoints] = useState<LinkOption[]>([]);
  const [chainInfo, setChainInfo] = useState<ChainInfo>();

  function getCrowdloands(_selectedBlockchain: string) {
    const crowdloanWorker: Worker = new Worker(new URL('../../util/workers/getCrowdloans.js', import.meta.url));
    const chain = _selectedBlockchain;// TODO: change it

    crowdloanWorker.postMessage({ chain });

    crowdloanWorker.onerror = (err) => {
      console.log(err);
    };

    crowdloanWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: Auction = e.data;

      if (result.blockchain === selectedChain) {
        setAuction(result);
      }

      crowdloanWorker.terminate();
    };
  }

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    });
  }, []);

  useEffect(() => {
    if (selectedChain) {
      setAuction(null);
      setContributingTo(null);
      getCrowdloands(selectedChain);

      // eslint-disable-next-line no-void
      void getChainInfo(selectedChain).then((i) => setChainInfo(i));

      const endPoint = allEndpoints.find((e: LinkOption) => (String(e.text).toLowerCase() === selectedChain.toLowerCase())) as LinkOption;
      const endpoints = allEndpoints.filter((e) => (e.genesisHashRelay === endPoint?.genesisHash));

      setEndpoints(endpoints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChain]);

  const handleChainChange = useCallback((event: SelectChangeEvent) => {
    setSelectedChain(event.target.value);
  }, []);

  const handleContribute = useCallback((crowdloan: Crowdloan): void => {
    setContributingTo(crowdloan);

    setContributeModalOpen(true);
  }, []);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  }, []);

  return (
    <>
      <Header showAdd showBackArrow showSettings smallMargin text={t<string>('Crowdloan')} />
      <Grid alignItems='center' container id='selectRelyChain' sx={{ padding: '5px 35px' }}>

        <Grid item xs={12}>
          <SelectRelay handleChainChange={handleChainChange} hasEmpty selectedChain={selectedChain} />
        </Grid>

        <Grid item xs={12}>
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab icon={<GavelIcon fontSize='small' />} iconPosition='start' label='Auction' sx={{ fontSize: 11, p: '0px 16px 0px 16px' }} value='auction' />
            <Tab icon={<PaymentsIcon fontSize='small' />} iconPosition='start' label='Crowdloans' sx={{ fontSize: 11, p: '0px 16px 0px 16px' }} value='crowdloan' />
          </Tabs>
        </Grid>
      </Grid>

      {!auction && selectedChain &&
        <Progress title={t('Loading Auction/Crowdloans of ') + ` ${selectedChain.charAt(0).toUpperCase()}${selectedChain.slice(1)} ...`} />
      }

      {auction && tabValue === 'auction' &&
        <AuctionTab auction={auction} chainInfo={chainInfo} endpoints={endpoints} />
      }

      {auction && tabValue === 'crowdloan' &&
        <CrowdloanTab auction={auction} chainInfo={chainInfo} endpoints={endpoints} handleContribute={handleContribute} />
      }

      {contributeModal && auction && contributingTo &&
        <Contribute
          auction={auction}
          chainInfo={chainInfo}
          contributeModal={contributeModal}
          crowdloan={contributingTo}
          endpoints={endpoints}
          setContributeModalOpen={setContributeModalOpen}
        />
      }
    </>
  );
}

export default styled(Crowdloans)`
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