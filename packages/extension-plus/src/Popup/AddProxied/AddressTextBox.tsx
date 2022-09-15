// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description  shows a simple address text box or an address selection box depending on the value of addresesOnThisChain
*/

import { NoAccounts as NoAccountsIcon } from '@mui/icons-material';
import { Autocomplete, Grid, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback } from 'react';

import { Chain } from '@polkadot/extension-chains/types';
import { Identicon } from '@polkadot/extension-ui/components';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { NameAddress } from '../../util/plusTypes';
import isValidAddress from '../../util/validateAddress';

interface Props {
  autoFocus?: boolean;
  chain: Chain;
  addresesOnThisChain?: NameAddress[];
  label: string;
  address: string | undefined;
  setAddress: React.Dispatch<React.SetStateAction<string | undefined>>
}

export default function AddressTextBox({ addresesOnThisChain, address, autoFocus = true, chain, label, setAddress }: Props) {
  const { t } = useTranslation();

  const handleAddress = useCallback((value: string | null) => {
    if (!value) {
      setAddress(undefined);

      return;
    }

    const indexOfDots = value?.indexOf(':');
    let mayBeAddress: string | undefined = value?.slice(indexOfDots + 1)?.trim();

    mayBeAddress = mayBeAddress && isValidAddress(mayBeAddress) ? mayBeAddress : undefined;

    if (mayBeAddress) {
      setAddress(mayBeAddress);
    }
  }, [setAddress]);

  const handleAutoComplateChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    handleAddress(value);
  }, [handleAddress]);

  const handleInputChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: string) => {
    setAddress(value);
  }, [setAddress]);

  return (
    <Grid alignItems='center' container sx={{ pt: 2 }}>
      <Grid item sx={{ height: '70px' }} xs={1.5}>
        <div style={{ transform: 'scale(0.7)' }}>
          {isValidAddress(address)
            ? <Identicon
              prefix={chain?.ss58Format ?? 42}
              theme={chain?.icon || 'polkadot'}
              value={address}
            />
            : <NoAccountsIcon sx={{ color: grey[400], fontSize: 64 }} />
          }
        </div>
      </Grid>
      <Grid item xs>
        <Autocomplete
          ListboxProps={{ sx: { fontSize: 12 } }}
          // defaultValue={address}
          freeSolo
          inputValue={address}
          onChange={handleAutoComplateChange}
          onInputChange={handleInputChange}
          options={addresesOnThisChain?.map((option) => `${option?.name} :    ${option.address}`)}
          // eslint-disable-next-line react/jsx-no-bind
          renderInput={(params) =>
            <TextField
              {...params}
              InputLabelProps={{ style: { fontSize: 16 } }}
              autoFocus={autoFocus}
              error={!address}
              label={label}
              placeholder={t('Add an address')}
            />
          }
          sx={{ '& .MuiAutocomplete-input, & .MuiInputLabel-root': { fontSize: 13 } }}
        />
      </Grid>
    </Grid>
  );
}
