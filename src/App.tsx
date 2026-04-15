/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  User, 
  Heart, 
  Search, 
  ChevronRight, 
  ChevronDown,
  Star, 
  Minus, 
  Plus, 
  Edit, 
  Truck, 
  ShieldCheck, 
  Leaf, 
  ArrowLeft, 
  ArrowRight,
  Send,
  Grid,
  Droplets,
  Utensils,
  Filter,
  CheckCircle2,
  Zap,
  Globe,
  Mail,
  Phone,
  Thermometer,
  Layers,
  Palette,
  LogOut,
  LogIn,
  Trash2,
  X,
  PlusCircle,
  Upload,
  Image as ImageIcon,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  CreditCard,
  MapPin,
  Check,
  MessageCircle,
  Facebook,
  Instagram,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactQuill from 'react-quill-new';
import { PRODUCTS, Product, PLACEHOLDER_IMAGE } from './constants';
import { 
  auth, db, loginWithGoogle, logout, onAuthStateChanged, 
  collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, serverTimestamp, orderBy,
  handleFirestoreError, OperationType, storage,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile
} from './firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

// --- Constants ---

const COLOR_MAP: Record<string, { hex: string, name: string }> = {
  '#F9B7B7': { hex: '#F9B7B7', name: 'Hồng Pastel' },
  '#212121': { hex: '#212121', name: 'Đen Nhám' },
  '#C62828': { hex: '#C62828', name: 'Đỏ Táo' },
  '#FDD835': { hex: '#FDD835', name: 'Vàng Chanh' },
  '#2D4F36': { hex: '#2D4F36', name: 'Xanh Lá Cây' },
  '#A2D2FF': { hex: '#A2D2FF', name: 'Xanh Sky' },
  '#B19CD9': { hex: '#B19CD9', name: 'Hoa oải hương' },
  '#FFFFFF': { hex: '#FFFFFF', name: 'Trắng' },
  '#FF9A8B': { hex: '#FF9A8B', name: 'Cam San Hô' },
  '#C4A484': { hex: '#C4A484', name: 'Beige / Kem' },
  '#80DEEA': { hex: '#80DEEA', name: 'Xanh Bạc hà' },
  'linear-gradient(to right, #E63946 50%, #A2D2FF 50%)': { hex: 'linear-gradient(to right, #E63946 50%, #A2D2FF 50%)', name: 'Đỏ xanh' }
};

// --- Types ---

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  color: string;
  size?: string;
  product?: Product; // For UI convenience
}

interface Order {
  id: string;
  uid: string;
  items: CartItem[];
  total: number;
  shipping: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'bank_transfer';
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
  };
  createdAt: any;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// --- Components ---

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) => {
  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl min-w-[300px] border backdrop-blur-md
              ${toast.type === 'success' ? 'bg-green-500/90 text-white border-green-400' : 
                toast.type === 'error' ? 'bg-red-500/90 text-white border-red-400' : 
                'bg-brand/90 text-white border-brand/50'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : 
             toast.type === 'error' ? <X size={20} /> : <ShoppingBag size={20} />}
            <p className="font-bold text-sm">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await updateProfile(userCredential.user, { displayName: data.name });
      }
      onClose();
    } catch (err: any) {
      setError(err.message === 'Firebase: Error (auth/user-not-found).' ? 'Tài khoản không tồn tại' : 
             err.message === 'Firebase: Error (auth/wrong-password).' ? 'Mật khẩu không chính xác' : 
             err.message === 'Firebase: Error (auth/email-already-in-use).' ? 'Email đã được sử dụng' : 
             'Đã có lỗi xảy ra, vui lòng thử lại');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-brand transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-headline font-extrabold text-brand">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </h2>
          <p className="text-zinc-500 mt-2">Chào mừng bạn đến với PiTi Store</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-2">
            <X size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Họ và tên</label>
              <input 
                {...register('name', { required: 'Vui lòng nhập tên' })}
                type="text" 
                className="w-full px-6 py-4 bg-surface-container-low border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                placeholder="Nguyễn Văn A"
              />
              {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.name.message as string}</p>}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Email</label>
            <input 
              {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^\S+@\S+$/i, message: 'Email không hợp lệ' } })}
              type="email" 
              className="w-full px-6 py-4 bg-surface-container-low border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              placeholder="example@gmail.com"
            />
            {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.email.message as string}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Mật khẩu</label>
            <input 
              {...register('password', { required: 'Vui lòng nhập mật khẩu', minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' } })}
              type="password" 
              className="w-full px-6 py-4 bg-surface-container-low border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.password.message as string}</p>}
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            {isLogin ? 'Đăng nhập' : 'Đăng ký ngay'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
            <span className="relative px-4 bg-white text-xs text-zinc-400 font-bold uppercase tracking-widest">Hoặc</span>
          </div>

          <button 
            onClick={() => loginWithGoogle()}
            className="w-full py-4 bg-white border border-zinc-200 text-on-surface rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-surface-container-low transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
            Tiếp tục với Google
          </button>

          <p className="mt-8 text-sm text-zinc-500">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-brand font-bold hover:underline"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

interface Review {
  id: string;
  uid: string;
  productId: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: any;
}

// --- Context ---

interface FirebaseContextType {
  user: any | null;
  role: string | null;
  loading: boolean;
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, color: string, size?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  createOrder: (orderData: any) => Promise<string>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      let message = "Đã có lỗi xảy ra.";
      try {
        const errInfo = JSON.parse(this.state.error.message);
        if (errInfo.error.includes('Quota exceeded')) {
          message = "Hệ thống đang tạm thời hết hạn mức truy cập miễn phí (Firestore Quota Exceeded). Vui lòng quay lại sau hoặc liên hệ quản trị viên.";
        } else {
          message = `Lỗi Firestore: ${errInfo.error} (${errInfo.operationType} at ${errInfo.path})`;
        }
      } catch (e) {
        message = this.state.error.message || message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-bold text-on-surface">Oops!</h2>
            <p className="text-zinc-500">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Components ---

const Navbar = ({ onNavigate, currentView, openAuth }: { onNavigate: (view: 'list' | 'detail' | 'admin' | 'admin_orders' | 'checkout', product?: Product, category?: string) => void, currentView: string, openAuth: () => void }) => {
  const { user, role, cart } = useFirebase();
  const [showCart, setShowCart] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(73,98,74,0.06)]">
      <div className="bg-accent text-on-surface py-2 text-center text-[10px] font-headline font-bold tracking-[0.2em] uppercase">
        PITI STORE - Bình & Cốc Giữ Nhiệt Cao Cấp • Gói giàu tinh tế trong từng sản phẩm
      </div>
      <div className="flex justify-between items-center px-8 h-20 max-w-7xl mx-auto">
        <div 
          className="text-2xl font-black text-brand uppercase tracking-[0.1em] font-headline cursor-pointer"
          onClick={() => onNavigate('list')}
        >
          PITI STORE
        </div>
        <div className="hidden md:flex items-center gap-10 font-headline font-medium tracking-tight">
          <button 
            onClick={() => onNavigate('list', undefined, 'Cốc giữ nhiệt')}
            className={`flex items-center gap-2 transition-all duration-300 ${currentView === 'list' ? 'text-brand border-b-2 border-brand pb-1' : 'text-zinc-500 hover:text-brand'}`}
          >
            <Grid size={16} /> Cốc giữ nhiệt
          </button>
          <button 
            onClick={() => onNavigate('list', undefined, 'Cốc lót sứ')}
            className="flex items-center gap-2 text-zinc-500 hover:text-brand transition-all duration-300"
          >
            <Layers size={16} /> Cốc lót sứ
          </button>
          <button 
            onClick={() => onNavigate('list', undefined, 'Bình giữ nhiệt')}
            className="flex items-center gap-2 text-zinc-500 hover:text-brand transition-all duration-300"
          >
            <Droplets size={16} /> Bình giữ nhiệt
          </button>
          <button 
            onClick={() => onNavigate('list', undefined, 'Bình nước')}
            className="flex items-center gap-2 text-zinc-500 hover:text-brand transition-all duration-300"
          >
            <Thermometer size={16} /> Bình nước
          </button>
          {role === 'admin' && user?.email === 'quyquyquyet1999@gmail.com' && (
            <div className="hidden md:flex items-center gap-6 border-l border-zinc-100 pl-6 ml-2">
              <button 
                onClick={() => onNavigate('admin')}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${currentView === 'admin' ? 'text-brand' : 'text-zinc-400 hover:text-brand'}`}
              >
                Sản phẩm
              </button>
              <button 
                onClick={() => onNavigate('admin_orders')}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${currentView === 'admin_orders' ? 'text-brand' : 'text-zinc-400 hover:text-brand'}`}
              >
                Đơn hàng
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-6 text-zinc-600">
          <button className="hover:text-brand transition-all duration-300 active:scale-90"><Search size={20} /></button>
          <div className="relative">
            <button 
              onClick={() => setShowCart(!showCart)}
              className="hover:text-brand transition-all duration-300 active:scale-90"
            >
              <ShoppingCart size={20} />
            </button>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
            
            <AnimatePresence>
              {showCart && (
                <CartDropdown onClose={() => setShowCart(false)} onCheckout={() => onNavigate('checkout')} />
              )}
            </AnimatePresence>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Chào,</p>
                <p className="text-xs font-bold text-brand truncate max-w-[100px]">{user.displayName || user.email?.split('@')[0]}</p>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-brand/20">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}`} alt="" className="w-full h-full object-cover" />
              </div>
              <button onClick={logout} className="hover:text-brand transition-all duration-300 active:scale-90">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={openAuth} className="hover:text-brand transition-all duration-300 active:scale-90">
              <LogIn size={20} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const CartDropdown = ({ onClose, onCheckout }: { onClose: () => void, onCheckout: () => void }) => {
  const { cart, products, removeFromCart, updateCartQuantity } = useFirebase();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden z-[60]"
    >
      <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
        <h3 className="font-bold text-on-surface">Giỏ hàng</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-primary"><X size={18} /></button>
      </div>
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <ShoppingCart size={40} className="mx-auto mb-2 opacity-20" />
            <p>Giỏ hàng trống</p>
          </div>
        ) : (
          cart.map(item => {
            const product = products.find(p => p.id === item.productId) || PRODUCTS.find(p => p.id === item.productId);
            if (!product) return null;
            return (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-low shrink-0">
                  <img src={product.image || PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate">{product.name}</h4>
                  <p className="text-[10px] text-zinc-500">{item.color}{item.size ? ` - ${item.size}` : ''}</p>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-5 h-5 flex items-center justify-center rounded bg-zinc-100 text-zinc-600"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-zinc-100 text-zinc-600"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {cart.length > 0 && (
        <div className="p-4 bg-surface-container-low border-t border-zinc-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-zinc-500">Tổng cộng:</span>
            <span className="font-headline font-bold text-secondary">
              {cart.reduce((acc, item) => {
                const p = PRODUCTS.find(prod => prod.id === item.productId);
                return acc + (p ? p.price * item.quantity : 0);
              }, 0).toLocaleString('vi-VN')}đ
            </span>
          </div>
          <button 
            onClick={() => {
              onCheckout();
              onClose();
            }}
            className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:opacity-90 transition-all"
          >
            Thanh toán
          </button>
        </div>
      )}
    </motion.div>
  );
};

const Footer = () => (
  <footer className="bg-[#DDEBFA] w-full py-16 mt-20 font-sans text-sm leading-relaxed">
    <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="space-y-6">
        <div className="text-2xl font-black text-zinc-800 font-headline tracking-widest uppercase">PITI STORE</div>
        <p className="text-zinc-600 pr-4">PiTi Store chuyên cung cấp các dòng bình và cocktail nhiệt độ cao, mang đến giải pháp sống xanh, bền vững và chất lượng vượt trội cho người dùng Việt.</p>
        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-600 shadow-sm hover:scale-110 transition-transform hover:text-brand">
            <Facebook size={20} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-600 shadow-sm hover:scale-110 transition-transform hover:text-brand">
            <Music size={20} />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-600 shadow-sm hover:scale-110 transition-transform hover:text-brand">
            <Instagram size={20} />
          </a>
        </div>
      </div>
      <div className="space-y-6">
        <h4 className="font-bold text-zinc-800 uppercase tracking-widest text-xs font-headline">Hỗ trợ khách hàng</h4>
        <div className="flex flex-col gap-4 text-zinc-600">
          <a href="#" className="hover:text-brand transition-colors">Chính sách bảo hành 1:1 (Lỗi từ nhà sản xuất trong 3 tháng)</a>
          <a href="#" className="hover:text-brand transition-colors">Hướng dẫn mua hàng và thanh toán VietQR</a>
          <a href="#" className="hover:text-brand transition-colors">Câu hỏi thường gặp (FAQ)</a>
          <a href="tel:0333401882" className="hover:text-brand transition-colors flex items-center gap-2">
            <Phone size={14} /> Liên hệ trực tiếp qua Hotline/Zalo: 0333401882
          </a>
        </div>
      </div>
      <div className="space-y-6">
        <h4 className="font-bold text-zinc-800 uppercase tracking-widest text-xs font-headline">Về chúng tôi</h4>
        <div className="flex flex-col gap-4 text-zinc-600">
          <a href="#" className="hover:text-brand transition-colors">Câu chuyện thương hiệu PITI STORE</a>
          <a href="#" className="hover:text-brand transition-colors">Tuyển dụng cộng tác viên bán hàng</a>
          <a href="#" className="hover:text-brand transition-colors">Hợp tác doanh nghiệp (Cung cấp quà tặng in logo theo yêu cầu)</a>
        </div>
      </div>
      <div className="space-y-6">
        <h4 className="font-bold text-zinc-800 uppercase tracking-widest text-xs font-headline">Bản tin</h4>
        <p className="text-zinc-600">Đăng ký để nhận thông tin sản phẩm mới và ưu đãi độc quyền từ PiTi Store.</p>
        <div className="flex">
          <input 
            type="email" 
            placeholder="Nhập email của bạn" 
            className="bg-white border-none rounded-l-xl px-4 py-3 w-full focus:ring-1 focus:ring-brand text-sm"
          />
          <button className="bg-[#E2583E] text-white px-4 rounded-r-xl hover:opacity-90 transition-all">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-8 mt-20 pt-8 border-t border-zinc-200 text-center">
      <p className="text-zinc-500 text-xs">
        © 2024 PITI STORE - Bình & Cốc Giữ Nhiệt Cao Cấp. Hotline: <a href="tel:0333401882" className="text-[#E2583E] font-bold">0333401882</a>. 
        Email: <a href="mailto:chichine153@gmail.com" className="hover:text-[#E2583E] transition-colors">chichine153@gmail.com</a>. 
        Gói giàu tinh tế trong từng sản phẩm. All rights reserved.
      </p>
    </div>
  </footer>
);

const ContactWidget = () => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4">
      {/* Messenger */}
      <motion.a
        href="https://m.me/pitistore"
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl relative group"
      >
        <MessageCircle size={28} />
        <span className="absolute right-full mr-4 px-3 py-1 bg-white text-zinc-800 text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Messenger
        </span>
      </motion.a>

      {/* Zalo */}
      <motion.a
        href="https://zalo.me/0333401882"
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 bg-[#0068ff] text-white rounded-full flex items-center justify-center shadow-2xl relative group"
      >
        <div className="font-black text-xs">Zalo</div>
        <span className="absolute right-full mr-4 px-3 py-1 bg-white text-zinc-800 text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Zalo: 0333401882
        </span>
      </motion.a>

      {/* Call */}
      <motion.a
        href="tel:0333401882"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, -10, 10, -10, 10, 0]
        }}
        transition={{ 
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut"
        }}
        className="w-14 h-14 bg-[#E2583E] text-white rounded-full flex items-center justify-center shadow-2xl relative group"
      >
        <Phone size={28} />
        <span className="absolute right-full mr-4 px-3 py-1 bg-white text-zinc-800 text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Hotline: 0333401882
        </span>
      </motion.a>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  filteredColor?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, filteredColor }) => {
  const { role, user } = useFirebase();
  const [isHovered, setIsHovered] = useState(false);

  const productImages = product.images && product.images.length > 0 ? product.images : [product.image, product.hoverImage];
  
  let displayImage = (product.images?.[0] || product.image) || PLACEHOLDER_IMAGE;
  
  if (filteredColor && product.colorImageMap?.[filteredColor]) {
    const imgIndex = product.colorImageMap[filteredColor] - 1;
    if (productImages[imgIndex]) {
      displayImage = productImages[imgIndex];
    }
  }

  const hoverImage = (product.images?.[1] || product.hoverImage || displayImage) || PLACEHOLDER_IMAGE;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-6">
        <img 
          src={displayImage} 
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-700 ${isHovered ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}
          referrerPolicy="no-referrer"
        />
        <img 
          src={hoverImage} 
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isHovered ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`}
          referrerPolicy="no-referrer"
        />
        {product.isSale && (
          <div className="absolute top-4 left-4 bg-secondary text-white text-[10px] px-2 py-1 rounded font-bold">SALE</div>
        )}

        <div className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <button className="w-full h-12 bg-white text-on-surface font-bold rounded-xl shadow-xl hover:bg-primary hover:text-white transition-colors">
            Xem nhanh
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
            <Star size={12} fill="currentColor" className="text-zinc-300" />
            <span>{product.rating}</span>
          </div>
        </div>
        <p className="text-zinc-500 text-xs line-clamp-1 font-light italic">{product.shortDescription}</p>
        <div className="flex gap-1.5 pt-1">
          {product.colors.map((color, i) => (
            <span key={i} className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: color }}></span>
          ))}
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <p className="text-secondary font-headline font-extrabold text-lg">
            {product.price.toLocaleString('vi-VN')}đ
          </p>
          {product.originalPrice && (
            <p className="text-xs text-zinc-400 line-through">
              {product.originalPrice.toLocaleString('vi-VN')}đ
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Views ---

const ProductListView = ({ onProductClick, initialCategory }: { onProductClick: (p: Product) => void, initialCategory?: string }) => {
  const { products, loading: firebaseLoading } = useFirebase();
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Mới nhất');

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategories([initialCategory]);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (!firebaseLoading) {
      setLoading(false);
    }
  }, [firebaseLoading]);

  // Dynamic Color Extraction
  const dynamicColors = React.useMemo(() => {
    const colorCounts: Record<string, number> = {};
    products.forEach(p => {
      if (p.colors) {
        p.colors.forEach(c => {
          colorCounts[c] = (colorCounts[c] || 0) + 1;
        });
      }
    });
    return Object.entries(colorCounts).map(([hex, count]) => ({
      hex,
      count,
      name: COLOR_MAP[hex]?.name || 'Màu khác'
    })).sort((a, b) => b.count - a.count);
  }, [products]);

  // Filtered Products
  const filteredProducts = React.useMemo(() => {
    let result = [...products];

    // Category Filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    // Price Filter
    result = result.filter(p => p.price <= maxPrice);

    // Color Filter
    if (selectedColors.length > 0) {
      result = result.filter(p => p.colors && p.colors.some(c => selectedColors.includes(c)));
    }

    // Sort
    if (sortBy === 'Giá: Thấp đến Cao') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Giá: Cao đến Thấp') {
      result.sort((a, b) => b.price - a.price);
    } else {
      result.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [products, selectedCategories, maxPrice, selectedColors, sortBy]);

  const toggleCategory = (cat: string) => {
    if (cat === 'Tất cả sản phẩm') {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleColor = (hex: string) => {
    setSelectedColors(prev => 
      prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-8 pt-32 flex gap-12">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 h-fit sticky top-32 flex-col p-6 gap-8 bg-white shadow-sm rounded-xl border border-zinc-100">
        <div>
          <h2 className="text-lg font-bold text-brand font-headline uppercase tracking-wider mb-1">Bộ lọc</h2>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Tùy chỉnh tìm kiếm</p>
        </div>
        
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-brand font-headline uppercase tracking-tight flex items-center gap-2">
            <Filter size={14} /> Phân loại
          </h3>
          <div className="flex flex-col gap-3">
            {['Tất cả sản phẩm', 'Cốc giữ nhiệt', 'Cốc lót sứ', 'Bình giữ nhiệt', 'Bình nước'].map((cat) => (
              <label key={cat} className="flex items-center gap-3 text-sm text-zinc-600 hover:text-primary cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={cat === 'Tất cả sản phẩm' ? selectedCategories.length === 0 : selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="rounded border-zinc-300 text-primary focus:ring-primary" 
                />
                <span className={selectedCategories.includes(cat) || (cat === 'Tất cả sản phẩm' && selectedCategories.length === 0) ? 'text-primary font-bold' : ''}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-brand font-headline uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag size={14} /> Mức giá
            </h3>
            <span className="text-xs font-bold text-primary">{maxPrice.toLocaleString()}đ</span>
          </div>
          <input 
            type="range" 
            min="0"
            max="1000000"
            step="10000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-primary" 
          />
          <div className="flex justify-between text-[10px] font-medium text-zinc-500">
            <span>0đ</span>
            <span>1.000.000đ</span>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-brand font-headline uppercase tracking-tight flex items-center gap-2">
            <Palette size={14} /> Màu sắc
          </h3>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {dynamicColors.map((color) => (
              <button 
                key={color.hex} 
                onClick={() => toggleColor(color.hex)}
                className={`flex items-center justify-between p-2 rounded-xl transition-all border ${selectedColors.includes(color.hex) ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-container-low'}`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-full border border-zinc-200 shadow-sm" 
                    style={{ background: color.hex }}
                  />
                  <span className={`text-xs ${selectedColors.includes(color.hex) ? 'font-bold text-primary' : 'text-zinc-600'}`}>
                    {color.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-400">({color.count})</span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-brand font-headline tracking-tight">PiTi Store</h1>
            <p className="text-zinc-500 mt-2 font-light max-w-xl">PiTi Store - Bình & Cốc Giữ Nhiệt Cao Cấp. Gói giàu sự tinh tế trong từng sản phẩm.</p>
            { (selectedCategories.length > 0 || selectedColors.length > 0 || maxPrice < 1000000) && (
              <div className="flex flex-wrap gap-2 mt-4">
                <button 
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedColors([]);
                    setMaxPrice(1000000);
                  }}
                  className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                >
                  Xóa tất cả lọc
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium bg-surface-container-low px-4 py-2 rounded-lg">
            <span>Sắp xếp theo:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-brand font-bold cursor-pointer"
            >
              <option>Mới nhất</option>
              <option>Giá: Thấp đến Cao</option>
              <option>Giá: Cao đến Thấp</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-4">
                <div className="aspect-square bg-surface-container-low rounded-3xl" />
                <div className="h-4 bg-surface-container-low rounded w-3/4" />
                <div className="h-4 bg-surface-container-low rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center text-zinc-300 mb-4">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-brand">Không tìm thấy sản phẩm</h3>
            <p className="text-zinc-500 mt-2">Vui lòng thử điều chỉnh bộ lọc của bạn</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                filteredColor={selectedColors.length === 1 ? selectedColors[0] : undefined}
                onClick={() => onProductClick({
                  ...product,
                  initialColor: selectedColors.length === 1 ? selectedColors[0] : undefined
                } as any)} 
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="mt-20 flex justify-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-zinc-400 transition-all font-bold">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-zinc-400 transition-all font-bold">3</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-zinc-400 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetailView = ({ product, onBack, onCheckout }: { product: Product & { initialColor?: string }, onBack: () => void, onCheckout: () => void }) => {
  const { user, products, addToCart, addToast } = useFirebase();
  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || product.image);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product.initialColor || product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewPhoto, setReviewPhoto] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y });
  };

  const productImages = product.images && product.images.length > 0 ? product.images : [product.image, product.hoverImage];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    
    // Tìm index ảnh tương ứng
    const imageIndex = product.colorImageMap?.[color];
    if (imageIndex !== undefined) {
      const targetIndex = imageIndex - 1; // Chuyển từ 1-based sang 0-based
      
      // Cập nhật ảnh chính trên desktop
      if (productImages[targetIndex]) {
        setSelectedImage(productImages[targetIndex]);
      }
      
      // Cuộn carousel trên mobile
      if (carouselRef.current) {
        const width = carouselRef.current.offsetWidth;
        carouselRef.current.scrollTo({
          left: targetIndex * width,
          behavior: 'smooth'
        });
      }

      // Cuộn danh sách ảnh nhỏ trên desktop
      if (thumbnailsRef.current) {
        const thumbElement = thumbnailsRef.current.children[targetIndex] as HTMLElement;
        if (thumbElement) {
          thumbnailsRef.current.scrollTo({
            top: thumbElement.offsetTop - thumbnailsRef.current.offsetTop,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  useEffect(() => {
    if (product.initialColor) {
      setSelectedColor(product.initialColor);
      const imageIndex = product.colorImageMap?.[product.initialColor];
      if (imageIndex !== undefined) {
        const targetIndex = imageIndex - 1;
        if (productImages[targetIndex]) {
          setSelectedImage(productImages[targetIndex]);
        }
      }
    } else {
      setSelectedImage(product.images?.[0] || product.image);
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(revs.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reviews'));

    return () => unsubscribe();
  }, [product.id]);

  const handleAddToCart = async () => {
    await addToCart(product, quantity, selectedColor, selectedSize);
  };

  const handleBuyNow = async () => {
    await addToCart(product, quantity, selectedColor, selectedSize);
    onCheckout();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      addToast('Vui lòng đăng nhập để đánh giá sản phẩm', 'info');
      return;
    }
    if (!newReview.comment.trim()) return;

    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        uid: user.uid,
        authorName: user.displayName || user.email?.split('@')[0],
        rating: newReview.rating,
        comment: newReview.comment,
        photo: reviewPhoto,
        createdAt: serverTimestamp()
      });
      setNewReview({ rating: 5, comment: '' });
      setReviewPhoto(null);
      addToast('Cảm ơn bạn đã đánh giá sản phẩm!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 pt-32">
      {/* Breadcrumb */}
      <nav className="mb-12 text-sm text-zinc-500 flex items-center gap-2">
        <button onClick={onBack} className="hover:text-primary transition-colors">Trang chủ</button>
        <ChevronRight size={14} />
        <span className="hover:text-primary transition-colors cursor-pointer">{product.category}</span>
        <ChevronRight size={14} />
        <span className="font-medium text-on-surface">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left: Gallery & Highlights */}
        <div className="lg:col-span-7 flex flex-col gap-12">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Desktop Thumbnails */}
            <div 
              ref={thumbnailsRef}
              className="hidden md:flex flex-col gap-4 w-24 shrink-0 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 scroll-smooth"
            >
              {productImages.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedImage(img || PLACEHOLDER_IMAGE)}
                  onMouseEnter={() => setSelectedImage(img || PLACEHOLDER_IMAGE)}
                  className={`rounded-xl overflow-hidden aspect-square p-1 bg-surface-container-low transition-all border-2 ${selectedImage === (img || PLACEHOLDER_IMAGE) ? 'border-[#00A896] shadow-md scale-105' : 'border-transparent hover:border-[#00A896]/50'}`}
                  style={{ aspectRatio: '1/1', minHeight: '88px' }}
                >
                  <img 
                    src={img || PLACEHOLDER_IMAGE} 
                    alt="" 
                    className="w-full h-full object-cover rounded-lg" 
                    referrerPolicy="no-referrer" 
                  />
                </button>
              ))}
            </div>

            {/* Main Image / Mobile Carousel */}
            <div className="flex-1 relative">
              {/* Desktop Main Image with Zoom */}
              <div 
                className="hidden md:block relative rounded-[40px] overflow-hidden bg-surface-container-low aspect-square group cursor-zoom-in border border-zinc-100"
                style={{ aspectRatio: '1/1' }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
              >
                <img 
                  src={selectedImage || product.image || PLACEHOLDER_IMAGE} 
                  alt={product.name} 
                  className={`w-full h-full object-cover transition-transform duration-300 ${isZooming ? 'scale-150' : 'scale-100'}`}
                  style={{ 
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                  }}
                  referrerPolicy="no-referrer" 
                />
              </div>

              {/* Mobile Carousel */}
              <div className="md:hidden relative">
                <div 
                  ref={carouselRef}
                  className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-3xl aspect-square"
                  style={{ aspectRatio: '1/1' }}
                  onScroll={(e) => {
                    const scrollLeft = e.currentTarget.scrollLeft;
                    const width = e.currentTarget.offsetWidth;
                    setCurrentSlide(Math.round(scrollLeft / width));
                  }}
                >
                  {productImages.map((img, i) => (
                    <div key={i} className="w-full h-full shrink-0 snap-center">
                      <img 
                        src={img || PLACEHOLDER_IMAGE} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Pagination Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {productImages.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-6 bg-[#00A896]' : 'w-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Highlights Section (Moved here) */}
          <div className="bg-white rounded-[40px] border border-zinc-100 p-10 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-headline font-bold inline-block relative">
                Đặc điểm nổi bật
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#00A896]/30 rounded-full" />
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-brand flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center text-xs">1</span>
                  Thông tin sản phẩm
                </h3>
                <ul className="space-y-3 text-zinc-500 text-xs leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Dung tích: 500ml / 750ml / 1000ml phù hợp mọi nhu cầu.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Chất liệu: Thép không gỉ Inox 304 cao cấp, an toàn tuyệt đối.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Cấu tạo: 2 lớp hút chân không giúp giữ nhiệt vượt trội.
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-brand flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center text-xs">2</span>
                  Tính năng nổi bật
                </h3>
                <ul className="space-y-3 text-zinc-500 text-xs leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Giữ nóng lên đến 12h, giữ lạnh lên đến 24h liên tục.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Nắp chống tràn 100%, thoải mái mang đi mọi nơi.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Sơn tĩnh điện cao cấp, chống trầy xước và bám vân tay.
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-brand flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center text-xs">3</span>
                  Dịch vụ & Bảo hành
                </h3>
                <ul className="space-y-3 text-zinc-500 text-xs leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Bảo hành 1 đổi 1 trong vòng 3 tháng nếu có lỗi NSX.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Kiểm tra hàng thoải mái trước khi thanh toán.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand font-bold">•</span>
                    Hỗ trợ khắc tên, in logo theo yêu cầu riêng.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-surface-container-low text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-zinc-100">
                {product.category}
              </span>
              <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Còn hàng
              </span>
            </div>
            <h1 className="text-4xl font-headline font-bold text-brand leading-tight tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex text-[#E2583E]">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={16} fill={i <= Math.floor(product.rating) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-sm text-zinc-400 font-bold">({product.reviews + reviews.length})</span>
              </div>
              <div className="h-4 w-px bg-zinc-200" />
              <span className="text-sm text-zinc-400 font-bold uppercase tracking-widest">Đã bán: <span className="text-zinc-800">1.2k+</span></span>
            </div>
          </div>

          <div className="mb-10 p-8 bg-surface-container-low rounded-3xl border border-zinc-100/50">
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-headline font-black text-[#8B0000]">{product.price.toLocaleString('vi-VN')}đ</span>
              {product.originalPrice && (
                <span className="text-xl text-zinc-400 line-through font-medium opacity-60">{product.originalPrice.toLocaleString('vi-VN')}đ</span>
              )}
            </div>
          </div>

          <div className="mb-10 space-y-6">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 block">Màu sắc: <span className="text-zinc-800 ml-2">{selectedColor.startsWith('#') ? 'Mặc định' : selectedColor}</span></span>
              <div className="flex flex-wrap gap-4">
                {product.colors.map((color, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleColorSelect(color)}
                    className={`w-12 h-12 rounded-full transition-all hover:scale-110 shadow-sm border-2 ${selectedColor === color ? 'border-primary ring-4 ring-primary/10' : 'border-white'}`}
                    style={{ backgroundColor: color.startsWith('#') ? color : '#e4e2e1' }}
                    title={color}
                  ></button>
                ))}
              </div>
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 block">Dung tích: <span className="text-zinc-800 ml-2">{selectedSize}</span></span>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedSize(size)}
                      className={`px-8 py-3 rounded-2xl text-sm font-black transition-all border-2 ${selectedSize === size ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-zinc-100 text-zinc-500 hover:border-zinc-200'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center bg-surface-container-high rounded-2xl p-1 h-14 w-40 shadow-inner">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-full flex items-center justify-center text-zinc-400 hover:text-primary transition-colors"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span className="flex-1 text-center font-headline font-black text-lg">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-full flex items-center justify-center text-zinc-400 hover:text-primary transition-colors"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleAddToCart}
                className="h-16 bg-surface-container-high text-brand rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-brand/10 transition-all flex items-center justify-center gap-3 border-2 border-transparent hover:border-brand/20"
              >
                <ShoppingBag size={20} /> Thêm vào giỏ
              </button>
              <button 
                onClick={handleBuyNow}
                className="h-16 bg-[#00A896] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#00A896]/20 active:scale-95"
              >
                Mua ngay
              </button>
            </div>

            {/* Trust Badges Block */}
            <div className="mt-8 bg-surface-container-low rounded-2xl p-6 border border-zinc-100 space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E2583E] shadow-sm group-hover:scale-110 transition-transform">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Đường dây nóng</p>
                  <p className="text-sm font-bold text-on-surface">
                    <a href="tel:0333401882" className="text-[#E2583E] hover:underline">0333401882</a>
                    <span className="text-zinc-400 font-normal ml-2">(Hỗ trợ 8h30 - 21h mỗi ngày)</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E2583E] shadow-sm group-hover:scale-110 transition-transform">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Vận chuyển</p>
                  <p className="text-sm font-bold text-on-surface">Vận chuyển toàn quốc từ 2 đến 5 ngày</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E2583E] shadow-sm group-hover:scale-110 transition-transform">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Bảo hành</p>
                  <p className="text-sm font-bold text-on-surface">Bảo hành 1:1 trong vòng 3 tháng</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E2583E] shadow-sm group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Kiểm tra hàng</p>
                  <p className="text-sm font-bold text-on-surface">Được kiểm tra hàng trước khi thanh toán COD</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 py-8 border-t border-zinc-100">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="text-primary" size={28} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Miễn phí giao hàng</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <ShieldCheck className="text-primary" size={28} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{product.warrantyNote || 'Bảo hành 12 tháng'}</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Leaf className="text-primary" size={28} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Bền vững & hữu cơ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description Section */}
      <div className="mt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-headline font-bold inline-block relative">
            Mô tả chi tiết
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#00A896]/30 rounded-full" />
          </h2>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-zinc-100 shadow-sm">
          <div 
            className="text-zinc-600 leading-relaxed prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8 pb-20">
        <div className="mb-8">
          <h2 className="text-2xl font-headline font-bold inline-block relative">
            Đánh giá sản phẩm
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#00A896]/30 rounded-full" />
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5">
            <div className="bg-[#F0F9F9] p-10 rounded-[40px] border border-[#00A896]/10 sticky top-32">
              <h3 className="text-xl font-black text-brand mb-2">Hãy là người đầu tiên nhận xét</h3>
              <p className="text-zinc-500 text-sm mb-8">Email của bạn sẽ không được hiển thị công khai. Các trường bắt buộc được đánh dấu *</p>
              
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Đánh giá của bạn *</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`transition-all ${star <= newReview.rating ? 'text-[#E2583E] scale-110' : 'text-zinc-300'}`}
                      >
                        <Star size={28} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <input 
                      type="text"
                      placeholder="Tên của bạn *"
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-zinc-100 bg-white focus:ring-2 focus:ring-[#00A896]/20 outline-none text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="email"
                      placeholder="Email của bạn *"
                      required
                      className="w-full px-5 py-4 rounded-2xl border border-zinc-100 bg-white focus:ring-2 focus:ring-[#00A896]/20 outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <textarea 
                  value={newReview.comment}
                  onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Nhận xét của bạn *"
                  required
                  className="w-full p-5 rounded-2xl border border-zinc-100 bg-white focus:ring-2 focus:ring-[#00A896]/20 outline-none h-40 resize-none text-sm transition-all"
                />
                
                <div className="space-y-4">
                  <label className="block">
                    <div className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-[#00A896] transition-all cursor-pointer group bg-white/50">
                      <Upload size={20} className="text-zinc-400 group-hover:text-[#00A896]" />
                      <span className="text-xs font-bold text-zinc-500 group-hover:text-[#00A896]">Đính kèm ảnh thực tế</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </div>
                  </label>
                  {reviewPhoto && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden group shadow-md">
                      <img src={reviewPhoto} alt="Review" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setReviewPhoto(null)}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full py-5 bg-[#00A896] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#00A896]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Đang gửi...' : 'Gửi đi'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            {reviews.length === 0 ? (
              <div className="bg-surface-container-low rounded-[40px] p-20 text-center text-zinc-400 border-2 border-dashed border-zinc-100">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Star size={32} className="text-zinc-200" />
                </div>
                <p className="font-bold text-zinc-500">Chưa có đánh giá nào cho sản phẩm này.</p>
                <p className="text-sm">Hãy là người đầu tiên chia sẻ cảm nhận của bạn!</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="bg-white p-10 rounded-[40px] border border-zinc-100 shadow-sm flex gap-8 group hover:shadow-md transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-brand font-black text-xl shrink-0 shadow-inner">
                    {review.authorName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-brand text-lg">{review.authorName}</h4>
                        <div className="flex text-[#E2583E] mt-1 gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] bg-surface-container-low px-3 py-1 rounded-full">
                        {review.createdAt?.toDate().toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-zinc-600 leading-relaxed">{review.comment}</p>
                    {(review as any).photo && (
                      <div className="pt-4">
                        <img src={(review as any).photo} alt="Review" className="w-48 h-48 object-cover rounded-[32px] shadow-sm hover:scale-105 transition-transform cursor-zoom-in" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-2 block">Gợi ý cho bạn</span>
            <h2 className="text-3xl font-headline font-bold">Sản phẩm có thể bạn thích</h2>
          </div>
          <div className="flex gap-2">
            <button className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <ArrowLeft size={20} />
            </button>
            <button className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-surface-container-low transition-colors">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {(products.length > 0 ? products : PRODUCTS).slice(1, 5).map(p => (
            <ProductCard key={p.id} product={p} onClick={() => {}} />
          ))}
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-zinc-100 p-4 flex gap-4 items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{product.name}</p>
          <p className="text-lg font-black text-secondary">{product.price.toLocaleString('vi-VN')}đ</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAddToCart}
            className="w-12 h-12 bg-surface-container-low text-brand rounded-xl flex items-center justify-center hover:bg-brand/10 transition-all"
          >
            <ShoppingBag size={20} />
          </button>
          <button 
            onClick={handleBuyNow}
            className="px-6 h-12 bg-[#E2583E] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#E2583E]/20 active:scale-95 transition-all"
          >
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    // Load cart from localStorage for guests
    const savedCart = localStorage.getItem('piti_cart');
    if (savedCart && !user) {
      setCart(JSON.parse(savedCart));
    }

    let cartUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (cartUnsubscribe) {
        cartUnsubscribe();
        cartUnsubscribe = null;
      }

      setUser(u);
      if (u) {
        const userDoc = doc(db, 'users', u.uid);
        try {
          const userSnap = await getDoc(userDoc);
          
          if (!userSnap.exists()) {
            const isDefaultAdmin = u.email === 'quyquyquyet1999@gmail.com';
            const newUser = {
              uid: u.uid,
              displayName: u.displayName,
              email: u.email,
              photoURL: u.photoURL,
              role: isDefaultAdmin ? 'admin' : 'client',
              createdAt: serverTimestamp()
            };
            await setDoc(userDoc, newUser);
            setRole(newUser.role);
          } else {
            const userData = userSnap.data();
            const isDefaultAdmin = u.email === 'quyquyquyet1999@gmail.com';
            const currentRole = isDefaultAdmin ? 'admin' : (userData?.role || 'client');
            setRole(currentRole);
            
            await updateDoc(userDoc, {
              displayName: u.displayName,
              email: u.email,
              photoURL: u.photoURL,
              ...(isDefaultAdmin && userData?.role !== 'admin' ? { role: 'admin' } : {})
            });
          }

          // Merge local cart to firestore on login
          const localCart = JSON.parse(localStorage.getItem('piti_cart') || '[]');
          if (localCart.length > 0) {
            const cartRef = collection(db, 'users', u.uid, 'cart');
            const currentCartSnap = await getDocs(cartRef);
            const currentCartItems = currentCartSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem));

            for (const item of localCart) {
              const existingItem = currentCartItems.find(i => i.productId === item.productId && i.color === item.color);
              if (!existingItem) {
                await addDoc(cartRef, { ...item, addedAt: serverTimestamp() });
              } else {
                const docRef = doc(db, 'users', u.uid, 'cart', existingItem.id);
                await updateDoc(docRef, { quantity: existingItem.quantity + item.quantity });
              }
            }
            localStorage.removeItem('piti_cart');
          }

          const cartRef = collection(db, 'users', u.uid, 'cart');
          cartUnsubscribe = onSnapshot(cartRef, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem));
            setCart(items);
          }, (error) => {
            if (auth.currentUser?.uid === u.uid) {
              handleFirestoreError(error, OperationType.LIST, `users/${u.uid}/cart`);
            }
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setRole(null);
        const saved = localStorage.getItem('piti_cart');
        setCart(saved ? JSON.parse(saved) : []);
      }
      setLoading(false);
    });

    // Load products globally with caching
    const cachedProducts = localStorage.getItem('piti_products_cache');
    if (cachedProducts) {
      try {
        setProducts(JSON.parse(cachedProducts));
      } catch (e) {
        console.error('Lỗi parse cache sản phẩm:', e);
      }
    }

    const productsQuery = query(collection(db, 'products'), where('status', '==', 'active'));
    const productsUnsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      if (prods.length > 0) {
        setProducts(prods);
        localStorage.setItem('piti_products_cache', JSON.stringify(prods));
      } else if (snapshot.metadata.fromCache === false) {
        // Only set to empty if we are sure the server has no products
        setProducts([]);
      }
    }, (error) => {
      console.error('Lỗi lấy sản phẩm:', error);
      if (error.message.includes('Quota exceeded')) {
        addToast('Hệ thống đang quá tải (hết hạn mức miễn phí). Đang hiển thị dữ liệu tạm thời.', 'info');
      }
      // If we have cached products, we already set them above. 
      // If not, fallback to static PRODUCTS.
      if (!localStorage.getItem('piti_products_cache')) {
        setProducts(PRODUCTS);
      }
    });

    return () => {
      unsubscribe();
      productsUnsubscribe();
      if (cartUnsubscribe) cartUnsubscribe();
    };
  }, []);

  // Sync guest cart to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('piti_cart', JSON.stringify(cart));
    }
  }, [cart, user]);

  const addToCart = async (product: Product, quantity: number, color: string, size?: string) => {
    if (user) {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const q = query(cartRef, where('productId', '==', product.id), where('color', '==', color), where('size', '==', size || ''));
      const snap = await getDocs(q);
      
      try {
        if (snap.empty) {
          await addDoc(cartRef, {
            productId: product.id,
            quantity,
            color,
            size: size || '',
            addedAt: serverTimestamp()
          });
        } else {
          const docRef = doc(db, 'users', user.uid, 'cart', snap.docs[0].id);
          await updateDoc(docRef, { quantity: snap.docs[0].data().quantity + quantity });
        }
        addToast(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/cart`);
      }
    } else {
      setCart(prev => {
        const existing = prev.find(item => item.productId === product.id && item.color === color && item.size === (size || ''));
        if (existing) {
          return prev.map(item => item === existing ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return [...prev, { id: Math.random().toString(36).substring(7), productId: product.id, quantity, color, size: size || '' }];
      });
      addToast(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', itemId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/cart/${itemId}`);
      }
    } else {
      setCart(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const updateCartQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'cart', itemId), { quantity });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/cart/${itemId}`);
      }
    } else {
      setCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item));
    }
  };

  const clearCart = async () => {
    if (user) {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const snap = await getDocs(cartRef);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', d.id));
      }
    } else {
      setCart([]);
      localStorage.removeItem('piti_cart');
    }
  };

  const createOrder = async (orderData: any) => {
    const orderRef = collection(db, 'orders');
    const docRef = await addDoc(orderRef, {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  };

  const value = {
    user,
    role,
    loading,
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    createOrder,
    addToast
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </FirebaseContext.Provider>
  );
}

// --- Admin Components ---

const SortableImage = ({ url, index, onRemove }: { url: string, index: number, onRemove: (index: number) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group aspect-square rounded-2xl overflow-hidden bg-surface-container-low border border-zinc-100 ${isDragging ? 'opacity-50 shadow-2xl' : 'opacity-100'}`}
    >
      <div {...attributes} {...listeners} className="w-full h-full cursor-grab active:cursor-grabbing">
        <img src={url || PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <button 
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md text-red-500 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-20"
      >
        <X size={16} />
      </button>
      {index === 0 && (
        <div className="absolute top-2 left-2 bg-brand text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase pointer-events-none">Ảnh chính</div>
      )}
    </div>
  );
};

const ProductEditModal = ({ product, onClose, onSave }: { product: Product | null, onClose: () => void, onSave: () => void }) => {
  const { addToast, user } = useFirebase();
  const { register, handleSubmit, control, watch, setValue, reset } = useForm<Partial<Product>>({
    defaultValues: product || {
      name: '',
      sku: '',
      price: 0,
      originalPrice: 0,
      description: '',
      shortDescription: '',
      category: 'Cốc giữ nhiệt',
      images: [],
      colors: [],
      colorImageMap: {},
      sizes: [],
      status: 'active',
      isSale: false,
      rating: 5,
      reviews: 0
    }
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showColorInput, setShowColorInput] = useState(false);
  const [newColor, setNewColor] = useState('');
  const [newColorImageIndex, setNewColorImageIndex] = useState<string>('');
  const [showSizeInput, setShowSizeInput] = useState(false);
  const [newSize, setNewSize] = useState('');

  const images = watch('images') || [];
  const colors = watch('colors') || [];
  const colorImageMap = watch('colorImageMap') || {};
  const sizes = watch('sizes') || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      
      const newImages = arrayMove(images, oldIndex, newIndex);
      setValue('images', newImages, { shouldDirty: true });
    }
  };

  useEffect(() => {
    if (product) reset(product);
    else reset({
      name: '',
      sku: '',
      price: 0,
      originalPrice: 0,
      description: '',
      shortDescription: '',
      category: 'Cốc giữ nhiệt',
      images: [],
      colors: [],
      colorImageMap: {},
      sizes: [],
      status: 'active',
      isSale: false,
      rating: 5,
      reviews: 0
    });
  }, [product, reset]);

  // Xử lý khi kéo thả ảnh vào khu vực tải lên
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    if (!user) {
      addToast('Vui lòng đăng nhập để tải ảnh lên', 'error');
      return;
    }

    // Kiểm tra định dạng và dung lượng
    const validFiles = acceptedFiles.filter(file => {
      const isValidFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidFormat) addToast(`File ${file.name} không đúng định dạng (JPG, PNG, WEBP)`, 'error');
      if (!isValidSize) addToast(`File ${file.name} quá lớn (Tối đa 5MB)`, 'error');

      return isValidFormat && isValidSize;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(5); // Bắt đầu ở 5% để người dùng thấy có hoạt động

    try {
      const urls: string[] = [];
      
      // Xử lý song song các file để nhanh hơn
      const uploadPromises = validFiles.map(async (file, index) => {
        const storageRef = ref(storage, `products/${Date.now()}_${index}_${file.name}`);
        
        // Tạo một promise timeout sau 8 giây
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );

        try {
          console.log(`Đang thử tải lên Storage: ${file.name}`);
          // Chạy đua giữa việc tải lên và timeout
          const result = await Promise.race([
            uploadBytes(storageRef, file),
            timeout
          ]) as any;
          
          const url = await getDownloadURL(result.ref);
          console.log(`Tải lên Storage thành công: ${url}`);
          return url;
        } catch (err) {
          console.warn(`Storage thất bại cho ${file.name}, chuyển sang Base64 nén:`, err);
          // Fallback sang Base64 có nén/resize nếu Storage lỗi hoặc quá chậm
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Giới hạn kích thước tối đa 800px để tiết kiệm dung lượng Firestore
                const MAX_SIZE = 800;
                if (width > height) {
                  if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                  }
                } else {
                  if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                  }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Nén chất lượng xuống 0.7 để giảm dung lượng
                resolve(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
          });
        }
      });

      const results = await Promise.all(uploadPromises);
      setUploadProgress(100);

      const currentImages = watch('images') || [];
      setValue('images', [...currentImages, ...results], { shouldDirty: true });
      addToast(`Đã xử lý ${results.length} ảnh thành công`, 'success');
      
      // Kiểm tra nếu có ảnh Base64 (ảnh dung lượng lớn)
      const hasBase64 = results.some(url => url.startsWith('data:'));
      if (hasBase64) {
        addToast('Lưu ý: Một số ảnh được lưu dưới dạng dữ liệu trực tiếp. Hãy hạn chế số lượng ảnh để tránh lỗi lưu trữ!', 'info');
      }
    } catch (error) {
      console.error('Lỗi xử lý ảnh:', error);
      addToast('Không thể xử lý ảnh. Vui lòng thử lại.', 'error');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  // Xóa ảnh khỏi danh sách
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setValue('images', newImages);
  };

  // Thêm biến thể màu sắc
  const handleAddColor = () => {
    if (newColor) {
      const updatedColors = [...colors, newColor];
      setValue('colors', updatedColors);
      
      if (newColorImageIndex !== '') {
        const index = parseInt(newColorImageIndex);
        if (!isNaN(index)) {
          setValue('colorImageMap', {
            ...colorImageMap,
            [newColor]: index
          });
        }
      }
      
      setNewColor('');
      setNewColorImageIndex('');
      setShowColorInput(false);
    }
  };

  const removeColor = (index: number) => {
    const colorToRemove = colors[index];
    const updatedColors = colors.filter((_, i) => i !== index);
    setValue('colors', updatedColors);
    
    const updatedMap = { ...colorImageMap };
    delete updatedMap[colorToRemove];
    setValue('colorImageMap', updatedMap);
  };

  // Thêm biến thể dung tích/kích thước
  const handleAddSize = () => {
    if (newSize) {
      setValue('sizes', [...sizes, newSize]);
      setNewSize('');
      setShowSizeInput(false);
    }
  };

  // Hàm xử lý khi lưu sản phẩm
  const onSubmit = async (data: Partial<Product>) => {
    console.log('Bắt đầu lưu sản phẩm. Dữ liệu form:', data);
    if (!data.name || data.price === undefined || data.price === null) {
      addToast('Vui lòng nhập tên và giá sản phẩm!', 'error');
      console.warn('Thiếu tên hoặc giá sản phẩm', { name: data.name, price: data.price });
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        ...data,
        image: data.images?.[0] || '', // Lấy ảnh đầu tiên làm ảnh đại diện
        hoverImage: data.images?.[1] || data.images?.[0] || '', // Lấy ảnh thứ 2 làm ảnh hover
        updatedAt: serverTimestamp()
      };
      
      // Kiểm tra kích thước dữ liệu (Firestore giới hạn 1MB mỗi document)
      const dataSize = JSON.stringify(productData).length;
      console.log('Ước tính kích thước dữ liệu:', dataSize, 'bytes');
      
      if (dataSize > 1000000) {
        addToast('Dữ liệu sản phẩm quá lớn (vượt quá 1MB). Vui lòng giảm bớt số lượng ảnh hoặc dung lượng ảnh!', 'error');
        setIsSaving(false);
        return;
      }
      
      console.log('Dữ liệu chuẩn bị gửi lên Firestore:', productData);

      if (product?.id) {
        // Cập nhật sản phẩm hiện có
        console.log('Đang cập nhật sản phẩm ID:', product.id);
        await updateDoc(doc(db, 'products', product.id), productData);
        addToast('Cập nhật sản phẩm thành công!', 'success');
      } else {
        // Thêm sản phẩm mới
        console.log('Đang thêm sản phẩm mới');
        await addDoc(collection(db, 'products'), {
          ...productData,
          rating: 5,
          reviews: 0,
          createdAt: serverTimestamp()
        });
        addToast('Thêm sản phẩm mới thành công!', 'success');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Lỗi khi lưu sản phẩm:', error);
      handleFirestoreError(error, OperationType.WRITE, 'products');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-headline font-bold text-brand">
              {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">PiTi Store Admin Panel</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-brand transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error('Lỗi validation form:', errors);
          addToast('Vui lòng kiểm tra lại các trường thông tin!', 'error');
        })} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Media */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-brand uppercase tracking-tight flex items-center gap-2">
                  <ImageIcon size={16} /> Hình ảnh sản phẩm
                </label>
                
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-primary hover:bg-surface-container-low'}`}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-primary">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-on-surface">Kéo thả hoặc nhấn để tải ảnh</p>
                    <p className="text-xs text-zinc-500 mt-1">Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)</p>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-brand uppercase tracking-widest">
                      <span>Đang tải ảnh lên...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-brand"
                      />
                    </div>
                  </div>
                )}

                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={images}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      {images.map((url, index) => (
                        <SortableImage 
                          key={url} 
                          url={url} 
                          index={index} 
                          onRemove={removeImage} 
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-brand uppercase tracking-tight flex items-center gap-2">
                  <Palette size={16} /> Biến thể màu sắc
                </label>
                <div className="flex flex-wrap gap-4">
                  {colors.map((color, i) => (
                    <div key={i} className="group relative flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                      {colorImageMap[color] !== undefined && (
                        <span className="text-[10px] font-bold text-zinc-500">Ảnh {colorImageMap[color]}</span>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeColor(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  
                  {showColorInput ? (
                    <div className="flex flex-col gap-2 bg-surface-container-low p-3 rounded-2xl border border-brand/20">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder="#HEX hoặc tên"
                          className="w-32 px-3 py-2 text-xs bg-white rounded-lg border border-zinc-200 outline-none focus:border-brand"
                          autoFocus
                        />
                        <input 
                          type="number"
                          value={newColorImageIndex}
                          onChange={(e) => setNewColorImageIndex(e.target.value)}
                          placeholder="Số ảnh"
                          className="w-20 px-3 py-2 text-xs bg-white rounded-lg border border-zinc-200 outline-none focus:border-brand"
                          min="1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          type="button"
                          onClick={() => setShowColorInput(false)}
                          className="px-3 py-1 bg-zinc-200 text-zinc-500 rounded-lg text-[10px] font-bold uppercase"
                        >
                          Hủy
                        </button>
                        <button 
                          type="button"
                          onClick={handleAddColor}
                          className="px-3 py-1 bg-brand text-white rounded-lg text-[10px] font-bold uppercase"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowColorInput(true)}
                      className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 hover:border-brand hover:text-brand transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-brand uppercase tracking-tight flex items-center gap-2">
                  <Layers size={16} /> Dung tích / Kích thước
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size, i) => (
                    <div key={i} className="px-4 py-2 bg-surface-container-low rounded-xl text-sm font-medium border border-zinc-100 flex items-center gap-2 group">
                      {size}
                      <button 
                        type="button"
                        onClick={() => setValue('sizes', sizes.filter((_, idx) => idx !== i))}
                        className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {showSizeInput ? (
                    <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-brand/20">
                      <input 
                        type="text"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        placeholder="Ví dụ: 500ml"
                        className="w-24 px-3 py-1 text-xs bg-transparent outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                      />
                      <button 
                        type="button"
                        onClick={handleAddSize}
                        className="px-3 py-1 bg-brand text-white rounded-lg text-xs font-bold"
                      >
                        Thêm
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowSizeInput(false)}
                        className="p-1 text-zinc-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowSizeInput(true)}
                      className="px-4 py-2 border-2 border-dashed border-zinc-300 rounded-xl text-sm font-medium text-zinc-400 hover:border-brand hover:text-brand transition-all flex items-center gap-2"
                    >
                      <Plus size={16} /> Thêm
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tên sản phẩm</label>
                  <input 
                    {...register('name', { required: true })}
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="Ví dụ: Bình Giữ Nhiệt PiTi Classic"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">SKU</label>
                  <input 
                    {...register('sku')}
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="Ví dụ: PITI-CLASSIC-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Giá bán (VNĐ)</label>
                  <input 
                    type="number"
                    {...register('price', { required: true, valueAsNumber: true })}
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all font-bold text-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Giá gốc (VNĐ)</label>
                  <input 
                    type="number"
                    {...register('originalPrice', { valueAsNumber: true })}
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Danh mục</label>
                  <select 
                    {...register('category')}
                    className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all bg-white"
                  >
                    <option value="Cốc giữ nhiệt">Cốc giữ nhiệt</option>
                    <option value="Cốc lót sứ">Cốc lót sứ</option>
                    <option value="Bình giữ nhiệt">Bình giữ nhiệt</option>
                    <option value="Bình nước">Bình nước</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Trạng thái</label>
                  <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-zinc-100">
                    <span className={`text-sm font-bold ${watch('status') === 'active' ? 'text-green-600' : 'text-zinc-400'}`}>
                      {watch('status') === 'active' ? 'Đang bán' : 'Ngừng bán'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setValue('status', watch('status') === 'active' ? 'inactive' : 'active')}
                      className={`relative w-12 h-6 rounded-full transition-colors ${watch('status') === 'active' ? 'bg-green-500' : 'bg-zinc-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${watch('status') === 'active' ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mô tả ngắn</label>
                <textarea 
                  {...register('shortDescription')}
                  className="w-full p-4 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all min-h-[80px]"
                  placeholder="Tóm tắt đặc điểm nổi bật..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mô tả chi tiết</label>
                <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white">
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <ReactQuill 
                        theme="snow" 
                        value={field.value} 
                        onChange={field.onChange}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ],
                        }}
                        className="h-64 mb-12"
                        placeholder="Nhập mô tả chi tiết sản phẩm..."
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-100 flex justify-end gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-surface-container-low transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={isSaving || uploading}
              className="px-12 py-4 bg-brand text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-brand/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={20} /> Lưu sản phẩm
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AdminView = () => {
  const { role, user, addToast } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    console.log('AdminView useEffect triggered', { role, email: user?.email, emailVerified: user?.emailVerified });
    if (role !== 'admin' || user?.email !== 'quyquyquyet1999@gmail.com') {
      setLoading(false);
      return;
    }
    
    if (user && !user.emailVerified) {
      addToast('Vui lòng xác thực email của bạn để có quyền chỉnh sửa dữ liệu!', 'error');
    }
    setLoading(true);
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('AdminView snapshot received:', snapshot.size, 'products');
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      console.error('AdminView snapshot error:', error);
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role, user?.email]);

  const handleRefresh = () => {
    setLoading(true);
    // The onSnapshot will handle the update, but we can force a re-render or just show loading
    setTimeout(() => setLoading(false), 500);
  };

  // Hàm nhập sản phẩm mẫu từ constants.ts
  const handleSyncInitialProducts = async () => {
    setIsSyncing(true);
    let addedCount = 0;
    let skippedCount = 0;
    try {
      console.log('Bắt đầu đồng bộ', PRODUCTS.length, 'sản phẩm mẫu');
      
      // Fetch all existing products once to check in memory
      const existingSnap = await getDocs(collection(db, 'products'));
      const existingNames = new Set(existingSnap.docs.map(doc => doc.data().name));

      for (const p of PRODUCTS) {
        if (!existingNames.has(p.name)) {
          const { id, ...prodData } = p;
          const images = p.images && p.images.length > 0 ? p.images : [p.image, p.hoverImage].filter(Boolean);
          
          await addDoc(collection(db, 'products'), {
            ...prodData,
            images,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          addedCount++;
        } else {
          skippedCount++;
        }
      }
      addToast(`Đã nhập thành công ${addedCount} sản phẩm mẫu. Bỏ qua ${skippedCount} sản phẩm đã tồn tại.`, 'success');
      handleRefresh();
    } catch (error) {
      console.error('Lỗi khi nhập sản phẩm mẫu:', error);
      handleFirestoreError(error, OperationType.CREATE, 'products');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      addToast('Đã xóa sản phẩm thành công', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const toggleStatus = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        status: product.status === 'active' ? 'inactive' : 'active'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  if (role !== 'admin' || user?.email !== 'quyquyquyet1999@gmail.com') {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-40 pb-20 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">Truy cập bị từ chối</h2>
        <p className="text-zinc-500">Bạn không có quyền truy cập vào trang quản trị này.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 pt-32 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-headline font-extrabold text-brand">Quản trị sản phẩm</h1>
          <p className="text-zinc-500 mt-1">Quản lý kho hàng và thông tin chi tiết sản phẩm PiTi Store</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleRefresh}
            className="p-4 bg-surface-container-high text-brand rounded-2xl font-bold hover:bg-surface-container-low transition-all"
            title="Làm mới"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleSyncInitialProducts}
            disabled={isSyncing}
            className="flex items-center gap-2 px-6 py-4 bg-surface-container-high text-brand rounded-2xl font-bold hover:bg-surface-container-low transition-all disabled:opacity-50"
          >
            {isSyncing ? 'Đang nhập...' : 'Nhập sản phẩm mẫu'}
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-brand text-white rounded-2xl font-bold shadow-xl shadow-brand/20 hover:scale-105 transition-all"
          >
            <PlusCircle size={20} /> Thêm sản phẩm mới
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium">Đang tải danh sách sản phẩm...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-zinc-100">
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-zinc-500">Sản phẩm</th>
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-zinc-500">Danh mục</th>
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-zinc-500">Giá bán</th>
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-zinc-500">Trạng thái</th>
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-low border border-zinc-100 shrink-0">
                          <img src={product.image || PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      <div>
                        <p className="font-bold text-on-surface group-hover:text-brand transition-colors">{product.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">SKU: {product.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-accent text-brand text-[10px] font-bold rounded-full uppercase">{product.category}</span>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-secondary">{product.price.toLocaleString('vi-VN')}đ</p>
                    {product.originalPrice && (
                      <p className="text-[10px] text-zinc-400 line-through">{product.originalPrice.toLocaleString('vi-VN')}đ</p>
                    )}
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={() => toggleStatus(product)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all
                        ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}
                    >
                      {product.status === 'active' ? <Eye size={12} /> : <EyeOff size={12} />}
                      {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                    </button>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="p-2 text-zinc-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center text-zinc-300">
                        <ShoppingBag size={40} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Chưa có sản phẩm nào</p>
                        <p className="text-sm text-zinc-500">Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <ProductEditModal 
            product={editingProduct} 
            onClose={() => setIsModalOpen(false)} 
            onSave={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckoutView = ({ onBack }: { onBack: () => void }) => {
  const { cart, products, user, clearCart, addToast, createOrder } = useFirebase();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [orderCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const subtotal = cart.reduce((acc, item) => {
    const p = products.find(prod => prod.id === item.productId) || PRODUCTS.find(prod => prod.id === item.productId);
    return acc + (p ? p.price * item.quantity : 0);
  }, 0);

  const shipping = subtotal >= 500000 || freeShipping ? 0 : 30000;
  const discountAmount = subtotal * discount;
  const total = subtotal + shipping - discountAmount;

  const handleApplyCoupon = () => {
    if (coupon === 'PITIFREE') {
      setFreeShipping(true);
      setDiscount(0);
      addToast('Đã áp dụng miễn phí vận chuyển', 'success');
    } else if (coupon === 'PITI10') {
      setDiscount(0.1);
      setFreeShipping(false);
      addToast('Đã giảm giá 10% đơn hàng', 'success');
    } else {
      addToast('Mã giảm giá không hợp lệ', 'error');
    }
  };

  const onSubmit = async (data: any) => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const orderData = {
        uid: user?.uid || 'guest',
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color,
          size: item.size || ''
        })),
        subtotal,
        shipping,
        discount: discountAmount,
        total,
        paymentMethod,
        orderCode,
        customerInfo: data,
        status: 'pending'
      };
      await createOrder(orderData);
      await clearCart();
      addToast('Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại PiTi Store.', 'success');
      onBack();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <ShoppingBag size={80} className="text-zinc-200 mb-6" />
        <h2 className="text-3xl font-headline font-extrabold text-brand mb-4">Giỏ hàng trống</h2>
        <p className="text-zinc-500 mb-10 max-w-md">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
        <button 
          onClick={onBack}
          className="px-10 py-4 bg-brand text-white rounded-2xl font-bold shadow-xl shadow-brand/20 hover:scale-105 transition-all"
        >
          Quay lại cửa hàng
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm hover:text-brand transition-all">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-4xl font-headline font-extrabold text-brand">Thanh toán</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 p-8 border border-zinc-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Thông tin giao hàng</h2>
            </div>

            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Họ và tên</label>
                  <input 
                    {...register('name', { required: 'Vui lòng nhập họ tên' })}
                    className="w-full p-4 rounded-2xl border border-zinc-100 bg-surface-container-low focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.name.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Số điện thoại</label>
                  <input 
                    {...register('phone', { required: 'Vui lòng nhập số điện thoại' })}
                    className="w-full p-4 rounded-2xl border border-zinc-100 bg-surface-container-low focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="0901234567"
                  />
                  {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.phone.message as string}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Địa chỉ chi tiết</label>
                <input 
                  {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                  className="w-full p-4 rounded-2xl border border-zinc-100 bg-surface-container-low focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="Số nhà, tên đường..."
                />
                {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.address.message as string}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Tỉnh / Thành</label>
                  <input 
                    {...register('city', { required: 'Vui lòng nhập tỉnh/thành' })}
                    className="w-full p-4 rounded-2xl border border-zinc-100 bg-surface-container-low focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="Hà Nội"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Quận / Huyện</label>
                  <input 
                    {...register('district', { required: 'Vui lòng nhập quận/huyện' })}
                    className="w-full p-4 rounded-2xl border border-zinc-100 bg-surface-container-low focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="Cầu Giấy"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Phường / Xã</label>
                  <input 
                    {...register('ward', { required: 'Vui lòng nhập phường/xã' })}
                    className="w-full p-4 rounded-2xl border border-zinc-100 bg-surface-container-low focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="Dịch Vọng"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 p-8 border border-zinc-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Phương thức thanh toán</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setPaymentMethod('cod')}
                className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${paymentMethod === 'cod' ? 'border-brand bg-brand/5' : 'border-zinc-100 hover:border-brand/30'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-brand bg-brand' : 'border-zinc-300'}`}>
                  {paymentMethod === 'cod' && <Check size={14} className="text-white" />}
                </div>
                <div>
                  <p className="font-bold text-on-surface">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-xs text-zinc-500 mt-1">Giao hàng và thu tiền tận nơi</p>
                </div>
              </button>
              <button 
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${paymentMethod === 'bank_transfer' ? 'border-brand bg-brand/5' : 'border-zinc-100 hover:border-brand/30'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'border-brand bg-brand' : 'border-zinc-300'}`}>
                  {paymentMethod === 'bank_transfer' && <Check size={14} className="text-white" />}
                </div>
                <div>
                  <p className="font-bold text-on-surface">Chuyển khoản ngân hàng (QR)</p>
                  <p className="text-xs text-zinc-500 mt-1">Quét mã VietQR để thanh toán</p>
                </div>
              </button>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-8 p-8 bg-surface-container-low rounded-3xl border border-zinc-100 text-center"
              >
                <p className="text-sm font-bold text-brand mb-6 uppercase tracking-widest">Mã QR Thanh toán</p>
                <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mb-6">
                  <img 
                    src={`https://img.vietqr.io/image/VCB-3333401882-compact2.png?amount=${total}&addInfo=PITI%20${orderCode}&accountName=BUI%20VAN%20QUY`} 
                    alt="VietQR" 
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <div className="space-y-2 text-sm text-zinc-600">
                  <p>Ngân hàng: <span className="font-bold text-on-surface">Vietcombank</span></p>
                  <p>Số tài khoản: <span className="font-bold text-on-surface">3333401882</span></p>
                  <p>Chủ tài khoản: <span className="font-bold text-on-surface">BUI VAN QUY</span></p>
                  <p>Nội dung: <span className="font-bold text-on-surface">PITI {orderCode}</span></p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 p-8 border border-zinc-100 sticky top-32">
            <h2 className="text-xl font-headline font-bold text-on-surface mb-8">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => {
                const p = products.find(prod => prod.id === item.productId) || PRODUCTS.find(prod => prod.id === item.productId);
                if (!p) return null;
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-low shrink-0">
                      <img src={p.image || PLACEHOLDER_IMAGE} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">{p.name}</h4>
                      <p className="text-[10px] text-zinc-500">{item.color}{item.size ? ` - ${item.size}` : ''}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-zinc-500">x{item.quantity}</span>
                        <span className="text-sm font-bold text-secondary">{(p.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Mã giảm giá (PITI10, PITIFREE)"
                  className="flex-1 p-3 rounded-xl border border-zinc-100 bg-surface-container-low text-sm outline-none focus:border-[#E2583E]"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="px-4 bg-[#E2583E] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Tạm tính:</span>
                <span className="font-bold text-on-surface">{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Phí vận chuyển:</span>
                <span className="font-bold text-on-surface">{shipping === 0 ? 'Miễn phí' : `${shipping.toLocaleString('vi-VN')}đ`}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold">-{discountAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              {shipping > 0 && subtotal < 500000 && !freeShipping && (
                <p className="text-[10px] text-brand font-bold uppercase bg-brand/5 p-2 rounded-lg text-center">
                  Mua thêm {(500000 - subtotal).toLocaleString('vi-VN')}đ để được MIỄN PHÍ SHIP
                </p>
              )}
              <div className="flex justify-between text-lg pt-4 border-t border-zinc-100">
                <span className="font-headline font-bold text-on-surface">Tổng cộng:</span>
                <span className="font-headline font-black text-secondary">{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <button 
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full py-5 bg-brand text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all mt-8 disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>
            <p className="text-[10px] text-zinc-400 text-center mt-4 uppercase font-bold tracking-widest">
              Bằng cách đặt hàng, bạn đồng ý với điều khoản của PiTi Store
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderManagementView = () => {
  const { addToast } = useFirebase();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(orderList);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      addToast(`Đã cập nhật trạng thái đơn hàng sang ${newStatus}`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.customerInfo?.phone?.includes(searchTerm) || 
    order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'shipped': return 'Delivering';
      case 'delivered': return 'Success';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-headline font-extrabold text-brand">Quản lý đơn hàng</h1>
          <p className="text-zinc-500 mt-2">Theo dõi và cập nhật trạng thái đơn hàng của khách hàng.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo SĐT hoặc Mã đơn..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-100 bg-white shadow-sm focus:ring-2 focus:ring-brand/20 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-container-low rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-zinc-100">
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Đơn hàng</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Khách hàng</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Sản phẩm</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Tổng tiền</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500">Trạng thái</th>
                <th className="p-6 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="p-6">
                    <div className="font-bold text-brand">#{order.orderCode || order.id.slice(0, 6).toUpperCase()}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 uppercase font-bold">
                      {order.createdAt?.toDate().toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="font-bold text-on-surface">{order.customerInfo?.name}</div>
                    <div className="text-sm text-zinc-500">{order.customerInfo?.phone}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 truncate max-w-[200px]">{order.customerInfo?.address}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-sm text-zinc-600">
                      {order.items?.length} sản phẩm
                    </div>
                  </td>
                  <td className="p-6 font-bold text-secondary">
                    {order.total?.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="text-xs font-bold bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-brand cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Delivering</option>
                      <option value="delivered">Success</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-zinc-400">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<{ type: 'list' | 'detail' | 'admin' | 'admin_orders' | 'checkout', product?: Product, category?: string }>({ type: 'list' });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleNavigate = (type: 'list' | 'detail' | 'admin' | 'admin_orders' | 'checkout', product?: Product, category?: string) => {
    setView({ type, product, category });
    window.scrollTo(0, 0);
  };

  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <div className="min-h-screen bg-surface selection:bg-primary/10 selection:text-primary custom-scrollbar">
          <Navbar 
            onNavigate={handleNavigate} 
            currentView={view.type} 
            openAuth={() => setIsAuthModalOpen(true)}
          />
          
          <main>
            <AnimatePresence mode="wait">
              {view.type === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ProductListView 
                    onProductClick={(p) => handleNavigate('detail', p)} 
                    initialCategory={view.category}
                  />
                </motion.div>
              )}
              {view.type === 'detail' && view.product && (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ProductDetailView product={view.product} onBack={() => handleNavigate('list')} onCheckout={() => handleNavigate('checkout')} />
                </motion.div>
              )}
              {view.type === 'admin' && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AdminView />
                </motion.div>
              )}
              {view.type === 'admin_orders' && (
                <motion.div
                  key="admin_orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <OrderManagementView />
                </motion.div>
              )}
              {view.type === 'checkout' && (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                >
                  <CheckoutView onBack={() => handleNavigate('list')} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <Footer />
          <ContactWidget />
          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
