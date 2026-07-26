import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ tenantId: string | null; children: React.ReactNode }> = ({
  tenantId,
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Unique localstorage key per tenant to separate carts
  const storageKey = tenantId ? `cart_${tenantId}` : null;

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setCartItems(JSON.parse(stored));
        } catch {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [tenantId]);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  };

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity: number) => {
    const existingIndex = cartItems.findIndex((item) => item.id === product.id);
    let updated: CartItem[];

    if (existingIndex >= 0) {
      updated = [...cartItems];
      const newQuantity = updated[existingIndex].quantity + quantity;
      updated[existingIndex].quantity = Math.min(newQuantity, product.stock);
    } else {
      updated = [...cartItems, { ...product, quantity: Math.min(quantity, product.stock) }];
    }
    saveCart(updated);
  };

  const removeFromCart = (itemId: string) => {
    const updated = cartItems.filter((item) => item.id !== itemId);
    saveCart(updated);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) };
      }
      return item;
    });
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
