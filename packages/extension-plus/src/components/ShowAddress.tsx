// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Autocomplete, FormControl, FormHelperText, Grid, InputLabel, Select, SelectChangeEvent, Skeleton, TextField } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { Balance } from '@polkadot/types/interfaces';

import Identicon from '@polkadot/react-identicon';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Chain } from '../../../extension-chains/src/types';
import { AccountContext, SettingsContext } from '../../../extension-ui/src/components/contexts';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { ChainInfo } from '../util/plusTypes';
import { amountToHuman, handleAccountBalance } from '../util/plusUtils';
import ShortAddress from './ShortAddress';
import { grey } from '@mui/material/colors';

interface nameAddress {
  name?: string;
  address: string;
}

interface Props {
  chain: Chain;
  encodedAddressInfo: nameAddress | undefined;
  setEncodedAddressInfo: React.Dispatch<React.SetStateAction<nameAddress | undefined>>;
  address: string;
  availableBalance?: Balance | undefined;
  setAvailableBalance?: React.Dispatch<React.SetStateAction<Balance | undefined>>;
  chainInfo?: ChainInfo;
  text?: string | Element;
  title?: string;
}

export default function ShowAddresses({ address, availableBalance, chain, chainInfo, encodedAddressInfo, setAvailableBalance, setEncodedAddressInfo, text, title = 'Account' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const settings = useContext(SettingsContext);

  useEffect(() => {
    const prefix: number = chain ? chain.ss58Format : (settings.prefix === -1 ? 42 : settings.prefix);

    if (prefix !== undefined) {
      const selectedAddressJson = accounts.find((acc) => acc.address === address);

      if (!selectedAddressJson) {
        throw new Error(' address not found in accounts!');
      }

      const publicKey = decodeAddress(selectedAddressJson.address);

      setEncodedAddressInfo({ address: encodeAddress(publicKey, prefix), name: selectedAddressJson?.name });
    }
  }, [accounts, chain, address, settings, setEncodedAddressInfo]);

  useEffect(() => {
    if (!encodedAddressInfo || !setAvailableBalance || !chainInfo) return;

    setAvailableBalance(undefined);

    // eslint-disable-next-line no-void
    void chainInfo?.api.derive.balances?.all(encodedAddressInfo.address).then((b) => {
      setAvailableBalance(b?.availableBalance);
    });
  }, [chainInfo, encodedAddressInfo, setAvailableBalance]);

  return (
    <Grid alignItems='center' container sx={{ padding: '20px 40px 0px' }} xs={12}>

      {encodedAddressInfo &&
        <Grid container item xs={12}>
          <Grid item xs={1}>
            <Identicon
              prefix={chain?.ss58Format ?? 42}
              size={30}
              theme={chain?.icon || 'polkadot'}
              value={encodedAddressInfo?.address}
            />
          </Grid>
          <Grid container item justifyContent='flex-start' sx={{ fontSize: 14 }} xs={11}>
            <Grid item sx={{ fontSize: 14, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} xs={8}>
              {encodedAddressInfo?.name || <ShortAddress address={encodedAddressInfo?.address} />}
            </Grid>
            {encodedAddressInfo?.name && <Grid item sx={{ color: grey[500], fontSize: 13, textAlign: 'left' }} xs={8}>
              <ShortAddress address={encodedAddressInfo?.address} />
            </Grid>
            }

            {setAvailableBalance &&
              <Grid data-testid='balance' item xs={4} sx={{ fontSize: 11, textAlign: 'right' }}>
                {t('Available')}{': '}
                {availableBalance
                  ? `${availableBalance?.toHuman()}`
                  : <Skeleton sx={{ display: 'inline-block', fontWeight: '600', width: '50px' }} />
                }
              </Grid>
            }

          </Grid>
        </Grid>
      }
    </Grid>
  );
}
