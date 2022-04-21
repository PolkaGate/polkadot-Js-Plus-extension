
// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/** 
 * @description
 *  this component lists all active crowdloans,which can be selected to contribute to, also page shows winner parachains 
 * */

import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Container } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { Balance } from '@polkadot/types/interfaces';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Auction, ChainInfo, Crowdloan } from '../../util/plusTypes';
import CrowdloanList from './CrowdloanList';

interface Props extends ThemeProps {
  className?: string;
  auction: Auction;
  chainInfo: ChainInfo;
  endpoints: LinkOption[];
  handleContribute: (crowdloan: Crowdloan) => void;
  myContributions: Map<string, Balance> | undefined;

}

function MyContributionsTab({ auction, chainInfo, className, endpoints, handleContribute, myContributions }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string>('');
console.log('myContributions',myContributions.toHuman())
  

  

  return (
    <div
      id='crowdloan-list'
    >
    
    </div>
  );
}

export default styled(MyContributionsTab)`
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
