// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from '@mui/icons-material';
import { Grid, InputAdornment, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup } from '../../../../components';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo } from '../../../../util/plusTypes';
import { amountToHuman, amountToMachine } from '../../../../util/plusUtils';
import Hint from '../../../../components/Hint';

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
  const [value, setValue] = useState<string>();
  const [availableBalance, setAvailableBalance] = useState<string>('');
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<bigint>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);

  const tx = chainInfo?.api.tx.treasury.proposeSpend;
  const FEE_DECIMAL_DIGITS = chainInfo?.coin === 'DOT' ? 4 : 6;


  useEffect(() => {
    if (!chainInfo || !tx || !proposerAddress) return;
    const valueInMachine = amountToMachine(value, chainInfo.decimals);
    const params = [valueInMachine, beneficiaryAddress];

    setParams(params);

    // eslint-disable-next-line no-void
    beneficiaryAddress && void tx(...params).paymentInfo(proposerAddress)
      .then((i) => setEstimatedFee(BigInt(String(i?.partialFee))))
      .catch(console.error);
  }, [beneficiaryAddress, chainInfo, proposerAddress, tx, value]);

  useEffect(() => {
    if (!estimatedFee) { setIsDisabled(true); }
    // else {

    //   setIsDisabled(minBond + estimatedFee >= BigInt(availableBalance));
    // }
  }, [availableBalance, chainInfo?.decimals, estimatedFee]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    setState('confirming');

    try {
      const pair = keyring.getPair(proposerAddress);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(chainInfo?.api, tx, params, pair);

      // TODO can save to history here
      setState(status);
    } catch (e) {
      console.log('error in submit proposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [chainInfo?.api, params, password, proposerAddress, tx]);

  const handleReject = useCallback((): void => {
    setState('');
    handleSubmitTipModalClose();
  }, [handleSubmitTipModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(event.target.value);
  }, []);

  return (
    <Popup handleClose={handleSubmitTipModalClose} showModal={showSubmitTipModal}>
      <PlusHeader action={handleSubmitTipModalClose} chain={chain} closeText={'Close'} icon={<AddCircleOutlineRoundedIcon fontSize='small' />} title={t('Submit tip request')} />

      <AllAddresses availableBalance={availableBalance} chain={chain} chainInfo={chainInfo} selectedAddress={proposerAddress} setAvailableBalance={setAvailableBalance} setSelectedAddress={setProposerAddress} title={t('Proposer')} />

      <AllAddresses chain={chain} chainInfo={chainInfo} freeSolo selectedAddress={beneficiaryAddress} setSelectedAddress={setBeneficiaryAddress} title={t('Beneficiary')} />

      <Grid item sx={{ p: '15px 40px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          autoFocus
          color='warning'
          fullWidth
          helperText={t('why the recipient deserves a tip payout')}
          label={t('Reason')}
          margin='dense'
          name='value'
          onChange={handleChange}
          size='medium'
          type='text'
          value={value}
          variant='outlined'
          multiline
          rows={4}
        />
      </Grid>

      <Grid container item sx={{ p: '15px 30px', textAlign: 'center' }} xs={12}>
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
