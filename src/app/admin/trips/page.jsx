'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Clock, ArrowRight, Bus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ServicesPage() {
    const [services, setServices] = useState([])
    const [buses, setBuses] = useState([])
    const [routes, setRoutes] = useState([])
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data: servicesData } = await supabase
            .from('master_services')
            .select('*, buses(name, number_plate), routes(source_city, destination_city)')
            .order('departure_time', { ascending: true })

        const { data: busesData } = await supabase.from('buses').select('*')
        const { data: routesData } = await supabase.from('routes').select('*')

        setServices(servicesData || [])
        setBuses(busesData || [])
        setRoutes(routesData || [])
    }

    const handleAddService = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        
        const newService = {
            bus_id: formData.get('bus_id'),
            route_id: formData.get('route_id'),
            departure_time: formData.get('departure_time'),
            price: parseFloat(formData.get('price')),
            is_active: true
        }

        console.log("Saving Service:", newService)
        const { error } = await supabase.from('master_services').insert([newService])
        
        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Daily Service Created!')
            setIsAdding(false)
            fetchData()
        }
    }

    const handleDelete = async (id) => {
        if(!confirm("Stop this daily service? Future bookings might be affected.")) return;
        const { error } = await supabase.from('master_services').delete().eq('id', id)
        if(error) toast.error(error.message)
        else {
            toast.success("Service stopped")
            fetchData()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Daily Services</h2>
                    <p className="text-zinc-400">Manage buses that run everyday automatically.</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-600/20 w-full md:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    Add Daily Service
                </button>
            </div>

            {isAdding && (
                <div className="p-6 bg-zinc-900 border border-indigo-500/30 rounded-2xl animate-in slide-in-from-top-4 fade-in">
                    <h3 className="font-semibold text-white mb-4">New Daily Service</h3>
                    <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <select name="bus_id" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                            <option value="">Select Bus</option>
                            {buses.map(b => <option key={b.id} value={b.id}>{b.name} ({b.number_plate})</option>)}
                        </select>
                        <select name="route_id" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                            <option value="">Select Route</option>
                            {routes.map(r => <option key={r.id} value={r.id}>{r.source_city} ➝ {r.destination_city}</option>)}
                        </select>
                        {/* No Date Picker - Just Time */}
                        <div className="flex flex-col">
                             <label className="text-xs text-zinc-500 mb-1">Departure Time</label>
                             <input name="departure_time" type="time" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        <div className="flex flex-col">
                             <label className="text-xs text-zinc-500 mb-1">Base Price</label>
                             <input name="price" type="number" placeholder="₹ Price" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        </div>
                        
                        <div className="col-span-full flex items-center gap-2 mt-2">
                             <button type="submit" className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200">Start Daily Service</button>
                             <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {services.map(service => (
                    <div key={service.id} className="p-4 md:p-5 bg-zinc-900/40 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full">
                            <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-0 bg-zinc-800 px-4 py-2.5 rounded-lg min-w-[100px] sm:min-w-[80px]">
                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">DAILY</span>
                                <span className="text-lg sm:text-xl font-bold text-white">{service.departure_time?.slice(0,5)}</span>
                            </div>

                            <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-lg font-bold text-white">
                                    <span>{service.routes?.source_city}</span>
                                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                                    <span>{service.routes?.destination_city}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                                    <span className="flex items-center gap-1.5">
                                        <Bus className="w-3.5 h-3.5" />
                                        {service.buses?.name} ({service.buses?.number_plate})
                                    </span>
                                    <span className="text-emerald-500 text-xs px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                        Runs Everyday
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-6 md:border-none border-t border-white/5 pt-4 md:pt-0">
                             <div className="text-xl font-bold text-emerald-400">₹{service.price}</div>
                             <button onClick={() => handleDelete(service.id)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors bg-zinc-800/50 md:bg-transparent rounded-lg md:rounded-none">
                                <Trash2 className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                ))}

                {services.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500">No daily services active.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
