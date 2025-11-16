// This endpoint is called by @ai-sdk/react's internal DefaultChatTransport
// It's a workaround for the "Failed to parse URL from /responses" error

export async function POST(req: Request) {
  // Simply return an empty success response
  // The actual data is handled by /api/chat
  return new Response('{}', {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
