// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description here a pool metaData and roles can be edited by root!
 *
 * */

import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { ThemeProps } from '../../../../../extension-ui/src/types';
import type { AccountsBalanceType, MyPoolInfo, PoolStakingConsts } from '../../../util/plusTypes';

import { Pool as PoolIcon } from '@mui/icons-material';
import { Button, Grid, InputAdornment, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { BN, BN_ZERO } from '@polkadot/util';

import { BackButton, NextStepButton } from '../../../../../extension-ui/src/components';
import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { AddressInput, PlusHeader, Popup, ShowBalance2 } from '../../../components';
import { EXTENSION_NAME } from '../../../util/constants';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint } from '../../../util/plusUtils';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  chain: Chain;
  className?: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  showEditPoolModal: boolean;
  staker: AccountsBalanceType;
  setEditPoolModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleConfirmStakingModaOpen: () => void;
  pool: MyPoolInfo;
  setNewPool: React.Dispatch<React.SetStateAction<MyPoolInfo | undefined>>;
  newPool: MyPoolInfo | undefined;

}

function EditPool({ api, chain, className, newPool, setNewPool, handleConfirmStakingModaOpen, pool, setEditPoolModalOpen, setState, showEditPoolModal, staker }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [alert, setAlert] = useState<string | undefined>();
  const [metaData, setMetaData] = useState<string | undefined>(pool?.metadata);
  const [root, setRoot] = useState<string>(pool?.bondedPool?.roles?.root);
  const [nominator, setNominator] = useState<string>(pool?.bondedPool?.roles?.nominator);
  const [stateToggler, setStateToggler] = useState<string>(pool?.bondedPool?.roles?.stateToggler);
  const [stakeAmountInHuman, setStakeAmountInHuman] = useState<string>('0');
  const [availableBalanceInHuman, setAvailableBalanceInHuman] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<Balance | undefined>();
  const [estimatedMaxFee, setEstimatedMaxFee] = useState<Balance | undefined>();
  const [nextToStakeButtonDisabled, setNextToStakeButtonDisabled] = useState(true);

  const decimals = api ? api.registry.chainDecimals[0] : 1;
  const token = api ? api.registry.chainTokens[0] : '';
  const existentialDeposit = useMemo(() => api ? new BN(api.consts.balances.existentialDeposit.toString()) : BN_ZERO, [api]);
  const realStakingAmount = useMemo(() => {
    const amount = new BN(String(amountToMachine(stakeAmountInHuman, decimals))).sub(existentialDeposit)

    return amount.lt(BN_ZERO) ? BN_ZERO : amount;
  }, [decimals, existentialDeposit, stakeAmountInHuman]);// an ED goes to rewardId

  useEffect(() => {
    if (!realStakingAmount) return;
    api && api.tx.nominationPools.create(String(realStakingAmount), root, nominator, stateToggler).paymentInfo(staker.address).then((i) => {
      const createFee = i?.partialFee;

      api.tx.nominationPools.setMetadata(1, metaData).paymentInfo(staker.address)
        .then((i) => setEstimatedFee(api.createType('Balance', createFee.add(i?.partialFee))))
        .catch(console.error);
    });

    api && api.tx.nominationPools.create(String(staker?.balanceInfo?.available ?? realStakingAmount), root, nominator, stateToggler).paymentInfo(staker.address).then((i) => {
      const createFee = i?.partialFee;

      api.tx.nominationPools.setMetadata(1, metaData).paymentInfo(staker.address)
        .then((i) => setEstimatedMaxFee(api.createType('Balance', createFee.add(i?.partialFee))))
        .catch(console.error);
    });
  }, [api, nominator, metaData, root, staker.address, realStakingAmount, stateToggler, staker?.balanceInfo?.available]);

  useEffect(() => {
    setNewPool(JSON.parse(JSON.stringify(pool)) as MyPoolInfo);
  }, [pool, setNewPool]);

  useEffect(() => {
    if (!newPool) return;

    const tempPool = { ...newPool };

    tempPool.metadata = metaData;
    tempPool.bondedPool.roles.root = root;
    tempPool.bondedPool.roles.nominator = nominator;
    tempPool.bondedPool.roles.stateToggler = stateToggler;

    setNewPool(tempPool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominator, metaData, root, stateToggler, pool, setNewPool]);

  useEffect(() => {
    if (!staker?.balanceInfo?.available) { return; }

    setAvailableBalanceInHuman(balanceToHuman(staker, 'available'));
  }, [staker, staker?.balanceInfo?.available]);

  const handleEditPoolModalClose = useCallback(() => {
    setEditPoolModalOpen(false);
    setState('');
  }, [setEditPoolModalOpen, setState]);

  return (
    <>
      <Popup handleClose={handleEditPoolModalClose} showModal={showEditPoolModal}>
        <PlusHeader action={handleEditPoolModalClose} chain={chain} closeText={'Close'} icon={<PoolIcon fontSize='small' />} title={'Edit Pool'} />
        <Grid container sx={{ pt: 2 }}>

          <Grid container item justifyContent='space-between' sx={{ fontSize: 12, p: '5px 40px 1px' }}>
            <Grid item sx={{ pr: '5px' }} xs={9}>
              <TextField
                InputLabelProps={{ shrink: true }}
                autoFocus
                color='warning'
                fullWidth
                helperText={''}
                inputProps={{ style: { padding: '12px' } }}
                label={t('Pool metadata')}
                name='metaData'
                onChange={(e) => setMetaData(e.target.value)}
                placeholder='enter pool metadata'
                sx={{ height: '20px' }}
                type='text'
                value={metaData}
                variant='outlined'
              />
            </Grid>
            <Grid item xs>
              <TextField
                InputLabelProps={{ shrink: true }}
                disabled
                fullWidth
                inputProps={{ style: { padding: '12px', textAlign: 'center' } }}
                label={t('Pool Id')}
                name='nextPoolId'
                type='text'
                value={String(pool?.member?.poolId ?? 0)}
                variant='outlined'
              />
            </Grid>
          </Grid>

          <Grid alignItems='center' color={grey[500]} container spacing={1} item justifyContent='flex-end' sx={{ fontSize: 11, p: '15px 40px 1px' }} xs>
            <Grid item>
              {t('Fee')}:
            </Grid>
            <Grid item>
              <ShowBalance2 api={api} balance={estimatedFee} />
            </Grid>
          </Grid>

          <Grid container item spacing={'10px'} sx={{ fontSize: 12, p: '45px 40px 5px' }}>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} disabled freeSolo selectedAddress={pool?.bondedPool?.roles?.depositor} title={t('Depositor')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} freeSolo selectedAddress={root} setSelectedAddress={setRoot} title={t('Root')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} freeSolo selectedAddress={nominator} setSelectedAddress={setNominator} title={t('Nominator')} />
            </Grid>
            <Grid item xs={12}>
              <AddressInput api={api} chain={chain} freeSolo selectedAddress={stateToggler} setSelectedAddress={setStateToggler} title={t('State toggler')} />
            </Grid>
          </Grid>

          <Grid container item sx={{ p: '10px 34px' }} xs={12}>
            <Grid item xs={1}>
              <BackButton onClick={handleEditPoolModalClose} />
            </Grid>
            <Grid item sx={{ pl: 1 }} xs>
              <NextStepButton
                data-button-action='next to stake'
                isDisabled={JSON.stringify(pool) === JSON.stringify(newPool)}
                onClick={handleConfirmStakingModaOpen}
              >
                {t('Next')}
              </NextStepButton>
            </Grid>
          </Grid>

        </Grid>
      </Popup>
    </>
  );
}

export default styled(EditPool)`
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
