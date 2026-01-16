import { useState, useEffect } from 'react';
import { Plus, Package, Tag, Grid } from 'lucide-react';
import { getCategories, createCategory, getProducts, createProduct, getTables, createTable } from '../services/api';
import { toast } from 'sonner';

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
  });
  const [tableForm, setTableForm] = useState({ table_number: '', capacity: '' });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'products') {
        const [categoriesData, productsData] = await Promise.all([
          getCategories(false),
          getProducts(null, false),
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
      } else if (activeTab === 'tables') {
        const tablesData = await getTables();
        setTables(tablesData);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await createCategory(categoryForm);
      toast.success('Kategori eklendi');
      setCategoryForm({ name: '', description: '' });
      setShowCategoryForm(false);
      loadData();
    } catch (error) {
      console.error('Kategori ekleme hatası:', error);
      toast.error('Kategori eklenemedi');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct({
        ...productForm,
        price: parseFloat(productForm.price),
      });
      toast.success('Ürün eklendi');
      setProductForm({ name: '', description: '', price: '', category_id: '', image_url: '' });
      setShowProductForm(false);
      loadData();
    } catch (error) {
      console.error('Ürün ekleme hatası:', error);
      toast.error('Ürün eklenemedi');
    }
  };

  const handleTableSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTable({
        ...tableForm,
        capacity: parseInt(tableForm.capacity),
      });
      toast.success('Masa eklendi');
      setTableForm({ table_number: '', capacity: '' });
      setShowTableForm(false);
      loadData();
    } catch (error) {
      console.error('Masa ekleme hatası:', error);
      toast.error('Masa eklenemedi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Yönetim Paneli</h2>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 border-b">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'products'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            data-testid="tab-products"
          >
            <Package className="h-5 w-5 inline mr-2" />
            Ürünler
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'tables'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            data-testid="tab-tables"
          >
            <Grid className="h-5 w-5 inline mr-2" />
            Masalar
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Kategoriler */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Kategoriler</h3>
                <button
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center"
                  data-testid="add-category-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Kategori Ekle
                </button>
              </div>

              {showCategoryForm && (
                <form onSubmit={handleCategorySubmit} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Kategori Adı"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                      data-testid="category-name-input"
                    />
                    <input
                      type="text"
                      placeholder="Açıklama (Opsiyonel)"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      data-testid="category-description-input"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      data-testid="submit-category"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg font-medium"
                    data-testid={`category-badge-${category.name.toLowerCase()}`}
                  >
                    <Tag className="h-4 w-4 inline mr-2" />
                    {category.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Ürünler */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Ürünler</h3>
                <button
                  onClick={() => setShowProductForm(!showProductForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center"
                  data-testid="add-product-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ürün Ekle
                </button>
              </div>

              {showProductForm && (
                <form onSubmit={handleProductSubmit} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Ürün Adı"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                      data-testid="product-name-input"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Fiyat"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                      data-testid="product-price-input"
                    />
                    <select
                      value={productForm.category_id}
                      onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                      data-testid="product-category-select"
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Açıklama (Opsiyonel)"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      data-testid="product-description-input"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      data-testid="submit-product"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
                    data-testid={`product-card-${product.name.toLowerCase()}`}
                  >
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-orange-600 font-bold text-lg">{product.price.toFixed(2)} ₺</p>
                    {product.description && (
                      <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                        product.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.is_available ? 'Mevcut' : 'Tükendi'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Masalar</h3>
              <button
                onClick={() => setShowTableForm(!showTableForm)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center"
                data-testid="add-table-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Masa Ekle
              </button>
            </div>

            {showTableForm && (
              <form onSubmit={handleTableSubmit} className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Masa Numarası"
                    value={tableForm.table_number}
                    onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                    data-testid="table-number-input"
                  />
                  <input
                    type="number"
                    placeholder="Kapasite"
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                    data-testid="table-capacity-input"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    data-testid="submit-table"
                  >
                    Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTableForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    İptal
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`rounded-lg p-4 text-center font-bold border-2 ${
                    table.is_occupied
                      ? 'bg-red-100 border-red-300 text-red-800'
                      : 'bg-green-100 border-green-300 text-green-800'
                  }`}
                  data-testid={`table-card-${table.table_number}`}
                >
                  <div className="text-2xl">{table.table_number}</div>
                  <div className="text-xs mt-1">{table.capacity} kişi</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}