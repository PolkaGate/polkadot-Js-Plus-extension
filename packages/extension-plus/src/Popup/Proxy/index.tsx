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
import { useApi, useEndpoint } from '../../hooks';
import { NameAddress } from '../../util/plusTypes';
import AddressTextBox from './AddressTextBox';

interface Props extends ThemeProps {
  className?: string;
}

interface DropdownOption {
  text: string;
  value: string;
}

function Proxy({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const [addresesOnThisChain, setAddresesOnThisChain] = useState<NameAddress[]>([]);

  const [realAddress, setRealAddress] = useState<string | undefined>();
  const [chain, setChain] = useState<Chain>();
  const [proxies, setProxies] = useState<Chain>();
  const [name, setName] = useState<string | undefined>();

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

  useEffect(() => {
    // eslint-disable-next-line no-void
    void cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    api && api.query.proxy?.proxies(realAddress).then((proxies) => {
      console.log('proxies:', JSON.parse(JSON.stringify(proxies[0])));
    });
  }, [api, chain, realAddress]);

  const _onChangeGenesis = useCallback((genesisHash?: string | null): void => {
    console.log('genesisHash:', genesisHash)

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
      <Header
        showAdd
        showBackArrow
        showSettings
        smallMargin
        text={t<string>('Proxy')}
      />
      <Container sx={{ p: '30px' }}>
        <TextField
          // InputLabelProps={{ shrink: true }}
          autoFocus
          color='warning'
          fullWidth
          // helperText={zeroBalanceAlert ? t('No available fund to stake') : ''}
          label={t('Name')}
          name='name'
          onChange={() => setName(event.target.value)}
          sx={{ pb: '20px' }}
          variant='outlined'
        />
        <AddressTextBox addresesOnThisChain={addresesOnThisChain} address={realAddress} chain={chain} label={t('Real account')} setAddress={setRealAddress} />
        <Grid item xs pt='30px' >
          <PSelect defaultValue={chain?.genesisHash} label={'Select the chain'} onChange={_onChangeGenesis} options={genesisOptions} />
        </Grid>
        <Grid item xs={12} sx={{ pt: '30px' }}>
          <NextStepButton
            data-button-action='Add'
            // isBusy={nextToStakeButtonBusy}
            // isDisabled={nextToStakeButtonDisabled}
            onClick={handleAdd}
          >
            {t('Add proxy real account')}
          </NextStepButton>
        </Grid>

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
