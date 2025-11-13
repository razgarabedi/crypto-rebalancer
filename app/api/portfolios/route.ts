import { NextResponse } from 'next/server';
import '@/lib/server-init'; // Ensure scheduler starts on server startup
import { Portfolio } from '@/types';

// In-memory storage for demo purposes
// In production, use a database like PostgreSQL with Prisma
const portfolios: Portfolio[] = [
  {
    id: '1',
    name: 'Main Portfolio',
    totalValue: 10000,
    assets: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: 0.5,
        value: 5000,
        percentage: 50,
        targetPercentage: 40,
        difference: 10,
        action: 'sell',
        amount: 1000,
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 2,
        value: 3000,
        percentage: 30,
        targetPercentage: 30,
        difference: 0,
        action: 'hold',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        balance: 20,
        value: 2000,
        percentage: 20,
        targetPercentage: 30,
        difference: -10,
        action: 'buy',
        amount: 1000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function GET() {
  return NextResponse.json(portfolios);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newPortfolio: Portfolio = {
      id: Date.now().toString(),
      name: body.name,
      totalValue: 0,
      assets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    portfolios.push(newPortfolio);
    return NextResponse.json(newPortfolio, { status: 201 });
  } catch (/* eslint-disable @typescript-eslint/no-unused-vars */ error) {
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 }
    );
  }
}

