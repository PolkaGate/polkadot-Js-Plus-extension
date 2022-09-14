// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description  confirm manage proxies
*/

import type { ApiPromise } from '@polkadot/api';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Container, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import keyring from '@polkadot/ui-keyring';
import { BN } from '@polkadot/util';

import { ActionContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Identity, Password, PlusHeader, Popup, ShowBalance2 } from '../../components';
import { PASS_MAP } from '../../util/constants';
import { ProxyItem, TransactionDetail } from '../../util/plusTypes';

interface Props extends ThemeProps {
  className?: string;
  api: ApiPromise;
  chain: Chain;
  showConfirmModal: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formatted: string;
  deposit: BN;
  proxies: ProxyItem[];
  proxyInfo: DeriveAccountInfo[];
}


export default function Confirm({ api, chain, className, deposit, formatted, proxies, proxyInfo, setConfirmModalOpen, showConfirmModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [notEnoughBalance, setNotEnoughBalance] = useState<boolean | undefined>();

  const adding = proxies?.filter((item: ProxyItem) => item.status === 'new')?.length ?? 0;
  const removing = proxies?.filter((item) => item.status === 'remove')?.length ?? 0;

  const removeProxy = api.tx.proxy.removeProxy; /** (delegate, proxyType, delay) **/
  const addProxy = api.tx.proxy.addProxy; /** (delegate, proxyType, delay) **/
  const batchAll = api.tx.utility.batchAll;

  const calls = [];

  proxies.forEach((item: ProxyItem) => {
    const p = item.proxy;

    item.status === 'remove' && calls.push(removeProxy(p.delegate, p.proxyType, p.delay));
    item.status === 'new' && calls.push(addProxy(p.delegate, p.proxyType, p.delay));
  });

  const tx = batchAll(calls);

  console.log('Fee:', estimatedFee?.toString())
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
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[100], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', fontSize: 14, fontWeight: 500, my: '13px', py: '10px', px: '10px' }}>
          <Grid item sx={{ fontSize: 15, fontWeight: 500, color: grey[700], textAlign: 'center', pb: '5px' }} xs={12}>
            {adding ? t('Adding {{adding}}', { replace: { adding } }) : ''}     {removing ? t('Removing {{removing}}', { replace: { removing } }) : ''}  {removing + adding > 1 ? t('Proxies') : t('Proxy')}
          </Grid>
          <Grid item xs={3.5} >
            <ShowBalance2 alignItems='flext-start' api={api} balance={deposit} title={`${t('Deposit')}`} />
          </Grid>
          <Grid item xs={3}>
            <ShowBalance2 alignItems='flex-end' api={api} balance={estimatedFee} title={`${t('Fee')}`} />
          </Grid>
        </Grid>
        <Grid item sx={{ color: grey[600], fontSize: 16, p: '5px 50px 5px', textAlign: 'center' }} xs={12}>
          {t('PROXIES')}
        </Grid>
        <Grid container item sx={{ fontSize: 14, fontWeight: 500, bgcolor: grey[200], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', py: '5px', px: '10px' }}>
          <Grid item xs={5.5}>
            {t('identity')}
          </Grid>
          <Grid item xs={3}>
            {t('type')}
          </Grid>
          <Grid item xs={2}>
            {t('delay')}
          </Grid>
          <Grid item xs={1.5}>
            {t('state')}
          </Grid>
        </Grid>
        <Grid container item sx={{ borderLeft: '2px solid', borderBottom: '2px solid', borderRight: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[200], display: 'block', height: 170, pt: '15px', pl: '10px', overflowY: 'auto' }} xs={12}>
          {proxyInfo &&
            <>
              {proxies?.map((item, index) => {
                const proxy = item.proxy;
                const info = proxyInfo.find((p) => p.accountId == proxy.delegate);

                return (
                  <Grid container item key={index} sx={{ fontSize: 13 }}>
                    <Grid item xs={5.5}>
                      <Identity accountInfo={info} chain={chain} />
                    </Grid>
                    <Grid item xs={3}>
                      {proxy.proxyType}
                    </Grid>
                    <Grid item xs={2}>
                      {proxy.delay}
                    </Grid>
                    <Grid item xs={1.5}>
                      {item.status === 'remove' ? t('Removing') : ''}
                      {item.status === 'new' ? t('Adding') : ''}
                    </Grid>
                  </Grid>
                );
              })
              }
            </>
          }
        </Grid>
      </Container>
      <Grid container item sx={{ pt: '25px', px: '26px' }} xs={12}>
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
    </Popup>
  );
}
