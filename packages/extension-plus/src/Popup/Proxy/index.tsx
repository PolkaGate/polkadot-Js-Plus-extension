// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description list all governance options e.g., Democracy, Council, Treasury, etc.
*/
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Container } from '@mui/material';
import React, { useCallback, useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';
import useMetadata from '../../../../extension-ui/src/hooks/useMetadata';

import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { Header } from '../../../../extension-ui/src/partials';
import getChainInfo from '../../util/getChainInfo';
import { AddressState, ChainInfo, NameAddress } from '../../util/plusTypes';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { AccountContext } from '../../../../extension-ui/src/components/contexts';
import AddressTextBox from './AddressTextBox';

interface Props extends ThemeProps {
  className?: string;
}

function Proxy({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);

  const [addresesOnThisChain, setAddresesOnThisChain] = useState<NameAddress[]>([]);

  const [realAddress, setRealAddress] = useState<string | undefined>();
  const [showCouncilModal, setCouncilModalOpen] = useState<boolean>(false);
  const [showTreasuryModal, setTreasuryModalOpen] = useState<boolean>(false);
  const [chainInfo, setChainInfo] = useState<ChainInfo>();

  const { address, genesisHash } = useParams<AddressState>();
  const chain = useMetadata(genesisHash, true);

  const handleAlladdressesOnThisChain = useCallback((prefix: number): void => {
    const allAddresesOnSameChain = accounts.reduce(function (result: NameAddress[], acc): NameAddress[] {
      const publicKey = decodeAddress(acc.address);

      result.push({ address: encodeAddress(publicKey, prefix), name: acc?.name });

      return result;
    }, []);

    setAddresesOnThisChain(allAddresesOnSameChain);
  }, [accounts]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    }).catch(console.error);
  }, []);

  useEffect(() => {
  
  }, []);


  return (
    <>
      <Header
        showAdd
        showBackArrow
        showSettings
        smallMargin
        text={t<string>('Proxy')}
      />
      <Container >
        <AddressTextBox addresesOnThisChain={addresesOnThisChain} address={realAddress} chain={chain} label={t('Real account')} setAddress={setRealAddress} />
      </Container>

    </>
  );
}

export default styled(Proxy)`
      height: calc(100vh - 2px);
      overflow: auto;
      scrollbar - width: none;

      &:: -webkit - scrollbar {
        display: none;
      width:0,
  }
      .empty-list {
        text - align: center;
  }
      `;
