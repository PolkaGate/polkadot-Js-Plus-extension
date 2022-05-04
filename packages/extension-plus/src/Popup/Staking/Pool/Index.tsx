// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */
/* eslint-disable react/jsx-first-prop-new-line */

/**
 * @description
 *  this component provides access to allstaking stuff,including stake,
 *  unstake, redeem, change validators, staking generak info,etc.
 * */

import type { Bytes, Option } from '@polkadot/types';
import type { StakingLedger } from '@polkadot/types/interfaces';
import type { FrameSystemAccountInfo, PalletNominationPoolsBondedPoolInner, PalletNominationPoolsPoolMember, PalletNominationPoolsRewardPool, PalletStakingNominations } from '@polkadot/types/lookup';
import type { AccountsBalanceType, MyPoolInfo, PoolInfo, PoolStakingConsts, SavedMetaData, StakingConsts, Validators } from '../../../util/plusTypes';

import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AddCircleOutlineOutlined as AddCircleOutlineOutlinedIcon, CheckOutlined, GroupWorkOutlined as GroupWorkOutlinedIcon, InfoOutlined as InfoOutlinedIcon, NotificationImportantOutlined as NotificationImportantOutlinedIcon, NotificationsActive as NotificationsActiveIcon, RemoveCircleOutlineOutlined as RemoveCircleOutlineOutlinedIcon, ReportOutlined as ReportOutlinedIcon, WorkspacesOutlined as WorkspacesOutlinedIcon } from '@mui/icons-material';
import { Badge, Box, CircularProgress, Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { BN, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../../extension-ui/src/messaging';
import { Hint, PlusHeader, Popup } from '../../../components';
import useEndPoint from '../../../hooks/useEndPoint';
import getRewardsSlashes from '../../../util/api/getRewardsSlashes';
import { getStakingReward } from '../../../util/api/staking';
import { MAX_ACCEPTED_COMMISSION } from '../../../util/constants';
import { amountToHuman, balanceToHuman, prepareMetaData } from '../../../util/plusUtils';
import Nominations from '../Solo/Nominations';
import RewardChart from '../Solo/RewardChart';
import SelectValidators from '../Solo/SelectValidators';
import TabPanel from '../Solo/TabPanel';
import Unstake from '../pool/Unstake';
import ConfirmStaking from './ConfirmStaking';
import InfoTab from './InfoTab';
import Overview from './Overview';
import Pool from './Pool';
import Stake from './Stake';

interface Props {
  account: AccountJson,
  chain: Chain;
  api: ApiPromise | undefined;
  ledger: StakingLedger | null;
  redeemable: bigint | null;
  showStakingModal: boolean;
  setStakingModalOpen: Dispatch<SetStateAction<boolean>>;
  staker: AccountsBalanceType;
}

interface RewardInfo {
  era: number;
  reward: bigint;
  timeStamp?: number;
  event?: string;
}

const workers: Worker[] = [];
const DEFAULT_MEMBER_INFO = {
  points: 0,
  poolId: 0,
  rewardPoolTotalEarnings: 0,
  unbondingEras: []
};


BigInt.prototype.toJSON = function () { return this.toString(); };

export default function Index({ account, api, chain, ledger, redeemable, setStakingModalOpen, showStakingModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const endpoint = useEndPoint(account, undefined, chain);
  const [poolsInfo, setPoolsInfo] = useState<PoolInfo[] | undefined>();
  const [memberInfo, setMemberInfo] = useState<PalletNominationPoolsPoolMember | undefined>();
  const [poolStakingConsts, setPoolStakingConsts] = useState<PoolStakingConsts | undefined>();
  const [myPool, setMyPool] = useState<MyPoolInfo | undefined>();


  const [stakingConsts, setStakingConsts] = useState<StakingConsts | null>(null);
  const [gettingStakingConstsFromBlockchain, setgettingStakingConstsFromBlockchain] = useState<boolean>(true);
  const [gettingNominatedValidatorsInfoFromChain, setGettingNominatedValidatorsInfoFromChain] = useState<boolean>(true);
  const [totalReceivedReward, setTotalReceivedReward] = useState<string>();
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);
  const [showChartModal, setChartModalOpen] = useState<boolean>(false);
  const [showSelectValidatorsModal, setSelectValidatorsModalOpen] = useState<boolean>(false);
  const [stakeAmount, setStakeAmount] = useState<BN>(BN_ZERO);
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [currentlyStakedInHuman, setCurrentlyStakedInHuman] = useState<string | null>(null);
  const [validatorsInfo, setValidatorsInfo] = useState<Validators | null>(null); // validatorsInfo is all validators (current and waiting) information
  const [validatorsIdentities, setValidatorsIdentities] = useState<DeriveAccountInfo[] | null>(null);
  const [validatorsInfoIsUpdated, setValidatorsInfoIsUpdated] = useState<boolean>(false);
  const [selectedValidators, setSelectedValidatorsAcounts] = useState<DeriveStakingQuery[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | null>(null);
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean>(false);
  const [nominatedValidators, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [state, setState] = useState<string>('');
  const [tabValue, setTabValue] = useState(3);
  const [unstakeAmount, setUnstakeAmount] = useState<BN>(0n);
  const [unlockingAmount, setUnlockingAmount] = useState<bigint>(0n);
  const [oversubscribedsCount, setOversubscribedsCount] = useState<number | undefined>();
  const [activeValidator, setActiveValidator] = useState<DeriveStakingQuery>();
  const [currentEraIndex, setCurrentEraIndex] = useState<number | undefined>();
  const [currentEraIndexOfStore, setCurrentEraIndexOfStore] = useState<number | undefined>();
  const [rewardSlashes, setRewardSlashes] = useState<RewardInfo[]>([]);
  const [localStrorageIsUpdate, setStoreIsUpdate] = useState<boolean>(false);

  const decimals = api && api.registry.chainDecimals[0];
  const chainName = chain?.name.replace(' Relay Chain', '');

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const getPoolStakingConsts = (endpoint: string) => {
    /** 1- get some staking constant like min Nominator Bond ,... */
    const getPoolStakingConstsWorker: Worker = new Worker(new URL('../../../util/workers/getPoolStakingConsts.js', import.meta.url));

    workers.push(getPoolStakingConstsWorker);

    getPoolStakingConstsWorker.postMessage({ endpoint });

    getPoolStakingConstsWorker.onerror = (err) => {
      console.log(err);
    };

    getPoolStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const sConsts: PoolStakingConsts = e.data;

      if (sConsts) {
        sConsts.minCreateBond = new BN(sConsts.minCreateBond);
        sConsts.minJoinBond = new BN(sConsts.minJoinBond);
        sConsts.minNominatorBond = new BN(sConsts.minNominatorBond);
        setPoolStakingConsts(sConsts);

        console.log('poolStakingConst:', sConsts);
        console.log('poolStakingConst: lastPoolId', String(sConsts.lastPoolId));
        // setgettingStakingConstsFromBlockchain(false);

        // if (staker?.address) {
        //   //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        //   //   const stringifiedStakingConsts = JSON.stringify(consts, (_key, value) => typeof value === 'bigint' ? value.toString() : value);

        //   // sConsts.existentialDeposit = sConsts.existentialDeposit.toString();
        //   // eslint-disable-next-line no-void
        //   //void updateMeta(account.address, prepareMetaData(chain, 'poolStakingConsts', JSON.stringify(sConsts)));
        // }
      }

      getPoolStakingConstsWorker.terminate();
    };
  };

  const getNominations = (endpoint: string, stakerAddress: string) => {
    const getNominatorsWorker: Worker = new Worker(new URL('../../../util/workers/getNominations.js', import.meta.url));

    workers.push(getNominatorsWorker);

    getNominatorsWorker.postMessage({ endpoint, stakerAddress });

    getNominatorsWorker.onerror = (err) => {
      console.log(err);
    };

    getNominatorsWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const targets: string[] = e.data;

      setNoNominatedValidators(!targets); // show that nominators are fetched and is empty or not

      setNominatedValidatorsId(targets);
      getNominatorsWorker.terminate();
    };
  };

  const getPools = (endpoint: string) => {
    const getPoolsWorker: Worker = new Worker(new URL('../../../util/workers/getPools.js', import.meta.url));

    workers.push(getPoolsWorker);

    getPoolsWorker.postMessage({ endpoint });

    getPoolsWorker.onerror = (err) => {
      console.log(err);
    };

    getPoolsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const poolsInfo: string = e.data;

      if (poolsInfo) {
        console.log('poolsInfo:', JSON.parse(poolsInfo));
        const parsedPoolsInfo = JSON.parse(poolsInfo) as PoolInfo[];

        parsedPoolsInfo?.forEach((poolInfo: PoolInfo) => {
          poolInfo.bondedPools.points = api?.createType('Balance', poolInfo.bondedPools.points);
        });

        setPoolsInfo(parsedPoolsInfo);
      }

      getPoolsWorker.terminate();
    };
  };

  const getStakingConsts = (chain: Chain, endpoint: string) => {
    /** 1- get some staking constant like min Nominator Bond ,... */
    const getStakingConstsWorker: Worker = new Worker(new URL('../../../util/workers/getStakingConsts.js', import.meta.url));

    workers.push(getStakingConstsWorker);

    getStakingConstsWorker.postMessage({ endpoint });

    getStakingConstsWorker.onerror = (err) => {
      console.log(err);
    };

    getStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const sConsts: StakingConsts = e.data;

      if (sConsts) {
        setStakingConsts(sConsts);

        setgettingStakingConstsFromBlockchain(false);

        if (staker?.address) {
          //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          //   const stringifiedStakingConsts = JSON.stringify(consts, (_key, value) => typeof value === 'bigint' ? value.toString() : value);

          // sConsts.existentialDeposit = sConsts.existentialDeposit.toString();
          // eslint-disable-next-line no-void
          void updateMeta(account.address, prepareMetaData(chain, 'stakingConsts', JSON.stringify(sConsts)));
        }
      }

      getStakingConstsWorker.terminate();
    };
  };

  const getValidatorsInfo = (chain: Chain, endpoint: string, validatorsInfoFromStore: SavedMetaData) => {
    const getValidatorsInfoWorker: Worker = new Worker(new URL('../../../util/workers/getValidatorsInfo.js', import.meta.url));

    workers.push(getValidatorsInfoWorker);

    getValidatorsInfoWorker.postMessage({ endpoint });

    getValidatorsInfoWorker.onerror = (err) => {
      console.log(err);
    };

    getValidatorsInfoWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fetchedValidatorsInfo: Validators | null = e.data;

      setGettingNominatedValidatorsInfoFromChain(false);

      console.log(`validatorsfrom chain (era:${fetchedValidatorsInfo?.currentEraIndex}), current: ${fetchedValidatorsInfo?.current?.length} waiting ${fetchedValidatorsInfo?.waiting?.length} `);

      if (fetchedValidatorsInfo && JSON.stringify(validatorsInfoFromStore?.metaData) !== JSON.stringify(fetchedValidatorsInfo)) {
        setValidatorsInfo(fetchedValidatorsInfo);
        console.log(`save validators to local storage, old was current: ${validatorsInfoFromStore?.metaData?.current?.length} waiting ${validatorsInfoFromStore?.metaData?.waiting?.length} `);

        // eslint-disable-next-line no-void
        void updateMeta(account.address, prepareMetaData(chain, 'validatorsInfo', fetchedValidatorsInfo));
      }

      setValidatorsInfoIsUpdated(true);
      getValidatorsInfoWorker.terminate();
    };
  };

  useEffect((): void => {
    // eslint-disable-next-line no-void
    api && void api.query.staking.currentEra().then((ce) => {
      setCurrentEraIndex(Number(ce));
    });

    // eslint-disable-next-line no-void
    api && void api.query.nominationPools.poolMembers(staker.address).then((res) => {
      const members = res.isSome ? res.unwrap() : DEFAULT_MEMBER_INFO;

      console.log('members', JSON.parse(JSON.stringify(members)));
      setMemberInfo(members);
    });
  }, [api, chainName, staker.address]);

  useEffect((): void => {
    if (!currentEraIndex || !currentEraIndexOfStore) { return; }

    setStoreIsUpdate(currentEraIndex === currentEraIndexOfStore);
  }, [currentEraIndex, currentEraIndexOfStore]);

  useEffect(() => {
    /** get poolsInfo  */
    endpoint && getPools(endpoint);

    endpoint && getPoolStakingConsts(endpoint);

    endpoint && getStakingConsts(chain, endpoint);

    // *** get nominated validators list
    endpoint && getNominations(endpoint, staker.address);

    /** retrive validatorInfo from local sorage */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const validatorsInfoFromStore: SavedMetaData = account?.validatorsInfo ? JSON.parse(account.validatorsInfo) : null;

    if (validatorsInfoFromStore && validatorsInfoFromStore?.chainName === chainName) {
      console.log(`validatorsInfo is set from local storage current:${validatorsInfoFromStore.metaData?.current?.length} waiting:${validatorsInfoFromStore.metaData?.waiting?.length}`);

      // *** TODO: remove if after next version, because of inconsistency in the stored data formats
      if (!String((validatorsInfoFromStore.metaData as Validators)?.current[0]?.stakingLedger?.total)?.includes('.')) {
        setValidatorsInfo(validatorsInfoFromStore.metaData as Validators);
      }

      setCurrentEraIndexOfStore(Number(validatorsInfoFromStore.metaData.currentEraIndex));
      console.log(`validatorsInfro in storage is from era: ${validatorsInfoFromStore.metaData.currentEraIndex}
      on chain: ${validatorsInfoFromStore?.chainName}`);
    }

    /** get validators info, including current and waiting, should be called after validatorsInfoFromStore gets value */
    endpoint && getValidatorsInfo(chain, endpoint, validatorsInfoFromStore);
  }, [endpoint, chain, staker.address, account.validatorsInfo, chainName]);

  useEffect(() => {
    if (!(api && poolsInfo)) return;

    const myPool = poolsInfo.find((p, index) => index + 1 === Number(memberInfo?.poolId));
    const myPoolIndex = poolsInfo.findIndex((p, index) => index + 1 === Number(memberInfo?.poolId)); // FIXME should do in a better way

    myPoolIndex !== -1 && setMyPool({ poolIndex: myPoolIndex + 1, ...myPool })
  }, [memberInfo, poolsInfo, api]);

  useEffect(() => {
    if (!validatorsInfoIsUpdated || !validatorsInfo?.current.length) { return; }

    const validatorsAccountIds = validatorsInfo.current.map((v) => v.accountId).concat(validatorsInfo.waiting.map((v) => v.accountId));
    /** get validators identities */
    const getValidatorsIdWorker: Worker = new Worker(new URL('../../../util/workers/getValidatorsId.js', import.meta.url));

    workers.push(getValidatorsIdWorker);

    getValidatorsIdWorker.postMessage({ endpoint, validatorsAccountIds });

    getValidatorsIdWorker.onerror = (err) => {
      console.log(err);
    };

    getValidatorsIdWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const fetchedIdentities: DeriveAccountInfo[] | null = e.data;

      console.log(`got ${fetchedIdentities?.length} validators identities from ${chain?.name} `);

      /** if fetched differs from saved then setIdentities and save to local storage */
      if (fetchedIdentities?.length && JSON.stringify(validatorsIdentities) !== JSON.stringify(fetchedIdentities)) {
        console.log(`setting new identities #old was: ${validatorsIdentities?.length} `);

        setValidatorsIdentities(fetchedIdentities);
        // eslint-disable-next-line no-void
        void updateMeta(account.address, prepareMetaData(chain, 'validatorsIdentities', fetchedIdentities));
      }

      getValidatorsIdWorker.terminate();
    };
  }, [validatorsInfoIsUpdated, validatorsInfo, endpoint, chain, validatorsIdentities, account.address]);

  useEffect(() => {
    if (!api || !decimals) return;

    /** get staking reward from subscan, can use onChain data, TODO */
    // eslint-disable-next-line no-void
    void getStakingReward(chain, staker.address).then((reward) => {
      if (!reward) reward = '0';
      reward = amountToHuman(String(reward), decimals) === '0' ? '0.00' : amountToHuman(reward, decimals);
      setTotalReceivedReward(reward);
    });
  }, [chain, api, staker.address, decimals]);

  useEffect(() => {
    if (!memberInfo || !api || !decimals) { return; }

    setCurrentlyStakedInHuman(amountToHuman(String(memberInfo.points), decimals));

    // set unlocking
    let unlockingValue = 0n;

    //TODO: check when have unlocking ...........................................
    memberInfo?.unbondingEras?.forEach((u) => { unlockingValue += BigInt(String(u.value)); });

    setUnlockingAmount(redeemable ? unlockingValue - redeemable : unlockingValue);
  }, [memberInfo, api, redeemable, decimals]);

  useEffect(() => {
    if (!account) {
      console.log(' no account, wait for it...!..');

      return;
    }

    console.log('account in staking stake:', account);

    // * retrive staking consts from local sorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stakingConstsFromLocalStrorage: SavedMetaData = account?.stakingConsts ? JSON.parse(account.stakingConsts) : null;

    if (stakingConstsFromLocalStrorage && stakingConstsFromLocalStrorage?.chainName === chainName) {
      console.log('stakingConsts from local:', JSON.parse(stakingConstsFromLocalStrorage.metaData));
      setStakingConsts(JSON.parse(stakingConstsFromLocalStrorage.metaData) as StakingConsts);
    }

    // *** retrive nominated validators from local sorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nominatedValidatorsInfoFromLocalStrorage: SavedMetaData = account?.nominatedValidators ? JSON.parse(account.nominatedValidators) : null;

    if (nominatedValidatorsInfoFromLocalStrorage && nominatedValidatorsInfoFromLocalStrorage?.chainName === chainName) {
      // *** TODO: remove if after next version, because of inconsistency in the stored data formats
      if (!String((nominatedValidatorsInfoFromLocalStrorage.metaData as DeriveStakingQuery[])[0]?.stakingLedger?.total)?.includes('.')) {
        setNominatedValidatorsInfo(nominatedValidatorsInfoFromLocalStrorage.metaData as DeriveStakingQuery[]);
      }
    }

    // **** retrive validators identities from local storage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const validarorsIdentitiesFromStore: SavedMetaData = account?.validatorsIdentities ? JSON.parse(account.validatorsIdentities) : null;

    if (validarorsIdentitiesFromStore && validarorsIdentitiesFromStore?.chainName === chainName) {
      setValidatorsIdentities(validarorsIdentitiesFromStore.metaData as DeriveAccountInfo[]);
    }
  }, []);

  useEffect((): void => {
    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker]);

  useEffect(() => {
    if (validatorsInfo && nominatedValidatorsId && chain && account.address) {
      // find all information of nominated validators from all validatorsInfo(current and waiting)
      const nominations = validatorsInfo.current
        .concat(validatorsInfo.waiting)
        .filter((v: DeriveStakingQuery) => nominatedValidatorsId.includes(String(v.accountId)));

      setNominatedValidatorsInfo(nominations);
      // setGettingNominatedValidatorsInfoFromChain(false);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateMeta(account.address, prepareMetaData(chain, 'nominatedValidators', nominations));
    }
  }, [nominatedValidatorsId, validatorsInfo, chain, account.address]);

  useEffect(() => {
    if (noNominatedValidators) {
      console.log('Clear saved nominatedValidators');

      // eslint-disable-next-line no-void
      void updateMeta(account.address, prepareMetaData(chain, 'nominatedValidators', []));
    }
  }, [account.address, chain, noNominatedValidators]);

  // TODO: selecting validators automatically, may move to confirm page!
  useEffect(() => {
    if (validatorsInfo && stakingConsts) {
      const selectedVAcc = selectBestValidators(validatorsInfo, stakingConsts);

      setSelectedValidatorsAcounts(selectedVAcc);
    }
  }, [stakingConsts, validatorsInfo]);

  useEffect(() => {
    const oversubscribeds = nominatedValidators?.filter((v) => v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator);

    setOversubscribedsCount(oversubscribeds?.length);
  }, [nominatedValidators, stakingConsts]);

  // TODO: find a better algorithm to select validators automatically
  function selectBestValidators(validatorsInfo: Validators, stakingConsts: StakingConsts): DeriveStakingQuery[] {
    const allValidators = validatorsInfo.current.concat(validatorsInfo.waiting);
    const nonBlockedValidatorsAccountId = allValidators.filter((v) =>
      !v.validatorPrefs.blocked && // filter blocked validators
      (Number(v.validatorPrefs.commission) / (10 ** 7)) < MAX_ACCEPTED_COMMISSION && // filter high commision validators
      v.exposure.others.length < stakingConsts?.maxNominatorRewardedPerValidator // filter oversubscribed
      // && v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator / 4 // filter validators with very low nominators
    );

    return nonBlockedValidatorsAccountId.slice(0, stakingConsts?.maxNominations);
  }

  const handlePoolStakingModalClose = useCallback(
    (): void => {
      // should terminate workers
      workers.forEach((w) => w.terminate());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setStakingModalOpen(false);
    },
    [setStakingModalOpen]
  );

  const handleConfirmStakingModaOpen = useCallback((): void => {
    setConfirmStakingModalOpen(true);
  }, []);

  const handleSelectValidatorsModalOpen = useCallback((isSetNominees = false): void => {
    setSelectValidatorsModalOpen(true);

    if (!state) {
      isSetNominees ? setState('setNominees') : setState('changeValidators');
    }
  }, [state]);

  const handleNextToUnstake = useCallback((): void => {
    if (!state) setState('unstake');
    handleConfirmStakingModaOpen();
  }, [handleConfirmStakingModaOpen, state]);

  const handleStopNominating = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('stopNominating');
  }, [handleConfirmStakingModaOpen, state]);

  const handleRebag = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('tuneUp');
  }, [handleConfirmStakingModaOpen, state]);

  const handleWithdrowUnbound = useCallback(() => {
    if (!redeemable) return;
    if (!state) setState('withdrawUnbound');
    handleConfirmStakingModaOpen();
  }, [handleConfirmStakingModaOpen, redeemable, state]);

  const handleViewChart = useCallback(() => {
    if (!rewardSlashes) return;
    setChartModalOpen(true);
  }, [setChartModalOpen, rewardSlashes]);

  const getAmountToConfirm = useCallback(() => {
    switch (state) {
      case ('unstake'):
        return unstakeAmount;
      case ('stakeAuto'):
      case ('stakeManual'):
        return stakeAmount;
      case ('withdrawUnbound'):
        return redeemable || 0n;
      default:
        return 0n;
    }
  }, [state, unstakeAmount, stakeAmount, redeemable]);

  useEffect(() => {
    const active = nominatedValidators?.find((n) => n.exposure.others.find(({ who }) => who.toString() === staker.address));

    setActiveValidator(active);
  }, [nominatedValidators, staker.address]);

  const PoolsIcon = useMemo((): React.ReactElement<any> => (
    !poolsInfo ? <CircularProgress size={12} thickness={2} /> : <WorkspacesOutlinedIcon fontSize='small' />
  ), [poolsInfo]);

  return (
    <Popup handleClose={handlePoolStakingModalClose} showModal={showStakingModal}>

      <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<GroupWorkOutlinedIcon fontSize='small' />} title={'Pool Staking'} />

      <Grid alignItems='center' container>
        <Grid container item xs={12}>
          <Overview
            api={api}
            availableBalanceInHuman={availableBalanceInHuman}
            handleViewChart={handleViewChart}
            handleWithdrowUnbound={handleWithdrowUnbound}
            memberInfo={memberInfo}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs centered indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue}>
              <Tab icon={<AddCircleOutlineOutlinedIcon fontSize='small' />} iconPosition='start' label='Stake' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={<RemoveCircleOutlineOutlinedIcon fontSize='small' />} iconPosition='start' label='Unstake' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={PoolsIcon} iconPosition='start' label='Pool' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={!poolsInfo ? <CircularProgress size={12} thickness={2} /> : <InfoOutlinedIcon fontSize='small' />}
                iconPosition='start' label='Info' sx={{ fontSize: 11, px: '15px' }}
              />
            </Tabs>
          </Box>
          <TabPanel index={0} value={tabValue}>
            <Stake
              api={api}
              handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
              handleSelectValidatorsModalOpen={handleSelectValidatorsModalOpen}
              myPool={myPool}
              nextToStakeButtonBusy={!!stakeAmount && (!(validatorsInfoIsUpdated || localStrorageIsUpdate)) && state !== ''}
              poolStakingConsts={poolStakingConsts}
              setStakeAmount={setStakeAmount}
              setState={setState}
              staker={staker}
              state={state}
            />
          </TabPanel>
          <TabPanel index={1} value={tabValue}>
            <Unstake
              api={api}
              availableBalance={staker?.balanceInfo?.available ? new BN(staker?.balanceInfo?.available) : BN_ZERO}
              currentlyStakedInHuman={currentlyStakedInHuman}
              handleNextToUnstake={handleNextToUnstake}
              memberInfo={memberInfo}
              nextToUnStakeButtonBusy={state === 'unstake'}
              setUnstakeAmount={setUnstakeAmount}
              stakingConsts={stakingConsts}
            />
          </TabPanel>
          <TabPanel index={2} padding={1} value={tabValue}>
            <Pool
              api={api}
              chain={chain}
              myPool={myPool}
              poolsInfo={poolsInfo}
              staker={staker}
            />
          </TabPanel>
          <TabPanel index={3} value={tabValue}>
            <InfoTab
              api={api}
              info={poolStakingConsts}
            />
          </TabPanel>
        </Grid>
      </Grid>

      {stakingConsts && validatorsInfo &&
        <SelectValidators
          api={api}
          chain={chain}
          ledger={ledger}
          nominatedValidators={nominatedValidators}
          setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
          setState={setState}
          showSelectValidatorsModal={showSelectValidatorsModal}
          stakeAmount={stakeAmount}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsIdentities={validatorsIdentities}
          validatorsInfo={validatorsInfo}
        />
      }
      {((showConfirmStakingModal && memberInfo && staker && (selectedValidators || nominatedValidators) && state !== '') || state === 'stopNominating') && api &&
        <ConfirmStaking
          amount={getAmountToConfirm()}
          api={api}
          chain={chain}
          endpoint={endpoint}
          handlePoolStakingModalClose={handlePoolStakingModalClose}
          memberInfo={memberInfo}
          nextPoolId={poolsInfo?.length ? poolsInfo?.length + 1 : 1}
          nominatedValidators={nominatedValidators}
          selectedValidators={selectedValidators}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setState={setState}
          showConfirmStakingModal={showConfirmStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsIdentities={validatorsIdentities}
        />
      }

      {rewardSlashes && showChartModal && api &&
        <RewardChart
          api={api}
          chain={chain}
          rewardSlashes={rewardSlashes}
          setChartModalOpen={setChartModalOpen}
          showChartModal={showChartModal}
        />
      }
    </Popup>
  );
}
