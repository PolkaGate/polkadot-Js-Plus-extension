// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

/**
 * @description show reward chart
 * */

import { BarChart as BarChartIcon } from '@mui/icons-material';
import { Divider, Grid } from '@mui/material';
import { grey } from '@mui/material/colors';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import React, { useCallback } from 'react';
import { Bar } from 'react-chartjs-2';

import { ApiPromise } from '@polkadot/api';
import { Chain } from '@polkadot/extension-chains/types';

import useTranslation from '../../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup } from '../../../components';
import { amountToHuman } from '../../../util/plusUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MAX_REWARDS_INFO_TO_SHOW = 20;

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const
    },
    title: {
      display: false,
      text: 'Latest received rewards'
    }
  }
};

interface Props {
  chain?: Chain | null;
  api: ApiPromise;
  setChartModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showChartModal: boolean;
  rewardSlashes: any;
}

export default function RewardChart({ chain, api, rewardSlashes, setChartModalOpen, showChartModal }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const decimals = api && api.registry.chainDecimals[0];
  const token = api && api.registry.chainTokens[0];

  const handleCloseModal = useCallback((): void => {
    setChartModalOpen(false);
  }, [setChartModalOpen]);

  // const getDateOfEra()
  // const getDateOfBlock = async (blockNumber: number) => {
  //   console.log('blockNumber:', blockNumber)
  //   // get the blockhash and API instance at this point of the chain
  //   const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
  //   const apiAt = await api.at(blockHash);

  //   // retrieve the activeEra
  //   const activeEraOpt = await apiAt.query.staking.activeEra();

  //   if (activeEraOpt.isSome) {
  //     console.log('activeEraOpt', activeEraOpt)
  //     console.log('activeEraOpt.unwrap()', activeEraOpt.unwrap())

  //     const { index, start } = activeEraOpt.unwrap();

  //     console.log(`${index.toString()} started at ${new Date(start.unwrap().toNumber()).toString()}`);
  //   } else {
  //     // there has been nothing at this point
  //     console.log('no activeEra found')
  //   }
  // }
  // getDateOfBlock(rewardSlashes.data.list[0].block_num);

  if (!rewardSlashes?.length) return (<></>);

  const sortedRewards = [...rewardSlashes];
  sortedRewards.sort((a, b) => a.era - b.era);

  // TODO: needs a refactore
  // remove duplicate eras
  const dataset = [];

  for (let i = 0; i < sortedRewards.length - 1; i++) {
    if (sortedRewards[i].era === sortedRewards[i + 1].era) {
      dataset.push(sortedRewards[i]?.timeStamp ? sortedRewards[i] : sortedRewards[i + 1]);
      i++;
      continue;
    }
    dataset.push(sortedRewards[i]);
  }

  // const lastIndex = sortedRewards.length - 1;
  // if (sortedRewards[lastIndex - 1].era === sortedRewards[lastIndex].era) {
  //   dataset.push(sortedRewards[lastIndex - 1]?.timeStamp ? sortedRewards[lastIndex - 1] : sortedRewards[lastIndex]);
  // } else {
  //   dataset.push(sortedRewards[lastIndex - 1]);
  // }

  const DescSortedDataset = [...dataset];
  DescSortedDataset.sort((a, b) => b.era - a.era);


  const formateDate = (date: number) => {
    const options = { day: 'numeric', month: "short" };

    return new Date(date * 1000).toLocaleDateString('en-GB', options);
  };

  // show the last MAX_REWARDS_INFO_TO_SHOW records
  const labels = dataset.slice(dataset.length - MAX_REWARDS_INFO_TO_SHOW).map((d) => d.timeStamp ? formateDate(d.timeStamp) : d.era);
  const y = dataset.slice(dataset.length - MAX_REWARDS_INFO_TO_SHOW).map((d) => amountToHuman(d.reward, decimals));

  const data = {
    datasets: [
      {
        backgroundColor: '#ed6c02',
        barPercentage: 0.35,
        data: y,
        label: token
      }
    ],
    labels
  };

  return (
    <Popup handleClose={handleCloseModal} showModal={showChartModal}>
      <PlusHeader action={handleCloseModal} chain={chain} closeText={'Close'} icon={<BarChartIcon fontSize='small' />} title={'Rewards'} />

      <Grid item sx={{ p: '15px 25px 20px' }} xs={12}>
        <Bar data={data} options={options} />
      </Grid>

      <Grid container item sx={{ fontSize: 11, height: '220px', overflowY: 'auto', scrollbarWidth: 'none' }} xs={12}>

        <Grid container item justifyContent='space-between' sx={{ fontSize: 11, fontWeight: '600', p: '5px 25px', mx: '10px' }} xs={12}>
          <Grid item xs={4}>
            {t('Date')}
          </Grid>
          <Grid item sx={{ textAlign: 'center' }} xs={4}>
            {t('Era')}
          </Grid>
          <Grid item sx={{ textAlign: 'right' }} xs={4}>
            {t('Reward')}
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Divider />
        </Grid>

        {DescSortedDataset.slice(0, MAX_REWARDS_INFO_TO_SHOW).map((d, index: number) =>
          <Grid container item justifyContent='space-between' key={index} sx={{ bgcolor: index % 2 && grey[200], p: '5px 25px', mx: '10px' }} xs={12}>
            <Grid item xs={4}>
              {d.timeStamp ? new Date(d.timeStamp * 1000).toDateString() : d.era}
            </Grid>
            <Grid item sx={{ textAlign: 'center' }} xs={4}>
              {d.era}
            </Grid>
            <Grid item sx={{ textAlign: 'right' }} xs={4}>
              {amountToHuman(d.reward, decimals, 9)} {` ${token}`}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Popup>
  );
}
