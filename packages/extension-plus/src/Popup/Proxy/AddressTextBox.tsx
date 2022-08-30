// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description list all governance options e.g., Democracy, Council, Treasury, etc.
*/

import { Autocomplete, Grid, TextField } from '@mui/material';
import React, { useCallback } from 'react';


import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import isValidAddress from '../../util/validateAddress';
import { Identicon } from '@polkadot/extension-ui/components';
import { NoAccounts as NoAccountsIcon } from '@mui/icons-material';
import { grey } from '@mui/material/colors';
import { NameAddress } from '../../util/plusTypes';
import { Chain } from '@polkadot/extension-chains/types';

interface Props {
  chain: Chain;
  addresesOnThisChain: NameAddress[] | undefined;
  label: string;
  address: string | undefined;
  setAddress: React.Dispatch<React.SetStateAction<string | undefined>>
}

export default function AddressTextBox({ addresesOnThisChain, chain, label, address, setAddress }: Props) {
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
  }, []);

  const handleAutoComplateChange = useCallback((_event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    handleAddress(value);
  }, [handleAddress]);

  const handleInputChange = useCallback((event: React.SyntheticEvent<Element, Event>, value: string) => {
    setAddress(value);
  }, [setAddress]);

  return (
    <Grid alignItems='center' container sx={{ pt: 2 }}>
      <Grid item xs={1}>
        {isValidAddress(address)
          ? <Identicon
            prefix={chain?.ss58Format ?? 42}
            size={40}
            theme={chain?.icon || 'polkadot'}
            value={address}
          />
          : <NoAccountsIcon sx={{ color: grey[400], fontSize: 43 }} />
        }
      </Grid>
      <Grid item xs={11}>
        <Autocomplete
          ListboxProps={{ sx: { fontSize: 12 } }}
          autoFocus
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
              InputLabelProps={{ shrink: true, style: { fontSize: 17 } }}
              autoFocus
              error={!address}
              label={label}
            />
          }
          sx={{ '& .MuiAutocomplete-input, & .MuiInputLabel-root': { fontSize: 13 } }}
        />
      </Grid>
    </Grid>
  );
}
