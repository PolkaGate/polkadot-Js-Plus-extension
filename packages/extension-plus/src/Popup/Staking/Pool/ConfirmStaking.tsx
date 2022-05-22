// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here users confirm their staking related orders (e.g., stake, unstake, redeem, etc.)
 * */
import type { Chain } from '@polkadot/extension-chains/types';
import type { StakingLedger } from '@polkadot/types/interfaces';
import type { Balance } from '@polkadot/types/interfaces';
import type { FrameSystemAccountInfo, PalletNominationPoolsBondedPoolInner, PalletNominationPoolsPoolMember, PalletNominationPoolsRewardPool, PalletStakingNominations } from '@polkadot/types/lookup';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, StakingConsts, TransactionDetail } from '../../../util/plusTypes';

import { BuildCircleRounded as BuildCircleRoundedIcon, ConfirmationNumberOutlined as ConfirmationNumberOutlinedIcon } from '@mui/icons-material';
import { Avatar, Grid, IconButton, Link, Skeleton, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import keyring from '@polkadot/ui-keyring';
import { BN, BN_ZERO } from '@polkadot/util';

import { AccountContext } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Hint, Password, PlusHeader, Popup, ShortAddress } from '../../../components';
import broadcast from '../../../util/api/broadcast';
import { createPool, poolJoinOrBondExtra } from '../../../util/api/staking';
import { PASS_MAP, STATES_NEEDS_MESSAGE } from '../../../util/constants';
import getLogo from '../../../util/getLogo';
import { amountToHuman, getSubstrateAddress, getTransactionHistoryFromLocalStorage, isEqual, prepareMetaData } from '../../../util/plusUtils';
import ValidatorsList from '../Solo/ValidatorsList';
import Pool from './Pool';

interface Props {
  amount: BN;
  api: ApiPromise;
  chain: Chain;
  handlePoolStakingModalClose?: () => void;
  pool: MyPoolInfo; // FIXME check the type
  state: string;
  selectedValidators: DeriveStakingQuery[] | null;
  setState: React.Dispatch<React.SetStateAction<string>>;
  staker: AccountsBalanceType;
  showConfirmStakingModal: boolean;
  setConfirmStakingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectValidatorsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts | undefined;
  nextPoolId?: BN;
  nominatedValidators: DeriveStakingQuery[] | null;
  validatorsIdentities: DeriveAccountInfo[] | null;
  poolsMembers: MembersMapEntry[] | undefined;
  setNewPool?: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>
}

export default function ConfirmStaking({ amount, api, chain, handlePoolStakingModalClose, setNewPool, nominatedValidators, pool, poolsMembers, selectedValidators, setConfirmStakingModalOpen, setSelectValidatorsModalOpen, setState, showConfirmStakingModal, staker, stakingConsts, state, validatorsIdentities }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const [confirmingState, setConfirmingState] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<number>(PASS_MAP.EMPTY);
  const [currentlyStaked, setCurrentlyStaked] = useState<BN | undefined>();
  const [totalStakedInHuman, setTotalStakedInHuman] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState<boolean>(false);
  const [confirmButtonText, setConfirmButtonText] = useState<string>(t('Confirm'));
  const [amountNeedsAdjust, setAmountNeedsAdjust] = useState<boolean>(false);
  const [surAmount, setSurAmount] = useState<BN>(amount); /** SUR: Staking Unstaking Redeem (and Claim) amount  */
  const [note, setNote] = useState<string>('');
  const [availableBalance, setAvailableBalance] = useState<BN>(BN_ZERO);

  const decimals = api.registry.chainDecimals[0];
  const token = api.registry.chainTokens[0];
  const existentialDeposit = useMemo(() => new BN(String(api.consts.balances.existentialDeposit)), [api]);
  const poolId = pool?.poolId ?? pool?.member?.poolId; // it is a new selectedPool ( pool?.poolId) or an already joined pool (pool?.member?.poolId)

  const nominatedValidatorsId = useMemo(() => nominatedValidators ? nominatedValidators.map((v) => String(v.accountId)) : [], [nominatedValidators]);
  const selectedValidatorsAccountId = useMemo(() => selectedValidators ? selectedValidators.map((v) => String(v.accountId)) : [], [selectedValidators]);
  const validatorsToList = ['changeValidators', 'setNominees'].includes(state) ? selectedValidators : nominatedValidators;

  /** list of available trasaction types */
  // const chilled = api.tx.staking.chill;
  const joined = api.tx.nominationPools.join; // (amount, poolId)
  const unbonded = api.tx.nominationPools.unbond;
  const nominated = api.tx.nominationPools.nominate;
  const bondExtra = api.tx.nominationPools.bondExtra;
  const bond = api.tx.nominationPools.bond;
  const redeem = api.tx.nominationPools.withdrawUnbonded;
  const claim = api.tx.nominationPools.claimPayout;
  const bonding = currentlyStaked ? bondExtra : bond;

  async function saveHistory(chain: Chain, hierarchy: AccountWithChildren[], address: string, history: TransactionDetail[]): Promise<boolean> {
    if (!history.length) return false;

    const accountSubstrateAddress = getSubstrateAddress(address);
    const savedHistory: TransactionDetail[] = getTransactionHistoryFromLocalStorage(chain, hierarchy, accountSubstrateAddress);

    savedHistory.push(...history);

    return updateMeta(accountSubstrateAddress, prepareMetaData(chain, 'history', savedHistory));
  }

  useEffect(() => {
    if (staker?.balanceInfo?.available) { setAvailableBalance(new BN(String(staker.balanceInfo.available))); }
  }, [staker?.balanceInfo?.available]);

  useEffect(() => {
    if (['confirming', 'success', 'failed'].includes(confirmingState)) {
      // do not run following code while are in these states
      return;
    }

    /** check if re-nomination is needed */
    if (['changeValidators'].includes(state)) {
      if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
        if (state === 'changeValidators') {
          setConfirmButtonDisabled(true);
        }

        setNote(t('The selected and previously nominated validators are the same, no need to renominate'));
      }
      // else {
      //   setConfirmButtonDisabled(false);
      //   setNote('');
      // }
    }
  }, [selectedValidatorsAccountId, state, nominatedValidatorsId, t, confirmingState]);

  useEffect(() => {
    if (['confirming', 'success', 'failed'].includes(confirmingState) || !api || currentlyStaked === undefined) {
      return;
    }

    /** defaults for many states */
    setTotalStakedInHuman(amountToHuman(String(currentlyStaked), decimals));

    /** set fees and stakeAmount */
    let params;

    switch (state) {
      case ('bondExtra'): // TODO: reBond
        // eslint-disable-next-line no-void
        void bondExtra({ FreeBalance: surAmount }).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));

        setTotalStakedInHuman(amountToHuman((currentlyStaked.add(surAmount)).toString(), decimals));

        break;
      case ('joinPool'):
        params = [surAmount, poolId];
        // eslint-disable-next-line no-void
        void joined(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));

        setTotalStakedInHuman(amountToHuman((currentlyStaked.add(surAmount)).toString(), decimals));

        break;
      case ('createPool'):

        // eslint-disable-next-line no-void
        api && api.tx.nominationPools.create(surAmount, ...Object.values(pool.bondedPool.roles).slice(1)).paymentInfo(staker.address).then((i) => {
          const createFee = i?.partialFee;

          api.tx.nominationPools.setMetadata(pool.poolId, pool.metadata).paymentInfo(staker.address)
            .then((i) => setEstimatedFee(api.createType('Balance', createFee.add(i?.partialFee))))
            .catch(console.error);
        });

        setTotalStakedInHuman(amountToHuman((currentlyStaked.add(surAmount)).toString(), decimals));
        break;
      case ('unstake'):
        params = [staker?.address, surAmount];

        // eslint-disable-next-line no-void
        void unbonded(...params).paymentInfo(staker.address).then((i) => {
          const fee = i?.partialFee;

          // if (surAmount === currentlyStaked) {
          //   // eslint-disable-next-line no-void
          //   void chilled().paymentInfo(staker.address).then((j) => setEstimatedFee(api.createType('Balance', fee.add(j?.partialFee))));
          // } else { 
          setEstimatedFee(fee);
          // }
        });
        setTotalStakedInHuman(amountToHuman((currentlyStaked.sub(surAmount)).toString(), decimals));
        break;
      // case ('stopNominating'):
      //   // eslint-disable-next-line no-void
      //   void chilled().paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
      //   break;
      case ('changeValidators'):
      case ('setNominees'):
        params = [poolId, selectedValidatorsAccountId];

        // eslint-disable-next-line no-void
        void nominated(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('withdrawUnbound'):
        params = [staker.address, 100]; /** 100 is a dummy number */

        // eslint-disable-next-line no-void
        void redeem(...params).paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      case ('withdrawClaimable'):
        // eslint-disable-next-line no-void
        void claim().paymentInfo(staker.address).then((i) => setEstimatedFee(i?.partialFee));
        break;
      default:
    }

    // return () => {
    //   setEstimatedFee(undefined);
    // };
  }, [surAmount, currentlyStaked, api, state, confirmingState, staker.address, bonding, bondExtra, unbonded, selectedValidatorsAccountId, nominatedValidatorsId, nominated, redeem, decimals, pool, joined, poolId, claim]);

  useEffect(() => {
    if (!estimatedFee || estimatedFee?.isEmpty || !availableBalance || !existentialDeposit) { return; }

    if (['confirming', 'success', 'failed'].includes(confirmingState)) {
      // do not run following code while confirming
      return;
    }

    let partialSubtrahend = surAmount;

    if (['withdrawUnbound', 'unstake', 'withdrawClaimable'].includes(state)) { partialSubtrahend = BN_ZERO; }

    const fee = new BN(estimatedFee.toString());

    if (availableBalance.sub((partialSubtrahend.add(fee))).lt(existentialDeposit)) {
      setConfirmButtonDisabled(true);
      setConfirmButtonText(t('Account reap issue, consider fee!'));

      if (['joinPool', 'createPool', 'bondExtra'].includes(state)) {
        setAmountNeedsAdjust(true);
      }
    } else {
      // setConfirmButtonDisabled(false);
      setConfirmButtonText(t('Confirm'));
    }
  }, [surAmount, estimatedFee, availableBalance, existentialDeposit, state, t, confirmingState]);

  useEffect(() => {
    setCurrentlyStaked(pool?.member?.points ? new BN(pool?.member?.points) : BN_ZERO);
  }, [pool]);

  const handleCloseModal = useCallback((): void => {
    setConfirmStakingModalOpen(false);
  }, [setConfirmStakingModalOpen]);

  const handleBack = useCallback((): void => {
    if (!['createPool', 'joinPool', 'bondExtra', 'changeValidators', 'setNominees'].includes(state)) {
      setState('');
      setConfirmingState('');
    }

    handleCloseModal();
  }, [handleCloseModal, setState, state]);

  const stateInHuman = (state: string): string => {
    switch (state) {
      case ('joinPool'):
        return 'JOIN POOL';
      case ('bondExtra'):
        return 'STAKING OF';
      case ('createPool'):
        return 'CREATE POOL';
      case ('changeValidators'):
      case ('setNominees'):
        return 'NOMINATING';
      case ('unstake'):
        return 'UNSTAKING';
      case ('withdrawUnbound'):
        return 'REDEEM';
      case ('withdrawClaimable'):
        return 'CLAIM';
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

      if (['joinPool'].includes(localState) && surAmount !== BN_ZERO) {
        const params = [surAmount, poolId];
        const { block, failureText, fee, status, txHash } = await broadcast(api, joined, params, signer, staker.address);

        history.push({
          action: 'pool_join',
          amount: amountToHuman(String(surAmount), decimals),
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

      if (['bondExtra'].includes(localState) && surAmount !== BN_ZERO) {
        const params = [{ FreeBalance: surAmount }];
        const { block, failureText, fee, status, txHash } = await broadcast(api, bondExtra, params, signer, staker.address);

        history.push({
          action: 'pool_bond_extra',
          amount: amountToHuman(String(surAmount), decimals),
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

      if (['createPool'].includes(localState) && surAmount !== BN_ZERO) {
        const { block, failureText, fee, status, txHash } = await createPool(api, staker.address, signer, surAmount, poolId, pool.bondedPool.roles, pool.metadata);

        history.push({
          action: 'pool_create',
          amount: amountToHuman(String(surAmount), decimals),
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

      // if (['changeValidators', 'joinPool', 'createPool', 'setNominees'].includes(localState)) {
      if (['changeValidators', 'setNominees'].includes(localState) && poolId) {
        // if (localState === 'joinPool') {
        //   if (!selectedValidators) { // TODO: does it realy happen!
        //     console.log('! there is no selectedValidators to bond at StakeAuto, so might do bondExtera');

        //     if (hasAlreadyBonded) {
        //       setConfirmingState('success');
        //     } else {
        //       setConfirmingState('failed');
        //     }

        //     return;
        //   }

        //   if (isEqual(selectedValidatorsAccountId, nominatedValidatorsId)) {
        //     console.log('selected and previously nominated validators are the same, no need to renominate');

        //     setConfirmingState('success');

        //     return;
        //   }
        // }

        const { block, failureText, fee, status, txHash } = await broadcast(api, nominated, [poolId, selectedValidatorsAccountId], signer, staker.address);

        history.push({
          action: 'pool_nominate',
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

      if (localState === 'unstake' && surAmount.gt(BN_ZERO)) {
        // if (surAmount === currentlyStaked) {
        //   /**  if unstaking all, should chill first */
        //   const { failureText, fee, status, txHash } = await broadcast(api, chilled, [], signer, staker.address);

        //   history.push({
        //     action: 'chill',
        //     amount: '',
        //     date: Date.now(),
        //     fee: fee || '',
        //     from: staker.address,
        //     hash: txHash || '',
        //     status: failureText || status,
        //     to: ''
        //   });

        //   if (state === 'failed') {
        //     console.log('chilling failed:', failureText);
        //     setConfirmingState(status);

        //     // eslint-disable-next-line no-void
        //     void saveHistory(chain, hierarchy, staker.address, history);

        //     return;
        //   }
        // }
        const params = [staker?.address, surAmount];
        const { block, failureText, fee, status, txHash } = await broadcast(api, unbonded, params, signer, staker.address);

        history.push({
          action: 'pool_unbond',
          amount: amountToHuman(String(surAmount), decimals),
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

      if (localState === 'withdrawUnbound' && surAmount.gt(BN_ZERO)) {
        const optSpans = await api.query.staking.slashingSpans(staker.address);
        const spanCount = optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1;
        const params = [staker.address, spanCount];

        const { block, failureText, fee, status, txHash } = await broadcast(api, redeem, params, signer, staker.address);

        history.push({
          action: 'pool_redeem',
          amount: amountToHuman(String(surAmount), decimals),
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

      if (localState === 'withdrawClaimable' && surAmount.gt(BN_ZERO)) {
        const { block, failureText, fee, status, txHash } = await broadcast(api, claim, [], signer, staker.address);

        history.push({
          action: 'pool_claim',
          amount: amountToHuman(String(surAmount), decimals),
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

      // if (localState === 'stopNominating') {
      //   const { block, failureText, fee, status, txHash } = await broadcast(api, chilled, [], signer, staker.address);

      //   history.push({
      //     action: 'stop_nominating',
      //     block: block,
      //     date: Date.now(),
      //     fee: fee || '',
      //     from: staker.address,
      //     hash: txHash || '',
      //     status: failureText || status,
      //     to: ''
      //   });

      //   setConfirmingState(status);
      // }


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
    if (handlePoolStakingModalClose) handlePoolStakingModalClose();
  }, [handleCloseModal, handlePoolStakingModalClose, setSelectValidatorsModalOpen, setState]);

  const writeAppropiateMessage = useCallback((state: string, note: string): React.ReactNode => {
    switch (state) {
      case ('unstake'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Note: The unstaked amount will be redeemable after {{days}} days ', { replace: { days: stakingConsts?.unbondingDuration } })}
        </Typography>;
      case ('withdrawUnbound'):
        return <Typography sx={{ mt: '50px' }} variant='h6'>
          {t('Available balance after redeem will be')}<br />
          {estimatedFee
            ? amountToHuman(String(surAmount.add(availableBalance).sub(new BN(String(estimatedFee)))), decimals)
            : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
          }
          {' '} {token}
        </Typography>;
      case ('stopNominating'):
        return <Typography sx={{ mt: '30px' }} variant='h6'>
          {t('Declaring no desire to nominate validators')}
        </Typography>;
      default:
        return <Typography sx={{ m: '30px 0px 30px' }} variant='h6'>
          {note}
        </Typography>;
    }
    // Note: availableBalance change should not change the alert in redeem confirm page!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surAmount, token, decimals, estimatedFee, stakingConsts?.unbondingDuration, t]);

  const handleAutoAdjust = useCallback((): void => {
    if (!existentialDeposit) { return; }

    const fee = new BN(String(estimatedFee));
    const adjustedAmount = availableBalance.sub(existentialDeposit.add(fee));

    setSurAmount(adjustedAmount);
    setAmountNeedsAdjust(false);
    setConfirmButtonDisabled(false);

    if (pool.bondedPool.state === 'Creating') {
      const modifiedPool = pool;

      modifiedPool.bondedPool.points = adjustedAmount;
      setNewPool(modifiedPool);
    }
  }, [existentialDeposit, estimatedFee, availableBalance]);

  return (
    <Popup handleClose={handleCloseModal} showModal={showConfirmStakingModal}>
      <PlusHeader action={handleReject} chain={chain} closeText={'Reject'} icon={<ConfirmationNumberOutlinedIcon fontSize='small' />} title={'Confirm'} />

      <Grid alignItems='center' container>
        <Grid container item sx={{ backgroundColor: '#f7f7f7', p: '25px 40px 10px' }} xs={12}>

          <Grid item sx={{ border: '2px double grey', borderRadius: '5px', fontSize: 15, justifyContent: 'flex-start', p: '5px 10px', textAlign: 'center', fontVariant: 'small-caps' }}>
            {stateInHuman(confirmingState || state)}
          </Grid>
          <Grid container data-testid='amount' item justifyContent='center' spacing={1} sx={{ fontFamily: 'fantasy', fontSize: 20, height: '25px', textAlign: 'center' }} xs={12}>
            <Grid item>
              {!surAmount?.isZero() && amountToHuman(surAmount.toString(), decimals)}
            </Grid>
            <Grid item>
              {!surAmount?.isZero() && token}
            </Grid>
          </Grid>

          <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 11, paddingTop: '15px', textAlign: 'center' }} xs={12}>
            <Grid container item justifyContent='flex-start' sx={{ textAlign: 'left' }} xs={4}>
              <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                {t('Currently staked')}
              </Grid>
              <Grid item xs={12}>
                {!pool
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {currentlyStaked !== undefined ? amountToHuman(currentlyStaked.toString(), decimals) : '0.00'}
                  </>
                }{' '}{token}
              </Grid>
            </Grid>

            <Grid container item justifyContent='center' xs={4}>
              <Grid item sx={{ color: grey[500], fontWeight: '600' }} xs={12}>
                {t('Fee')}
              </Grid>
              <Grid item xs={12}>
                {!estimatedFee
                  ? <span><Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '30px' }} /></span>
                  : <>
                    {estimatedFee?.toHuman()}
                  </>
                }
              </Grid>
            </Grid>

            <Grid container item justifyContent='flex-end' sx={{ textAlign: 'right' }} xs={4}>
              <Grid item sx={{ color: grey[600], fontWeight: '600' }} xs={12}>
                {t('Total staked')}
              </Grid>
              <Grid item xs={12}>
                {!pool
                  ? <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '60px' }} />
                  : <>
                    {totalStakedInHuman !== '0' ? totalStakedInHuman : '0.00'}
                  </>
                }{' '}{token}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        {stakingConsts && !(STATES_NEEDS_MESSAGE.includes(state) || note)
          ? <>
            {pool && !['changeValidators', 'setNominees'].includes(state)
              ? <>
                <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '5px 50px 5px', textAlign: 'center' }} xs={12}>
                  {t('Pool')}
                </Grid>
                <Grid item sx={{ fontSize: 14, height: '185px', p: '0px 20px 0px' }} xs={12}>
                  <Pool
                    api={api}
                    chain={chain}
                    pool={pool}
                    poolsMembers={poolsMembers}
                  />
                  {state === 'createPool' &&
                    <Grid item sx={{ m: '40px 30px', textAlign: 'center' }} xs={12}>
                      {t('{{ED}} will be bonded in Reward Id, and returned back when unbound all.', { replace: { ED: api.createType('Balance', existentialDeposit).toHuman() } })}
                    </Grid>
                  }
                </Grid>
              </>
              : <>
                <Grid item sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 16, p: '5px 50px 5px', textAlign: 'center' }} xs={12}>
                  {t('VALIDATORS')}{` (${validatorsToList?.length})`}
                </Grid>
                <Grid item sx={{ fontSize: 14, height: '185px', p: '0px 20px 0px' }} xs={12}>
                  <ValidatorsList
                    api={api}
                    chain={chain}
                    height={180}
                    stakingConsts={stakingConsts}
                    validatorsIdentities={validatorsIdentities}
                    validatorsInfo={validatorsToList}
                  />
                </Grid>
              </>
            }
          </>
          : <Grid item sx={{ height: '115px', m: '50px 30px 50px', textAlign: 'center' }} xs={12}>
            {writeAppropiateMessage(state, note)}
          </Grid>
        }
      </Grid>

      <Grid container item sx={{ p: '25px 25px' }} xs={12}>
        <Password
          autofocus={!['confirming', 'failed', 'success'].includes(confirmingState)}
          handleIt={handleConfirm}
          isDisabled={!stakingConsts || confirmButtonDisabled || !estimatedFee}
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
              isDisabled={!stakingConsts || confirmButtonDisabled || !estimatedFee || !availableBalance || !api}
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
