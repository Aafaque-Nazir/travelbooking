'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Map, Trash2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function RoutesPage() {
    const [routes, setRoutes] = useState([])
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        fetchRoutes()
    }, [])

    const fetchRoutes = async () => {
        const { data, error } = await supabase.from('routes').select('*').order('created_at', { ascending: false })
        if (error) console.error(error)
        else setRoutes(data)
    }

    const handleAddRoute = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const newRoute = {
            source_city: formData.get('source'),
            destination_city: formData.get('destination'),
            distance: formData.get('distance'),
            duration: formData.get('duration'),
            default_price: parseFloat(formData.get('price'))
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Routes</h2>
                    <p className="text-zinc-400">Define the paths your buses take.</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Create New Route
                </button>
            </div>

            {isAdding && (
                <div className="p-6 bg-zinc-900 border border-indigo-500/30 rounded-2xl animate-in slide-in-from-top-4 fade-in">
                    <h3 className="font-semibold text-white mb-4">New Route Details</h3>
                    <form onSubmit={handleAddRoute} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <input name="source" placeholder="From (e.g. Mumbai)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <input name="destination" placeholder="To (e.g. Pune)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <input name="distance" placeholder="Distance (e.g. 150 km)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <input name="duration" placeholder="Duration (e.g. 3h 30m)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <input name="price" type="number" placeholder="Base Price (₹)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        
                        <div className="col-span-full flex items-center gap-2 mt-2">
                             <button type="submit" className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200">Save Route</button>
                             <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {routes.map(route => (
                    <div key={route.id} className="p-5 bg-zinc-900/40 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                                <Map className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 font-bold text-lg text-white">
                                    <span>{route.source_city}</span>
                                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                                    <span>{route.destination_city}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-500 mt-1">
                                    <span>{route.distance}</span>
                                    <span>•</span>
                                    <span>{route.duration}</span>
                                    <span>•</span>
                                    <span className="text-indigo-400 font-medium">₹{route.default_price}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(route.id)} className="text-zinc-700 hover:text-red-400 p-2 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
