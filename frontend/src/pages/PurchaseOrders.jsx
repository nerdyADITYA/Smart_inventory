import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText, X, Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const PurchaseOrders = () => {
    const { user } = useAuth();
    const canManagePOs = user?.role === 'owner' || user?.role === 'manager';

    const [pos, setPos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ supplier_id: '', total_amount: '', status: 'PENDING' });

    useEffect(() => {
        fetchPOs();
        if (canManagePOs) {
            fetchSuppliers();
        }
    }, [canManagePOs]);

    const fetchPOs = async () => {
        try {
            const res = await api.get('/purchase-orders');
            setPos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreatePO = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/purchase-orders', {
                supplier_id: formData.supplier_id,
                total_amount: parseFloat(formData.total_amount) || 0,
                status: formData.status
            });
            setShowCreateModal(false);
            setFormData({ supplier_id: '', total_amount: '', status: 'PENDING' });
            fetchPOs();
        } catch (err) {
            console.error('Error creating PO:', err);
            alert(err.response?.data?.message || 'Error creating PO');
        } finally {
            setSaving(false);
        }
    };

    const handleEditPO = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/purchase-orders/${selectedPO.id}`, {
                total_amount: parseFloat(formData.total_amount) || 0,
                status: formData.status
            });
            setShowEditModal(false);
            setSelectedPO(null);
            fetchPOs();
        } catch (err) {
            console.error('Error updating PO:', err);
            alert(err.response?.data?.message || 'Error updating PO');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePO = async (poId) => {
        if (!window.confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/purchase-orders/${poId}`);
            fetchPOs();
        } catch (err) {
            console.error('Error deleting PO:', err);
            alert(err.response?.data?.message || 'Error deleting PO');
        }
    };

    const openEditModal = (po) => {
        setSelectedPO(po);
        setFormData({
            supplier_id: po.supplier_id,
            total_amount: po.total_amount || '',
            status: po.status
        });
        setShowEditModal(true);
    };

    const statusColors = {
        DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        APPROVED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        RECEIVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };

    const filteredAndSortedPOs = pos
        .filter(po => {
            const searchLower = searchTerm.toLowerCase();
            const poIdString = `po-${String(po.id).padStart(5, '0')}`.toLowerCase();
            const matchesSearch = po.supplier_name.toLowerCase().includes(searchLower) ||
                poIdString.includes(searchLower) ||
                String(po.id).includes(searchLower);
            const matchesStatus = statusFilter === '' || po.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => a.id - b.id); // Ascending order by ID

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Purchase Orders</h1>
                    <p className="text-sm text-slate-400">Manage supplier orders and receiving process.</p>
                </div>
                {canManagePOs && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setFormData({ supplier_id: '', total_amount: '', status: 'PENDING' });
                            setShowCreateModal(true);
                        }}
                        className="flex items-center bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create PO
                    </motion.button>
                )}
            </div>

            {/* Filter and Search Bar */}
            <div className="glass-card overflow-hidden mt-6">
                <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row items-center justify-between bg-slate-800/30 gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="RECEIVED">Received</option>
                    </select>

                    <div className="relative w-full md:w-72 mt-2 md:mt-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search PO#, Supplier, etc..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">PO ID</th>
                                <th className="px-6 py-4 font-medium">Supplier</th>
                                <th className="px-6 py-4 font-medium">Date Created</th>
                                <th className="px-6 py-4 font-medium">Total Amount</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading purchase orders...</td>
                                </tr>
                            ) : filteredAndSortedPOs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 text-slate-600 mb-3" />
                                            <p>No purchase orders found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedPOs.map((po, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={po.id} className="hover:bg-slate-800/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-white">PO-{String(po.id).padStart(5, '0')}</td>
                                        <td className="px-6 py-4 text-sm text-slate-300">{po.supplier_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(po.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-white">${Number(po.total_amount).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusColors[po.status] || statusColors.DRAFT}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            {canManagePOs && (
                                                <div className="flex justify-end items-center gap-3">
                                                    <button
                                                        onClick={() => openEditModal(po)}
                                                        className="text-slate-400 hover:text-purple-400 transition-colors p-1"
                                                        title="Edit PO"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePO(po.id)}
                                                        className="text-slate-400 hover:text-red-400 transition-colors p-1"
                                                        title="Delete PO"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create PO Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Create Purchase Order</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleCreatePO} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Supplier</label>
                                    <select
                                        required
                                        value={formData.supplier_id}
                                        onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    >
                                        <option value="">Select a supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Total Amount</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.total_amount}
                                        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    >
                                        <option value="DRAFT">Draft</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="RECEIVED">Received</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                                    >
                                        {saving ? 'Creating...' : 'Create PO'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit PO Modal */}
            <AnimatePresence>
                {showEditModal && selectedPO && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Edit Purchase Order</h2>
                                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleEditPO} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Supplier</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={selectedPO.supplier_name}
                                        className="w-full px-4 py-2 bg-slate-800/30 border border-slate-700/30 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Total Amount</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.total_amount}
                                        onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    >
                                        <option value="DRAFT">Draft</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="RECEIVED">Received</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl text-sm font-medium shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default PurchaseOrders;
