// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

import { Email as EmailIcon, LaunchRounded as LaunchRoundedIcon, Twitter as TwitterIcon } from '@mui/icons-material';
import { Grid, Link, Skeleton } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import Identicon from '@polkadot/react-identicon';

import { Chain } from '../../../extension-chains/src/types';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { ShortAddress } from '.';

interface Props {
  accountInfo: DeriveAccountInfo;
  chain: Chain;
  iconSize?: number;
  showAddress?: boolean;
  title?: string;
  totalStaked?: string;
  limitLength?: boolean;
}

export default function Identity({ accountInfo, chain, iconSize = 24, limitLength = true, showAddress = false, title = '', totalStaked = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const parentLength = accountInfo?.identity.displayParent?.length || 0;
  let displayLength = accountInfo?.identity.display?.length || 0;
  const LENGTH_LIMIT = 19;

  if (parentLength + displayLength > LENGTH_LIMIT) {
    displayLength = LENGTH_LIMIT - parentLength < 0 ? 0 : LENGTH_LIMIT - parentLength;
  }

  const ICON_SPACE = 3;

  displayLength = accountInfo?.identity.twitter ? displayLength : displayLength + ICON_SPACE;
  displayLength = accountInfo?.identity.web ? displayLength : displayLength + ICON_SPACE;
  displayLength = accountInfo?.identity.email ? displayLength : displayLength + ICON_SPACE;

  return (
    <>
      <Grid container>
        {title &&
          <Grid item sx={{ paddingBottom: '5px' }}>
            {title}
          </Grid>
        }

        {accountInfo
          ? <Grid alignItems='center' container item justifyContent='flex-start' xs={12}>
            <Grid item xs={1}>
              {accountInfo?.accountId &&
                <Identicon
                  prefix={chain?.ss58Format ?? 42}
                  size={iconSize}
                  theme={chain?.icon || 'polkadot'}
                  value={String(accountInfo?.accountId)}
                />}
            </Grid>

            <Grid container item justifyContent='flex-start' spacing={1} sx={{ paddingLeft: '5px' }} xs={11}>
              {accountInfo?.identity.displayParent &&
                <Grid item>
                  {limitLength ? accountInfo?.identity.displayParent.slice(0, LENGTH_LIMIT) : accountInfo?.identity.displayParent} /
                </Grid>
              }
              {accountInfo?.identity.display &&
                <Grid item sx={accountInfo?.identity.displayParent && { color: grey[500] }}>
                  {limitLength ? accountInfo?.identity.display.slice(0, displayLength) : accountInfo?.identity.display} { }
                </Grid>
              }

              {!(accountInfo?.identity.displayParent || accountInfo?.identity.display) &&
                <Grid item sx={{ textAlign: 'letf' }}>
                  {accountInfo?.accountId && <ShortAddress address={String(accountInfo?.accountId)} />}
                </Grid>
              }

              {accountInfo?.identity.twitter &&
                <Grid item>
                  <Link href={`https://TwitterIcon.com/${accountInfo?.identity.twitter}`}>
                    <TwitterIcon
                      color='primary'
                      sx={{ fontSize: 15 }}
                    />
                  </Link>
                </Grid>
              }

              {accountInfo?.identity.email &&
                <Grid item>
                  <Link href={`mailto:${accountInfo?.identity.email}`}>
                    <EmailIcon
                      color='secondary'
                      sx={{ fontSize: 15 }}
                    />
                  </Link>
                </Grid>
              }

              {accountInfo?.identity.web &&
                <Grid item>
                  <Link
                    href={accountInfo?.identity.web}
                    rel='noreferrer'
                    target='_blank'
                  >
                    <LaunchRoundedIcon
                      color='primary'
                      sx={{ fontSize: 15 }}
                    />
                  </Link>
                </Grid>
              }

              {showAddress &&
                <Grid item sx={{ color: grey[500], textAlign: 'left' }} xs={12}>
                  {String(accountInfo?.accountId)}
                </Grid>
              }
              {totalStaked &&
                <Grid item sx={{ color: grey[500], fontSize: 11, lineHeight: '10px', textAlign: 'left' }} xs={12}>
                  {totalStaked}
                </Grid>
              }
            </Grid>
          </Grid>
          : <Skeleton sx={{ fontWeight: 'bold', lineHeight: '16px', width: '80%' }} />
        }
      </Grid>
    </>
  );
}
