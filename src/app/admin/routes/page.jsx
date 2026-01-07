'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Map, Trash2, ArrowRight, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'

export default function RoutesPage() {
    const [routes, setRoutes] = useState([])
    const [isAdding, setIsAdding] = useState(false)
    const [editRoute, setEditRoute] = useState(null)
    
    // Dynamic Points State
    const [boardingPoints, setBoardingPoints] = useState([])
    const [droppingPoints, setDroppingPoints] = useState([])
    const [bpInput, setBpInput] = useState('')
    const [dpInput, setDpInput] = useState('')

    useEffect(() => {
        fetchRoutes()
    }, [])

    const fetchRoutes = async () => {
        const { data, error } = await supabase.from('routes').select('*').order('created_at', { ascending: false })
        if (error) console.error(error)
        else setRoutes(data || [])
    }

    const handlePointInput = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addPoint(type)
        }
    }

    const normalizePoints = (points) => {
        if (!points) return []
        if (!Array.isArray(points)) return []
        
        return points.map(p => {
            // Case 1: p is already a proper object
            if (typeof p === 'object' && p !== null) {
                let name = p.name
                let price = p.price || 0
                
                // Check if name is a JSON string (double-wrapped case)
                if (typeof name === 'string' && name.trim().startsWith('{')) {
                    try {
                        const innerParsed = JSON.parse(name)
                        if (innerParsed && innerParsed.name) {
                            name = innerParsed.name
                            price = innerParsed.price || price
                        }
                    } catch (e) {
                        // name is just a string starting with {, keep as-is
                    }
                }
                
                return { name: name || 'Unknown', price: price }
            }
            
            // Case 2: p is a string
            if (typeof p === 'string') {
                const cleaned = p.trim()
                if (cleaned.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(cleaned)
                        if (parsed && parsed.name) {
                            // Recursively check if parsed.name is also JSON
                            let innerName = parsed.name
                            if (typeof innerName === 'string' && innerName.startsWith('{')) {
                                try {
                                    const innerParsed = JSON.parse(innerName)
                                    if (innerParsed.name) return { name: innerParsed.name, price: innerParsed.price || 0 }
                                } catch (e) {}
                            }
                            return { name: innerName, price: parsed.price || 0 }
                        }
                    } catch (e) {}
                }
                // Plain string like "Mumbai"
                return { name: cleaned, price: 0 }
            }
            
            return { name: 'Invalid', price: 0 }
        })
    }

    const addPoint = (type) => {
        if (type === 'boarding' && bpInput.trim()) {
            setBoardingPoints([...boardingPoints, { name: bpInput.trim(), price: 0 }])
            setBpInput('')
        }
        if (type === 'dropping' && dpInput.trim()) {
            setDroppingPoints([...droppingPoints, { name: dpInput.trim(), price: 0 }])
            setDpInput('')
        }
    }

    const removePoint = (type, index) => {
        if (type === 'boarding') setBoardingPoints(boardingPoints.filter((_, i) => i !== index))
        if (type === 'dropping') setDroppingPoints(droppingPoints.filter((_, i) => i !== index))
    }

    const updatePointPrice = (type, index, price) => {
        const val = parseFloat(price) || 0
        if (type === 'boarding') {
            const newPts = [...boardingPoints]
            newPts[index].price = val
            setBoardingPoints(newPts)
        }
        if (type === 'dropping') {
            const newPts = [...droppingPoints]
            newPts[index].price = val
            setDroppingPoints(newPts)
        }
    }

    const startAdding = () => {
        setEditRoute(null)
        setBoardingPoints([])
        setDroppingPoints([])
        setIsAdding(true)
    }

    const startEditing = (route) => {
        setEditRoute(route)
        setBoardingPoints(normalizePoints(route.boarding_points))
        setDroppingPoints(normalizePoints(route.dropping_points))
        setIsAdding(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSaveRoute = async (e) => {
        e.preventDefault()
        
        console.log("STEP 1: Save triggered")
        const toastId = toast.loading("Saving...")

        const formData = new FormData(e.target)
        const payload = {
            source_city: formData.get('source'),
            destination_city: formData.get('destination'),
            distance: formData.get('distance'),
            duration: formData.get('duration'),
            default_price: parseFloat(formData.get('price')) || 0,
            boarding_points: boardingPoints,
            dropping_points: droppingPoints
        }

        console.log("STEP 2: Payload prepared", JSON.stringify(payload))

        // Manual timeout wrapper
        const timeoutMs = 8000
        let timeoutId

        try {
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Operation timed out after ${timeoutMs/1000}s. Check RLS policies in Supabase.`))
                }, timeoutMs)
            })

            const savePromise = (async () => {
                console.log("STEP 3: Calling Supabase...")
                let result
                if (editRoute) {
                    console.log("STEP 3a: UPDATE operation for ID:", editRoute.id)
                    result = await supabase
                        .from('routes')
                        .update(payload)
                        .eq('id', editRoute.id)
                        .select()
                    console.log("STEP 4a: Update result:", result)
                } else {
                    console.log("STEP 3b: INSERT operation")
                    result = await supabase
                        .from('routes')
                        .insert([payload])
                        .select()
                    console.log("STEP 4b: Insert result:", result)
                }
                
                if (result.error) {
                    throw new Error(result.error.message || JSON.stringify(result.error))
                }
                
                return result
            })()

            // Race between save and timeout
            await Promise.race([savePromise, timeoutPromise])
            clearTimeout(timeoutId)

            console.log("STEP 5: Success!")
            toast.success(editRoute ? 'Route updated!' : 'Route added!', { id: toastId })
            setIsAdding(false)
            setEditRoute(null)
            setBoardingPoints([])
            setDroppingPoints([])
            fetchRoutes()

        } catch (error) {
            clearTimeout(timeoutId)
            console.error("STEP ERROR:", error)
            toast.error(error.message || "Unknown error", { id: toastId })
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this route?')) return
        const { error } = await supabase.from('routes').delete().eq('id', id)
        if (error) toast.error('Failed to delete')
        else {
            toast.success('Route deleted')
            fetchRoutes()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Routes</h2>
                    <p className="text-zinc-400">Define the paths your buses take.</p>
                </div>
                {!isAdding && (
                    <button 
                        onClick={startAdding}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-600/20 w-full md:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Route
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="p-6 bg-zinc-900 border border-indigo-500/30 rounded-2xl animate-in slide-in-from-top-4 fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-white">{editRoute ? 'Edit Route' : 'New Route Details'}</h3>
                        <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <form key={editRoute ? editRoute.id : 'new'} onSubmit={handleSaveRoute} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Basic Info */}
                        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <input name="source" defaultValue={editRoute?.source_city} placeholder="From (e.g. Mumbai)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <input name="destination" defaultValue={editRoute?.destination_city} placeholder="To (e.g. Pune)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <input name="distance" defaultValue={editRoute?.distance} placeholder="Distance (e.g. 150 km)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <input name="duration" defaultValue={editRoute?.duration} placeholder="Duration (e.g. 3h 30m)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <input name="price" defaultValue={editRoute?.default_price} type="number" placeholder="Base Price (₹)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>

                        {/* Boarding Points Manager */}
                        <div className="col-span-1 md:col-span-2 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                            <label className="text-xs font-bold text-zinc-500 uppercase flex justify-between mb-2">
                                Boarding Points
                                <span className="bg-zinc-800 text-white px-2 rounded-full">{boardingPoints.length}</span>
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input 
                                    value={bpInput}
                                    onChange={(e) => setBpInput(e.target.value)}
                                    onKeyDown={(e) => handlePointInput(e, 'boarding')}
                                    placeholder="Add Point (Enter)" 
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                                <button type="button" onClick={() => addPoint('boarding')} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 rounded-lg font-bold">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {boardingPoints.map((p, i) => {
                                    // Defensive name extraction
                                    const displayName = (typeof p === 'object' && p?.name) ? p.name : (typeof p === 'string' ? p : 'Unknown')
                                    const displayPrice = (typeof p === 'object') ? (p.price || 0) : 0
                                    
                                    return (
                                        <div key={i} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1.5 rounded-lg group hover:border-indigo-500/40 transition-all">
                                            <span className="text-sm text-indigo-300 font-medium">{displayName}</span>
                                            <input 
                                                type="number" 
                                                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-center focus:border-indigo-500 outline-none text-white focus:ring-1 focus:ring-indigo-500/50"
                                                placeholder="₹ Price"
                                                title="Override Base Price"
                                                value={displayPrice || ''}
                                                onChange={(e) => updatePointPrice('boarding', i, e.target.value)}
                                            />
                                            <button type="button" onClick={() => removePoint('boarding', i)} className="text-zinc-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Dropping Points Manager */}
                        <div className="col-span-1 md:col-span-2 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                            <label className="text-xs font-bold text-zinc-500 uppercase flex justify-between mb-2">
                                Dropping Points
                                <span className="bg-zinc-800 text-white px-2 rounded-full">{droppingPoints.length}</span>
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input 
                                    value={dpInput}
                                    onChange={(e) => setDpInput(e.target.value)}
                                    onKeyDown={(e) => handlePointInput(e, 'dropping')}
                                    placeholder="Add Point (Enter)" 
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                                <button type="button" onClick={() => addPoint('dropping')} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 rounded-lg font-bold">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {droppingPoints.map((p, i) => {
                                    const displayName = (typeof p === 'object' && p?.name) ? p.name : (typeof p === 'string' ? p : 'Unknown')
                                    const displayPrice = (typeof p === 'object') ? (p.price || 0) : 0
                                    
                                    return (
                                        <div key={i} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-lg group hover:border-emerald-500/40 transition-all">
                                            <span className="text-sm text-emerald-300 font-medium">{displayName}</span>
                                            <input 
                                                type="number" 
                                                className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-center focus:border-emerald-500 outline-none text-white focus:ring-1 focus:ring-emerald-500/50"
                                                placeholder="₹ Price"
                                                title="Override Base Price"
                                                value={displayPrice || ''}
                                                onChange={(e) => updatePointPrice('dropping', i, e.target.value)}
                                            />
                                            <button type="button" onClick={() => removePoint('dropping', i)} className="text-zinc-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        
                        <div className="col-span-full flex items-center gap-2 mt-2 pt-4 border-t border-white/5">
                             <button type="submit" className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200">
                                {editRoute ? 'Update Route' : 'Save Route'}
                             </button>
                             <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {routes.map(route => (
                    <div key={route.id} className="p-4 md:p-5 bg-zinc-900/40 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                        <div className="flex items-start sm:items-center gap-4 w-full">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors shrink-0">
                                <Map className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 font-bold text-base md:text-lg text-white">
                                    <span>{route.source_city}</span>
                                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                                    <span>{route.destination_city}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-zinc-500 mt-1">
                                    <span>{route.distance}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{route.duration}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="text-indigo-400 font-medium">₹{route.default_price}</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <div className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                                        {route.boarding_points?.length || 0} Boarding Pts
                                    </div>
                                    <div className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                                        {route.dropping_points?.length || 0} Dropping Pts
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button onClick={() => startEditing(route)} className="text-zinc-700 hover:text-indigo-400 p-2 transition-colors" title="Edit Route">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(route.id)} className="text-zinc-700 hover:text-red-400 p-2 transition-colors" title="Delete Route">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
