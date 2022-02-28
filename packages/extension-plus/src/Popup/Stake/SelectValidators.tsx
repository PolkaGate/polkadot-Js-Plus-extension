// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** NOTE in this component manual selection of validators is provided, with some filtering features to facilitate selection process */
import type { StakingLedger } from '@polkadot/types/interfaces';

import { ArrowDropDown as ArrowDropDownIcon, ArrowDropUp as ArrowDropUpIcon, Delete as DeleteIcon, RecommendOutlined as RecommendOutlinedIcon, Search as SearchIcon } from '@mui/icons-material';
import { Box, Checkbox, Container, FormControlLabel, Grid, InputAdornment, Paper, TextField } from '@mui/material';
import { grey, pink } from '@mui/material/colors';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useState } from 'react';

import { DeriveAccountInfo, DeriveStakingQuery } from '@polkadot/api-derive/types';

import { Chain } from '../../../../extension-chains/src/types';
import { NextStepButton } from '../../../../extension-ui/src/components';
import useTranslation from '../../../../extension-ui/src/hooks/useTranslation';
import { PlusHeader, Popup } from '../../components';
import Hint from '../../components/Hint';
import { DEFAULT_VALIDATOR_COMMISION_FILTER } from '../../util/constants';
import { AccountsBalanceType, ChainInfo, StakingConsts, Validators } from '../../util/plusTypes';
import ConfirmStaking from './ConfirmStaking';
import ShowValidator from './ShowValidator';
import ValidatorInfo from './ValidatorInfo';

interface Props {
  chain?: Chain | null;
  chainInfo: ChainInfo;
  staker: AccountsBalanceType;
  showSelectValidatorsModal: boolean;
  nominatedValidators: DeriveStakingQuery[] | null;
  setSelectValidatorsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  stakingConsts: StakingConsts;
  stakeAmount: bigint;
  validatorsInfo: Validators;
  setState: React.Dispatch<React.SetStateAction<string>>;
  state: string;
  ledger: StakingLedger | null;
  validatorsIdentities: DeriveAccountInfo[] | null;
}

interface Data {
  name: string;
  commission: number;
  nominator: number;
  total: string;
}

interface TableRowProps {
  chain: Chain;
  validators: DeriveStakingQuery[];
  chainInfo: ChainInfo;
  nominatedValidators: DeriveStakingQuery[];
  stakingConsts: StakingConsts;
  searchedValidators: DeriveStakingQuery[];
  setSearchedValidators: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  selected: DeriveStakingQuery[];
  setSelected: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  searching: boolean;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  validatorsIdentities: DeriveAccountInfo[];
}

interface ToolbarProps {
  numSelected: number;
  setSelected: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  setSearchedValidators: React.Dispatch<React.SetStateAction<DeriveStakingQuery[]>>;
  stakingConsts: StakingConsts;
  validators: DeriveStakingQuery[];
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
  validatorsIdentities: DeriveAccountInfo[];
}

function descendingComparator<T>(a: DeriveStakingQuery, b: DeriveStakingQuery, orderBy: keyof T) {
  let A, B;

  switch (orderBy) {
    case ('commission'):
      A = a.validatorPrefs.commission;
      B = b.validatorPrefs.commission;
      break;
    case ('nominator'):
      A = a.exposure.others.length;
      B = b.exposure.others.length;
      break;
    default:
      A = a.accountId;
      B = b.accountId;
  }

  if (B < A) {
    return -1;
  }

  if (B > A) {
    return 1;
  }

  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<T>(order: Order, orderBy: keyof T): (a: DeriveStakingQuery, b: DeriveStakingQuery) => number {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
}

const TableToolbar = (props: ToolbarProps) => {
  const { numSelected, setSearchedValidators, setSearching, setSelected, stakingConsts, validators, validatorsIdentities } = props;
  const { t } = useTranslation();

  const handleValidatorSearch = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const keyWord = event.target.value;

    setSearching(!!keyWord);

    const haveSearchKeywordInAccountId = validators.filter((item) => String(item.accountId).toLowerCase().includes(keyWord.toLowerCase()));
    const haveSearchKeywordInName = validatorsIdentities?.filter((item) => `${item.identity.display}${item.identity.displayParent}`.toLowerCase().includes(keyWord.toLowerCase()));

    haveSearchKeywordInName?.forEach((item) => {
      const f = validators.find((v) => v.accountId === item.accountId);

      if (f) haveSearchKeywordInAccountId.push(f);
    });

    setSearchedValidators(haveSearchKeywordInAccountId);
  }, [setSearchedValidators, setSearching, validators, validatorsIdentities]);

  return (
    <Grid alignItems='center' container justifyContent='space-between' sx={{ borderRadius: '5px', p: '0px 10px 10px' }}>
      <Grid container item xs={6}>
        <Grid item>
          <Typography color='inherit' component='div' sx={{ fontSize: 13, fontWeight: 'bold' }}>
            {numSelected} / {stakingConsts?.maxNominations}    {t('Selected')}
          </Typography>
        </Grid>
        <Grid item sx={{ pl: 1 }}>
          {!!numSelected &&
            <Hint id='delete' place='right' tip='Delete'>
              <DeleteIcon onClick={() => setSelected([])} sx={{ color: pink[500], cursor: 'pointer', fontSize: 18 }} />
            </Hint>
          }
        </Grid>
      </Grid>
      <Grid item xs={6}>
        <TextField
          InputProps={{ endAdornment: (<InputAdornment position='end'><SearchIcon /></InputAdornment>) }}
          autoComplete='off'
          color='warning'
          fullWidth
          // label={t('Search')}
          name='search'
          onChange={handleValidatorSearch}
          // placeholder='Filter with Address/Name'
          size='small'
          sx={{ fontSize: 11 }}
          type='text'
          variant='outlined'
        />
      </Grid>
    </Grid>
  );
};

function ValidatorSelectionTable({ chain, chainInfo, nominatedValidators, searchedValidators, searching, selected, setSearchedValidators, setSearching, setSelected, stakingConsts, validators, validatorsIdentities }: TableRowProps) {
  const { t } = useTranslation();

  let notSelectedValidators = searching ? searchedValidators : validators;

  notSelectedValidators = notSelectedValidators?.filter((v) => !selected.filter((s) => s.accountId === v.accountId).length);

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Data>('name');
  const [showValidatorInfoModal, setShowValidatorInfoModal] = useState<boolean>(false);
  const [info, setInfo] = useState<DeriveStakingQuery>();

  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = orderBy === property && order === 'asc';

    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSwitched = useCallback((event: React.MouseEvent<unknown>, validator: DeriveStakingQuery) => {
    const selectedIndex = selected.indexOf(validator);

    if (selected.length >= stakingConsts.maxNominations && selectedIndex === -1) {
      console.log('Max validators are selected !');

      return;
    }

    let newSelected: DeriveStakingQuery[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, validator);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  }, [selected, setSelected, stakingConsts.maxNominations]);

  const isSelected = useCallback((v: DeriveStakingQuery) => selected.indexOf(v) !== -1, [selected]);

  const isInNominatedValidators = useCallback((v: DeriveStakingQuery) => !!(nominatedValidators?.find((n) => n.accountId === v.accountId)), [nominatedValidators]);

  const handleMoreInfo = useCallback((info: DeriveStakingQuery) => {
    setShowValidatorInfoModal(true);
    setInfo(info);
  }, []);

  const Header = () => (
    <Paper elevation={2} sx={{ backgroundColor: grey[600], borderRadius: '5px', color: 'white', p: '5px 15px 5px' }}>
      <Grid alignItems='center' container id='header' sx={{ fontSize: 11 }}>
        <Grid item xs={1}>
          {t('More')}
        </Grid>
        <Grid item sx={{ fontSize: 12 }} xs={5}>
          {t('Identity')}
        </Grid>
        <Grid alignItems='center' container item onClick={(e) => handleRequestSort(e, 'commission')} sx={{ textAlign: 'right', cursor: 'pointer' }} xs={2}>
          <Grid item xs={6}> {order === 'asc' && orderBy === 'commission' ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}</Grid>
          <Grid item xs={6}> {t('Commision')}</Grid>
        </Grid>
        <Grid alignItems='center' container item onClick={(e) => handleRequestSort(e, 'nominator')} sx={{ textAlign: 'right', cursor: 'pointer' }} xs={2}>
          <Grid item xs={6}> {order === 'asc' && orderBy === 'nominator' ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}</Grid>
          <Grid item xs={6}> {t('Nominators')}</Grid>
        </Grid>
        <Grid item sx={{ pl: '40px' }} xs={2}>
          {t('Select')}
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Container sx={{ overflowY: 'hidden', padding: '5px 10px', width: '100%' }}>
      <TableToolbar numSelected={selected.length} setSearchedValidators={setSearchedValidators} setSearching={setSearching} setSelected={setSelected} stakingConsts={stakingConsts} validators={notSelectedValidators} validatorsIdentities={validatorsIdentities} />

      <Header />

      <Container disableGutters sx={{ height: 325, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {selected && selected.slice().sort(getComparator(order, orderBy)).map((validator, index) =>
          <ShowValidator
            chain={chain}
            handleMoreInfo={handleMoreInfo}
            handleSwitched={handleSwitched}
            isInNominatedValidators={isInNominatedValidators}
            isSelected={isSelected}
            key={index}
            showSwitch={true}
            stakingConsts={stakingConsts}
            validator={validator}
            validatorsIdentities={validatorsIdentities}
          />)}

        {notSelectedValidators && notSelectedValidators.slice().sort(getComparator(order, orderBy)).map((validator, index) =>
          <ShowValidator
            chain={chain}
            handleMoreInfo={handleMoreInfo}
            handleSwitched={handleSwitched}
            isInNominatedValidators={isInNominatedValidators}
            isSelected={isSelected}
            key={index}
            showSwitch={true}
            stakingConsts={stakingConsts}
            validator={validator}
            validatorsIdentities={validatorsIdentities}
          />)}
      </Container>

      {showValidatorInfoModal && info &&
        <ValidatorInfo
          chain={chain}
          chainInfo={chainInfo}
          info={info}
          setShowValidatorInfoModal={setShowValidatorInfoModal}
          showValidatorInfoModal={showValidatorInfoModal}
          validatorsIdentities={validatorsIdentities}
        />
      }
    </Container>
  );
}

export default function SelectValidators({ chain, chainInfo, ledger, nominatedValidators, setSelectValidatorsModalOpen, setState, showSelectValidatorsModal, stakeAmount, staker, stakingConsts, state, validatorsIdentities, validatorsInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [validators, setValidators] = useState<DeriveStakingQuery[]>([]);
  const [searchedValidators, setSearchedValidators] = useState<DeriveStakingQuery[]>();
  const [searching, setSearching] = useState<boolean>(false);
  const [filterHighCommissionsState, setFilterHighCommissions] = useState(true);
  const [filterOverSubscribedsState, setFilterOverSubscribeds] = useState(true);
  const [filterNoNamesState, setFilterNoNames] = useState(false);
  const [filterWaitingsState, setFilterWaitings] = useState(true);
  const [selected, setSelected] = useState<DeriveStakingQuery[]>([]);
  const [showConfirmStakingModal, setConfirmStakingModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setValidators(validatorsInfo?.current.concat(validatorsInfo?.waiting));
  }, [validatorsInfo]);

  useEffect(() => {
    let filteredValidators = validatorsInfo.current.concat(validatorsInfo.waiting);

    // at first filtered blocked validatorsInfo
    filteredValidators = filteredValidators?.filter((v) => !v.validatorPrefs.blocked);

    filteredValidators = filterWaitingsState ? filteredValidators?.filter((v) => v.exposure.others.length !== 0) : filteredValidators;

    if (filterOverSubscribedsState) {
      filteredValidators = filteredValidators?.filter((v) => v.exposure.others.length < stakingConsts.maxNominatorRewardedPerValidator);
    }

    if (filterHighCommissionsState) {
      filteredValidators = filteredValidators?.filter((v) => Number(v.validatorPrefs.commission) / (10 ** 7) <= DEFAULT_VALIDATOR_COMMISION_FILTER);
    }

    if (filterNoNamesState && validatorsIdentities) {
      filteredValidators = filteredValidators?.filter((v) =>
        validatorsIdentities.find((i) => i.accountId === v.accountId && (i.identity.display || i.identity.displayParent)));
    }

    // remove filtered validators from the selected list
    const selectedTemp = [...selected];

    selected.forEach((s, index) => {
      if (!filteredValidators.find((f) => f.accountId === s.accountId)) {
        selectedTemp.splice(index, 1);
      }
    });
    setSelected([...selectedTemp]);

    setValidators(filteredValidators);
  }, [filterHighCommissionsState, filterNoNamesState, filterOverSubscribedsState, filterWaitingsState, stakingConsts, validatorsInfo, validatorsIdentities]);

  const filterHighCommisions = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterHighCommissions(event.target.checked);
  }, []);

  const filterWaitings = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterWaitings(event.target.checked);
  }, []);

  const filterNoNames = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterNoNames(event.target.checked);
  }, []);

  const filterOverSubscribeds = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterOverSubscribeds(event.target.checked);
  }, []);

  const handleCancel = useCallback((): void => {
    /** reset all states */
    setSelectValidatorsModalOpen(false);
    setFilterOverSubscribeds(true);
    setFilterHighCommissions(true);
    setFilterWaitings(true);
    setFilterNoNames(false);
    setState('');
    setSearching(false);
    setSearchedValidators([]);
  }, [setSelectValidatorsModalOpen, setState]);

  const handleSelectValidators = useCallback(() => {
    if (selected.length >= 1) { setConfirmStakingModalOpen(true); }
  }, [selected.length]);

  return (
    <Popup handleClose={handleCancel} showModal={showSelectValidatorsModal}>
      <PlusHeader action={handleCancel} chain={chain} closeText={'Cancel'} icon={<RecommendOutlinedIcon fontSize='small' />} title={'Select Validators'} />

      <Grid alignItems='center' container>

        <Grid item sx={{ textAlign: 'left' }} xs={12}>
          {validatorsInfo &&
            <ValidatorSelectionTable
              chain={chain}
              chainInfo={chainInfo}
              nominatedValidators={nominatedValidators}
              searchedValidators={searchedValidators}
              searching={searching}
              selected={selected}
              setSearchedValidators={setSearchedValidators}
              setSearching={setSearching}
              setSelected={setSelected}
              stakingConsts={stakingConsts}
              validators={validators}
              validatorsIdentities={validatorsIdentities}
            />
          }
        </Grid>
        <Grid container id='filteringItems' item justifyContent='center' sx={{ p: '10px 20px 0px' }} xs={12}>
          <Grid item sx={{ fontSize: 13, textAlign: 'right' }} xs={3}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                onChange={filterNoNames}
                size='small'
              />
              }
              label={<Box fontSize={11} sx={{ color: 'green' }}>{t('only have an ID')}</Box>}
            />
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'center' }} xs={3}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterHighCommisions}
                size='small'
              />
              }
              label={<Box fontSize={11} sx={{ color: 'red' }}>{t('no ')}{DEFAULT_VALIDATOR_COMMISION_FILTER}+ {t(' comm.')}</Box>}
            />
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'left' }} xs={3}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterOverSubscribeds}
                size='small'
              />
              }
              label={<Box fontSize={11} sx={{ color: 'red' }}>{t('no oversubscribd')}</Box>}
            />
          </Grid>
          <Grid item sx={{ fontSize: 13, textAlign: 'left' }} xs={3}>
            <FormControlLabel
              control={<Checkbox
                color='default'
                defaultChecked
                onChange={filterWaitings}
                size='small'
              />
              }
              label={<Box fontSize={11} sx={{ color: 'red' }}>{t('no waiting')}</Box>}
            />
          </Grid>
        </Grid>

        <Grid item sx={{ p: '7px 28px' }} xs={12}>
          <NextStepButton
            data-button-action='select validators manually'
            isDisabled={!selected.length}
            onClick={handleSelectValidators}
          >
            {!selected.length ? t('Select validators') : t('Next')}
          </NextStepButton>
        </Grid>

      </Grid>

      {!!selected.length && showConfirmStakingModal &&
        <ConfirmStaking
          amount={['changeValidators', 'setNominees'].includes(state) ? 0n : stakeAmount}
          chain={chain}
          chainInfo={chainInfo}
          ledger={ledger}
          nominatedValidators={nominatedValidators}
          selectedValidators={selected}
          setConfirmStakingModalOpen={setConfirmStakingModalOpen}
          setSelectValidatorsModalOpen={setSelectValidatorsModalOpen}
          setState={setState}
          showConfirmStakingModal={showConfirmStakingModal}
          staker={staker}
          stakingConsts={stakingConsts}
          state={state}
          validatorsIdentities={validatorsIdentities}
        />
      }
    </Popup>
  );
}
