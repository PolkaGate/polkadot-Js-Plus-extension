// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description list all governance options e.g., Democracy, Council, Treasury, etc.
*/
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Clear as ClearIcon } from '@mui/icons-material';
import { Container, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { AccountsStore } from '@polkadot/extension-base/stores';
import { Chain } from '@polkadot/extension-chains/types';
import { NextStepButton } from '@polkadot/extension-ui/components';
import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';
import useMetadata from '@polkadot/extension-ui/hooks/useMetadata';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { AccountContext, ActionContext, SettingsContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { createAccountExternal, getMetadata } from '../../../../extension-ui/src/messaging';
import { Header } from '../../../../extension-ui/src/partials';
import { Hint, Identity, Progress, ShortAddress } from '../../components';
import { useApi, useEndpoint } from '../../hooks';
import { AddressState, NameAddress, Proxy } from '../../util/plusTypes';
import { getFormattedAddress } from '../../util/plusUtils';
import AddressTextBox from './AddressTextBox';

interface Props extends ThemeProps {
  className?: string;
}

interface DropdownOption {
  text: string;
  value: string;
}

export default function ManageProxies({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { address, genesisHash } = useParams<AddressState>();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);

  const chain = useMetadata(genesisHash, true);
  const endpoint = useEndpoint(accounts, address, chain);
  const api = useApi(endpoint);
  const [proxies, setProxies] = useState<Proxy[] | undefined>();
  const [deletedProxies, setDeletedProxies] = useState<Proxy[] | undefined>();
  const [proxyInfo, setProxyInfo] = useState<DeriveAccountInfo[] | undefined>();

  // const removeProxy=api.tx.proxy.removeProxy /** (delegate, proxyType, delay) **/
  const handleremoveProxy = useCallback(
    (index: number): void => {
      proxies && setDeletedProxies((pr) => pr ? pr.concat(proxies[index]) : [proxies[index]]);
    }, [proxies]);

  console.log('deletedProxies:', deletedProxies);

  useEffect(() => {
    console.log('address', address);
    console.log('genesisHash', genesisHash);
    console.log('settings', settings);
  }, [address, genesisHash, settings]);

  const formatted = useMemo(() => address && chain && settings && getFormattedAddress(address, chain, settings.prefix), [address, chain, settings]);

  useEffect(() => {
    formatted && api && api.query.proxy?.proxies(formatted).then((proxies) => {
      setProxies(JSON.parse(JSON.stringify(proxies[0])));
      console.log('proxies:', JSON.parse(JSON.stringify(proxies[0])));
    });
  }, [api, chain, formatted]);

  useEffect(() => {
    if (!proxies?.length) {
      return;
    }

    const proxyInfo = proxies.map((proxy) => {
      const mayBeFound = accounts.find((acc) => {
        const formattedAcc = getFormattedAddress(acc.address, chain, settings.prefix);
        if (formattedAcc === proxy.delegate) {
          return acc;
        }
      });

      return { accountId: proxy.delegate, nickname: mayBeFound?.name };
    });
    setProxyInfo(proxyInfo);
  }, [accounts, chain, formatted, proxies, settings?.prefix]);

  return (
    <>
      <Header showBackArrow showSettings smallMargin text={t<string>('Manage Proxies')} />
      <Container sx={{ pt: '10px', px: '30px' }}>
        <Grid container item sx={{ fontSize: 14, fontWeight: 500, bgcolor: grey[200], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', py: '5px', px: '10px' }}>
          <Grid item xs={6}>
            {t('identity')}
          </Grid>
          <Grid item xs={3}>
            {t('type')}
          </Grid>
          <Grid item xs={2}>
            {t('delay')}
          </Grid>
          <Grid item xs={1}>
            {t('action')}
          </Grid>
        </Grid>
        <Grid container item sx={{ borderLeft: '2px solid', borderRight: '2px solid', borderBottom: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[200], display: 'block', pt: '15px', pl: '10px', height: 180, overflowY: 'auto' }} xs={12}>
          {!proxies &&
            <Progress title={t('Loading proxes ...')} pt='20px' />}
          {proxies?.length && proxyInfo &&
            <>
              {proxies.filter((p) => !deletedProxies?.includes(p)).map((proxy, index) => {
                const info = proxyInfo.find((p) => p.accountId === proxy.delegate);

                return (
                  <Grid container item key={index} sx={{ fontSize: 14 }}>
                    <Grid item xs={6}>
                      <Identity accountInfo={info} chain={chain} />
                    </Grid>
                    <Grid item xs={3}>
                      {proxy.proxyType}
                    </Grid>
                    <Grid item xs={2}>
                      {proxy.delay}
                    </Grid>
                    <Grid item xs={1}>
                      <Hint id='removeProxy' place='left' tip={t('remove proxy')}>
                        <IconButton aria-label='removeProxy' color='error' onClick={() => handleremoveProxy(index)} size='small'>
                          <ClearIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Hint>
                    </Grid>
                  </Grid>
                );
              })
              }
            </>
          }
        </Grid>
        <Grid item sx={{ pt: '30px' }} xs={12}>
          <NextStepButton
            data-button-action='Done'
          // isDisabled={}
          // onClick={handleAdd}
          >
            {t('Done')}
          </NextStepButton>
        </Grid>

      </Container>
    </>
  );
}
