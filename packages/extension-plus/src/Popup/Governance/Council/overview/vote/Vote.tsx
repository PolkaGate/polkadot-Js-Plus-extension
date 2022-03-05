// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { HowToReg as HowToRegIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, ShowBalance, Password, PlusHeader, Popup, Progress } from '../../../../../components';
import broadcast from '../../../../../util/api/broadcast';
import getVotingBond from '../../../../../util/api/getVotingBond';
import { PASS_MAP } from '../../../../../util/constants';
import getChainInfo from '../../../../../util/getChainInfo';
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
  const [selectedVoterAddress, setSelectedVoterAddress] = useState<string>('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [votingBondBase, setVotingBondBase] = useState<bigint>();
  const [votingBondFactor, setVotingBondFactor] = useState<bigint>();
  const [votingBond, setVotingBond] = useState<bigint>();
  const [state, setState] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<string>();

  useEffect(() => {
    // eslint-disable-next-line no-void
    void getVotingBond(chain).then((r) => {
      setVotingBondBase(BigInt(r[0].toString()));
      setVotingBondFactor(BigInt(r[1].toString()));
    });
  }, [chain]);

  useEffect(() => {
    if (votingBondBase && votingBondFactor) { setVotingBond(BigInt(votingBondBase) + votingBondFactor * BigInt(selectedCandidates.length)); }
  }, [selectedCandidates, votingBondBase, votingBondFactor]);

  const handleClose = useCallback((): void => {
    setShowVotesModal(false);
  }, [setShowVotesModal]);

  const handleVote = async () => {
    try {
      setState('confirming');
      const signer = keyring.getPair(selectedVoterAddress);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { api } = await getChainInfo(chain);
      const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;
      const tx = electionApi.vote;
      const params = [selectedCandidates, votingBond];

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

  return (
    <Popup handleClose={handleClose} showModal={showVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<HowToRegIcon fontSize='small' />} title={'Vote'} />

      <AllAddresses availableBalance={availableBalance} chainInfo={chainInfo} setAvailableBalance={setAvailableBalance} chain={chain} selectedAddress={selectedVoterAddress} setSelectedAddress={setSelectedVoterAddress} text={t('Select voter account')} />

      <Grid sx={{ fontSize: 12 }} xs={12}>
        <ShowBalance balance={votingBond} chainInfo={chainInfo} decimalDigits={5} title={t('Voting bond')} />
      </Grid>

      {allCouncilInfo
        ? <Grid container sx={{ padding: '0px 30px' }}>

          <Grid id='scrollArea' item sx={{ height: '250px', overflowY: 'auto', paddingBottom: '5px' }} xs={12}>
            <VoteMembers chain={chain} chainInfo={chainInfo} membersType={t('Accounts to vote')} personsInfo={allCouncilInfo} setSelectedCandidates={setSelectedCandidates} />
          </Grid>

          <Grid container item sx={{ paddingTop: '5px' }} xs={12}>
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
