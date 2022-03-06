// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveProposal } from '@polkadot/api-derive/types';

import { RecommendOutlined as RecommendOutlinedIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import keyring from '@polkadot/ui-keyring';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup, ShowBalance } from '../../../../components';
import broadcast from '../../../../util/api/broadcast';
import { PASS_MAP } from '../../../../util/constants';
import { ChainInfo } from '../../../../util/plusTypes';
import { formatMeta } from '../../../../util/plusUtils';
import { grey } from '@mui/material/colors';

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
  const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null);

  const value = selectedProposal.image?.proposal;
  const meta = value?.registry.findMetaCall(value.callIndex);
  const description = formatMeta(meta?.meta);

  const tx = chainInfo?.api.tx.democracy.second;

  const params = useMemo(() => chainInfo?.api.tx.democracy.second.meta.args.length === 2
    ? [selectedProposal.index, selectedProposal.seconds.length]
    : [selectedProposal.index], [chainInfo, selectedProposal]);

  useEffect(() => {
    if (!chainInfo || !tx || !selectedAddress) return;

    // eslint-disable-next-line no-void
    void tx(...params).paymentInfo(selectedAddress)
      .then((i) => setEstimatedFee(BigInt(String(i?.partialFee))))
      .catch(console.error);
  }, [chainInfo, params, selectedAddress, tx]);

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

      const { block, failureText, fee, status, txHash } = await broadcast(chainInfo?.api, tx, params, pair);

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
      <PlusHeader action={handleVoteProposalModalClose} chain={chain} closeText={'Close'} icon={<RecommendOutlinedIcon fontSize='small' />} title={'Second'} />

      <AllAddresses availableBalance={availableBalance} chain={chain} chainInfo={chainInfo} selectedAddress={selectedAddress} setAvailableBalance={setAvailableBalance} setSelectedAddress={setSelectedAddress} text={t('Select voter')} />

      <Grid sx={{ color: grey[600], fontSize: 11 }} xs={12}>
        <ShowBalance balance={estimatedFee} chainInfo={chainInfo} decimalDigits={5} title='Fee' />
      </Grid>

      <Grid container item justifyContent='center' sx={{ height: '260px' }} xs={12}>
        <Grid item sx={{ fontWeight: '600', pt: '50px', textAlign: 'center' }} xs={12}>
          <Typography variant='h6'>
            {t('Proposal')}{': #'}{String(selectedProposal?.index)}
          </Typography>
        </Grid>
        <Grid item sx={{ p: '0px 30px', textAlign: 'center' }} xs={12}>
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
