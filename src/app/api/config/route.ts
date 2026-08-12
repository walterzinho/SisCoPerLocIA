import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    notionToken: process.env.NOTION_TOKEN || '',
    notionDatabaseId: process.env.NOTION_DATABASE_ID || '',
    googleApiKey: process.env.GOOGLE_AI_KEY || '',
  });
}
