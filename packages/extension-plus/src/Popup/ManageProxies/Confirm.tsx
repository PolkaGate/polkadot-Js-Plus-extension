// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description list all governance options e.g., Democracy, Council, Treasury, etc.
*/
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Clear as ClearIcon } from '@mui/icons-material';
import { Container, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import type { ApiPromise } from '@polkadot/api';
import type { Balance } from '@polkadot/types/interfaces';

import { AccountsStore } from '@polkadot/extension-base/stores';
import { Chain } from '@polkadot/extension-chains/types';
import { NextStepButton } from '@polkadot/extension-ui/components';
import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';
import useMetadata from '@polkadot/extension-ui/hooks/useMetadata';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { AccountContext, ActionContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { createAccountExternal, getMetadata } from '../../../../extension-ui/src/messaging';
import { Header } from '../../../../extension-ui/src/partials';
import { ConfirmButton, Hint, Identity, Password, PlusHeader, Popup, Progress, ShortAddress, ShowBalance2 } from '../../components';
import { useApi, useEndpoint } from '../../hooks';
import { AddressState, NameAddress, Proxy, TransactionDetail } from '../../util/plusTypes';
import { getFormattedAddress } from '../../util/plusUtils';
import AddressTextBox from './AddressTextBox';
import { ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { PASS_MAP } from '../../util/constants';
import { BN, BN_ZERO } from '@polkadot/util';

interface Props extends ThemeProps {
  className?: string;
  api: ApiPromise;
  chain: Chain;
  showConfirmModal: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  removedProxies: Proxy[] | undefined;
  newProxies: Proxy[] | undefined;
  formatted: string;
  deposit: BN;
  proxyInfo: DeriveAccountInfo[];
}


export default function Confirm({ api, chain, className, deposit, formatted, newProxies, proxyInfo, removedProxies, setConfirmModalOpen, showConfirmModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [notEnoughBalance, setNotEnoughBalance] = useState<boolean | undefined>();

  const removeProxy = api.tx.proxy.removeProxy; /** (delegate, proxyType, delay) **/
  const addProxy = api.tx.proxy.addProxy; /** (delegate, proxyType, delay) **/
  const batchAll = api.tx.utility.batchAll;

  const calls = [];

  removedProxies?.length && calls.push(...removedProxies.map((r: Proxy) => removeProxy(r.delegate, r.proxyType, r.delay)));
  newProxies?.length && calls.push(...newProxies.map((r: Proxy) => addProxy(r.delegate, r.proxyType, r.delay)));
  const tx = batchAll(calls);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void tx.paymentInfo(formatted).then((i) => setEstimatedFee(i?.partialFee));
  }, [formatted, tx]);

  const handleCloseModal = useCallback((): void => {
    setConfirmModalOpen(false);
  }, [setConfirmModalOpen]);

  const handleReject = useCallback((): void => {
    // setState('');
    // setConfirmingState('');
    onAction('/');
  }, [onAction]);

  const handleBack = useCallback((): void => {
    setConfirmingState('');

    handleCloseModal();
  }, [handleCloseModal]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    // const localState = state;
    const history: TransactionDetail[] = []; /** collects all records to save in the local history at the end */

    try {
      setConfirmingState('confirming');

      const signer = keyring.getPair(formatted);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      // if (localState === 'makeRecoverable' && recoveryDelay !== undefined) {
      //   const recoveryDelayInBlocks = Math.floor(recoveryDelay * 24 * 60 * 10);

      //   const params = [friendIds, recoveryThreshold, recoveryDelayInBlocks];
      //   const { block, failureText, fee, status, txHash } = await broadcast(api, createRecovery, params, signer, account.accountId);

      //   history.push({
      //     action: 'make_recoverable',
      //     amount: recoveryConsts && friendIds?.length
      //       ? amountToHuman(String(recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(friendIds.length))), decimals)
      //       : '0',
      //     block,
      //     date: Date.now(),
      //     fee: fee || '',
      //     from: String(account.accountId),
      //     hash: txHash || '',
      //     status: failureText || status,
      //     to: 'deposited'
      //   });

      //   setConfirmingState(status);
      // }


      // eslint-disable-next-line no-void
      // account?.accountId && void saveHistory(chain, hierarchy, String(account.accountId), history);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      // setState(localState);
      setConfirmingState('');
    }
  }, [password]);


  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={t('Confirm')} />
      <Container sx={{ pt: '10px', px: '30px' }}>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', fontSize: 14, fontWeight: 500, mb: '20px', py: '30px', px: '10px' }}>
          <Grid item>
            <ShowBalance2 api={api} balance={deposit} direction='row' title={`${t('deposit')}:`} />
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={estimatedFee} direction='row' title={`${t('fee')}:`} />
          </Grid>
        </Grid>
        <Grid container item sx={{ fontSize: 14, fontWeight: 500, bgcolor: grey[200], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', py: '15px', px: '10px' }}>
          <Grid item xs={5}>
            {t('identity')}
          </Grid>
          <Grid item xs={3}>
            {t('type')}
          </Grid>
          <Grid item xs={2}>
            {t('delay')}
          </Grid>
          <Grid item xs={2}>
            {t('action')}
          </Grid>
        </Grid>
        <Grid container item sx={{ borderLeft: '2px solid', borderBottom: '2px solid', borderRight: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[200], display: 'block', height: 180, pt: '15px', pl: '10px', overflowY: 'auto' }} xs={12}>
          {(!!removedProxies?.length) && proxyInfo &&
            <>
              {removedProxies?.map((proxy, index) => {
                const info = proxyInfo.find((p) => p.accountId == proxy.delegate);

                return (
                  <Grid container item key={index} sx={{ fontSize: 13 }}>
                    <Grid item xs={5}>
                      <Identity accountInfo={info} chain={chain} />
                    </Grid>
                    <Grid item xs={3}>
                      {proxy.proxyType}
                    </Grid>
                    <Grid item xs={2}>
                      {proxy.delay}
                    </Grid>
                    <Grid item xs={2}>
                      {t('To be Remove')}
                    </Grid>
                  </Grid>
                );
              })
              }
              {newProxies?.map((proxy, index) => {
                const info = proxyInfo.find((p) => p.accountId == proxy.delegate);

                return (
                  <Grid container item key={index} sx={{ fontSize: 13 }}>
                    <Grid item xs={5}>
                      <Identity accountInfo={info} chain={chain} />
                    </Grid>
                    <Grid item xs={3}>
                      {proxy.proxyType}
                    </Grid>
                    <Grid item xs={2}>
                      {proxy.delay}
                    </Grid>
                    <Grid item xs={2}>
                      {t('To be Add')}
                    </Grid>
                  </Grid>
                );
              })
              }
            </>
          }
        </Grid>
        <Grid container item sx={{ pt: '30px' }} xs={12}>
          <Password
            autofocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
            handleIt={handleConfirm}
            isDisabled={!estimatedFee}
            password={password}
            passwordStatus={passwordStatus}
            setPassword={setPassword}
            setPasswordStatus={setPasswordStatus}
          />
          <Grid alignItems='center' container item xs={12}>
            <Grid container item xs={12}>
              <ConfirmButton
                handleBack={handleBack}
                handleConfirm={handleConfirm}
                handleReject={handleReject}
                isDisabled={notEnoughBalance}
                state={confirmingState}
                text={notEnoughBalance ? t('Not enough balance') : t('Confirm')}
              />
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Popup>
  );
}
