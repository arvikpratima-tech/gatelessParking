'use client'

import React, { useEffect, useMemo, useRef, useState } from "react"
import Map from "./map"
import { MapAddressType, MapParams, ParkingLocation } from "@/types"

type LatLng = { lat: number; lng: number }

type NavigateToParkingProps = {
    parking: Pick<ParkingLocation, "address" | "gpscoords" | "_id" | "numberofspots" | "price">
    parkingName?: string
}

type DirectionsMeta = {
    distanceText?: string
    durationText?: string
    steps?: google.maps.DirectionsStep[]
}

export function NavigateToParking({ parking, parkingName }: NavigateToParkingProps) {
    const [userLocation, setUserLocation] = useState<LatLng | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [directionsMeta, setDirectionsMeta] = useState<DirectionsMeta | null>(null)
    const [showDirections, setShowDirections] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const watchIdRef = useRef<number | null>(null)

    // Memoize destination to prevent object recreation
    const destination = useMemo(() => parking.gpscoords, [parking.gpscoords?.lat, parking.gpscoords?.lng])
    
    const mapParams = useMemo<MapParams[]>(() => {
        if (!destination) return []
        return [
            {
                address: parking.address,
                gpscoords: destination,
                price: parking.price,
                numberofspots: parking.numberofspots,
                type: MapAddressType.PARKINGLOCATION,
                id: (parking as any)._id ?? ""
            }
        ]
    }, [parking.address, destination, parking.price?.hourly, parking.numberofspots, (parking as any)._id])

    const openInGoogleMapsHref = useMemo(() => {
        if (!destination) return '#'
        const { lat, lng } = destination
        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
    }, [destination])

    const stopFollowing = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }
        setIsFollowing(false)
    }

    const startFollowLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.")
            return
        }
        setError(null)
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            },
            (err) => {
                setError(err.message || "Unable to track location.")
                stopFollowing()
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000,
            }
        )
        setIsFollowing(true)
    }

    const requestLocationAndNavigate = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.")
            return
        }
        setLoading(true)
        setError(null)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setShowDirections(true)
                setLoading(false)
            },
            (err) => {
                setError(err.message || "Unable to fetch your location. You can still open in Google Maps.")
                setLoading(false)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        )
    }

    useEffect(() => {
        return () => {
            stopFollowing()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleDirectionsCalculated = React.useCallback((result: google.maps.DirectionsResult) => {
        const route = result.routes?.[0]
        const leg = route?.legs?.[0]
        setDirectionsMeta({
            distanceText: leg?.distance?.text,
            durationText: leg?.duration?.text,
            steps: leg?.steps,
        })
    }, [])

    const stepsPreview = useMemo(() => {
        if (!directionsMeta?.steps) return []
        return directionsMeta.steps.slice(0, 5)
    }, [directionsMeta])

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-800">Navigate to this parking</p>
                    <p className="text-sm text-slate-500">
                        {parkingName || "Parking"} • {parking.address}
                    </p>
                    {directionsMeta?.durationText && directionsMeta?.distanceText && (
                        <p className="text-sm text-slate-600">
                            {directionsMeta.durationText} • {directionsMeta.distanceText}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={requestLocationAndNavigate}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? "Getting location..." : "Navigate to this parking"}
                    </button>
                    <button
                        onClick={() => {
                            if (!isFollowing) {
                                startFollowLocation()
                            } else {
                                stopFollowing()
                            }
                        }}
                        className="px-4 py-2 rounded-md bg-slate-100 text-slate-800 text-sm font-medium hover:bg-slate-200 transition"
                    >
                        {isFollowing ? "Stop following" : "Follow my location"}
                    </button>
                    <a
                        href={openInGoogleMapsHref}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                    >
                        Open in Google Maps
                    </a>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                    {error}
                </div>
            )}

            {destination && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Map
                        mapParams={JSON.stringify(mapParams)}
                        origin={userLocation || undefined}
                        destination={destination}
                        showDirections={showDirections && !!userLocation}
                        onDirectionsCalculated={handleDirectionsCalculated}
                    />
                </div>
            )}

            {stepsPreview.length > 0 && (
                <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-800">Next steps</p>
                    <ol className="space-y-1 list-decimal list-inside text-sm text-slate-700">
                        {stepsPreview.map((step, idx) => (
                            <li key={idx} dangerouslySetInnerHTML={{ __html: step.instructions || "" }} />
                        ))}
                    </ol>
                    <p className="text-xs text-slate-500">Showing first {stepsPreview.length} steps.</p>
                </div>
            )}
        </div>
    )
}

export default NavigateToParking

