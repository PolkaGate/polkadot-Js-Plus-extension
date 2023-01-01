// Copyright 2019-2023 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { AccountId } from '@polkadot/types/interfaces/runtime';

import { SHORT_ADDRESS_CHARACTERS } from '../util/constants';

interface Props {
  address: string | AccountId;
  charsCount?: number;
  fontSize?: number;
}

export default function ShortAddress({ address, charsCount = SHORT_ADDRESS_CHARACTERS, fontSize = 14 }: Props): React.ReactElement {
  return (
    <span style={{ fontFamily: 'Source Sans Pro, Arial, sans-serif', fontSize }}>
      {address.slice(0, charsCount)}...{address.slice(-charsCount)}
    </span>
  );
}
