// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component show a list of validators, which is utilized in other components  */

import { Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Progress } from '../../components';
import { ChainInfo, StakingConsts } from '../../util/plusTypes';
import ValidatorInfo from './ValidatorInfo';
import VTable from './VTable';

interface Props {
  activeValidator?: DeriveStakingQuery;
  chain?: Chain | null;
  chainInfo: ChainInfo;
  validatorsInfo: DeriveStakingQuery[] | null;
  stakingConsts: StakingConsts;
  validatorsIdentities: DeriveAccountInfo[] | null;
  height: number;
}

export default function ValidatorsList({ activeValidator, height, chain, chainInfo, stakingConsts, validatorsIdentities, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [showValidatorInfoModal, setShowValidatorInfoModal] = useState<boolean>(false);
  const [info, setInfo] = useState<DeriveStakingQuery | null>(null);

  useEffect(() => {
    if (!activeValidator || !validatorsInfo?.length) return;

    // put active validator at the top of list
    const index = validatorsInfo.findIndex((v) => v.accountId === activeValidator?.accountId);

    if (index === -1) { return; }

    validatorsInfo.splice(index, 1);
    validatorsInfo.unshift(activeValidator);
  }, [activeValidator, validatorsInfo]);

  return (
    <>
      <Grid item sx={{p: '0px 10px' }} xs={12}>
        {validatorsInfo
          ? <VTable
            activeValidator={activeValidator}
            chain={chain}
            decimals={chainInfo?.decimals}
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

      {showValidatorInfoModal && info &&
        <ValidatorInfo
          chain={chain}
          chainInfo={chainInfo}
          info={info}
          setShowValidatorInfoModal={setShowValidatorInfoModal}
          showValidatorInfoModal={showValidatorInfoModal}
          validatorsIdentities={validatorsIdentities}
        />
      }
    </>
  );
}
