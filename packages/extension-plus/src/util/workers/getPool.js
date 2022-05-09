// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

/**
 * @description
 * get all information regarding a pool
 * 
 * rewardPool.balance: The pool balance at the time of the last payout
 * rewardPpool.totalEarnings: The total earnings ever at the time of the last payout
 */
import { BN_ZERO, bnMax } from '@polkadot/util';

import getApi from '../getApi.ts';
import getPoolAccounts from '../getPoolAccounts';

const DEFAULT_MEMBER_INFO = {
  points: BN_ZERO,
  poolId: BN_ZERO,
  rewardPoolTotalEarnings: BN_ZERO,
  unbondingEras: []
};

async function getPool(endpoint, stakerAddress) {
  const api = await getApi(endpoint);

  const membersUnwrapped = await api.query.nominationPools.poolMembers(stakerAddress);
  const member = membersUnwrapped.isSome ? membersUnwrapped.unwrap() : DEFAULT_MEMBER_INFO;

  if (member.poolId.isZero()) {
    return null; // user does not joined a pool yet
  }

  const poolId = member.poolId;

  const accounts = getPoolAccounts(api, poolId);

  const [metadata, bondedPools, rewardPools, nominators, rewardIdBalance, stashIdBalance, ledger] = await Promise.all([
    api.query.nominationPools.metadata(poolId),
    api.query.nominationPools.bondedPools(poolId),
    api.query.nominationPools.rewardPools(poolId),
    api.query.staking.nominators(accounts.stashId),
    api.query.system.account(accounts.rewardId),
    api.query.system.account(accounts.stashId),
    api.query.staking.ledger(accounts.stashId)
  ]);

  const unwrappedRewardPools = rewardPools.isSome ? rewardPools.unwrap() : null;
  const unwrappedBondedPool = bondedPools.isSome ? bondedPools.unwrap() : null;

  const poolRewardClaimable = bnMax(BN_ZERO, rewardIdBalance.data.free.sub(api.consts.balances.existentialDeposit));

  console.log(` poolRewardClaimable.sub(unwrappedRewardPools.balance):${poolRewardClaimable.sub(unwrappedRewardPools.balance)}  `);

  const lastTotalEarnings = unwrappedRewardPools.totalEarnings;
  const currTotalEarnings = bnMax(BN_ZERO, poolRewardClaimable.sub(unwrappedRewardPools.balance)).add(unwrappedRewardPools.totalEarnings);
  const newEarnings = bnMax(BN_ZERO, currTotalEarnings.sub(lastTotalEarnings));
  const newPoints = unwrappedBondedPool.points.mul(newEarnings);
  const currentPoints = unwrappedRewardPools.points.add(newPoints);
  const newEarningsSinceLastClaim = bnMax(BN_ZERO, currTotalEarnings.sub(member.rewardPoolTotalEarnings));
  const delegatorVirtualPoints = member.points.mul(newEarningsSinceLastClaim);

  const myClaimable = delegatorVirtualPoints.isZero() || currentPoints.isZero() || poolRewardClaimable.isZero()
    ? BN_ZERO
    : delegatorVirtualPoints.mul(poolRewardClaimable).div(currentPoints);

  const rewardPool = {};

  if (unwrappedRewardPools) {
    rewardPool.balance = String(unwrappedRewardPools.balance);
    rewardPool.points = String(unwrappedRewardPools.points);
    rewardPool.totalEarnings = String(unwrappedRewardPools.totalEarnings);
  }

  const poolInfo = {
    bondedPool: unwrappedBondedPool,
    member: member,
    metadata: metadata.length
      ? metadata.isUtf8
        ? metadata.toUtf8()
        : metadata.toString()
      : null,
    myClaimable: String(myClaimable),
    nominators: nominators.unwrapOr({ targets: [] }).targets.map((n) => n.toString()),
    accounts: accounts,
    rewardClaimable: String(poolRewardClaimable),
    rewardPool: rewardPool,
    rewardIdBalance:rewardIdBalance.data,
    stashIdBalance:stashIdBalance.data,
    ledger:ledger
  };


  return JSON.stringify(poolInfo);
}

onmessage = (e) => {
  const { endpoint, stakerAddress } = e.data;

  // eslint-disable-next-line no-void
  void getPool(endpoint, stakerAddress).then((poolInfo) => {
    postMessage(poolInfo);
  });
};
