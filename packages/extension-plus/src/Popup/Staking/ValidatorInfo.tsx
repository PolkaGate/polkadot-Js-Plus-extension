// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE this component shows a validator's info in a page including its nominators listand a link to subscan */
import { BubbleChart as BubbleChartIcon } from '@mui/icons-material';
import { Avatar, Container, Divider, Grid, Link, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { Dispatch, SetStateAction, useCallback } from 'react';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';
import { Chain } from '@polkadot/extension-chains/types';
import Identicon from '@polkadot/react-identicon';

import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup, ShortAddress } from '../../components';
import getLogo from '../../util/getLogo';
import { ChainInfo } from '../../util/plusTypes';
import { amountToHuman } from '../../util/plusUtils';
import Identity from '../../components/Identity';

interface Props {
  chain: Chain;
  chainInfo: ChainInfo;
  showValidatorInfoModal: boolean;
  setShowValidatorInfoModal: Dispatch<SetStateAction<boolean>>;
  info: DeriveStakingQuery;
  validatorsIdentities: DeriveAccountInfo[] | null;
}

export default function ValidatorInfo({ chain, chainInfo, info, setShowValidatorInfoModal, showValidatorInfoModal, validatorsIdentities }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const accountInfo = validatorsIdentities?.find((v) => v.accountId === info?.accountId);
  const chainName = chain?.name.replace(' Relay Chain', '');

  const handleDetailsModalClose = useCallback(
    (): void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      setShowValidatorInfoModal(false);
    }, [setShowValidatorInfoModal]);

  return (
    <Popup handleClose={handleDetailsModalClose} id='scrollArea' showModal={showValidatorInfoModal}>
      <PlusHeader action={handleDetailsModalClose} chain={chain} closeText={'Close'} icon={<BubbleChartIcon fontSize='small' />} title={'Validator Info'} />
      <Container sx={{ p: '0px 20px' }}>
        <Grid item sx={{ p: 1 }} xs={12}>
          <Paper elevation={3}>
            <Grid container item justifyContent='center' sx={{ fontSize: 12, textAlign: 'center', p: '20px 10px 20px' }}>
              <Grid item sx={{ height: '40px' }} xs={12}>
                {accountInfo && <Identity accountInfo={accountInfo} chain={chain} iconSize={40} showAddress={true} />}
              </Grid>
              <Grid item sx={{ p: '10px 0px 20px' }} xs={12}>
                <Divider />
              </Grid>
              <Grid item sx={{ textAlign: 'left', pl: 3 }} xs={6}>
                {t('Own')}{': '}{Number(info?.exposure.own || info?.stakingLedger.active).toLocaleString()} {' '}{chainInfo?.coin}
              </Grid>
              <Grid item sx={{ textAlign: 'right', pr: 3 }} xs={6}>
                {t('Total')}{': '}{Number(info?.exposure.total).toLocaleString()}{' '}{chainInfo?.coin}
              </Grid>
              <Grid item sx={{ textAlign: 'left', pt: 1, pl: 3 }} xs={11}>
                {t('Commission')}{': '}   {info.validatorPrefs.commission === 1 ? 0 : info.validatorPrefs.commission / (10 ** 7)}%
              </Grid>
              <Grid item sx={{ pt: 1, pr: 3 }} xs={1}>
                <Link
                  href={`https://${chainName}.subscan.io/account/${info?.accountId}`}
                  rel='noreferrer'
                  target='_blank'
                  underline='none'
                >
                  <Avatar
                    alt={'subscan'}
                    src={getLogo('subscan')}
                    sx={{ height: 18, width: 18 }}
                  />
                </Link>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid container item justifyContent='center' spacing={1} xs={12}>
          <Grid item sx={{ textAlign: 'center', color: grey[600], fontFamily: 'fantasy', fontSize: 15, padding: '10px 0px 5px' }}>
            {t('Nominators')}
          </Grid>
          <Grid item sx={{ fontSize: 12 }} >
            ({info?.exposure?.others?.length})
          </Grid>
        </Grid>
        <Grid item sx={{ bgcolor: 'background.paper', height: '300px', overflowY: 'auto', scrollbarWidth: 'none', width: '100%', p: 2 }} xs={12}>
          {info?.exposure?.others.map(({ value, who }) => (
            <Paper elevation={2} key={who} sx={{ p: 1, m: 1 }}>
              <Grid alignItems='center' container item justifyContent='space-between' sx={{ fontSize: 12 }}>
                <Grid item xs={1}>
                  <Identicon
                    prefix={chain?.ss58Format ?? 42}
                    size={30}
                    theme={chain?.icon || 'polkadot'}
                    value={who}
                  />
                </Grid>
                <Grid item sx={{ textAlign: 'left' }} xs={6}>
                  <ShortAddress address={who} charsCount={8} />
                </Grid>
                <Grid item sx={{ textAlign: 'right' }} xs={5}>
                  {Number(amountToHuman(value, chainInfo?.decimals)).toLocaleString()} {' '}{chainInfo?.coin}
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Grid>
      </Container>
    </Popup>
  );
}
