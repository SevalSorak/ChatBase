import { NextRequest, NextResponse } from 'next/server';

type SegmentParams = {
  id: string;
};

type RouteContext = {
  params: Promise<SegmentParams>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const body = await request.json();
    const agentId = (await context.params).id;
    
    // Get the access token from cookies
    const token = request.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Forward the request to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}/sources/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to upload files' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in files upload API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}