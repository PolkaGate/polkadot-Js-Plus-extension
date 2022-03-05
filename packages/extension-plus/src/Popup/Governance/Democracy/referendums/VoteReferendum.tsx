// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { ThumbsUpDown as ThumbsUpDownIcon } from '@mui/icons-material';
import { FormControl, FormHelperText, Grid, InputAdornment, InputLabel, Select, SelectChangeEvent, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, ShowBalance, Password, PlusHeader, Popup } from '../../../../components';
import broadcast from '../../../../util/api/broadcast';
import getBalanceAll from '../../../../util/api/getBalanceAll';
import { PASS_MAP } from '../../../../util/constants';
import getChainInfo from '../../../../util/getChainInfo';
import { ChainInfo, Conviction } from '../../../../util/plusTypes';
import { amountToHuman, amountToMachine } from '../../../../util/plusUtils';

interface Props {
  voteInfo: { refId: string, voteType: number };
  chain: Chain;
  chainInfo: ChainInfo;
  convictions: Conviction[];
  showVoteReferendumModal: boolean;
  handleVoteReferendumModalClose: () => void;
}

export default function VoteReferendum({ chain, chainInfo, convictions, handleVoteReferendumModalClose, showVoteReferendumModal, voteInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [votingBalance, setVotingBalance] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [voteValue, setVoteValue] = useState<string>();
  const [selectedConviction, setSelectedConviction] = useState<number>(convictions[0].value);
  const [availableBalance, setAvailableBalance] = useState<string>('');
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<bigint>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);

  const isCurrentVote = !!chainInfo?.api.query.democracy.votingOf;
  const tx = chainInfo?.api.tx.democracy.vote;
  const FEE_DECIMAL_DIGITS = chainInfo?.coin === 'DOT' ? 4 : 6;

  useEffect(() => {
    if (!chainInfo || !tx || !selectedAddress) return;
    const voteValueInMachine = amountToMachine(voteValue, chainInfo.decimals);
    const p = isCurrentVote
      ? [voteInfo.refId, { Standard: { vote: { aye: voteInfo.voteType, selectedConviction }, voteValueInMachine } }]
      : [voteInfo.refId, { aye: voteInfo.voteType, selectedConviction }];

    setParams(p);

    // eslint-disable-next-line no-void
    void tx(...p).paymentInfo(selectedAddress)
      .then((i) => setEstimatedFee(BigInt(String(i?.partialFee))))
      .catch(console.error);
  }, [chainInfo, isCurrentVote, selectedAddress, selectedConviction, tx, voteInfo, voteValue]);

  useEffect(() => {
    if (!selectedAddress || !chain) return;
    // eslint-disable-next-line no-void
    void getBalanceAll(selectedAddress, chain).then((b) => {
      setVotingBalance(b?.votingBalance.toString());
    });
  }, [chain, selectedAddress, t]);

  useEffect(() => {
    if (!estimatedFee) { setIsDisabled(true); }
    else {
      setIsDisabled(amountToMachine(voteValue, chainInfo?.decimals) + estimatedFee >= BigInt(availableBalance))
    }
  }, [availableBalance, chainInfo?.decimals, estimatedFee, voteValue]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    setState('confirming');

    try {
      const pair = keyring.getPair(selectedAddress);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(chainInfo?.api, tx, params, pair);

      // TODO can save to history here
      setState(status);
    } catch (e) {
      console.log('error in VoteProposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [chainInfo?.api, params, password, selectedAddress, tx]);

  const handleReject = useCallback((): void => {
    setState('');
    handleVoteReferendumModalClose();
  }, [handleVoteReferendumModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVoteValue(event.target.value);
  }, []);

  const handleConvictionChange = useCallback((event: SelectChangeEvent<number>): void => {
    console.log('selected', event.target.value);
    setSelectedConviction(Number(event.target.value));
  }, []);

  return (
    <Popup handleClose={handleVoteReferendumModalClose} showModal={showVoteReferendumModal}>
      <PlusHeader action={handleVoteReferendumModalClose} chain={chain} closeText={'Close'} icon={<ThumbsUpDownIcon fontSize='small' />} title={'Vote'} />

      <AllAddresses availableBalance={availableBalance} chainInfo={chainInfo} setAvailableBalance={setAvailableBalance} chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('Select voter account')} />

      <Grid item sx={{ fontSize: 12, pt: 2 }} xs={12}>
        <ShowBalance balance={votingBalance} chainInfo={chainInfo} decimalDigits={5} title={t('Voting balance')} />
      </Grid>

      <Grid item sx={{ p: '0px 40px 20px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          // error={reapeAlert || noFeeAlert || zeroBalanceAlert}
          fullWidth
          helperText={
            <Grid container item justifyContent='space-between' xs={12}>
              <Grid item>
                {t('This value is locked for the duration of the vote')}
              </Grid>
              <Grid item>
                {t('Fee')} {': '}
                {estimatedFee
                  ? amountToHuman(estimatedFee.toString(), chainInfo?.decimals, FEE_DECIMAL_DIGITS)
                  : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                }
              </Grid>
            </Grid>
          }
          label={t('Vote value')}
          margin='dense'
          name='voteValue'
          // onBlur={(event) => handleTransferAmountOnBlur(event.target.value)}
          onChange={handleChange}
          placeholder='0'
          size='medium'
          type='number'
          value={voteValue}
          variant='outlined'
        />
      </Grid>

      <Grid item sx={{ p: '5px 40px 20px' }} xs={12}>
        <FormControl fullWidth>
          <InputLabel>{t('Locked for')}</InputLabel>
          <Select
            label='Select Convictions'
            native
            onChange={handleConvictionChange}
            sx={{ fontSize: 12, height: 50 }}
            value={selectedConviction}
          >
            {convictions?.map((c) => (
              <option key={c.value} style={{ fontSize: 13 }} value={c.value}>
                {c.text}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormHelperText>{'The conviction to use for this vote with appropriate lock period'}</FormHelperText>
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
  )
}
