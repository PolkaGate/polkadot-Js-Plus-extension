// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description here users confirm their staking related orders (e.g., stake, unstake, redeem, etc.) 
 * */
import type { StakingLedger } from '@polkadot/types/interfaces';

import { BuildCircleRounded as BuildCircleRoundedIcon, ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Grid, IconButton, Skeleton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import { Balance } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';

import { AccountContext } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Password, PlusHeader, Popup } from '../../components';
import Hint from '../../components/Hint';
import broadcast from '../../util/api/broadcast';
import { bondOrBondExtra, chill, nominate, unbond } from '../../util/api/staking';
import { PASS_MAP, STATES_NEEDS_MESSAGE } from '../../util/constants';
import { AccountsBalanceType, ChainInfo, StakingConsts, TransactionDetail } from '../../util/plusTypes';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, isEqual, prepareMetaData } from '../../util/plusUtils';
import ValidatorsList from './ValidatorsList';

interface Props {
  chain?: Chain | null;
  chainInfo: ChainInfo;
  state: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectValidatorsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  handleEasyStakingModalClose?: () => void;
  stakingConsts: StakingConsts | null;
  amount: bigint;
  ledger: StakingLedger | null;
  nominatedValidators: DeriveStakingQuery[] | null;
  validatorsIdentities: DeriveAccountInfo[] | null;
  selectedValidators: DeriveStakingQuery[] | null;
}

export default function ConfirmStaking({ amount, chain, chainInfo, handleEasyStakingModalClose, ledger, nominatedValidators, selectedValidators, setConfirmStakingModalOpen, setSelectValidatorsModalOpen, setState, showConfirmStakingModal, staker, stakingConsts, state, validatorsIdentities }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [currentlyStaked, setCurrentlyStaked] = useState<bigint | undefined>(undefined);
  const [totalStakedInHuman, setTotalStakedInHuman] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<Balance>();
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState<boolean>(false);
  const [confirmButtonText, setConfirmButtonText] = useState<string>(t('Confirm'));
  const [amountNeedsAdjust, setAmountNeedsAdjust] = useState<boolean>(false);
  const [surAmount, setSurAmount] = useState<bigint>(amount); /** SUR: Staking Unstaking Redeem */
  const [note, setNote] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<bigint>(0n);

  const nominatedValidatorsId = useMemo(() => nominatedValidators ? nominatedValidators.map((v) => String(v.accountId)) : [], [nominatedValidators]);
  const selectedValidatorsAccountId = useMemo(() => selectedValidators ? selectedValidators.map((v) => String(v.accountId)) : [], [selectedValidators]);
  const validatorsToList = ['stakeAuto', 'stakeManual', 'changeValidators', 'setNominees'].includes(state) ? selectedValidators : nominatedValidators;

  /** list of available trasaction types */
  const chilled = chainInfo?.api.tx.staking.chill;
  const unbonded = chainInfo?.api.tx.staking.unbond;
  const nominated = chainInfo?.api.tx.staking.nominate;
  const bondExtra = chainInfo?.api.tx.staking.bondExtra;
  const bond = chainInfo?.api.tx.staking.bond;
  const redeem = chainInfo?.api.tx.staking.withdrawUnbonded;
  const bonding = currentlyStaked ? bondExtra : bond;

  async function saveHistory(chain: Chain | null, hierarchy: AccountWithChildren[], address: string, history: TransactionDetail[]): Promise<boolean> {
    if (!chain || !history.length) return false;

    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(...history);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  useEffect(() => {
    if (staker?.balanceInfo?.available) { setAvailableBalance(staker.balanceInfo.available); }
  }, [staker?.balanceInfo?.available]);

  useEffect(() => {
    if (['confirming', 'success', 'failed'].includes(confirmingState)) {
      // do not run following code while in these states
      return;
    }

    /** check if re-nomination is needed */
    if (['stakeManual', 'changeValidators'].includes(state)) {
      if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
        if (state === 'changeValidators') {
          setConfirmButtonDisabled(true)
        };
        setNote(t('The selected and previously nominated validators are the same, no need to renominate'));
      } else {
        setConfirmButtonDisabled(false);
        setNote('');
      }
    }
  }, [selectedValidatorsAccountId, state, nominatedValidatorsId, t, confirmingState]);

  useEffect(() => {
    if (['confirming', 'success', 'failed'].includes(confirmingState) || !chainInfo || currentlyStaked === undefined) {
      return;
    }

    /** defaults for many states */
    setTotalStakedInHuman(amountToHuman((currentlyStaked).toString(), chainInfo?.decimals));

    /** set fees and stakeAmount */
    let params;

    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
        params = currentlyStaked ? [surAmount] : [staker.address, surAmount, 'Staked'];

        // eslint-disable-next-line no-void
        void bonding(...params).paymentInfo(staker.address).then((i) => {
          const bondingFee = i?.partialFee;

          if (!isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            params = [selectedValidatorsAccountId];

            // eslint-disable-next-line no-void
            void nominated(...params).paymentInfo(staker.address).then((i) => {
              const nominatingFee = i?.partialFee;

              setEstimatedFee((bondingFee.add(nominatingFee) as Balance));
            });
          } else {
            setEstimatedFee(bondingFee);
          }
        }
        );

        setTotalStakedInHuman(amountToHuman((currentlyStaked + surAmount).toString(), chainInfo?.decimals));
        break;
      case ('stakeKeepNominated'):
        params = [surAmount];

        // eslint-disable-next-line no-void
        void bondExtra(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        setTotalStakedInHuman(amountToHuman((currentlyStaked + surAmount).toString(), chainInfo?.decimals));
        break;
      case ('unstake'):
        params = [surAmount];

        // eslint-disable-next-line no-void
        void unbonded(...params).paymentInfo(staker.address).then((i) => {
          const fee = i?.partialFee;

          if (surAmount === currentlyStaked) {
            // eslint-disable-next-line no-void
            void chilled().paymentInfo(staker.address).then((j) => setEstimatedFee((fee.add(j?.partialFee) as Balance)));
          } else { setEstimatedFee(fee); }
        });
        setTotalStakedInHuman(amountToHuman((currentlyStaked - surAmount).toString(), chainInfo?.decimals));
        break;
      case ('stopNominating'):
        // eslint-disable-next-line no-void
        void chilled().paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('changeValidators'):
      case ('setNominees'):
        params = [selectedValidatorsAccountId];

        // eslint-disable-next-line no-void
        void nominated(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('withdrawUnbound'):
        params = [100]; /** a dummy number */

        // eslint-disable-next-line no-void
        void redeem(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      default:
    }

    // return () => {
    //   setEstimatedFee(undefined);
    // };
  }, [surAmount, currentlyStaked, chainInfo, state, confirmingState, staker.address, bonding, bondExtra, unbonded, chilled, selectedValidatorsAccountId, nominatedValidatorsId, nominated, redeem, ledger]);

  useEffect(() => {
    if (!estimatedFee || estimatedFee?.isEmpty || !availableBalance || !stakingConsts?.existentialDeposit) { return; }

    if (['confirming', 'success', 'failed'].includes(confirmingState)) {
      // do not run following code while confirming
      return;
    }

    let partialSubtrahend = surAmount;

    if (['withdrawUnbound', 'unstake'].includes(state)) { partialSubtrahend = 0n; }

    const fee = BigInt(estimatedFee.toString());

    if (availableBalance - (partialSubtrahend + fee) < stakingConsts?.existentialDeposit) {
      setConfirmButtonDisabled(true);
      setConfirmButtonText(t('Account reap issue, consider fee!'));

      if (
        // staker.balanceInfo?.available - (partialSubtrahend + fee) > 0 && // might be even negative!!
        ['stakeAuto', 'stakeManual', 'stakeKeepNominated'].includes(state)) {
        setAmountNeedsAdjust(true);
      }
    } else {
      setConfirmButtonDisabled(false);
      setConfirmButtonText(t('Confirm'));
    }
  }, [surAmount, estimatedFee, availableBalance, stakingConsts?.existentialDeposit, state, t, confirmingState]);

  useEffect(() => {
    if (!ledger) { return; }

    setCurrentlyStaked(BigInt(String(ledger.active)));
  }, [ledger]);

  const handleCloseModal = useCallback((): void => {
    setConfirmStakingModalOpen(false);
  }, [setConfirmStakingModalOpen]);

  const handleBack = useCallback((): void => {
    if (!['stakeManual', 'changeValidators', 'setNominees'].includes(state)) {
      setState('');
      setConfirmingState('');
    }

    handleCloseModal();
  }, [handleCloseModal, setState, state]);

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('stakeAuto'):
      case ('stakeManual'):
      case ('stakeKeepNominated'):
        return 'STAKING OF';
      case ('changeValidators'):
      case ('setNominees'):
        return 'NOMINATING';
      case ('unstake'):
        return 'UNSTAKING';
      case ('withdrawUnbound'):
        return 'REDEEM';
      case ('stopNominating'):
        return 'STOP NOMINATING';
      default:
        return state.toUpperCase();
    }
  };

  const handleConfirm = async (): Promise<void> => {
    const localState = state;
    const history: TransactionDetail[] = []; /** collect all records to save in the local history at the end */

    try {
      setConfirmingState('confirming');

      const signer = keyring.getPair(staker.address);

      signer.unlock(password);
      setPasswordStatus(PASS_MAP.CORRECT);
      const alreadyBondedAmount = BigInt(String(ledger?.total)); // TODO: double check it, it might be ledger?.active but works if unstacked in this era

      if (['stakeAuto', 'stakeManual', 'stakeKeepNominated'].includes(localState) && surAmount !== 0n) {
        const { block, failureText, fee, status, txHash } = await bondOrBondExtra(chain, staker.address, signer, surAmount, alreadyBondedAmount);

        history.push({
          action: alreadyBondedAmount ? 'bond_extra' : 'bond',
          amount: amountToHuman(String(surAmount), chainInfo?.decimals),
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        if (status === 'failed' || localState === 'stakeKeepNominated') {
          setConfirmingState(status);

          // eslint-disable-next-line no-void
          void saveHistory(chain, hierarchy, staker.address, history);

          return;
        }
      }

      if (['changeValidators', 'stakeAuto', 'stakeManual', 'setNominees'].includes(localState)) {
        if (localState === 'stakeAuto') {
          if (!selectedValidators) { // TODO: does it realy happen!
            console.log('! there is no selectedValidators to bond at StakeAuto, so might do bondExtera');

            if (alreadyBondedAmount) {
              setConfirmingState('success');
            } else {
              setConfirmingState('failed');
            }

            return;
          }

          if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
            console.log('the selected and previously nominated validators are the same, no need to renominate');

            setConfirmingState('success');

            return;
          }
        }

        const { block, failureText, fee, status, txHash } = await nominate(chain, staker.address, signer, selectedValidatorsAccountId);

        history.push({
          action: 'nominate',
          amount: '',
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      if (localState === 'unstake' && surAmount > 0n) {
        if (surAmount === currentlyStaked) {
          /**  if unstaking all, should chill first */
          const { failureText, fee, status, txHash } = await chill(chain, staker.address, signer);

          history.push({
            action: 'chill',
            amount: '',
            date: Date.now(),
            fee: fee || '',
            from: staker.address,
            hash: txHash || '',
            status: failureText || status,
            to: ''
          });

          if (state === 'failed') {
            console.log('chilling failed:', failureText);
            setConfirmingState(status);

            // eslint-disable-next-line no-void
            void saveHistory(chain, hierarchy, staker.address, history);

            return;
          }
        }

        const { block, failureText, fee, status, txHash } = await unbond(chain, staker.address, signer, surAmount);

        history.push({
          action: 'unbond',
          amount: amountToHuman(String(surAmount), chainInfo?.decimals),
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        console.log('unbond:', status);
        setConfirmingState(status);
      }

      if (localState === 'withdrawUnbound' && surAmount > 0n) {
        const optSpans = await chainInfo?.api.query.staking.slashingSpans(staker.address);
        const spanCount = optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1;

        const { block, failureText, fee, status, txHash } = await broadcast(chainInfo.api, redeem, [spanCount || 0], signer);

        history.push({
          action: 'redeem',
          amount: amountToHuman(String(surAmount), chainInfo?.decimals),
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        console.log('withdrawUnbound:', status);
        setConfirmingState(status);
      }

      if (localState === 'stopNominating') {
        const { block, failureText, fee, status, txHash } = await broadcast(chainInfo.api, chilled, [], signer);

        history.push({
          action: 'stop_nominating',
          block: block,
          date: Date.now(),
          fee: fee || '',
          from: staker.address,
          hash: txHash || '',
          status: failureText || status,
          to: ''
        });

        setConfirmingState(status);
      }

      // eslint-disable-next-line no-void
      void saveHistory(chain, hierarchy, staker.address, history);
    } catch (e) {
      console.log('error:', e);
      setPasswordStatus(PASS_MAP.INCORRECT);
      setState(localState);
      setConfirmingState('');
    }
  };

  const handleReject = useCallback((): void => {
    setState('');
    setConfirmingState('');
    if (setSelectValidatorsModalOpen) setSelectValidatorsModalOpen(false);

    handleCloseModal();
    if (handleEasyStakingModalClose) handleEasyStakingModalClose();
  }, [handleCloseModal, handleEasyStakingModalClose, setSelectValidatorsModalOpen, setState]);

  const writeAppropiateMessage = useCallback((state: string, note: string): React.ReactNode => {
    switch (state) {
      case ('unstake'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Note: The unstaked amount will be redeemable after {{days}} days ', { replace: { days: stakingConsts?.bondingDuration } })}
        </Typography>;
      case ('withdrawUnbound'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Available balance after redeem will be')}<br />
          {estimatedFee
            ? amountToHuman(String(BigInt(surAmount + availableBalance) - BigInt(String(estimatedFee))), chainInfo?.decimals)
            : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
          }
          {' '} {chainInfo?.coin}
        </Typography>;
      case ('stopNominating'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Declaring no desire to nominate validators')}
        </Typography>;
      default:
        return <Typography sx={{ m: '30px 0px 30px' }} variant='h6'>
          {note}
        </Typography>;
    }
  }, [surAmount, chainInfo?.coin, chainInfo?.decimals, estimatedFee, availableBalance, stakingConsts?.bondingDuration, t]);

  const handleAutoAdjust = useCallback((): void => {
    const ED = stakingConsts?.existentialDeposit;

    if (!ED) { return; }

    const fee = BigInt(String(estimatedFee));
    const adjustedAmount = availableBalance - (ED + fee);

    setSurAmount(adjustedAmount);
    setAmountNeedsAdjust(false);
  }, [estimatedFee, availableBalance, stakingConsts?.existentialDeposit]);

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmStakingModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={'Confirm'} />

      <Grid alignItems='center' container>
        <Grid container item sx={{ backgroundColor: '#f7f7f7', p: '25px 40px 10px' }} xs={12}>

          <Grid item sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, justifyContent: 'flex-start', p: '5px 10px 5px', textAlign: 'center', fontVariant: 'small-caps' }}>
            {stateInHuman(confirmingState || state)}
          </Grid>
          <Grid container data-testid='amount' item justifyContent='center' spacing={1} sx={{ fontFamily: 'fantasy', fontSize: 20, height: '25px', textAlign: 'center' }} xs={12}>
            <Grid item>
              {!!surAmount && amountToHuman(surAmount.toString(), chainInfo?.decimals)}
            </Grid>
            <Grid item>
              {!!surAmount && chainInfo?.coin}
            </Grid>
          </Grid>

          <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 11, paddingTop: '10px', textAlign: 'center' }} xs={12} >
            <Grid container item justifyContent='flex-start' sx={{ textAlign: 'left' }} xs={5}>
              <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                {t('Currently staked')}
              </Grid>
              <Grid item xs={12}>
                {!ledger
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {currentlyStaked ? amountToHuman(currentlyStaked.toString(), chainInfo?.decimals) : '0.00'}
                  </>
                }{' '}{chainInfo?.coin}
              </Grid>
            </Grid>

            <Grid container item justifyContent='center' xs={2}>
              <Grid item sx={{ color: grey[500], fontWeight: '600' }} xs={12}>
                {t('Fee')}
              </Grid>
              <Grid item xs={12}>
                {!estimatedFee
                  ? <span><Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '30px' }} /></span>
                  : <>
                    {amountToHuman(estimatedFee.toString(), chainInfo?.decimals)}
                  </>
                }  {' '}{chainInfo?.coin}
              </Grid>
            </Grid>

            <Grid container item justifyContent='flex-end' sx={{ textAlign: 'right' }} xs={5}>
              <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                {t('Total staked')}
              </Grid>
              <Grid item xs={12}>
                {!ledger
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {totalStakedInHuman !== '0' ? totalStakedInHuman : '0.00'}
                  </>
                }{' '}{chainInfo?.coin}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {stakingConsts && !(STATES_NEEDS_MESSAGE.includes(state) || note)
          ? <>
            <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '5px 50px 5px', textAlign: 'center' }} xs={12}>
              {t('VALIDATORS')}{` (${validatorsToList?.length})`}
            </Grid>
            <Grid item sx={{ fontSize: 14, height: '185px', p: '0px 20px 0px' }} xs={12}>
              <ValidatorsList
                chain={chain}
                chainInfo={chainInfo}
                height={180}
                stakingConsts={stakingConsts}
                validatorsIdentities={validatorsIdentities}
                validatorsInfo={validatorsToList}
              />
            </Grid>
          </>
          : <Grid item sx={{ height: '120px', m: '50px 30px 50px', textAlign: 'center' }} xs={12}>
            {writeAppropiateMessage(state, note)}
          </Grid>
        }
      </Grid>

      <Grid container item sx={{ p: '25px 25px' }} xs={12}>
        <Password
          autofocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
          handleIt={handleConfirm}
          isDisabled={!ledger}
          password={password}
          passwordStatus={passwordStatus}
          setPassword={setPassword}
          setPasswordStatus={setPasswordStatus}
        />
        <Grid alignItems='center' container item xs={12}>

          <Grid container item xs={amountNeedsAdjust ? 11 : 12}>
            <ConfirmButton
              handleBack={handleBack}
              handleConfirm={handleConfirm}
              handleReject={handleReject}
              isDisabled={!ledger || confirmButtonDisabled || !estimatedFee}
              state={confirmingState}
              text={confirmButtonText}
            />
          </Grid>

          {amountNeedsAdjust &&
            <Grid item sx={{ textAlign: 'left' }} xs={1}>
              <Hint id='adjustAmount' place='left' tip={t('Auto adjust the staking amount')}>
                <IconButton aria-label='Adjust' color='warning' onClick={handleAutoAdjust} size='medium'>
                  <BuildCircleRoundedIcon sx={{ fontSize: 40 }} />
                </IconButton>
              </Hint>
            </Grid>
          }
        </Grid>
      </Grid>
    </Popup>
  );
}
