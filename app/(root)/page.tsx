import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import Image from 'next/image'
import { dummyInterviews } from '@/constants'
import InterviewCard from '@/components/InterviewCard'
import { get } from 'http'
import { getInterviewByUserId,getLatestInterviews } from '@/lib/actions/auth.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'

const page = async() => {
  const user = await getCurrentUser();
  const [userInterviews, latestInterviews] = await Promise.all([
    await getInterviewByUserId(user?.id || ''),
    await getLatestInterviews({ userId: user?.id || '' })
  ]);

  const hasPastInterviews = (userInterviews ?? []).length > 0;
  const hasUpcomingInterviews = (latestInterviews ?? []).length > 0;

  return (
    <div>
      <section className='card-cta'>
        <div className='flex flex-col gap-6 max-w-lg'>
            <h3>Get Interview-Ready with AI-Powered Practice and Feedback</h3>
            <p>Practice job interviews with AI, get personalized feedback, and ace your next interview.</p>
            <Button asChild className='btn-primary max-sm:w-full'>
              <Link href='/interview'>
                Start an Interview
              </Link>
            </Button>
        </div>
        <Image src = "/robot.png" alt = "robot" width = {400} height = {400} className='max-sm:hidden' />
      </section>
      <section className='flex flex-col gap-6 mt-8'>
          <h2>Your Interviews</h2>
          <div className= "interviews-section" >
            {hasPastInterviews ? (
                userInterviews?.map((interview) => {
                  return (
                    <InterviewCard {...interview} key={interview.id}/>
                  )
                })
              ) : (
                <p>You haven&apos;t taken any interviews yet</p>
              )}
          </div>
      </section>
      <section className='flex flex-col gap-6 mt-8'>
          <h2>Take an Interview</h2>
          <div className='interviews-section'>
            {hasUpcomingInterviews ? (
                latestInterviews?.map((interview) => {
                  return (
                    <InterviewCard {...interview} key={interview.id}/>
                  )
                })
              ) : (
                <p>There are no upcoming interviews</p>
              )}
          </div>
      </section>
    </div>
  )
}

export default page