// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

import { Grid, Paper, Switch } from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useEffect, useState } from 'react';

import { Chain } from '../../../../../../../extension-chains/src/types';
import useTranslation from '../../../../../../../extension-ui/src/hooks/useTranslation';
import Identity from '../../../../../components/Identity';
import { MAX_VOTES } from '../../../../../util/constants';
import { ChainInfo, PersonsInfo } from '../../../../../util/plusTypes';
import { amountToHuman } from '../../../../../util/plusUtils';

interface Props {
  personsInfo: PersonsInfo;
  membersType?: string;
  chain: Chain;
  chainInfo: ChainInfo;
  setSelectedCandidates: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function VoteMembers({ chain, chainInfo, membersType, personsInfo, setSelectedCandidates }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const personsArray = personsInfo.infos.map((info, index) => { return { backed: personsInfo.backed[index], info: info, selected: false }; });

  const [candidates, setCandidates] = useState(personsArray);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    // check if reached to MAX_VOTES
    if (event.target.checked && (candidates.filter((c) => c.selected)).length === MAX_VOTES) {
      event.target.checked = false;

      return;
    }

    const lastSelectedIndex = candidates.indexOf(candidates.find((p) => p.selected === false));
    const temp = candidates[index];

    temp.selected = event.target.checked;
    candidates.splice(index, 1);
    candidates.splice(lastSelectedIndex, 0, temp);
    setCandidates([...candidates]);
  };

  useEffect(() => {
    setSelectedCandidates(candidates.filter((c) => c.selected).map((c) => c.info.accountId.toString()));
  }, [candidates]);

  return (
    <>
      <Grid sx={{ color: grey[600], fontSize: 14, fontFamily: 'fantasy', fontWeigth: 'bold', textAlign: 'center', p: '10px 1px 10px' }} xs={12}>
        {membersType}
      </Grid>

      {candidates.map((p, index) => (
        <Paper elevation={2} key={index} sx={{ borderRadius: '10px', margin: '10px 10px 1px', p: '5px 10px 5px' }}>
          <Grid container sx={{ fontSize: 12 }}>

            <Grid container item xs={7}>
              <Identity accountInfo={p.info} chain={chain} />
            </Grid>

            {p?.backed &&
              <Grid item sx={{ textAlign: 'left' }} xs={4}>
                {t('Backed')}{': '} {amountToHuman(p.backed, chainInfo.decimals, 2)} {chainInfo.coin}
              </Grid>
            }

            <Grid alignItems='center' item xs={1}>
              <Switch checked={p.selected} onChange={(e) => handleSelect(e, index)} size='small' />
            </Grid>

          </Grid>
        </Paper>))
      }
    </>
  );
}
