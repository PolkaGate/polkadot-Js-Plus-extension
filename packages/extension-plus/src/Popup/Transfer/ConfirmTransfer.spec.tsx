// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* The following address needs to have some Westies to pass the last test */
/* 5FbSap4BsWfjyRhCchoVdZHkDnmDm3NEgLZ25mesq4aw2WvX */
/* may need to comment/uncomment line 62  */

import '@polkadot/extension-mocks/chrome';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ReactDOM from 'react-dom';

import { Balance } from '@polkadot/types/interfaces';

import Extension from '../../../../extension-base/src/background/handlers/Extension';
import getChainInfo from '../../util/getChainInfo';
import { AccountsBalanceType, BalanceType, ChainInfo } from '../../util/plusTypes';
import { amountToHuman, amountToMachine, balanceToHuman, fixFloatingPoint, toShortAddress } from '../../util/plusUtils';
import { createAccount, createExtension } from '../../util/test/testHelper';
import ConfirmTransfer from './ConfirmTransfer';

jest.setTimeout(90000);

ReactDOM.createPortal = jest.fn((modal) => modal);

const props = {
  address: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA',
  chain: {
    name: 'westend',
    icon: 'westend'
  },
  formattedAddress: '5HEbNn6F37c9oW8E9PnnVnZBkCvz8ucjTbAQLi5H1goDqEbA',
  givenType: 'ethereum',
  name: 'Amir khan'
};

const decimals = 12;
const availableBalanceInHuman = 0.15; // WND

const balanceInfo: BalanceType = {
  available: amountToMachine(availableBalanceInHuman.toString(), decimals),
  coin: 'WND',
  decimals: decimals,
  total: amountToMachine(availableBalanceInHuman.toString(), decimals)
};

let extension: Extension;
let sender: AccountsBalanceType;
let recepient: AccountsBalanceType;
let firstAddress: string;
let secondAddress: string;
let fee: Balance;
let availableBalance: string;
const transferAmountInHuman = '0.1';
const transferAmount = amountToMachine(transferAmountInHuman, decimals);
let firstSuri = 'seed sock milk update focus rotate barely fade car face mechanic mercy';
let secondSuri = 'inspire erosion chalk grant decade photo ribbon custom quality sure exhaust detail';
const password = 'passw0rd';
let chainInfo: ChainInfo;

// [firstSuri, secondSuri] = [secondSuri, firstSuri]; /** comment or uncomment this when test fails due to insufficient balance */

describe('ConfirmTransfer for Successful Scenario (Note: account must have some fund to transfer)', () => {
  beforeAll(async () => {
    extension = await createExtension();
    chainInfo = await getChainInfo(props.chain.name);
    firstAddress = await createAccount(firstSuri, extension);
    secondAddress = await createAccount(secondSuri, extension);

    sender = {
      address: firstAddress,
      balanceInfo: balanceInfo,
      chain: 'westend',
      name: 'Amir khan'
    };

    recepient = {
      address: secondAddress,
      chain: 'westend',
      name: ''
    };

    availableBalance = balanceToHuman(sender, 'available');
    const { api } = await getChainInfo(sender.chain);
    const transfer = api.tx.balances.transfer;

    const { partialFee } = await transfer(sender.address, transferAmount).paymentInfo(sender.address);

    fee = partialFee;
  });

  beforeEach(() => {
    render(
      <ConfirmTransfer
        availableBalance={availableBalance}
        chain={props.chain}
        api={chainInfo.api}
        confirmModalOpen={true}
        lastFee={fee}
        recepient={recepient}
        sender={sender}
        transferAmount={transferAmount}
      />
    );
  });

  test('Successfull Scenario', async () => {
    expect(screen.queryAllByText('Confirm Transfer')).toHaveLength(1);
    expect(screen.queryAllByText(sender.name)).toHaveLength(1);
    expect(screen.queryAllByText(toShortAddress(recepient.address))).toHaveLength(1);

    const amountToTransfer = screen.queryByTestId('infoInMiddle')?.children.item(0)?.children.item(1)?.textContent;

    expect(amountToTransfer).toEqual(`${transferAmountInHuman}${balanceInfo.coin}`);
    expect(screen.queryByTestId('infoInMiddle')?.children.item(1)?.children.item(1)?.textContent).toEqual(`${fee.toHuman()}estimated`);
    expect(screen.queryByTestId('infoInMiddle')?.children.item(3)?.children.item(0)?.textContent).toEqual('Total');

    const total = transferAmount + fee.toBigInt();
    const totalInHuman = amountToHuman(total.toString(), decimals);
    const parsedTotal = fixFloatingPoint(totalInHuman);

    expect(screen.queryByTestId('infoInMiddle')?.children.item(3)?.children.item(2)?.textContent).toEqual(parsedTotal + 'WND');

    expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
    fireEvent.change(screen.queryByLabelText('Password') as Element, { target: { value: password } });

    expect(screen.queryAllByText('Confirm')).toHaveLength(1);
    fireEvent.click(screen.queryByText('Confirm') as Element);

    expect(screen.queryAllByText('Password is not correct')).toHaveLength(0);
    await waitFor(() => expect(screen.queryByTestId('confirmButton')?.textContent).toEqual('Done'), { timeout: 70000 }); // wait enough to recive the transaction confirm from blockchain
  });

  test('ConfirmTransfer when password is wrong', () => {
    const invalidPassword = '123456';

    expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
    fireEvent.change(screen.queryByLabelText('Password') as Element, { target: { value: invalidPassword } });

    expect(screen.queryAllByText('Confirm')).toHaveLength(1);
    fireEvent.click(screen.queryByText('Confirm') as Element);

    expect(screen.queryAllByText('Password is not correct')).toHaveLength(1);
  });
});

describe('ConfirmTransfer for Failed Scenario', () => {
  const invaliTransferAmount = amountToMachine('100000', decimals); // supposed that the address does not have 1000WSN to transfer, hence fails

  beforeAll(async () => {
    sender = {
      address: firstAddress,
      balanceInfo: balanceInfo,
      chain: 'westend',
      name: 'Amir khan'
    };

    recepient = {
      address: secondAddress,
      chain: 'westend',
      name: 'recipientName'
    };

    availableBalance = balanceToHuman(sender, 'available');
    chainInfo = await getChainInfo(sender.chain);
    const transfer = chainInfo?.api.tx.balances.transfer;

    const { partialFee } = await transfer(sender.address, transferAmount).paymentInfo(sender.address);

    fee = partialFee;
  });

  test('Failed Scenario', async () => {
    render(
      <ConfirmTransfer
        api={chainInfo.api}
        availableBalance={availableBalance}
        chain={props.chain}
        confirmModalOpen={true}
        lastFee={fee}
        recepient={recepient}
        sender={sender}
        transferAmount={invaliTransferAmount}
      />
    );

    expect(screen.queryAllByLabelText('Password')).toHaveLength(1);
    fireEvent.change(screen.queryByLabelText('Password'), { target: { value: password } });

    expect(screen.queryAllByText('Confirm')).toHaveLength(1);
    fireEvent.click(screen.queryByText('Confirm'));

    await waitFor(() => expect(screen.queryByTestId('confirmButton').textContent).toEqual('Failed'), { timeout: 60000 }); // wait enough to recive the transaction confirm from blockchain
  });
});
