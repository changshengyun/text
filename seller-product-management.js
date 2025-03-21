// 产品管理组件 (ProductManagement.vue)
<template>
  <div class="product-management">
    <h1>卖家产品管理</h1>
    
    <!-- 产品表单区域 -->
    <div class="product-form">
      <h2>{{ isEditing ? '编辑产品' : '发布新产品' }}</h2>
      <form @submit.prevent="saveProduct">
        <div class="form-group">
          <label for="title">产品标题:</label>
          <input id="title" v-model="product.title" required />
        </div>
        
        <div class="form-group">
          <label for="description">产品描述:</label>
          <textarea id="description" v-model="product.description" rows="4" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="price">价格 (¥):</label>
          <input id="price" type="number" v-model.number="product.price" min="0" step="0.01" required />
        </div>
        
        <div class="form-group">
          <label for="stock">库存:</label>
          <input id="stock" type="number" v-model.number="product.stock" min="0" required />
        </div>
        
        <div class="form-group">
          <label for="image">产品图片:</label>
          <input id="image" type="file" @change="handleImageUpload" accept="image/*" />
          <div v-if="product.imageUrl" class="image-preview">
            <img :src="product.imageUrl" alt="产品预览" />
          </div>
        </div>
        
        <div class="button-group">
          <button type="submit" class="btn-primary">{{ isEditing ? '保存修改' : '发布产品' }}</button>
          <button v-if="isEditing" type="button" @click="cancelEdit" class="btn-secondary">取消</button>
        </div>
      </form>
    </div>
    
    <!-- 产品列表区域 -->
    <div class="product-list">
      <h2>我的产品</h2>
      <div v-if="products.length === 0" class="no-products">
        您还没有发布任何产品
      </div>
      <table v-else class="products-table">
        <thead>
          <tr>
            <th>图片</th>
            <th>标题</th>
            <th>价格 (¥)</th>
            <th>库存</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in products" :key="item.id" :class="{ 'inactive': !item.active }">
            <td>
              <img v-if="item.imageUrl" :src="item.imageUrl" alt="产品图片" class="product-thumbnail" />
              <span v-else>无图片</span>
            </td>
            <td>{{ item.title }}</td>
            <td>{{ item.price.toFixed(2) }}</td>
            <td>{{ item.stock }}</td>
            <td>{{ item.active ? '在售' : '已下架' }}</td>
            <td>
              <button @click="editProduct(item)" class="btn-small">编辑</button>
              <button v-if="item.active" @click="toggleProductStatus(item.id, false)" class="btn-small btn-warning">下架</button>
              <button v-else @click="toggleProductStatus(item.id, true)" class="btn-small btn-success">上架</button>
              <button @click="deleteProduct(item.id)" class="btn-small btn-danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { getProducts, saveProductToAPI, updateProductAPI, deleteProductAPI, toggleProductStatusAPI } from '@/api/products';

export default {
  name: 'ProductManagement',
  setup() {
    const products = ref([]);
    const isEditing = ref(false);
    const editingId = ref(null);
    
    // 初始化新产品表单
    const product = reactive({
      title: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      active: true
    });
    
    // 加载卖家的产品列表
    const loadProducts = async () => {
      try {
        products.value = await getProducts();
      } catch (error) {
        console.error('加载产品失败:', error);
        // 可以在这里添加错误提示
      }
    };
    
    // 组件加载时获取产品列表
    onMounted(loadProducts);
    
    // 处理图片上传
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        // 创建预览
        const reader = new FileReader();
        reader.onload = (e) => {
          product.imageUrl = e.target.result;
        };
        reader.readAsDataURL(file);
        
        // 实际项目中这里应该上传图片到服务器并获取URL
        // uploadImageToServer(file).then(url => product.imageUrl = url);
      }
    };
    
    // 保存产品（新增或更新）
    const saveProduct = async () => {
      try {
        if (isEditing.value) {
          // 更新已有产品
          await updateProductAPI(editingId.value, { ...product });
        } else {
          // 添加新产品
          await saveProductToAPI({ ...product });
        }
        
        // 重置表单
        resetForm();
        // 重新加载产品列表
        await loadProducts();
      } catch (error) {
        console.error('保存产品失败:', error);
        // 可以在这里添加错误提示
      }
    };
    
    // 编辑产品
    const editProduct = (item) => {
      // 将产品数据填充到表单
      Object.assign(product, item);
      isEditing.value = true;
      editingId.value = item.id;
      
      // 滚动到表单位置
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // 取消编辑
    const cancelEdit = () => {
      resetForm();
    };
    
    // 重置表单
    const resetForm = () => {
      product.title = '';
      product.description = '';
      product.price = 0;
      product.stock = 0;
      product.imageUrl = '';
      product.active = true;
      isEditing.value = false;
      editingId.value = null;
    };
    
    // 删除产品
    const deleteProduct = async (id) => {
      if (!confirm('确定要删除此产品吗？')) return;
      
      try {
        await deleteProductAPI(id);
        await loadProducts();
      } catch (error) {
        console.error('删除产品失败:', error);
      }
    };
    
    // 切换产品状态（上架/下架）
    const toggleProductStatus = async (id, active) => {
      try {
        await toggleProductStatusAPI(id, active);
        await loadProducts();
      } catch (error) {
        console.error('更改产品状态失败:', error);
      }
    };
    
    return {
      products,
      product,
      isEditing,
      handleImageUpload,
      saveProduct,
      editProduct,
      cancelEdit,
      deleteProduct,
      toggleProductStatus
    };
  }
}
</script>

<style scoped>
.product-management {
  padding: 20px;
}

.product-form, .product-list {
  margin-bottom: 30px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.button-group {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.btn-primary, .btn-secondary, .btn-small {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-small {
  padding: 4px 8px;
  font-size: 0.9em;
  margin-right: 5px;
}

.btn-warning {
  background-color: #ff9800;
  color: white;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-success {
  background-color: #4CAF50;
  color: white;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th, .products-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.products-table th {
  background-color: #f5f5f5;
}

.product-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  margin-top: 10px;
}

.inactive {
  opacity: 0.6;
}

.no-products {
  padding: 20px;
  text-align: center;
  color: #888;
}
</style>
