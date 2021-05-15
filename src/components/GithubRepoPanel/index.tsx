import { Pair } from '@uniswap/v2-sdk'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { ButtonGray, ButtonLight } from '../Button'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import { Input as NumericalInput } from '../NumericalInput'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { useActiveWeb3React } from '../../hooks'
import { useTranslation } from 'react-i18next'
import useTheme from '../../hooks/useTheme'
import { Lock } from 'react-feather'
import { AutoColumn } from 'components/Column'
import { FiatValue } from './FiatValue'
import { GithubInfo } from 'state/swap/actions'
import {
  CallCommittableActivateCommittable1,
  CallCommittableMintCommittable,
  CreateCommittableContract,
} from './handlers'
import { Contract } from '@ethersproject/contracts'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  background-color: ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.bg2)};
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

const FixedContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.bg1};
  opacity: 0.95;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  border: 1px solid ${({ theme, hideInput }) => (hideInput ? ' transparent' : theme.bg2)};
  background-color: ${({ theme }) => theme.bg1};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  :focus,
  :hover {
    border: 1px solid ${({ theme, hideInput }) => (hideInput ? ' transparent' : theme.bg3)};
  }
`

const CurrencySelect = styled(ButtonGray)<{ selected: boolean; hideInput?: boolean }>`
  align-items: center;
  font-size: 24px;
  font-weight: 500;
  background-color: ${({ selected, theme }) => (selected ? theme.bg0 : theme.primary1)};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  border-radius: 16px;
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  height: ${({ hideInput }) => (hideInput ? '2.8rem' : '2.4rem')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  padding: 0 8px;
  justify-content: space-between;
  margin-right: ${({ hideInput }) => (hideInput ? '0' : '12px')};
  :focus,
  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.bg2 : darken(0.05, theme.primary1))};
  }
`

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? ' 1rem 1rem 0.75rem 1rem' : '1rem 1rem 0.75rem 1rem')};
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0 1rem 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '18px' : '18px')};
`

const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  color: ${({ theme }) => theme.primary1};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};
  margin-left: 0.25rem;

  :hover {
    /* border: 1px solid ${({ theme }) => theme.primary1}; */
  }
  :focus {
    /* border: 1px solid ${({ theme }) => theme.primary1}; */
    outline: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-right: 0.5rem;
  `};
`

export interface CommitsProps {
  user: string
  repo: string
}

interface GithubRepoPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: CurrencyAmount | null
  priceImpact?: Percent
  id: string
  showCommonBases?: boolean
  customBalanceText?: string
  locked?: boolean
  repoName: string
  listCommits: (user: string, repo: string, githubInfo: GithubInfo) => void
  setActivated: (repoName: string, contract: Contract, githubInfo: GithubInfo) => void
  activated: boolean
  githubInfo: GithubInfo
}

export default function GithubRepoPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  showCommonBases,
  customBalanceText,
  fiatValue,
  priceImpact,
  repoName,
  setActivated,
  activated,
  listCommits,
  githubInfo,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  ...rest
}: GithubRepoPanelProps) {
  const { t } = useTranslation()

  const [modalOpen, setModalOpen] = useState(false)

  const [activate, setOn] = useState('activate')
  const activateOn = () => setOn('activated')
  const activeStr = 'activate'
  const activedStr = 'activated'

  const { account, chainId, library } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useTheme()

  console.log(githubInfo.user)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const handleContractCreate = useCallback(
    (repoName: string, githubInfo: GithubInfo) => {
      const contractPromise = CreateCommittableContract(account, library, repoName)
      if (contractPromise) {
        contractPromise
          .then((contract) => {
            console.log('success contract:', contract.address)
            setActivated(repoName, contract, githubInfo)

            CallCommittableActivateCommittable1(account, library, contract.address, repoName, repoName, 'symbol')
            // CallCommittableMintCommittable(account, library, contract.address, repoName, 0x1234567, 'tokenURI')
          })
          .catch((error) => {
            console.log('deploy contract failed, ', error)
            return null
          })
      }
    },
    [CreateCommittableContract, account, library]
  )

  return (
    <InputPanel id={id} hideInput={hideInput} {...rest}>
      {locked && (
        <FixedContainer>
          <AutoColumn gap="sm" justify="center">
            <Lock />
            <TYPE.label fontSize="12px" textAlign="center">
              The market price is outside your specified price range. Single-asset deposit only.
            </TYPE.label>
          </AutoColumn>
        </FixedContainer>
      )}
      <Container
        hideInput={hideInput}
        onSelect={() => {
          hideInput = true
        }}
      >
        <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
          {repoName}
        </StyledTokenName>
        <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
          Owner or Committer
        </StyledTokenName>
        <ButtonLight
          onClick={() => {
            if (!activated) handleContractCreate(repoName, githubInfo)
          }}
        >
          {activated ? 'activated' : 'activate'}
        </ButtonLight>
        <ButtonLight
          onClick={() => {
            listCommits(githubInfo.user, repoName, githubInfo)
            setModalOpen(true)
          }}
        >
          Forge
        </ButtonLight>
        <ButtonLight>Divide</ButtonLight>
        {!hideInput && !hideBalance && (
          <FiatRow>
            <RowBetween>
              {account ? (
                <RowFixed style={{ height: '17px' }}>
                  <TYPE.body
                    onClick={onMax}
                    color={theme.text2}
                    fontWeight={400}
                    fontSize={14}
                    style={{ display: 'inline', cursor: 'pointer' }}
                  >
                    {hideBalance && !!currency && selectedCurrencyBalance
                      ? (customBalanceText ?? 'Balance: ') +
                        selectedCurrencyBalance?.toSignificant(4) +
                        ' ' +
                        currency.symbol
                      : '-'}
                  </TYPE.body>
                  {showMaxButton && selectedCurrencyBalance ? (
                    <StyledBalanceMax onClick={onMax}>(Max)</StyledBalanceMax>
                  ) : null}
                </RowFixed>
              ) : (
                ''
              )}

              <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} />
            </RowBetween>
          </FiatRow>
        )}
      </Container>
      {onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
    </InputPanel>
  )
}
