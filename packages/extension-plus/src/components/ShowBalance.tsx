// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description  this componet is used to show an account balance in some pages like contributeToCrowdloan
 * */
import type { Balance } from '@polkadot/types/interfaces';
import type { ThemeProps } from '../../../extension-ui/src/types';

import { Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { ChainInfo } from '../util/plusTypes';
import { amountToHuman } from '../util/plusUtils';

export interface Props {
  balance: Balance | bigint | string | number | null | undefined;
  chainInfo: ChainInfo;
  title: string;
  decimalDigits?: number;
}

function ShowBalance({ balance, chainInfo, decimalDigits, title }: Props): React.ReactElement<Props> {
  return (
    <div data-testid='showBalance'>
      {title}:{' '}
      {balance
        ? <>
          {Number(amountToHuman(balance.toString(), chainInfo.decimals, decimalDigits)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimalDigits })}{' '}{chainInfo.coin}
        </>
        : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
      }
    </div>
  );
}

export default styled(ShowBalance)(({ theme }: ThemeProps) => `
      background: ${theme.accountBackground};
      border: 1px solid ${theme.boxBorderColor};
      box-sizing: border-box;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
`);
