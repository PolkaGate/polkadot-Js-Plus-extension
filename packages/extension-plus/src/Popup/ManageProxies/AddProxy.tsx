// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens a page, where you can add a proxy
 * */

import type { ApiPromise } from '@polkadot/api';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AddCircleRounded as AddCircleRoundedIcon, NavigateBefore as NavigateBeforeIcon, NavigateNext as NavigateNextIcon, NoAccounts as NoAccountsIcon } from '@mui/icons-material';
import { Autocomplete, FormControl, Grid, InputAdornment, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Chain } from '@polkadot/extension-chains/types';
import { Button } from '@polkadot/extension-ui/components';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Hint, PlusHeader, Popup, Progress } from '../../components';
import { NameAddress, Proxy } from '../../util/plusTypes';
import { getFormattedAddress, isValidAddress } from '../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  address: string;
  settingsPrefix: number;
  addressesOnThisChain: NameAddress[] | undefined;
  chain: Chain | null;
  className?: string;
  proxies: Proxy[] | undefined;
  showAddProxyModal: boolean;
  setShowAddProxyModal: React.Dispatch<React.SetStateAction<boolean>>;
  setProxies: React.Dispatch<React.SetStateAction<Proxy[] | undefined>>;
}

const PROXY_TYPE_POLKADOT = ['Any', 'NonTransfer', 'Staking', 'Governance', 'IdentityJudgement', 'CancelProxy', 'Auction'];
const PROXY_TYPE_KUSAMA = ['Any', 'NonTransfer', 'Staking', 'Society', 'Governance', 'IdentityJudgement', 'CancelProxy', 'Auction'];
const PROXY_TYPE_WESTEND = ['Any', 'NonTransfer', 'Staking', 'SudoBalances', 'IdentityJudgement', 'CancelProxy', 'Auction'];
const PROXY_TYPES = { Kusama: PROXY_TYPE_KUSAMA, Polkadot: PROXY_TYPE_POLKADOT, Westend: PROXY_TYPE_WESTEND }

function AddProxy({ address, addressesOnThisChain, api, chain, proxies, setProxies, setShowAddProxyModal, settingsPrefix, showAddProxyModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [text, setText] = useState<string | undefined>();
  const [proxyType, setProxyType] = useState<string | undefined | null>();
  const [delay, setDelay] = useState<number>(0);
  const formatted = getFormattedAddress(address, chain, settingsPrefix);

  const chainName = chain?.name.replace(' Relay Chain', '');
  const PROXY_TYPE = PROXY_TYPES[chainName];

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

  const handleProxyTypeChange = useCallback((event: SelectChangeEvent<string | null>): void => {
    setProxyType(event.target.value);
  }, []);

  const handleInputChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: string) => {
    setText(value);
    setAccountInfo(undefined);
  }, []);

  useEffect(() => {
    if (!isValidAddress(text)) {
      return;
    }

    api && api.derive.accounts.info(text).then((info) => {

      if (info.identity.display) {
        setAccountInfo(info);
      } else {
        setAccountInfo(null);
      }
    });
  }, [api, text]);

  const handleAddProxy = useCallback(() => {
    const proxy = { delay, delegate: text, proxyType: PROXY_TYPE[proxyType] };
    console.log('proxy:', proxy)
    setProxies((pre) => pre?.length ? pre.concat(proxy) : [proxy]);
    setShowAddProxyModal(false);
  }, [delay, proxyType, setProxies, setShowAddProxyModal, text]);

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

  const ProxyTypeSelect = () => (
    <FormControl fullWidth>
      <InputLabel id='proxyType'>{t('Proxy type')}</InputLabel>
      <Select
        id='proxyType-select'
        label={t('Proxy type')}
        labelId='proxyType'
        labelId='proxyType-select-label'
        onChange={handleProxyTypeChange}
        sx={{ fontSize: 14, p: 0 }}
        value={proxyType}
      >
        {PROXY_TYPE.map((p, index) => (
          <MenuItem key={index} sx={{ fontSize: 14 }} value={index}>{p}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const DelayTextBox = () => (
    <TextField
      InputLabelProps={{ shrink: true, style: { fontSize: 17 } }}
      InputProps={{
        endAdornment: (<InputAdornment position='end'>{t('block(s)')}</InputAdornment>),
        inputProps: { min: 0 },
        style: { fontSize: 13 }
      }}
      color='warning'
      fullWidth
      inputProps={{ step: '1' }}
      label={t('Delay')}
      name='announcementDelay'
      onChange={() => setDelay(event.target.value)}
      placeholder='0'
      type='number'
      value={delay}
      variant='outlined'
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
      <ShowItem title={t<string>('Display')} value={info.identity.display} />
      <ShowItem title={t<string>('Legal')} value={info.identity.legal} />
      <ShowItem title={t<string>('Email')} value={info.identity.email} />
      <ShowItem title={t<string>('Element')} value={info.identity.riot} />
      <ShowItem title={t<string>('Twitter')} value={info.identity.twitter} />
      <ShowItem title={t<string>('Web')} value={info.identity.web} />
      {!isValidAddress(text) && <ShowItem title={t<string>('Account Id')} value={String(info.accountId)} />}
    </Grid>
  );

  return (
    <Popup handleClose={handleCloseModal} showModal={showAddProxyModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<AddCircleRoundedIcon fontSize='small' />} title={'Add Proxy'} />
      <Grid container sx={{ p: '35px 30px' }}>
        <Grid item xs={12}>
          <Typography sx={{ color: 'text.primary' }} variant='body1'>
            {t('Enter/Select an account Id')}:
          </Typography>
          <AccountTextBox />
          <Grid container justifyContent='space-between' sx={{ pt: '30px' }}>
            <Grid alignItems='center' container justifyContent='space-between' xs={5}>
              <Grid item xs={1.5}>
                <Hint icon id='proxTypeHint' place='bottom-end' tip={t('The permissions allowed for this proxy account')}>
                </Hint>
              </Grid>
              <Grid item xs>
                <ProxyTypeSelect />
              </Grid>
            </Grid>
            <Grid alignItems='center' container justifyContent='space-between' xs={5}>
              <Grid item xs={1.5}>
                <Hint icon id='proxyDelay' place='bottom' tip={t('The announcement period required of the initial proxy. Will generally be zero')}>
                </Hint>
              </Grid>
              <Grid item xs>
                <DelayTextBox />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '220px', pt: '40px' }} xs={12}>
          {accountInfo
            ? <ShowAccountInfo info={accountInfo} />
            : accountInfo === null
              ? <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                {t('No indetity found')}
              </Grid>
              : accountInfo === undefined && text &&
              <Progress title={t('Loading identities ...')} />
          }
        </Grid>
        <Grid item sx={{ pt: 7 }} xs={12}>
          <Button
            data-button-action=''
            isDisabled={!text || proxyType === undefined}
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
