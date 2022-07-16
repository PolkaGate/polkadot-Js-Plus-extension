// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens crowdloan page, which shows auction and crowdloan tab,
 * where a relay chain can be selected to view available auction/crowdloans
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';
import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { Security as SecurityIcon, Backspace as BackspaceIcon, Support as SupportIcon, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { Divider, Grid, Paper, Tab, Tabs } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { BN, hexToString } from '@polkadot/util';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { SettingsContext, AccountContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';

import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { AddressState, nameAddress, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import useApi from '../../hooks/useApi';
import useEndpoint from '../../hooks/useEndPoint';
import Rscue from './Rescue';
import { Chain } from '@polkadot/extension-chains/types';
import { blue, green, grey, red } from '@mui/material/colors';
import Configure from './Configure';

interface Props extends ThemeProps {
  className?: string;
}

function SocialRecovery({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const settings = useContext(SettingsContext);
  const { accounts } = useContext(AccountContext);
  const { address, genesisHash } = useParams<AddressState>();

  const chain = useMetadata(genesisHash, true);
  const endpoint = useEndpoint(accounts, address, chain);
  const api = useApi(endpoint);

  const [accountsInfo, setAcountsInfo] = useState<DeriveAccountInfo[]>();
  const [account, setAccount] = useState<DeriveAccountInfo | undefined>();
  const [addresesOnThisChain, setAddresesOnThisChain] = useState<nameAddress[]>([]);
  const [recoveryConsts, setRecoveryConsts] = useState<RecoveryConsts | undefined>();
  const [recoveryInfo, setRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [rescuer, setRescuer] = useState<Rescuer | undefined | null>();
  const [showConfigureModal, setConfigureModalOpen] = useState<boolean | undefined >();
  const [showRescueModal, setRescueModalOpen] = useState<boolean | undefined >();
  const [recoveryFirstSel, setRecoveryFirstSel] = useState<string | undefined >();

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    }).catch(console.error);
  }, []);

  const handleAlladdressesOnThisChain = useCallback((prefix: number): void => {
    const allAddresesOnSameChain = accounts.reduce(function (result: nameAddress[], acc): nameAddress[] {
      const publicKey = decodeAddress(acc.address);

      if (acc.address === address) {
        setAccount({ accountId: encodeAddress(publicKey, prefix), identity: { display: acc?.name } });

        return result; // ignore the current account, I can not be a friend of mine
      }

      result.push({ address: encodeAddress(publicKey, prefix), name: acc?.name });

      return result;
    }, []);

    setAddresesOnThisChain(allAddresesOnSameChain);
  }, [accounts, address]);

  const isRecovering = useCallback((address: string, chain: Chain, endpoint: string): void => {
    if (!endpoint || !address || !chain) { return; }

    const isRecoveringWorker: Worker = new Worker(new URL('../../util/workers/isRecovering.js', import.meta.url));

    isRecoveringWorker.postMessage({ address, chain, endpoint });

    isRecoveringWorker.onerror = (err) => {
      console.log(err);
    };

    isRecoveringWorker.onmessage = (e) => {
      const rescuer: Rescuer | undefined = e.data as unknown as Rescuer | undefined;

      if (rescuer) {
        console.log('rescuer is :', rescuer);
        rescuer.option.created = new BN(rescuer.option.created);
        rescuer.option.deposit = new BN(rescuer.option.deposit);

        setRescuer(rescuer);
      } else {
        setRescuer(null);
      }

      isRecoveringWorker.terminate();
    };
  }, []);

  useEffect(() => {
    const prefix: number = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    if (prefix !== undefined) { handleAlladdressesOnThisChain(prefix); }
  }, [chain, settings, handleAlladdressesOnThisChain]);

  useEffect(() => {
    if (!api || !account?.accountId) { return; }

    // eslint-disable-next-line no-void
    void api.query.recovery.recoverable(account.accountId).then((r) => {
      setRecoveryInfo(r.isSome ? r.unwrap() as unknown as PalletRecoveryRecoveryConfig : null);
      console.log('is recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });
  }, [api, account?.accountId]);

  useEffect(() => {
    if (recoveryInfo !== undefined && account?.accountId && chain && endpoint) {
      // check if reacovery is initiated
      isRecovering(String(account.accountId), chain, endpoint);
    }
  }, [account?.accountId, chain, endpoint, isRecovering, recoveryInfo]);

  useEffect(() => {
    api && setRecoveryConsts({
      configDepositBase: api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: api.consts.recovery.maxFriends.toNumber() as number,
      recoveryDeposit: api.consts.recovery.recoveryDeposit as unknown as BN
    });
  }, [api]);

  useEffect(() => {
    if (!api) { return; }

    // eslint-disable-next-line no-void
    void api.query.identity.identityOf.entries().then((ids) => {
      console.log(`${ids?.length} accountsInfo fetched from ${chain?.name}`);

      const accountsInfo = ids.map(([key, option]) => {
        return {
          accountId: encodeAddress('0x' + key.toString().slice(82), chain?.ss58Format),
          identity: {
            judgements: option.unwrap().judgements,
            display: hexToString(option.unwrap().info.display.asRaw.toHex()),
            email: hexToString(option.unwrap().info.email.asRaw.toHex()),
            legal: hexToString(option.unwrap().info.legal.asRaw.toHex()),
            riot: hexToString(option.unwrap().info.riot.asRaw.toHex()),
            twitter: hexToString(option.unwrap().info.twitter.asRaw.toHex()),
            web: hexToString(option.unwrap().info.web.asRaw.toHex()),
          }
        };
      });

      setAcountsInfo(accountsInfo);
    });
  }, [address, api, chain?.name, chain?.ss58Format]);

  const openSelection = useCallback(() => {
    recoveryFirstSel === 'configure' && setConfigureModalOpen(true);
    recoveryFirstSel === 'rescue' && setRescueModalOpen(true);
  }, [recoveryFirstSel]);

  return (
    <>
      <Header showAdd showBackArrow showSettings smallMargin text={`${t<string>('Social Recovery')} ${chain?.name ? 'on' : ''} ${chain?.name ?? ''}`} />
      <Grid alignItems='center' container >
        <Grid alignItems='center' container justifyContent='space-around' sx={{ pt: '80px' }} >
          <Paper elevation={recoveryFirstSel === 'configure' ? 8 : 4} onClick={() => openSelection()} onMouseOver={() => setRecoveryFirstSel('configure')} sx={{ borderRadius: '10px', height: 340, pt: 1, width: '45%', cursor: 'pointer' }}>
            <Grid alignItems='center' container direction='column' justifyContent='center' sx={{ fontSize: 14, fontWeight: 700, pt: 3, pb: 1 }}>
              <Grid color={blue[600]} item>
                <p>{t('Configure my account').toUpperCase()}</p>
              </Grid>
              <Grid item>
                <SecurityIcon sx={{ color: blue[900], fontSize: 30, pt: '10px' }} />
              </Grid>
            </Grid>
            <Grid item sx={{ fontSize: 12, pb: '15px' }} xs={12}>
              <Divider light />
            </Grid>
            <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, px: 2 }}>
              {t('You can make your account "recoverable", remove recovery from an already recoverable account, or close a recovery process that is initiated by a (malicious) rescuer account.')}
            </Grid>
          </Paper>
          <Paper elevation={recoveryFirstSel === 'rescue' ? 8 : 4} onClick={() => openSelection()} onMouseOver={() => setRecoveryFirstSel('rescue')} sx={{ borderRadius: '10px', cursor: !(api && !api?.tx?.nominationPools) ? 'pointer' : '', height: 340, pt: 1, width: '45%' }}>
            <Grid alignItems='center' container direction='column' justifyContent='center' sx={{ fontSize: 14, fontWeight: 700, pt: 3, pb: 1 }}>
              <Grid color={green[600]} item>
                <p>{t('Rescue another account').toUpperCase()}</p>
              </Grid>
              <Grid item>
                <SupportIcon sx={{ color: green[900], fontSize: 30, pt: '10px' }} />
              </Grid>
            </Grid>
            <Grid item sx={{ fontSize: 12, pb: '15px' }} xs={12}>
              <Divider light />
            </Grid>
            <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, px: 2 }}>
              {t('You can try to rescue another account. As a "rescuer", you can recover a lost account, or as a friend, you can "vouch" to recover a lost account by a rescuer account.')}
            </Grid>
          </Paper>
        </Grid>
        {showConfigureModal &&
        <Configure
          account={account}
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          api={api}
          chain={chain}
          recoveryConsts={recoveryConsts}
          recoveryInfo={recoveryInfo}
          rescuer={rescuer}
          setConfigureModalOpen={setConfigureModalOpen}
          showConfigureModal={showConfigureModal}
        />
        }
        {showRescueModal &&
        <Rscue
          account={account}
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          api={api}
          chain={chain}
          recoveryConsts={recoveryConsts}
          setRescueModalOpen={setRescueModalOpen}
          showRescueModal={showRescueModal}
        />
        }
      </Grid>
    </>
  );
}

export default styled(SocialRecovery)`
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
