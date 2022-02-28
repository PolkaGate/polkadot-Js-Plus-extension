// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/** NOTE this component provides icons related to each action, which is depicted in transaction history */
import { AcUnit as AcUnitIcon, Add as AddIcon, AddCircleOutline as AddCircleOutlineIcon, AllOut as AllOutIcon, CallMade as CallMadeIcon, CallReceived as CallReceivedIcon, Check as CheckIcon, Link as LinkIcon, NotificationsNone as NotificationsNoneIcon, Redeem as RedeemIcon, Remove as RemoveIcon, StopCircle as StopCircleIcon } from '@mui/icons-material';
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
        fontSize='small'
        color='info'
      />;
    case ('link'):
      return <LinkIcon
        fontSize='small'
        sx={{ color: 'blue' }}
      />;
    default:
      return <NotificationsNoneIcon
        fontSize='small'
        sx={{ color: 'red' }}
      />;
  }
}
