// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import { FormControl, FormHelperText, Grid, InputLabel, Select, SelectChangeEvent, Skeleton } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';

import Identicon from '@polkadot/react-identicon';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Chain } from '../../../extension-chains/src/types';
import { AccountContext, SettingsContext } from '../../../extension-ui/src/components/contexts';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { ChainInfo } from '../util/plusTypes';
import { amountToHuman, handleAccountBalance } from '../util/plusUtils';

interface Props {
  chain: Chain;
  setSelectedAddress: React.Dispatch<React.SetStateAction<string>>;
  selectedAddress: string;
  availableBalance?: string;
  setAvailableBalance?: React.Dispatch<React.SetStateAction<string>>;
  chainInfo?: ChainInfo;

  text: string;
}

interface nameAddress {
  name?: string;
  address: string;
}

export default function AllAddresses({ availableBalance, chain, chainInfo, selectedAddress, setAvailableBalance, setSelectedAddress, text }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const [allAddresesOnThisChain, setAllAddresesOnThisChain] = useState<nameAddress[]>([]);

  function showAlladdressesOnThisChain(prefix: number): void {
    console.log('accounts', accounts);
    const allAddresesOnSameChain = accounts.map((acc): nameAddress => {
      const publicKey = decodeAddress(acc.address);

      return { name: acc?.name, address: encodeAddress(publicKey, prefix) };
    });

    setAllAddresesOnThisChain(allAddresesOnSameChain);
  }

  useEffect(() => {
    const prefix: number = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    if (prefix !== undefined) { showAlladdressesOnThisChain(prefix); }
  }, [chain, settings]);

  useEffect(() => {
    if (allAddresesOnThisChain.length) { setSelectedAddress(allAddresesOnThisChain[0].address); }
  }, [allAddresesOnThisChain]);

  useEffect(() => {
    if (!selectedAddress) return;

    setAvailableBalance('');

    // eslint-disable-next-line no-void
    void chainInfo.api.query.system.account(selectedAddress).then((result) => {
      const { available } = handleAccountBalance(result.data);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      setAvailableBalance(String(available));
    });
  }, [chainInfo, selectedAddress, setAvailableBalance]);

  const handleAddressChange = (event: SelectChangeEvent) => setSelectedAddress(event.target.value);

  return (
    <Grid
      alignItems='center'
      container
      sx={{ padding: '20px 40px 0px' }}
    >
      <Grid
        item
        sx={{ paddingBottom: 2 }}
        xs={1}
      >
        <Identicon
          prefix={chain?.ss58Format ?? 42}
          size={40}
          theme={chain?.icon || 'polkadot'}
          value={selectedAddress}
        />
      </Grid>

      <Grid
        item
        xs={11}
      >
        <FormControl fullWidth>
          <InputLabel id='selec-address'>{t('Account')}</InputLabel>
          <Select
            label='Select address'
            native
            onChange={handleAddressChange}
            sx={{ fontSize: 12, height: 50 }}
            value={selectedAddress}

          >
            {allAddresesOnThisChain?.map((a) => (
              // <MenuItem key={address} value={address}>
              //   <Grid container alignItems='center' justifyContent='space-between'>
              //     <Grid item>
              //       <Identicon
              //         size={25}
              //         theme={'polkadot'}
              //         value={address}
              //       />
              //     </Grid>
              //     <Grid item sx={{ fontSize: 13 }}>
              //       {address}
              //     </Grid>
              //   </Grid>
              // </MenuItem>
              <option
                key={a.address}
                style={{ fontSize: 13 }}
                value={a.address}
              >
                {a?.name} {':   '} {a.address}
              </option>

            ))}
          </Select>
        </FormControl>
        <FormHelperText>
          <Grid
            container
            item
            justifyContent='space-between'
            xs={12}
          >
            <Grid item>
              {text}
            </Grid>
            <Grid item>
              {t('Balance')} {': '}
              {availableBalance
                ? `${amountToHuman(availableBalance, chainInfo?.decimals)}  ${chainInfo?.coin}`
                : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
              }
            </Grid>
          </Grid>
        </FormHelperText>
      </Grid>

    </Grid>
  );
}
