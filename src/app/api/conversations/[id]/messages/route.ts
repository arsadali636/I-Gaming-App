export const dynamic = "force-dynamic";

import { GET as getMessages, POST as postMessages } from "@/app/api/messages/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  url.searchParams.set("conversation_id", id);
  const forwardedRequest = new Request(url.toString(), {
    headers: request.headers,
    method: "GET",
  });
  return getMessages(forwardedRequest);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const forwardedBody = {
    ...body,
    conversation_id: id,
  };

  const forwardedRequest = new Request(request.url, {
    headers: request.headers,
    method: "POST",
    body: JSON.stringify(forwardedBody),
  });

  return postMessages(forwardedRequest);
}
