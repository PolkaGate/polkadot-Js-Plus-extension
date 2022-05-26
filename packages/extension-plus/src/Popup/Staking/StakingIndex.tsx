// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/**
 * @description
 *  this component provides access to all easy staking where one can choose between Solo and Pool staking.
 * */

import type { Chain } from '@polkadot/extension-chains/types';
import type { StakingLedger } from '@polkadot/types/interfaces';
import type { AccountsBalanceType, NominatorInfo, PoolStakingConsts, SavedMetaData, StakingConsts } from '../../util/plusTypes';

import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CircleOutlined as CircleOutlinedIcon, GroupWorkOutlined as GroupWorkOutlinedIcon } from '@mui/icons-material';
import { Divider, Grid, Paper } from '@mui/material';
import { blue, green, grey, orange, red } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { updateMeta } from '@polkadot/extension-ui/messaging';
import { BN } from '@polkadot/util';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShowBalance2 } from '../../components';
import useEndPoint from '../../hooks/useEndPoint';
import { prepareMetaData } from '../../util/plusUtils';
import PoolStaking from './Pool/Index';
import SoloStaking from './Solo/Index';

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

const workers: Worker[] = [];

export default function StakingIndex({ account, api, chain, ledger, redeemable, setStakingModalOpen, showStakingModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const endpoint = useEndPoint(account, undefined, chain);
  const chainName = chain?.name.replace(' Relay Chain', '');

  const [stakingConsts, setStakingConsts] = useState<StakingConsts | undefined>();
  const [nominatorInfo, setNominatorInfo] = useState<NominatorInfo | undefined>();

  const [poolStakingOpen, setPoolStakingOpen] = useState<boolean>(false);
  const [soloStakingOpen, setSoloStakingOpen] = useState<boolean>(false);
  const [poolStakingConsts, setPoolStakingConsts] = useState<PoolStakingConsts | undefined>();

  const [stakingType, setStakingType] = useState<string | undefined>(undefined);

  const getStakingConsts = (chain: Chain, endpoint: string) => {
    /** 1- get some staking constant like min Nominator Bond ,... */
    const getStakingConstsWorker: Worker = new Worker(new URL('../../util/workers/getStakingConsts.js', import.meta.url));

    workers.push(getStakingConstsWorker);

    getStakingConstsWorker.postMessage({ endpoint });

    getStakingConstsWorker.onerror = (err) => {
      console.log(err);
    };

    getStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const c: StakingConsts = e.data;

      if (c) {
        setStakingConsts(c);

        if (staker?.address) {
          // eslint-disable-next-line no-void
          void updateMeta(account.address, prepareMetaData(chain, 'stakingConsts', JSON.stringify(c)));
        }
      }

      getStakingConstsWorker.terminate();
    };
  };

  const getPoolStakingConsts = (endpoint: string) => {
    const getPoolStakingConstsWorker: Worker = new Worker(new URL('../../util/workers/getPoolStakingConsts.js', import.meta.url));

    workers.push(getPoolStakingConstsWorker);

    getPoolStakingConstsWorker.postMessage({ endpoint });

    getPoolStakingConstsWorker.onerror = (err) => {
      console.log(err);
    };

    getPoolStakingConstsWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const c: PoolStakingConsts = e.data;

      if (c) {
        c.lastPoolId = new BN(c.lastPoolId);
        c.minCreateBond = new BN(c.minCreateBond);
        c.minJoinBond = new BN(c.minJoinBond);
        c.minNominatorBond = new BN(c.minNominatorBond);
        setPoolStakingConsts(c);

        console.log('poolStakingConst:', c);

        if (staker?.address) {
          // eslint-disable-next-line no-void
          void updateMeta(account.address, prepareMetaData(chain, 'poolStakingConsts', JSON.stringify(c)));
        }
      }

      getPoolStakingConstsWorker.terminate();
    };
  };

  const getNominatorInfo = (endpoint: string, stakerAddress: string) => {
    const getNominatorInfoWorker: Worker = new Worker(new URL('../../util/workers/getNominatorInfo.js', import.meta.url));

    workers.push(getNominatorInfoWorker);

    getNominatorInfoWorker.postMessage({ endpoint, stakerAddress });

    getNominatorInfoWorker.onerror = (err) => {
      console.log(err);
    };

    getNominatorInfoWorker.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const nominatorInfo: NominatorInfo = e.data;

      console.log('nominatorInfo:', nominatorInfo);

      setNominatorInfo(nominatorInfo);
      getNominatorInfoWorker.terminate();
    };
  };

  useEffect(() => {
    if (!account) {
      console.log(' no account, wait for it...!..');

      return;
    }

    console.log('Account:', account);

    // * retrive staking consts from local sorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const stakingConstsFromLocalStrorage: SavedMetaData = account?.stakingConsts ? JSON.parse(account.stakingConsts) : null;

    if (stakingConstsFromLocalStrorage?.metaData && stakingConstsFromLocalStrorage?.chainName === chainName) {
      console.log('stakingConsts from local:', JSON.parse(stakingConstsFromLocalStrorage.metaData as string));
      setStakingConsts(JSON.parse(stakingConstsFromLocalStrorage.metaData as string) as StakingConsts);
    }

    // * retrive pool staking consts from local sorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const poolStakingConstsFromLocalStrorage: SavedMetaData = account?.poolStakingConsts ? JSON.parse(account.poolStakingConsts) : null;

    if (poolStakingConstsFromLocalStrorage?.metaData && poolStakingConstsFromLocalStrorage?.chainName === chainName) {
      console.log('poolStakingConsts from local:', JSON.parse(poolStakingConstsFromLocalStrorage.metaData as string));

      const c = JSON.parse(poolStakingConstsFromLocalStrorage.metaData as string) as PoolStakingConsts;

      c.lastPoolId = new BN(c.lastPoolId, 'hex');
      c.minCreateBond = new BN(c.minCreateBond, 'hex');
      c.minJoinBond = new BN(c.minJoinBond, 'hex');
      c.minNominatorBond = new BN(c.minNominatorBond, 'hex');

      setPoolStakingConsts(c);
    }
  }, []);

  useEffect(() => {
    /** get some staking constant like min Nominator Bond ,... */
    endpoint && getStakingConsts(chain, endpoint);
    endpoint && getPoolStakingConsts(endpoint);

    /**  get nominator staking info to consider rebag ,... */
    endpoint && getNominatorInfo(endpoint, staker.address);
  }, [chain, endpoint, staker.address]);

  const handleStakingModalClose = useCallback((): void => {
    // should terminate workers
    workers.forEach((w) => w.terminate());

    setStakingModalOpen(false);
  }, [setStakingModalOpen]);

  const handlePoolStakingModalOpen = useCallback(() => {
    api?.tx?.nominationPools && setPoolStakingOpen(true);
  }, [api]);

  return (
    <Popup handleClose={handleStakingModalClose} showModal={showStakingModal}>

      <PlusHeader action={handleStakingModalClose} chain={chain} closeText={'Close'} icon={<FontAwesomeIcon icon={faCoins} size='sm' />} title={'Easy Staking'} />

      <Grid alignItems='center' container justifyContent='space-around' sx={{ p: '60px 10px' }}>
        <Paper elevation={stakingType === 'solo' ? 8 : 4} onClick={() => setSoloStakingOpen(true)} onMouseOver={() => setStakingType('solo')} sx={{ borderRadius: '10px', height: 380, pt: 1, width: '45%', cursor: 'pointer' }}>
          <Grid container justifyContent='center' sx={{ fontSize: 14, fontWeight: 700, py: 3 }}>
            <Grid color={blue[600]} item>
              <p>{t('SOLO STAKING')}</p>
            </Grid>
            <Grid item>
              <CircleOutlinedIcon sx={{ fontSize: 30, p: '10px 0 0 5px', color: blue[900] }} />
            </Grid>
          </Grid>

          <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, px: 2 }}>
            {t('Stakers (nominators) with sufficient amount of tokens can choose solo staking. Each solo staker will be responsible to nominate validators and keep eyes on them to re-nominate if needed.')}
          </Grid>

          <Grid item sx={{ fontSize: 12, p: '20px 10px' }} xs={12}>
            <Divider light />
          </Grid>

          <Grid color={grey[500]} container item justifyContent='space-between' sx={{ fontSize: 12, p: '10px 10px' }} xs={12}>
            <Grid item>
              {t('Min to receive reward')}:
            </Grid>
            <Grid item>
              <ShowBalance2 api={api} balance={nominatorInfo?.minNominated} />
            </Grid>
          </Grid>

        </Paper>

        <Paper elevation={stakingType === 'pool' ? 8 : 4} onClick={handlePoolStakingModalOpen} onMouseOver={() => setStakingType('pool')} sx={{ borderRadius: '10px', cursor: !(api && !api?.tx?.nominationPools) ? 'pointer' : '', height: 380, pt: 1, width: '45%' }}>
          <Grid container justifyContent='center' sx={{ fontSize: 14, fontWeight: 700, py: 3 }}>
            <Grid color={green[600]} item>
              <p>{t('POOL STAKING')}</p>
            </Grid>
            <Grid item>
              <GroupWorkOutlinedIcon sx={{ fontSize: 30, p: '10px 0 0 5px', color: green[900] }} />
            </Grid>
          </Grid>

          <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, px: 2 }}>
            {t('Stakers (members) with a small amount of tokens can pool their funds together and act as a single nominator. The earnings of the pool are split pro rata to a member\'s stake in the bonded pool.')}
          </Grid>

          <Grid item sx={{ fontSize: 12, p: '20px 10px' }} xs={12}>
            <Divider light />
          </Grid>

          {api && !api?.tx?.nominationPools
            ? <Grid color={red[600]} item sx={{ fontSize: 11, pt: '10px', textAlign: 'center' }}>
              {t('Pool staking is not available on {{chainName}} yet', { replace: { chainName: chainName } })}
            </Grid>
            : <Grid color={grey[500]} container item justifyContent='space-between' sx={{ fontSize: 12, p: '10px 10px' }} xs={12}>
              <Grid item>
                {t('Min to join a pool')}:
              </Grid>
              <Grid item>
                <ShowBalance2 api={api} balance={poolStakingConsts?.minJoinBond} />
              </Grid>
            </Grid>
          }

        </Paper>
      </Grid>

      {
        soloStakingOpen &&
        <SoloStaking
          account={account}
          api={api}
          chain={chain}
          endpoint={endpoint}
          ledger={ledger}
          nominatorInfo={nominatorInfo}
          redeemable={redeemable}
          setStakingModalOpen={setStakingModalOpen}
          showStakingModal={showStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
        />
      }

      {
        poolStakingOpen &&
        <PoolStaking
          account={account}
          api={api}
          chain={chain}
          endpoint={endpoint}
          poolStakingConsts={poolStakingConsts}
          setStakingModalOpen={setStakingModalOpen}
          showStakingModal={showStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
        />
      }

    </Popup >
  );
}
