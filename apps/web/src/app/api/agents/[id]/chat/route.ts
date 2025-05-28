import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;
    const agentId = params.id;
    
    // Get the access token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Forward the request to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message, conversationId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to process chat message' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}