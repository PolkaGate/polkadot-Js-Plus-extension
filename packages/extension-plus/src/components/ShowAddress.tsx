// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { ContentCopyOutlined as ContentCopyOutlinedIcon } from '@mui/icons-material';
import { Avatar, Grid, Link } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import Identicon from '@polkadot/react-identicon';

import { Chain } from '../../../extension-chains/src/types';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import getLogo from '../util/getLogo';
import ShortAddress from './ShortAddress';

interface Props {
  address: string;
  chain: Chain;
  role?: string;
}

export default function ShowAddress({ address, chain, role }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chainName = chain?.name.replace(' Relay Chain', '');

  return (
    <Grid container item xs={12}>
      <Grid item sx={{ color: grey[600], fontSize: 11, fontWeight: '600', textAlign: 'left', pr: 1 }} xs={3}>
        {role}:
      </Grid>
      <Grid item xs={9}>
        {address &&
          <Grid alignItems='center' container item xs={12}>

            <Grid item xs={1}>
              <Identicon
                prefix={chain?.ss58Format ?? 42}
                size={20}
                theme={chain?.icon || 'polkadot'}
                value={address}
              />
            </Grid>

            <Grid container item justifyContent='flex-start' xs={9}>
              <Grid item sx={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} xs={12}>
                <ShortAddress address={address} fontSize={11} />
                {/* can fetch on-chain identity later */}
              </Grid>

              {/* <Grid item sx={{ color: grey[500], fontSize: 13, textAlign: 'left' }} xs={7}>
                    <ShortAddress address={address} />
                  </Grid> */}

            </Grid>

            <Grid item xs={1}>
              <Link
                href={`https://${chainName}.subscan.io/account/${address}`}
                rel='noreferrer'
                target='_blank'
                underline='none'
              >
                <Avatar
                  alt={'subscan'}
                  src={getLogo('subscan')}
                  sx={{ height: 15, width: 15 }}
                />
              </Link>
            </Grid>
            <Grid item xs={1}>
              <CopyToClipboard text={address}>
                <ContentCopyOutlinedIcon color='primary' sx={{ cursor: 'pointer', fontSize: 12 }} />
              </CopyToClipboard>
            </Grid>
          </Grid>
        }
      </Grid>
    </Grid>
  );
}