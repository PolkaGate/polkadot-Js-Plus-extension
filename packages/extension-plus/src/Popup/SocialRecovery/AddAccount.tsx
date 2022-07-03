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

import { AddCircleRounded as AddCircleRoundedIcon } from '@mui/icons-material';
import { Typography, Autocomplete, Grid, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import Identicon from '@polkadot/react-identicon';

import isValidAddress from '../../util/validateAddress';
import { SettingsContext, AccountContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress } from '../../components';

import { AddressState, nameAddress } from '../../util/plusTypes';
import { Button } from '@polkadot/extension-ui/components';

interface Props extends ThemeProps {
  className?: string;
  showAddFriendModal: boolean;
  setShowAddFriendModal: React.Dispatch<React.SetStateAction<boolean>>;
  setFriends: React.Dispatch<React.SetStateAction<DeriveAccountInfo[]>>;
  friends: DeriveAccountInfo[];
  accountsInfo: DeriveAccountInfo[] | undefined;
  addresesOnThisChain: nameAddress[];
  handleAddAccount: () => void;
  helperText: string;
}


function AddAccount({ accountsInfo, handleAddAccount, helperText, addresesOnThisChain, friends, setFriends, setShowAddFriendModal, showAddFriendModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [text, setText] = useState<string | undefined>();

  const handleAddress = useCallback((value: string | null) => {
    if (!value) {
      // setNewAddress(undefined);
      setText(undefined);

      return;
    }

    const indexOfDots = value?.indexOf(':');
    let mayBeAddress = value?.slice(indexOfDots + 1)?.trim();

    mayBeAddress = mayBeAddress && isValidAddress(mayBeAddress) ? mayBeAddress : undefined;

    if (mayBeAddress) {
      setText(mayBeAddress);
    }
  }, []);

  const handleAutoComplateChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    handleAddress(value);
  }, [handleAddress]);

  const handleChange = useCallback((_event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = _event.target.value;

    setAccount(undefined);
    setAccountRecoveryInfo(undefined);

    setText(value);
    // handleAddress(value);
  }, []);

  const handleBlur = useCallback(() => {
    // handleAddress(event.target.value);
  }, []);

  const handleSearchFriend = useCallback(() => {
    if (!accountsInfo?.length) { return; }

    if (!text) {
      return setAccountInfo(undefined);
    }
    let accountInfo;

    if (text) {
      accountInfo = accountsInfo.find((id) => JSON.stringify(id).toLowerCase().includes(text.toLocaleLowerCase()));

      if (accountInfo) { return setAccountInfo(accountInfo); }
    }

    setAccountInfo(null);
  }, [accountsInfo, text]);

  useEffect(() => {
    handleSearchFriend();
  }, [handleSearchFriend, text]);


  const handleCloseModal = useCallback((): void => {
    setShowAddFriendModal(false);
  }, [setShowAddFriendModal]);

  const FriendTextBox = () => (
    <Grid alignItems='center' container sx={{ pt: 2 }}>
      <Grid item xs={1}>
        {text &&
          <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={40}
            theme={chain?.icon || 'polkadot'}
            value={text}
          />}
      </Grid>
      <Grid item xs={11}>
        <Autocomplete
          ListboxProps={{ sx: { fontSize: 12 } }}
          autoFocus
          defaultValue={text}
          // disabled={disabled}
          freeSolo
          onBlur={handleBlur}
          onChange={handleAutoComplateChange}
          options={addresesOnThisChain?.map((option) => `${option?.name} :    ${option.address}`)}
          // eslint-disable-next-line react/jsx-no-bind
          renderInput={(params) =>
            <TextField
              {...params}
              InputLabelProps={{ shrink: true }}
              autoFocus
              error={!text}
              label={t('New friend')}
              onChange={handleChange}
              placeholder={'account Id / name / twitter / element Id / email / web site'}
            />
          }
          sx={{ '& .MuiAutocomplete-input, & .MuiInputLabel-root': { fontSize: 13 } }}
        />
      </Grid>
    </Grid>
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

  const ShowAccountInfo = (accountInfo: DeriveAccountInfo) => (
    <>
      <ShowItem title={t<string>('Display')} value={accountInfo.identity.display} />
      <ShowItem title={t<string>('Legal')} value={accountInfo.identity.legal} />
      <ShowItem title={t<string>('Email')} value={accountInfo.identity.email} />
      <ShowItem title={t<string>('Element')} value={accountInfo.identity.riot} />
      <ShowItem title={t<string>('Twitter')} value={accountInfo.identity.twitter} />
      <ShowItem title={t<string>('Web')} value={accountInfo.identity.web} />
      {!isValidAddress(text) && <ShowItem title={t<string>('Account Id')} value={String(accountInfo.accountId)} />}
    </>
  );

  const AccountTextBox = () => (
    <Grid alignItems='center' container sx={{ pt: 2 }}>
      <Grid item xs={1}>
        {accountInfo &&
          <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={40}
            theme={chain?.icon || 'polkadot'}
            value={accountInfo.accountId}
          />}
      </Grid>
      <Grid item xs={11}>
        <TextField
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  onClick={handleClearAccountInfo}
                >
                  {accountInfo !== null ? <ClearIcon /> : ''}
                </IconButton>
              </InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position='start'>
                {/* {accountInfoIsValid ? <CheckRoundedIcon color='success' /> : ''} */}
              </InputAdornment>
            ),
            style: { fontSize: 14 }
          }}
          autoFocus
          disabled={!accountsInfo?.length}
          fullWidth
          helperText={helperText}
          label={t<string>('Account')}
          onChange={handleAccountInfoChange}
          placeholder={'account Id / name / twitter / element Id / email / web site'}
          size='medium'
          type='string'
          value={accountInfo?.accountId || text}
          variant='outlined'
        />
      </Grid>
    </Grid>
  );

  return (
    <Popup handleClose={handleCloseModal} showModal={showAddFriendModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<AddCircleRoundedIcon fontSize='small' />} title={'Add Friend'} />
      <Grid container sx={{ p: '25px 30px' }}>
        <Grid item pt='15px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle2'>
            {t<string>('Enter the lost account Id (identity), who you want to vouch for')}:
          </Typography>
          <AccountTextBox />
        </Grid>
        {!accountInfo &&
          <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '250px', p: '20px 20px 20px 50px' }} xs={12}>
            {accountInfo
              ? <ShowAccountInfo accountInfo={accountInfo} />
                : accountInfo === null ?
                <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                  {t<string>('No indetity found for this account!')}
                </Grid>
                : !accountsInfo?.length && accountInfo === undefined &&
                <Progress title={t<string>('Loading identities ...')} />
              }
                {(accountInfo || isValidAddress(text)) &&
                  <Grid container item justifyContent='center' sx={{ p: '10px 35px' }} xs={12}>
                    <MuiButton
                      color='primary'
                      onClick={handleConfirmAccountInfo}
                      variant='contained'
                      sx={{ textTransform: 'none' }}
                    >
                      {t<string>('Confirm your lost account')}
                    </MuiButton>
                  </Grid>
                }
              </Grid>
          }
            // <Grid item sx={{ pt: 7 }} xs={12}>
            //   <Button
            //     data-button-action=''
            //     // isBusy={isBusy} isDisabled={isDisabled}
            //     onClick={handleAddAccount}
            //   >
            //     {t('Add')}
            //   </Button>
            // </Grid>

          </Grid>
    </Popup>
  );
}

export default styled(AddAccount)`
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
