import CancelBookingButton from '@/components/cancel-booking-button'
import EditBookingButton from '@/components/edit-booking-button'
import { connectToDB } from '@/lib/db'
import { getStreetFromAddress } from '@/lib/utils'
import { Booking, BookingModel } from '@/schemas/booking'
import { ParkingLocation, ParkingLocationModel } from '@/schemas/parking-locations'
import { BookingStatus } from '@/types'
import { auth } from '@clerk/nextjs/server'
import { format } from 'date-fns'
import React from 'react'
import dynamic from 'next/dynamic'

const NavigateToParkingLite = dynamic(() => import('@/components/navigate-to-parking-lite'), { ssr: false })

async function MyBookingsPage() {

    const { userId } = auth()

    if (!userId) {
        await auth().redirectToSignIn({ returnBackUrl: '/mybookings'})
    }

    await connectToDB()


    const bookings: Booking[] = await BookingModel.find({
        userid: userId
    }).populate({
        path: 'locationid', model: ParkingLocationModel
    })

  return (
    <div className="py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">My Bookings</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">Your parking plans</h1>
        </header>

        <div className="space-y-4">
          {bookings.map((booking) => {
            const location = (booking.locationid as unknown) as ParkingLocation | null
            const address = location?.address || 'Location not available'
            const gpscoords = location?.gpscoords

            const statusClass =
              booking.status === BookingStatus.BOOKED
                ? 'bg-emerald-100 text-emerald-700'
                : booking.status === BookingStatus.CANCELLED
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-700'

            return (
              <div
                key={booking.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col space-y-2">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {getStreetFromAddress(address)}
                    </h2>
                    <div className="text-sm text-slate-600">
                      <p>{format(booking.bookingdate, 'MMM d, yyyy')}</p>
                      <p>
                        {format(booking.starttime, 'hh:mm a')} – {format(booking.endtime, 'hh:mm a')}
                      </p>
                    </div>
                  </div>

                  {booking.status === BookingStatus.BOOKED && (
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                      <CancelBookingButton param={JSON.parse(JSON.stringify(booking.id))} />
                      <EditBookingButton booking={JSON.parse(JSON.stringify(booking))} />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  {gpscoords ? (
                    <NavigateToParkingLite parking={{ gpscoords, address }} />
                  ) : (
                    <p className="text-sm text-slate-500">No location coordinates available for navigation.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MyBookingsPage