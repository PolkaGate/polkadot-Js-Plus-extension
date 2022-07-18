// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable simple-import-sort/imports */

/**
 * @description
 * this component renders make recoverable tab in social recovery
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

import { Avatar, Grid, Paper } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { Support as SupportIcon } from '@mui/icons-material';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { nameAddress, RecoveryConsts } from '../../util/plusTypes';

import { Chain } from '@polkadot/extension-chains/types';
import { grey } from '@mui/material/colors';
import AsResuer from './AsRescuer';
import AsFriend from './AsFriend';
import type { ApiPromise } from '@polkadot/api';
import { PlusHeader, Popup } from '../../components';

interface Props {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  chain: Chain | null;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
  showRescueModal: true;
  setRescueModalOpen: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}

function Rescue({ account, accountsInfo, addresesOnThisChain, api, chain, recoveryConsts, setRescueModalOpen, showRescueModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [recoverer, setRecoverer] = useState<string | undefined>();
  const [showAsRescuerModal, setShowAsRescuerModal] = useState<boolean>(false);
  const [showAsFriendModal, setShowAsFriendModal] = useState<boolean>(false);

  const handleRescuer = useCallback(() => {
    setRecoverer('rescuer');
    setShowAsRescuerModal(true);
  }, []);

  const handleFriend = useCallback(() => {
    setRecoverer('friend');
    setShowAsFriendModal(true);
  }, []);

  const handleCloseAsRescuer = useCallback(() => {
    setRecoverer(''); setShowAsRescuerModal(false);
  }, []);

  const handleCloseAsFriend = useCallback(() => {
    setRecoverer(''); setShowAsFriendModal(false);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setRescueModalOpen(false);
  }, [setRescueModalOpen]);

  const RecovererChoice = () => (
    <Grid container justifyContent='center' sx={{ pt: 15 }}>
      <Grid container item justifyContent='center' sx={{ fontSize: 12 }} xs={6}>
        <Grid item>
          <Avatar onClick={handleRescuer} sx={{ boxShadow: `2px 4px 10px 4px ${grey[300]}`, color: '#1c4a5a', cursor: 'pointer', height: 120, width: 120 }}>
            {t('as Rescuer')}
          </Avatar>
        </Grid>
      </Grid>
      <Grid container item justifyContent='center' sx={{ fontSize: 12 }} xs={6}>
        <Grid item>
          <Avatar onClick={handleFriend} sx={{ boxShadow: `2px 4px 10px 4px ${grey[300]}`, color: '#1c4a5a', cursor: 'pointer', height: 120, width: 120 }}>
            {t('as Friend')}
          </Avatar>
        </Grid>
      </Grid>
      <Grid alignItems='center' container justifyContent='space-around' px={3}>
        <Paper onClick={handleRescuer} sx={{ borderRadius: '10px', cursor: 'pointer', height: 160, pt: '15px', width: '45%' }}>
          <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, lineHeight: '25px', p: '15px' }}>
            {t('A rescuer can initiate the recovery of a lost account. If it receives enough vouchers, the lost account can be claimed.')}
          </Grid>
        </Paper>
        <Paper onClick={handleFriend} sx={{ borderRadius: '10px', cursor: 'pointer', height: 160, pt: '15px', width: '45%' }}>
          <Grid color={grey[500]} container justifyContent='center' sx={{ fontSize: 14, fontWeight: 500, lineHeight: '25px', p: '15px' }}>
            {t('An account, who has been set as a friend of a lost account, can vouch for recovering the lost account by a rescuer.')}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Popup handleClose={handleCloseModal} showModal={showRescueModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<SupportIcon fontSize='small' />} title={t<string>('Rescue another account')} />
      {!recoverer && <RecovererChoice />}
      {recoverer === 'rescuer' &&
        <AsResuer
          account={account}
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          api={api}
          handleCloseAsRescuer={handleCloseAsRescuer}
          recoveryConsts={recoveryConsts}
          showAsRescuerModal={showAsRescuerModal}
        />
      }
      {recoverer === 'friend' &&
        <AsFriend
          account={account}
          accountsInfo={accountsInfo}
          addresesOnThisChain={addresesOnThisChain}
          api={api}
          handleCloseAsFriend={handleCloseAsFriend}
          recoveryConsts={recoveryConsts}
          showAsFriendModal={showAsFriendModal}
        />
      }
    </Popup >
  );
}

export default React.memo(Rescue);
