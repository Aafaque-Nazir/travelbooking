"use client"
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Bus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

export default function FleetPage() {
    const [buses, setBuses] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [editingBus, setEditingBus] = useState(null)
    const [errorMsg, setErrorMsg] = useState(null)

    useEffect(() => {
        fetchBuses()
    }, [])

    const fetchBuses = async () => {
        setIsLoading(true)
        setErrorMsg(null)
        const { data, error } = await supabase.from('buses').select('*').order('created_at', { ascending: false })
        
        if (error) {
            console.error("Fetch Error:", error)
            setErrorMsg(error.message)
            toast.error("Failed to load buses: " + error.message)
        } else {
            setBuses(data || [])
        }
        setIsLoading(false)
    }

    const handleSaveBus = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const busData = {
            name: formData.get('name'),
            number_plate: formData.get('number_plate'),
            type: formData.get('type'), // Volvo, Scania
            total_seats: parseInt(formData.get('total_seats')),
            seat_layout_type: formData.get('seat_layout_type')
        }

        toast.info(editingBus ? "Updating bus..." : "Saving bus...")

        let result
        if (editingBus) {
             result = await supabase
                .from('buses')
                .update(busData)
                .eq('id', editingBus.id)
                .select()
        } else {
             result = await supabase
                .from('buses')
                .insert([busData])
                .select()
        }
        const { data, error } = result

        if (error) {
            console.error("❌ Save Error:", error)
            toast.error("Failed: " + error.message)
        } else {
            toast.success(editingBus ? 'Bus updated successfully!' : 'Bus added successfully!')
            setIsAdding(false)
            setEditingBus(null)
            fetchBuses()
        }
    }

    const handleEdit = (bus) => {
        setEditingBus(bus)
        setIsAdding(true)
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancel = () => {
        setIsAdding(false)
        setEditingBus(null)
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will delete all trips associated with this bus.')) return
        
        const { error } = await supabase.from('buses').delete().eq('id', id)
        if (error) toast.error('Failed to delete')
        else {
            toast.success('Bus deleted')
            fetchBuses()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fleet Management</h2>
                    <p className="text-zinc-400">Manage your buses and configurations.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingBus(null)
                        setIsAdding(!isAdding)
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-600/20 w-full md:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    Add New Bus
                </button>
            </div>

            {isAdding && (
                <div className="p-6 bg-zinc-900 border border-indigo-500/30 rounded-2xl animate-in slide-in-from-top-4 fade-in">
                    <h3 className="font-semibold text-white mb-4">{editingBus ? 'Edit Bus Details' : 'New Bus Details'}</h3>
                    <form 
                        key={editingBus ? editingBus.id : 'new'} 
                        onSubmit={handleSaveBus} 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        <input name="name" defaultValue={editingBus?.name} placeholder="Bus Name (e.g. Mumbai Express)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <input name="number_plate" defaultValue={editingBus?.number_plate} placeholder="Number Plate (e.g. MH-04-AB-1234)" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <select name="type" defaultValue={editingBus?.type} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                            <option value="Volvo Multi-Axle">Volvo Multi-Axle</option>
                            <option value="Scania Sleeper">Scania Sleeper</option>
                            <option value="Mercedes Benz">Mercedes Benz</option>
                            <option value="Non-AC Seater">Non-AC Seater</option>
                            <option value="Non-AC Sleeper">Non-AC Sleeper</option>
                        </select>
                        <input name="total_seats" type="number" defaultValue={editingBus?.total_seats || 40} placeholder="Total Seats" required className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <select name="seat_layout_type" defaultValue={editingBus?.seat_layout_type} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                            <option value="2+2">2+2 Seater</option>
                            <option value="2+1">2+1 Sleeper</option>
                            <option value="2+1 Seater">2+1 Seater</option>
                            <option value="2+2 Sleeper">2+2 Sleeper</option>
                        </select>
                        <div className="flex items-center gap-2">
                             <button type="submit" className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200">{editingBus ? 'Update Bus' : 'Save Bus'}</button>
                             <button type="button" onClick={handleCancel} className="px-4 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
                    Error loading fleet: {errorMsg}
                    <button onClick={fetchBuses} className="ml-4 underline hover:text-red-300">Retry</button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {buses.map(bus => (
                    <div key={bus.id} className="group p-5 bg-zinc-900/40 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                <Bus className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleEdit(bus)} className="text-zinc-600 hover:text-indigo-400 p-2 transform hover:scale-110 transition-all" title="Edit">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(bus.id)} className="text-zinc-600 hover:text-red-400 p-2 transform hover:scale-110 transition-all" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-white mb-1">{bus.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono mb-4">
                            <span className="bg-zinc-900 px-2 py-0.5 rounded border border-white/5">{bus.number_plate}</span>
                            <span>•</span>
                            <span>{bus.type}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-white/5">
                            <span>{bus.total_seats} Seats</span>
                            <span>{bus.seat_layout_type} Layout</span>
                        </div>
                    </div>
                ))}
                
                {buses.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                        <p className="text-zinc-500">No buses found. Add your first bus!</p>
                    </div>
                )}
            </div>
        </div>
    )

}
