// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { AddCircleRounded as AddCircleRoundedIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Button, Divider, Grid, Link, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useCallback, useState } from 'react';

import { PalletTipsOpenTip } from '@polkadot/types/lookup';
import { Option } from '@polkadot/types-codec';

import { Chain } from '../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../extension-ui/src/hooks/useTranslation';
import Identity from '../../../../components/Identity';
import getLogo from '../../../../util/getLogo';
import getCouncilMembersInfo from '../../../../util/api/getCouncilMembersInfo';

import { ChainInfo } from '../../../../util/plusTypes';
import { amountToHuman } from '../../../../util/plusUtils';
import SubmitTip from './SubmitTip';
import { AccountId32 } from '@polkadot/types/interfaces/runtime';
import { u128 } from '@polkadot/types-codec';
import type { DeriveAccountInfo } from '@polkadot/api-derive/types';

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
  address: string;
  tips: Tip[];
  chain: Chain;
  chainInfo: ChainInfo;
}

export default function Overview({ address, chain, chainInfo, tips }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chainName = chain?.name.replace(' Relay Chain', '');
  const [showSubmitTipModal, setShowSubmitTipModal] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<number>(-1);
  const [tippers, setTippers] = useState<[DeriveAccountInfo, u128][][]>();

  const { api } = chainInfo;

  const handleSubmitTip = useCallback(() => { setShowSubmitTipModal(true); }, []);
  const handleSubmitTipModalClose = useCallback(() => { setShowSubmitTipModal(false); }, []);

  const handleAccordionChange = useCallback((panel: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : -1);
  }, []);

  // eslint-disable-next-line no-void
  void React.useMemo(async () => {
    const wrappedTips: Option<PalletTipsOpenTip>[] = await Promise.all(tips?.map((tip) => api.query.tips.tips(tip.hash)));
    const councilMembersInfo: DeriveAccountInfo[] = await getCouncilMembersInfo(chainName);

    if (!councilMembersInfo.length) return;

    console.log('councilMembersInfo:', councilMembersInfo);

    const unWrappedTips = wrappedTips?.map((t) => t.isSome && t.unwrap());

    const tipInfos = unWrappedTips?.map((tip: PalletTipsOpenTip): [DeriveAccountInfo, u128][] => {
      return tip?.tips?.map((accountVal: [AccountId32, u128]): [DeriveAccountInfo, u128] => {
        return [councilMembersInfo.find((c) => c.accountId.toString() === accountVal[0].toString()), api.createType('Balance', accountVal[1])];
      });
    });

    setTippers(tipInfos);
  }, [api.query.tips, chainName, tips]);


  console.log('tippers:', tippers);

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
            {t('Submit')}
          </Button>
        </Grid>
      </Grid>

      {tips.map((tip, index) => {
        const finderAccountInfo = { accountId: tip.finder.address, identity: { display: tip.finder.display, judgements: tip.finder.judgements } };
        const beneficiaryAccountInfo = { accountId: tip.beneficiary.address, identity: { display: tip.beneficiary.display, judgements: tip.beneficiary.judgements } };

        return (
          <Paper elevation={4} key={index} sx={{ borderRadius: '10px', margin: '10px 30px 10px' }}>

            <Accordion disableGutters expanded={expanded === index} onChange={handleAccordionChange(index)} sx={{ flexGrow: 1, fontSize: 12 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container justifyContent='space-between' xs={12}>
                  <Grid item>
                    {t('Status')}{': '}{tip.status}
                  </Grid>
                  <Grid item>
                    {t('Amount')}{': '}{amountToHuman(tip.amount, chainInfo.decimals)}{' '}{chainInfo.coin}
                  </Grid>
                  <Grid item>
                    {t('Tippers')}{': '}{tip.tipper_num}
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: grey[200], p: 0 }}>

                {tippers && !!tippers[index]?.length && tippers[index]?.map((t: [DeriveAccountInfo, u128], index: number) => (
                  <Grid container justifyContent='space-between' key={index} xs={12}>
                    <Grid item xs={9} sx={{ textAlign: 'left' }}>
                      <Identity accountInfo={t[0]} chain={chain} showSocial={false} />
                    </Grid>
                    <Grid item sx={{ pr: 1, textAlign: 'right' }} xs={3}>
                      {t[1].toHuman()}
                    </Grid>
                  </Grid>
                ))}
              </AccordionDetails>
            </Accordion>

            <Grid alignItems='center' container justifyContent='space-between' sx={{ p: '10px 20px' }}>

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

      {showSubmitTipModal &&
        <SubmitTip
          address={address}
          chain={chain}
          chainInfo={chainInfo}
          handleSubmitTipModalClose={handleSubmitTipModalClose}
          showSubmitTipModal={showSubmitTipModal}
        />
      }
    </>
  );
}
