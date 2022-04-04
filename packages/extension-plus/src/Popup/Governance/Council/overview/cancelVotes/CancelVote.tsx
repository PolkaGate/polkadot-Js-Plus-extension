// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveCouncilVote } from '@polkadot/api-derive/types';

import { GroupRemove as GroupRemoveIcon } from '@mui/icons-material';
import { Box, Container, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useState } from 'react';
import { Balance } from '@polkadot/types/interfaces';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup, Progress, Participator, ShowBalance } from '../../../../../components';
import broadcast from '../../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../../util/constants';
import { ChainInfo, nameAddress, PersonsInfo } from '../../../../../util/plusTypes';
import Members from '../Members';

interface Props {
  address: string;
  chain: Chain;
  chainInfo: ChainInfo;
  allCouncilInfo: PersonsInfo;
  showMyVotesModal: boolean;
  setShowMyVotesModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CancelVote({ address, allCouncilInfo, chain, chainInfo, setShowMyVotesModal, showMyVotesModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();

  const [votesInfo, seVotesInfo] = useState<DeriveCouncilVote>();
  const [filteredPersonsInfo, setFilteredPersonsInfo] = useState<PersonsInfo>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();

  const { api } = chainInfo;
  const electionApi = api.tx.phragmenElection ?? api.tx.electionsPhragmen ?? api.tx.elections;
  const tx = electionApi.removeVoter;

  useEffect(() => {
    if (!encodedAddressInfo) return;
    // eslint-disable-next-line no-void
    void tx().paymentInfo(encodedAddressInfo.address)
      .then((i) => setEstimatedFee(i?.partialFee))
      .catch(console.error);

    seVotesInfo(undefined); // reset votes when change address

    // eslint-disable-next-line no-void
    void api.derive.council.votesOf(encodedAddressInfo.address).then((v) => {
      console.log('v:', v.toString());
      seVotesInfo(v);
    });
  }, [api.derive.council, encodedAddressInfo, tx]);

  const handleClose = useCallback((): void => {
    setShowMyVotesModal(false);
  }, [setShowMyVotesModal]);

  useEffect(() => {
    if (!votesInfo || !allCouncilInfo) return;

    setFilteredPersonsInfo({ infos: allCouncilInfo.infos.filter((p) => votesInfo.votes.includes(p.accountId)) });
  }, [votesInfo, allCouncilInfo]);

  const handleCancelVotes = async () => {
    try {
      setState('confirming');
      const signer = keyring.getPair(encodedAddressInfo?.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, [], signer, encodedAddressInfo?.address);

      // TODO: can save to history here

      console.log('cancel vote', failureText);
      setState(status);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  };

  return (
    <Popup handleClose={handleClose} showModal={showMyVotesModal}>
      <PlusHeader action={handleClose} chain={chain} closeText={'Close'} icon={<GroupRemoveIcon fontSize='small' />} title={'My Votes'} />

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

      <Grid container justifyContent='space-between' sx={{ color: grey[600], fontSize: 12, p: '0px 40px 10px 120px', textAlign: 'right' }}>
        <Grid item>
          <ShowBalance balance={votesInfo?.stake} chainInfo={chainInfo} title={t('Staked')} />
        </Grid>
        <Grid item>
          <ShowBalance balance={estimatedFee} chainInfo={chainInfo} title={t('Fee')} />
        </Grid>
      </Grid>

      <Container id='scrollArea' sx={{ height: '280px', overflowY: 'auto' }}>
        {votesInfo && filteredPersonsInfo
          ? <Members chain={chain} chainInfo={chainInfo} membersType={t('Votes')} personsInfo={filteredPersonsInfo} />
          : <Progress title={t('Loading votes ...')} />
        }
      </Container>

      <Grid container item sx={{ padding: '5px 30px' }} xs={12}>
        <Password
          handleIt={handleCancelVotes}
          isDisabled={!votesInfo?.votes.length}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus} />

        <ConfirmButton
          handleBack={handleClose}
          handleConfirm={handleCancelVotes}
          handleReject={handleClose}
          isDisabled={!votesInfo?.votes.length || !estimatedFee ||!availableBalance || estimatedFee.gt(availableBalance)}
          state={state}
          text='Cancel votes'
        />
      </Grid>
    </Popup>
  );
}
