// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description Lists all councilers information
*/
import { Grid, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import Identity from '../../../../components/Identity';
import { ChainInfo, PersonsInfo } from '../../../../util/plusTypes';
import { amountToHuman } from '../../../../util/plusUtils';

interface Props {
  personsInfo: PersonsInfo;
  membersType?: string;
  chain: Chain;
  chainInfo: ChainInfo;
}

export default function Members({ chain, chainInfo, membersType, personsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  return (
    <>
      <Grid sx={{ fontSize: 14, fontWeigth: 'bold', color: grey[600], fontFamily: 'fantasy', textAlign: 'center', p: '10px 1px 10px' }} xs={12}>
        {membersType}
      </Grid>

      {personsInfo.infos.length
        ? personsInfo.infos.map((m, index) => (
          <Paper elevation={2} key={index} sx={{ borderRadius: '10px', fontSize: 12, margin: '10px 20px 1px', p: '5px 20px 10px 5px' }}>

            <Grid alignItems='center' container justifyContent='space-between'>

              <Grid container item xs={8}>
                <Identity accountInfo={m} chain={chain} />
              </Grid>
              {personsInfo?.backed &&
                <Grid item sx={{ textAlign: 'left' }} xs={4}>
                  {t('Backed')}{': '} {Number(amountToHuman(personsInfo.backed[index], chainInfo.decimals, 2)).toLocaleString()} {chainInfo.coin}
                </Grid>
              }
            </Grid>

          </Paper>))
        : <Grid sx={{ fontSize: 12, pt: 2, textAlign: 'center' }} xs={12}>
          {membersType &&
            <>{t('No ')}{membersType.toLowerCase()} {t(' found')}</>
          }
        </Grid>}

    </>
  )
}
