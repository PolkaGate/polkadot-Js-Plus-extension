// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveProposal } from '@polkadot/api-derive/types';

import { ThumbsUpDown as ThumbsUpDownIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup } from '../../../../components';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import getChainInfo from '../../../../util/getChainInfo';
import { ChainInfo } from '../../../../util/plusTypes';
import { formatMeta } from '../../../../util/plusUtils';


interface Props {
  selectedProposal: DeriveProposal;
  chain: Chain;
  chainInfo: ChainInfo;
  showVoteProposalModal: boolean;
  handleVoteProposalModalClose: () => void;
}

export default function Second({ chain, chainInfo, handleVoteProposalModalClose, selectedProposal, showVoteProposalModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [state, setState] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<string>();

  const value = selectedProposal.image?.proposal;
  const meta = value?.registry.findMetaCall(value.callIndex);
  const description = formatMeta(meta?.meta);

  useEffect(() => {
    if (!selectedAddress || !chain) return;
    // eslint-disable-next-line no-void
    // void getBalanceAll(selectedAddress, chain).then((b) => {
    //   setVotingBalance(b?.votingBalance.toString());
    // });
  }, [chain, selectedAddress]);

  const handleReject = useCallback((): void => {
    setState('');
    handleVoteProposalModalClose();
  }, [handleVoteProposalModalClose]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    setState('confirming');

    try {
      const pair = keyring.getPair(selectedAddress);

      pair.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);

      const { api } = await getChainInfo(chain);
      const tx = api.tx.democracy.second;
      const params = api.tx.democracy.second.meta.args.length === 2
        ? [selectedProposal.index, selectedProposal.seconds.length]
        : [selectedProposal.index];

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, pair);

      // TODO: can save to history here

      setState(status);
    } catch (e) {
      console.log('error in VoteProposal :', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState('');
    }
  }, [chain, password, selectedAddress, selectedProposal.index, selectedProposal.seconds.length]);

  return (
    <Popup handleClose={handleVoteProposalModalClose} showModal={showVoteProposalModal}>
      <PlusHeader action={handleVoteProposalModalClose} chain={chain} closeText={'Close'} icon={<ThumbsUpDownIcon fontSize='small' />} title={'Second'} />

      <AllAddresses availableBalance={availableBalance} chainInfo={chainInfo}  setAvailableBalance={setAvailableBalance} chain={chain} selectedAddress={selectedAddress} setSelectedAddress={setSelectedAddress} text={t('Select voter account')} />

      <Grid container item justifyContent='center' sx={{ height: '275px' }} xs={12}>
        <Grid item sx={{ fontWeight: '600', textAlign: 'center', pt: '50px' }} xs={12}>
          <Typography variant='h6'>
            {t('Proposal')}{': #'}{String(selectedProposal?.index)}
          </Typography>
        </Grid>
        <Grid item sx={{ textAlign: 'center', p: '0px 30px' }} xs={12}>
          <Typography variant='subtitle1'>
            {description}
          </Typography>
        </Grid>
      </Grid>

      <Grid container item sx={{ p: '0px 30px', textAlign: 'center' }} xs={12}>
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
  );
}
