import {
  ArrowRightIcon,
  ChatIcon,
  ChevronDownIcon,
  DotsVerticalIcon,
  PencilIcon,
  PlusCircleIcon,
  ScaleIcon,
  SearchIcon,
} from '@heroicons/react/outline'
import { UserIcon } from '@heroicons/react/solid'
import clsx from 'clsx'
import {
  OTHER_TOOLTIP_TEXT,
  getMaximumAnswers,
  sortAnswers,
  type Answer,
  type MultiSort,
} from 'common/answer'
import { Bet, LimitBet } from 'common/bet'
import { getAnswerProbability } from 'common/calculate'
import {
  Contract,
  MultiContract,
  SORTS,
  contractPath,
  tradingAllowed,
} from 'common/contract'
import { isAdminId, isModId } from 'common/envs/constants'
import { User } from 'common/user'
import { floatingEqual } from 'common/util/math'
import { searchInAny } from 'common/util/parse'
import { groupBy, sumBy } from 'lodash'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CirclePicker } from 'react-color'
import toast from 'react-hot-toast'
import { Button, buttonClass } from 'web/components/buttons/button'
import {
  TradesModal,
  TradesNumber,
} from 'web/components/contract/trades-button'
import {
  MODAL_CLASS,
  Modal,
  SCROLLABLE_MODAL_CLASS,
} from 'web/components/layout/modal'
import { Row } from 'web/components/layout/row'
import { Avatar } from 'web/components/widgets/avatar'
import { Input } from 'web/components/widgets/input'
import { LoadingIndicator } from 'web/components/widgets/loading-indicator'
import { useUnfilledBets } from 'web/hooks/use-bets'
import { useEffectCheckEquality } from 'web/hooks/use-effect-check-equality'
import { useIsAdvancedTrader } from 'web/hooks/use-is-advanced-trader'
import { useIsClient } from 'web/hooks/use-is-client'
import { usePersistentInMemoryState } from 'web/hooks/use-persistent-in-memory-state'
import { usePersistentLocalState } from 'web/hooks/use-persistent-local-state'
import { usePrivateUser, useUser } from 'web/hooks/use-user'
import { useUserContractBets } from 'web/hooks/use-user-bets'
import { useDisplayUserByIdOrAnswer } from 'web/hooks/use-user-supabase'
import { api, editAnswerCpmm, updateMarket } from 'web/lib/api/api'
import {
  OrderBookPanel,
  YourOrders,
  getOrderBookButtonLabel,
} from '../bet/order-book'
import { getAnswerColor } from '../charts/contract/choice'
import DropdownMenu from '../comments/dropdown-menu'
import { Col } from '../layout/col'
import generateFilterDropdownItems from '../search/search-dropdown-helpers'
import { UserHovercard } from '../user/user-hovercard'
import { CustomizeableDropdown } from '../widgets/customizeable-dropdown'
import { InfoTooltip } from '../widgets/info-tooltip'
import { Pagination } from '../widgets/pagination'
import {
  AnswerBar,
  AnswerStatus,
  BetButtons,
  CreatorAndAnswerLabel,
  MultiSeller,
} from './answer-components'
import { SearchCreateAnswerPanel } from './create-answer-panel'

export const SHOW_LIMIT_ORDER_CHARTS_KEY = 'SHOW_LIMIT_ORDER_CHARTS_KEY'

const ANSWERS_PER_PAGE = 5

function getAnswersToShow(
  query: string,
  page: number,
  sortedAnswers: Answer[],
  searchedAnswers: Answer[]
) {
  return query
    ? searchedAnswers.slice(
        page * ANSWERS_PER_PAGE,
        (page + 1) * ANSWERS_PER_PAGE
      )
    : sortedAnswers.slice(
        page * ANSWERS_PER_PAGE,
        (page + 1) * ANSWERS_PER_PAGE
      )
}

// full resorting, hover, clickiness, search and add
export function AnswersPanel(props: {
  contract: MultiContract
  selectedAnswerIds: string[]
  sort: MultiSort
  setSort: (sort: MultiSort) => void
  query: string
  setQuery: (query: string) => void
  onAnswerCommentClick?: (answer: Answer) => void
  onAnswerHover: (answer: Answer | undefined) => void
  onAnswerClick: (answer: Answer) => void
  showSetDefaultSort?: boolean
  setDefaultAnswerIdsToGraph?: (ids: string[]) => void
  defaultAddAnswer?: boolean
}) {
  const {
    contract,
    onAnswerCommentClick,
    onAnswerHover,
    onAnswerClick,
    selectedAnswerIds,
    sort,
    setSort,
    query,
    setQuery,
    showSetDefaultSort,
    setDefaultAnswerIdsToGraph,
    defaultAddAnswer,
  } = props
  const { outcomeType, resolutions } = contract
  const addAnswersMode =
    'addAnswersMode' in contract ? contract.addAnswersMode : 'DISABLED'
  const shouldAnswersSumToOne =
    'shouldAnswersSumToOne' in contract ? contract.shouldAnswersSumToOne : true

  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [query, sort])

  const isMultipleChoice = outcomeType === 'MULTIPLE_CHOICE'

  const answers = contract.answers
    .filter((a) => isMultipleChoice || ('number' in a && a.number !== 0))
    .map((a) => ({
      ...a,
      prob: getAnswerProbability(contract, a.id),
    }))

  const sortedAnswers = useMemo(
    () => sortAnswers(contract, answers, sort),
    [answers, resolutions, shouldAnswersSumToOne, sort]
  )
  const searchedAnswers = useMemo(() => {
    if (!answers.length || !query) return []

    return sortedAnswers.filter(
      (answer) =>
        selectedAnswerIds.includes(answer.id) || searchInAny(query, answer.text)
    )
  }, [sortedAnswers, query])

  const answersToShow = getAnswersToShow(
    query,
    page,
    sortedAnswers,
    searchedAnswers
  )

  const selectedAnswers = answers.filter((a) =>
    selectedAnswerIds.includes(a.id)
  )

  const [highlightedAnswer, setHighlightedAnswer] = useState<
    string | undefined
  >(undefined)

  useEffectCheckEquality(() => {
    if (!selectedAnswerIds.length)
      setDefaultAnswerIdsToGraph?.(answersToShow.map((a) => a.id))
  }, [answersToShow])

  const user = useUser()

  const userBets = useUserContractBets(user?.id, contract.id)
  const userBetsByAnswer = groupBy(userBets, (bet) => bet.answerId)

  const isAdvancedTrader = useIsAdvancedTrader()
  const [shouldShowLimitOrderChart, setShouldShowLimitOrderChart] =
    usePersistentLocalState<boolean>(true, SHOW_LIMIT_ORDER_CHARTS_KEY)
  const unfilledBets = useUnfilledBets(contract.id, {
    enabled: isAdvancedTrader && shouldShowLimitOrderChart,
  })

  const showNoAnswers =
    answers.length === 0 || (shouldAnswersSumToOne && answers.length === 1)
  const setDefaultSort = async () => {
    await toast.promise(updateMarket({ contractId: contract.id, sort }), {
      loading: 'Updating sort order...',
      success: 'Sort order updated for all users',
      error: 'Failed to update sort order',
    })
  }

  const [isSearchOpen, setIsSearchOpen] = usePersistentInMemoryState(
    defaultAddAnswer ?? false,
    `answers-panel-search-open-${contract.id}`
  )
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen)

  const privateUser = usePrivateUser()
  const unresolvedAnswers = answers.filter((a) =>
    'resolution' in a ? !a.resolution : true
  )
  const canAddAnswer = Boolean(
    user &&
      !user.isBannedFromPosting &&
      (addAnswersMode === 'ANYONE' ||
        (addAnswersMode === 'ONLY_CREATOR' &&
          user.id === contract.creatorId)) &&
      tradingAllowed(contract) &&
      !privateUser?.blockedByUserIds.includes(contract.creatorId) &&
      unresolvedAnswers.length < getMaximumAnswers(shouldAnswersSumToOne) &&
      contract.outcomeType !== 'NUMBER'
  )

  return (
    <Col>
      <SearchCreateAnswerPanel
        contract={contract}
        canAddAnswer={canAddAnswer}
        text={query}
        setText={setQuery}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        onCreateAnswer={(newAnswer: string) => {
          setSort('new')
        }}
      >
        <Row className={'mb-1 items-center gap-4'}>
          <DropdownMenu
            closeOnClick
            items={generateFilterDropdownItems(SORTS, setSort)}
            icon={
              <Row className="text-ink-500 items-center gap-0.5">
                <span className="whitespace-nowrap text-sm font-medium">
                  Sort: {SORTS.find((s) => s.value === sort)?.label}
                </span>
                <ChevronDownIcon className="h-4 w-4" />
              </Row>
            }
          />
          {showSetDefaultSort && contract.sort !== sort && (
            <Button color="gray-outline" size="2xs" onClick={setDefaultSort}>
              Set default
            </Button>
          )}
          {!isSearchOpen && (
            <button
              onClick={toggleSearch}
              className="text-ink-500 hover:text-ink-300 flex items-center gap-0.5 text-sm font-medium"
            >
              <SearchIcon className="h-4 w-4" /> Search
            </button>
          )}
          {!isSearchOpen && canAddAnswer && (
            <button
              onClick={toggleSearch}
              className="text-ink-500 hover:text-ink-300 flex items-center gap-0.5 text-sm font-medium"
            >
              <PlusCircleIcon className="h-4 w-4" /> Add answer
            </button>
          )}
        </Row>
      </SearchCreateAnswerPanel>

      {showNoAnswers ? (
        <div className="text-ink-500 p-4 text-center">No answers yet</div>
      ) : (
        <Col className="mx-[2px] mt-1 gap-2">
          {/* selected answers that are not in answersToShow */}
          {selectedAnswers
            .filter(
              (answer) => !answersToShow.map((a) => a.id).includes(answer.id)
            )
            .map((selectedAnswer) => (
              <Answer
                className={clsx('border-primary-500 rounded border')}
                key={selectedAnswer.id}
                user={user}
                answer={selectedAnswer}
                contract={contract}
                onCommentClick={
                  onAnswerCommentClick
                    ? () => onAnswerCommentClick(selectedAnswer)
                    : undefined
                }
                onHover={(hovering) =>
                  onAnswerHover?.(hovering ? selectedAnswer : undefined)
                }
                onClick={() => {
                  onAnswerClick?.(selectedAnswer)
                }}
                unfilledBets={unfilledBets?.filter(
                  (b) => b.answerId === selectedAnswer.id
                )}
                color={getAnswerColor(selectedAnswer)}
                userBets={userBetsByAnswer[selectedAnswer.id]}
                shouldShowLimitOrderChart={isAdvancedTrader}
              />
            ))}

          {answersToShow.map((answer) => (
            <Answer
              className={clsx(
                selectedAnswerIds.length > 0
                  ? !selectedAnswerIds.includes(answer.id)
                    ? 'opacity-70'
                    : 'border-primary-500 rounded border'
                  : ''
              )}
              key={answer.id}
              user={user}
              answer={answer}
              contract={contract}
              onCommentClick={
                onAnswerCommentClick
                  ? () => onAnswerCommentClick(answer)
                  : undefined
              }
              onHover={(hovering) =>
                onAnswerHover?.(hovering ? answer : undefined)
              }
              onClick={() => {
                onAnswerClick?.(answer)
              }}
              unfilledBets={unfilledBets?.filter(
                (b) => b.answerId === answer.id
              )}
              color={getAnswerColor(answer)}
              userBets={userBetsByAnswer[answer.id]}
              shouldShowLimitOrderChart={
                isAdvancedTrader && shouldShowLimitOrderChart
              }
            />
          ))}
          <Pagination
            page={page}
            pageSize={ANSWERS_PER_PAGE}
            totalItems={query ? searchedAnswers.length : sortedAnswers.length}
            setPage={setPage}
          />
        </Col>
      )}
      {isAdvancedTrader && (
        <Row className="mt-2 items-center gap-2 self-end">
          <input
            id="limitOrderChart"
            type="checkbox"
            className="border-ink-500 bg-canvas-0 dark:border-ink-500 text-ink-500 focus:ring-ink-500 h-4 w-4 rounded"
            checked={shouldShowLimitOrderChart}
            onChange={() =>
              setShouldShowLimitOrderChart(!shouldShowLimitOrderChart)
            }
          />
          <label
            htmlFor="limitOrderChart"
            className="text-ink-500 text-sm font-medium"
          >
            Show limit orders
          </label>
        </Row>
      )}
    </Col>
  )
}

export const EditAnswerModal = (props: {
  open: boolean
  setOpen: (show: boolean) => void
  contract: Contract
  answer: Answer
  color: string
  user: User
}) => {
  const { answer, user, color, contract, open, setOpen } = props
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnresolving, setIsUnresolving] = useState(false)

  const [text, setText] = useState(answer.text)
  const [unresolveText, setUnresolveText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const editAnswer = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const res = await editAnswerCpmm({
      answerId: answer.id,
      contractId: contract.id,
      text,
    })
      .catch((e) => {
        console.error(e)
        setError(e.message)
        return null
      })
      .finally(() => {
        setIsSubmitting(false)
      })
    if (!res) return

    setOpen(false)
  }

  return (
    <Modal open={open} setOpen={setOpen}>
      <Col className={clsx('bg-canvas-50 gap-2 rounded-md p-4')}>
        <span className={'font-semibold'}>Title</span>
        <Row className={'gap-1'}>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full"
          />
          <Button
            size={'xs'}
            color={'indigo'}
            loading={isSubmitting}
            onClick={editAnswer}
          >
            Save
          </Button>
        </Row>
        <span className={'font-semibold'}>Color</span>
        <CustomizeableDropdown
          menuWidth="200px"
          buttonClass={clsx(buttonClass('sm', 'gray-outline'), 'h-full')}
          buttonContent={() => (
            <div
              className="h-5 w-5 rounded-full"
              style={{ background: color }}
            />
          )}
          dropdownMenuContent={(close) => (
            <CirclePicker
              className="w-[240px] py-2"
              onChange={async (change) => {
                try {
                  await editAnswerCpmm({
                    answerId: answer.id,
                    contractId: contract.id,
                    color: change.hex,
                  })
                } catch (error) {
                  console.error(error)
                } finally {
                  close()
                }
              }}
            />
          )}
        />

        {(isModId(user.id) ||
          isAdminId(user.id) ||
          contract.creatorId === user.id) &&
          answer.resolutionTime && (
            <>
              <span className={'font-semibold'}>Unresolve</span>
              <Row className={'gap-1'}>
                <Input
                  value={unresolveText}
                  placeholder={'Type UNRESOLVE to unresolve'}
                  onChange={(e) => setUnresolveText(e.target.value)}
                  className="w-full"
                  disabled={isUnresolving}
                />
                <Button
                  size={'xs'}
                  color={'red'}
                  loading={isUnresolving}
                  onClick={async () => {
                    setIsUnresolving(true)
                    api('unresolve', {
                      contractId: contract.id,
                      answerId: answer.id,
                    })
                      .then(() => {
                        setIsUnresolving(false)
                        setUnresolveText('')
                        setOpen(false)
                      })
                      .catch((e) => {
                        setIsUnresolving(false)
                        setError(e.message)
                      })
                  }}
                  disabled={unresolveText !== 'UNRESOLVE' || isUnresolving}
                >
                  Unresolve
                </Button>
              </Row>
            </>
          )}
        {error ? <span className="text-red-500">{error}</span> : null}
      </Col>
    </Modal>
  )
}

// just the bars
export function SimpleAnswerBars(props: {
  contract: MultiContract
  maxAnswers?: number
  barColor?: string
  feedReason?: string
}) {
  const { contract, maxAnswers = Infinity, barColor, feedReason } = props
  const { outcomeType } = contract

  const shouldAnswersSumToOne =
    'shouldAnswersSumToOne' in contract ? contract.shouldAnswersSumToOne : true
  const user = useUser()
  const answers = contract.answers
    .filter(
      (a) =>
        outcomeType === 'MULTIPLE_CHOICE' || ('number' in a && a.number !== 0)
    )
    .map((a) => ({ ...a, prob: getAnswerProbability(contract, a.id) }))

  const displayedAnswers = sortAnswers(contract, answers).slice(0, maxAnswers)

  const moreCount = answers.length - displayedAnswers.length

  // Note: Hide answers if there is just one "Other" answer.
  const showNoAnswers =
    answers.length === 0 || (shouldAnswersSumToOne && answers.length === 1)
  const isAdvancedTrader = useIsAdvancedTrader()
  const [shouldShowLimitOrderChart] = usePersistentLocalState<boolean>(
    true,
    SHOW_LIMIT_ORDER_CHARTS_KEY
  )

  return (
    <Col className="mx-[2px] gap-2">
      {showNoAnswers ? (
        <div className="text-ink-500 pb-4">No answers yet</div>
      ) : (
        <>
          {displayedAnswers.map((answer) => (
            <Answer
              user={user}
              key={answer.id}
              answer={answer}
              contract={contract}
              color={getAnswerColor(answer)}
              barColor={barColor}
              shouldShowLimitOrderChart={
                isAdvancedTrader && shouldShowLimitOrderChart
              }
              feedReason={feedReason}
            />
          ))}
          {moreCount > 0 && (
            <Row className="w-full justify-end">
              <Link
                className="text-ink-500 hover:text-primary-500 text-sm"
                href={contractPath(contract)}
              >
                See {moreCount} more {moreCount === 1 ? 'answer' : 'answers'}{' '}
                <ArrowRightIcon className="inline h-4 w-4" />
              </Link>
            </Row>
          )}
        </>
      )}
    </Col>
  )
}

export function Answer(props: {
  contract: MultiContract
  answer: Answer
  unfilledBets?: Array<LimitBet>
  color: string
  user: User | undefined | null
  onCommentClick?: () => void
  onHover?: (hovering: boolean) => void
  onClick?: () => void
  userBets?: Bet[]
  barColor?: string
  shouldShowLimitOrderChart: boolean
  feedReason?: string
  className?: string
}) {
  const {
    answer,
    contract,
    unfilledBets,
    onCommentClick,
    onHover,
    onClick,
    color,
    userBets,
    user,
    barColor,
    feedReason,
    shouldShowLimitOrderChart,
    className,
  } = props

  const prob = getAnswerProbability(contract, answer.id)
  const [editingAnswer, setEditingAnswer] = useState<Answer>()

  const isOther = 'isOther' in answer && answer.isOther

  const { resolution, resolutions } = contract
  const resolvedProb =
    resolution == undefined
      ? undefined
      : resolution === answer.id
      ? 1
      : (resolutions?.[answer.id] ?? 0) / 100

  const sharesSum = sumBy(userBets, (bet) =>
    bet.outcome === 'YES' ? bet.shares : -bet.shares
  )
  const hasBets = userBets && !floatingEqual(sharesSum, 0)
  const isClient = useIsClient()

  const yourUnfilledBets = unfilledBets?.filter(
    (bet) => bet.userId === user?.id
  )
  const canEdit = canEditAnswer(answer, contract, user)

  const textColorClass = clsx(
    resolvedProb === 0 ? 'text-ink-700' : 'text-ink-900'
  )

  const showSellButton =
    !resolution &&
    hasBets &&
    user &&
    (!contract.closeTime || contract.closeTime > Date.now()) &&
    !answer.resolutionTime

  const userHasLimitOrders =
    shouldShowLimitOrderChart && (yourUnfilledBets ?? []).length > 0

  const limitOrderVolume = useMemo(
    () => sumBy(unfilledBets, (bet) => bet.orderAmount - bet.amount),
    [unfilledBets]
  )

  const [tradesModalOpen, setTradesModalOpen] = useState(false)
  const [limitBetModalOpen, setLimitBetModalOpen] = useState(false)

  const hasLimitOrders = unfilledBets?.length && limitOrderVolume

  const dropdownItems = [
    ...(canEdit && 'poolYes' in answer && !answer.isOther
      ? [
          {
            icon: <PencilIcon className=" h-4 w-4" />,
            name: 'Edit',
            onClick: () => setEditingAnswer(answer),
          },
        ]
      : []),
    ...(onCommentClick
      ? [
          {
            icon: <ChatIcon className=" h-4 w-4" />,
            name: 'Comment',
            onClick: onCommentClick,
          },
        ]
      : []),
    {
      icon: <UserIcon className="h-4 w-4" />,
      name: 'Trades',
      buttonContent: (
        <Row>
          See <TradesNumber contract={contract} answer={answer} shorten />{' '}
          traders
        </Row>
      ),
      onClick: () => setTradesModalOpen(true),
    },
    ...(hasLimitOrders
      ? [
          {
            icon: <ScaleIcon className="h-4 w-4" />,
            name: getOrderBookButtonLabel(unfilledBets),
            onClick: () => setLimitBetModalOpen(true),
          },
        ]
      : []),
  ]

  return (
    <Col className={'full rounded'}>
      <AnswerBar
        color={color}
        prob={prob}
        resolvedProb={resolvedProb}
        onHover={onHover}
        onClick={onClick}
        className={clsx('group cursor-pointer', className)}
        barColor={barColor}
        label={
          <Row className={'items-center gap-2'}>
            {contract.addAnswersMode == 'ANYONE' && (
              <AnswerAvatar answer={answer} />
            )}
            <AnswerStatus contract={contract} answer={answer} />
            {isOther ? (
              <span className={textColorClass}>
                Other{' '}
                <InfoTooltip
                  className="!text-ink-600 dark:!text-ink-700"
                  text={OTHER_TOOLTIP_TEXT}
                />
              </span>
            ) : (
              <CreatorAndAnswerLabel
                text={answer.text}
                createdTime={answer.createdTime}
                className={clsx(
                  'items-center text-sm !leading-none sm:text-base',
                  textColorClass
                )}
              />
            )}
          </Row>
        }
        end={
          <Row className={'items-center gap-1'}>
            <BetButtons
              contract={contract}
              answer={answer}
              fillColor={barColor}
              feedReason={feedReason}
            />
            <DropdownMenu
              icon={<DotsVerticalIcon className="h-5 w-5" aria-hidden />}
              items={dropdownItems}
              withinOverflowContainer
              menuItemsClass="!z-50"
              className="!z-50"
            />
          </Row>
        }
        renderBackgroundLayer={
          shouldShowLimitOrderChart &&
          isClient && (
            <LimitOrderBarChart
              limitOrders={unfilledBets}
              prob={prob}
              activeColor={color}
            />
          )
        }
      />

      <Col>
        <Row
          className={
            'select-none flex-wrap items-center justify-end gap-2 px-3 py-0.5 text-xs'
          }
        >
          <Row className="text-ink-600 gap-1">
            {userHasLimitOrders && (
              <AnswerOrdersButton
                contract={contract}
                yourUnfilledBets={yourUnfilledBets}
                buttonClassName="hover:text-ink-700 hover:underline transition-all"
              />
            )}
            {userHasLimitOrders && showSellButton && <>{'·'}</>}
            {showSellButton && (
              <MultiSeller
                answer={answer}
                contract={contract}
                userBets={userBets}
                user={user}
                className="text-primary-600 hover:text-primary-700 transition-all"
                showPosition
              />
            )}
          </Row>
        </Row>
      </Col>

      {editingAnswer && user && (
        <EditAnswerModal
          open={!!editingAnswer}
          setOpen={() => setEditingAnswer(undefined)}
          contract={contract}
          answer={editingAnswer}
          color={color}
          user={user}
        />
      )}
      <TradesModal
        contract={contract}
        modalOpen={tradesModalOpen}
        setModalOpen={setTradesModalOpen}
        answer={answer}
      />
      {!!hasLimitOrders && (
        <Modal
          open={limitBetModalOpen}
          setOpen={setLimitBetModalOpen}
          size="md"
        >
          <Col className="bg-canvas-0">
            <OrderBookPanel
              limitBets={unfilledBets}
              contract={contract}
              answer={answer}
              showTitle
              expanded
            />
          </Col>
        </Modal>
      )}
    </Col>
  )
}

function AnswerOrdersButton(props: {
  contract: MultiContract
  yourUnfilledBets?: LimitBet[]
  buttonClassName?: string
}) {
  const { contract, yourUnfilledBets, buttonClassName } = props
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className={buttonClassName} onClick={() => setOpen(true)}>
        Your Orders
      </button>
      <Modal open={open} setOpen={setOpen}>
        <Col className={clsx(MODAL_CLASS, SCROLLABLE_MODAL_CLASS)}>
          <YourOrders
            contract={contract}
            bets={yourUnfilledBets ?? []}
            deemphasizedHeader
          />
        </Col>
      </Modal>
    </>
  )
}

export function canEditAnswer(
  answer: Answer,
  contract: MultiContract,
  user?: User | undefined | null
) {
  return (
    user &&
    'isOther' in answer &&
    !answer.isOther &&
    (isAdminId(user.id) ||
      isModId(user.id) ||
      user.id === contract.creatorId ||
      user.id === answer.userId)
  )
}

const AnswerAvatar = (props: { answer: Answer; className?: string }) => {
  const { answer, className } = props
  const answerCreator = useDisplayUserByIdOrAnswer(answer)
  if (!answerCreator) return <LoadingIndicator size={'sm'} />
  return (
    <UserHovercard userId={answerCreator.id}>
      <Row className={clsx('-ml-1 items-center self-start', className)}>
        <Avatar avatarUrl={answerCreator.avatarUrl} size={'2xs'} />
      </Row>
    </UserHovercard>
  )
}

export function LimitOrderBarChart({
  limitOrders,
  prob,
  activeColor,
}: {
  limitOrders?: Array<LimitBet>
  prob: number
  activeColor: string
}) {
  const limitOrdersByProb = useMemo(
    () => groupBy(limitOrders, 'limitProb'),
    [limitOrders]
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Object.entries(limitOrdersByProb).map(([limitProb, bets]) => {
        const numericLimitProb = Number(limitProb)
        const volume = sumBy(bets, (bet) => bet.orderAmount - bet.amount)

        const logVolume = Math.log(volume)
        const logMaxOfVolume = Math.log(40000)
        const scaledResult = (logVolume / logMaxOfVolume) * 50 // Only fill up max 50% of the height

        return (
          <div
            key={limitProb}
            className={clsx(
              'absolute bottom-0 -ml-1 min-h-[3px] w-0.5 rounded-t dark:brightness-75'
            )}
            style={{
              left: `${numericLimitProb * 100}%`,
              height: `${scaledResult}%`,

              backgroundColor:
                prob >= numericLimitProb
                  ? 'rgb(var(--color-canvas-50))'
                  : activeColor,
            }}
          ></div>
        )
      })}
    </div>
  )
}
