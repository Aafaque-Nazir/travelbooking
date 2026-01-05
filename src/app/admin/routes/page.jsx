'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Map, Trash2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function RoutesPage() {
    const [routes, setRoutes] = useState([])
    const [isAdding, setIsAdding] = useState(false)
    
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

    const addPoint = (type) => {
        if (type === 'boarding' && bpInput.trim()) {
            setBoardingPoints([...boardingPoints, bpInput.trim()])
            setBpInput('')
        }
        if (type === 'dropping' && dpInput.trim()) {
            setDroppingPoints([...droppingPoints, dpInput.trim()])
            setDpInput('')
        }
    }

    const removePoint = (type, index) => {
        if (type === 'boarding') setBoardingPoints(boardingPoints.filter((_, i) => i !== index))
        if (type === 'dropping') setDroppingPoints(droppingPoints.filter((_, i) => i !== index))
    }

    const handleAddRoute = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const newRoute = {
            source_city: formData.get('source'),
            destination_city: formData.get('destination'),
            distance: formData.get('distance'),
            duration: formData.get('duration'),
            default_price: parseFloat(formData.get('price')),
            boarding_points: boardingPoints,
            dropping_points: droppingPoints
        }

        console.log("Saving Route:", newRoute)
        
        const { data, error } = await supabase.from('routes').insert([newRoute]).select()
        
        if (error) {
            console.error("Route Save Error:", error)
            toast.error("Failed: " + error.message)
        } else {
            console.log("Route Saved:", data)
            toast.success('Route added!')
            setIsAdding(false)
            setBoardingPoints([])
            setDroppingPoints([])
            fetchRoutes()
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
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-600/20 w-full md:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    Create New Route
                </button>
            </div>

            {isAdding && (
                <div className="p-6 bg-zinc-900 border border-indigo-500/30 rounded-2xl animate-in slide-in-from-top-4 fade-in">
                    <h3 className="font-semibold text-white mb-4">New Route Details</h3>
                    <form onSubmit={handleAddRoute} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Basic Info */}
                        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <input name="source" placeholder="From (e.g. Mumbai)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <input name="destination" placeholder="To (e.g. Pune)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <input name="distance" placeholder="Distance (e.g. 150 km)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <input name="duration" placeholder="Duration (e.g. 3h 30m)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                            <input name="price" type="number" placeholder="Base Price (₹)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
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
                                {boardingPoints.map((p, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded text-xs">
                                        {p}
                                        <button type="button" onClick={() => removePoint('boarding', i)} className="hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                    </span>
                                ))}
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
                                {droppingPoints.map((p, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs">
                                        {p}
                                        <button type="button" onClick={() => removePoint('dropping', i)} className="hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="col-span-full flex items-center gap-2 mt-2 pt-4 border-t border-white/5">
                             <button type="submit" className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200">Save Route</button>
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
                        <button onClick={() => handleDelete(route.id)} className="self-end sm:self-auto text-zinc-700 hover:text-red-400 p-2 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
