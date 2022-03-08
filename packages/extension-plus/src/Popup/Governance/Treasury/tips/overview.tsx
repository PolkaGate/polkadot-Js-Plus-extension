// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import { Avatar, Button, Divider, Grid, Link, Paper, Stack } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import Identity from '../../../../components/Identity';
import getLogo from '../../../../util/getLogo';
import { ChainInfo } from '../../../../util/plusTypes';
import { amountToHuman } from '../../../../util/plusUtils';

interface Judgment {
  index: number;
  judgement: string;
}

interface AccountInf {
  address: string;
  display: string;
  judgements: Judgment[] | null;
  account_index: string;
  identity: boolean;
  parent: string | null
}

interface Tip {
  block_num: number;
  reason: string;
  hash: string;
  extrinsic_index: string;
  status: string;
  amount: string;
  close_block_num: number;
  tipper_num: number;
  finder: AccountInf;
  beneficiary: AccountInf;
}

interface Props {
  tips: Tip[];
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
    <>
      <Grid container justifyContent='flex-end' xs={12}>
        <Grid item sx={{ p: '10px 30px' }}>
          <Button color='warning' onClick={handleSubmitTip} size='small' startIcon={<AddCircleRoundedIcon />} variant='outlined'>
            {t('sSubmit')}
          </Button>
        </Grid>
      </Grid>

      {tips.map((tip, index) => {
        const finderAccountInfo = { accountId: tip.finder.address, identity: { display: tip.finder.display, judgements: tip.finder.judgements } };
        const beneficiaryAccountInfo = { accountId: tip.beneficiary.address, identity: { display: tip.beneficiary.display, judgements: tip.beneficiary.judgements } };

        return (
          <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '20px 30px 10px', p: '10px 20px' }}>
            <Grid alignItems='center' container justifyContent='space-between'>

              <Grid container item justifyContent='space-between' sx={{ fontSize: 12, pb: '5px' }} xs={12}>
                <Grid item>
                  {t('Status')}{': '}{tip.status}
                </Grid>
                <Grid item>
                  {t('Tippers')}{': '}{tip.tipper_num}
                </Grid>
                <Grid item>
                  {t('Amount')}{': '}{amountToHuman(tip.amount, chainInfo.decimals)}{' '}{chainInfo?.coin}
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid container item justifyContent='flex-end' spacing={1} xs={12}>
                <Grid item>
                  <Link
                    href={`https://${chainName}.subscan.io/extrinsic/${tip?.extrinsic_index}`}
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
              </Grid>

              <Grid item sx={{ fontSize: 12 }} xs={12}>
                <strong>{t('Reason')}</strong><br />{tip.reason}
              </Grid>

              <Grid item sx={{ fontSize: 12, pt: '15px', textAlign: 'left' }} xs={12}>
                {tip?.finder &&
                  <Identity accountInfo={finderAccountInfo} chain={chain} showAddress title={t('Finder')} />
                }
              </Grid>

              <Grid item sx={{ fontSize: 12, pt: 1, textAlign: 'left' }} xs={12}>
                {tip?.beneficiary &&
                  <Identity accountInfo={beneficiaryAccountInfo} chain={chain} showAddress title={t('Beneficiary')} />
                }
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
    </>
  );
}
