// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description this component is used to submit a treasury tip
*/
import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from '@mui/icons-material';
import { Grid, TextField } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import Hint from '../../../../components/Hint';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo } from '../../../../util/plusTypes';
import { amountToHuman } from '../../../../util/plusUtils';

interface Props {
  chain: Chain;
  chainInfo: ChainInfo;
  showSubmitTipModal: boolean;
  handleSubmitTipModalClose: () => void;
}

export default function SubmitTip({ chain, chainInfo, handleSubmitTipModalClose, showSubmitTipModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [proposerAddress, setProposerAddress] = useState<string>('');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<string>('');
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<bigint>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const { api, coin, decimals } = chainInfo;
  const tx = api.tx.tips.reportAwesome;
  const FEE_DECIMAL_DIGITS = coin === 'DOT' ? 4 : 6;
  const reportDeposit = useMemo(() => BigInt(String(api.consts.tips.tipReportDepositBase)) + BigInt(String(api.consts.tips.dataDepositPerByte)) * BigInt(reason.length), [reason]);
  const maximumReasonLength = api.consts.tips.maximumReasonLength.toString();
  const toHuman = useCallback((value: bigint) => `${amountToHuman(value.toString(), decimals, FEE_DECIMAL_DIGITS)} ${coin}`, [FEE_DECIMAL_DIGITS, coin, decimals]);

  useEffect(() => {
    if (!tx || !proposerAddress || !beneficiaryAddress) return;
    const params = [reason, beneficiaryAddress];

    setParams(params);

    // eslint-disable-next-line no-void
    void tx(...params).paymentInfo(proposerAddress)
      .then((i) => setEstimatedFee(BigInt(String(i?.partialFee))))
      .catch(console.error);
  }, [beneficiaryAddress, decimals, proposerAddress, tx, reason]);

  useEffect(() => {
    if (!estimatedFee) {
      setIsDisabled(true);
    } else {
      setIsDisabled(!(reason && beneficiaryAddress && estimatedFee + reportDeposit < BigInt(availableBalance)));
    }
  }, [availableBalance, beneficiaryAddress, estimatedFee, reason, reportDeposit]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    setState('confirming');

    try {
      const pair = keyring.getPair(proposerAddress);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair);

      // TODO can save to history here
      setState(status);
    } catch (e) {
      console.log('error in submit proposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [api, params, password, proposerAddress, tx]);

  const handleReject = useCallback((): void => {
    setState('');
    handleSubmitTipModalClose();
  }, [handleSubmitTipModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReason(event.target.value);
  }, []);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('why the recipient deserves a tip payout?')}
      </Grid>
      <Grid item>
        <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title={t('Fee')} />
      </Grid>
    </Grid>);

  return (
    <Popup handleClose={handleSubmitTipModalClose} showModal={showSubmitTipModal}>
      <PlusHeader action={handleSubmitTipModalClose} chain={chain} closeText={'Close'} icon={<AddCircleOutlineRoundedIcon fontSize='small' />} title={t('Submit tip request')} />

      <AllAddresses availableBalance={availableBalance} chain={chain} chainInfo={chainInfo} selectedAddress={proposerAddress} setAvailableBalance={setAvailableBalance} setSelectedAddress={setProposerAddress} title={t('Proposer')} />

      <AllAddresses chain={chain} chainInfo={chainInfo} freeSolo selectedAddress={beneficiaryAddress} setSelectedAddress={setBeneficiaryAddress} title={t('Beneficiary')} />

      <Grid item sx={{ p: '10px 40px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          autoFocus
          color='warning'
          fullWidth
          helperText={<HelperText />
          }
          label={t('Reason')}
          margin='dense'
          multiline
          name='reason'
          onChange={handleChange}
          rows={2}
          size='medium'
          type='text'
          value={reason}
          variant='outlined'
        />
      </Grid>

      <Grid item sx={{ fontSize: 13, p: '15px 50px', textAlign: 'right' }} xs={12}>
        <Hint icon={true} id='reportDeposit' place='left' tip={t('held on deposit for placing the tip report')}>
          {t('Report deposit')}{': '} {toHuman(reportDeposit)}
        </Hint>
      </Grid>

      <Grid container item sx={{ p: '25px 30px', textAlign: 'center' }} xs={12}>
        <Password
          handleIt={handleConfirm}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus}
        />
        <ConfirmButton
          handleBack={handleReject}
          handleConfirm={handleConfirm}
          handleReject={handleReject}
          isDisabled={isDisabled}
          state={state}
        />
      </Grid>
    </Popup>
  );
}
