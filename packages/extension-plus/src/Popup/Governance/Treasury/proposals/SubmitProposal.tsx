// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from '@mui/icons-material';
import { Grid, InputAdornment, TextField } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';
import { BN_HUNDRED, BN_MILLION } from '@polkadot/util';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Participator, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import Hint from '../../../../components/Hint';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo, nameAddress } from '../../../../util/plusTypes';
import { amountToMachine } from '../../../../util/plusUtils';

interface Props {
  address: string;
  chain: Chain;
  chainInfo: ChainInfo;
  showSubmitProposalModal: boolean;
  handleSubmitProposalModalClose: () => void;
}

export default function SubmitProposal({ address, chain, chainInfo, handleSubmitProposalModalClose, showSubmitProposalModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [value, setValue] = useState<bigint | undefined>();
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);

  const { api, decimals } = chainInfo;
  const tx = api.tx.treasury.proposeSpend;

  const bondPercentage = useMemo((): number => (api.consts.treasury.proposalBond.mul(BN_HUNDRED).div(BN_MILLION)).toNumber(), [chainInfo]);
  const proposalBondMinimum = api.createType('Balance', api.consts.treasury.proposalBondMinimum);

  useEffect(() => {
    if (!chainInfo || !tx || !encodedAddressInfo?.address) return;
    const params = [value, beneficiaryAddress];

    setParams(params);

    // eslint-disable-next-line no-void
    beneficiaryAddress && void tx(...params).paymentInfo(encodedAddressInfo?.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);
  }, [beneficiaryAddress, chainInfo, encodedAddressInfo, tx, value]);

  useEffect(() => {
    if (!estimatedFee || !value || !availableBalance || !bondPercentage) { setIsDisabled(true); }
    else {
      /** account must have available balance to bond */
      const valuePercentage = BigInt(bondPercentage) * value / 100n;
      const minBond = valuePercentage > proposalBondMinimum.toBigInt() ? valuePercentage : proposalBondMinimum.toBigInt();

      setIsDisabled(minBond + estimatedFee.toBigInt() >= availableBalance.toBigInt());
    }
  }, [availableBalance, bondPercentage, decimals, estimatedFee, proposalBondMinimum, value]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!encodedAddressInfo?.address) {
      console.log(' address is not encoded');

      return;
    }

    setState('confirming');

    try {
      const pair = keyring.getPair(encodedAddressInfo?.address);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair, encodedAddressInfo?.address);

      // TODO can save to history here
      setState(status);
    } catch (e) {
      console.log('error in submit proposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [api, params, password, encodedAddressInfo, tx]);

  const handleReject = useCallback((): void => {
    setState('');
    handleSubmitProposalModalClose();
  }, [handleSubmitProposalModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(amountToMachine(event.target.value, decimals));
  }, []);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('will be allocated to the beneficiary if approved')}
      </Grid>
      {!!beneficiaryAddress &&
        <Grid item>
          <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title={t('Fee')} />
        </Grid>
      }
    </Grid>
  );

  return (
    <Popup handleClose={handleSubmitProposalModalClose} showModal={showSubmitProposalModal}>
      <PlusHeader action={handleSubmitProposalModalClose} chain={chain} closeText={'Close'} icon={<AddCircleOutlineRoundedIcon fontSize='small' />} title={t('Submit proposal')} />

      <Participator
        address={address}
        availableBalance={availableBalance}
        chain={chain}
        chainInfo={chainInfo}
        encodedAddressInfo={encodedAddressInfo}
        role={t('Proposer')}
        setAvailableBalance={setAvailableBalance}
        setEncodedAddressInfo={setEncodedAddressInfo}
      />

      <Grid item sx={{ pt: 3 }} xs={12}>
        <AllAddresses chain={chain} chainInfo={chainInfo} freeSolo selectedAddress={beneficiaryAddress} setSelectedAddress={setBeneficiaryAddress} title={t('Beneficiary')} />
      </Grid>

      <Grid item sx={{ p: '15px 40px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          fullWidth
          helperText={<HelperText />}
          label={t('Value')}
          margin='dense'
          name='value'
          onChange={handleChange}
          placeholder='0'
          size='medium'
          type='number'
          variant='outlined'
        />
      </Grid>

      <Grid container item justifyContent='space-between' sx={{ fontSize: 13, p: '55px 40px 0px' }} xs={12}>
        <Grid item>
          <Hint icon={true} id='pBond' place='right' tip='% of value would need to be put up as collateral'>
            {`${t('Proposal bond')}: ${bondPercentage.toFixed(2)} %`}
          </Hint>
        </Grid>
        <Grid item>
          <Hint icon={true} id='mBond' place='left' tip='the minimum to put up as collateral'>
            {`${t('Minimum bond')}: ${proposalBondMinimum.toHuman()}`}
          </Hint>
        </Grid>
      </Grid>

      <Grid container item sx={{ p: '10px 30px', textAlign: 'center' }} xs={12}>
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
