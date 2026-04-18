import { env } from "@/lib/env";

export function buildVerifyUrl(ticketCode: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/verify/${ticketCode}`;
}
