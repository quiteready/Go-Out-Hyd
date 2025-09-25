"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlanCard } from "./PlanCard";
import { type PlanFeature } from "@/lib/subscriptions";

const PLANS: PlanFeature[] = [
  {
    name: "Free",
    documents: 10,
    storage: "100 MB",
    requests: 10,
    requestsPeriod: "daily",
    price: 0,
    support: "Basic support",
    description: "Perfect for trying out RAGI",
    videoSupport: false,
  },
  {
    name: "Basic",
    documents: 1000,
    storage: "5 GB",
    requests: 1000,
    requestsPeriod: "monthly",
    price: 29,
    support: "Email support",
    description: "For professionals and small teams",
    videoSupport: true,
  },
  {
    name: "Pro",
    documents: -1,
    storage: "50 GB",
    requests: -1,
    requestsPeriod: "monthly",
    price: 99,
    support: "Priority support",
    description: "For power users and heavy usage",
    videoSupport: true,
  },
];

export function SubscriptionPlansCard() {
  return (
    <Card className="md:col-span-2" data-section="plans">
      <CardHeader>
        <CardTitle>Available Plans</CardTitle>
        <CardDescription>
          Choose the plan that best fits your needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} loading={false} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
