import { NextResponse } from 'next/server';

const aasaPayload = {
  applinks: {
    apps: [],
    details: [
      {
        appIDs: ['4Y5BW58548.com.ilim.damso'],
        components: [
          {
            '/': '/invite*',
            comment: '어르신 초대 링크',
          },
        ],
      },
    ],
  },
};

export function GET() {
  return new NextResponse(JSON.stringify(aasaPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}