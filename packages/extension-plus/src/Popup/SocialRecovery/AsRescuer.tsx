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
import { Typography, Autocomplete, Grid, TextField, InputAdornment, IconButton } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { ArrowBackIosRounded, CheckRounded as CheckRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';

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
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  className?: string;
  showAsRescuerModal: boolean;
  addresesOnThisChain: nameAddress[];
  handleCloseAsRescuer: () => void
}


function AsRescuer({ accountsInfo, account, addresesOnThisChain, handleCloseAsRescuer, showAsRescuerModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [text, setText] = useState<string | undefined>();
  const [lostAccount, setLostAccount] = useState<string | undefined>();

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

  const handleClearLostAccount = useCallback(() => {
    setLostAccount('');
    setText('');
  }, []);

  const handleLostAccountChange = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;

    setText(value);
    // handleAddress(value);
  }, []);

  // const handleBlur = useCallback(() => {
  //   // handleAddress(event.target.value);
  // }, []);

  const handleSearchFreind = useCallback(() => {
    if (!accountsInfo?.length) {
      return;
    }

    if (!text) {
      return setAccountInfo(undefined);
    }

    let accountInfo;

    if (text) {
      accountInfo = accountsInfo.find((id) => JSON.stringify(id).toLowerCase().includes(text.toLocaleLowerCase()));

      if (accountInfo) {
        return setAccountInfo(accountInfo);
      }
    }

    setAccountInfo(null);
  }, [accountsInfo, text]);

  useEffect(() => {
    handleSearchFreind();
  }, [handleSearchFreind, text]);

  // const handleAddFreind = useCallback(() => {
  //   const mayBeAddress = isValidAddress(text) ? text : undefined;

  //   if (!mayBeAddress && !accountInfo?.accountId) return;

  //   const mayBeNewFreind = mayBeAddress || accountInfo?.accountId?.toString();

  //   if (!friends.find((i) => i.accountId === mayBeNewFreind)) {
  //     const temp = [...friends];

  //     accountInfo ? temp.push(accountInfo) : temp.push({ accountId: mayBeNewFreind, identity: undefined });

  //     console.log('setting friends to ', [...temp]);
  //     setFriends([...temp]);
  //     // setShowAsRescuerModal(false);
  //   }
  // }, [accountInfo, friends, setFriends, setShowAddFreindModal, text]);

  // const handleCloseModal = useCallback((): void => {
  //   setShowAsRescuerModal(false);
  // }, [setShowAsRescuerModal]);

  const FreindTextBox = () => (
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
        <TextField
          autoFocus
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton
                  onClick={handleClearLostAccount}
                >
                  {lostAccount !== null ? <ClearIcon /> : ''}
                </IconButton>
              </InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position='start'>
                {/* {lostAccountIsValid ? <CheckRoundedIcon color='success' /> : ''} */}
              </InputAdornment>
            ),
            style: { fontSize: 14 }
          }}
          fullWidth
          helperText={t('Please enter the lost account information')}
          label={t('Lost account')}
          onChange={handleLostAccountChange}
          placeholder={'account Id / name / twitter / element Id / email / web site'}
          size='medium'
          type='string'
          value={lostAccount || text}
          variant='outlined'
        />
      </Grid>
    </Grid>
  );

  return (
    <Popup handleClose={handleCloseAsRescuer} showModal={showAsRescuerModal}>
      <PlusHeader action={handleCloseAsRescuer} chain={chain} closeText={'Close'} icon={<AddCircleRoundedIcon fontSize='small' />} title={'Rescue account'} />
      <Grid container sx={{ p: '35px 30px' }}>
        <Grid item xs={12} sx={{ height: '100px' }}>
          <Typography sx={{ color: 'text.primary', pb: '10px' }} variant='caption'>
            {t('Enter the lost account address ( or search it by its identity)')}:
          </Typography>
          {accountsInfo?.length && <FreindTextBox />}
        </Grid>
        <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '280px', p: '40px 20px 20px 50px' }} xs={12}>
          {accountInfo
            ? <>
              <Grid container item spacing={1} xs={12}>
                <Grid item sx={{ fontWeight: 'bold' }}>
                  {t('Display')}:
                </Grid>
                <Grid item>
                  {accountInfo.identity.display}
                </Grid>
              </Grid>
              <Grid container item spacing={1} xs={12}>
                <Grid item sx={{ fontWeight: 600, fontSize: 12 }}>
                  {t('Legal')}:
                </Grid>
                <Grid item>
                  {accountInfo.identity.legal}
                </Grid>
              </Grid>
              <Grid container item spacing={1} xs={12}>
                <Grid item sx={{ fontWeight: 600, fontSize: 12 }}>
                  {t('Email')}:
                </Grid>
                <Grid item>
                  {accountInfo.identity.email}
                </Grid>
              </Grid>
              <Grid container item spacing={1} xs={12}>
                <Grid item sx={{ fontWeight: 600, fontSize: 12 }}>
                  {t('Element')}:
                </Grid>
                <Grid item>
                  {accountInfo.identity.riot}
                </Grid>
              </Grid>
              <Grid container item spacing={1} xs={12}>
                <Grid item sx={{ fontWeight: 600, fontSize: 12 }}>
                  {t('Twitter')}:
                </Grid>
                <Grid item>
                  {accountInfo.identity.twitter}
                </Grid>
              </Grid>
              <Grid container item spacing={1} xs={12}>
                <Grid item sx={{ fontWeight: 600, fontSize: 12 }}>
                  {t('Web')}:
                </Grid>
                <Grid item>
                  {accountInfo.identity.web}
                </Grid>
              </Grid>
              {!isValidAddress(text) &&
                <Grid container item spacing={1} xs={12}>
                  <Grid item sx={{ fontWeight: 600, fontSize: 12 }}>
                    {t('Account Id')}:
                  </Grid>
                  <Grid item>
                    {accountInfo.accountId}
                  </Grid>
                </Grid>
              }
            </>
            : accountInfo === null ?
              <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                {t('No indetity found')}
              </Grid>
              : !accountsInfo?.length && accountInfo === undefined &&
              <Progress title={t('Loading identities ...')} />
          }
        </Grid>
        <Grid item sx={{ pt: 7 }} xs={12}>
          <Button
            data-button-action=''
          // isBusy={isBusy} isDisabled={isDisabled}
          // onClick={handleAddFreind}
          >
            {t('Add')}
          </Button>
        </Grid>

      </Grid>
    </Popup>
  );
}

export default styled(AsRescuer)`
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
