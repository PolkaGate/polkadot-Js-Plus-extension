// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/**
 * @description
 *  this component provides access to allstaking stuff,including stake,
 *  unstake, redeem, change validators, staking generak info,etc.
 * */

import type { StakingLedger } from '@polkadot/types/interfaces';

import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CircleOutlined as CircleOutlinedIcon, GroupWorkOutlined as GroupWorkOutlinedIcon } from '@mui/icons-material';
import { Grid, Paper } from '@mui/material';
import { blue, green, grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup } from '../../components';
import { AccountsBalanceType } from '../../util/plusTypes';
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

export default function StakingIndex ({ account, api, chain, ledger, redeemable, setStakingModalOpen, showStakingModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [poolStakingOpen, setPoolStakingOpen] = useState<boolean>(false);
  const [soloStakingOpen, setSoloStakingOpen] = useState<boolean>(false);

  const [stakingType, setStakingType] = useState<string | undefined>(undefined);

  const handleStakingModalClose = useCallback((): void => {
    setStakingModalOpen(false);
  }, [setStakingModalOpen]);

  return (
    <Popup handleClose={handleStakingModalClose} showModal={showStakingModal}>

      <PlusHeader action={handleStakingModalClose} chain={chain} closeText={'Close'} icon={<FontAwesomeIcon icon={faCoins} size='sm' />} title={'Easy Staking'} />

      <Grid alignItems='center' container justifyContent='space-around' sx={{ p:'60px 20px' }}>
        <Paper elevation={stakingType === 'solo' ? 8 : 4} onClick={() => setSoloStakingOpen(true)} onMouseOver={() => setStakingType('solo')} sx={{ borderRadius: '10px', height: 300, pt: 1, width: '45%', cursor: 'pointer' }}>
          <Grid container justifyContent='center' sx={{ fontSize: 14, fontWeight: 700, py: 3 }}>
            <Grid color={blue[600]} item>
              <p>{t('SOLO STAKING')}</p>
            </Grid>
            <Grid item>
              <CircleOutlinedIcon sx={{ fontSize: 30, p: '10px 0 0 5px', color: blue[900] }} />
            </Grid>
          </Grid>

          <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, px: 2 }}>
            {t('If one has enough tokens to stake, solo staking can be chosen. The staker will be responsible to choose validators and keep eyes on them to re-moninate when needed.')}
          </Grid>
        </Paper>

        <Paper elevation={stakingType === 'pool' ? 8 : 4} onClick={() => setPoolStakingOpen(true)} onMouseOver={() => setStakingType('pool')} sx={{ borderRadius: '10px', height: 300, pt: 1, width: '45%', cursor: 'pointer' }}>
          <Grid container justifyContent='center' sx={{ fontSize: 14, fontWeight: 700, py: 3 }}>
            <Grid color={green[600]} item>
              <p>{t('POOL STAKING')}</p>
            </Grid>
            <Grid item>
              <GroupWorkOutlinedIcon sx={{ fontSize: 30, p: '10px 0 0 5px', color: green[900] }} />
            </Grid>
          </Grid>

          <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, px: 2 }}>
            {t('Stakers (delegators) with a small amount of tokens can pool their funds together and act as a single nominator. The earnings of the pool are split pro rata to a delegator\'s stake in the bonded pool.')}
          </Grid>
        </Paper>
      </Grid>

      {poolStakingOpen &&
        <PoolStaking
          account={account}
          api={api}
          chain={chain}
          ledger={ledger}
          redeemable={redeemable}
          setStakingModalOpen={setStakingModalOpen}
          showStakingModal={showStakingModal}
          staker={staker}
        />}

      {soloStakingOpen &&
        <SoloStaking
          account={account}
          api={api}
          chain={chain}
          ledger={ledger}
          name={name}
          setStakingModalOpen={setStakingModalOpen}
          showStakingModal={showStakingModal}
          staker={staker}
        />
      }
    </Popup>
  );
}
