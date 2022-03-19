// Copyright 2019-2022 @polkadot/extension-plus authors & contributors
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable header/header */
/* eslint-disable react/jsx-max-props-per-line */

/** 
 * @description This is the main component which conects plus to original extension, 
 * and make most of the new functionalities avilable
*/
import type { StakingLedger } from '@polkadot/types/interfaces';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../../extension-ui/src/types';

import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { faCoins, faQrcode, faSyncAlt, faTasks } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Container, Grid, Link } from '@mui/material';
import { deepOrange, grey } from '@mui/material/colors';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';

import { AccountContext } from '../../../extension-ui/src/components/contexts';
import useTranslation from '../../../extension-ui/src/hooks/useTranslation';
import { updateMeta } from '../../../extension-ui/src/messaging';
import AddressQRcode from '../Popup/AddressQRcode/AddressQRcode';
import TransactionHistory from '../Popup/History';
import EasyStaking from '../Popup/Staking';
import TransferFunds from '../Popup/Transfer';
import { getPriceInUsd } from '../util/api/getPrice';
import { SUPPORTED_CHAINS } from '../util/constants';
import getChainInfo from '../util/getChainInfo';
import { AccountsBalanceType, BalanceType, ChainInfo, savedMetaData } from '../util/plusTypes';
import { prepareMetaData } from '../util/plusUtils';
import { Balance } from './';

export interface Props {
  actions?: React.ReactNode;
  address?: string | null;
  formattedAddress?: string | null;
  chain?: Chain | null;
  className?: string;
  genesisHash?: string | null;
  isExternal?: boolean | null;
  isHardware?: boolean | null;
  isHidden?: boolean;
  name: string;
  parentName?: string | null;
  suri?: string;
  toggleActions?: number;
  type?: KeypairType;
  givenType?: KeypairType;
}

function Plus({ address, chain, formattedAddress, givenType, name }: Props): React.ReactElement<Props> {
  const [balance, setBalance] = useState<AccountsBalanceType | null>(null);
  const { accounts } = useContext(AccountContext);
  const { t } = useTranslation();
  const supported = (chain: Chain) => SUPPORTED_CHAINS.includes(chain?.name.replace(' Relay Chain', ''))
  const [balanceChangeSubscribed, setBalanceChangeSubscribed] = useState<string>('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [showQRcodeModalOpen, setQRcodeModalOpen] = useState(false);
  const [showTxHistoryModal, setTxHistoryModalOpen] = useState(false);
  const [showStakingModal, setStakingModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [account, setAccount] = useState<AccountJson | null>(null);
  const [sender, setSender] = useState<AccountsBalanceType>({ address: String(address), chain: null, name: String(name) });
  const [price, setPrice] = useState<number>(0);
  const [chainInfo, setChainInfo] = useState<ChainInfo>();
  const [ledger, setLedger] = useState<StakingLedger | null>(null);
  const [redeemable, setRedeemable] = useState<bigint | null>(null);

  const callGetLedgerWorker = useCallback((): void => {
    const getLedgerWorker: Worker = new Worker(new URL('../util/workers/getLedger.js', import.meta.url));

    getLedgerWorker.postMessage({ address, chain });

    getLedgerWorker.onerror = (err) => {
      console.log(err);
    };

    getLedgerWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const ledger: StakingLedger = e.data;

      console.log('Ledger:', ledger);
      setLedger(ledger);
      getLedgerWorker.terminate();
    };
  }, [address, chain]);

  const callRedeemable = useCallback((): void => {
    const getRedeemableWorker: Worker = new Worker(new URL('../util/workers/getRedeemable.js', import.meta.url));

    getRedeemableWorker.postMessage({ address, chain });

    getRedeemableWorker.onerror = (err) => {
      console.log(err);
    };

    getRedeemableWorker.onmessage = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const stakingAccount: string = e.data;
      const rcvdRedeemable = JSON.parse(stakingAccount)?.redeemable as string;

      if (rcvdRedeemable) { setRedeemable(BigInt(rcvdRedeemable)); } else { setRedeemable(0n); }

      getRedeemableWorker.terminate();
    };
  }, [address, chain]);

  useEffect((): void => {
    if (!chain) return;

    // eslint-disable-next-line no-void
    void getPriceInUsd(chain).then((p) => {
      console.log(`${chain.name.replace(' Relay Chain', '')} price:`, p);
      setPrice(p || 0);
    });

    // eslint-disable-next-line no-void
    void getChainInfo(chain).then((info) => setChainInfo(info));

    // * get ledger info, including users currently staked, locked, etc
    if (supported(chain)) {
      callGetLedgerWorker();

      // ** get redeemable amount
      callRedeemable();
    }
  }, [chain]);

  function getBalanceFromMetaData(_account: AccountJson, _chain: Chain): AccountsBalanceType | null {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const accLastBalance: savedMetaData = _account.lastBalance ? JSON.parse(_account.lastBalance) : null;

    if (!accLastBalance) { return null; }

    const chainName = _chain.name.replace(' Relay Chain', '');

    if (chainName !== accLastBalance.chainName) { return null; }

    return {
      address: _account.address,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      balanceInfo: accLastBalance ? JSON.parse(accLastBalance.metaData) : null,
      chain: accLastBalance ? accLastBalance.chainName : null,
      name: _account.name ? _account.name : ''
    };
  }

  function subscribeToBalanceChanges() {
    if (!chain) {
      return;
    }

    setBalanceChangeSubscribed(chain ? chain.name : '');
    const subscribeToBalance: Worker = new Worker(new URL('../util/workers/subscribeToBalance.js', import.meta.url));

    subscribeToBalance.postMessage({ address, chain, formattedAddress });

    subscribeToBalance.onerror = (err) => {
      console.log(err);
    };

    subscribeToBalance.onmessage = (e: MessageEvent<any>) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { address: string, subscribedChain: Chain, balanceInfo: BalanceType } = e.data;

      setBalance({
        address: result.address,
        balanceInfo: result.balanceInfo,
        chain: result.subscribedChain.name,
        name: name || ''
      });

      setRefreshing(false);
    };
  }

  useEffect((): void => {
    if (balance && chain) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      const stringifiedBalanceInfo = JSON.stringify(balance.balanceInfo, (_key, value) => typeof value === 'bigint' ? value.toString() : value);

      // eslint-disable-next-line no-void
      void updateMeta(balance.address, prepareMetaData(chain, 'lastBalance', stringifiedBalanceInfo));
    }
  }, [balance]);

  useEffect((): void => {
    setSender({
      address: String(formattedAddress),
      balanceInfo: balance ? balance.balanceInfo : undefined,
      chain: chain?.name || null,
      name: String(name)
    });
  }, [balance, chain, formattedAddress, name]);

  useEffect((): void => {
    if (!accounts) {
      console.log(' does not need to subscribe to balanceChange');

      return;
    }

    if (!chain) {
      // does not need to subscribe to balanceChange for no chain

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (!balanceChangeSubscribed) {
      console.log('subscribing to chain', chain?.name);

      subscribeToBalanceChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, chain]);

  useEffect((): void => {
    if (!chain) { return; }

    const acc = accounts.find((acc) => acc.address === address);

    if (!acc) {
      console.log('account does not exist in Accounts!');

      return;
    }

    setAccount(acc);

    const lastSavedBalance = getBalanceFromMetaData(acc, chain);

    if (lastSavedBalance) {
      setBalance(lastSavedBalance);
    } else {
      setBalance(null);
      subscribeToBalanceChanges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain]);

  const handleTransferFunds = useCallback((): void => {
    if (chain) { setTransferModalOpen(true); }
  }, [chain]);

  const handleShowQRcode = useCallback((): void => {
    if (chain) { setQRcodeModalOpen(true); }
  }, [chain]);

  const handleTxHistory = useCallback((): void => {
    if (chain) { setTxHistoryModalOpen(true); }
  }, [chain]);

  const handleStaking = useCallback((): void => {
    if (chain && supported(chain)) { setStakingModalOpen(true); }
  }, [chain]);

  const handlerefreshBalance = useCallback((): void => {
    if (!chain || refreshing) { return; }

    setRefreshing(true);
    setBalance(null);
    subscribeToBalanceChanges();
  }, [chain, refreshing]);

  function getCoin(_myBalance: AccountsBalanceType): string {
    return !_myBalance || !_myBalance.balanceInfo ? '' : _myBalance.balanceInfo.coin;
  }

  return (
    <Container disableGutters sx={{ position: 'relative', top: '-10px' }}>
      <Grid container justifyContent='flex-end' sx={{ lineHeight: '12px' }}>
        <Grid container id='QRcodePage' item justifyContent='flex-end' xs={2}>
          <Grid item sx={{ paddingLeft: '2px' }} xs={2}>
            <Link color='inherit' href='#' underline='none'>
              <FontAwesomeIcon
                color={!chain ? grey[300] : grey[600]}
                icon={faQrcode}
                id='receive'
                onClick={handleShowQRcode}
                size='sm'
                title={t('receive')}
              />
            </Link>
          </Grid>
          <Grid item xs={6}></Grid>
        </Grid>
      </Grid>
      <Grid alignItems='center' container>
        <Grid container item justifyContent='center' xs={10}>
          {!chain
            ? <Grid id='noChainAlert' item sx={{ color: grey[700], fontFamily: '"Source Sans Pro", Arial, sans-serif', fontWeight: 600, fontSize: 12, textAlign: 'center', paddingLeft: '20px' }} xs={12} >
              {t('Please select a chain to view your balance.')}
            </Grid>
            : <Grid container item sx={{ paddingLeft: '75px', textAlign: 'left' }} xs={12}>
              <Grid item xs={4}>
                <Balance balance={balance} chain={chain} price={price} type='total' />
              </Grid>
              <Grid item xs={4}>
                <Balance balance={balance} chain={chain} price={price} type='available' />
              </Grid>
              <Grid item xs={4}>
                <Balance balance={balance} chain={chain} price={price} type='reserved' />
              </Grid>
            </Grid>

          }
        </Grid>
        <Grid container item xs={2}>
          <Grid container id='plusToolbar' item xs={12}>
            <Grid item xs={3}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  color={!chain ? grey[300] : grey[600]}
                  icon={faPaperPlane}
                  id='send'
                  onClick={handleTransferFunds}
                  size='sm'
                  swapOpacity={true}
                  title={t('send')}
                />
              </Link>
            </Grid>
            <Grid container item xs={3}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  color={!chain ? grey[300] : grey[600]}
                  icon={faSyncAlt}
                  id='refreshIcon'
                  onClick={handlerefreshBalance}
                  size='sm'
                  spin={refreshing}
                  title={t('refresh')}
                />
              </Link>
            </Grid>
            <Grid item xs={3}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  color={!chain ? grey[300] : grey[600]}
                  icon={faTasks}
                  id='history'
                  onClick={handleTxHistory}
                  size='sm'
                  title={t('history')}
                />
              </Link>
            </Grid>
            <Grid item xs={3}>
              <Link color='inherit' href='#' underline='none'>
                <FontAwesomeIcon
                  color={!chain || !supported(chain) ? grey[300] : (ledger?.active ? deepOrange[400] : grey[600])}
                  icon={faCoins}
                  id='staking'
                  onClick={handleStaking}
                  size='sm'
                  title={t('staking')}
                />
              </Link>
            </Grid>
          </Grid>
          {chain && <>
            {balance
              ? <Grid id='coinPrice' item sx={{ color: grey[600], fontSize: 10, textAlign: 'center' }} xs={12}>
                {chain && <> {'1 '}{getCoin(balance)}{' = $'}{price}</>}
              </Grid>
              : <Grid id='emptyCoinPrice' item sx={{ color: grey[400], fontSize: 10, textAlign: 'center' }} xs={12}>
                {'1 ---  =  $ --- '}
              </Grid>
            }
          </>}
        </Grid>
      </Grid>
      {transferModalOpen && sender &&
        <TransferFunds
          chain={chain}
          chainInfo={chainInfo}
          givenType={givenType}
          sender={sender}
          setTransferModalOpen={setTransferModalOpen}
          transferModalOpen={transferModalOpen}
        />
      }
      {showQRcodeModalOpen &&
        <AddressQRcode
          address={String(formattedAddress || address)}
          chain={chain}
          name={name}
          setQRcodeModalOpen={setQRcodeModalOpen}
          showQRcodeModalOpen={showQRcodeModalOpen}
        />
      }
      {showTxHistoryModal &&
        <TransactionHistory
          address={sender}
          chain={chain}
          name={name}
          setTxHistoryModalOpen={setTxHistoryModalOpen}
          showTxHistoryModal={showTxHistoryModal}
        />
      }
      {showStakingModal && sender && account &&
        <EasyStaking
          account={account}
          chain={chain}
          chainInfo={chainInfo}
          ledger={ledger}
          name={name}
          redeemable={redeemable}
          setStakingModalOpen={setStakingModalOpen}
          showStakingModal={showStakingModal}
          staker={sender}
        />
      }
    </Container >
  );
}

export default styled(Plus)(({ theme }: ThemeProps) => `
  background: ${theme.accountBackground};
  border: 1px solid ${theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;

  .banner {
    font-size: 12px;
    line-height: 16px;
    position: absolute;
    top: 0;

    &.chain {
      background: ${theme.primaryColor};
      border-radius: 0 0 0 10px;
      color: white;
      padding: 0.1rem 0.5rem 0.1rem 0.75rem;
      right: 0;
      z-index: 1;
    }
  }

  .balanceDisplay {
    display: flex;
    justify-content: space-between;
    position: relative;

    .balance {
      position: absolute;
      left: 2px;
      top: 18px;    
      color: ${theme.labelColor};
      font-size: 14px;
      font-weight: bold;
    }
    . availableBalance {
      position: absolute;
      right: 2px;
      top: -18px;
    }

    .transferIcon {
      display: flex;
    justify-content: space-between;
    position: relative;

    .svg-inline--fa {
      width: 14px;
    height: 14px;
    margin-right: 10px;
    color: ${theme.accountDotsIconColor};
    &:hover {
      color: ${theme.labelColor};
    cursor: pointer;
  }
}

    .refreshIcon {
          position: absolute;
        right: 2px;
        top: +36px;
    }

    .hiddenIcon, .visibleIcon {
      position: absolute;
      right: 2px;
      top: -18px;
    }

    .hiddenIcon {
      color: ${theme.errorColor};
      &:hover {
        color: ${theme.accountDotsIconColor};
      }
    }
  }

  .externalIcon, .hardwareIcon {
    margin-right: 0.3rem;
    color: ${theme.labelColor};
    width: 0.875em;
  }

  .identityIcon {
    margin-left: 15px;
    margin-right: 10px;

    & svg {
      width: 50px;
      height: 50px;
    }
  }

  .info {
    width: 100%;
  }

  .infoRow {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 30px;
    // border-radius: 4px;
  }

  img {
    max-width: 50px;
    max-height: 50px;
    border-radius: 50%;
  }

  .name {
    font-size: 16px;
    line-height: 22px;
    margin: 2px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 300px;
    white-space: nowrap;

    &.displaced {
      padding-top: 10px;
    }
  }

  .parentName {
    color: ${theme.labelColor};
    font-size: ${theme.inputLabelFontSize};
    line-height: 14px;
    overflow: hidden;
    padding: 0.25rem 0 0 0.8rem;
    text-overflow: ellipsis;
    width: 270px;
    white-space: nowrap;
  }

  .detailsIcon {
    background: ${theme.accountDotsIconColor};
    width: 3px;
    height: 19px;

    &.active {
      background: ${theme.primaryColor};
    }
  }

  .deriveIcon {
    color: ${theme.labelColor};
    position: absolute;
    top: 5px;
    width: 9px;
    height: 9px;
  }

  .movableMenu {
    margin-top: -20px;
    right: 28px;
    top: 0;

    &.isMoved {
      top: auto;
      bottom: 0;
    }
  }

  .settings {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 40px;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 25%;
      bottom: 25%;
      width: 1px;
      background: ${theme.boxBorderColor};
    }

    &:hover {
      cursor: pointer;
      background: ${theme.readonlyInputBackground};
    }
  }
`);
