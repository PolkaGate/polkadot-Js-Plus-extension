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

import { Support as SupportIcon } from '@mui/icons-material';
import { Typography, Autocomplete, Grid, Button as MuiButton, TextField, InputAdornment, IconButton } from '@mui/material';
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
import { ConfirmButton, Password, PlusHeader, Popup, Progress } from '../../components';
import type { ApiPromise } from '@polkadot/api';
import type { PalletRecoveryRecoveryConfig, PalletRecoveryActiveRecovery } from '@polkadot/types/lookup';

import { AddressState, RecoveryConsts } from '../../util/plusTypes';
import { Button } from '@polkadot/extension-ui/components';
import Confirm from './Confirm';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  className?: string;
  handleCloseAsRescuer: () => void
  showAsRescuerModal: boolean;
  recoveryConsts: RecoveryConsts | undefined;
}

function AsRescuer({ account, accountsInfo, api, handleCloseAsRescuer, recoveryConsts, showAsRescuerModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [text, setText] = useState<string | undefined>();
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>();
  const [lostAccountRecoveryInfo, setLostAccountRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined>();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [hasActiveRecoveries, setHasActiveRecoveries] = useState<PalletRecoveryActiveRecovery | undefined>();

  const handleClearLostAccount = useCallback(() => {
    setLostAccount(undefined);
    setLostAccountRecoveryInfo(undefined);
    setText('');
  }, []);

  const handleLostAccountChange = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;

    setLostAccount(undefined);
    setLostAccountRecoveryInfo(undefined);
    setText(value);
  }, []);

  const handleConfirmLostAccount = useCallback(() => {
    const lostAccount = accountInfo ?? (isValidAddress(text) ? { accountId: text } : undefined);

    lostAccount && setLostAccount(lostAccount);
  }, [accountInfo, text]);

  const handleSearchIdentity = useCallback(() => {
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

  const handleNextToInitiateRecovery = useCallback(() => {
    setState('initiateRecovery');
    setConfirmModalOpen(true);
  }, []);

  useEffect(() => {
    handleSearchIdentity();
  }, [handleSearchIdentity, text]);

  useEffect(() => {
    if (!api || !lostAccount) { return; }

    const isRecoverable = api.query.recovery.recoverable;

    // eslint-disable-next-line no-void
    void isRecoverable(lostAccount.accountId).then((r) => {
      setLostAccountRecoveryInfo(r.isSome && r.unwrap());
      console.log('is lost account Recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });
  }, [api, lostAccount]);

  useEffect(() => {
    if (!api || !account?.accountId || !lostAccount || !lostAccountRecoveryInfo) { return; }

    const hasActiveRecoveries = api.query.recovery.activeRecoveries;

    // eslint-disable-next-line no-void
    void hasActiveRecoveries(lostAccount.accountId, account.accountId).then((r) => {
      setHasActiveRecoveries(r.isSome && r.unwrap());
      console.log('hasActiveRecoveries:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });

    // eslint-disable-next-line no-void
    void api.query.recovery.proxy(lostAccount.accountId).then((r) => {
      console.log('proxy 0:', r);
      console.log('proxy:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });
  }, [account?.accountId, api, lostAccount, lostAccountRecoveryInfo]);

  const AccountTextBox = () => (
    <Grid alignItems='center' container sx={{ pt: 2 }}>
      <Grid item xs={1}>
        {lostAccount &&
          <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={40}
            theme={chain?.icon || 'polkadot'}
            value={lostAccount.accountId}
          />}
      </Grid>
      <Grid item xs={11}>
        <TextField
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
          autoFocus
          fullWidth
          helperText={t<string>('Please enter the lost account information')}
          label={t<string>('Account')}
          onChange={handleLostAccountChange}
          placeholder={'account Id / name / twitter / element Id / email / web site'}
          size='medium'
          type='string'
          value={lostAccount?.accountId || text}
          variant='outlined'
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

  return (
    <Popup handleClose={handleCloseAsRescuer} showModal={showAsRescuerModal}>
      <PlusHeader action={handleCloseAsRescuer} chain={chain} closeText={'Close'} icon={<SupportIcon fontSize='small' />} title={'Rescue account'} />
      <Grid container sx={{ p: '35px 30px' }}>
        <Grid item sx={{ height: '100px' }} xs={12}>
          <Typography sx={{ color: 'text.primary', pb: '10px' }} variant='caption'>
            {t<string>('Enter the lost account address ( or search it by its identity)')}:
          </Typography>
          {accountsInfo?.length && <AccountTextBox />}
        </Grid>
        {!lostAccount &&
          <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '280px', p: '40px 20px 20px 50px' }} xs={12}>
            {accountInfo
              ? <>
                <ShowItem title={t<string>('Display')} value={accountInfo.identity.display} />
                <ShowItem title={t<string>('Legal')} value={accountInfo.identity.legal} />
                <ShowItem title={t<string>('Email')} value={accountInfo.identity.email} />
                <ShowItem title={t<string>('Element')} value={accountInfo.identity.riot} />
                <ShowItem title={t<string>('Twitter')} value={accountInfo.identity.twitter} />
                <ShowItem title={t<string>('Web')} value={accountInfo.identity.web} />
                {!isValidAddress(text) && <ShowItem title={t<string>('Account Id')} value={String(accountInfo.accountId)} />}
              </>
              : accountInfo === null ?
                <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                  {t<string>('No indetity found for this account!')}
                </Grid>
                : !accountsInfo?.length && accountInfo === undefined &&
                <Progress title={t<string>('Loading identities ...')} />
            }
            {(accountInfo || isValidAddress(text)) &&
              <Grid container item justifyContent='center' sx={{ px: 7 }} xs={12}>
                <MuiButton
                  color='primary'
                  onClick={handleConfirmLostAccount}
                  variant='contained'
                >
                  {t<string>('Confirm your lost account')}
                </MuiButton>
              </Grid>
            }
          </Grid>
        }
        {lostAccount &&
          <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '280px', p: '40px 20px 20px 50px' }} xs={12}>
            {!lostAccountRecoveryInfo &&
              <Typography sx={{ color: 'text.secondary', pb: '10px' }} variant='subtitle1'>
                {t<string>('Account is not recoverable')}
              </Typography>
            }
            {lostAccountRecoveryInfo &&
              <>
                {hasActiveRecoveries
                  ? <Typography sx={{ color: 'text.primary', pb: '10px' }} variant='subtitle1'>
                    {t<string>('Recovery is already initiated')}
                  </Typography>
                  : <Typography sx={{ color: 'green', pb: '10px' }} variant='subtitle1'>
                    {t<string>('Account is recoverable, proceed')}
                  </Typography>
                }
              </>
            }
          </Grid>
        }
        <Grid item sx={{ pt: 7 }} xs={12}>
          <Button
            data-button-action=''
            isDisabled={!lostAccount || !lostAccountRecoveryInfo || hasActiveRecoveries}
            onClick={handleNextToInitiateRecovery}
          >
            {t<string>('Next')}
          </Button>
        </Grid>
      </Grid>
      {showConfirmModal && api && chain && state && account && lostAccount && recoveryConsts && lostAccountRecoveryInfo &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          lostAccount={lostAccount}
          recoveryConsts={recoveryConsts}
          recoveryDelay={lostAccountRecoveryInfo.delayPeriod.toNumber()}
          recoveryThreshold={lostAccountRecoveryInfo.threshold.toNumber()}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
        />
      }

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
