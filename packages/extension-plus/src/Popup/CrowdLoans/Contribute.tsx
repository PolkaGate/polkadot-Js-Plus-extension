// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 *  this component renders contribute page where users can easily contribute to an active crowdloan
 * */

import { AllOut as AllOutIcon } from '@mui/icons-material';
import { Grid, InputAdornment, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Participator, Password, PlusHeader, Popup } from '../../components';
import broadcast from '../../util/api/broadcast';
import { PASS_MAP } from '../../util/constants';
import { Auction, ChainInfo, Crowdloan, nameAddress, TransactionDetail } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, fixFloatingPoint, saveHistory } from '../../util/plusUtils';
import Fund from './Fund';

interface Props {
  auction: Auction;
  crowdloan: Crowdloan;
  contributeModal: boolean;
  setContributeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  endpoints: LinkOption[];
  chainInfo: ChainInfo;
  address: string;
}

export default function Contribute({ address, auction, chainInfo, contributeModal, crowdloan, endpoints, setContributeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const chain = useMetadata(chainInfo.genesisHash, true);
  const auctionMinContributionInHuman = amountToHuman(auction.minContribution, chainInfo.decimals);

  const [availableBalance, setAvailableBalance] = useState<Balance | undefined>();
  const [confirmingState, setConfirmingState] = useState<string>('');
  const [contributionAmountInHuman, setContributionAmountInHuman] = useState<string>('');
  const [encodedAddressInfo, setEncodedAddressInfo] = useState<nameAddress | undefined>();
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);

  const { hierarchy } = useContext(AccountContext);

  const api = chainInfo.api;
  const tx = api.tx.crowdloan.contribute;

  useEffect(() => {
    if (!encodedAddressInfo) {
      console.log('no encodedAddressInfo');

      return;
    }

    const contributingAmountInMachine = amountToMachine(contributionAmountInHuman, chainInfo.decimals);

    const dummyParams = ['2000', contributingAmountInMachine, null];

    // eslint-disable-next-line no-void
    void tx(...dummyParams).paymentInfo(encodedAddressInfo.address)
      .then((i) => {
        setEstimatedFee(i?.partialFee);
        console.log('estimatedFeeInHuman', i?.partialFee.toHuman());
      }).catch(console.error);
  }, [auction.minContribution, encodedAddressInfo, contributionAmountInHuman, chainInfo.decimals, tx]);

  const handleConfirmModaClose = useCallback((): void => {
    setContributeModalOpen(false);
  }, [setContributeModalOpen]);

  const handleConfirm = async (): Promise<void> => {
    try {
      if (!encodedAddressInfo) {
        console.log(' No encoded address');

        return;
      }

      setConfirmingState('confirming');
      const signer = keyring.getPair(encodedAddressInfo?.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      const contributingAmountInMachine = amountToMachine(contributionAmountInHuman, chainInfo.decimals);

      const params = [crowdloan.fund.paraId, contributingAmountInMachine, null];

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, signer, encodedAddressInfo.address);


      const history: TransactionDetail = {
        action: 'contribute',
        amount: contributionAmountInHuman,
        block: block,
        date: Date.now(),
        fee: fee || '',
        from: encodedAddressInfo.address,
        hash: txHash || '',
        status: failureText || status,
        to: crowdloan.fund.paraId
      };

      updateMeta(...saveHistory(chain, hierarchy, encodedAddressInfo.address, history)).catch(console.error);
     
      setConfirmingState(status);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setConfirmingState('');
    }
  };

  const handleReject = useCallback((): void => {
    setConfirmingState('');
    handleConfirmModaClose();
    onAction('/');
  }, [handleConfirmModaClose, onAction]);

  const handleBack = useCallback((): void => {
    handleConfirmModaClose();
  }, [handleConfirmModaClose]);

  const handleChange = useCallback((value: string): void => {
    value = Number(value) < 0 ? String(-Number(value)) : value;

    setContributionAmountInHuman(fixFloatingPoint(value));
  }, []);

  return (
    <Popup handleClose={handleConfirmModaClose} showModal={contributeModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<AllOutIcon fontSize='small' />} title={'Contribute'} />

      <Grid container item sx={{ padding: '20px 30px 40px' }} xs={12}>
        {chain && <Fund coin={chainInfo.coin} crowdloan={crowdloan} decimals={chainInfo.decimals} endpoints={endpoints} />}

      </Grid>

      <Participator
        address={address}
        availableBalance={availableBalance}
        chain={chain}
        chainInfo={chainInfo}
        encodedAddressInfo={encodedAddressInfo}
        role={t('Contributor')}
        setAvailableBalance={setAvailableBalance}
        setEncodedAddressInfo={setEncodedAddressInfo}
      />

      <Grid container item xs={12} sx={{ p: '25px 40px 30px' }}>
        <TextField
          InputLabelProps={{ shrink: true }}
          InputProps={{ endAdornment: (<InputAdornment position='end'>{chainInfo.coin}</InputAdornment>) }}
          autoFocus
          color='warning'
          fullWidth
          helperText={
            <Grid container item justifyContent='space-between' xs={12}>
              <Grid item>
                {t('Minimum contribution: ') + auctionMinContributionInHuman + ' ' + chainInfo.coin}
              </Grid>
              <Grid item>
                {t('Fee')} {': '}
                {estimatedFee
                  ? `${estimatedFee.toHuman()}`
                  : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                }
              </Grid>
            </Grid>
          }
          label={t('Contribution amount')}
          margin='dense'
          name='contributionAmount'
          onChange={(event) => handleChange(event.target.value)}
          placeholder={auctionMinContributionInHuman}
          size='medium'
          type='number'
          value={contributionAmountInHuman}
          variant='outlined'
        />
      </Grid>

      <Grid container item sx={{ p: '20px' }} xs={12}>
        <Password
          handleIt={handleConfirm}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus}
        />

        <ConfirmButton
          handleBack={handleBack}
          handleConfirm={handleConfirm}
          handleReject={handleBack}
          isDisabled={!estimatedFee || !availableBalance || Number(contributionAmountInHuman) < Number(auctionMinContributionInHuman) ||
            Number(contributionAmountInHuman) >= Number(amountToHuman(String(BigInt(availableBalance) - BigInt(estimatedFee)), chainInfo?.decimals))
          }
          state={confirmingState}
        />
      </Grid>
    </Popup>
  );
}
