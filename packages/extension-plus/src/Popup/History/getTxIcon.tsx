// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/** 
 * @description
 * this component provides icons related to each action, which is depicted in transaction history
 * */
import { AcUnit as AcUnitIcon, Add as AddIcon, AddCircleOutline as AddCircleOutlineIcon, Adjust as AdjustIcon, AllOut as AllOutIcon, CallMade as CallMadeIcon, CallReceived as CallReceivedIcon, Check as CheckIcon, GroupRemove as GroupRemoveIcon, HowToReg as HowToRegIcon, Link as LinkIcon, NotificationsNone as NotificationsNoneIcon, RecommendOutlined as RecommendOutlinedIcon, Redeem as RedeemIcon, Remove as RemoveIcon, StopCircle as StopCircleIcon, ThumbsUpDownRounded as ThumbsUpDownRoundedIcon } from '@mui/icons-material';
import React from 'react';

export function getTxIcon(action: string): React.ReactNode {
  switch (action.toLowerCase()) {
    case ('send'):
      return <CallMadeIcon
        color='secondary'
        fontSize='small'
      />;
    case ('receive'):
      return <CallReceivedIcon
        color='primary'
        fontSize='small'
      />;
    case ('bond'):
      return <AddIcon
        color='success'
        fontSize='small'
      />;
    case ('unbond'):
      return <RemoveIcon
        color='error'
        fontSize='small'
      />;
    case ('bond_extra'):
      return <AddCircleOutlineIcon
        color='action'
        fontSize='small'
      />;
    case ('nominate'):
      return <CheckIcon
        fontSize='small'
        sx={{ color: 'green' }}
      />;
    case ('redeem'):
      return <RedeemIcon
        color='warning'
        fontSize='small'
      />;
    case ('stop_nominating'):
      return <StopCircleIcon
        fontSize='small'
        sx={{ color: 'black' }}
      />;
    case ('chill'):
      return <AcUnitIcon
        fontSize='small'
        sx={{ color: '#e2e7ba' }}
      />;
    case ('contribute'):
      return <AllOutIcon
        color='info'
        fontSize='small'
      />;
    case ('link'):
      return <LinkIcon
        fontSize='small'
        sx={{ color: 'blue' }}
      />;
    case ('tuneup'):
      return <AdjustIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
    case ('democracy_vote'):
      return <ThumbsUpDownRoundedIcon
        fontSize='small'
        sx={{ color: 'blue' }}
      />;
    case ('second'):
      return <RecommendOutlinedIcon
        fontSize='small'
        sx={{ color: 'purple' }}
      />;
    case ('council_vote'):
      return <HowToRegIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
    case ('cancel_vote'):
      return <GroupRemoveIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
    default:
      return <NotificationsNoneIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
  }
}
