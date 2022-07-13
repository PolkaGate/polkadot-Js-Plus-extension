// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description
 *  this component shows some general recovery informathion including maxFriends, configDepositBase, etc.
 * */

import type { ApiPromise } from '@polkadot/api';

import { Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ShowBalance2, ShowValue } from '../../components';
import { RecoveryConsts } from '../../util/plusTypes';

interface Props {
  api: ApiPromise | undefined;
  recoveryConsts: RecoveryConsts | undefined;
}

function InfoTab({ api, recoveryConsts }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const token = api && api.registry.chainTokens[0];

  return (
    <Grid container data-testid='info' sx={{ paddingTop: '45px', textAlign: 'center' }}>
      <Grid sx={{ color: grey[600], fontSize: 15, fontWeight: '600' }} xs={12}>
        {t('Welcome to account recovery')}
      </Grid>
      <Grid sx={{ fontSize: 11, pt: '5px', pb: 2 }} xs={12}>
        {t('Information you need to know')}
        <Divider light />
      </Grid>
      <Grid container item sx={{ p: '35px 5px' }} xs={12}>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('The base {{token}}s must be reserved to create a recovery', { replace: { token } })}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={recoveryConsts?.configDepositBase} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('{{token}}s to be reserved for each added friend ', { replace: { token } })}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={recoveryConsts?.friendDepositFactor} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('Maximum allowed number of friends')}:
          </Grid>
          <Grid item>
            <ShowValue value={recoveryConsts?.maxFriends} />
          </Grid>
        </Grid>
        <Grid container item justifyContent='space-between' sx={{ bgcolor: grey[200], fontSize: 12, paddingBottom: '5px' }} xs={12}>
          <Grid item>
            {t('The base {{token}}s needed to be reserved for starting a recovery', { replace: { token } })}:
          </Grid>
          <Grid item>
            <ShowBalance2 api={api} balance={recoveryConsts?.recoveryDeposit} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default React.memo(InfoTab);
