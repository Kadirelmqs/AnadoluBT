import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { getProducts, getCategories, getTables, getCouriers, createOrder, downloadReceipt, toggleTableStatus } from '../services/api';
import { toast } from 'sonner';

export default function POSScreen() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderType, setOrderType] = useState('dine-in');
  const [loading, setLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory);
    } else {
      loadProducts();
    }
  }, [selectedCategory]);

  const loadInitialData = async () => {
    try {
      const [categoriesData, tablesData] = await Promise.all([
        getCategories(),
        getTables()
      ]);
      setCategories(categoriesData);
      setTables(tablesData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenemedi');
    }
  };

  const loadProducts = async (categoryId = null) => {
    try {
      const productsData = await getProducts(categoryId);
      setProducts(productsData);
    } catch (error) {
      console.error('Ürünler yüklenemedi:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        price: product.price
      }]);
    }
    toast.success(`${product.name} sepete eklendi`);
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepet boş!');
      return;
    }

    if (orderType === 'dine-in' && !selectedTable) {
      toast.error('Lütfen masa seçin!');
      return;
    }

    if (orderType === 'takeaway') {
      if (!customerForm.name || !customerForm.phone || !customerForm.address) {
        toast.error('Lütfen müşteri bilgilerini doldurun!');
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart,
        order_type: orderType,
        table_id: orderType === 'dine-in' ? selectedTable : null,
        customer_name: orderType === 'takeaway' ? customerForm.name : null,
        customer_phone: orderType === 'takeaway' ? customerForm.phone : null,
        customer_address: orderType === 'takeaway' ? customerForm.address : null,
      };

      const order = await createOrder(orderData);
      setLastOrderId(order.id);
      toast.success(`Sipariş oluşturuldu: ${order.order_number}`);
      
      // Sepeti temizle
      setCart([]);
      setSelectedTable(null);
      setCustomerForm({ name: '', phone: '', address: '' });
      
      // Masaları yenile
      const tablesData = await getTables();
      setTables(tablesData);
    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      toast.error('Sipariş oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTable = async (tableId) => {
    try {
      const response = await toggleTableStatus(tableId);
      toast.success('Masa durumu değiştirildi');
      // Masaları yenile
      const tablesData = await getTables();
      setTables(tablesData);
    } catch (error) {
      toast.error('Masa durumu değiştirilemedi');
    }
  };

  const handlePrintReceipt = async () => {
    if (!lastOrderId) {
      toast.error('Yazdırılacak sipariş bulunamadı');
      return;
    }

    try {
      const pdfBlob = await downloadReceipt(lastOrderId);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fis-${lastOrderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Fiş indirildi');
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      toast.error('Fiş indirilemedi');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ürün Listesi */}
      <div className="lg:col-span-2 space-y-4">
        {/* Kategori Filtreleri */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-lg mb-3">Kategoriler</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === null
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="category-all"
            >
              Tümü
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid={`category-${category.name.toLowerCase()}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Ürün Grid */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-lg mb-3">Ürünler</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 hover:shadow-lg transition-all border-2 border-transparent hover:border-orange-500 text-left"
                data-testid={`product-${product.name.toLowerCase()}`}
              >
                <div className="font-semibold text-gray-800 mb-1">{product.name}</div>
                <div className="text-orange-600 font-bold text-lg">{product.price.toFixed(2)} ₺</div>
                {product.description && (
                  <div className="text-xs text-gray-500 mt-1">{product.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sepet ve Sipariş Paneli */}
      <div className="space-y-4">
        {/* Sipariş Tipi */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-lg mb-3">Sipariş Tipi</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setOrderType('dine-in')}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                orderType === 'dine-in'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              data-testid="order-type-dine-in"
            >
              İçeride
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                orderType === 'takeaway'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              data-testid="order-type-takeaway"
            >
              Paket
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                orderType === 'delivery'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
              data-testid="order-type-delivery"
            >
              Gel-Al
            </button>
          </div>
        </div>

        {/* Masa Seçimi */}
        {orderType === 'dine-in' && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-lg mb-3">Masa Seçin</h3>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scroll">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table.id)}
                  disabled={table.is_occupied}
                  className={`px-3 py-3 rounded-lg font-medium text-sm transition-all ${
                    selectedTable === table.id
                      ? 'bg-orange-600 text-white'
                      : table.is_occupied
                      ? 'bg-red-100 text-red-400 cursor-not-allowed'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  data-testid={`table-${table.table_number}`}
                >
                  {table.table_number}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Müşteri Formu (Paket için) */}
        {orderType === 'takeaway' && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-lg mb-3">Müşteri Bilgileri</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Müşteri Adı"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                data-testid="customer-name"
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                data-testid="customer-phone"
              />
              <textarea
                placeholder="Adres"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                data-testid="customer-address"
              />
            </div>
          </div>
        )}

        {/* Sepet */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Sepet
            </h3>
            <span className="text-sm text-gray-500">{cart.length} ürün</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll mb-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Sepet boş
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                  data-testid={`cart-item-${item.product_name.toLowerCase()}`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product_name}</div>
                    <div className="text-orange-600 font-semibold">{item.price.toFixed(2)} ₺</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, -1)}
                      className="bg-gray-200 rounded p-1 hover:bg-gray-300"
                      data-testid={`decrease-${item.product_name.toLowerCase()}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, 1)}
                      className="bg-gray-200 rounded p-1 hover:bg-gray-300"
                      data-testid={`increase-${item.product_name.toLowerCase()}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="bg-red-100 text-red-600 rounded p-1 hover:bg-red-200 ml-2"
                      data-testid={`remove-${item.product_name.toLowerCase()}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Toplam */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ara Toplam:</span>
              <span className="font-semibold">{calculateTotal().toFixed(2)} ₺</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>KDV (10%):</span>
              <span className="font-semibold">{(calculateTotal() * 0.10).toFixed(2)} ₺</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>TOPLAM:</span>
              <span className="text-orange-600">{(calculateTotal() * 1.10).toFixed(2)} ₺</span>
            </div>
          </div>

          {/* Aksiyonlar */}
          <div className="space-y-2 mt-4">
            <button
              onClick={handleCreateOrder}
              disabled={loading || cart.length === 0}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              data-testid="create-order-btn"
            >
              {loading ? 'İşleniyor...' : 'Sipariş Oluştur'}
            </button>
            
            {lastOrderId && (
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center"
                data-testid="print-receipt-btn"
              >
                <FileText className="h-5 w-5 mr-2" />
                Fiş Yazdır
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
