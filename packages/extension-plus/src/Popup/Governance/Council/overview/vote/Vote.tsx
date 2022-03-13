// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { HowToReg as HowToRegIcon } from '@mui/icons-material';
import { Grid, InputAdornment, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Hint, Password, PlusHeader, Popup, Progress, ShowBalance } from '../../../../../components';
import broadcast from '../../../../../util/api/broadcast';
import getVotingBond from '../../../../../util/api/getVotingBond';
import { PASS_MAP } from '../../../../../util/constants';
import { ChainInfo, PersonsInfo } from '../../../../../util/plusTypes';
import VoteMembers from './VoteMembers';

interface Props {
  chain: Chain;
  allCouncilInfo: PersonsInfo;
  chainInfo: ChainInfo;
  showVotesModal: boolean;
  setShowVotesModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Vote({ allCouncilInfo, chain, chainInfo, setShowVotesModal, showVotesModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [votingBondBase, setVotingBondBase] = useState<bigint>();
  const [votingBondFactor, setVotingBondFactor] = useState<bigint>();
  const [votingBond, setVotingBond] = useState<bigint>();
  const [state, setState] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<string>();
  const [voteValue, setVoteValue] = useState<bigint>();
  const [estimatedFee, setEstimatedFee] = useState<bigint>();
  const { api, coin } = chainInfo;
  const params = useMemo(() => [selectedCandidates, voteValue], [selectedCandidates, voteValue]);

  const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;
  const tx = electionApi.vote;

  useEffect(() => {
    if (!selectedAddress) return;
    // eslint-disable-next-line no-void
    void tx(...params).paymentInfo(selectedAddress)
      .then((i) => setEstimatedFee(BigInt(String(i?.partialFee))))
      .catch(console.error);
  }, [params, selectedAddress, tx]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getVotingBond(chain).then((r) => {
      setVotingBondBase(BigInt(r[0].toString()));
      setVotingBondFactor(BigInt(r[1].toString()));
    });
  }, [chain]);

  useEffect(() => {
    if (votingBondBase && votingBondFactor) {
      setVotingBond(BigInt(votingBondBase) + votingBondFactor * BigInt(selectedCandidates.length));
    }
  }, [selectedCandidates, votingBondBase, votingBondFactor]);

  const handleClose = useCallback((): void => {
    setShowVotesModal(false);
  }, [setShowVotesModal]);

  const handleVote = async () => {
    try {
      setState('confirming');
      const signer = keyring.getPair(selectedAddress);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, signer);

      // TODO: can save to history here

      console.log('vote failureText', failureText);
      setState(status);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  };

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setVoteValue(event.target.value);
  }, []);

  const HelperText = () => (
    <Grid container item justifyContent='space-between' xs={12}>
      <Grid item>
        {t('will be locked and used in elections')}
      </Grid>
      <Grid item>
        <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title={t('Fee')} />
      </Grid>
    </Grid>
  );

  return (
    <Popup handleClose={handleClose} showModal={showVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<HowToRegIcon fontSize='small' />} title={'Vote'} />

      <AllAddresses
        availableBalance={availableBalance}
        chain={chain} chainInfo={chainInfo}
        selectedAddress={selectedAddress}
        setAvailableBalance={setAvailableBalance}
        setSelectedAddress={setSelectedAddress}
        text={
          <Hint icon={true} id='votingBond' place='bottom' tip={t('will be reserved for the duration of your vote')}>
            <ShowBalance balance={votingBond} chainInfo={chainInfo} decimalDigits={5} title={t('Voting bond')} />
          </Hint>
        }
        title={t('Voter')}
      />

      <Grid item xs={12} sx={{ p: '5px 40px', fontSize: 11 }}>
        <TextField
          InputProps={{ endAdornment: (<InputAdornment position='end' sx={{ fontSize: 10 }}>{coin}</InputAdornment>) }}
          color='warning'
          fullWidth
          helperText={<HelperText />}
          label={t('Vote value')}
          margin='dense'
          name='value'
          onChange={handleChange}
          placeholder='0'
          size='medium'
          type='number'
          value={voteValue}
          variant='outlined'
        />
      </Grid>

      {allCouncilInfo
        ? <Grid container sx={{ padding: '0px 30px' }}>

          <Grid id='scrollArea' item sx={{ height: '172px', overflowY: 'auto' }} xs={12}>
            <VoteMembers chain={chain} chainInfo={chainInfo} membersType={t('Accounts to vote')} personsInfo={allCouncilInfo} setSelectedCandidates={setSelectedCandidates} />
          </Grid>

          <Grid container item sx={{ paddingTop: '10px' }} xs={12}>
            <Password
              handleIt={handleVote}
              password={password}
              passwordStatus={passwordStatus}
              setPassword={setPassword}
              setPasswordStatus={setPasswordStatus}
            />

            <ConfirmButton
              handleBack={handleClose}
              handleConfirm={handleVote}
              handleReject={handleClose}
              isDisabled={!availableBalance || !votingBond || BigInt(votingBond) >= BigInt(availableBalance)} //FIXME: consider fee too
              state={state}
              text='Vote'
            />
          </Grid>
        </Grid>
        : <Progress title={t('Loading members ...')} />
      }
    </Popup>
  );
}
