// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here users confirm their staking related orders (e.g., stake, unstake, redeem, etc.)
 * */

import type { Chain } from '@polkadot/extension-chains/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { RecoveryConsts, Rescuer, TransactionDetail } from '../../util/plusTypes';

import { ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Grid, Skeleton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';
import { BN, BN_ZERO } from '@polkadot/util';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, FormatBalance, Identity, Password, PlusHeader, Popup, ShowBalance2, ShowValue } from '../../components';
import { broadcast } from '../../util/api';
import { PASS_MAP } from '../../util/constants';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';

interface Props {
  api: ApiPromise;
  chain: Chain;
  showConfirmModal: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string | undefined>>
  account: DeriveAccountInfo;
  friends?: DeriveAccountInfo[];
  recoveryThreshold?: number;
  recoveryDelay?: number;
  recoveryConsts?: RecoveryConsts;
  lostAccount?: DeriveAccountInfo;
  rescuer?: Rescuer;
}

export default function Confirm({ account, api, chain, friends, lostAccount, recoveryConsts, recoveryDelay, recoveryThreshold, rescuer, setConfirmModalOpen, setState, showConfirmModal, state }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();

  const decimals = api.registry.chainDecimals[0];
  const friendIds = friends?.map((f) => f.accountId).sort(); // if not sorted, tx will retun an error!!

  /** list of available trasactions */
  const createRecovery = api.tx.recovery.createRecovery;// (friends: Vec<AccountId32>, threshold: u16, delay_period: u32)
  const removeRecovery = api.tx.recovery.removeRecovery;
  const initiateRecovery = api.tx.recovery.initiateRecovery; // (lostAccount)
  const closeRecovery = api.tx.recovery.closeRecovery; // (rescuer)

  async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, history: TransactionDetail[]): Promise<boolean> {
    if (!history.length) { return false; }

    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(...history);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  const callSetFee = useCallback(() => {
    let params;
    const recoveryDelayInBlocks = recoveryDelay ? recoveryDelay * 24 * 60 * 10 : undefined;

    switch (state) {
      case ('makeRecoverable'):
        params = [friendIds, recoveryThreshold, recoveryDelayInBlocks];

        // eslint-disable-next-line no-void
        account?.accountId && void createRecovery(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      case ('removeRecovery'):
        // eslint-disable-next-line no-void
        account?.accountId && void removeRecovery().paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      case ('initiateRecovery'):
        // eslint-disable-next-line no-void
        lostAccount?.accountId && account?.accountId && void initiateRecovery(lostAccount.accountId).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      case ('closeRecovery'):
        params = [rescuer.accountId];

        // eslint-disable-next-line no-void
        account?.accountId && void closeRecovery(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      default:
    }
  }, [account.accountId, closeRecovery, createRecovery, friendIds, initiateRecovery, lostAccount?.accountId, recoveryDelay, recoveryThreshold, removeRecovery, rescuer, state]);

  const deposit = useMemo((): BN => {
    if (['removeRecovery', 'makeRecoverable'].includes(state) && friendIds?.length && recoveryConsts) {
      return recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(friendIds.length));
    }

    if (state === 'initiateRecovery' && recoveryConsts) {
      return recoveryConsts.recoveryDeposit;
    }

    if (state === 'closeRecovery') {
      return rescuer.option.deposit;
    }

    return BN_ZERO;
  }, [friendIds?.length, recoveryConsts, rescuer, state]);

  useEffect(() => {
    if (!api) { return; }

    !estimatedFee && callSetFee();
  }, [api, callSetFee, estimatedFee]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    const localState = state;
    const history: TransactionDetail[] = []; /** collects all records to save in the local history at the end */

    try {
      if (!account?.accountId) { return; }

      setConfirmingState('confirming');

      const signer = keyring.getPair(account.accountId);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      if (localState === 'makeRecoverable') {
        const recoveryDelayInBlocks = recoveryDelay * 24 * 60 * 10;

        const params = [friendIds, recoveryThreshold, recoveryDelayInBlocks];
        const { block, failureText, fee, status, txHash } = await broadcast(api, createRecovery, params, signer, account.accountId);

        history.push({
          action: 'make_recoverable',
          amount: '0',
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'removeRecovery') {
        const { block, failureText, fee, status, txHash } = await broadcast(api, removeRecovery, [], signer, account.accountId);

        history.push({
          action: 'remove_recovery',
          amount: '0',
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'initiateRecovery' && lostAccount?.accountId) {
        const params = [lostAccount.accountId];

        const { block, failureText, fee, status, txHash } = await broadcast(api, initiateRecovery, params, signer, account.accountId);

        history.push({
          action: 'initiate_recovery',
          amount: '0',
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'closeRecovery' && rescuer?.accountId) {
        const params = [rescuer.accountId];
        const { block, failureText, fee, status, txHash } = await broadcast(api, closeRecovery, params, signer, account.accountId);

        history.push({
          action: 'close_recovery',
          amount: amountToHuman(String(rescuer.option.deposit), decimals),
          block,
          date: Date.now(),
          fee: fee || '',
          from: String(account.accountId),
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      // eslint-disable-next-line no-void
      void saveHistory(chain, hierarchy, account.accountId, history);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState(localState);
      setConfirmingState('');
    }
  }, [account.accountId, api, chain, closeRecovery, createRecovery, decimals, friendIds, hierarchy, initiateRecovery, lostAccount?.accountId, password, recoveryDelay, recoveryThreshold, removeRecovery, rescuer, setState, state]);

  const handleCloseModal = useCallback((): void => {
    setConfirmModalOpen(false);
  }, [setConfirmModalOpen]);

  const handleReject = useCallback((): void => {
    setState('');
    setConfirmingState('');
    onAction('/');
    window.location.reload();
  }, [onAction, setState]);

  const WriteAppropiateMessage = useCallback(({ note, state }: { state: string, note?: string }) => {
    switch (state) {
      case ('initiateRecovery'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Initiating recovery for the above mentioned account, the deposit will be always repatriated to that account')}
        </Typography>;
      case ('closeRecovery'):
        return <Typography sx={{ mt: '50px' }} variant='body1'>
          {t('Closing the recovery process initiated by the above mentioned malicious account, which transfers its {{deposit}} deposit to your account',
            { replace: { deposit: api.createType('Balance', deposit).toHuman() } })}
        </Typography>;
      case ('removeRecovery'):
        return <Typography sx={{ mt: '50px' }} variant='body1'>
          {t('Removing your account setting as recoverable. Your {{deposit}} deposit will be unclocked',
            { replace: { deposit: api.createType('Balance', deposit).toHuman() } })}
        </Typography>;
      default:
        return <Typography sx={{ m: '30px 0px 30px' }} variant='h6'>
          {note}
        </Typography>;
    }
    // Note: availableBalance change should not change the alert in redeem confirm page!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('makeRecoverable'):
        return 'Make Recoverable';
      case ('removeRecovery'):
        return 'Remove Recovery';
      case ('initiateRecovery'):
        return 'Initiate Recovery';
      case ('closeRecovery'):
        return 'Close Recovery';
      default:
        return state.toUpperCase();
    }
  };

  const handleBack = useCallback((): void => {
    // setState('');
    setConfirmingState('');

    handleCloseModal();
  }, [handleCloseModal]);

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={stateInHuman(state)} />
      <Grid alignItems='center' container>
        <Grid container item sx={{ backgroundColor: '#f7f7f7', p: '25px 40px 10px' }} xs={12}>
          {/* <Grid item sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, justifyContent: 'flex-start', p: '5px 10px', textAlign: 'center', fontVariant: 'small-caps' }}>
            {stateInHuman(confirmingState || state)}
          </Grid> */}
          <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12, pt: '10px', textAlign: 'center' }} xs={12}>
            <Grid container item sx={{ fontFamily: 'sans-serif', fontSize: 11, fontWeight: 'bold', pl: 6 }} xs={12}>
              <Identity accountInfo={lostAccount ?? account} chain={chain} showAddress />
            </Grid>
            <Grid alignItems='center' container item justifyContent='space-around' sx={{ fontSize: 11, pt: '30px', textAlign: 'center' }} xs={12}>
              {recoveryThreshold &&
                <Grid container item justifyContent='flex-start' sx={{ textAlign: 'left' }} xs={3}>
                  <ShowValue direction='column' title={t('Recovery threshold')} value={recoveryThreshold} />
                </Grid>
              }
              <Grid container item justifyContent='center' xs={3}>
                <ShowBalance2 api={api} balance={estimatedFee} title={t('Fee')} />
              </Grid>
              {['initiateRecovery', 'makeRecoverable'].includes(state) &&
                <Grid container item justifyContent='center' xs={3}>
                  <ShowBalance2 api={api} balance={deposit} title={t('Deposit')} />
                </Grid>
              }
              {recoveryDelay !== undefined &&
                <Grid container item justifyContent='flex-end' sx={{ textAlign: 'right' }} xs={3}>
                  <ShowValue direction='column' title={t('Recovery delay ')} value={recoveryDelay} />
                </Grid>
              }
            </Grid>
          </Grid>
        </Grid>
        <Grid container item sx={{ fontSize: 12, height: '200px', overflowY: 'auto', bgcolor: 'white' }} xs={12}>
          {['makeRecoverable', 'initiateRecovery'].includes(state) &&
            <>
              {state === 'makeRecoverable' && <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '25px 50px 5px', textAlign: 'center' }} xs={12}>
                {t('List of friends')}
              </Grid>
              }
              {state === 'initiateRecovery' &&
                <Grid item sx={{ p: '25px 20px 5px', textAlign: 'center' }} xs={12}>
                  <Typography sx={{ color: grey[600] }} variant='subtitle2'>
                    {t('Initiating recovery for the above account, with the following friends: ')}
                  </Typography>
                </Grid>
              }
              {friends?.map((f, index) => (
                <Grid alignItems='flex-start' key={index} sx={{ px: '30px' }} xs={12}>
                  <Identity accountInfo={f} chain={chain} showAddress />
                </Grid>
              ))}
            </>
          }
          {['closeRecovery', 'removeRecovery'].includes(state) &&
            <Grid item px='30px' xs={12}>
              <WriteAppropiateMessage state={state} />
            </Grid>
          }
        </Grid>
      </Grid>
      <Grid container item sx={{ p: '30px 25px' }} xs={12}>
        <Password
          autofocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
          handleIt={handleConfirm}
          // isDisabled={ confirmButtonDisabled || !estimatedFee}
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
              // isDisabled={!stakingConsts || confirmButtonDisabled || !estimatedFee || !availableBalance || !api}
              state={confirmingState}
              text={t('Confirm')}
            />
          </Grid>
          {/* {amountNeedsAdjust &&
            <Grid item sx={{ textAlign: 'left' }} xs={1}>
              <Hint id='adjustAmount' place='left' tip={t('Auto adjust the staking amount')}>
                <IconButton aria-label='Adjust' color='warning' onClick={handleAutoAdjust} size='medium'>
                  <BuildCircleRoundedIcon sx={{ fontSize: 40 }} />
                </IconButton>
              </Hint>
            </Grid>
          } */}
        </Grid>
      </Grid>
    </Popup>
  );
}
