// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component show a list of validators, which is utilized in other components  */

import { Grid } from '@mui/material';
import React, { useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import { AccountsBalanceType, StakingConsts } from '../../util/plusTypes';
import ValidatorInfo from './ValidatorInfo';
import VTable from './VTable';

interface Props {
  activeValidator?: DeriveStakingQuery;
  chain?: Chain | null;
  api: ApiPromise | undefined;
  validatorsInfo: DeriveStakingQuery[] | null;
  stakingConsts: StakingConsts;
  validatorsIdentities: DeriveAccountInfo[] | null;
  height: number;
  staker?: AccountsBalanceType;

}

export default function ValidatorsList({ activeValidator, api, chain, height, staker, stakingConsts, validatorsIdentities, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showValidatorInfoModal, setShowValidatorInfoModal] = useState<boolean>(false);
  const [info, setInfo] = useState<DeriveStakingQuery | null>(null);

  const decimals = api && api.registry.chainDecimals[0];

  // put active validator at the top of list
  React.useMemo(() => {
    const index = validatorsInfo?.findIndex((v) => v.accountId === activeValidator?.accountId);

    if (index !== -1) {
      validatorsInfo.splice(index, 1);
      validatorsInfo.unshift(activeValidator);
    }
  }, [validatorsInfo, activeValidator]);

  return (
    <>
      <Grid item sx={{ p: '0px 10px' }} xs={12}>
        {validatorsInfo && decimals
          ? <VTable
            activeValidator={activeValidator}
            chain={chain}
            decimals={decimals}
            height={height}
            setInfo={setInfo}
            setShowValidatorInfoModal={setShowValidatorInfoModal}
            stakingConsts={stakingConsts}
            validators={validatorsInfo}
            validatorsIdentities={validatorsIdentities}
          />
          : <Progress title={t('Loading validators....')} />
        }
      </Grid>

      {showValidatorInfoModal && info && api &&
        <ValidatorInfo
          api={api}
          chain={chain}
          info={info}
          setShowValidatorInfoModal={setShowValidatorInfoModal}
          showValidatorInfoModal={showValidatorInfoModal}
          staker={staker}
          validatorsIdentities={validatorsIdentities}
        />
      }
    </>
  );
}
