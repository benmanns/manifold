import { APIHandler } from 'api/helpers/endpoint'
import { createSupabaseClient } from 'shared/supabase/init'
import { run } from 'common/supabase/utils'
import { uniqBy } from 'lodash'

export const getadanalytics: APIHandler<'get-ad-analytics'> = async (
  body,
  _,
  { log }
) => {
  const { contractId } = body
  const db = createSupabaseClient()
  const [{ data: adData }, { data: viewData }] = await Promise.all([
    run(
      db
        .from('market_ads')
        .select('id, funds, created_at, cost_per_view')
        .eq('market_id', contractId)
    ),
    run(
      db
        .from('user_seen_markets')
        .select('user_id, is_promoted')
        .eq('type', 'view market card')
        .eq('contract_id', contractId)
    ),
  ])
  log({ adData, viewData })

  const lastAdData = adData?.[0]

  const { count: redeemCount } = await run(
    db
      .from('txns')
      .select('*', { count: 'exact' })
      .eq('category', 'MARKET_BOOST_REDEEM')
      .eq('from_id', lastAdData?.id)
  )
  const promotedViewData = viewData?.filter((v) => v.is_promoted)
  const totalFunds = adData?.reduce((acc, v) => acc + v.funds, 0) ?? 0
  return {
    uniquePromotedViewers: uniqBy(promotedViewData, 'user_id').length,
    totalPromotedViews: promotedViewData.length,
    uniqueViewers: uniqBy(viewData, 'user_id').length,
    totalViews: viewData.length,
    redeemCount,
    isBoosted: !!adData?.length,
    totalFunds,
    adCreatedTime: lastAdData?.created_at,
  }
}
