/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens rescuer page, where a rescuer can initiate, claim, and finally close a recovery  
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Support as SupportIcon } from '@mui/icons-material';
import { Typography, Autocomplete, Grid, Button as MuiButton, TextField, InputAdornment, IconButton, Stepper, Step, StepButton } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { ArrowBackIosRounded, CheckRounded as CheckRoundedIcon, Clear as ClearIcon, NavigateNext as NavigateNextIcon, NavigateBefore as NavigateBeforeIcon } from '@mui/icons-material';

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

const steps = ['Initiating recovery', 'Claiming recovery', 'Close recovery'];

function AsRescuer({ account, accountsInfo, api, handleCloseAsRescuer, recoveryConsts, showAsRescuerModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const [accountInfo, setAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [text, setText] = useState<string | undefined>();
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>();
  const [filteredAccountsInfo, setFilteredAccountsInfo] = useState<DeriveAccountInfo[] | undefined | null>();
  const [lostAccountRecoveryInfo, setLostAccountRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [hasActiveRecoveries, setHasActiveRecoveries] = useState<PalletRecoveryActiveRecovery | undefined | null>();
  const [isProxy, setIsProxy] = useState<boolean | undefined | null>();
  const [friendsAccountsInfo, setfriendsAccountsInfo] = useState<DeriveAccountInfo[] | undefined>();
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});

  const handleClearLostAccount = useCallback(() => {
    setLostAccountRecoveryInfo(undefined);
    setText(undefined);
    setLostAccount(undefined);
    setAccountInfo(undefined);
  }, []);

  const handleLostAccountChange = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value as string;

    setLostAccountRecoveryInfo(undefined);
    setText(value);
    setLostAccount(undefined);
    setAccountInfo(undefined);
  }, []);

  const handleConfirmLostAccount = useCallback(() => {
    const lostAccount = accountInfo ?? (text && isValidAddress(text) ? { accountId: text, identity: undefined } as unknown as DeriveAccountInfo : undefined);

    lostAccount && setLostAccount(lostAccount);
  }, [accountInfo, text]);

  const handleSearchIdentity = useCallback(() => {
    if (!accountsInfo?.length) {
      return;
    }

    if (!text) {
      return setFilteredAccountsInfo(undefined);
    }

    let filtered;

    if (text) {
      filtered = accountsInfo.filter((id) => JSON.stringify(id).toLowerCase().includes(text.toLocaleLowerCase()));

      if (filtered) {
        setFilteredAccountsInfo(filtered);
        setAccountInfo(filtered[0]);

        return;
      }
    }

    setFilteredAccountsInfo(null);
  }, [accountsInfo, text]);

  const handleNextToInitiateRecovery = useCallback(() => {
    setState('initiateRecovery');
    setConfirmModalOpen(true);
  }, []);

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  useEffect(() => {
    handleSearchIdentity();
  }, [handleSearchIdentity, text]);

  useEffect(() => {
    if (api && lostAccountRecoveryInfo?.friends) {
      Promise.all(
        lostAccountRecoveryInfo.friends.map((f) => api.derive.accounts.info(f))
      ).then((info) => setfriendsAccountsInfo(info))
        .catch(console.error);
    }
  }, [lostAccountRecoveryInfo, api]);

  useEffect(() => {
    if (!api || !lostAccount) { return; }

    // eslint-disable-next-line no-void
    void api.query.recovery.recoverable(lostAccount.accountId).then((r) => {
      setLostAccountRecoveryInfo(r.isSome ? r.unwrap() : null);
      console.log('is lost account recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });
  }, [api, lostAccount]);

  useEffect(() => {
    if (!api || !account?.accountId || !lostAccount || !lostAccountRecoveryInfo) { return; }

    const hasActiveRecoveries = api.query.recovery.activeRecoveries;

    // eslint-disable-next-line no-void
    void hasActiveRecoveries(lostAccount.accountId, account.accountId).then((r) => {
      setHasActiveRecoveries(r.isSome ? r.unwrap() : null);
      console.log('hasActiveRecoveries:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
    });

    // eslint-disable-next-line no-void
    void api.query.recovery.proxy(account.accountId).then((r) => {
      const proxy = r.isSome ? r.unwrap().toString() : null;

      setIsProxy(proxy === lostAccount.accountId);
    });
  }, [account?.accountId, api, chain?.ss58Format, lostAccount, lostAccountRecoveryInfo]);

  const navigateBefore = useCallback((info: DeriveAccountInfo) => {
    const index = filteredAccountsInfo?.findIndex((f) => f.accountId === info.accountId);

    if (index === 0) {
      setAccountInfo(filteredAccountsInfo[filteredAccountsInfo.length - 1]);
    } else {
      setAccountInfo(filteredAccountsInfo[index - 1]);
    }
  }, [filteredAccountsInfo]);

  const navigateNext = useCallback((info: DeriveAccountInfo) => {
    const index = filteredAccountsInfo?.findIndex((f) => f.accountId === info.accountId);

    if (index === filteredAccountsInfo.length - 1) {
      setAccountInfo(filteredAccountsInfo[0]);
    } else {
      setAccountInfo(filteredAccountsInfo[index + 1]);
    }
  }, [filteredAccountsInfo]);

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
                  {text ? <ClearIcon /> : ''}
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
          disabled={!accountsInfo?.length}
          fullWidth
          // helperText={t<string>('Please enter the lost account information')}
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

  const ShowAccountInfo = ({ info }: { info: DeriveAccountInfo }) => (
    <Grid alignItems='center' container item xs={12}>
      <Grid item xs={1}>
        <NavigateBeforeIcon onClick={() => navigateBefore(info)} sx={{ cursor: 'pointer', fontSize: 26 }} />
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
      <Grid item xs={0.5}>
        <NavigateNextIcon fontSize='large' onClick={() => navigateNext(info)} sx={{ cursor: 'pointer', fontSize: 26 }} />
      </Grid>
    </Grid>
  );

  return (
    <Popup handleClose={handleCloseAsRescuer} showModal={showAsRescuerModal}>
      <PlusHeader action={handleCloseAsRescuer} chain={chain} closeText={'Close'} icon={<SupportIcon fontSize='small' />} title={'Rescue account'} />
      <Grid container sx={{ p: '25px 30px' }}>
        <Grid item xs={12}>
          <Stepper activeStep={activeStep} nonLinear>
            {steps.map((label, index) =>
              <Step completed={completed[index]} key={label}>
                <StepButton color='inherit' onClick={handleStep(index)}>
                  {label}
                </StepButton>
              </Step>
            )}
          </Stepper>
        </Grid>
        <Grid item pt='35px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle2'>
            {t<string>('Enter a lost account address (or search by identity)')}:
          </Typography>
          <AccountTextBox />
        </Grid>
        {!lostAccount &&
          <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '250px' }} xs={12}>
            {accountInfo
              ? <ShowAccountInfo info={accountInfo} />
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
                  sx={{ textTransform: 'none' }}
                >
                  {t<string>('Confirm the lost account')}
                </MuiButton>
              </Grid>
            }
          </Grid>
        }
        {lostAccount &&
          <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '250px', p: '20px 20px 20px 50px' }} xs={12}>
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
                  : isProxy
                    ? <Typography sx={{ color: 'green', pb: '10px' }} variant='subtitle1'>
                      {t<string>('Account is already a proxy')}
                    </Typography>
                    : <Typography sx={{ color: 'green', pb: '10px' }} variant='subtitle1'>
                      {t<string>('Account is recoverable, proceed')}
                    </Typography>
                }
              </>
            }
          </Grid>
        }
        <Grid item sx={{ pt: 3 }} xs={12}>
          <Button
            data-button-action=''
            isDisabled={!lostAccount || !lostAccountRecoveryInfo || !!hasActiveRecoveries || isProxy}
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
          friends={friendsAccountsInfo}
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
