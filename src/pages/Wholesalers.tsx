import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, MessageCircle, Download, FileText, FileSpreadsheet, Edit, Trash2, AlertTriangle, Phone, MapPin, Building2, Package, X, Link2, Share2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Wholesaler, LowStockProduct, Product } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { WholesalerCard } from '../components/ui/WholesalerCard';
import { saveAs } from 'file-saver';

export const Wholesalers: React.FC = () => {
  const { user } = useAuth();
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingWholesaler, setEditingWholesaler] = useState<Wholesaler | null>(null);
  const [deletingWholesaler, setDeletingWholesaler] = useState<Wholesaler | null>(null);
  const [selectedWholesaler, setSelectedWholesaler] = useState<Wholesaler | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [wholesalerProducts, setWholesalerProducts] = useState<Wholesaler | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLinkProductsModalOpen, setIsLinkProductsModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLinkingProducts, setIsLinkingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    loadWholesalers();
  }, [user?.store_id, searchQuery, currentPage]);

  const loadWholesalers = async () => {
    if (!user?.store_id) return;

    try {
      setLoading(true);
      const response = await apiService.getWholesalers({
        store_id: user.store_id,
        search: searchQuery || undefined,
        page: currentPage,
        limit: 20,
        sort_by: 'name',
        sort_order: 'asc',
      });
      setWholesalers(response.wholesalers);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Failed to load wholesalers:', error);
      toast.error('Failed to load wholesalers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      is_active: true,
    });
  };

  const handleAddWholesaler = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in name and phone number');
      return;
    }

    if (!user?.store_id) {
      toast.error('Store ID is required');
      return;
    }

    try {
      await apiService.createWholesaler({
        ...formData,
        store_id: user.store_id,
      });
      toast.success('Wholesaler added successfully');
      setIsAddModalOpen(false);
      resetForm();
      loadWholesalers();
    } catch (error: any) {
      console.error('Failed to add wholesaler:', error);
      toast.error(error.message || 'Failed to add wholesaler');
    }
  };

  const handleEditWholesaler = (wholesaler: Wholesaler) => {
    setEditingWholesaler(wholesaler);
    setFormData({
      name: wholesaler.name,
      phone: wholesaler.phone,
      email: wholesaler.email || '',
      address: wholesaler.address || '',
      notes: wholesaler.notes || '',
      is_active: wholesaler.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateWholesaler = async () => {
    if (!editingWholesaler || !formData.name || !formData.phone) {
      toast.error('Please fill in name and phone number');
      return;
    }

    try {
      await apiService.updateWholesaler(editingWholesaler._id, formData);
      toast.success('Wholesaler updated successfully');
      setIsEditModalOpen(false);
      setEditingWholesaler(null);
      resetForm();
      loadWholesalers();
    } catch (error: any) {
      console.error('Failed to update wholesaler:', error);
      toast.error(error.message || 'Failed to update wholesaler');
    }
  };

  const handleDeleteWholesaler = (wholesaler: Wholesaler) => {
    setDeletingWholesaler(wholesaler);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteWholesaler = async () => {
    if (!deletingWholesaler) return;

    try {
      await apiService.deleteWholesaler(deletingWholesaler._id);
      toast.success('Wholesaler deleted successfully');
      setIsDeleteModalOpen(false);
      setDeletingWholesaler(null);
      loadWholesalers();
    } catch (error: any) {
      console.error('Failed to delete wholesaler:', error);
      toast.error(error.message || 'Failed to delete wholesaler');
    }
  };

  const handleViewLowStock = async (wholesaler: Wholesaler) => {
    setSelectedWholesaler(wholesaler);
    try {
      const products = await apiService.getWholesalerLowStock(wholesaler._id);
      setLowStockProducts(products);
      setIsLowStockModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load low stock products:', error);
      toast.error('Failed to load low stock products');
    }
  };

  const handleViewProducts = async (wholesaler: Wholesaler) => {
    try {
      const wholesalerWithProducts = await apiService.getWholesalerById(wholesaler._id, true);
      setWholesalerProducts(wholesalerWithProducts);
      setIsProductsModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleLinkProducts = async (wholesaler: Wholesaler) => {
    setWholesalerProducts(wholesaler);
    setSelectedProductIds([]);
    setProductSearchQuery('');
    await loadAvailableProducts();
    setIsLinkProductsModalOpen(true);
  };

  const loadAvailableProducts = async () => {
    if (!user?.store_id) return;
    
    try {
      const response = await apiService.getProducts({
        store_id: user.store_id,
        search: productSearchQuery || undefined,
      });
      setAvailableProducts(response.products);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    }
  };

  useEffect(() => {
    if (isLinkProductsModalOpen) {
      loadAvailableProducts();
    }
  }, [isLinkProductsModalOpen, productSearchQuery, user?.store_id]);

  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleConfirmLinkProducts = async () => {
    if (!wholesalerProducts || selectedProductIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    setIsLinkingProducts(true);
    try {
      // Update each selected product to link it to the wholesaler
      const updatePromises = selectedProductIds.map(productId =>
        apiService.updateProduct(productId, { wholesaler_id: wholesalerProducts._id })
      );

      await Promise.all(updatePromises);
      
      toast.success(`Successfully linked ${selectedProductIds.length} product(s) to ${wholesalerProducts.name}`);
      
      // Refresh the wholesaler products
      const updatedWholesaler = await apiService.getWholesalerById(wholesalerProducts._id, true);
      setWholesalerProducts(updatedWholesaler);
      
      // Small delay to ensure backend has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh the wholesalers list to update the card previews
      await loadWholesalers();
      
      // Force a small delay to ensure components re-render
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setIsLinkProductsModalOpen(false);
      setSelectedProductIds([]);
      setProductSearchQuery('');
    } catch (error: any) {
      console.error('Failed to link products:', error);
      toast.error(error.message || 'Failed to link products');
    } finally {
      setIsLinkingProducts(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedWholesaler) return;

    setIsSendingEmail(true);
    try {
      const response = await apiService.sendWholesalerEmailAlert(selectedWholesaler._id);
      toast.success(response.message || 'Email sent successfully');
    } catch (error: any) {
      console.error('Failed to send email:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleWhatsAppLink = async () => {
    if (!selectedWholesaler) return;

    try {
      const response = await apiService.getWholesalerWhatsAppLink(selectedWholesaler._id);
      window.open(response.link, '_blank');
    } catch (error: any) {
      console.error('Failed to get WhatsApp link:', error);
      toast.error(error.message || 'Failed to get WhatsApp link');
    }
  };

  const handlePhoneClick = async (wholesaler: Wholesaler) => {
    try {
      // Get low stock products for this wholesaler
      const lowStockProducts = await apiService.getWholesalerLowStock(wholesaler._id);
      
      let message = `Hello ${wholesaler.name},\n\n`;
      
      if (lowStockProducts.length > 0) {
        const outOfStock = lowStockProducts.filter(p => p.alert_type === 'out_of_stock');
        const lowStock = lowStockProducts.filter(p => p.alert_type === 'low_stock');
        
        if (outOfStock.length > 0) {
          message += `🚨 *OUT OF STOCK* (${outOfStock.length}):\n`;
          outOfStock.forEach(product => {
            message += `• ${product.product_name}\n`;
          });
          message += '\n';
        }
        
        if (lowStock.length > 0) {
          message += `⚠️ *LOW STOCK* (${lowStock.length}):\n`;
          lowStock.forEach(product => {
            message += `• ${product.product_name} (Current: ${product.current_quantity}, Min: ${product.min_stock_level})\n`;
          });
          message += '\n';
        }
        
        message += `Please let us know when you can restock these items.\n\nThank you!`;
      } else {
        message += `Hope you're doing well. Just checking in about our inventory.\n\nHave a great day!`;
      }
      
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = wholesaler.phone.replace(/[\s\-\(\)]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error: any) {
      console.error('Failed to open WhatsApp:', error);
      // Fallback to regular phone link
      const cleanPhone = wholesaler.phone.replace(/[\s\-\(\)]/g, '');
      window.open(`tel:${cleanPhone}`, '_self');
    }
  };

  const handleEmailClick = (wholesaler: Wholesaler) => {
    if (wholesaler.email) {
      window.location.href = `mailto:${wholesaler.email}`;
    }
  };

  const handleShareWholesaler = async (wholesaler: Wholesaler) => {
    try {
      // Get wholesaler with products for preview
      const wholesalerWithProducts = await apiService.getWholesalerById(wholesaler._id, true);
      
      // Create shareable URL (you'll need to implement this route on backend)
      const shareUrl = `${window.location.origin}/wholesalers/${wholesaler._id}`;
      
      // Create share text with product preview
      let shareText = `🏪 *${wholesaler.name}*\n\n`;
      if (wholesaler.phone) shareText += `📞 ${wholesaler.phone}\n`;
      if (wholesaler.email) shareText += `📧 ${wholesaler.email}\n`;
      if (wholesaler.address) shareText += `📍 ${wholesaler.address}\n`;
      
      if (wholesalerWithProducts.products && wholesalerWithProducts.products.length > 0) {
        shareText += `\n📦 *Products:* ${wholesalerWithProducts.products.length}\n`;
        // Show first 5 products
        wholesalerWithProducts.products.slice(0, 5).forEach((product: Product) => {
          shareText += `• ${product.name} - ₺${product.price.toFixed(2)}\n`;
        });
        if (wholesalerWithProducts.products.length > 5) {
          shareText += `...and ${wholesalerWithProducts.products.length - 5} more\n`;
        }
      }
      
      shareText += `\n${shareUrl}`;
      
      // Check if Web Share API is available
      if (navigator.share) {
        try {
          await navigator.share({
            title: wholesaler.name,
            text: shareText,
            url: shareUrl,
          });
        } catch (err) {
          // User cancelled or error - fallback to WhatsApp
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
          window.open(whatsappUrl, '_blank');
        }
      } else {
        // Fallback to WhatsApp share
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Failed to share:', error);
      toast.error('Failed to share wholesaler');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel', includeProducts: boolean) => {
    if (!user?.store_id) return;

    try {
      const blob = await apiService.exportWholesalers({
        format,
        include_products: includeProducts,
        store_id: user.store_id,
      });

      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      const filename = `wholesalers_${new Date().toISOString().split('T')[0]}.${extension}`;
      saveAs(blob, filename);
      toast.success(`Exported successfully as ${filename}`);
      setIsExportModalOpen(false);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Export failed');
    }
  };

  if (loading && wholesalers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="lg" className="mr-4" />
              <span className="text-gray-500 dark:text-gray-400 text-lg">Loading wholesalers...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-50"></div>
          <div className="relative p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Wholesalers</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your supplier contacts</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{total} wholesalers</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-row gap-3 items-center">
                <Button
                  onClick={() => setIsExportModalOpen(true)}
                  variant="outline"
                  size="md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  variant="primary"
                  size="md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Wholesaler
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search wholesalers by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Wholesalers Grid */}
        {wholesalers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wholesalers.map((wholesaler) => (
              <WholesalerCard
                key={`${wholesaler._id}-${wholesaler.updated_at || Date.now()}`}
                wholesaler={wholesaler}
                onEdit={handleEditWholesaler}
                onDelete={handleDeleteWholesaler}
                onViewProducts={handleViewProducts}
                onViewLowStock={handleViewLowStock}
                onPhoneClick={handlePhoneClick}
                onEmailClick={handleEmailClick}
                onShare={handleShareWholesaler}
                loadWholesalerWithProducts={apiService.getWholesalerById}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {searchQuery ? 'No wholesalers found' : 'No wholesalers yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                {searchQuery
                  ? 'Try adjusting your search terms to find what you\'re looking for.'
                  : 'Start by adding your first wholesaler to manage supplier contacts.'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Wholesaler
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing page {currentPage} of {totalPages} ({total} total)
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Wholesaler Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
          title="Add New Wholesaler"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Wholesaler name"
              required
            />
            <Input
              label="Phone *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddWholesaler}>
                Add Wholesaler
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Wholesaler Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingWholesaler(null);
            resetForm();
          }}
          title="Edit Wholesaler"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Wholesaler name"
              required
            />
            <Input
              label="Phone *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="edit_is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingWholesaler(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateWholesaler}>
                Update Wholesaler
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingWholesaler(null);
          }}
          title="Delete Wholesaler"
          size="md"
        >
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Delete Wholesaler
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold">"{deletingWholesaler?.name}"</span>? 
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingWholesaler(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteWholesaler}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>

        {/* Products Modal */}
        <Modal
          isOpen={isProductsModalOpen}
          onClose={() => {
            setIsProductsModalOpen(false);
            setWholesalerProducts(null);
          }}
          title={`Products - ${wholesalerProducts?.name || ''}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => wholesalerProducts && handleLinkProducts(wholesalerProducts)}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                Link Products
              </Button>
            </div>
            {wholesalerProducts?.products && wholesalerProducts.products.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {wholesalerProducts.products.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Stock: {product.stock_quantity} {product.unit}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Min: {product.min_stock_level}
                        </span>
                        {product.stock_quantity <= product.min_stock_level && (
                          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No products linked to this wholesaler</p>
                {wholesalerProducts && (
                  <Button
                    onClick={() => handleLinkProducts(wholesalerProducts)}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Link2 className="h-4 w-4" />
                    Link Products
                  </Button>
                )}
              </div>
            )}
          </div>
        </Modal>

        {/* Link Products Modal */}
        <Modal
          isOpen={isLinkProductsModalOpen}
          onClose={() => {
            setIsLinkProductsModalOpen(false);
            setSelectedProductIds([]);
            setProductSearchQuery('');
          }}
          title={`Link Products to ${wholesalerProducts?.name || ''}`}
          size="xl"
        >
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Products List */}
            {availableProducts.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product._id);
                  const isAlreadyLinked = wholesalerProducts?.products?.some(p => p._id === product._id);
                  
                  return (
                    <div
                      key={product._id}
                      onClick={() => !isAlreadyLinked && handleToggleProductSelection(product._id)}
                      className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        isAlreadyLinked
                          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isAlreadyLinked}
                        onChange={() => !isAlreadyLinked && handleToggleProductSelection(product._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                          {isAlreadyLinked && (
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                              Already Linked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {product.category}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ₺{product.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Stock: {product.stock_quantity} {product.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No products found</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProductIds.length} product(s) selected
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsLinkProductsModalOpen(false);
                    setSelectedProductIds([]);
                    setProductSearchQuery('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmLinkProducts}
                  disabled={selectedProductIds.length === 0 || isLinkingProducts}
                >
                  {isLinkingProducts ? 'Linking...' : `Link ${selectedProductIds.length} Product(s)`}
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Low Stock Products Modal */}
        <Modal
          isOpen={isLowStockModalOpen}
          onClose={() => {
            setIsLowStockModalOpen(false);
            setSelectedWholesaler(null);
            setLowStockProducts([]);
          }}
          title={`Low Stock Products - ${selectedWholesaler?.name || ''}`}
          size="xl"
        >
          <div className="space-y-4">
            {lowStockProducts.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {lowStockProducts.length} {lowStockProducts.length === 1 ? 'product' : 'products'} need restocking
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSendEmail}
                      disabled={isSendingEmail}
                      variant="outline"
                      size="sm"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {isSendingEmail ? 'Sending...' : 'Send Email'}
                    </Button>
                    <Button
                      onClick={handleWhatsAppLink}
                      variant="outline"
                      size="sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      {product.product_image && (
                        <img
                          src={product.product_image}
                          alt={product.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{product.product_name}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Current: {product.current_quantity}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Min: {product.min_stock_level}
                          </span>
                          <span className={`text-sm font-medium ${
                            product.alert_type === 'out_of_stock' 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {product.alert_type === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No low stock products for this wholesaler</p>
              </div>
            )}
          </div>
        </Modal>

        {/* Export Modal */}
        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Export Wholesalers"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport('pdf', false)}
                  className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                >
                  <FileText className="h-8 w-8 text-blue-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">PDF</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Basic export</div>
                </button>
                <button
                  onClick={() => handleExport('excel', false)}
                  className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors text-left"
                >
                  <FileSpreadsheet className="h-8 w-8 text-green-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Excel</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Spreadsheet format</div>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export with Products
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport('pdf', true)}
                  className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                >
                  <FileText className="h-8 w-8 text-blue-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">PDF with Products</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Includes product images</div>
                </button>
                <button
                  onClick={() => handleExport('excel', true)}
                  className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors text-left"
                >
                  <FileSpreadsheet className="h-8 w-8 text-green-600 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-white">Excel with Products</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Full product details</div>
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setIsExportModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

