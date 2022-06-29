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
  className?: string;
  handleExitCloseRecovery: () => void
  showClosRecoveryModal: boolean;
  rescuer: string;
}

function closeRecovery({ account, api, handleExitCloseRecovery, showClosRecoveryModal, rescuer }: Props): React.ReactElement<Props> {
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
  const [isProxy, setIsProxy] = useState<boolean | undefined>();

  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});

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

  const handleNextToInitiateRecovery = useCallback(() => {
    setState('initiateRecovery');
    setConfirmModalOpen(true);
  }, []);



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

    // let recoveries = [];

    // // eslint-disable-next-line no-void
    // void hasActiveRecoveries.entries().then((ars) => {
    //   ars.map(([key, option]) => {
    //     recoveries.push([encodeAddress('0x' + key.toString().slice(82, 146), chain?.ss58Format), encodeAddress('0x' + key.toString().slice(162), chain?.ss58Format)])
    //   });
    //   console.log('recoveries:',recoveries);
    // });

    // eslint-disable-next-line no-void
    void api.query.recovery.proxy(account.accountId).then((r) => {
      const proxy = r.isSome ? r.unwrap().toString() : '';

      setIsProxy(proxy === lostAccount.accountId);
    });
  }, [account.accountId, api, chain?.ss58Format, lostAccount, lostAccountRecoveryInfo]);

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

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

  return (
    <Popup handleClose={handleExitCloseRecovery} showModal={showClosRecoveryModal}>
      <PlusHeader action={handleExitCloseRecovery} chain={chain} closeText={'Close'} icon={<SupportIcon fontSize='small' />} title={'Rescue account'} />
      <Grid container sx={{ p: '25px 30px' }}>
        <Grid item pt='35px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle2'>
            {t<string>('Enter the lost account address (or search by identity)')}:
          </Typography>
          <AccountTextBox />
        </Grid>
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
      {showConfirmModal && api && chain && state && account && lostAccount && lostAccountRecoveryInfo &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          lostAccount={lostAccount}
          // recoveryConsts={recoveryConsts}
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

export default styled(closeRecovery)`
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
