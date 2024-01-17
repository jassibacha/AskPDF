import BillingForm from '@/components/BillingForm'
import { getUserSubscriptionPlan } from '@/lib/stripe'


async function page() {
  const subscriptionPlan = await getUserSubscriptionPlan()

  console.log('/billing - Subscription Plan Data:', subscriptionPlan)


  return (
    <BillingForm subscriptionPlan={subscriptionPlan} />
  )
}

export default page