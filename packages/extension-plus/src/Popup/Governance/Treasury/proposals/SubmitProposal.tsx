// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from '@mui/icons-material';
import { Grid, InputAdornment, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import keyring from '@polkadot/ui-keyring';
import { BN_HUNDRED, BN_MILLION } from '@polkadot/util';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo } from '../../../../util/plusTypes';
import { amountToHuman, amountToMachine } from '../../../../util/plusUtils';
import Hint from '../../../../components/Hint';

interface Props {
  chain: Chain;
  chainInfo: ChainInfo;
  showSubmitProposalModal: boolean;
  handleSubmitProposalModalClose: () => void;
}

export default function SubmitProposal({ chain, chainInfo, handleSubmitProposalModalClose, showSubmitProposalModal }: Props): React.ReactElement<Props> {
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
  const { api, coin, decimals } = chainInfo;
  const FEE_DECIMAL_DIGITS = coin === 'DOT' ? 4 : 6;
  const tx = api.tx.treasury.proposeSpend;
  const bondPercentage = useMemo((): number => (api.consts.treasury.proposalBond.mul(BN_HUNDRED).div(BN_MILLION)).toNumber(), [chainInfo]);
  const minimumBond = BigInt(String(api.consts.treasury.proposalBondMinimum));
  const toHuman = useCallback((value: bigint) => `${amountToHuman(value.toString(), decimals, FEE_DECIMAL_DIGITS)} ${coin}`, [FEE_DECIMAL_DIGITS, coin, decimals]);

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
    else {
      const valueInMachine = amountToMachine(value, decimals);
      const valuePercentage = BigInt(bondPercentage) * valueInMachine / 100n;
      const minBond = BigInt(valuePercentage > minimumBond ? valuePercentage : minimumBond);

      setIsDisabled(minBond + estimatedFee >= BigInt(availableBalance));
    }
  }, [availableBalance, bondPercentage, decimals, estimatedFee, minimumBond, value]);

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
    handleSubmitProposalModalClose();
  }, [handleSubmitProposalModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(event.target.value);
  }, []);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('The amount will be allocated to the beneficiary if approved')}
      </Grid>
      <Grid item>
        <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title={t('Fee')} />
      </Grid>
    </Grid>
  );

  return (
    <Popup handleClose={handleSubmitProposalModalClose} showModal={showSubmitProposalModal}>
      <PlusHeader action={handleSubmitProposalModalClose} chain={chain} closeText={'Close'} icon={<AddCircleOutlineRoundedIcon fontSize='small' />} title={t('Submit proposal')} />

      <AllAddresses availableBalance={availableBalance} chain={chain} chainInfo={chainInfo} selectedAddress={proposerAddress} setAvailableBalance={setAvailableBalance} setSelectedAddress={setProposerAddress} title={t('Proposer')} />

      <AllAddresses chain={chain} chainInfo={chainInfo} freeSolo selectedAddress={beneficiaryAddress} setSelectedAddress={setBeneficiaryAddress} title={t('Beneficiary')} />

      <Grid item sx={{ p: '20px 40px 20px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          fullWidth
          helperText={<HelperText />
          }
          label={t('Value')}
          margin='dense'
          name='value'
          onChange={handleChange}
          placeholder='0'
          size='medium'
          type='number'
          value={value}
          variant='outlined'
        />
      </Grid>

      <Grid container item justifyContent='space-between' sx={{ fontSize: 13, p: '10px 40px 10px' }} xs={12}>
        <Grid item>
          <Hint id='pBond' place='top' tip='% of value would need to be put up as collateral'>
            {t('Proposal bond')}{': '} {bondPercentage.toFixed(2)} %
          </Hint>
        </Grid>
        <Grid item>
          <Hint id='pBond' place='top' tip='The minimum to put up as collateral'>
            {t('Minimum bond')}{': '} {toHuman(minimumBond)}
          </Hint>
        </Grid>
      </Grid>

      <Grid container item sx={{ p: '30px 30px', textAlign: 'center' }} xs={12}>
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
