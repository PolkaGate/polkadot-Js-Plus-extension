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

import type { Option, StorageKey } from '@polkadot/types';
import type { AccountId32 } from '@polkadot/types/interfaces';
import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, PoolInfo, PoolStakingConsts, SavedMetaData, StakingConsts, Validators } from '../../../util/plusTypes';

import { AddCircleOutlineOutlined as AddCircleOutlineOutlinedIcon, GroupWorkOutlined as GroupWorkOutlinedIcon, InfoOutlined as InfoOutlinedIcon, NotificationImportantOutlined as NotificationImportantOutlinedIcon, NotificationsActive as NotificationsActiveIcon, PanToolOutlined as PanToolOutlinedIcon, RemoveCircleOutlineOutlined as RemoveCircleOutlineOutlinedIcon, ReportOutlined as ReportOutlinedIcon, WorkspacesOutlined as WorkspacesOutlinedIcon } from '@mui/icons-material';
import { Badge, Box, CircularProgress, Grid, Tab, Tabs } from '@mui/material';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { BN, BN_ONE, BN_ZERO } from '@polkadot/util';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../../../extension-ui/src/messaging';
import { Hint, PlusHeader, Popup } from '../../../components';
import { useMapEntries } from '../../../hooks';
import { getStakingReward } from '../../../util/api/staking';
import { MAX_ACCEPTED_COMMISSION, PPREFERED_POOL_ID_ON_KUSAMA, PPREFERED_POOL_ID_ON_POLKADOT, PPREFERED_POOL_ID_ON_WESTEND } from '../../../util/constants';
import { amountToHuman, balanceToHuman, prepareMetaData } from '../../../util/plusUtils';
import Nominations from '../Pool/Nominations';
import Unstake from '../pool/Unstake';
import RewardChart from '../Solo/RewardChart';
import TabPanel from '../Solo/TabPanel';
import ConfirmStaking from './ConfirmStaking';
import InfoTab from './InfoTab';
import Overview from './Overview';
import PoolTab from './PoolTab';
import SelectValidators from './SelectValidators';
import Stake from './Stake';


interface Props {
  account: AccountJson,
  chain: Chain;
  api: ApiPromise | undefined;
  showStakingModal: boolean;
  setStakingModalOpen: Dispatch<SetStateAction<boolean>>;
  staker: AccountsBalanceType;
  stakingConsts: StakingConsts | undefined;

  poolStakingConsts: PoolStakingConsts | undefined;
  endpoint: string | undefined;
}

interface RewardInfo {
  era: number;
  reward: bigint;
  timeStamp?: number;
  event?: string;
}

const workers: Worker[] = [];
const DEFAULT_MEMBER_INFO = {
  points: BN_ZERO,
  poolId: BN_ZERO,
  rewardPoolTotalEarnings: BN_ZERO,
  unbondingEras: []
};

BigInt.prototype.toJSON = function () { return this.toString(); };

const OPT_ENTRIES = {
  transform: (entries: [StorageKey<[AccountId32]>, Option<PalletNominationPoolsPoolMember>][]): MembersMapEntry[] =>
    entries.reduce((all: MembersMapEntry[], [{ args: [accountId] }, optMember]) => {
      if (optMember.isSome) {
        const member = optMember.unwrap();
        const poolId = member.poolId.toString();

        if (!all[poolId]) {
          all[poolId] = [];
        }

        all[poolId].push({
          accountId: accountId.toString(),
          member
        });
      }

      return all;
    }, {})
};

export default function Index({ account, api, chain, endpoint, poolStakingConsts, setStakingModalOpen, showStakingModal, staker, stakingConsts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const poolsMembers: MembersMapEntry[] | undefined = useMapEntries(api?.query?.nominationPools?.poolMembers, OPT_ENTRIES);

  const [poolsInfo, setPoolsInfo] = useState<PoolInfo[] | undefined>();
  const [myPool, setMyPool] = useState<MyPoolInfo | undefined | null>(undefined);
  // const [selectedPool, setSelectedPool] = useState<MyPoolInfo | undefined>();
  // const [selectedPoolId, setSelectedPoolId] = useState<BN | undefined>();
  const [newPool, setNewPool] = useState<MyPoolInfo | undefined>();

  const [gettingNominatedValidatorsInfoFromChain, setGettingNominatedValidatorsInfoFromChain] = useState<boolean>(true);
  const [totalReceivedReward, setTotalReceivedReward] = useState<string>();
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);
  const [showChartModal, setChartModalOpen] = useState<boolean>(false);
  const [showSelectValidatorsModal, setSelectValidatorsModalOpen] = useState<boolean>(false);
  const [stakeAmount, setStakeAmount] = useState<BN>(BN_ZERO);
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [currentlyStakedInHuman, setCurrentlyStakedInHuman] = useState<string | undefined | null>(undefined);
  const [validatorsInfo, setValidatorsInfo] = useState<Validators | null>(null); // validatorsInfo is all validators (current and waiting) information
  const [validatorsIdentities, setValidatorsIdentities] = useState<DeriveAccountInfo[] | null>(null);
  const [validatorsInfoIsUpdated, setValidatorsInfoIsUpdated] = useState<boolean>(false);
  const [selectedValidators, setSelectedValidatorsAcounts] = useState<DeriveStakingQuery[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | undefined>();
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean>(false);// if TRUE, shows that nominators are fetched but is empty 
  const [nominatedValidators, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [state, setState] = useState<string>('');
  const [tabValue, setTabValue] = useState(4);
  const [unstakeAmount, setUnstakeAmount] = useState<BN>(BN_ZERO);
  const [oversubscribedsCount, setOversubscribedsCount] = useState<number | undefined>();
  const [activeValidator, setActiveValidator] = useState<DeriveStakingQuery>();
  const [currentEraIndex, setCurrentEraIndex] = useState<number | undefined>();
  const [currentEraIndexOfStore, setCurrentEraIndexOfStore] = useState<number | undefined>();
  const [rewardSlashes, setRewardSlashes] = useState<RewardInfo[]>([]);
  const [localStrorageIsUpdate, setStoreIsUpdate] = useState<boolean>(false);
  const [nominatorInfo, setNominatorInfo] = useState<{ minNominated: bigint, isInList: boolean } | undefined>();

  const decimals = api && api.registry.chainDecimals[0];
  const chainName = chain?.name.replace(' Relay Chain', '');

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  /** get all information regarding the created/joined pool */
  const getPoolInfo = (endpoint: string, stakerAddress: string, id: number | undefined = undefined) => {
    const getPoolWorker: Worker = new Worker(new URL('../../../util/workers/getPool.js', import.meta.url));

    workers.push(getPoolWorker);

    getPoolWorker.postMessage({ endpoint, id, stakerAddress });

    getPoolWorker.onerror = (err) => {
      console.log(err);
    };

    getPoolWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info: string = e.data;

      if (!info) {
        setNoNominatedValidators(true);
        setMyPool(null);
        //setSelectedPool(null);

        return;
      }

      const parsedInfo = JSON.parse(info) as MyPoolInfo;

      if (!parsedInfo.stashIdAccount.nominators.length) {
        setNoNominatedValidators(true);
      }

      console.log('*** My pool info returned from worker is:', parsedInfo);

      // id ? setSelectedPool(parsedInfo) : 
      setMyPool(parsedInfo);
      !id && setNominatedValidatorsId(parsedInfo.stashIdAccount.nominators);
      getPoolWorker.terminate();
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

        parsedPoolsInfo?.forEach((p: PoolInfo) => {
          p.bondedPool.points = new BN(p.bondedPool.points);
        });
        setPoolsInfo(parsedPoolsInfo);
      }

      getPoolsWorker.terminate();
    };
  };

  const getNominatorInfo = (endpoint: string, stakerAddress: string) => {
    const getNominatorInfoWorker: Worker = new Worker(new URL('../../../util/workers/getNominatorInfo.js', import.meta.url));

    workers.push(getNominatorInfoWorker);

    getNominatorInfoWorker.postMessage({ endpoint, stakerAddress });

    getNominatorInfoWorker.onerror = (err) => {
      console.log(err);
    };

    getNominatorInfoWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const nominatorInfo = e.data;

      console.log('nominatorInfo:', nominatorInfo);

      setNominatorInfo(nominatorInfo);
      getNominatorInfoWorker.terminate();
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
  }, [api]);

  useEffect((): void => {
    if (!currentEraIndex || !currentEraIndexOfStore) { return; }

    setStoreIsUpdate(currentEraIndex === currentEraIndexOfStore);
  }, [currentEraIndex, currentEraIndexOfStore]);

  useEffect(() => {
    endpoint && getPoolInfo(endpoint, staker.address);

    endpoint && getPools(endpoint);

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
    /**  get nominator staking info to consider rebag ,... */
    endpoint && myPool && getNominatorInfo(endpoint, myPool.accounts.stashId);
  }, [endpoint, myPool]);

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
    if (myPool === undefined || !decimals) { return; }

    if (myPool === null) { return setCurrentlyStakedInHuman('0'); }

    const staked = new BN(myPool.member.points).mul(new BN(myPool.stashIdAccount.stakingLedger.active)).div(new BN(myPool.bondedPool.points));

    setCurrentlyStakedInHuman(amountToHuman(String(staked), decimals) ?? '0');
  }, [myPool, decimals]);

  useEffect(() => {
    if (!account) {
      console.log(' no account, wait for it...!..');

      return;
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

  // useEffect(() => {
  //   if (!poolsInfo || !chainName) { return; }

  //   const selected = selectBestPool(chainName, poolsInfo);
  //   console.log('selected pool id', selected);

  //   setSelectedPoolId(selected);
  // }, [chainName, poolsInfo]);

  // useEffect(() => {
  //   if (!selectedPoolId) { return; }

  //   endpoint && getPoolInfo(endpoint, '', selectedPoolId.toNumber());
  // }, [endpoint, selectedPoolId]);

  useEffect(() => {
    const oversubscribeds = nominatedValidators?.filter((v) => v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator);

    setOversubscribedsCount(oversubscribeds?.length);
  }, [nominatedValidators, stakingConsts]);

  // function selectBestPool(chainName: string, pools: PoolInfo[]): BN {
  //   let selectedPoolId: BN | undefined;

  //   switch (chainName) {
  //     case ('Westend'):
  //       selectedPoolId = PPREFERED_POOL_ID_ON_WESTEND;
  //       break;
  //     case ('Kusama'):
  //       selectedPoolId = PPREFERED_POOL_ID_ON_KUSAMA;
  //       break;
  //     case ('Polkadot'):
  //       selectedPoolId = PPREFERED_POOL_ID_ON_POLKADOT;
  //       break;
  //     default:
  //       selectedPoolId = undefined;
  //   }

  //   const selectedPool = selectedPoolId ? pools[selectedPoolId.subn(1)] : undefined;

  //   if (selectedPool && selectedPool?.bondedPool?.state === 'Open') {
  //     return selectedPoolId;
  //     // return { poolId: selectedPoolId, ...selectedPool };
  //   }

  //   const selected = pools.reduce(function (a, b) {
  //     return (a.bondedPool.points).gt(b.bondedPool.points) ? a : b;
  //   }, pools[0]);
  //   const index = pools.indexOf((p) => p.bondedPool.points.eq(selected.bondedPool.points))

  //   return new BN(index + 1);
  //   // return { poolId: new BN(index + 1), ...selected };
  // }

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

    // if (!state) {
      isSetNominees ? setState('setNominees') : setState('changeValidators');
    // }
  }, [state]);

  const handleStopNominating = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('stopNominating');
  }, [handleConfirmStakingModaOpen, state]);

  const handleRebag = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('tuneUp');
  }, [handleConfirmStakingModaOpen, state]);

  const handleWithdrawUnbounded = useCallback(() => {
    if (!myPool?.redeemable) return;
    if (!state) setState('withdrawUnbound');
    handleConfirmStakingModaOpen();
  }, [handleConfirmStakingModaOpen, myPool, state]);

  const handleWithdrawClaimable = useCallback(() => {
    if (!myPool?.myClaimable) return;
    if (!state) setState('withdrawClaimable');
    handleConfirmStakingModaOpen();
  }, [handleConfirmStakingModaOpen, myPool, state]);

  const handleViewChart = useCallback(() => {
    if (!rewardSlashes) return;
    setChartModalOpen(true);
  }, [setChartModalOpen, rewardSlashes]);

  const getAmountToConfirm = useCallback(() => {
    switch (state) {
      case ('unstake'):
        return unstakeAmount;
      case ('joinPool'):
      case ('createPool'):
      case ('bondExtra'):
        return stakeAmount;
      case ('withdrawUnbound'):
        return myPool?.redeemable ? new BN(myPool?.redeemable) : BN_ZERO;
      case ('withdrawClaimable'):
        return myPool?.myClaimable ? new BN(myPool?.myClaimable) : BN_ZERO;
      default:
        return BN_ZERO;
    }
  }, [state, unstakeAmount, stakeAmount, myPool]);

  useEffect(() => {
    if (!myPool?.accounts?.stashId) return;

    const active = nominatedValidators?.find((n) => n.exposure.others.find(({ who }) => who.toString() === myPool.accounts.stashId));

    setActiveValidator(active);
  }, [myPool?.accounts, nominatedValidators]);

  const PoolsIcon = useMemo((): React.ReactElement<any> => (
    !poolsInfo ? <CircularProgress size={12} thickness={2} /> : <WorkspacesOutlinedIcon fontSize='small' />
  ), [poolsInfo]);

  const NominationsIcon = useMemo((): React.ReactElement<any> => (
    gettingNominatedValidatorsInfoFromChain
      ? <CircularProgress size={12} sx={{ px: '5px' }} thickness={2} />
      : Number(currentlyStakedInHuman) && !nominatedValidators?.length
        ? <Hint id='noNominees' place='top' tip={t('No validators nominated')}>
          <NotificationsActiveIcon color='error' fontSize='small' sx={{ pr: 1 }} />
        </Hint>
        : !activeValidator && nominatedValidators?.length
          ? <Hint id='noActive' place='top' tip={t('No active validator in this era')}>
            <ReportOutlinedIcon color='warning' fontSize='small' sx={{ pr: 1 }} />
          </Hint>
          : oversubscribedsCount
            ? <Hint id='overSubscribeds' place='top' tip={t('oversubscribed nominees')}>
              <Badge anchorOrigin={{ horizontal: 'left', vertical: 'top' }} badgeContent={oversubscribedsCount} color='warning'>
                <NotificationImportantOutlinedIcon color='action' fontSize='small' sx={{ pr: 1 }} />
              </Badge>
            </Hint>
            : <PanToolOutlinedIcon sx={{ fontSize: '17px' }} />
  ), [gettingNominatedValidatorsInfoFromChain, currentlyStakedInHuman, nominatedValidators?.length, t, activeValidator, oversubscribedsCount]);

  return (
    <Popup handleClose={handlePoolStakingModalClose} showModal={showStakingModal}>

      <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<GroupWorkOutlinedIcon fontSize='small' />} title={'Pool Staking'} />

      <Grid alignItems='center' container>
        <Grid container item xs={12}>
          <Overview
            api={api}
            availableBalanceInHuman={availableBalanceInHuman}
            handleViewChart={handleViewChart}
            handleWithdrawClaimable={handleWithdrawClaimable}
            handleWithdrawUnbounded={handleWithdrawUnbounded}
            myPool={myPool}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs centered indicatorColor='secondary' onChange={handleTabChange} textColor='secondary' value={tabValue}>
              <Tab icon={<AddCircleOutlineOutlinedIcon fontSize='small' />} iconPosition='start' label='Stake' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={<RemoveCircleOutlineOutlinedIcon fontSize='small' />} iconPosition='start' label='Unstake' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={PoolsIcon} iconPosition='start' label='Pool' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={NominationsIcon} iconPosition='start' label='Nominations' sx={{ fontSize: 11, px: '15px' }} />
              <Tab icon={!poolsInfo ? <CircularProgress size={12} thickness={2} /> : <InfoOutlinedIcon fontSize='small' />}
                iconPosition='start' label='Info' sx={{ fontSize: 11, px: '15px' }}
              />
            </Tabs>
          </Box>
          <TabPanel index={0} value={tabValue}>
            <Stake
              api={api}
              chain={chain}
              currentlyStakedInHuman={currentlyStakedInHuman}
              handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
              myPool={myPool}
              nextPoolId={poolsInfo?.length ? new BN(poolsInfo?.length + 1) : BN_ONE}
              nextToStakeButtonBusy={!!stakeAmount && (!(validatorsInfoIsUpdated || localStrorageIsUpdate)) && state !== ''}
              poolStakingConsts={poolStakingConsts}
              poolsInfo={poolsInfo}
              poolsMembers={poolsMembers}
              setNewPool={setNewPool}
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
              handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
              member={myPool?.member}
              nextToUnStakeButtonBusy={state === 'unstake'}
              setState={setState}
              setUnstakeAmount={setUnstakeAmount}
              stakingConsts={stakingConsts}
            />
          </TabPanel>
          <TabPanel index={2} padding={1} value={tabValue}>
            <PoolTab
              api={api}
              chain={chain}
              myPool={myPool}
              poolsMembers={poolsMembers}
              staker={staker}
            />
          </TabPanel>
          <TabPanel index={3} padding={1} value={tabValue}>
            <Nominations
              activeValidator={activeValidator}
              api={api}
              chain={chain}
              handleSelectValidatorsModalOpen={handleSelectValidatorsModalOpen}
              handleStopNominating={handleStopNominating}
              myPool={myPool}
              noNominatedValidators={noNominatedValidators}
              nominatedValidators={nominatedValidators}
              nominatorInfo={nominatorInfo}
              poolStakingConsts={poolStakingConsts}
              staker={staker}
              stakingConsts={stakingConsts}
              state={state}
              validatorsIdentities={validatorsIdentities}
              validatorsInfo={validatorsInfo}
            />
          </TabPanel>
          <TabPanel index={4} value={tabValue}>
            <InfoTab
              api={api}
              info={poolStakingConsts}
            />
          </TabPanel>
        </Grid>
      </Grid>

      {stakingConsts && validatorsInfo && showSelectValidatorsModal &&
        <SelectValidators
          api={api}
          chain={chain}
          nominatedValidators={nominatedValidators}
          pool={myPool}
          poolsMembers={poolsMembers}
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
      {((showConfirmStakingModal && staker && (selectedValidators || nominatedValidators) && state !== '') || state === 'stopNominating') && api && (myPool || newPool) &&
        <ConfirmStaking
          amount={getAmountToConfirm()}
          api={api}
          chain={chain}
          handlePoolStakingModalClose={handlePoolStakingModalClose}
          nextPoolId={poolsInfo?.length ? new BN(poolsInfo?.length + 1) : BN_ONE}
          nominatedValidators={nominatedValidators}
          pool={['createPool', 'joinPool'].includes(state) ? newPool : myPool}
          poolsMembers={poolsMembers}
          selectedValidators={selectedValidators}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setNewPool={setNewPool}
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
