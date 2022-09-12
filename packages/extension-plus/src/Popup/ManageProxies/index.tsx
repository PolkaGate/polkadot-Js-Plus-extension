// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description list all governance options e.g., Democracy, Council, Treasury, etc.
*/
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { AddCircleRounded as AddCircleRoundedIcon, Clear as ClearIcon } from '@mui/icons-material';
import { Container, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
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
import { Hint, Identity, Progress, ShortAddress, ShowBalance2 } from '../../components';
import { useApi, useEndpoint } from '../../hooks';
import { AddressState, NameAddress, Proxy } from '../../util/plusTypes';
import { getAllFormattedAddressesOnThisChain, getFormattedAddress } from '../../util/plusUtils';
import AddressTextBox from './AddressTextBox';
import { BN, BN_MILLION, BN_ZERO, u8aConcat } from '@polkadot/util';
import { AccountJson } from '@polkadot/extension-base/background/types';
import AddProxy from './AddProxy';

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
  const [newProxies, setNewProxies] = useState<Proxy[] | undefined>();
  const [deletedProxies, setDeletedProxies] = useState<Proxy[] | undefined>();
  const [proxiesToShow, setProxiesToShow] = useState<Proxy[] | undefined>();
  const [proxyInfo, setProxyInfo] = useState<DeriveAccountInfo[] | undefined>();
  const [addressesOnThisChain, setAddressesOnThisChain] = useState<NameAddress[]>([]);
  const [showAddProxyModal, setShowAddProxyModal] = useState<boolean>(false);

  const proxyDepositBase = api ? api.consts.proxy.proxyDepositBase : BN_ZERO;
  const proxyDepositFactor = api ? api.consts.proxy.proxyDepositFactor : BN_ZERO;
  const deposit = proxyDepositBase.add(proxyDepositFactor.muln(proxiesToShow?.length ?? 0));

  // const removeProxy=api.tx.proxy.removeProxy /** (delegate, proxyType, delay) **/
  // const addProxy=api.tx.proxy.addProxy /** (delegate, proxyType, delay) **/

  const handleAddProxy = useCallback(() => {
    setShowAddProxyModal(true);
  }, []);

  const handleremoveProxy = useCallback(
    (index: number): void => {
      if (proxies?.length && index < proxies.length) {
        setDeletedProxies((pre) => (pre ?? []).concat(proxies[index]));

        return setProxies((pre) => {
          pre?.splice(index, 1);

          return pre;
        });
      }

      newProxies?.splice(index - (proxies?.length ?? 0), 1);
      newProxies !== undefined && setNewProxies([...newProxies]);
    }, [newProxies, proxies]);

  useEffect(() => {
    setProxiesToShow((proxies ?? []).concat(newProxies ?? []));
  }, [newProxies, newProxies?.length, proxies, proxies?.length]);

  useEffect(() => {
    chain && settings?.prefix && accounts && address && setAddressesOnThisChain(getAllFormattedAddressesOnThisChain(chain, settings.prefix, accounts, address));
  }, [accounts, address, chain, settings]);

  const formatted = useMemo(() => address && chain && settings && getFormattedAddress(address, chain, settings.prefix), [address, chain, settings]);

  useEffect(() => {
    formatted && api && api.query.proxy?.proxies(formatted).then((proxies) => {
      setProxies(JSON.parse(JSON.stringify(proxies[0])));
      console.log('proxies:', JSON.parse(JSON.stringify(proxies[0])));
    });
  }, [api, chain, formatted]);

  useEffect(() => {
    if (!proxiesToShow?.length) {
      return;
    }

    const proxyInfo = proxiesToShow.map((proxy) => {
      const mayBeFound = accounts.find((acc) => {
        const formattedAcc = getFormattedAddress(acc.address, chain, settings.prefix);

        if (formattedAcc === proxy.delegate) {
          return acc;
        }
      });

      return { accountId: proxy.delegate, nickname: mayBeFound?.name };
    });

    setProxyInfo(proxyInfo);
  }, [accounts, chain, formatted, proxiesToShow, settings?.prefix]);

  return (
    <>
      <Header showBackArrow showSettings smallMargin text={t<string>('Manage Proxies')} />
      <Container sx={{ pt: '10px', px: '30px' }}>

        <Grid alignItems='center' container item justifyContent='space-between' pb='10px' pt='15px' xs={12}>
          <Grid alignItems='center' container item justifyContent='flex-start' xs={6}>
            <Grid item p='7px 15px 7px'>
              <Typography sx={{ color: 'text.primary' }} variant='body2'>
                {t('Your proxies')} {`(${proxies?.length ?? 0})`}
              </Typography>
            </Grid>
            <Grid item>
              <Hint id='addProxy' place='right' tip={t('add a proxy')}>
                <IconButton
                  aria-label='addProxy'
                  color='warning'
                  onClick={handleAddProxy}
                  size='small'
                >
                  <AddCircleRoundedIcon sx={{ fontSize: 25 }} />
                </IconButton>
              </Hint>
            </Grid>
          </Grid>
          <Grid alignItems='center' item pr='7px' sx={{ fontSize: 13, color: grey[600] }} xs={3.5}>
            <ShowBalance2 api={api} balance={deposit} direction='row' title={`${t('deposit')}:`} />
          </Grid>
        </Grid>
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
        <Grid container item sx={{ borderLeft: '2px solid', borderRight: '2px solid', borderBottom: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[200], display: 'block', pt: '15px', pl: '10px', height: 320, overflowY: 'auto' }} xs={12}>
          {proxies === undefined &&
            <Progress title={t('Loading proxies ...')} pt='20px' />
          }
          {proxies !== undefined && proxiesToShow?.length === 0 &&
            <Grid alignItems='center' container justifyContent='center' sx={{ px: 3 }} xs={12}>
              <Grid item sx={{ pt: 15 }}>
                <Typography sx={{ color: 'text.secondary' }} variant='caption'>
                  {t('No proxies found!')}
                </Typography>
              </Grid>
            </Grid>
          }
          {!!proxiesToShow?.length && proxyInfo &&
            <>
              {proxiesToShow.map((proxy, index) => {
                const info = proxyInfo.find((p) => p.accountId == proxy.delegate);

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
            isDisabled={!deletedProxies?.length && !newProxies?.length}
          // onClick={handleNext}
          >
            {t('Next')}
          </NextStepButton>
        </Grid>
      </Container>
      {showAddProxyModal &&
        <AddProxy
          address={address}
          addressesOnThisChain={addressesOnThisChain}
          api={api}
          chain={chain}
          proxies={newProxies}
          setProxies={setNewProxies}
          setShowAddProxyModal={setShowAddProxyModal}
          settingsPrefix={settings.prefix}
          showAddProxyModal={showAddProxyModal} />
      }
    </>
  );
}
