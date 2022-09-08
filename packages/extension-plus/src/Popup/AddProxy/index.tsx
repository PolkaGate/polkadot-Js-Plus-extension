// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description  
*/
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Container, Grid, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { AccountsStore } from '@polkadot/extension-base/stores';
import { Chain } from '@polkadot/extension-chains/types';
import { NextStepButton } from '@polkadot/extension-ui/components';
import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { AccountContext, ActionContext } from '../../../../extension-ui/src/components/contexts';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { createAccountExternal, getMetadata } from '../../../../extension-ui/src/messaging';
import { Header } from '../../../../extension-ui/src/partials';
import { Progress, ShortAddress } from '../../components';
import { useApi, useEndpoint } from '../../hooks';
import { NameAddress, Proxy } from '../../util/plusTypes';
import AddressTextBox from './AddressTextBox';
import SelectChain from './SelectChain';

interface Props extends ThemeProps {
  className?: string;
}

export default function AddProxy({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const [addresesOnThisChain, setAddresesOnThisChain] = useState<NameAddress[]>([]);
  const [realAddress, setRealAddress] = useState<string | undefined>();
  const [chain, setChain] = useState<Chain>();
  const [name, setName] = useState<string | undefined>();
  const [proxies, setProxies] = useState<Proxy[] | undefined>();

  const endpoint = useEndpoint(accounts, realAddress, chain);
  const api = useApi(endpoint);
  const genesisOptions = useGenesisHashOptions();

  const handleAlladdressesOnThisChain = useCallback((prefix: number): void => {
    const allAddresesOnSameChain = accounts.reduce(function (result: NameAddress[], acc): NameAddress[] {
      const publicKey = decodeAddress(acc.address);

      result.push({ address: encodeAddress(publicKey, prefix), name: acc?.name });

      return result;
    }, []);

    setAddresesOnThisChain(allAddresesOnSameChain);
  }, [accounts]);

  const isAvailable = useCallback((address: string): NameAddress => addresesOnThisChain?.find((a) => a.address === address), [addresesOnThisChain]);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    chain?.ss58Format && handleAlladdressesOnThisChain(chain.ss58Format);
  }, [chain, handleAlladdressesOnThisChain]);

  useEffect(() => {
    (!realAddress || !chain) && setProxies(undefined);
  }, [realAddress, chain]);

  useEffect(() => {
    realAddress && api && api.query.proxy?.proxies(realAddress).then((proxies) => {
      setProxies(JSON.parse(JSON.stringify(proxies[0])));
      console.log('proxies:', JSON.parse(JSON.stringify(proxies)));
    });
  }, [api, chain, realAddress]);

  const _onChangeGenesis = useCallback((genesisHash?: string | null): void => {
    setProxies(undefined);
    genesisHash && getMetadata(genesisHash, true).then(setChain).catch((error): void => {
      console.error(error);
    });
  }, []);

  const handleAdd = useCallback(() => {
    name && realAddress && chain?.genesisHash && createAccountExternal(name, realAddress, chain.genesisHash)
      .then(() => onAction('/'))
      .catch((error: Error) => console.error(error));
  }, [chain?.genesisHash, name, onAction, realAddress]);

  return (
    <>
      <Header showAdd showBackArrow showSettings smallMargin text={t<string>('Proxied- add a real account')} />
      <Container sx={{ px: '30px' }}>
        <TextField
          autoFocus
          color='warning'
          error={!name}
          // helperText={t('Enter a name for your real account')}
          fullWidth
          label={t('Name')}
          name='name'
          onChange={() => setName(event.target.value)}
          placeholder={t<string>('Enter a name for your real account')}
          sx={{ py: 1 }}
          variant='outlined'
        />
        <AddressTextBox addresesOnThisChain={addresesOnThisChain} address={realAddress} chain={chain} label={t('Real account')} setAddress={setRealAddress} />
        <Grid item py='20px' xs>
          <SelectChain defaultValue={chain?.genesisHash} label={'Select the chain'} onChange={_onChangeGenesis} options={genesisOptions} />
        </Grid>
        <Grid container item sx={{ fontSize: 14, fontWeight: 500, bgcolor: grey[200], borderTopRightRadius: '5px', borderTopLeftRadius: '5px', py: '5px', px: '10px' }}>
          <Grid item xs={4}>
            {t('Address')}
          </Grid>
          <Grid item xs={3}>
            {t('type')}
          </Grid>
          <Grid item xs={2}>
            {t('delay')}
          </Grid>
          <Grid item xs={3}>
            {t('available')}
          </Grid>
        </Grid>
        <Grid container item sx={{ borderLeft: '2px solid', borderRight: '2px solid', borderBottom: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[200], pt: '15px', pl: '10px', height: 140, overflowY: 'auto' }} xs={12}>
          {chain && realAddress &&
            <>
              {proxies
                ? proxies.length
                  ? proxies.map((proxy, index) => {
                    const localAccount = isAvailable(proxy.delegate);

                    return (
                      <Grid container item key={index} sx={{ fontSize: 11 }}>
                        <Grid item xs={4}>
                          <ShortAddress address={proxy.delegate} fontSize={11} />
                        </Grid>
                        <Grid item xs={3}>
                          {proxy.proxyType}
                        </Grid>
                        <Grid item xs={2}>
                          {proxy.delay}
                        </Grid>
                        <Grid item xs={3} >
                          {!!localAccount ? `Yes (${localAccount.name})` : 'No'}
                        </Grid>
                      </Grid>
                    );
                  })
                  : <Grid item pt='10px'>
                    {t('No proxies found for the entered real account on {{chain}}', { replace: { chain: chain?.name } })}
                  </Grid>
                : <Progress pt={'10px'} title={'Loading proxies ...'} />
              }
            </>}
        </Grid>
        <Grid item sx={{ pt: '20px' }} xs={12}>
          <NextStepButton
            data-button-action='Add'
            isDisabled={!name || !realAddress || !proxies?.length}
            onClick={handleAdd}
          >
            {t('Add')}
          </NextStepButton>
        </Grid>

      </Container>
    </>
  );
}
