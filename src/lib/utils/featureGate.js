import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import { canUseQPG, canAccessBooks, isAtLeast, PLANS } from '@/lib/config/plans';

async function getUserPlan(userId) {
  try {
    await connectDB();
    const User = (await import('@/lib/db/models/User')).default;
    const user = await User.findById(userId).select('subscription').lean();
    return user?.subscription?.plan || 'free';
  } catch {
    return 'free';
  }
}

export async function requireAuth(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Please sign in', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    };
  }
  return { session };
}

export async function requireQPG(request) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;

  const plan = await getUserPlan(authResult.session.user.id);

  if (!canUseQPG(plan)) {
    return {
      error: NextResponse.json(
        {
          success:     false,
          error:       'Question Paper Generator requires GTU-AI Pro or higher',
          code:        'PLAN_REQUIRED',
          requiredPlan: 'pro',
          currentPlan:  plan,
          upgradeUrl:  '/pricing',
        },
        { status: 403 }
      )
    };
  }

  return { session: authResult.session, plan };
}

export async function requireBooks(request) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;

  const plan = await getUserPlan(authResult.session.user.id);

  if (!canAccessBooks(plan)) {
    return {
      error: NextResponse.json(
        {
          success:      false,
          error:        'Books access requires GTU-AI Ranker plan',
          code:         'PLAN_REQUIRED',
          requiredPlan: 'ranker',
          currentPlan:  plan,
          upgradeUrl:   '/pricing',
        },
        { status: 403 }
      )
    };
  }

  return { session: authResult.session, plan };
}

export async function requirePlan(request, requiredPlan) {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;

  const plan = await getUserPlan(authResult.session.user.id);

  if (!isAtLeast(plan, requiredPlan)) {
    return {
      error: NextResponse.json(
        {
          success:      false,
          error:        `This feature requires ${PLANS[requiredPlan]?.name || requiredPlan} plan`,
          code:         'PLAN_REQUIRED',
          requiredPlan,
          currentPlan:  plan,
          upgradeUrl:   '/pricing',
        },
        { status: 403 }
      )
    };
  }

  return { session: authResult.session, plan };
}