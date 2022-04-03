// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here one can vote Aye or Nay to a referendum
 *
*/
import { ThumbDownAlt as ThumbDownAltIcon, ThumbUpAlt as ThumbUpAltIcon } from '@mui/icons-material';
import {  FormControl, FormHelperText, Grid, InputAdornment, InputLabel, Select, SelectChangeEvent, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Participator, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP, VOTE_MAP } from '../../../../util/constants';
import { ChainInfo, Conviction, nameAddress } from '../../../../util/plusTypes';
import { amountToMachine } from '../../../../util/plusUtils';


interface Props {
  address: string;
  voteInfo: { refId: string, voteType: number };
  chain: Chain;
  chainInfo: ChainInfo;
  convictions: Conviction[];
  showVoteReferendumModal: boolean;
  handleVoteReferendumModalClose: () => void;
}

export default function VoteReferendum({ address, chain, chainInfo, convictions, handleVoteReferendumModalClose, showVoteReferendumModal, voteInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [votingBalance, setVotingBalance] = useState<Balance | undefined>();
  const [voteValue, setVoteValue] = useState<string>();
  const [selectedConviction, setSelectedConviction] = useState<number>(convictions[0].value);
  const [params, setParams] = useState<unknown[] | (() => unknown[]) | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const { api, coin, decimals } = chainInfo;

  const isCurrentVote = !!api.query.democracy.votingOf;
  const tx = api.tx.democracy.vote;

  useEffect(() => {
    if (!chainInfo || !tx || !encodedAddressInfo) return;
    const voteValueInMachine = amountToMachine(voteValue, chainInfo.decimals);
    const p = isCurrentVote
      ? [voteInfo.refId, { Standard: { vote: { aye: voteInfo.voteType, selectedConviction }, voteValueInMachine } }]
      : [voteInfo.refId, { aye: voteInfo.voteType, selectedConviction }];

    setParams(p);

    // eslint-disable-next-line no-void
    void tx(...p).paymentInfo(encodedAddressInfo.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);

    // eslint-disable-next-line no-void
    void api.derive.balances?.all(encodedAddressInfo.address).then((b) => {
      setVotingBalance(b?.votingBalance);
    }).catch(console.error);
  }, [chainInfo, isCurrentVote, encodedAddressInfo, selectedConviction, tx, voteInfo, voteValue, api.derive.balances]);

  useEffect(() => {
    if (!estimatedFee || !availableBalance) { setIsDisabled(true); }
    else {
      setIsDisabled(amountToMachine(voteValue, decimals) + BigInt(String(estimatedFee)) >= BigInt(String(availableBalance)))
    }
  }, [availableBalance, decimals, estimatedFee, voteValue]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    setState('confirming');

    try {
      const pair = keyring.getPair(encodedAddressInfo?.address);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair, encodedAddressInfo?.address);

      // TODO can save to history here
      setState(status);
    } catch (e) {
      console.log('error in VoteProposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [api, params, password, encodedAddressInfo, tx]);

  const handleReject = useCallback((): void => {
    setState('');
    handleVoteReferendumModalClose();
  }, [handleVoteReferendumModalClose]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = Number(event.target.value) < 0 ? -Number(event.target.value) : Number(event.target.value);

    setVoteValue(String(value));
  }, []);

  const handleConvictionChange = useCallback((event: SelectChangeEvent<number>): void => {
    console.log('selected', event.target.value);
    setSelectedConviction(Number(event.target.value));
  }, []);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('This value is locked for the duration of the vote')}
      </Grid>
      <Grid item>
        {t('Fee')} {': '}
        {estimatedFee
          ? `${estimatedFee.toHuman()}`
          : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
        }
      </Grid>
    </Grid>);

  return (
    <Popup handleClose={handleVoteReferendumModalClose} showModal={showVoteReferendumModal}>
      <PlusHeader
        action={handleVoteReferendumModalClose}
        chain={chain}
        closeText={'Close'}
        icon={voteInfo.voteType === VOTE_MAP.AYE ? <ThumbUpAltIcon fontSize='small' /> : <ThumbDownAltIcon fontSize='small' />}
        title={'Vote'}
      />

      <Participator
        address={address}
        availableBalance={availableBalance}
        chain={chain}
        chainInfo={chainInfo}
        encodedAddressInfo={encodedAddressInfo}
        role={t('Voter')}
        setAvailableBalance={setAvailableBalance}
        setEncodedAddressInfo={setEncodedAddressInfo}
      />

      <Grid item sx={{ fontSize: 11, px: '48px', textAlign: 'right' }} xs={12}>
        <ShowBalance balance={votingBalance} chainInfo={chainInfo} decimalDigits={5} title={t('Voting balance')} />
      </Grid>

      <Grid item sx={{ p: '40px 40px 20px' }} xs={12}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          fullWidth
          helperText={<HelperText />}
          label={t('Vote value')}
          margin='dense'
          name='voteValue'
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

      <Grid container item sx={{ p: '35px 30px', textAlign: 'center' }} xs={12}>
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
