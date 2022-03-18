// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */

import React from 'react';

interface Props {
  address: string;
  charsCount?: number;
  fontSize?: number;
}

export default function ShortAddress({ address, charsCount = 4, fontSize = 14 }: Props): React.ReactElement {
  return (
    <span style={{ fontFamily: 'Monospace', fontSize: fontSize }}>
      {address.slice(0, charsCount) + '...' + address.slice(-1 * charsCount)}
    </span>
  );
}
