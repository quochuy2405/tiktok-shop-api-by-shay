'use client';

import { useState } from 'react';

interface ProductData {
  success: boolean;
  data: any;
  source?: string;
  error?: string;
  message?: string;
  productId: string;
  region: string;
  locale: string;
}

export default function Home() {
  const [productId, setProductId] = useState('1731434312432060118');
  const [region, setRegion] = useState('VN');
  const [locale, setLocale] = useState('vi');
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    if (!productId.trim()) {
      setError('Vui lòng nhập Product ID');
      return;
    }

    setLoading(true);
    setError(null);
    setProductData(null);

    try {
      const response = await fetch(`/api/tiktok/product/${productId}?region=${region}&locale=${locale}`);
      const data: ProductData = await response.json();
      
      if (response.ok) {
        setProductData(data);
      } else {
        setError(`Lỗi ${response.status}: ${data.message || 'Không thể lấy dữ liệu sản phẩm'}`);
      }
    } catch (err) {
      setError('Lỗi kết nối: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">TikTok Shop API - Lấy thông tin sản phẩm</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product ID
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập Product ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="VN">Vietnam (VN)</option>
                <option value="US">United States (US)</option>
                <option value="UK">United Kingdom (UK)</option>
                <option value="SG">Singapore (SG)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locale
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="vi">Tiếng Việt (vi)</option>
                <option value="en">English (en)</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={fetchProduct}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Đang tải...' : 'Lấy thông tin sản phẩm'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        {productData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-800">Thông tin sản phẩm</h2>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  productData.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {productData.success ? 'Thành công' : 'Thất bại'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p><strong>Product ID:</strong> {productData.productId}</p>
                <p><strong>Region:</strong> {productData.region}</p>
                <p><strong>Locale:</strong> {productData.locale}</p>
                {productData.source && <p><strong>Nguồn dữ liệu:</strong> {productData.source}</p>}
              </div>
            </div>

            {productData.success ? (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Dữ liệu sản phẩm:</h3>
                <div className="bg-gray-100 rounded-md p-4 overflow-auto max-h-96">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(productData.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4 text-red-600">
                <p><strong>Lỗi:</strong> {productData.error}</p>
                <p><strong>Thông báo:</strong> {productData.message}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>API endpoint: <code className="bg-gray-200 px-2 py-1 rounded">/api/tiktok/product/[id]</code></p>
          <p className="mt-2">Curl command được chuyển đổi thành API Next.js với đầy đủ headers và cookies</p>
        </div>
      </div>
    </div>
  );
}
