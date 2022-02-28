// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component renders contribute page where users can easily contribute to an active crowdloan */

import { AllOut as AllOutIcon } from '@mui/icons-material';
import { Grid, InputAdornment, Skeleton, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { AllAddresses, ConfirmButton, Password, PlusHeader, Popup } from '../../components';
import broadcast from '../../util/api/broadcast';
import { PASS_MAP } from '../../util/constants';
import { Auction, ChainInfo, Crowdloan, TransactionDetail } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, fixFloatingPoint, getSubstrateAddress, getTransactionHistoryFromLocalStorage, prepareMetaData } from '../../util/plusUtils';
import Fund from './Fund';

interface Props {
  auction: Auction;
  crowdloan: Crowdloan;
  contributeModal: boolean;
  setContributeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  endpoints: LinkOption[];
  chainInfo: ChainInfo;
}

export default function Contribute({ auction, chainInfo, contributeModal, crowdloan, endpoints, setContributeModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const chain = useMetadata(chainInfo.genesisHash, true);
  const auctionMinContributionInHuman = amountToHuman(auction.minContribution, chainInfo.decimals);

  const [password, setPassword] = useState<string>('');
  const [contributionAmountInHuman, setContributionAmountInHuman] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [confirmingState, setConfirmingState] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<Balance>();
  const [availableBalance, setAvailableBalance] = useState<string>();

  const { hierarchy } = useContext(AccountContext);

  const FEE_DECIMAL_DIGITS = chainInfo?.coin === 'DOT' ? 4 : 6;
  const api = chainInfo.api;
  const tx = api.tx.crowdloan.contribute;

  useEffect(() => {
    if (!selectedAddress) { return; }

    const contributingAmountInMachine = amountToMachine(contributionAmountInHuman, chainInfo.decimals);

    const dummyParams = ['2000', contributingAmountInMachine, null];

    // eslint-disable-next-line no-void
    void tx(...dummyParams).paymentInfo(selectedAddress)
      .then((i) => {
        setEstimatedFee(i?.partialFee);
        console.log('estimatedFeeInHuman', amountToHuman(String(i?.partialFee), chainInfo?.decimals, 5));
      }).catch(console.error);
  }, [auction.minContribution, selectedAddress, contributionAmountInHuman]);

  const handleConfirmModaClose = useCallback((): void => {
    setContributeModalOpen(false);
  }, [setContributeModalOpen]);

  function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, currentTransactionDetail: TransactionDetail, _chainName?: string): Promise<boolean> {
    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress, _chainName);

    savedHistory.push(currentTransactionDetail);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory, _chainName));
  }

  const handleConfirm = async (): Promise<void> => {
    try {
      setConfirmingState('confirming');
      const signer = keyring.getPair(selectedAddress);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      const contributingAmountInMachine = amountToMachine(contributionAmountInHuman, chainInfo.decimals);

      const params = [crowdloan.fund.paraId, contributingAmountInMachine, null];

      const { block, failureText, fee, status, txHash } = await broadcast(api, tx, params, signer);

      setConfirmingState(status);

      const history: TransactionDetail = {
        action: 'contribute',
        amount: contributionAmountInHuman,
        block: block,
        date: Date.now(),
        fee: fee || '',
        from: selectedAddress,
        hash: txHash || '',
        status: failureText || status,
        to: crowdloan.fund.paraId 
      };

      // eslint-disable-next-line no-void
      void saveHistory(chain, hierarchy, selectedAddress, history);
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

      <Grid container item sx={{ padding: '10px 30px 40px' }} xs={12}>
        {chain && <Fund coin={chainInfo.coin} crowdloan={crowdloan} decimals={chainInfo.decimals} endpoints={endpoints} />}
      </Grid>

      <AllAddresses availableBalance={availableBalance} chain={chain} chainInfo={chainInfo} selectedAddress={selectedAddress} setAvailableBalance={setAvailableBalance} setSelectedAddress={setSelectedAddress} text={t('Select account to contribute')} />

      <Grid item sx={{ p: '10px 40px 35px 80px' }} xs={12}>
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
                {t('Minimum contribution: ') + auctionMinContributionInHuman + ' ' + chainInfo.coin}
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
          label={t('Amount')}
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
      <Grid container item sx={{ p: '0px 20px' }} xs={12}>
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
          isDisabled={Number(contributionAmountInHuman) < Number(auctionMinContributionInHuman) ||
            Number(contributionAmountInHuman) >= Number(amountToHuman(String(BigInt(availableBalance) - estimatedFee.toBigInt()), chainInfo?.decimals))
          }
          state={confirmingState}
        />
      </Grid>
    </Popup>
  );
}
