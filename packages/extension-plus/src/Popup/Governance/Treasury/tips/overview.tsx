// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Container, Grid, Paper } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import { ChainInfo } from '../../../../util/plusTypes';
import SubmitTip from './SubmitTip';

interface Props {
  tips: any[];
  chain: Chain;
  chainInfo: ChainInfo;
  currentBlockNumber: number;
}

export default function Overview({ chain, chainInfo, currentBlockNumber, tips }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chainName = chain?.name.replace(' Relay Chain', '');
  const [showSubmitTipModal, setShowSubmitTipModal] = useState<boolean>(false);

  const handleSubmitTip = useCallback(() => {
    setShowSubmitTipModal(true);
  }, []);

  console.log('tips:', tips);

  const handleSubmitTipModalClose = useCallback(() => {
    setShowSubmitTipModal(false);
  }, []);

  if (!tips) {
    return (
      <Grid sx={{ fontSize: 12, paddingTop: 3, textAlign: 'center' }} xs={12}>
        {t('No tips')}
      </Grid>
    );
  }

  return (
    <Container disableGutters>
      {/* <Grid container justifyContent='flex-start' xs={12}>
        <Grid sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, fontWeigth: 'bold', p: '10px 30px 10px', textAlign: 'left' }} xs={4}>
          {showSubmit &&
            <Button onClick={handleSubmitProposal} size='small' startIcon={<AddCircleRoundedIcon />} color='warning' variant='outlined'>
              {t('Submit')}
            </Button>
          }
        </Grid>
        <Grid sx={{ color: grey[600], fontFamily: 'fantasy', fontSize: 15, fontWeigth: 'bold', p: '10px 30px 10px', textAlign: 'center' }} xs={4}>
          {title}
        </Grid>
      </Grid> */}

      {tips.map((tip, index) => {
        // const proposerAccountInfo = identities?.find((i) => i.accountId.toString() === t.proposal.proposer.toString());
        // const beneficiaryAccountInfo = identities?.find((i) => i.accountId.toString() === t.proposal.beneficiary.toString());

        return (
          <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 20px' }}>
            <Grid alignItems='center' container justifyContent='space-between'>

              <Grid item sx={{ fontSize: 12 }}>
                {/* {t('reason')}{': '}{tip.reason} */}
              </Grid>

            </Grid>
          </Paper>);
      })}

      {/* {showSubmitTipModal &&
        <SubmitTip
          chain={chain}
          chainInfo={chainInfo}
          handleSubmitTipModalClose={handleSubmitTipModalClose}
          showSubmitTipModal={showSubmitTipModal}
        />
      } */}
    </Container>
  );
}
