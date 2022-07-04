/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens friend page, where a friend can vouch for a lost account for a rescuer account
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AdminPanelSettings as AdminPanelSettingsIcon } from '@mui/icons-material';
import { Typography, Autocomplete, Grid, Button as MuiButton, TextField, InputAdornment, IconButton, Stepper, Step, StepButton } from '@mui/material';
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
  handleCloseAsFriend: () => void
  showAsFriendModal: boolean;
  recoveryConsts: RecoveryConsts | undefined;
}

function AsFriend({ account, accountsInfo, api, handleCloseAsFriend, recoveryConsts, showAsFriendModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const [lostAccountInfo, setLostAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [rescuerAccountInfo, setRescuerAccountInfo] = useState<DeriveAccountInfo | undefined | null>();
  const [lostText, setLostText] = useState<string | undefined>();
  const [rescuerText, setRescuerText] = useState<string | undefined>();
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>();
  const [rescuerAccount, setRescuerAccount] = useState<DeriveAccountInfo | undefined>();
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
    setLostAccount(undefined);
    setLostAccountRecoveryInfo(undefined);
    setLostText(undefined);
    setLostAccountInfo(undefined);
  }, []);

  const handleLostAccountChange = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value as string;

    setLostAccount(undefined);
    setLostAccountRecoveryInfo(undefined);
    setLostText(value);
    setLostAccountInfo(undefined);
  }, []);

  const handleConfirmLostAccount = useCallback(() => {
    const lostAccount = lostAccountInfo ?? (lostText && isValidAddress(lostText) ? { accountId: lostText, identity: undefined } as unknown as DeriveAccountInfo : undefined);

    lostAccount && setLostAccount(lostAccount);
  }, [lostAccountInfo, lostText]);

  const handleSearchIdentity = useCallback(() => {
    if (!accountsInfo?.length) {
      return;
    }

    if (!lostText) {
      return setLostAccountInfo(undefined);
    }

    let lostAccountInfo;

    if (lostText) {
      lostAccountInfo = accountsInfo.find((id) => JSON.stringify(id).toLowerCase().includes(lostText.toLocaleLowerCase()));

      if (lostAccountInfo) {
        return setLostAccountInfo(lostAccountInfo);
      }
    }

    setLostAccountInfo(null);
  }, [accountsInfo, lostText]);

  const handleNextToInitiateRecovery = useCallback(() => {
    setState('initiateRecovery');
    setConfirmModalOpen(true);
  }, []);

  useEffect(() => {
    handleSearchIdentity();
  }, [handleSearchIdentity, lostText]);

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

  const AccountTextBox = ({ info, text }: { info: DeriveAccountInfo | undefined, text: string | undefined }) => (
    <Grid alignItems='center' container sx={{ pt: 2 }}>
      <Grid item xs={1}>
        {info &&
          <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={40}
            theme={chain?.icon || 'polkadot'}
            value={info.accountId}
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
          helperText={info &&
            <Grid container>
              {!lostAccountRecoveryInfo &&
                <Grid item>
                  {t<string>('Account is not recoverable')}
                </Grid>
              }
              {lostAccountRecoveryInfo &&
                <>
                  {hasActiveRecoveries
                    ? <Grid item>
                      {t<string>('Recovery is already initiated')}
                    </Grid>
                    : isProxy
                      ? <Grid item sx={{ color: 'green' }}>
                        {t<string>('Account is already a proxy')}
                      </Grid>
                      : <Grid item sx={{ color: 'green' }}>
                        {t<string>('Account is recoverable, proceed')}
                      </Grid>
                  }
                </>
              }
            </Grid>
          }
          label={t<string>('Account')}
          onChange={handleLostAccountChange}
          placeholder={'account Id / name / twitter / element Id / email / web site'}
          size='medium'
          type='string'
          value={info?.accountId || text}
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

  const ShowAccountInfo = ({ info, text }: { info: DeriveAccountInfo, text: string | undefined }) => (
    <>
      <ShowItem title={t<string>('Display')} value={info.identity.display} />
      <ShowItem title={t<string>('Legal')} value={info.identity.legal} />
      <ShowItem title={t<string>('Email')} value={info.identity.email} />
      <ShowItem title={t<string>('Element')} value={info.identity.riot} />
      <ShowItem title={t<string>('Twitter')} value={info.identity.twitter} />
      <ShowItem title={t<string>('Web')} value={info.identity.web} />
      {!isValidAddress(text) && <ShowItem title={t<string>('Account Id')} value={String(info.accountId)} />}
    </>
  );

  return (
    <Popup handleClose={handleCloseAsFriend} showModal={showAsFriendModal}>
      <PlusHeader action={handleCloseAsFriend} chain={chain} closeText={'Close'} icon={<AdminPanelSettingsIcon fontSize='small' />} title={'Vouch account'} />
      <Grid container sx={{ p: '25px 30px' }}>
        <Grid item pt='15px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle2'>
            {t<string>('Enter the lost account Id (identity), who you want to vouch for')}:
          </Typography>
          <AccountTextBox info={lostAccount} text={lostText} />
        </Grid>
        {!lostAccount &&
          <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '250px', p: '20px 20px 20px 50px' }} xs={12}>
            {lostAccountInfo
              ? <ShowAccountInfo info={lostAccountInfo} text={lostText} />
              : lostAccountInfo === null
                ? <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                  {t<string>('No indetity found for this account!')}
                </Grid>
                : !accountsInfo?.length && lostAccountInfo === undefined &&
                <Progress title={t<string>('Loading identities ...')} />
            }
            {(lostAccountInfo || isValidAddress(lostText)) &&
              <Grid container item justifyContent='center' sx={{ p: '10px 35px' }} xs={12}>
                <MuiButton
                  color='primary'
                  onClick={handleConfirmLostAccount}
                  variant='contained'
                  sx={{ textTransform: 'none' }}
                >
                  {t<string>('Confirm your lost account')}
                </MuiButton>
              </Grid>
            }
          </Grid>
        }


        {lostAccount &&
          <Grid item xs={12}>
            <Grid item pt='15px' xs={12}>
              <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle2'>
                {t<string>('Enter the rescuer account Id (identity)')}:
              </Typography>
              <AccountTextBox info={rescuerAccountInfo} text={rescuerText} />
            </Grid>
            {!rescuerAccount &&
              <Grid alignItems='center' container item justifyContent='center' sx={{ fontSize: 12, height: '150px', p: '20px 20px 20px 50px' }} xs={12}>
                {rescuerAccountInfo
                  ? <ShowAccountInfo info={rescuerAccountInfo} />
                  : rescuerAccountInfo === null
                    ? <Grid item sx={{ fontSize: 12, fontWeight: 600 }}>
                      {t<string>('No indetity found for this account!')}
                    </Grid>
                    : !accountsInfo?.length && rescuerAccountInfo === undefined &&
                    <Progress title={t<string>('Loading identities ...')} />
                }
                {(rescuerAccountInfo || isValidAddress(rescuerText)) &&
                  <Grid container item justifyContent='center' sx={{ p: '10px 35px' }} xs={12}>
                    <MuiButton
                      color='primary'
                      onClick={handleConfirmLostAccount}
                      variant='contained'
                      sx={{ textTransform: 'none' }}
                    >
                      {t<string>('Confirm your lost account')}
                    </MuiButton>
                  </Grid>
                }
              </Grid>
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

export default styled(AsFriend)`
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
