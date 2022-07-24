// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import request from 'umi-request';

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { Initiation, Voucher } from '../plusTypes';

export async function getVouchers(lost: string | AccountId, rescuer: string | AccountId): Promise<Voucher[]> {
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
  const res = await postReq('https://api.subquery.network/sq/PolkaGate/westend', { query });

  console.log('res:', res.data.recoveryVoucheds.nodes);

  return res.data.recoveryVoucheds.nodes as Voucher[];
}

export async function getInitiation(rescuer: string | AccountId): Promise<Initiation | null> {
  const query = `query {
    recoveryInitiateds (last:1, filter:
     {rescuer:{equalTo:"${rescuer}"}
    }){ 
      nodes 
      {id,
       blockNumber,
       lost,
       rescuer,
      }}}`;
  const res = await postReq('https://api.subquery.network/sq/PolkaGate/westend', { query });

  const mayBeInitiations = res.data.recoveryInitiateds.nodes as Initiation[];

  return mayBeInitiations?.length ? mayBeInitiations[0] : null;
}

function postReq(api: string, data: Record<string, unknown> = {}, option?: Record<string, unknown>): Promise<Record<string, any>> {
  return request.post(api, {
    data,
    ...option
  });
}

// eslint-disable-next-line no-void
// void getVouchers('5DoWzQ8PvjvcCSxiXc928T82EwfPzJAYA1eGRCno28RadQgP', '5CG114jwh4CHMFsA9At6joNoLBz3hn3d479Y4KdrkBZXCS7w');