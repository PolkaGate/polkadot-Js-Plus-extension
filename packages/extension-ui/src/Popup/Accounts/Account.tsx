// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson } from '@polkadot/extension-base/background/types';

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';

import { LinkOption } from '@polkadot/apps-config/endpoints/types';
import { canDerive } from '@polkadot/extension-base/utils';
import { ThemeProps } from '@polkadot/extension-ui/types';

// added for plus
import { CROWDLOANS_CHAINS, GOVERNANCE_CHAINS } from '../../../../extension-plus/src/util/constants';
import getChainInfo from '../../../../extension-plus/src/util/getChainInfo';
import { Option } from '../../../../extension-plus/src/util/plusTypes';
import { Address, Dropdown, Link, MenuDivider } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { editAccount, tieAccount } from '../../messaging';
import { Name } from '../../partials';
import useMetadata from '@polkadot/extension-ui/hooks/useMetadata';

interface Props extends AccountJson {
  className?: string;
  parentName?: string;
}

interface EditState {
  isEditing: boolean;
  toggleActions: number;
}

function Account({ address, className, genesisHash, isExternal, isHardware, isHidden, name, parentName, suri, type }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [{ isEditing, toggleActions }, setEditing] = useState<EditState>({ isEditing: false, toggleActions: 0 });
  const [editedName, setName] = useState<string | undefined | null>(name);
  const genesisOptions = useGenesisHashOptions();
  const [endpointOptions, setEndpointOptions] = useState<Option[] | undefined>();

  const _onChangeGenesis = useCallback(
    (genesisHash?: string | null): void => {
      tieAccount(address, genesisHash || null)
        .catch(console.error);
    },
    [address]
  );

  const _onChainChange = useCallback(
    (genesisHash?: string | null): void => {
      console.log('pass')
    },
    [address]
  );

  // const chain = useMetadata(genesisHash, true);

  React.useEffect(async () => {
    const option = genesisOptions?.find((o) => o.value === genesisHash)
    const chainName = option?.text?.replace(' Relay Chain', '');
    console.log('chainName', chainName)
    setEndpointOptions([]);

    if (!chainName) return;
    const chainInfo = await getChainInfo(chainName)
    const options: Option[] = [];
    console.log('endPointsendPoints:', chainInfo?.endPoints)
    chainInfo?.endPoints?.forEach((e) => {
      options.push({ text: e.value, value: e.value });
    });

    setEndpointOptions(options);

  }, [genesisHash]);

  const _toggleEdit = useCallback(
    (): void => setEditing(({ toggleActions }) => ({ isEditing: !isEditing, toggleActions: ++toggleActions })),
    [isEditing]
  );

  const _saveChanges = useCallback(
    (): void => {
      editedName &&
        editAccount(address, editedName)
          .catch(console.error);

      _toggleEdit();
    },
    [editedName, address, _toggleEdit]
  );

  const _actions = useMemo(() => (
    <>
      {/* // added for plus */}
      {CROWDLOANS_CHAINS.includes(genesisHash) &&
        <Link
          className='newMenuItem'
          to={`/crowdloans/${genesisHash}/${address}`}
        >
          {t<string>('Crowdloan')}
        </Link>
      }
      {GOVERNANCE_CHAINS.includes(genesisHash) &&
        <Link
          className='newMenuItem'
          to={`/governance/${genesisHash}/${address}`}
        >
          {t<string>('Governance')}
        </Link>
      }
      {/* <Link
        className='menuItem'
        to={`/endecrypt/${address}`}
      >
        {t<string>('En/Decrypt')}
      </Link> */}
      {(GOVERNANCE_CHAINS.includes(genesisHash) || CROWDLOANS_CHAINS.includes(genesisHash)) &&
        <MenuDivider />
      }
      <Link
        className='menuItem'
        onClick={_toggleEdit}
      >
        {t<string>('Rename')}
      </Link>
      {!isExternal && canDerive(type) && (
        <Link
          className='menuItem'
          to={`/account/derive/${address}/locked`}
        >
          {t<string>('Derive New Account')}
        </Link>
      )}

      <MenuDivider />
      {!isExternal && (
        <Link
          className='menuItem'
          isDanger
          to={`/account/export/${address}`}
        >
          {t<string>('Export Account')}
        </Link>
      )}
      <Link
        className='menuItem'
        isDanger
        to={`/account/forget/${address}`}
      >
        {t<string>('Forget Account')}
      </Link>
      {!isHardware && (
        <>
          <MenuDivider />
          <div className='menuItem'>
            <Dropdown
              className='genesisSelection'
              label='chain'
              onChange={_onChangeGenesis}
              options={genesisOptions}
              value={genesisHash || ''}
            />
          </div>
          <div className='menuItem'>
            <Dropdown
              className='genesisSelection'
              label='endpoint'
              onChange={_onChainChange}
              options={endpointOptions ?? []}
              value={genesisHash || ''}
            />
          </div>
        </>
      )}
    </>
  ), [_onChainChange, _onChangeGenesis, _toggleEdit, address, endpointOptions, genesisHash, genesisOptions, isExternal, isHardware, t, type]);

  return (
    <div className={className}>
      <Address
        actions={_actions}
        address={address}
        className='address'
        genesisHash={genesisHash}
        isExternal={isExternal}
        isHidden={isHidden}
        name={editedName}
        parentName={parentName}
        showBalance={true}// added for plus
        suri={suri}
        toggleActions={toggleActions}
      >
        {isEditing && (
          <Name
            address={address}
            className={`editName ${parentName ? 'withParent' : ''}`}
            isFocused
            label={' '}
            onBlur={_saveChanges}
            onChange={setName}
          />
        )}
      </Address>
    </div>
  );
}

export default styled(Account)(({ theme }: ThemeProps) => `
  .address {
    margin-bottom: 8px;
  }

  .editName {
    position: absolute;
    flex: 1;
    left: 70px;
    top: 10px;
    width: 350px;

    .danger {
      background-color: ${theme.bodyColor};
      margin-top: -13px;
      width: 330px;
    }

    input {
      height : 30px;
      width: 350px;
    }

    &.withParent {
      top: 16px
    }
  }

  .menuItem {
    border-radius: 8px;
    display: block;
    font-size: 15px;
    line-height: 20px;
    margin: 0;
    min-width: 13rem;
    padding: 4px 16px;

    .genesisSelection {
      margin: 0;
    }
  }
  .newMenuItem {   // added for plus 
    border-radius: 8px;
    display: block;
    font-size: 15px;
    font-weight: 600;
    line-height: 20px;
    margin: 0;
    min-width: 13rem;
    padding: 4px 16px;
  }
`);
