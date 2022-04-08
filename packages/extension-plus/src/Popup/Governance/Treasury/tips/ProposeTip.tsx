// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description this component is used to propose a treasury tip
*/
import { AddCircleOutlineRounded as AddCircleOutlineRoundedIcon } from '@mui/icons-material';
import { Grid, TextField } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Participator, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import Hint from '../../../../components/Hint';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo, nameAddress } from '../../../../util/plusTypes';
import { amountToHuman } from '../../../../util/plusUtils';

interface Props {
  address: string;
  chain: Chain;
  chainInfo: ChainInfo;
  showProposeTipModal: boolean;
  handleProposeTipModalClose: () => void;
}

export default function ProposeTip({ address, chain, chainInfo, handleProposeTipModalClose, showProposeTipModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);

  const { api, coin, decimals } = chainInfo;
  const tx = api.tx.tips.reportAwesome;

  const reportDeposit = useMemo((): Balance =>
    api.createType('Balance', (api.consts.tips.tipReportDepositBase).add((api.consts.tips.dataDepositPerByte).muln(reason.length))
    ), [api, reason.length]);

  const maximumReasonLength = api.consts.tips.maximumReasonLength.toString();

  useEffect(() => {
    if (!tx || !encodedAddressInfo?.address || !beneficiaryAddress) return;
    const params = [reason, beneficiaryAddress];

    setParams(params);

    // eslint-disable-next-line no-void
    void tx(...params).paymentInfo(encodedAddressInfo?.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);
  }, [beneficiaryAddress, decimals, encodedAddressInfo?.address, tx, reason]);


  useEffect(() => {
    if (!estimatedFee || !availableBalance) {
      setIsDisabled(true);
    } else {
      setIsDisabled(!(reason && beneficiaryAddress && estimatedFee.add(reportDeposit).lt(availableBalance)));
    }
  }, [availableBalance, beneficiaryAddress, estimatedFee, reason, reportDeposit]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    setState('confirming');

    if (!encodedAddressInfo) {
      console.log('no encded address');

      return;
    }

    try {
      const pair = keyring.getPair(encodedAddressInfo?.address);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair, encodedAddressInfo?.address);

      // TODO can save to history here
      setState(status);
    } catch (e) {
      console.log('error in propose proposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [api, params, password, encodedAddressInfo, tx]);

  const handleReject = useCallback((): void => {
    setState('');
    handleProposeTipModalClose();
  }, [handleProposeTipModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReason(event.target.value);
  }, []);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('why the recipient deserves a tip payout?')}
      </Grid>
      {!!beneficiaryAddress &&
        <Grid item>
          <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title={t('Fee')} />
        </Grid>
      }
    </Grid>);

  return (
    <Popup handleClose={handleProposeTipModalClose} showModal={showProposeTipModal}>
      <PlusHeader action={handleProposeTipModalClose} chain={chain} closeText={'Close'} icon={<AddCircleOutlineRoundedIcon fontSize='small' />} title={t('Propose tip')} />

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

      <Grid item sx={{ p: '10px 40px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ style: { fontSize: 14 } }}
          autoFocus
          color='warning'
          fullWidth
          helperText={<HelperText />}
          label={t('Reason')}
          margin='dense'
          multiline
          name='reason'
          onChange={handleChange}
          rows={3}
          size='medium'
          type='text'
          value={reason}
          variant='outlined'
        />
      </Grid>

      <Grid item sx={{ fontSize: 13, p: '15px 50px', textAlign: 'right' }} xs={12}>
        <Hint icon={true} id='reportDeposit' place='left' tip={t('held on deposit for placing the tip report')}>
          {`${t('Report deposit')}: ${reportDeposit.toHuman()}`}
        </Hint>
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