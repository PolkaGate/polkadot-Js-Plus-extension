// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import type { ThemeProps } from '../../../extension-ui/src/types';

import { Help as HelpIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import React from 'react';
import ReactTooltip, { TooltipProps } from 'react-tooltip';
import styled from 'styled-components';

export interface Props {
  children: React.ReactNode;
  effect?: TooltipProps['effect'];
  tip: string;
  place?: TooltipProps['place'];
  id: string;
  icon?: boolean;
}

function Hint ({ children, effect = 'float', icon = false, id, place = 'right', tip }: Props): React.ReactElement<Props> {
  return (
    <>
      <a
        data-for={id}
        data-iscapture='true'
        data-tip={tip}
      >

        <Grid
          container
          item
          spacing={icon && 0.2}
        >
          <Grid item>
            {icon && <HelpIcon
              color='disabled'
              fontSize='small'
              sx={{ pr: '3px' }}
                     />}
          </Grid>
          <Grid
            item
            sx={icon && { pb: '7px' }}
          >
            {children}
          </Grid>
        </Grid>

      </a>
      <ReactTooltip
        effect={effect}
        id={id}
        multiline={true}
        place={place}
      />
    </>

  );
}

export default styled(Hint)(({ theme }: ThemeProps) => `
  background: ${theme.accountBackground};
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  position: relative;
`);
