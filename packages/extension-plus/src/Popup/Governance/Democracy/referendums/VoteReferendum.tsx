// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { ThumbsUpDown as ThumbsUpDownIcon } from '@mui/icons-material';
import { FormControl, FormHelperText, Grid, InputAdornment, InputLabel, Select, SelectChangeEvent, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup } from '../../../../components';
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
  const [availableBalance, setAvailableBalance] = useState<string>();

  useEffect(() => {
    if (!selectedAddress || !chain) return;
    // eslint-disable-next-line no-void
    void getBalanceAll(selectedAddress, chain).then((b) => {
      setVotingBalance(b?.votingBalance.toString());
    });
  }, [chain, selectedAddress, t]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    setState('confirming');

    try {
      const pair = keyring.getPair(selectedAddress);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const voteValueInMachine = amountToMachine(voteValue, chainInfo.decimals);
      const { api } = await getChainInfo(chain);
      const isCurrentVote = !!api.query.democracy.votingOf;

      const params = isCurrentVote
        ? [voteInfo.refId, { Standard: { vote: { aye: voteInfo.voteType, selectedConviction }, voteValueInMachine } }]
        : [voteInfo.refId, { aye: voteInfo.voteType, selectedConviction }];

      const tx = api.tx.democracy.vote;

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair);

      // TODO can save to history here
      setState(status);
    } catch (e) {
      console.log('error in VoteProposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [chain, password, selectedAddress, selectedConviction, voteInfo.refId, voteInfo.voteType, voteValue]);

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

      <Grid item sx={{ p: '20px 40px 10px', textAlign: 'right' }} xs={12}>
        {t('Voting balance')}:{' '}
        {votingBalance
          ? <>
            {amountToHuman(votingBalance, chainInfo.decimals, 4)}{' '}{chainInfo.coin}
          </>
          : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
        }
      </Grid>

      <Grid item sx={{ p: '0px 40px 20px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          // error={reapeAlert || noFeeAlert || zeroBalanceAlert}
          fullWidth
          helperText={t('This value is locked for the duration of the vote')}
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
          <InputLabel>{t('Convictions')}</InputLabel>
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
          state={state}
        />
      </Grid>

    </Popup>
  )
}
