export type Stats = {
  startDate: [number]
  dailyActiveUsers: number[]
  dailyActiveUsersWeeklyAvg: number[]
  avgDailyUserActions: number[]
  weeklyActiveUsers: number[]
  monthlyActiveUsers: number[]
  engagedUsers: number[]
  dailySales: number[]
  salesWeeklyAvg: number[]
  monthlySales: number[]
  d1: number[]
  d1WeeklyAvg: number[]
  nd1: number[]
  nd1WeeklyAvg: number[]
  fracDaysActiveD1ToD3: number[]
  fracDaysActiveD1ToD3Avg7d: number[]
  nw1: number[]
  dailyBetCounts: number[]
  dailyContractCounts: number[]
  dailyCommentCounts: number[]
  dailySignups: number[]
  weekOnWeekRetention: number[]
  monthlyRetention: number[]
  dailyActivationRate: number[]
  dailyActivationRateWeeklyAvg: number[]
  manaBetDaily: number[]
  manaBetWeekly: number[]
  manaBetMonthly: number[]
  d1BetAverage: number[]
  d1Bet3DayAverage: number[]
  dailyNewRealUserSignups: number[]
}

export type ManaSupply = {
  balance: number
  spiceBalance: number
  investmentValue: number
  loanTotal: number
  ammLiquidity: number
  totalValue: number
}
