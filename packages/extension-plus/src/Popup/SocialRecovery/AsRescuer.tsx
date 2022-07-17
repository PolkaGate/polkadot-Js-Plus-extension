// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable simple-import-sort/imports */

/**
 * @description
 * this component opens rescuer page, where a rescuer can initiate, claim, and finally close a recovery
 * */

import type { DeriveAccountInfo, DeriveBalancesAll } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';
import type { StakingLedger } from '@polkadot/types/interfaces';
import { BN, BN_ZERO } from '@polkadot/util';

import { Support as SupportIcon } from '@mui/icons-material';
import { Typography, Grid, Stepper, Step, StepButton } from '@mui/material';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress, ShowBalance2, ShowValue } from '../../components';
import type { ApiPromise } from '@polkadot/api';
import type { PalletRecoveryRecoveryConfig, PalletRecoveryActiveRecovery } from '@polkadot/types/lookup';

import { AddressState, nameAddress, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import { Button } from '@polkadot/extension-ui/components';
import Confirm from './Confirm';
import AddNewAccount from './AddNewAccount';
import { remainingTime } from '../../util/plusUtils';
import { encodeAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  className?: string;
  handleCloseAsRescuer: () => void
  showAsRescuerModal: boolean;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
}

const steps = ['Initiate', 'Claim', 'Withdraw'];
const STEP_MAP = { INIT: 0, CLAIM: 1, WITHDRAW: 2 };

function AsRescuer({ account, accountsInfo, addresesOnThisChain, api, handleCloseAsRescuer, recoveryConsts, showAsRescuerModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);
  const [lostAccount, setLostAccount] = useState<DeriveAccountInfo | undefined>();
  const [lostAccountHelperText, setLostAccountHelperText] = useState<string | undefined>();
  const [lostAccountRecoveryInfo, setLostAccountRecoveryInfo] = useState<PalletRecoveryRecoveryConfig | undefined | null>();
  const [lostAccountBalance, setLostAccountBalance] = useState<DeriveBalancesAll | undefined>();
  const [lostAccountLedger, setLostAccountLedger] = useState<StakingLedger | undefined | null>();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [hasActiveRecoveries, setHasActiveRecoveries] = useState<PalletRecoveryActiveRecovery | undefined | null>();
  const [isProxy, setIsProxy] = useState<boolean | undefined>();
  const [remainingBlocksToClaim, setRemainingBlocksToClaim] = useState<number | undefined>();
  const [friendsAccountsInfo, setfriendsAccountsInfo] = useState<DeriveAccountInfo[] | undefined>();
  const [asRecovered, setAsRecovered] = React.useState<boolean>(false);
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{
    [k: number]: boolean;
  }>({});
  const [currentEraIndex, setCurrentEraIndex] = useState<number | undefined>();
  const [redeemable, setRedeemable] = useState<BN | undefined>();
  const [unlocking, setUnlocking] = useState<BN | undefined>();
  const [spanCount, setSpanCount] = useState<number | undefined>();
  const [nextIsDisabled, setNextIsDisabled] = useState<boolean>(true);
  const [otherPossibleRescuers, setOtherPossibleRescuers] = useState<Rescuer[] | undefined>();

  const otherPossibleRescuersDeposit = useMemo((): BN | undefined => {
    if (!otherPossibleRescuers?.length) {
      return;
    }

    let d = BN_ZERO;

    for (let i = 0; i < otherPossibleRescuers.length; i++) {
      d = d.add(otherPossibleRescuers[i]?.option?.deposit ?? BN_ZERO);
    }

    return (d);
  }, [otherPossibleRescuers]);

  const totalWithdrawable = useMemo((): BN => {
    return (lostAccountBalance?.availableBalance ?? BN_ZERO).add(redeemable ?? BN_ZERO).add(lostAccountRecoveryInfo?.deposit ?? BN_ZERO).add(otherPossibleRescuersDeposit ?? BN_ZERO);
  }, [lostAccountBalance, redeemable, lostAccountRecoveryInfo, otherPossibleRescuersDeposit]);

  const resetPage = useCallback(() => {
    console.log('resetPage ...');
    setState(undefined);
    setRemainingBlocksToClaim(undefined);
    setActiveStep(0);
    setCompleted({});
    setLostAccountHelperText(undefined);
    setIsProxy(undefined);
    setLostAccountRecoveryInfo(undefined);
    setAsRecovered(false);
    setLostAccountBalance(undefined);
  }, []);

  const handleNext = useCallback(() => {
    !state && setState('initiateRecovery');
    setConfirmModalOpen(true);
  }, [state]);

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  useEffect((): void => {
    if (activeStep === STEP_MAP.WITHDRAW && lostAccountBalance && lostAccountBalance.freeBalance.add(lostAccountBalance.reservedBalance).sub(lostAccountBalance.lockedBalance).lten(0)) {
      return setNextIsDisabled(true);
    }

    if (isProxy === true) {
      return setNextIsDisabled(false);
    }

    if (!lostAccount || !lostAccountRecoveryInfo || (remainingBlocksToClaim && remainingBlocksToClaim > 0)) {
      return setNextIsDisabled(true);
    }

    setNextIsDisabled(false);
  }, [activeStep, isProxy, lostAccount, lostAccountBalance, lostAccountRecoveryInfo, remainingBlocksToClaim]);

  useEffect((): void => {
    api && hasActiveRecoveries && lostAccountRecoveryInfo && api.rpc.chain.getHeader().then((h) => {
      const currentBlockNumber = h.number.toNumber();
      const initiateRecoveryBlock = hasActiveRecoveries.created.toNumber();
      const delayPeriod = lostAccountRecoveryInfo.delayPeriod.toNumber();

      setRemainingBlocksToClaim(initiateRecoveryBlock + delayPeriod - currentBlockNumber);
    });
  }, [api, hasActiveRecoveries, lostAccountRecoveryInfo]);

  useEffect((): void => {
    if (isProxy) {
      // if (hasActiveRecoveries) {
      const newCompleted = completed;

      completed[STEP_MAP.INIT] = true;
      completed[STEP_MAP.CLAIM] = true;
      setCompleted(newCompleted);
      setActiveStep(STEP_MAP.WITHDRAW);
      // } 
      // else {
      //   const newCompleted = completed;

      //   completed[STEP_MAP.INIT] = true;
      //   completed[STEP_MAP.CLAIM] = true;
      //   setCompleted(newCompleted);
      //   setActiveStep(3);
      // }
    } else if (remainingBlocksToClaim && remainingBlocksToClaim <= 0) {
      const newCompleted = completed;

      completed[STEP_MAP.INIT] = true;
      setCompleted(newCompleted);
      setActiveStep(STEP_MAP.CLAIM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProxy, remainingBlocksToClaim]);

  useEffect((): void => {
    if (activeStep === STEP_MAP.CLAIM) {
      return setState('claimRecovery');
    }

    if (activeStep === STEP_MAP.WITHDRAW) {
      return setState('withdrawAsRecovered');
    }
  }, [activeStep]);

  useEffect((): void => {
    // eslint-disable-next-line no-void
    api && void api.query.staking.currentEra().then((ce) => {
      setCurrentEraIndex(Number(ce));
    });
  }, [api]);

  useEffect((): void => {
    // get the lost account balances
    // eslint-disable-next-line no-void
    lostAccount?.accountId && isProxy && api && void api.derive.balances?.all(lostAccount.accountId).then((b) => {
      setLostAccountBalance(b);
      console.log('lost balances b', JSON.parse(JSON.stringify(b)));

      // eslint-disable-next-line no-void
      void api.query.staking.ledger(lostAccount.accountId).then((l) => {
        setLostAccountLedger(l.isSome ? l.unwrap() as unknown as StakingLedger : null);
        console.log('lost account ledger', JSON.parse(JSON.stringify(l)));
      });

      // eslint-disable-next-line no-void
      void api.query.recovery.activeRecoveries.entries().then((activeRecoveries) => {
        const otherPossibleRescuers = [];

        for (let i = 0; i < activeRecoveries.length; i++) {
          const [key, option] = activeRecoveries[i];

          if (encodeAddress('0x' + key.toString().slice(82, 146), chain?.ss58Format) === String(lostAccount.accountId)) { // if this is lostAccount Id
            const mightBeOtherRescuer = encodeAddress('0x' + key.toString().slice(162), chain?.ss58Format);

            if (mightBeOtherRescuer === account?.accountId?.toString()) { continue; } // to exclude me from the other possible rescuers list

            otherPossibleRescuers.push({
              accountId: encodeAddress('0x' + key.toString().slice(162), chain?.ss58Format),
              option: option.isSome ? option.unwrap() as unknown as PalletRecoveryActiveRecovery : undefined
            } as unknown as Rescuer);
          }
        }

        setOtherPossibleRescuers(otherPossibleRescuers);
        setAsRecovered(true);
      });
    });
  }, [account, isProxy, api, lostAccount, chain?.ss58Format]);

  useEffect((): void => {
    if (!lostAccountLedger || !currentEraIndex || !lostAccount?.accountId) {
      return;
    }

    let unlockingValue = BN_ZERO;
    let redeemValue = BN_ZERO;

    for (const item of lostAccountLedger.unlocking) {
      if (currentEraIndex > Number(item.era)) {
        redeemValue = redeemValue.add(item.value.unwrap());
      } else {
        unlockingValue = unlockingValue.add(item.value.unwrap());
      }
    }

    !redeemValue.isZero() && api && api.query.staking.slashingSpans(lostAccount.accountId).then((optSpans) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      setSpanCount(optSpans.isNone ? 0 : optSpans.unwrap().prior.length + 1);
    });

    setUnlocking(unlockingValue);
    setRedeemable(redeemValue);
  }, [api, currentEraIndex, lostAccount?.accountId, lostAccountLedger]);

  useEffect(() => {
    if (api && lostAccountRecoveryInfo?.friends) {
      Promise.all(
        lostAccountRecoveryInfo.friends.map((f) => api.derive.accounts.info(f))
      ).then((info) => setfriendsAccountsInfo(info))
        .catch(console.error);
    }
  }, [lostAccountRecoveryInfo, api]);

  useEffect(() => {
    if (!api || !lostAccount) {
      return;
    }

    // eslint-disable-next-line no-void
    void api.query.recovery.recoverable(lostAccount.accountId).then((r) => {
      setLostAccountRecoveryInfo(r.isSome ? r.unwrap() as unknown as PalletRecoveryRecoveryConfig : null);
      console.log('is lost account recoverable:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'null');
    });
  }, [api, lostAccount]);

  useEffect(() => {
    if (lostAccount === undefined) {
      resetPage();
    }
  }, [lostAccount, resetPage]);

  useEffect(() => {
    if (!api || !account?.accountId || !lostAccount || lostAccountRecoveryInfo === undefined) {
      return;
    }

    if (lostAccountRecoveryInfo === null) {
      setHasActiveRecoveries(null);
    } else {
      // eslint-disable-next-line no-void
      void api.query.recovery.activeRecoveries(lostAccount.accountId, account.accountId).then((r) => {
        setHasActiveRecoveries(r.isSome ? r.unwrap() as unknown as alletRecoveryActiveRecovery : null);
        console.log('hasActiveRecoveries:', r.isSome ? JSON.parse(JSON.stringify(r.unwrap())) : 'noch');
      });
    }

    // eslint-disable-next-line no-void
    void api.query.recovery.proxy(account.accountId).then((r) => {
      const proxy = r.isSome ? String(r.unwrap()) : null;

      setIsProxy(proxy === String(lostAccount.accountId));
      console.log(`is a proxy ${proxy === String(lostAccount.accountId)} proxy address:${r.isSome ? r.unwrap().toString() : ''}`);
    });
  }, [account?.accountId, api, chain?.ss58Format, lostAccount, lostAccountRecoveryInfo]);

  useEffect(() => {
    if (lostAccount) {
      if (lostAccountRecoveryInfo === undefined || hasActiveRecoveries === undefined || isProxy === undefined) {
        return;
      }

      if (lostAccountRecoveryInfo === null && isProxy === false) {
        return setLostAccountHelperText(t<string>('The account is not recoverable'));
      }

      if (hasActiveRecoveries) {
        if (isProxy) {
          return setLostAccountHelperText(t<string>('This account is a proxy of the lost account, proceed to close recovery'));
        }

        if (remainingBlocksToClaim === undefined) {
          return;
        }

        if (remainingBlocksToClaim > 0) {
          return setLostAccountHelperText(t<string>('Remaining time to claim recovery'));
        } else {
          return setLostAccountHelperText(t<string>('Recovery can be claimed if {{threshold}} friend verification(s) are received', { replace: { threshold: lostAccountRecoveryInfo?.threshold } }));
        }
      }

      if (isProxy) {
        return;// setLostAccountHelperText(t<string>('The account is already a proxy. The lost account balance can be withdrawn:'));
      }

      if (lostAccountRecoveryInfo) {
        return setLostAccountHelperText(t<string>('The account is recoverable, proceed to initiate recovery'));
      }

      return setLostAccountHelperText(t<string>('The account is NOT recoverable'));
    }
  }, [hasActiveRecoveries, isProxy, lostAccount, lostAccountRecoveryInfo, remainingBlocksToClaim, t]);

  return (
    <Popup handleClose={handleCloseAsRescuer} showModal={showAsRescuerModal}>
      <PlusHeader action={handleCloseAsRescuer} chain={chain} closeText={'Close'} icon={<SupportIcon fontSize='small' />} title={'Rescue account'} />
      <Grid container sx={{ p: '35px 30px' }}>
        <Grid item sx={{ borderBottom: 1, borderColor: 'divider', pb: '15px' }} xs={12}>
          <Stepper activeStep={activeStep} nonLinear>
            {steps.map((label, index) =>
              <Step completed={completed[index]} key={label}>
                <StepButton color='inherit' onClick={handleStep(index)}>
                  {label}
                </StepButton>
              </Step>
            )}
          </Stepper>
        </Grid>
        <Grid height='395px' item pt='55px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px 10px 15px' }} variant='subtitle2'>
            {t<string>('Enter a lost account address (or search by identity)')}:
          </Typography>
          <AddNewAccount account={lostAccount} accountsInfo={accountsInfo} addresesOnThisChain={addresesOnThisChain} chain={chain} label={t('Lost')} setAccount={setLostAccount} />
          {lostAccount && !asRecovered &&
            <> {lostAccountHelperText
              ? <Grid item pt='85px' textAlign='center'>
                <Typography sx={{ color: 'text.primary' }} variant='subtitle2'>
                  {lostAccountHelperText}
                </Typography>
              </Grid>
              : <Progress pt={1} title={t('Checking the account')} />
            }
            </>
          }
          {remainingBlocksToClaim && remainingBlocksToClaim > 0 &&
            <Grid fontSize={14} fontWeight={600} item pt='20px' textAlign='center'>
              {remainingTime(remainingBlocksToClaim)}
            </Grid>
          }
          {asRecovered && lostAccountBalance &&
            <Grid container item justifyContent='center' pt='35px' sx={{ fontSize: 12 }} textAlign='center'>
              <Typography sx={{ color: 'text.primary' }} variant='subtitle2'>
                {t('The lost account balance can be withdrawn:')}
              </Typography>
              <Grid container item justifyContent='space-between' p='15px 20px'>
                <Grid item>
                  <ShowBalance2 api={api} balance={lostAccountBalance.freeBalance.add(lostAccountBalance.reservedBalance)} title={t('Total')} />
                </Grid>
                <Grid item>
                  <ShowBalance2 api={api} balance={lostAccountBalance.availableBalance} title={t('Available')} />
                </Grid>
                <Grid item>
                  <ShowBalance2 api={api} balance={lostAccountBalance.reservedBalance} title={t('Reserved')} />
                </Grid>
              </Grid>
              {lostAccountLedger &&
                <Grid container item justifyContent='space-between' p='10px 20px'>
                  <Grid item>
                    <ShowBalance2 api={api} balance={lostAccountLedger.active.unwrap()} title={t('Staked')} />
                  </Grid>
                  <Grid item>
                    <ShowBalance2 api={api} balance={redeemable} title={t('Redeemable')} />
                  </Grid>
                  <Grid item>
                    <ShowBalance2 api={api} balance={unlocking} title={t('Unlocking')} />
                  </Grid>
                </Grid>
              }
              {!!otherPossibleRescuers?.length &&
                <Grid container item justifyContent='space-between' p='10px 20px'>
                  <Grid item>
                    <ShowValue direction='column' title={t('#Other rescuer(s)')} value={otherPossibleRescuers.length} />
                  </Grid>
                  <Grid item>
                    <ShowBalance2 api={api} balance={otherPossibleRescuersDeposit} title={t('Total deposited')} />
                  </Grid>
                </Grid>
              }
            </Grid>
          }
        </Grid>
        <Grid item pt='10px' xs={12}>
          <Button
            data-button-action=''
            isDisabled={nextIsDisabled}
            onClick={handleNext}
          >
            {t<string>('Next')}
          </Button>
        </Grid>
      </Grid>
      {showConfirmModal && api && chain && state && account && lostAccount && recoveryConsts &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          friends={friendsAccountsInfo}
          lostAccount={lostAccount}
          otherPossibleRescuers={otherPossibleRescuers}
          otherPossibleRescuersDeposit={otherPossibleRescuersDeposit}
          recoveryConsts={recoveryConsts}
          recoveryDelay={lostAccountRecoveryInfo?.delayPeriod ? (lostAccountRecoveryInfo?.delayPeriod?.toNumber() / (24 * 60 * 10)).toFixed(4) : 0}
          recoveryThreshold={lostAccountRecoveryInfo?.threshold?.toNumber()}
          rescuer={{ ...account, option: hasActiveRecoveries ?? { deposit: lostAccountRecoveryInfo?.deposit ?? BN_ZERO } }}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
          withdrawAmounts={{
            totalWithdrawable:totalWithdrawable,
            available: lostAccountBalance?.availableBalance ?? BN_ZERO,
            redeemable: redeemable ?? BN_ZERO,
            staked: lostAccountLedger?.active?.unwrap() ?? BN_ZERO,
            spanCount: spanCount ?? 0
          }}
        />
      }
    </Popup>
  );
}

export default styled(AsRescuer)`
         height: calc(100vh - 2px);
         overflow: auto;
         scrollbar - width: none;
 
         &:: -webkit - scrollbar {
           display: none;
         width:0,
        }
         .empty-list {
           text - align: center;
   }`;
