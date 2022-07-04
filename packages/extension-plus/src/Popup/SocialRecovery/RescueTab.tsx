/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component renders make recoverable tab in social recovery
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import { AddCircleRounded as AddCircleRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';
import { Avatar, Grid, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import React, { useCallback, useState } from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Hint, Identity, ShowBalance2 } from '../../components';
import { nameAddress, RecoveryConsts } from '../../util/plusTypes';

import { NextStepButton } from '@polkadot/extension-ui/components';
import { Chain } from '@polkadot/extension-chains/types';
import { grey } from '@mui/material/colors';
import AsResuer from './AsRescuer';
import AsFriend from './AsFriend';
import type { ApiPromise } from '@polkadot/api';

interface Props {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  chain: Chain | null;
  recoveryConsts: RecoveryConsts | undefined;
  addresesOnThisChain: nameAddress[];
}

function RecoveryTab({ account, accountsInfo, addresesOnThisChain, api, chain, recoveryConsts }: Props): React.ReactElement<Props> {
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

  const RecovererChoice = () => (
    <Grid container justifyContent='center' sx={{ pt: 15 }}>
      <Grid container item justifyContent='center' sx={{ fontSize: 12 }} xs={6}>
        <Grid item>
          <Avatar onClick={handleRescuer} sx={{ bgcolor: '#1c4a5a', boxShadow: `2px 4px 10px 4px ${grey[400]}`, color: '#ffb057', cursor: 'pointer', height: 120, width: 120 }}>{t('as Rescuer')}</Avatar>
        </Grid>
      </Grid>
      <Grid container item justifyContent='center' sx={{ fontSize: 12 }} xs={6}>
        <Grid item>
          <Avatar onClick={handleFriend} sx={{ bgcolor: '#ffb057', boxShadow: `2px 4px 10px 4px ${grey[400]}`, color: '#1c4a5a', cursor: 'pointer', height: 120, width: 120 }}>{t('as Friend')}</Avatar>
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <>
      {!recoverer && <RecovererChoice />}
      {recoverer === 'rescuer' &&
        <AsResuer
          account={account}
          accountsInfo={accountsInfo}
          api={api}
          handleCloseAsRescuer={handleCloseAsRescuer}
          recoveryConsts={recoveryConsts}
          showAsRescuerModal={showAsRescuerModal}
          addresesOnThisChain={addresesOnThisChain}
        />
      }
      {recoverer === 'friend' &&
        <AsFriend
          account={account}
          accountsInfo={accountsInfo}
          api={api}
          handleCloseAsFriend={handleCloseAsFriend}
          recoveryConsts={recoveryConsts}
          showAsFriendModal={showAsFriendModal}
          addresesOnThisChain={addresesOnThisChain}
        />
      }
    </>
  );
}

export default React.memo(RecoveryTab);
