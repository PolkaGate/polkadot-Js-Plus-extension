// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import request from 'umi-request';

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { Close, Initiation, Voucher } from '../plusTypes';

const getUrl = (chainName: string): string => {
  if (chainName?.toLowerCase() === 'westend') {
    return 'https://api.subquery.network/sq/Nick-1979/westend';
  }

  return `https://api.subquery.network/sq/PolkaGate/${chainName.toLowerCase()}`;
};

export async function getVouchers(chainName: string, lost: string | AccountId, rescuer: string | AccountId): Promise<Voucher[]> {
  const url = getUrl(chainName);

  const query = `query {
    recoveryVoucheds (filter:
     {lost:{equalTo:"${lost}"},
      rescuer:{equalTo:"${rescuer}"}
    }){ 
      nodes 
      {id,
       blockNumber,
       lost,
       rescuer,
       friend
      }}}`;
  const res = await postReq(url, { query });

  console.log('res:', res.data.recoveryVoucheds.nodes);

  return res.data.recoveryVoucheds.nodes as Voucher[];
}

export async function getInitiations(chainName: string, account: string | AccountId, accountType: { 'rescuer', 'lost' }, last = false): Promise<Initiation | Initiation[] | null> {
  if (!chainName || !account) {
    console.error('no chain name or account is defined in getInitiations');

    return null;
  }

  const url = getUrl(chainName);

  const query = `query {
    recoveryInitiateds (${last ? 'last:1,' : ''} filter:{
  ${accountType}: { equalTo: "${account}" }}) {
  nodes
  {
    id,
    blockNumber,
    lost,
    rescuer,
      }
    }}`;

  const res = await postReq(url, { query });

  const mayBeInitiations = res.data.recoveryInitiateds.nodes as Initiation[];

  return mayBeInitiations?.length ? last ? mayBeInitiations[0] : mayBeInitiations : null;
}

export async function getCloses(chainName: string, lost: string | AccountId): Promise<Close[] | null> {
  if (!chainName || !lost) {
    console.error('no chain name or lost account is defined in getCloses');

    return null;
  }

  const query = `query {
    recoveryCloseds (filter:{
  lost: { equalTo: "${lost}" }}) {
  nodes
  {
    id,
    blockNumber,
    lost,
    rescuer,
      }
    }}`;

  const res = await postReq(`https://api.subquery.network/sq/PolkaGate/${chainName.toLowerCase()}`, { query });

  const mayBeCloses = res.data.recoveryCloseds.nodes as Close[];

  return mayBeCloses?.length ? mayBeCloses : null;
}

function postReq(api: string, data: Record<string, unknown> = {}, option?: Record<string, unknown>): Promise<Record<string, any>> {
  return request.post(api, {
    data,
    ...option
  });
}

// eslint-disable-next-line no-void
// void getVouchers('5DoWzQ8PvjvcCSxiXc928T82EwfPzJAYA1eGRCno28RadQgP', '5CG114jwh4CHMFsA9At6joNoLBz3hn3d479Y4KdrkBZXCS7w');