export const dynamic = "force-dynamic";

import { GET as getMessages } from "@/app/api/messages/route";

export async function GET(request: Request) {
  return getMessages(request);
}
