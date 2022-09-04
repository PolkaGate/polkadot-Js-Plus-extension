// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable react/jsx-max-props-per-line */
/* eslint-disable header/header */

/**
 * @description
 *  this component provides a place to select a suitable Proxy account to continue
 * */

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { AccountJson } from '../../../../extension-base/src/background/types';

import { SendOutlined as SendOutlinedIcon } from '@mui/icons-material';
import { Container, FormControlLabel, Grid, Radio, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api';
import { NextStepButton } from '@polkadot/extension-ui/components';

import { Chain } from '../../../../extension-chains/src/types';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, Progress, ShortAddress } from '../../components';
import { NameAddress, Proxy } from '../../util/plusTypes';

interface Props {
  api: ApiPromise | undefined;
  selectProxyModalOpen: boolean;
  chain: Chain;
  setProxy: React.Dispatch<React.SetStateAction<AccountJson | undefined>>
  setSelectProxyModalOpen: Dispatch<SetStateAction<boolean>>;
  realAddress: string;
  allAddresesOnSameChain: { formattedAddress: string, account: AccountJson }[];
  setTransferModalOpen: Dispatch<SetStateAction<boolean>>;
  acceptableTypes: ProxyTypes[];
}

export default function SelectProxy({ acceptableTypes, allAddresesOnSameChain, api, chain, realAddress, selectProxyModalOpen, setProxy, setSelectProxyModalOpen, setTransferModalOpen }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [proxies, setProxies] = useState<Proxy[] | undefined>();
  const [selectedOption, setSelectedOption] = useState<number | undefined>();

  useEffect(() => {
    realAddress && api && api.query.proxy?.proxies(realAddress).then((proxies) => setProxies(JSON.parse(JSON.stringify(proxies[0]))));
  }, [api, chain, realAddress]);

  const isAvailable = useCallback((address: string): NameAddress => allAddresesOnSameChain?.find((a) => a.formattedAddress === address), [allAddresesOnSameChain]);

  const handleSelectProxyModalClose = useCallback((): void => {
    setSelectProxyModalOpen(false);
    setTransferModalOpen(false);
  }, [setSelectProxyModalOpen, setTransferModalOpen]);

  const handleOptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(Number(event.target.value));
  }, []);

  const handleSetProxy = useCallback(() => {
    // const selectedProxyAddress = selectedOption && proxies && proxies[selectedOption].delegate;
    // selectedProxyAddress && setProxy(allAddresesOnSameChain?.find((a) => a.formattedAddress === selectedProxyAddress));
    selectedOption && proxies && setProxy(proxies[selectedOption]);
    setSelectProxyModalOpen(false);
  }, [proxies, selectedOption, setProxy, setSelectProxyModalOpen]);

  return (
    <Popup handleClose={handleSelectProxyModalClose} showModal={selectProxyModalOpen}>
      <PlusHeader action={handleSelectProxyModalClose} chain={chain} closeText={'Close'} icon={<SendOutlinedIcon fontSize='small' sx={{ transform: 'rotate(-45deg)' }} />} title={t('Select Proxy')} />
      <Container sx={{ pt: '30px' }}>
        <Grid item sx={{ mb: '40px' }}>
          <Typography variant='subtitle2'>
            {t('Since this is a real address (can not sign transactions), hence, you need to select an appropriate proxy of the account to do Transfer on behalf')}
          </Typography>
        </Grid>
        <Grid container item sx={{ fontSize: 14, fontWeight: 500, bgcolor: grey[200], borderRadius: '5px', py: '5px', px: '10px' }}>
          <Grid item xs={3}>
            {t('address')}
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
          <Grid item xs={1}>
            {t('select')}
          </Grid>
        </Grid>
        <Grid alignItems='flex-start' container item sx={{ borderLeft: '2px solid', borderRight: '2px solid', borderBottom: '2px solid', borderBottomLeftRadius: '30px 10%', borderColor: grey[200], display: 'inline-table', pt: '15px', pl: '10px', height: 300, overflowY: 'auto' }} xs={12}>
          {chain && realAddress &&
            <>
              {proxies
                ? proxies.length
                  ? proxies.map((proxy, index) => {
                    const localAccount = isAvailable(proxy.delegate)?.account;

                    return (
                      <Grid alignItems='center' container item key={index} sx={{ fontSize: 12 }}>
                        <Grid item xs={3}>
                          <ShortAddress address={proxy.delegate} fontSize={12} />
                        </Grid>
                        <Grid item xs={3}>
                          {proxy.proxyType}
                        </Grid>
                        <Grid item xs={2}>
                          {proxy.delay}
                        </Grid>
                        <Grid item xs={3} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {!!localAccount ? `Yes (${localAccount.name})` : 'No'}
                        </Grid>
                        <Grid item xs={1}>
                          <FormControlLabel
                            control={
                              <Radio
                                checked={selectedOption === index}
                                disabled={!localAccount || !acceptableTypes.includes(proxy.proxyType)}
                                onChange={handleOptionChange}
                                size='small'
                                value={index} />
                            }
                            label='' value={index} />
                        </Grid>
                      </Grid>
                    )
                  })
                  : <Grid item pt='10px'>
                    {t('No proxies found for the entered real account on {{chain}}', { replace: { chain: chain?.name } })}
                  </Grid>
                : <Progress pt={'30px'} title={'Loading proxies ...'} />
              }
            </>}
        </Grid>
        <Grid item sx={{ pt: '30px' }} xs={12}>
          <NextStepButton
            data-button-action='OK'
            isDisabled={!realAddress || !selectedOption}
            onClick={handleSetProxy}
          >
            {t('Next')}
          </NextStepButton>
        </Grid>
      </Container>
    </Popup>
  );
}
