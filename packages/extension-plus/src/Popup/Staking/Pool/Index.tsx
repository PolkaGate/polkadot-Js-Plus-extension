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
import type { AccountId, AccountId32 } from '@polkadot/types/interfaces';
import type { PalletNominationPoolsPoolMember } from '@polkadot/types/lookup';
import type { AccountsBalanceType, MembersMapEntry, MyPoolInfo, PoolInfo, PoolStakingConsts, SavedMetaData, StakingConsts, Validators } from '../../../util/plusTypes';

import { AddCircleOutlineOutlined as AddCircleOutlineOutlinedIcon, GroupWorkOutlined as GroupWorkOutlinedIcon, InfoOutlined as InfoOutlinedIcon, NotificationImportantOutlined as NotificationImportantOutlinedIcon, NotificationsActive as NotificationsActiveIcon, PanToolOutlined as PanToolOutlinedIcon, RemoveCircleOutlineOutlined as RemoveCircleOutlineOutlinedIcon, ReportOutlined as ReportOutlinedIcon, WorkspacesOutlined as WorkspacesOutlinedIcon } from '@mui/icons-material';
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
import { useMapEntries } from '../../../hooks';
import { getStakingReward } from '../../../util/api/staking';
import { MAX_ACCEPTED_COMMISSION } from '../../../util/constants';
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

  const [poolsInfo, setPoolsInfo] = useState<PoolInfo[] | undefined | null>(undefined);
  const [myPool, setMyPool] = useState<MyPoolInfo | undefined | null>(undefined);
  const [newPool, setNewPool] = useState<MyPoolInfo | undefined>();
  const [redeemable, setRedeemable] = useState<BN | undefined>();
  const [unlockingAmount, setUnlockingAmount] = useState<BN | undefined>();
  const [nextPoolId, setNextPoolId] = useState<BN | undefined>();
  const [gettingIdentities, setGettingIdentities] = useState<boolean>(false);

  const [gettingNominatedValidatorsInfoFromChain, setGettingNominatedValidatorsInfoFromChain] = useState<boolean>(true);
  const [totalReceivedReward, setTotalReceivedReward] = useState<string>();
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);
  const [showChartModal, setChartModalOpen] = useState<boolean>(false);
  const [showSelectValidatorsModal, setSelectValidatorsModalOpen] = useState<boolean>(false);
  const [amount, setAmount] = useState<BN>(BN_ZERO);
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [currentlyStaked, setCurrentlyStaked] = useState<BN | undefined | null>(undefined);
  const [validatorsInfo, setValidatorsInfo] = useState<Validators | null>(null); // validatorsInfo is all validators (current and waiting) information
  const [validatorsIdentities, setValidatorsIdentities] = useState<DeriveAccountInfo[] | null>(null);
  const [validatorsInfoIsUpdated, setValidatorsInfoIsUpdated] = useState<boolean>(false);
  const [selectedValidators, setSelectedValidatorsAcounts] = useState<DeriveStakingQuery[] | null>(null);
  const [nominatedValidatorsId, setNominatedValidatorsId] = useState<string[] | undefined>();
  const [noNominatedValidators, setNoNominatedValidators] = useState<boolean | undefined>();// if TRUE, shows that nominators are fetched but is empty
  const [nominatedValidators, setNominatedValidatorsInfo] = useState<DeriveStakingQuery[] | null>(null);
  const [state, setState] = useState<string>('');
  const [tabValue, setTabValue] = useState(4);
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

        return;
      }

      const parsedInfo = JSON.parse(info) as MyPoolInfo;

      setNoNominatedValidators(!parsedInfo.stashIdAccount.nominators.length);

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

      if (!poolsInfo) {
        return setPoolsInfo(null);// noo pools found, probably never happens
      }

      const parsedPoolsInfo = JSON.parse(poolsInfo);
      const info = parsedPoolsInfo.info as PoolInfo[];

      setNextPoolId(new BN(parsedPoolsInfo.nextPoolId));

      info?.forEach((p: PoolInfo) => {
        p.bondedPool.points = p?.bondedPool?.points ? new BN(p.bondedPool.points as string) : BN_ZERO;
        p.poolId = new BN(p.poolId);
      });

      setPoolsInfo(info);

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

  useEffect(() => {
    if (myPool === undefined || !api || !currentEraIndex) { return; }

    let unlockingValue = BN_ZERO;
    let redeemValue = BN_ZERO;

    if (myPool !== null) { // if pool is fetched but account belongs to no pool then pool===null
      for (const [era, unbondingPoint] of Object.entries(myPool.member?.unbondingEras)) {
        if (currentEraIndex > Number(era)) { redeemValue = redeemValue.add(new BN(unbondingPoint as string)); }
        else { unlockingValue = unlockingValue.add(new BN(unbondingPoint as string)); }
      }
    }

    setRedeemable(redeemValue);
    setUnlockingAmount(unlockingValue);
  }, [myPool, api, currentEraIndex]);

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

  // useEffect(() => {
  //   /**  get nominator staking info to consider rebag ,... */
  //   endpoint && myPool && getNominatorInfo(endpoint, myPool.accounts.stashId);
  // }, [endpoint, myPool]);

  const getValidatorsIdentities = useCallback((endpoint: string, validatorsAccountIds: AccountId[]) => {
    /** get validators identities */

    setGettingIdentities(true);
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
        setGettingIdentities(false);
        // eslint-disable-next-line no-void
        void updateMeta(account.address, prepareMetaData(chain, 'validatorsIdentities', fetchedIdentities));
      }

      getValidatorsIdWorker.terminate();
    };
  }, [account.address, chain, validatorsIdentities]);

  useEffect(() => {
    if (!validatorsInfoIsUpdated || !validatorsInfo?.current.length) { return; }

    const validatorsAccountIds = validatorsInfo.current.map((v) => v.accountId).concat(validatorsInfo.waiting.map((v) => v.accountId));

    endpoint && !gettingIdentities && getValidatorsIdentities(endpoint, validatorsAccountIds);
  }, [validatorsInfoIsUpdated, validatorsInfo, endpoint, account.address, getValidatorsIdentities, gettingIdentities]);

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

    if (myPool === null || myPool?.bondedPool?.points === 0) { return setCurrentlyStaked(BN_ZERO); }

    const staked = new BN(myPool.member.points).mul(new BN(myPool.stashIdAccount.stakingLedger.active)).div(new BN(myPool.bondedPool.points));

    setCurrentlyStaked(staked);
  }, [myPool, decimals]);

  useEffect(() => {
    if (!account) {
      console.log(' no account, wait for it...!..');

      return;
    }

    // *** retrive nominated validators from local sorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nominatedValidatorsInfoFromLocalStrorage: SavedMetaData = account?.poolNominatedValidators ? JSON.parse(account.poolNominatedValidators) : null;

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

      // eslint-disable-next-line no-void
      void updateMeta(account.address, prepareMetaData(chain, 'poolNominatedValidators', nominations));
    }
  }, [nominatedValidatorsId, validatorsInfo, chain, account.address]);

  useEffect(() => {
    if (noNominatedValidators) {
      console.log('Clear saved poolNominatedValidators');

      // eslint-disable-next-line no-void
      void updateMeta(account.address, prepareMetaData(chain, 'poolNominatedValidators', []));
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

  const handleConfirmStakingModaOpen = useCallback((state?: string, amount?: BN): void => {
    if (amount?.gtn(0) && state) {
      setState(state);
      setAmount(amount);
    }

    setConfirmStakingModalOpen(true);
  }, []);

  const handleSelectValidatorsModalOpen = useCallback((isSetNominees = false): void => {
    setSelectValidatorsModalOpen(true);

    isSetNominees ? setState('setNominees') : setState('changeValidators');
  }, []);

  const handleStopNominating = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('stopNominating');
  }, [handleConfirmStakingModaOpen, state]);

  const handleRebag = useCallback((): void => {
    handleConfirmStakingModaOpen();

    if (!state) setState('tuneUp');
  }, [handleConfirmStakingModaOpen, state]);

  const handleViewChart = useCallback(() => {
    if (!rewardSlashes) return;
    setChartModalOpen(true);
  }, [setChartModalOpen, rewardSlashes]);

  const getAmountToConfirm = useCallback(() => {
    switch (state) {
      case ('unstake'):
      case ('joinPool'):
      case ('createPool'):
      case ('bondExtra'):
      case ('bondExtraRewards'):
      case ('withdrawClaimable'):
      case ('withdrawUnbound'):
        return amount;
      default:
        return BN_ZERO;
    }
  }, [state, amount]);

  useEffect(() => {
    if (!myPool?.accounts?.stashId) return;

    const active = nominatedValidators?.find((n) => n.exposure.others.find(({ who }) => who.toString() === myPool.accounts.stashId));

    setActiveValidator(active);
  }, [myPool?.accounts, nominatedValidators]);

  const PoolsIcon = useMemo((): React.ReactElement<any> => (
    poolsInfo === undefined ? <CircularProgress size={12} thickness={2} /> : <WorkspacesOutlinedIcon fontSize='small' />
  ), [poolsInfo]);

  const NominationsIcon = useMemo((): React.ReactElement<any> => (
    gettingNominatedValidatorsInfoFromChain
      ? <CircularProgress size={12} sx={{ px: '5px' }} thickness={2} />
      : currentlyStaked && !nominatedValidators?.length
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
  ), [gettingNominatedValidatorsInfoFromChain, currentlyStaked, nominatedValidators?.length, t, activeValidator, oversubscribedsCount]);

  return (
    <Popup handleClose={handlePoolStakingModalClose} showModal={showStakingModal}>

      <PlusHeader action={handlePoolStakingModalClose} chain={chain} closeText={'Close'} icon={<GroupWorkOutlinedIcon fontSize='small' />} title={'Pool Staking'} />

      <Grid alignItems='center' container>
        <Grid container item xs={12}>
          <Overview
            api={api}
            availableBalance={staker?.balanceInfo?.available ? new BN(staker.balanceInfo.available) : BN_ZERO}
            handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
            handleViewChart={handleViewChart}
            myPool={myPool}
            redeemable={redeemable}
            unlockingAmount={unlockingAmount}
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
              currentlyStaked={currentlyStaked}
              handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
              myPool={myPool}
              nextPoolId={nextPoolId}
              nextToStakeButtonBusy={!!amount && state !== ''}
              poolStakingConsts={poolStakingConsts}
              poolsInfo={poolsInfo}
              poolsMembers={poolsMembers}
              setNewPool={setNewPool}
              setStakeAmount={setAmount}
              setState={setState}
              staker={staker}
              state={state}
            />
          </TabPanel>
          <TabPanel index={1} value={tabValue}>
            <Unstake
              api={api}
              availableBalance={staker?.balanceInfo?.available ? new BN(staker?.balanceInfo?.available) : BN_ZERO}
              currentlyStaked={currentlyStaked}
              handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
              nextToUnStakeButtonBusy={state === 'unstake'}
              pool={myPool}
              poolStakingConsts={poolStakingConsts}
              staker={staker}
            />
          </TabPanel>
          <TabPanel index={2} padding={1} value={tabValue}>
            <PoolTab
              api={api}
              chain={chain}
              handleConfirmStakingModaOpen={handleConfirmStakingModaOpen}
              pool={myPool}
              poolsMembers={poolsMembers}
              setState={setState}
              staker={staker}
            />
          </TabPanel>
          <TabPanel index={3} padding={1} value={tabValue}>
            <Nominations
              activeValidator={activeValidator}
              api={api}
              chain={chain}
              endpoint={endpoint}
              getPoolInfo={getPoolInfo}
              handleSelectValidatorsModalOpen={handleSelectValidatorsModalOpen}
              handleStopNominating={handleStopNominating}
              myPool={myPool}
              noNominatedValidators={noNominatedValidators}
              nominatedValidators={nominatedValidators}
              nominatorInfo={nominatorInfo}
              poolStakingConsts={poolStakingConsts}
              setNoNominatedValidators={setNoNominatedValidators}
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
          stakeAmount={amount}
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
          nextPoolId={nextPoolId}
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
