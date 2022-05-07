// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description  this componet is used to show an account balance in some pages like contributeToCrowdloan
 * */
import type { Balance } from '@polkadot/types/interfaces';
import type { ThemeProps } from '../../../extension-ui/src/types';
import type { BN } from '@polkadot/util';

import { Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import { ApiPromise } from '@polkadot/api';

export interface Props {
  balance: Balance | BN | bigint | string | number | null | undefined;
  api: ApiPromise | undefined;
  title?: string;
  direction?: string;
}

function ShowBalance2({ api, balance, direction = 'row', title }: Props): React.ReactElement<Props> {
  const amountToHuman = (x: unknown): string | undefined => api && (api.createType('Balance', x)).toHuman();

  return (
    <div data-testid='showPlus'>
      {title && <>{title} {direction === 'row' ? ': ' : <br />}</>}

      {balance !== undefined && api
        ? <>
          {amountToHuman(balance)}
        </>
        : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
      }
    </div>
  );
}

export default styled(ShowBalance2)(({ theme }: ThemeProps) => `
      background: ${theme.accountBackground};
      border: 1px solid ${theme.boxBorderColor};
      box-sizing: border-box;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
`);
