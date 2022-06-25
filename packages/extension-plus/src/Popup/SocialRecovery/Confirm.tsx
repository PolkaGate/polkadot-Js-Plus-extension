// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here users confirm their staking related orders (e.g., stake, unstake, redeem, etc.)
 * */

import type { Chain } from '@polkadot/extension-chains/types';
import type { Balance } from '@polkadot/types/interfaces';
import { BN, BN_ZERO } from '@polkadot/util';
import type { RecoveryConsts, TransactionDetail } from '../../util/plusTypes';

import { ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Grid, Skeleton } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState, useMemo } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, FormatBalance, Identity, Password, PlusHeader, Popup } from '../../components';
import { broadcast } from '../../util/api';
import { PASS_MAP } from '../../util/constants';
import { getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';

interface Props {
  api: ApiPromise;
  chain: Chain;
  showConfirmModal: boolean;
  setConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  account: DeriveAccountInfo;
  friends: DeriveAccountInfo[];
  recoveryThreshold: number;
  recoveryDelay: number;
  recoveryConsts: RecoveryConsts;

}

export default function Confirm({ account, api, chain, friends, recoveryConsts, recoveryDelay, recoveryThreshold, setConfirmModalOpen, setState, showConfirmModal, state }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();

  const freindIds = friends.map((f) => f.accountId).sort(); // if not sorted, tx will retun an error!!

  /** list of available trasactions */
  const createRecovery = api.tx.recovery.createRecovery;// (friends: Vec<AccountId32>, threshold: u16, delay_period: u32)
  const removeRecovery = api.tx.recovery.removeRecovery;

  async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, history: TransactionDetail[]): Promise<boolean> {
    if (!history.length) return false;

    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(...history);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  const callSetFee = useCallback(() => {
    let params;
    const recoveryDelayInBlocks = recoveryDelay * 24 * 60 * 10;

    switch (state) {
      case ('makeRecoverable'):
        params = [freindIds, recoveryThreshold, recoveryDelayInBlocks];

        // eslint-disable-next-line no-void
        account?.accountId && void createRecovery(...params).paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      case ('removeRecovery'):
        // eslint-disable-next-line no-void
        void removeRecovery().paymentInfo(account.accountId).then((i) => setEstimatedFee(i?.partialFee));

        break;
      default:
    }
  }, [account.accountId, createRecovery, freindIds, recoveryDelay, recoveryThreshold, removeRecovery, state]);

  const deposit = useMemo(() => {
    if (state === 'makeRecoverable') {
      return recoveryConsts.configDepositBase.add(recoveryConsts.friendDepositFactor.muln(freindIds.length));
    }

    if (state === 'removeRecovery') {
      return recoveryConsts.recoveryDeposit;
    }

    return BN_ZERO;
  }, [freindIds.length, recoveryConsts.configDepositBase, recoveryConsts.friendDepositFactor, recoveryConsts.recoveryDeposit, state]);

  useEffect(() => {
    if (!api) { return; }

    !estimatedFee && callSetFee();
  }, [api, callSetFee, estimatedFee]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    const localState = state;
    const history: TransactionDetail[] = []; /** collects all records to save in the local history at the end */

    try {
      setConfirmingState('confirming');

      const signer = keyring.getPair(account.accountId);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      if (localState === 'makeRecoverable') {
        const recoveryDelayInBlocks = recoveryDelay * 24 * 60 * 10;

        const params = [freindIds, recoveryThreshold, recoveryDelayInBlocks];
        const { block, failureText, fee, status, txHash } = await broadcast(api, createRecovery, params, signer, account.accountId);

        history.push({
          action: 'make_recoverable',
          amount: '0',
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: account.accountId,
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
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: account.accountId,
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
  }, [account.accountId, api, chain, createRecovery, freindIds, hierarchy, password, recoveryDelay, recoveryThreshold, removeRecovery, setState, state]);

  const handleCloseModal = useCallback((): void => {
    setConfirmModalOpen(false);
  }, [setConfirmModalOpen]);

  const handleReject = useCallback((): void => {
    setState('');
    setConfirmingState('');
    onAction('/');
  }, [onAction, setState]);

  const writeAppropiateMessage = useCallback((state: string, note?: string): React.ReactNode => {

    // Note: availableBalance change should not change the alert in redeem confirm page!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('makeRecoverable'):
        return 'Make Recoverable';
      case ('removeRecovery'):
        return 'Remove Recovery';

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
              <Identity accountInfo={account} chain={chain} showAddress />
            </Grid>
            <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 11, pt: '30px', textAlign: 'center' }} xs={12}>
              <Grid container item justifyContent='flex-start' sx={{ textAlign: 'left' }} xs={3}>
                <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                  {t('Recovery threshold')}
                </Grid>
                <Grid item xs={12}>
                  {recoveryThreshold}
                </Grid>
              </Grid>
              <Grid container item justifyContent='center' xs={3}>
                <Grid item sx={{ color: grey[500], fontWeight: '600' }} xs={12}>
                  {t('Fee')}
                </Grid>
                <Grid item xs={12}>
                  {!estimatedFee
                    ? <span><Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '30px' }} /></span>
                    : <FormatBalance api={api} value={estimatedFee} />
                  }
                </Grid>
              </Grid>
              <Grid container item justifyContent='center' xs={3}>
                <Grid item sx={{ color: grey[500], fontWeight: '600' }} xs={12}>
                  {t('Deposit')}
                </Grid>
                <Grid item xs={12}>
                  <FormatBalance api={api} value={deposit} />
                </Grid>
              </Grid>
              <Grid container item justifyContent='flex-end' sx={{ textAlign: 'right' }} xs={3}>
                <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                  {t('Recovery delay ')}
                </Grid>
                <Grid item xs={12}>
                  {recoveryDelay}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid container item sx={{ fontSize: 12, height: '200px', overflowY: 'auto', bgcolor: 'white' }} xs={12}>
          <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '25px 50px 5px', textAlign: 'center' }} xs={12}>
            {t('List of friends')}
          </Grid>
          {friends?.map((f, index) => (
            <Grid alignItems='flex-start' key={index} sx={{ px: '30px' }} xs={12}>
              <Identity accountInfo={f} chain={chain} showAddress />
            </Grid>
          ))}
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
