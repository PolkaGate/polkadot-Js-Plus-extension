// Copyright 2019-2023 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/** This component shows balances including a title, fund in crypto and equivalent in USD
 *  for different type of anaccount balance  (i.e., Total, Available, and Reserved) */

import type { ThemeProps } from '../../../extension-ui/src/types';

import { Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { FLOATING_POINT_DIGIT } from '../util/constants';
import { AccountsBalanceType } from '../util/plusTypes';
import { balanceToHuman } from '../util/plusUtils';

export interface Props {
  balance: AccountsBalanceType | null;
  type: string;
  className?: string;
  price: number;
}

function Balance({ balance, price, type }: Props): React.ReactElement<Props> {
  const balString = balanceToHuman(balance, type, FLOATING_POINT_DIGIT);
  const bal = balString === ('' || '0') ? 0 : Number(balString);
  const label = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 500, lineHeight: '16px', letterSpacing: '0.8px' }}>
        {label}
      </div>

      {balance === null
        ? <Skeleton sx={{ fontWeight: 'bold', width: '70px', lineHeight: '16px' }} />
        : <div style={{ fontSize: 11, fontWeight: 600, lineHeight: '16px', letterSpacing: '0.6px' }}>
          {bal.toLocaleString() === '0' ? '0.00' : bal.toLocaleString()}{' '}  {balance && balance?.balanceInfo?.coin}
        </div>
      }

      <div style={{ fontSize: 11, lineHeight: '16px', color: 'grey' }}>
        {/* $ {' '}{parseFloat(String(price * bal)).toFixed(2)} */}
        $ {' '}{(price * bal).toLocaleString()}
      </div>

    </>
  );
}

export default styled(Balance)(({ theme }: ThemeProps) => `
      background: ${theme.accountBackground};
      border: 1px solid ${theme.boxBorderColor};
      box-sizing: border-box;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
`);
