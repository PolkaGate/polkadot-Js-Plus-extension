// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description list all governance options e.g., Democracy, Council, Treasury, etc.
*/
import type { ThemeProps } from '../../../../extension-ui/src/types';

import { Container, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

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
import { grey } from '@mui/material/colors';

interface Props extends ThemeProps {
  className?: string;
}

interface DropdownOption {
  text: string;
  value: string;
}

export default function ManageProxies({ className }: Props): React.ReactElement<Props> {
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

  const PSelect = ({ defaultValue, label, onChange, options }: { defaultValue: string | undefined, onChange?: (value: string) => void, options: DropdownOption[], label: string }) => {
    const _onChange = useCallback(
      ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) =>
        onChange && onChange(value.trim()),
      [onChange]
    );

    return (
      <FormControl
        // variant='standard'
        sx={{ width: '100%' }}>
        <InputLabel
          htmlFor='selectChain'
        // sx={{ transformOrigin: 'left bottom', fontWeight: 300, letterSpacing: '-0.015em' }}
        >
          {label}
        </InputLabel>
        <Select
          defaultValue={defaultValue}
          id='selectChain'
          label={label}
          // input={<BootstrapInput />}
          onChange={_onChange}
        // sx={{ width: '100%', height: 31 }}
        // value={defaultValue}
        >
          {options.map(({ text, value }): React.ReactNode => (
            <MenuItem key={value} sx={{ fontSize: '14px', fontWeight: 300, letterSpacing: '-0.015em' }} value={value}>
              {text}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  };

  return (
    <>
      <Header showAdd showBackArrow showSettings smallMargin text={t<string>('Manage Proxies')} />
      <Container sx={{ pt: '10px', px: '30px' }}>
        <AddressTextBox addresesOnThisChain={addresesOnThisChain} address={realAddress} chain={chain} label={t('Real account')} setAddress={setRealAddress} />
        <Grid item py='20px' xs>
          <PSelect defaultValue={chain?.genesisHash} label={'Select the chain'} onChange={_onChangeGenesis} options={genesisOptions} />
        </Grid>
        <TextField
          autoFocus
          color='warning'
          fullWidth
          helperText={t('Enter a name for your real account')}
          label={t('Name')}
          name='name'
          onChange={() => setName(event.target.value)}
          sx={{ pb: '20px' }}
          variant='outlined'
        />
        <Grid container item sx={{ fontWeight: 600, bgcolor: grey[200], borderRadius: '10px' }}>
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
        <Grid container item sx={{ pt: '15px', height: 120, overflowY: 'auto' }} xs={12}>
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
                    )
                  })
                  : <Grid item pt='10px'>
                    {t('No proxies found for the entered real account on {{chain}}', { replace: { chain: chain?.name } })}
                  </Grid>
                : <Progress pt={'10px'} title={'Loading proxies ...'} />
              }
            </>}
        </Grid>
        <Grid item sx={{ pt: '30px' }} xs={12}>
          <NextStepButton
            data-button-action='Add proxy real account'
            isDisabled={!name || !realAddress | !proxies?.length}
            onClick={handleAdd}
          >
            {t('Add proxy real account')}
          </NextStepButton>
        </Grid>

      </Container>
    </>
  );
}
