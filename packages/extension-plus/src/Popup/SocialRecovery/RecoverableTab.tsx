/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component renders make/remove recoverable tab in social recovery
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { AddCircleRounded as AddCircleRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';
import { Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import React, { useState, useCallback, useEffect } from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Hint, Identity } from '../../components';

import { NextStepButton } from '@polkadot/extension-ui/components';
import { Chain } from '@polkadot/extension-chains/types';
import { grey } from '@mui/material/colors';
import { nameAddress, RecoveryConsts } from '../../util/plusTypes';
import AddFriend from './AddFriend';
import Confirm from './Confirm';
import { ApiPromise } from '@polkadot/api';

interface Props {
  account: DeriveAccountInfo | undefined;
  chain: Chain | null;
  recoveryInfo: PalletRecoveryRecoveryConfig | undefined | null;
  recoveryConsts: RecoveryConsts | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  addresesOnThisChain: nameAddress[];
  api: ApiPromise | undefined;
}

function RecoverableTab({ account, accountsInfo, addresesOnThisChain, api, chain, recoveryConsts, recoveryInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [recoveryThreshold, setRecoveryThreshold] = useState<number>(0);
  const [recoveryDelay, setRecoveryDelay] = useState<number>(0);
  const [friends, setFriends] = useState<DeriveAccountInfo[]>([]);
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();

  const handleRecoveryThreshold = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    const nodecimalValue = event.target.value.replace('.', '');

    setRecoveryThreshold(Number(nodecimalValue));
  }, [setRecoveryThreshold]);

  const handleAddFriend = useCallback(() => {
    setShowAddFriendModal(true);
  }, []);

  const handleDeleteFriend = useCallback((index: number) => {
    friends.splice(index, 1);
    setFriends([...friends]);
  }, [friends]);

  const handleRecoveryDelay = useCallback((event: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>) => {
    setRecoveryDelay(Number(event.target.value));
  }, [setRecoveryDelay]);

  const handleNext = useCallback(() => {
    recoveryInfo ? setState('removeRecovery') : setState('makeRecoverable');
    setConfirmModalOpen(true);
  }, [recoveryInfo]);

  useEffect(() => {
    if (!recoveryInfo) { return; }

    setRecoveryThreshold(recoveryInfo.threshold.toNumber());
    const recoveryDelayInDays = recoveryInfo.delayPeriod.toNumber() / (24 * 60 * 10);

    setRecoveryDelay(recoveryDelayInDays);
    const onChainFriends = recoveryInfo.friends.map((f): DeriveAccountInfo => {
      const accountInfo = accountsInfo?.find((a) => a?.accountId?.toString() === f.toString());

      return accountInfo ?? { accountId: f, identity: undefined } as unknown as DeriveAccountInfo;
    });

    setFriends(onChainFriends);
  }, [recoveryInfo, accountsInfo]);

  return (
    <>
      <Grid item p='0px 15px 0px' sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {recoveryInfo
          ? <Typography sx={{ color: 'text.primary' }} variant='overline'>
            {t('Remove recovery')}
          </Typography>
          : <Typography sx={{ color: 'text.primary' }} variant='overline'>
            {t('Make recoverable')}
          </Typography>
        }
      </Grid>
      <Grid alignItems='center' container item justifyContent='space-between' pb='2px' pt='20px' xs={12}>
        <Grid item p='7px 15px 7px'>
          <Typography sx={{ color: 'text.primary' }} variant='body2'>
            {t('Your recovery friends')} {!!friends?.length && `(${friends?.length})`}:
          </Typography>
        </Grid>
        <Grid item>
          {!recoveryInfo && (recoveryConsts && friends.length < recoveryConsts.maxFriends) &&
            <Hint id='addFriend' place='left' tip={t('add a friend')}>
              <IconButton aria-label='addFriend' color='warning' onClick={handleAddFriend} size='small'>
                <AddCircleRoundedIcon sx={{ fontSize: 25 }} />
              </IconButton>
            </Hint>
          }
        </Grid>
      </Grid>
      <Grid alignItems='center' container item justifyContent='center' sx={{ bgcolor: 'white', border: '1px solid', borderColor: grey[600], borderRadius: 5, fontSize: 12, height: '200px', overflowY: 'auto' }} xs={12}>
        {friends?.length
          ? friends?.map((f, index) => (
            <Grid alignItems='flex-start' container item justifyContent='space-between' key={index} sx={{ pl: 1 }} xs={12}>
              <Grid item xs={11}>
                <Identity accountInfo={f} chain={chain} showAddress />
              </Grid>
              {!recoveryInfo &&
                <Grid item xs={1}>
                  <Hint id='deleteFriend' place='left' tip={t('add a friend')}>
                    <IconButton aria-label='deleteFriend' color='error' onClick={() => handleDeleteFriend(index)} size='small'>
                      <ClearIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Hint>
                </Grid>
              }
            </Grid>
          ))
          : <Grid alignItems='center' container justifyContent='center' sx={{ px: 3 }} xs={12}>
            <Grid item>
              <Typography sx={{ color: 'text.secondary' }} variant='caption'>
                {t('No friends are added yet!')}
              </Typography>
            </Grid>
          </Grid>
        }
      </Grid>
      <Grid container item justifyContent='space-between' spacing={1.5} sx={{ mt: '25px' }} xs={12}>
        <Grid alignItems='center' container justifyContent='flex-start' xs={6}>
          <Grid item xs={1}>
            <Hint icon id='recoveryThreshold' place='top' tip='The threshold of vouches that is to be reached to recover the account'>
            </Hint>
          </Grid>
          <Grid item xs={10}>
            <TextField
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (<InputAdornment position='end'>{t('friend(s)')}</InputAdornment>),
                inputProps: { max: recoveryConsts?.maxFriends ?? 9, min: 1 }
              }}
              color='warning'
              disabled={!!recoveryInfo}
              error={!recoveryThreshold || recoveryThreshold > friends?.length}
              fullWidth
              inputProps={{ step: '1' }}
              label={t('Recovery threshold')}
              name='recoveryThreshold'
              onChange={handleRecoveryThreshold}
              placeholder='0'
              type='number'
              value={recoveryThreshold}
              variant='outlined'
            />
          </Grid>
        </Grid>
        <Grid alignItems='center' container justifyContent='flex-end' xs={6}>
          <Grid item xs={1}>
            <Hint icon id='recoveryDelay' place='top' tip='The delay after a recovery attempt is initialized that needs to pass before the account can be recovered' >
            </Hint>
          </Grid>
          <Grid item xs={10}>
            <TextField
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (<InputAdornment position='end'>{t('day(s)')}</InputAdornment>),
                inputProps: { min: 0 }
              }}
              color='warning'
              disabled={!!recoveryInfo}
              fullWidth
              inputProps={{ step: '1' }}
              label={t('Recovery delay')}
              name='recoveryDelay'
              onChange={handleRecoveryDelay}
              placeholder='0'
              type='number'
              value={recoveryDelay}
              variant='outlined'
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid item sx={{ pt: '25px' }} xs={12}>
        <NextStepButton
          data-button-action='next'
          isDisabled={!recoveryThreshold || !friends?.length || recoveryThreshold > friends?.length}
          onClick={handleNext}
        >
          {recoveryInfo ? t('Next to remove recovery') : t('Next')}
        </NextStepButton>
      </Grid>
      {showAddFriendModal &&
        <AddFriend
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          friends={friends}
          setFriends={setFriends}
          setShowAddFriendModal={setShowAddFriendModal}
          showAddFriendModal={showAddFriendModal}
        />}
      {showConfirmModal && api && chain && state && account && recoveryConsts &&
        <Confirm
          account={account}
          api={api}
          chain={chain}
          friends={friends}
          lostAccount={account}
          recoveryConsts={recoveryConsts}
          recoveryDelay={recoveryDelay}
          recoveryThreshold={recoveryThreshold}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
        />
      }

    </>
  );
}

export default React.memo(RecoverableTab);
