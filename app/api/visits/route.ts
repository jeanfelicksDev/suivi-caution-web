import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    let totalVisits = 0;
    let todayVisits = 0;

    try {
      const totalAgg = await prisma.page_visits.aggregate({
        _sum: { visit_count: true },
        where: { page_name: 'consultation' }
      });
      totalVisits = totalAgg._sum.visit_count || 0;
      
      const todayVisit = await prisma.page_visits.findUnique({
        where: {
          page_name_visit_date: {
            page_name: 'consultation',
            visit_date: todayStr
          }
        }
      });
      todayVisits = todayVisit?.visit_count || 0;
    } catch(e) {
       console.log("DB might not have page_visits yet", e);
    }

    return NextResponse.json({ total: totalVisits, today: todayVisits });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tracking' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    await prisma.page_visits.upsert({
      where: {
        page_name_visit_date: {
          page_name: 'consultation',
          visit_date: todayStr
        }
      },
      update: {
        visit_count: { increment: 1 },
        updated_at: new Date()
      },
      create: {
        page_name: 'consultation',
        visit_date: todayStr,
        visit_count: 1
      }
    });

    const totalAgg = await prisma.page_visits.aggregate({
      _sum: { visit_count: true },
      where: { page_name: 'consultation' }
    });
    
    const todayVisit = await prisma.page_visits.findUnique({
      where: {
        page_name_visit_date: { page_name: 'consultation', visit_date: todayStr }
      }
    });

    return NextResponse.json({ 
      total: totalAgg._sum.visit_count || 0, 
      today: todayVisit?.visit_count || 0 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update tracking' }, { status: 500 });
  }
}
