'use client'

import { buildMapInfoCardContent, buildMapInfoCardContentForDestination, destinationPin, getStreetFromAddress, parkingPin, parkingPinWithIndex } from "@/lib/utils"
import { MapAddressType, MapParams } from "@/types"
import { useJsApiLoader } from "@react-google-maps/api"
import { useEffect, useMemo, useRef } from "react"
import { GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps"

type LatLng = { lat: number; lng: number }

type MapProps = {
    mapParams: string
    origin?: LatLng | null
    destination?: LatLng | null
}

function Map({ mapParams, origin, destination }: MapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<google.maps.Map | null>(null)
    const markersRef = useRef<google.maps.Marker[]>([])
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
    const userMarkerRef = useRef<google.maps.Marker | null>(null)

    // Get API key from environment - DO NOT use fallbacks or hardcoded keys
    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;

    // Parse and validate mapParams with useMemo to handle updates
    const params = useMemo(() => {
        try {
            const parsed = JSON.parse(mapParams) as MapParams[]
            if (!parsed || parsed.length === 0) {
                return null
            }
            return parsed
        } catch (error) {
            console.error('Error parsing mapParams:', error)
            return null
        }
    }, [mapParams])

    // Only load Google Maps if API key is provided - fail fast if missing
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey || '', // Will show error if undefined
        libraries: GOOGLE_MAPS_LIBRARIES,
    })


    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') {
            return;
        }

        if (!isLoaded || !apiKey || loadError || !params || params.length === 0 || !mapRef.current) {
            if (loadError) {
                console.error('Error loading Google Maps:', loadError);
            }
            return;
        }

        // Ensure google.maps exists
        if (!window.google || !window.google.maps) {
            console.error('Google Maps API not available');
            return;
        }

        try {
            const mapOptions: google.maps.MapOptions = {
                center: {
                    lat: params[0].gpscoords.lat,
                    lng: params[0].gpscoords.lng
                },
                zoom: 14
            }

            const gMap = new window.google.maps.Map(mapRef.current as HTMLDivElement, mapOptions)
            mapInstanceRef.current = gMap;

            // Create info window
            infoWindowRef.current = new window.google.maps.InfoWindow({
                maxWidth: 200
            });

            // Clear previous markers
            markersRef.current.forEach(marker => {
                marker.setMap(null);
            });
            markersRef.current = [];
            if (userMarkerRef.current) {
                userMarkerRef.current.setMap(null)
                userMarkerRef.current = null
            }

            // Create markers
            params.forEach((loc, index) => {
                try {
                    let marker: google.maps.Marker;
                    let infoContent: string;

                    if (loc.type === MapAddressType.PARKINGLOCATION) {
                        // For indexed parking locations
                        marker = parkingPinWithIndex({
                            map: gMap,
                            position: {
                                lat: loc.gpscoords.lat,
                                lng: loc.gpscoords.lng
                            },
                            index: index + 1
                        });
                        infoContent = buildMapInfoCardContent(
                            getStreetFromAddress(loc.address),
                            loc.address,
                            loc.numberofspots as number,
                            loc.price?.hourly as number
                        );
                    } else if(loc.type === MapAddressType.ADMIN) {
                        // For admin locations
                        marker = parkingPin({
                            map: gMap,
                            position: {
                                lat: loc.gpscoords.lat,
                                lng: loc.gpscoords.lng
                            }
                        });
                        infoContent = buildMapInfoCardContent(
                            getStreetFromAddress(loc.address),
                            loc.address,
                            loc.numberofspots as number,
                            loc.price?.hourly as number
                        );
                    } else {
                        // For destination
                        marker = destinationPin({
                            map: gMap,
                            position: {
                                lat: loc.gpscoords.lat,
                                lng: loc.gpscoords.lng
                            }
                        });
                        infoContent = buildMapInfoCardContentForDestination(
                            getStreetFromAddress(loc.address), 
                            loc.address
                        );

                        // Add circle for destination
                        new window.google.maps.Circle({
                            strokeColor: '#00FF00',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: '#0FF000',
                            fillOpacity: 0.35,
                            map: gMap,
                            center: {
                                lat: params[0].gpscoords.lat,
                                lng: params[0].gpscoords.lng
                            },
                            radius: loc.radius || 1000
                        });
                    }

                    markersRef.current.push(marker);

                    // Add click listener for info window
                    marker.addListener('click', () => {
                        if (infoWindowRef.current) {
                            infoWindowRef.current.close();
                            infoWindowRef.current.setContent(infoContent);
                            infoWindowRef.current.open(gMap, marker);
                        }
                    });
                } catch (error) {
                    console.error(`Error creating marker for ${loc.address}:`, error);
                }
            });

            // Render user/origin marker if provided
            if (origin) {
                userMarkerRef.current = new window.google.maps.Marker({
                    map: gMap,
                    position: origin,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#2563eb",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                    },
                    title: "You are here"
                })
            }

            // Fit bounds if origin and destination are provided
            if (origin && (destination || (params && params[0]?.gpscoords))) {
                const bounds = new window.google.maps.LatLngBounds()
                bounds.extend(origin)
                const destPoint = destination || params[0].gpscoords
                bounds.extend(destPoint as google.maps.LatLngLiteral)
                gMap.fitBounds(bounds, 80)
            }
        } catch (error) {
            console.error('Error initializing map:', error);
        }

        // Cleanup function
        return () => {
            // Clear markers
            markersRef.current.forEach(marker => {
                marker.setMap(null);
            });
            markersRef.current = [];
            if (userMarkerRef.current) {
                userMarkerRef.current.setMap(null)
                userMarkerRef.current = null
            }
            
            // Close info window
            if (infoWindowRef.current) {
                infoWindowRef.current.close();
                infoWindowRef.current = null;
            }

            // Clear map instance
            mapInstanceRef.current = null;
        };
    }, [isLoaded, apiKey, loadError, params, origin, destination]);

    // Early return if params is invalid
    if (!params || params.length === 0) {
        return <div className="p-4 text-slate-400">No locations to display on map</div>
    }

    if (!apiKey) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">Google Maps API Key Not Configured</p>
                <p className="text-red-300 text-sm">
                    Please set <code className="bg-red-900/50 px-1 rounded">NEXT_PUBLIC_MAPS_API_KEY</code> in your Vercel environment variables.
                </p>
            </div>
        )
    }

    if (loadError) {
        const errorMessage = loadError.message || 'Unknown error';
        const isAuthError = errorMessage.includes('Do you own this website') || errorMessage.includes('refererNotAllowedMapError');
        
        return (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">Error Loading Google Maps</p>
                <p className="text-red-300 text-sm mb-2">{errorMessage}</p>
                {isAuthError && (
                    <div className="mt-3 p-3 bg-red-900/30 rounded border border-red-600">
                        <p className="text-red-200 text-xs font-semibold mb-1">Common Fixes:</p>
                        <ul className="text-red-300 text-xs space-y-1 list-disc list-inside">
                            <li>Check API key restrictions in Google Cloud Console</li>
                            <li>Add your Vercel domain to HTTP referrer restrictions: <code className="bg-red-900/50 px-1 rounded">*.vercel.app/*</code></li>
                            <li>Ensure Maps JavaScript API and Places API are enabled</li>
                            <li>Verify billing is enabled in Google Cloud Console</li>
                        </ul>
                    </div>
                )}
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <p className="text-slate-400">Loading map...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-4">
            <div style={{ height: '600px', width: '100%' }} ref={mapRef} />
            {/* Directions temporarily disabled to prevent call stack overflow */}
        </div>
    )
}

export default Map