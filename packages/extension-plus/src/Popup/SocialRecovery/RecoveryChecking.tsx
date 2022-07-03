/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens Close recovery for a named lost account
 * */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { PalletRecoveryRecoveryConfig } from '@polkadot/types/lookup';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';

import { Rescuer } from '../../util/plusTypes';
import { grey } from '@mui/material/colors';

interface Props extends ThemeProps {
  recoveryInfo: PalletRecoveryRecoveryConfig | undefined | null;
  className?: string;
  rescuer: Rescuer | undefined | null;
  setRecoveryStatus: (value: React.SetStateAction<string | undefined>) => void
}

function RecoveryChecking({ recoveryInfo, rescuer, setRecoveryStatus }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [processTitle, setProcessTitle] = useState<string>('');

  useEffect((): void => {
    if (recoveryInfo === undefined) {
      return setProcessTitle(t('Checking if the account is recoverable'));
    }

    if (recoveryInfo === null) {
      return setRecoveryStatus('Make recoverable');
    }

    if (rescuer === undefined) {
      return setProcessTitle(t('Checking if some malicious rescuer is recovering your account'));
    }

    if (rescuer === null) {
      return setRecoveryStatus('Remove recovery');
    }

    return setRecoveryStatus('Close recovery');
  }, [rescuer, recoveryInfo, t, setRecoveryStatus]);

  return (
    <Grid alignItems='center' container item justifyContent='center' sx={{ bgcolor: 'white', borderColor: grey[600], borderRadius: 5, fontSize: 12, height: '300px', overflowY: 'auto', p: '30px', mt: 5 }} xs={12}>
      <Grid item py='30px' xs={12}>
        <Progress title={processTitle} />
      </Grid>
    </Grid>
  );
}

export default styled(RecoveryChecking)`
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
