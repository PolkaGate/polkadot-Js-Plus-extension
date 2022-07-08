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
import { Typography, Autocomplete, Grid, Button as MuiButton, TextField, InputAdornment, IconButton, Stepper, Step, StepButton, Stack } from '@mui/material';
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
import { ConfirmButton, Password, PlusHeader, Popup, Progress, ShowValue } from '../../components';
import type { ApiPromise } from '@polkadot/api';
import type { PalletRecoveryRecoveryConfig, PalletRecoveryActiveRecovery } from '@polkadot/types/lookup';
import { BN, hexToString } from '@polkadot/util';

import { AddressState, nameAddress, RecoveryConsts } from '../../util/plusTypes';
import { Button } from '@polkadot/extension-ui/components';
import Confirm from './Confirm';
import AddNewAccount from './AddNewAccount';
import { remainingTime } from '../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  className?: string;
  handleCloseAsRescuer: () => void
  showAsRescuerModal: boolean;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
}

const steps = ['Initiating recovery', 'Claiming recovery', 'Close recovery'];

function AsRescuer({ account, accountsInfo, addresesOnThisChain, api, handleCloseAsRescuer, recoveryConsts, showAsRescuerModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>();
  const [lostAccountHelperText, setLostAccountHelperText] = useState<string | undefined>();
  const [lostAccountRecoveryInfo, setLostAccountRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [hasActiveRecoveries, setHasActiveRecoveries] = useState<PalletRecoveryActiveRecovery | undefined | null>();
  const [isProxy, setIsProxy] = useState<boolean | undefined | null>();
  const [remainingBlocksToClaim, setRemainigBlocksToClaim] = useState<number | undefined>();
  const [friendsAccountsInfo, setfriendsAccountsInfo] = useState<DeriveAccountInfo[] | undefined>();
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});

  const handleNextToInitiateRecovery = useCallback(() => {
    setState('initiateRecovery');
    setConfirmModalOpen(true);
  }, []);

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  useEffect((): void => {
    api && hasActiveRecoveries && lostAccountRecoveryInfo && api.rpc.chain.getHeader().then((h) => {
      const currentBlockNumber = h.number.toNumber();
      // const now = Date.now();
      const initiateRecoveryBlock = hasActiveRecoveries.created.toNumber();
      // const initiateRecoveryTime = now - (currentBlockNumber - initiateRecoveryBlock) * 6000;

      // setInitiateDate(new Date(initiateRecoveryTime));
      const delayPeriod = lostAccountRecoveryInfo.delayPeriod.toNumber();

      setRemainigBlocksToClaim(initiateRecoveryBlock + delayPeriod - currentBlockNumber);
    });
  }, [api, hasActiveRecoveries, lostAccountRecoveryInfo]);

  console.log('remainingBlocksToClaim:', remainingBlocksToClaim);


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
      const proxy = r.isSome ? String(r.unwrap()) : null;

      setIsProxy(proxy === String(lostAccount.accountId));
      console.log('proxy:', r.isSome ? r.unwrap().toString() : 'noch');
    });
  }, [account?.accountId, api, chain?.ss58Format, lostAccount, lostAccountRecoveryInfo]);

  useEffect(() => {
    if (lostAccount) {
      if (lostAccountRecoveryInfo === undefined || hasActiveRecoveries === undefined || isProxy === undefined) {
        return;
      }

      if (lostAccountRecoveryInfo === null) {
        return setLostAccountHelperText(t<string>('Account is not recoverable'));
      }

      if (hasActiveRecoveries) {
        return setLostAccountHelperText(t<string>('Recovery is already initiated'));
      }

      if (!isProxy) {
        return setLostAccountHelperText(t<string>('Account is recoverable, proceed'));
      }

      return setLostAccountHelperText(t<string>('Account is already a proxy'));
    }
  }, [hasActiveRecoveries, isProxy, lostAccount, lostAccountRecoveryInfo, t]);

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
        <Grid height='395px' item pt='55px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px 10px 15px' }} variant='subtitle2'>
            {t<string>('Enter a lost account address (or search by identity)')}:
          </Typography>
          <AddNewAccount account={lostAccount} accountsInfo={accountsInfo} addresesOnThisChain={addresesOnThisChain} chain={chain} label={t('Lost')} setAccount={setLostAccount} />
          {lostAccountHelperText &&
            <Grid textAlign='center' pt='85px'>
              <Typography sx={{ color: 'text.primary' }} variant='subtitle2'>
                {lostAccountHelperText}
              </Typography>
            </Grid>
          }
          {remainingBlocksToClaim &&
            <>
              {remainingBlocksToClaim > 0
                ? <Grid fontSize={12} pt='20px' textAlign='center'>
                  <Typography sx={{ color: 'text.success' }} variant='subtitle2'>
                    {t('Remaining time to be able to claim recovery')}:
                  </Typography>
                  {remainingTime(remainingBlocksToClaim)}
                </Grid>
                : <Grid fontSize={12} textAlign='center' pt='20px'>
                  <Typography sx={{ color: 'text.success' }} variant='subtitle2'>
                    {t('Recovery can be claimed.')}
                  </Typography>
                </Grid>
              }
            </>
          }
        </Grid>
        <Grid item sx={{ pt: 3 }} xs={12}>
          <Button
            data-button-action=''
            isDisabled={!lostAccount || !lostAccountRecoveryInfo || !!hasActiveRecoveries || !!isProxy || (remainingBlocksToClaim && remainingBlocksToClaim > 0)}
            onClick={handleNextToInitiateRecovery}
          >
            {t<string>('Next')}
          </Button>
        </Grid>
      </Grid>
      {
        showConfirmModal && api && chain && state && account && lostAccount && recoveryConsts && lostAccountRecoveryInfo &&
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
    </Popup >
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
