/* eslint-disable simple-import-sort/imports */
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description
 * this component opens Close recovery for a named lost account
 * */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { HealthAndSafety as HealthAndSafetyIcon } from '@mui/icons-material';
import { Typography, Autocomplete, Grid, Button as MuiButton, TextField, InputAdornment, IconButton } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { ArrowBackIosRounded, CheckRounded as CheckRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';

import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import Identicon from '@polkadot/react-identicon';

import isValidAddress from '../../util/validateAddress';
import { SettingsContext, AccountContext } from '../../../../extension-ui/src/components/contexts';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { ConfirmButton, Identity, Password, PlusHeader, Popup, Progress, ShowBalance2, ShowValue } from '../../components';
import type { ApiPromise } from '@polkadot/api';
import type { PalletRecoveryRecoveryConfig, PalletRecoveryActiveRecovery } from '@polkadot/types/lookup';
import keyring from '@polkadot/ui-keyring';

import { AddressState, RecoveryConsts, Rescuer } from '../../util/plusTypes';
import { Button } from '@polkadot/extension-ui/components';
import Confirm from './Confirm';
import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import type { TransactionDetail } from '../../util/plusTypes';
import { grey } from '@mui/material/colors';

interface Props extends ThemeProps {
  api: ApiPromise | undefined;
  formattedAddress: string;
  chain: Chain;
  className?: string;
  handleExitCloseRecovery: () => void
  showCloseRecoveryModal: boolean;
  rescuer: Rescuer;
}

function CloseRecovery({ api, chain, formattedAddress, handleExitCloseRecovery, rescuer, showCloseRecoveryModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showConfirmModal, setConfirmModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>();

  useEffect((): void => {
    api && rescuer && api.rpc.chain.getHeader().then(h => {
      const currentBlockNumber = h.number.toNumber();
      const now = Date.now();
      const initiateRecoveryBlock = rescuer.option.created.toNumber();
      const initiateRecoveryTime = now - (currentBlockNumber - initiateRecoveryBlock) * 6000

      setDate(new Date(initiateRecoveryTime));
    });
  }, [api, rescuer]);

  const handleNextToCloseRecovery = useCallback(() => {
    setState('closeRecovery');
    setConfirmModalOpen(true);
  }, []);

  return (
    <Popup handleClose={handleExitCloseRecovery} showModal={showCloseRecoveryModal}>
      <PlusHeader action={handleExitCloseRecovery} chain={chain} closeText={'Close'} icon={<HealthAndSafetyIcon fontSize='small' />} title={'Close recovery'} />
      <Grid container sx={{ p: '25px 30px' }}>
        <Grid item pt='35px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle1'>
            {t<string>('The following account has initiated a recovery process for you!')}
          </Typography>
        </Grid>
        <Grid alignItems='center' container item justifyContent='center' sx={{ bgcolor: 'white', border: '1px solid', borderColor: grey[600], borderRadius: 5, fontSize: 12, height: '190px', overflowY: 'auto', px: '30px' }} xs={12}>
          <Identity address={rescuer.accountId} api={api} chain={chain} showAddress />
          <ShowBalance2 api={api} balance={rescuer.option.deposit} direction='row' title={`${t('Deposited')}:`} />
          <ShowValue title='Creation time' value={date?.toString()}/>
        </Grid>
        <Grid item pt='15px' xs={12}>
          <Typography sx={{ color: 'text.primary', p: '10px' }} variant='subtitle1'>
            {t<string>('If it isn\'t you, close the recovery process, which will automatically transfer their deposit to your account')}
          </Typography>
        </Grid>
        <Grid item sx={{ pt: 3 }} xs={12}>
          <Button
            data-button-action=''
            // isDisabled={!lostAccount || !lostAccountRecoveryInfo || !!hasActiveRecoveries || isProxy}
            onClick={handleNextToCloseRecovery}
          >
            {t<string>('Next')}
          </Button>
        </Grid>
      </Grid>
      {showConfirmModal && api && chain && state &&
        <Confirm
          account={{ accountId: formattedAddress }}
          api={api}
          chain={chain}
          rescuer={rescuer}
          setConfirmModalOpen={setConfirmModalOpen}
          setState={setState}
          showConfirmModal={showConfirmModal}
          state={state}
        />
      }

    </Popup>
  );
}

export default styled(CloseRecovery)`
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
