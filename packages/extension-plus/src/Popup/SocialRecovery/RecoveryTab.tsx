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
import { RecoveryConsts } from '../../util/plusTypes';

import { NextStepButton } from '@polkadot/extension-ui/components';
import { Chain } from '@polkadot/extension-chains/types';
import { grey } from '@mui/material/colors';
import AsResuer from './AsRescuer';
import type { ApiPromise } from '@polkadot/api';

interface Props {
  api: ApiPromise | undefined;
  account: DeriveAccountInfo | undefined;
  accountsInfo: DeriveAccountInfo[] | undefined;
  chain: Chain | null;
  recoveryConsts: RecoveryConsts | undefined;
  recoveryInfo: PalletRecoveryRecoveryConfig | undefined;
}

function RecoveryTab({ api, account, accountsInfo, recoveryConsts, chain, recoveryInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const [recoverer, setRecoverer] = useState<string | undefined>();
  const [showAsRescuerModal, setShowAsRescuerModal] = useState<boolean>(false);

  const handleRescuer = useCallback(() => { setRecoverer('rescuer'); setShowAsRescuerModal(true) }, []);
  const handleFreind = useCallback(() => { setRecoverer('freind'); }, []);

  const handleCloseAsRescuer = useCallback(() => { setRecoverer(''); setShowAsRescuerModal(false); }, []);


  const RecovererChoice = () => (
    <Grid container justifyContent='center' sx={{ pt: 8 }}>
      <Grid container item justifyContent='center' sx={{ fontSize: 12 }} xs={6}>
        <Grid item>
          <Avatar onClick={handleRescuer} sx={{ bgcolor: '#1c4a5a', boxShadow: `2px 4px 10px 4px ${grey[400]}`, color: '#ffb057', cursor: 'pointer', height: 110, width: 110 }}>{t('as Rescuer')}</Avatar>
        </Grid>
      </Grid>
      <Grid container item justifyContent='center' sx={{ fontSize: 12 }} xs={6}>
        <Grid item>
          <Avatar onClick={handleFreind} sx={{ bgcolor: '#ffb057', boxShadow: `2px 4px 10px 4px ${grey[400]}`, color: '#1c4a5a', cursor: 'pointer', height: 110, width: 110 }}>{t('as Freind')}</Avatar>
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <>
      {!recoverer && <RecovererChoice />}
      {recoverer === 'rescuer' &&
        <AsResuer
          recoveryInfo={recoveryInfo}
          account={account}
          accountsInfo={accountsInfo}
          api={api}
          handleCloseAsRescuer={handleCloseAsRescuer}
          showAsRescuerModal={showAsRescuerModal}
          recoveryConsts={recoveryConsts}
        />
      }
    </>
  );
}

export default React.memo(RecoveryTab);
