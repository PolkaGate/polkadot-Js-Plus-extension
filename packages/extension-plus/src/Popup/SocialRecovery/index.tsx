/* eslint-disable simple-import-sort/imports */
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

import { Beenhere as BeenhereIcon, Backspace as BackspaceIcon, HealthAndSafety as HealthAndSafetyIcon, Support as SupportIcon, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { Grid, Tab, Tabs } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { BN, hexToString } from '@polkadot/util';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { SettingsContext, AccountContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';

import { AddressState, nameAddress, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import useApi from '../../hooks/useApi';
import useEndpoint from '../../hooks/useEndPoint';
import AddFriend from './AddFriend';
import Confirm from './Confirm';
import InfoTab from './InfoTab';
import MakeRecoverableTab from './MakeRecoverableTab';
import RscueTab from './RescueTab';
import { Chain } from '@polkadot/extension-chains/types';
import CloseRecoveryTab from './CloseRecoveryTab';
import RecoveryChecking from './RecoveryChecking';
import { red } from '@mui/material/colors';

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

  const [tabValue, setTabValue] = useState('info');
  const [accountsInfo, setAcountsInfo] = useState<DeriveAccountInfo[]>();
  const [recoveryThreshold, setRecoveryThreshold] = useState<number>(0);
  const [recoveryDelay, setRecoveryDelay] = useState<number>(0);
  const [friends, setFriends] = useState<DeriveAccountInfo[]>([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState<boolean>(false);
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [account, setAccount] = useState<DeriveAccountInfo | undefined>();
  const [addresesOnThisChain, setAddresesOnThisChain] = useState<nameAddress[]>([]);
  const [recoveryConsts, setRecoveryConsts] = useState<RecoveryConsts | undefined>();
  const [recoveryInfo, setRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [rescuer, setRescuer] = useState<Rescuer | undefined | null>();
  const [recoveryTabLabel, setRecoveryTabLabel] = useState<string>('Make recoverable');
  const [recoveryStatus, setRecoveryStatus] = useState<string | undefined>();

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
    if (!recoveryInfo) { return; }

    setRecoveryThreshold(recoveryInfo.threshold.toNumber());
    const recoveryDelayInDays = recoveryInfo.delayPeriod.toNumber() / (24 * 60 * 10);

    setRecoveryDelay(recoveryDelayInDays);
    const onChainFriends = recoveryInfo.friends.map((f): DeriveAccountInfo => {
      const accountInfo = accountsInfo?.find((a) => a?.accountId?.toString() === f.toString());

      return accountInfo ?? { accountId: f, identity: undefined } as unknown as DeriveAccountInfo;
    });

    setFriends(onChainFriends);
  }, [recoveryInfo, accountsInfo]);

  useEffect(() => {
    if (!api || !account?.accountId) { return; }

    const isRecoverable = api.query.recovery.recoverable;

    // eslint-disable-next-line no-void
    void isRecoverable(account.accountId).then((r) => {
      setRecoveryInfo(r.isSome ? r.unwrap() as unknown as PalletRecoveryRecoveryConfig : null);
      console.log('is recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });
  }, [api, account?.accountId]);

  useEffect(() => {
    if (recoveryInfo !== undefined && account?.accountId && chain && endpoint) {
      // check if reacovery is initiated
      isRecovering(account?.accountId, chain, endpoint);
    }
  }, [account?.accountId, chain, endpoint, isRecovering, recoveryInfo]);

  useEffect(() => {
    api && setRecoveryConsts({
      configDepositBase: api.consts.recovery.configDepositBase as unknown as BN,
      friendDepositFactor: api.consts.recovery.friendDepositFactor as unknown as BN,
      maxFriends: api.consts.recovery.maxFriends.toNumber(),
      recoveryDeposit: api.consts.recovery.recoveryDeposit as unknown as BN
    });
  }, [api]);

  useEffect(() => {
    if (!api) { return; }

    // const call = api.tx.recovery.closeRecovery(address);
    // const asRecovered = api.tx.recovery.asRecovered;
    // const params = [address, call];

    // // eslint-disable-next-line no-void
    // void asRecovered(...params).paymentInfo(address).then((i) => {
    //   const fee = i?.partialFee;

    //   console.log('feeeeeeeeee', fee.toString());
    //   console.log('address', address);
    // });

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

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    console.log('newValue', newValue);
    setTabValue(newValue);
  }, []);

  const handleRecoveryThreshold = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    setRecoveryThreshold(Number(event.target.value));
  }, [setRecoveryThreshold]);

  const handleRecoveryDelay = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    setRecoveryDelay(Number(event.target.value));
  }, [setRecoveryDelay]);

  const handleNext = useCallback(() => {
    recoveryInfo ? setState('removeRecovery') : setState('makeRecoverable');
    setConfirmModalOpen(true);
  }, [recoveryInfo]);

  const handleAddFriend = useCallback(() => {
    setShowAddFriendModal(true);
  }, []);

  const handleDeleteFriend = useCallback((index: number) => {
    friends.splice(index, 1);
    setFriends([...friends]);
  }, [friends]);

  return (
    <>
      <Header showAdd showBackArrow showSettings smallMargin text={`${t<string>('Social Recovery')} ${chain?.name ? 'on' : ''} ${chain?.name ?? ''}`} />
      <Grid alignItems='center' container sx={{ px: '30px' }}>
        <Grid item xs={12}>
          <Tabs indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue} variant='fullWidth'>
            <Tab
              icon={
                !recoveryStatus || recoveryStatus === 'Make recoverable'
                  ? <BeenhereIcon fontSize='small' />
                  : recoveryStatus === 'Remove recovery'
                    ? <BackspaceIcon fontSize='small' sx={{ transform: 'rotate(-90deg)' }} />
                    : <FontAwesomeIcon beat color={red[600]} icon={faShieldHalved} size='sm' />
                // <HealthAndSafetyIcon fontSize='small' />
              }
              iconPosition='start' label={recoveryStatus ?? 'Recovery'} sx={{ fontSize: 11 }} value='recovery' />
            <Tab icon={<SupportIcon fontSize='small' />} iconPosition='start' label='Rescue' sx={{ fontSize: 11 }} value='rescue' />
            <Tab icon={<InfoOutlinedIcon fontSize='small' />} iconPosition='start' label='Info' sx={{ fontSize: 11 }} value='info' />
          </Tabs>
        </Grid>
        {tabValue === 'recovery' && !recoveryStatus &&
          <RecoveryChecking
            recoveryInfo={recoveryInfo}
            rescuer={rescuer}
            setRecoveryStatus={setRecoveryStatus}
          />
        }
        {tabValue === 'recovery' && recoveryStatus && ['Make recoverable', 'Remove recovery'].includes(recoveryStatus) &&
          <MakeRecoverableTab
            chain={chain}
            friends={friends}
            handleAddFriend={handleAddFriend}
            handleDeleteFriend={handleDeleteFriend}
            handleNext={handleNext}
            handleRecoveryDelay={handleRecoveryDelay}
            handleRecoveryThreshold={handleRecoveryThreshold}
            recoveryDelay={recoveryDelay}
            recoveryInfo={recoveryInfo}
            recoveryThreshold={recoveryThreshold}
          />
        }
        {tabValue === 'recovery' && recoveryStatus && recoveryStatus === 'Close recovery' && rescuer &&
          <CloseRecoveryTab
            api={api}
            chain={chain}
            formattedAddress={String(account?.accountId)}
            rescuer={rescuer}
          />
        }
        {tabValue === 'rescue' &&
          <RscueTab
            account={account}
            accountsInfo={accountsInfo}
            api={api}
            chain={chain}
            recoveryConsts={recoveryConsts}
          />
        }
        {tabValue === 'info' &&
          <InfoTab
            api={api}
            recoveryConsts={recoveryConsts}
          />
        }
      </Grid>
      {showAddFriendModal &&
        <AddFriend
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          friends={friends}
          setFriends={setFriends}
          setShowAddFriendModal={setShowAddFriendModal}
          showAddFriendModal={showAddFriendModal}
        />}
      {showConfirmModal && api && chain && state && account && recoveryConsts &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          friends={friends}
          recoveryConsts={recoveryConsts}
          recoveryDelay={recoveryDelay}
          recoveryThreshold={recoveryThreshold}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
        />
      }
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
