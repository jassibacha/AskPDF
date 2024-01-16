import BillingForm from '@/components/BillingForm'
import { getUserSubscriptionPlan } from '@/lib/stripe'


async function page() {
  const subscriptionPlan = await getUserSubscriptionPlan()


  return (
    <BillingForm subscriptionPlan={subscriptionPlan} />
  )
}

export default page