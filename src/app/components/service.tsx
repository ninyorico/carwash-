import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export function Services() {
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(res => res.data)
  });

  const createService = useMutation({
    mutationFn: (data: any) => api.post('/services', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
  });

  const [newService, setNewService] = useState({ name: '', price: 0, durationMin: 30 });

  const handleAddService = () => {
    if (!newService.name || !newService.price) return;
    createService.mutate({
      id: `srv_${Date.now()}`,
      name: newService.name,
      price: newService.price,
      durationMin: newService.durationMin
    });
    setNewService({ name: '', price: 0, durationMin: 30 });
  };

  if (isLoading) return <div className="p-8 text-white">Loading services...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Service Management</h1>
      
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Add New Service</h2>
        <div className="grid grid-cols-3 gap-4">
          <input type="text" placeholder="Service Name" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
          <input type="number" placeholder="Price" value={newService.price} onChange={e => setNewService({ ...newService, price: parseFloat(e.target.value) })} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
          <input type="number" placeholder="Duration (min)" value={newService.durationMin} onChange={e => setNewService({ ...newService, durationMin: parseInt(e.target.value) })} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
        </div>
        <button onClick={handleAddService} className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold flex items-center gap-2"><Plus className="w-4 h-4" />Add Service</button>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Existing Services</h2>
        <div className="space-y-2">
          {services.map((service: any) => (
            <div key={service.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div><span className="text-white font-medium">{service.name}</span><span className="text-gray-400 ml-4">${service.price}</span><span className="text-gray-400 ml-4">{service.durationMin} min</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}