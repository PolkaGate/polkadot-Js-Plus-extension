// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description  this componet is used to show an value, if not loaded shows skelton
 * */

import type { ThemeProps } from '../../../extension-ui/src/types';

import { Skeleton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

export interface Props {
  value: string | number | null | undefined;
  unit?: string;
  title?: string;
}

function ShowValue({ title, unit, value }: Props): React.ReactElement<Props> {
  return (
    <div data-testid='showValue'>
      {title && <> {title}:{' '}</>}
      {value !== undefined && value !== null
        ? <>
          {value}{' '}{unit}
        </>
        : <Skeleton sx={{ display: 'inline-block', fontWeight: 'bold', width: '70px' }} />
      }
    </div>
  );
}

export default styled(ShowValue)(({ theme }: ThemeProps) => `
      background: ${theme.accountBackground};
      border: 1px solid ${theme.boxBorderColor};
      box-sizing: border-box;
      border-radius: 4px;
      margin-bottom: 8px;
      position: relative;
`);
