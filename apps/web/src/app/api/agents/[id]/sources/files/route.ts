import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agents/${agentId}/sources/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to upload file' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in file upload API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}