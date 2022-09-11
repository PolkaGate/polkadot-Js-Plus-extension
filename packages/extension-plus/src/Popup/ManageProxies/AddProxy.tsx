// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens a page, where you can add a proxy
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AddCircleRounded as AddCircleRoundedIcon, NavigateBefore as NavigateBeforeIcon, NavigateNext as NavigateNextIcon, NoAccounts as NoAccountsIcon } from '@mui/icons-material';
import { Autocomplete, Grid, InputAdornment, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';
import { Button } from '@polkadot/extension-ui/components';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../components';
import { NameAddress, Proxy } from '../../util/plusTypes';
import { getFormattedAddress, isValidAddress } from '../../util/plusUtils';

interface Props extends ThemeProps {
  address: string;
  settingsPrefix: number;
  addressesOnThisChain: NameAddress[] | undefined;
  chain: Chain | null;
  className?: string;
  proxies: Proxy[];
  showAddProxyModal: boolean;
  setShowAddProxyModal: React.Dispatch<React.SetStateAction<boolean>>;
  setProxies: React.Dispatch<React.SetStateAction<Proxy[]>>;
}

const proxyType = ['Any', 'NonTransfer', 'Staking', 'Governance', 'SudoBalances', 'SudoBalances', 'CancelProxy']

function AddProxy({ address, addressesOnThisChain, chain, proxies, setProxies, setShowAddProxyModal, settingsPrefix, showAddProxyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [filteredAccountsInfo, setFilteredAccountsInfo] = useState<DeriveAccountInfo[] | undefined | null>();
  const [text, setText] = useState<string | undefined>();
  const formatted = getFormattedAddress(address, chain, settingsPrefix);


  const handleAddress = useCallback((value: string | null) => {
    if (!value) {
      setText(undefined);
      setAccountInfo(undefined);

      return;
    }

    const indexOfDots = value?.indexOf(':');
    let mayBeAddress: string | undefined = value?.slice(indexOfDots + 1)?.trim();

    mayBeAddress = mayBeAddress && isValidAddress(mayBeAddress) ? mayBeAddress : undefined;

    if (mayBeAddress) {
      setText(mayBeAddress);
      setAccountInfo(undefined);
    }
  }, []);

  const handleAutoComplateChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    handleAddress(value);
  }, [handleAddress]);

  const handleInputChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: string) => {
    setText(value);
    setAccountInfo(undefined);
  }, []);

  // const handleSearchProxy = useCallback(() => {
  //   if (!accountsInfo?.length) { return; }

  //   if (!text) {
  //     return setFilteredAccountsInfo(undefined);
  //   }

  //   let filtered;

  //   if (text) {
  //     filtered = accountsInfo.filter((id) => JSON.stringify(id).toLowerCase().includes(text.toLocaleLowerCase()));

  //     if (filtered?.length) {
  //       setFilteredAccountsInfo(filtered);

  //       return setAccountInfo(filtered[0]);
  //     }

  //     setAccountInfo(null);
  //   }

  //   setFilteredAccountsInfo(null);
  // }, [accountsInfo, text]);

  // useEffect(() => {
  //   handleSearchProxy();
  // }, [handleSearchProxy, text]);

  const handleAddProxy = useCallback(() => {
    const mayBeAddress = isValidAddress(text) ? text : undefined;

    const isEnteredMeAsMySelfProxy = String(account.accountId) === mayBeAddress;

    if ((!mayBeAddress && !accountInfo?.accountId) || isEnteredMeAsMySelfProxy) { return; }

    const mayBeNewProxy = mayBeAddress || accountInfo?.accountId?.toString();

    if (!proxies.find((i) => i.accountId === mayBeNewProxy)) { // if the account is not already added
      const temp = [...proxies];

      accountInfo ? temp.push(accountInfo) : temp.push({ accountId: mayBeNewProxy, identity: undefined });

      console.log('setting proxies to ', [...temp]);
      setProxies([...temp]);
      setShowAddProxyModal(false);
    }
  }, [address, accountInfo, proxies, setProxies, setShowAddProxyModal, text]);

  const handleCloseModal = useCallback((): void => {
    setShowAddProxyModal(false);
  }, [setShowAddProxyModal]);

  const AccountTextBox = () => (
    <Grid alignItems='center' container sx={{ pt: 2 }}>
      <Grid item xs={1}>
        {isValidAddress(text)
          ? <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={40}
            theme={chain?.icon || 'polkadot'}
            value={text}
          />
          : <NoAccountsIcon sx={{ color: grey[400], fontSize: 43 }} />
        }
      </Grid>
      <Grid item xs={11}>
        <Autocomplete
          ListboxProps={{ sx: { fontSize: 12 } }}
          autoFocus
          // defaultValue={text}
          freeSolo
          inputValue={text}
          onChange={handleAutoComplateChange}
          onInputChange={handleInputChange}
          options={addressesOnThisChain?.map((option) => `${option?.name} :    ${option.address}`)}
          // eslint-disable-next-line react/jsx-no-bind
          renderInput={(params) =>
            <TextField
              {...params}
              InputLabelProps={{ shrink: true, style: { fontSize: 17 } }}
              autoFocus
              error={!text}
              label={t('New proxy')}
            // onChange={handleChange}
            />
          }
          sx={{ '& .MuiAutocomplete-input, & .MuiInputLabel-root': { fontSize: 13 } }}
        />
      </Grid>
    </Grid>
  );

  const DelayTextBox = () => (
    <TextField
      InputLabelProps={{ shrink: true }}
      InputProps={{
        endAdornment: (<InputAdornment position='end'>{t('day(s)')}</InputAdornment>),
        inputProps: { min: 0 }
      }}
      color='warning'
      fullWidth
      inputProps={{ step: '1' }}
      label={t('Announcement delay')}
      name='announcementDelay'
      // onChange={handleRecoveryDelay}
      placeholder='0'
      type='number'
      // value={recoveryDelay}
      variant='outlined'
    />
  );

  const ProxyTypeSelect = () => (
    <Autocomplete
      ListboxProps={{ sx: { fontSize: 12 } }}
      defaultValue={proxyType[0]}
      // inputValue={text}
      // onChange={handleAutoComplateChange}
      // onInputChange={handleInputChange}
      options={proxyType}
      // eslint-disable-next-line react/jsx-no-bind
      renderInput={(params) =>
        <TextField
          {...params}
          InputLabelProps={{ shrink: true, style: { fontSize: 17 } }}
          autoFocus
          label={t('Proxy type')}
        // onChange={handleChange}
        />
      }
      sx={{ '& .MuiAutocomplete-input, & .MuiInputLabel-root': { fontSize: 13 } }}
    />
  );

  const ShowItem = ({ title, value }: { title: string, value: string | undefined }) => (
    <Grid container item spacing={1} xs={12}>
      <Grid item sx={{ fontWeight: 'bold' }}>
        {title}:
      </Grid>
      <Grid item>
        {value}
      </Grid>
    </Grid>
  );

  const ShowAccountInfo = ({ info }: { info: DeriveAccountInfo }) => (
    <Grid alignItems='center' container item xs={12}>
      <Grid item xs={1}>
        {filteredAccountsInfo && filteredAccountsInfo.length > 1 &&
          <NavigateBeforeIcon onClick={() => navigateBefore(info)} sx={{ cursor: 'pointer', fontSize: 26 }} />
        }
      </Grid>
      <Grid item xs>
        <ShowItem title={t<string>('Display')} value={info.identity.display} />
        <ShowItem title={t<string>('Legal')} value={info.identity.legal} />
        <ShowItem title={t<string>('Email')} value={info.identity.email} />
        <ShowItem title={t<string>('Element')} value={info.identity.riot} />
        <ShowItem title={t<string>('Twitter')} value={info.identity.twitter} />
        <ShowItem title={t<string>('Web')} value={info.identity.web} />
        {!isValidAddress(text) && <ShowItem title={t<string>('Account Id')} value={String(info.accountId)} />}
      </Grid>
      {filteredAccountsInfo && filteredAccountsInfo.length > 1 &&
        <Grid item xs={0.5}>
          <NavigateNextIcon fontSize='large' onClick={() => navigateNext(info)} sx={{ cursor: 'pointer', fontSize: 26 }} />
        </Grid>
      }
    </Grid>
  );

  return (
    <Popup handleClose={handleCloseModal} showModal={showAddProxyModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<AddCircleRoundedIcon fontSize='small' />} title={'Add Proxy'} />
      <Grid container sx={{ p: '35px 30px' }}>
        <Grid item sx={{ height: '110px' }} xs={12}>
          <Typography sx={{ color: 'text.primary', p: '15px' }} variant='body1'>
            {t('Enter/Select an account Id')}:
          </Typography>
          <AccountTextBox />
          <Grid container justifyContent='space-around' sx={{ pt: '25px' }}>
            <Grid item xs={5}>
              <ProxyTypeSelect />
            </Grid>
            <Grid item xs={5}>
              <DelayTextBox />
            </Grid>
          </Grid>
        </Grid>
        <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '280px', pt: '40px' }} xs={12}>
          {accountInfo
            ? <ShowAccountInfo info={accountInfo} />
            : accountInfo === null
              ? <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                {t('No indetity found')}
              </Grid>
              : accountInfo === undefined &&
              <Progress title={t('Loading identities ...')} />
          }
        </Grid>
        <Grid item sx={{ pt: 7 }} xs={12}>
          <Button
            data-button-action=''
            onClick={handleAddProxy}
          >
            {t('Add')}
          </Button>
        </Grid>

      </Grid>
    </Popup>
  );
}

export default styled(AddProxy)`
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
