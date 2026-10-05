import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import logoImage from '@assets/msa-scrubs-logo.png';
import measurementMethodImage from '@assets/image_1789513064383.png';
import rubiPhoto from './assets/product-photos/rubi.png';
import rubiClaroPhoto from './assets/product-photos/rubi-claro.png';
import blancoPhoto from './assets/product-photos/blanco.png';
import azulMarinoPhoto from './assets/product-photos/azul-marino.png';
import vinoPhoto from './assets/product-photos/vino.png';
import lavandaPhoto from './assets/product-photos/lavanda.png';
import ebanoPhoto from './assets/product-photos/ebano.png';
import {
  ArrowRight, Check, ChevronDown, CircleHelp, Filter,
  Instagram, Menu, Minus, Plus, Ruler, Search, ShoppingBag,
  Sparkles, Stethoscope, Truck, UserRound, X, MessageCircle, ShieldCheck,
} from 'lucide-react';
import { Router as WouterRouter, Route, Switch } from 'wouter';

type Gender = 'Mujer' | 'Caballero' | 'Unisex';
type Product = {
  id: string; name: string; category: string; gender: Gender; cut: string; price: number;
  note: string; tone: string; accent: string; badge?: string; sizes: string[]; colors: string[];
  genderOptions?: Gender[]; cutOptions?: string[]; photos?: Record<string, string>;
};
type CartItem = { product: Product; gender?: Gender; cut?: string; size: string; color: string; quantity: number };
type CompanionOffer = { source: Product; companion: Product; gender?: Gender; cut?: string; size: string; color: string; quantity: number };

const WHATSAPP_NUMBER = '52 55 0000 0000';
const SCRUB_COLORS = ['Blanco', 'Azul cielo', 'Azul rey', 'Azul marino', 'Rubi claro', 'Rubi', 'Lavanda', 'Bugambilia', 'Vino', 'Militar', 'Ebano'];
const CONTEMPO_PHOTOS: Record<string, string> = {
  Blanco: blancoPhoto,
  'Rubi claro': rubiClaroPhoto,
  Rubi: rubiPhoto,
};
const CLASIA_V_PHOTOS: Record<string, string> = {
  'Azul marino': azulMarinoPhoto,
  Vino: vinoPhoto,
  Lavanda: lavandaPhoto,
};
const CLASIA_JOGGER_PHOTOS: Record<string, string> = {
  Ebano: ebanoPhoto,
};
const products: Product[] = ([
  { id: 'amalia', name: 'Contempo · Jogger', category: 'Conjunto', gender: 'Mujer', cut: 'Slim', price: 899, note: 'Cuello Mao · Bolsillos laterales · Pantalón jogger', tone: '#d5ddd9', accent: '#718f88', badge: 'Más elegido', sizes: ['CH', 'M', 'G', 'XG'], colors: SCRUB_COLORS, genderOptions: ['Mujer', 'Caballero'], cutOptions: ['Slim', 'Recto', 'Wide leg'], photos: CONTEMPO_PHOTOS },
  { id: 'celeste', name: 'Contempo · Recto', category: 'Conjunto', gender: 'Mujer', cut: 'Recto', price: 879, note: 'Cuello Mao · Bolsillos laterales · Pantalón recto', tone: '#ddd8cf', accent: '#a89782', sizes: ['CH', 'M', 'G'], colors: SCRUB_COLORS, genderOptions: ['Mujer', 'Caballero'], cutOptions: ['Recto', 'Slim'], photos: CONTEMPO_PHOTOS },
  { id: 'mateo', name: 'Clasia · Escote V', category: 'Conjunto', gender: 'Caballero', cut: 'Recto', price: 949, note: 'Escote V · Bolsillos laterales · Pantalón recto o jogger', tone: '#c8d3d6', accent: '#58737b', badge: 'Nuevo', sizes: ['CH', 'M', 'G', 'XG', '2XG'], colors: SCRUB_COLORS, genderOptions: ['Mujer', 'Caballero'], cutOptions: ['Recto', 'Slim'], photos: CLASIA_V_PHOTOS },
  { id: 'andrea', name: 'Clasia · Pétalo', category: 'Filipina', gender: 'Mujer', cut: 'Slim', price: 499, note: 'Manga tipo pétalo · Cuello Mao o V', tone: '#ded7de', accent: '#9c8295', sizes: ['CH', 'M', 'G', 'XG'], colors: SCRUB_COLORS, genderOptions: ['Mujer', 'Caballero'], cutOptions: ['Slim', 'Recto'] },
  { id: 'nicolas', name: 'Clasia · Sport', category: 'Filipina', gender: 'Caballero', cut: 'Recto', price: 529, note: 'Manga tipo pétalo · Cuello sport · Pantalón jogger', tone: '#d9d1c5', accent: '#887b69', sizes: ['M', 'G', 'XG', '2XG'], colors: SCRUB_COLORS, genderOptions: ['Mujer', 'Caballero'], cutOptions: ['Recto', 'Slim'] },
  { id: 'pantalon-msa', name: 'Pantalón MSA', category: 'Pantalón', gender: 'Unisex', cut: 'Recto', price: 449, note: 'La parte inferior para completar tu conjunto', tone: '#d6dde0', accent: '#5f7780', sizes: ['CH', 'M', 'G', 'XG', '2XG'], colors: SCRUB_COLORS, genderOptions: ['Mujer', 'Caballero', 'Unisex'], cutOptions: ['Recto', 'Slim', 'Wide leg'] },
  { id: 'pulso', name: 'Pulso', category: 'Gorro quirúrgico', gender: 'Unisex', cut: 'Ajustable', price: 249, note: 'Elástico suave · Estampado interior', tone: '#cedbd7', accent: '#4f8279', badge: 'Favorito', sizes: ['Unitalla'], colors: ['Verde eucalipto', 'Azul tinta', 'Terracota'] },
  { id: 'aurora', name: 'Aurora', category: 'Gorro quirúrgico', gender: 'Unisex', cut: 'Ajustable', price: 249, note: 'Ajuste cómodo · Diseño ligero', tone: '#e0d8d0', accent: '#a78978', sizes: ['Unitalla'], colors: ['Arena', 'Lavanda', 'Terracota'] },
  { id: 'guardia', name: 'Guardia', category: 'Gorro quirúrgico', gender: 'Unisex', cut: 'Ajustable', price: 269, note: 'Secado rápido · Banda suave', tone: '#d7dfe1', accent: '#617a83', sizes: ['Unitalla'], colors: ['Azul quirófano', 'Gris piedra', 'Verde salvia'] },
  { id: 'olivia', name: 'Clasia · Campana', category: 'Conjunto', gender: 'Mujer', cut: 'Wide leg', price: 929, note: 'Manga tipo pétalo · Pantalón recto con ligera campana', tone: '#d8d5cb', accent: '#8e8a7c', sizes: ['CH', 'M', 'G'], colors: SCRUB_COLORS, genderOptions: ['Mujer', 'Caballero'], cutOptions: ['Wide leg', 'Recto', 'Slim'] },
  { id: 'luca', name: 'Clasia · Jogger', category: 'Conjunto', gender: 'Unisex', cut: 'Recto', price: 919, note: 'Manga tipo pétalo · Bolsillos laterales · Pantalón jogger', tone: '#d4d9de', accent: '#647687', sizes: ['CH', 'M', 'G', 'XG'], colors: SCRUB_COLORS, genderOptions: ['Mujer', 'Caballero', 'Unisex'], cutOptions: ['Recto', 'Slim', 'Wide leg'], photos: CLASIA_JOGGER_PHOTOS },
  { id: 'clasico', name: 'Clásico', category: 'Cubrepolvo', gender: 'Unisex', cut: 'Recto', price: 649, note: 'Corte limpio · Bolsillos funcionales', tone: '#e1e2dc', accent: '#8c9990', sizes: ['CH', 'M', 'G', 'XG'], colors: ['Blanco', 'Azul cielo', 'Verde salvia'] },
  { id: 'esencial', name: 'Esencial', category: 'Cubrepolvo', gender: 'Unisex', cut: 'Recto', price: 699, note: 'Tela ligera · Silueta amplia', tone: '#ddd8cf', accent: '#a89782', sizes: ['M', 'G', 'XG'], colors: ['Blanco', 'Arena', 'Gris piedra'] },
] as Product[]);

const money = (value: number) => `$${value.toLocaleString('es-MX')} MXN`;
const isUniformProduct = (product: Product) => product.category === 'Conjunto' || product.category === 'Filipina';
const isCubrepolvo = (product: Product) => product.category === 'Cubrepolvo';
const isGorro = (product: Product) => product.category === 'Gorro quirúrgico';
const colorStyles: Record<string, { tone: string; accent: string }> = {
  Blanco: { tone: '#f7f4ed', accent: '#d7d4ca' },
  'Azul cielo': { tone: '#c7d9eb', accent: '#9ebbd7' },
  'Azul rey': { tone: '#d5e2ef', accent: '#155da2' },
  'Azul marino': { tone: '#d4dce7', accent: '#102c50' },
  'Rubi claro': { tone: '#f8d8e1', accent: '#ef5e82' },
  Rubi: { tone: '#f6d5d8', accent: '#e31632' },
  Lavanda: { tone: '#e5dcfb', accent: '#b79df4' },
  Bugambilia: { tone: '#ecd6e9', accent: '#a81799' },
  Vino: { tone: '#e4ced1', accent: '#6c202d' },
  Militar: { tone: '#d7dfd2', accent: '#304d2b' },
  Ebano: { tone: '#d7d7d5', accent: '#111111' },
};
function getColorStyle(product: Product, selectedColor?: string) {
  return colorStyles[selectedColor ?? ''] ?? { tone: product.tone, accent: product.accent };
}
function getProductPhoto(product: Product, selectedColor?: string) {
  if (!product.photos) return undefined;
  if (selectedColor) return product.photos[selectedColor];
  return Object.values(product.photos)[0];
}
const cartSelectionLabel = (item: CartItem) => [
  item.gender && isUniformProduct(item.product) ? item.gender : null,
  item.cut && isUniformProduct(item.product) ? item.cut : null,
  item.color,
  item.product.category === 'Gorro quirúrgico' ? 'Unitalla' : `Talla ${item.size}`,
].filter(Boolean).join(' · ');

function ProductVisual({ product, large = false, selectedColor }: { product: Product; large?: boolean; selectedColor?: string }) {
  const colorStyle = getColorStyle(product, selectedColor);
  const photo = getProductPhoto(product, selectedColor);
  return (
    <div className={`visual-shine relative ${large ? 'h-[390px] sm:h-[500px]' : 'h-[285px]'} overflow-hidden`} style={{ background: photo ? '#e9e9e5' : `linear-gradient(145deg, ${colorStyle.tone}, #f4f0e8)` }}>
      {photo ? <img src={photo} alt={`${product.name}${selectedColor ? ` en color ${selectedColor}` : ''}`} className="absolute inset-0 h-full w-full object-contain object-top" /> : <>
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-35" style={{ background: colorStyle.accent }} />
        <div className="absolute bottom-0 left-1/2 h-[86%] w-[56%] -translate-x-1/2 rounded-t-[48%] opacity-90" style={{ background: colorStyle.accent, clipPath: 'polygon(25% 0, 75% 0, 100% 25%, 80% 100%, 56% 100%, 50% 52%, 44% 100%, 20% 100%, 0 25%)' }} />
        <div className="absolute bottom-[34%] left-1/2 h-20 w-24 -translate-x-1/2 rounded-b-[45%] rounded-t-[20%] border-[9px] border-white/25" style={{ background: colorStyle.tone }} />
      </>}
      {photo && <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1d3d43]/20 to-transparent" />}
      <div className="absolute bottom-5 left-5 text-[10px] font-semibold uppercase tracking-[.24em] text-[#1d3d43]/65">{product.category}</div>
      <div className="absolute right-5 top-5 font-display text-4xl font-semibold text-[#f8f4eb]/80">{product.name.slice(0, 1)}</div>
      {selectedColor && <div className="absolute bottom-5 right-5 rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#1d3d43] backdrop-blur-sm">{selectedColor}</div>}
    </div>
  );
}

function Header({ cartCount, onCart, onSearch }: { cartCount: number; onCart: () => void; onSearch: (value: string) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-[#d8d0c2]/70 bg-[#f7f4ed]/92 backdrop-blur-md">
      <div className="bg-[#1d3d43] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[.18em] text-[#f7f4ed]">Envíos a todo México · Cambios fáciles durante 30 días</div>
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-5 py-4 lg:px-10">
        <button className="flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} data-testid="button-logo-home" aria-label="Ir al inicio de MSA Scrubs">
          <img src={logoImage} alt="MSA Scrubs & Uniforms" className="h-12 w-[86px] object-contain mix-blend-multiply" />
        </button>
        <nav className={`${mobileOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-4 border-b border-[#d8d0c2] bg-[#f7f4ed] px-5 py-5 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`} aria-label="Navegación principal">
          <a href="#coleccion" className="text-sm font-semibold text-[#1d3d43] hover:text-[#c06d48]" data-testid="link-collection">Colección</a>
          <a href="#esenciales" className="text-sm font-semibold text-[#1d3d43] hover:text-[#c06d48]" data-testid="link-essentials">Esenciales</a>
          <button className="text-left text-sm font-semibold text-[#1d3d43] hover:text-[#c06d48]" onClick={() => document.getElementById('guia')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-size-guide-nav">Guía de tallas</button>
          <a href="#preguntas" className="text-sm font-semibold text-[#1d3d43] hover:text-[#c06d48]" data-testid="link-faq">Ayuda</a>
        </nav>
        <div className="flex items-center gap-2">
          <label className="hidden h-10 items-center gap-2 rounded-full border border-[#d8d0c2] bg-[#fbf9f4] px-3 text-[#718f88] sm:flex">
            <Search size={16} />
            <input onChange={(e) => onSearch(e.target.value)} className="w-28 bg-transparent text-xs text-[#1d3d43] outline-none placeholder:text-[#8d9790] lg:w-44" placeholder="Buscar pieza" data-testid="input-search-header" />
          </label>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#dfe9e5] text-[#1d3d43] transition hover:bg-[#c4d8d2]" onClick={onCart} aria-label="Abrir carrito" data-testid="button-open-cart">
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c06d48] px-1 text-[10px] font-bold text-[#fffaf1]" data-testid="text-cart-count">{cartCount}</span>}
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d0c2] md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Abrir menú" data-testid="button-mobile-menu"><Menu size={18} /></button>
        </div>
      </div>
    </header>
  );
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: (product: Product) => void }) {
  return (
    <article className="group fade-up" data-testid={`card-product-${product.id}`}>
      <button className="relative block w-full text-left" onClick={() => onOpen(product)} data-testid={`button-product-${product.id}`}>
        <ProductVisual product={product} />
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-[#f7f4ed] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#1d3d43]">{product.badge}</span>}
        <span className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-[#f7f4ed] text-[#1d3d43] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"><ArrowRight size={17} /></span>
      </button>
      <div className="flex items-start justify-between gap-3 pt-4">
        <div><h3 className="font-display text-lg font-bold text-[#1d3d43]">{product.name}</h3><p className="mt-0.5 text-xs text-[#718078]">{product.note}</p></div>
        <p className="whitespace-nowrap text-sm font-bold text-[#1d3d43]">{money(product.price)}</p>
      </div>
    </article>
  );
}

function ModalShell({ children, onClose, labelledBy }: { children: ReactNode; onClose: () => void; labelledBy: string }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16353b]/45 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
    <div className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#f7f4ed] shadow-2xl sm:max-w-4xl sm:rounded-[28px]">
      <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f4ed]/80 text-[#1d3d43] backdrop-blur" aria-label="Cerrar" data-testid="button-close-modal"><X size={18} /></button>
      {children}
    </div>
  </div>;
}

function ProductModal({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (product: Product, gender: Gender | undefined, cut: string | undefined, size: string, color: string, quantity: number) => void }) {
  const uniform = isUniformProduct(product);
  const cubrepolvo = isCubrepolvo(product);
  const gorro = isGorro(product);
  const genderOptions = product.genderOptions ?? [product.gender];
  const cutOptions = product.cutOptions ?? [product.cut];
  const [gender, setGender] = useState<Gender>(genderOptions.includes(product.gender) ? product.gender : genderOptions[0]);
  const [cut, setCut] = useState(product.cut);
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0]);
  const [color, setColor] = useState(Object.keys(product.photos ?? {})[0] ?? product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  return <ModalShell onClose={onClose} labelledBy="product-modal-title">
    <div className="grid md:grid-cols-[.9fr_1.1fr]">
      <ProductVisual product={product} large selectedColor={color} />
      <div className="p-7 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c06d48]">{product.gender} · {product.category}</p>
        <h2 id="product-modal-title" className="mt-3 font-display text-4xl font-bold tracking-[-.05em] text-[#1d3d43]">{product.name}</h2>
        <p className="mt-2 text-sm leading-6 text-[#718078]">{product.note}. Diseñado para acompañar tus turnos con una tela fresca, flexible y fácil de cuidar.</p>
        <p className="mt-6 text-xl font-bold text-[#1d3d43]">{money(product.price)}</p>
        <div className="my-6 h-px bg-[#d8d0c2]" />
        {uniform && <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1d3d43]">1. Sexo</p>
            <span className="text-[10px] text-[#8b918a]">Primero define para quién es</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((item) => <button key={item} onClick={() => setGender(item)} className={`rounded-full border px-4 py-2 text-xs transition ${gender === item ? 'border-[#1d3d43] bg-[#1d3d43] text-[#f7f4ed]' : 'border-[#cfc6b8] text-[#1d3d43] hover:border-[#1d3d43]'}`} data-testid={`button-gender-${product.id}-${item}`}>{item}</button>)}
          </div>
        </div>}
        {uniform && <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1d3d43]">2. Corte</p>
            <span className="text-[10px] text-[#8b918a]">También aplica para filipinas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cutOptions.map((item) => <button key={item} onClick={() => setCut(item)} className={`rounded-full border px-4 py-2 text-xs transition ${cut === item ? 'border-[#1d3d43] bg-[#1d3d43] text-[#f7f4ed]' : 'border-[#cfc6b8] text-[#1d3d43] hover:border-[#1d3d43]'}`} data-testid={`button-cut-${product.id}-${item}`}>{item}</button>)}
          </div>
        </div>}
        <div className={`${uniform ? 'mt-6' : 'mt-2'}`}>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-[#1d3d43]">{uniform ? '3. ' : '1. '}Color · <span className="font-normal normal-case tracking-normal text-[#718078]">{color}</span></p>
          <div className="flex flex-wrap gap-2">{product.colors.map((item) => <button key={item} onClick={() => setColor(item)} className={`rounded-full border px-4 py-2 text-xs transition ${color === item ? 'border-[#1d3d43] bg-[#1d3d43] text-[#f7f4ed]' : 'border-[#cfc6b8] text-[#1d3d43] hover:border-[#1d3d43]'}`} data-testid={`button-color-${product.id}-${item}`}>{item}</button>)}</div>
        </div>
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1d3d43]">{uniform ? '4. ' : '2. '}Talla{gorro ? ' · Unitalla' : ''}</p>
            <button onClick={() => { onClose(); document.getElementById('guia')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center gap-1 text-xs font-semibold text-[#c06d48]" data-testid="button-size-guide-product"><Ruler size={14} /> Ver guía</button>
          </div>
          <div className="flex flex-wrap gap-2">{product.sizes.map((item) => <button key={item} onClick={() => setSize(item)} className={`flex h-10 min-w-12 items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${size === item ? 'border-[#1d3d43] bg-[#1d3d43] text-[#f7f4ed]' : 'border-[#cfc6b8] text-[#1d3d43] hover:border-[#1d3d43]'}`} data-testid={`button-size-${product.id}-${item}`}>{item}</button>)}</div>
        </div>
        {cubrepolvo && <p className="mt-4 rounded-xl bg-[#efe9df] px-4 py-3 text-xs leading-5 text-[#718078]">Para cubrepolvos el proceso es directo: elige color y talla. No necesitas seleccionar sexo ni corte.</p>}
        {gorro && <p className="mt-4 rounded-xl bg-[#dfe9e5] px-4 py-3 text-xs leading-5 text-[#526866]">Los gorros quirúrgicos son unitalla: selecciona el color o estampado que prefieras.</p>}
        <div className="mt-7 flex gap-3"><div className="flex h-12 items-center rounded-full border border-[#cfc6b8]"><button className="flex h-full w-11 items-center justify-center" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Reducir cantidad" data-testid="button-decrease-product"><Minus size={15} /></button><span className="w-5 text-center text-sm font-bold" data-testid="text-product-quantity">{quantity}</span><button className="flex h-full w-11 items-center justify-center" onClick={() => setQuantity(quantity + 1)} aria-label="Aumentar cantidad" data-testid="button-increase-product"><Plus size={15} /></button></div><button className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#c06d48] px-5 text-sm font-bold text-[#fffaf1] transition hover:bg-[#a95b39]" onClick={() => { onAdd(product, uniform ? gender : undefined, uniform ? cut : undefined, size, color, quantity); onClose(); }} data-testid="button-add-to-cart">Agregar al carrito <ArrowRight size={16} /></button></div>
        <div className="mt-7 flex gap-5 border-t border-[#d8d0c2] pt-5 text-xs text-[#718078]"><span className="flex items-center gap-2"><Truck size={15} className="text-[#718f88]" /> Envío nacional</span><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#718f88]" /> Cambios 30 días</span></div>
      </div>
    </div>
  </ModalShell>;
}

function CompanionOfferModal({ offer, onAdd, onKeep }: { offer: CompanionOffer; onAdd: () => void; onKeep: () => void }) {
  const missingPart = offer.companion.category === 'Pantalón' ? 'pantalón' : 'filipina';
  const sourcePart = offer.source.category === 'Pantalón' ? 'pantalón' : 'filipina';
  const missingPhrase = `${missingPart === 'pantalón' ? 'el' : 'la'} ${missingPart}`;
  const sourcePhrase = `${sourcePart === 'pantalón' ? 'el' : 'la'} ${sourcePart}`;
  const selection = [offer.gender, offer.cut, offer.color, `talla ${offer.size}`].filter(Boolean).join(' · ');
  return <ModalShell onClose={onKeep} labelledBy="companion-offer-title">
    <div className="grid md:grid-cols-[.75fr_1.25fr]">
      <ProductVisual product={offer.companion} large selectedColor={offer.color} />
      <div className="p-7 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c06d48]">Completa tu conjunto</p>
        <h2 id="companion-offer-title" className="mt-3 font-display text-4xl font-bold leading-[.95] tracking-[-.05em] text-[#1d3d43]">¿Quieres agregar {missingPhrase}?</h2>
        <p className="mt-4 text-sm leading-6 text-[#718078]">Elegiste solo {sourcePhrase}. Puedes llevar también {missingPhrase} y completar tu conjunto con la misma selección.</p>
        <div className="mt-6 rounded-2xl bg-[#dfe9e5] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#718078]">Se agregará con</p>
          <p className="mt-2 text-sm font-bold text-[#1d3d43]">{selection}</p>
          <p className="mt-1 text-xs text-[#526866]">{offer.companion.name} · {money(offer.companion.price)}</p>
        </div>
        <div className="mt-7 flex flex-col gap-3">
          <button onClick={onAdd} className="flex items-center justify-center gap-2 rounded-full bg-[#c06d48] px-5 py-3.5 text-sm font-bold text-[#fffaf1] hover:bg-[#a95b39]" data-testid="button-add-companion">Sí, agregar {missingPhrase} <ArrowRight size={16} /></button>
          <button onClick={onKeep} className="rounded-full border border-[#cfc6b8] px-5 py-3.5 text-sm font-semibold text-[#1d3d43] hover:border-[#1d3d43]" data-testid="button-keep-single-piece">No, llevaré solo {sourcePhrase}</button>
        </div>
      </div>
    </div>
  </ModalShell>;
}

function CartDrawer({ items, onClose, onChange, onCheckout, onContinue }: { items: CartItem[]; onClose: () => void; onChange: (index: number, amount: number) => void; onCheckout: () => void; onContinue: () => void }) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return <div className="fixed inset-0 z-50 bg-[#16353b]/35 backdrop-blur-sm" role="dialog" aria-modal="true">
    <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f7f4ed] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#d8d0c2] px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#c06d48]">Tu selección</p><h2 className="font-display text-2xl font-bold text-[#1d3d43]">Carrito <span className="font-sans text-sm font-medium text-[#718078]">({items.length})</span></h2></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8d0c2]" aria-label="Cerrar carrito" data-testid="button-close-cart"><X size={17} /></button></div>
       <div className="flex-1 overflow-y-auto px-6 py-5">{items.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#dfe9e5] text-[#718f88]"><ShoppingBag size={30} strokeWidth={1.4} /></div><h3 className="font-display text-2xl font-bold text-[#1d3d43]">Tu carrito está en calma</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#718078]">Explora piezas pensadas para moverse contigo durante todo el turno.</p><button onClick={onContinue} className="mt-7 rounded-full bg-[#1d3d43] px-6 py-3 text-xs font-bold text-[#f7f4ed]" data-testid="button-empty-continue">Ver colección</button></div> : <div className="space-y-5">{items.map((item, index) => <div className="flex gap-3 border-b border-[#d8d0c2] pb-5" key={`${item.product.id}-${item.gender ?? 'none'}-${item.cut ?? 'none'}-${item.size}-${item.color}`}><div className="w-20 shrink-0 overflow-hidden rounded-xl"><ProductVisual product={item.product} selectedColor={item.color} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><h3 className="font-display font-bold text-[#1d3d43]">{item.product.name}</h3><p className="mt-1 text-[11px] leading-5 text-[#718078]">{cartSelectionLabel(item)}</p></div><p className="text-sm font-bold text-[#1d3d43]">{money(item.product.price * item.quantity)}</p></div><div className="mt-3 flex items-center justify-between"><div className="flex h-8 items-center rounded-full border border-[#cfc6b8]"><button onClick={() => onChange(index, -1)} className="flex h-full w-8 items-center justify-center" aria-label="Reducir cantidad" data-testid={`button-decrease-cart-${item.product.id}`}><Minus size={13} /></button><span className="w-5 text-center text-xs font-bold">{item.quantity}</span><button onClick={() => onChange(index, 1)} className="flex h-full w-8 items-center justify-center" aria-label="Aumentar cantidad" data-testid={`button-increase-cart-${item.product.id}`}><Plus size={13} /></button></div><button onClick={() => onChange(index, -item.quantity)} className="text-xs font-semibold text-[#c06d48]" data-testid={`button-remove-cart-${item.product.id}`}>Quitar</button></div></div></div>)}</div>}</div>
      {items.length > 0 && <div className="border-t border-[#d8d0c2] px-6 py-6"><div className="mb-5 flex justify-between text-sm"><span className="text-[#718078]">Subtotal</span><strong className="text-lg text-[#1d3d43]" data-testid="text-cart-total">{money(total)}</strong></div><p className="mb-4 flex items-center gap-2 text-xs text-[#718078]"><Truck size={14} className="text-[#718f88]" /> Envío calculado al confirmar por WhatsApp</p><button onClick={onCheckout} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#c06d48] py-4 text-sm font-bold text-[#fffaf1] hover:bg-[#a95b39]" data-testid="button-go-checkout">Continuar pedido <ArrowRight size={16} /></button></div>}
    </aside>
  </div>;
}

function CheckoutModal({ items, onClose }: { items: CartItem[]; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const sendOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '');
    const message = `Hola MSA Scrubs, soy ${name}. Me gustaría confirmar este pedido: ${items.map((item) => `${item.quantity} x ${item.product.name} (${cartSelectionLabel(item)})`).join(', ')}. Total estimado: ${money(total)}.`;
    window.open(`https://wa.me/525500000000?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };
  return <ModalShell onClose={onClose} labelledBy="checkout-title"><div className="p-7 sm:p-10"><div className="max-w-xl"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c06d48]">Último paso</p><h2 id="checkout-title" className="mt-3 font-display text-4xl font-bold tracking-[-.05em] text-[#1d3d43]">Prepara tu pedido</h2>{sent ? <div className="mt-10 rounded-2xl bg-[#dfe9e5] p-7"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1d3d43] text-[#f7f4ed]"><Check size={22} /></div><h3 className="mt-5 font-display text-2xl font-bold text-[#1d3d43]">Pedido enviado a WhatsApp</h3><p className="mt-2 text-sm leading-6 text-[#526866]">Abrimos una conversación con tu selección. El equipo MSA confirmará disponibilidad, envío y forma de pago contigo.</p><button onClick={onClose} className="mt-6 rounded-full bg-[#1d3d43] px-5 py-3 text-xs font-bold text-[#f7f4ed]" data-testid="button-close-success">Volver a la tienda</button></div> : <form className="mt-8 space-y-5" onSubmit={sendOrder}><p className="text-sm leading-6 text-[#718078]">Déjanos tus datos. No es un pago: es la forma más rápida de armar tu pedido con atención personalizada.</p><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#1d3d43]">Nombre completo<input name="name" required className="mt-2 h-12 w-full rounded-xl border border-[#cfc6b8] bg-[#fbf9f4] px-4 text-sm font-normal outline-none focus:border-[#718f88]" placeholder="Tu nombre" data-testid="input-checkout-name" /></label><label className="text-xs font-bold text-[#1d3d43]">Teléfono<input name="phone" required className="mt-2 h-12 w-full rounded-xl border border-[#cfc6b8] bg-[#fbf9f4] px-4 text-sm font-normal outline-none focus:border-[#718f88]" placeholder="10 dígitos" data-testid="input-checkout-phone" /></label></div><label className="block text-xs font-bold text-[#1d3d43]">Ciudad y estado<input name="city" required className="mt-2 h-12 w-full rounded-xl border border-[#cfc6b8] bg-[#fbf9f4] px-4 text-sm font-normal outline-none focus:border-[#718f88]" placeholder="Ej. Puebla, Pue." data-testid="input-checkout-city" /></label><label className="block text-xs font-bold text-[#1d3d43]">Nota para tu pedido <textarea name="note" className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[#cfc6b8] bg-[#fbf9f4] px-4 py-3 text-sm font-normal outline-none focus:border-[#718f88]" placeholder="¿Necesitas factura o tienes alguna indicación?" data-testid="textarea-checkout-note" /></label><div className="flex items-center justify-between border-t border-[#d8d0c2] pt-5"><span className="text-sm text-[#718078]">Total estimado <strong className="ml-2 text-lg text-[#1d3d43]">{money(total)}</strong></span><button className="flex items-center gap-2 rounded-full bg-[#1d3d43] px-5 py-3 text-xs font-bold text-[#f7f4ed] hover:bg-[#2c555b]" type="submit" data-testid="button-send-whatsapp">Continuar en WhatsApp <MessageCircle size={15} /></button></div><p className="text-[10px] leading-5 text-[#8b918a]">Contacto provisional para demo: WhatsApp {WHATSAPP_NUMBER}. Sustituir por el número oficial antes de publicar.</p></form>}</div></div></ModalShell>;
}

function SizeGuide({ onClose }: { onClose: () => void }) {
  const [garment, setGarment] = useState<'Filipina' | 'Pantalón'>('Filipina');
  const [audience, setAudience] = useState<'Dama' | 'Caballero'>('Dama');
  const guide = audience === 'Dama'
    ? garment === 'Filipina'
      ? {
          title: 'Filipina Dama',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          rows: [
            ['Pecho', '92/95', '97/100', '102/105', '107/110', '112/115'],
            ['Cintura', '79/81', '84/86', '89/93', '96/100', '103/107'],
            ['Largo', '61', '63', '65', '67', '68'],
          ],
        }
      : {
          title: 'Pantalón Dama',
          sizes: ['XS', 'S', 'M', 'L', 'XL'],
          rows: [
            ['Cintura', '63/65', '67/71', '73/77', '80/84', '87/91'],
            ['Cadera', '98/101', '103/106', '108/111', '113/116', '118/121'],
            ['Largo', '98', '98', '99', '100', '102'],
          ],
        }
    : garment === 'Filipina'
      ? {
          title: 'Filipina Caballero',
          sizes: ['S', 'M', 'L', 'XL'],
          rows: [
            ['Cintura', '99/102', '104/107', '109/112', '114/117'],
            ['Largo', '70', '70', '72', '72'],
          ],
        }
      : {
          title: 'Pantalón Caballero',
          sizes: ['S', 'M', 'L', 'XL'],
          rows: [
            ['Cintura', '73/75', '76/79', '80/83', '87/90'],
            ['Cadera', '105/110', '111/115', '116/120', '124/128'],
            ['Largo', '103', '105', '108', '111'],
          ],
        };
  const gridColumns = `1.15fr repeat(${guide.sizes.length}, minmax(0, 1fr))`;

  return (
    <ModalShell onClose={onClose} labelledBy="guide-title">
      <div className="p-7 sm:p-10">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c06d48]">Encuentra tu ajuste</p>
          <h2 id="guide-title" className="mt-3 font-display text-4xl font-bold tracking-[-.05em] text-[#1d3d43]">Guía de tallas</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#718078]">Medidas oficiales de MSA Scrubs en centímetros. Mide sobre ropa ligera y mantén la cinta horizontal.</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#718078]">Colección</p>
              <div className="flex gap-2 rounded-full bg-[#efe9df] p-1">
                {(['Dama', 'Caballero'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setAudience(item)}
                    className={`flex-1 rounded-full px-4 py-2.5 text-xs font-bold transition ${audience === item ? 'bg-[#1d3d43] text-[#f7f4ed]' : 'text-[#718078] hover:text-[#1d3d43]'}`}
                    data-testid={`button-size-guide-audience-${item.toLowerCase()}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#718078]">Prenda</p>
              <div className="flex gap-2 rounded-full bg-[#efe9df] p-1">
                {(['Filipina', 'Pantalón'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setGarment(item)}
                    className={`flex-1 rounded-full px-4 py-2.5 text-xs font-bold transition ${garment === item ? 'bg-[#c06d48] text-[#fffaf1]' : 'text-[#718078] hover:text-[#1d3d43]'}`}
                    data-testid={`button-size-guide-${item.toLowerCase()}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#d8d0c2]">
            <div className="flex items-center justify-between bg-[#dfe9e5] px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-[.14em] text-[#1d3d43]">{guide.title}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#718078]">cm</span>
            </div>
            <div className="min-w-[460px]">
              <div className="grid border-t border-[#d8d0c2] bg-[#f0f4f0] px-4 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#1d3d43]" style={{ gridTemplateColumns: gridColumns }}>
                <span>Medida</span>
                {guide.sizes.map((size) => <span key={size}>{size}</span>)}
              </div>
              {guide.rows.map((row) => (
                <div className="grid border-t border-[#d8d0c2] px-4 py-3 text-sm text-[#526866]" style={{ gridTemplateColumns: gridColumns }} key={row[0]}>
                  {row.map((cell, index) => <span className={index === 0 ? 'font-bold text-[#1d3d43]' : ''} key={`${row[0]}-${cell}`}>{cell}</span>)}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#8b918a]">Los rangos se muestran tal como fueron compartidos por MSA Scrubs. Si estás entre dos tallas, recomendamos elegir la mayor.</p>

          <div className="mt-8 border-t border-[#d8d0c2] pt-7">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#c06d48]">Cómo sacar tus medidas</p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-[-.04em] text-[#1d3d43]">Toma la cinta como referencia, no como límite.</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-[.72fr_1.28fr] md:items-start">
              <div className="overflow-hidden rounded-2xl border border-[#d8d0c2] bg-[#f0f4f0]">
                <img src={measurementMethodImage} alt="Referencia visual para tomar medidas de MSA Scrubs" className="h-auto w-full object-cover" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Cintura', 'Rodea con la cinta el contorno entre la última costilla y el hueso de la cadera.'],
                  ['Cadera', 'Mide el contorno de la parte más ancha, unos centímetros por debajo de la cintura.'],
                  ['Largo de filipina', 'Mide desde el hombro hasta la cadera o hasta el largo que prefieras.'],
                  ['Largo de pantalón', 'Mide desde la cintura hasta el tobillo o hasta el largo que prefieras.'],
                ].map(([title, copy]) => (
                  <div className="rounded-2xl bg-[#efe9df] p-4" key={title}>
                    <p className="text-xs font-bold text-[#1d3d43]">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#718078]">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-[#8b918a]">Mide de pie, sin apretar la cinta y sobre ropa ligera. Para Caballero se utilizan las mismas referencias de medición.</p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f0e6dc] p-5"><Ruler size={20} className="text-[#c06d48]" /><h3 className="mt-3 font-display font-bold text-[#1d3d43]">¿Entre dos tallas?</h3><p className="mt-1 text-xs leading-5 text-[#718078]">Elige la mayor para un fit más relajado, especialmente si buscas libertad en hombros y cadera.</p></div>
            <div className="rounded-2xl bg-[#dfe9e5] p-5"><MessageCircle size={20} className="text-[#1d3d43]" /><h3 className="mt-3 font-display font-bold text-[#1d3d43]">¿Quieres ayuda?</h3><p className="mt-1 text-xs leading-5 text-[#526866]">Escríbenos por WhatsApp y te orientamos con tus medidas.</p></div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function FaqAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('Hola. Puedo orientarte sobre tallas, envíos, cambios y materiales.');
  const ask = (text: string) => { setQuestion(text); const lower = text.toLowerCase(); setAnswer(lower.includes('talla') || lower.includes('medida') ? 'Nuestra guía toma busto o pecho, cintura y cadera. Si estás entre dos tallas, elige la mayor. También puedes pedir orientación por WhatsApp.' : lower.includes('envío') ? 'Enviamos a todo México. El costo y tiempo dependen de tu ciudad; el equipo lo confirma al armar tu pedido.' : lower.includes('cambio') ? 'Aceptamos cambios durante 30 días, siempre que la prenda esté sin uso y con etiquetas.' : lower.includes('tela') || lower.includes('material') ? 'Trabajamos telas suaves, flexibles y de secado rápido, pensadas para turnos largos.' : 'Puedo ayudarte mejor con tallas, envíos, cambios o materiales. Si prefieres, te atendemos directamente por WhatsApp.'); };
  return <><button onClick={() => setOpen(!open)} className="fixed bottom-5 right-5 z-20 flex items-center gap-3 rounded-full bg-[#1d3d43] px-4 py-3 text-xs font-bold text-[#f7f4ed] shadow-xl transition hover:-translate-y-1" data-testid="button-open-assistant"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c58b68]"><CircleHelp size={16} /></span><span className="hidden sm:inline">¿Te ayudamos?</span></button>{open && <div className="fixed bottom-20 right-4 z-20 w-[calc(100vw-32px)] max-w-sm overflow-hidden rounded-2xl border border-[#d8d0c2] bg-[#f7f4ed] shadow-2xl"><div className="flex items-center justify-between bg-[#1d3d43] p-4 text-[#f7f4ed]"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#c58b68]">Asistente MSA</p><h3 className="font-display text-lg font-bold">Estamos para orientarte</h3></div><button onClick={() => setOpen(false)} aria-label="Cerrar asistente" data-testid="button-close-assistant"><X size={17} /></button></div><div className="space-y-4 p-4"><div className="rounded-xl bg-[#dfe9e5] p-3 text-sm leading-5 text-[#526866]" data-testid="text-assistant-answer">{answer}</div><div className="flex flex-wrap gap-2">{['¿Qué talla elijo?', '¿Cuánto tarda el envío?', '¿Puedo cambiar?'].map((item) => <button key={item} onClick={() => ask(item)} className="rounded-full border border-[#cfc6b8] px-3 py-2 text-[11px] text-[#1d3d43] hover:border-[#1d3d43]" data-testid={`button-faq-${item}`}>{item}</button>)}</div><div className="flex gap-2"><input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask(question)} className="min-w-0 flex-1 rounded-xl border border-[#cfc6b8] bg-[#fbf9f4] px-3 text-xs outline-none" placeholder="Escribe una pregunta" data-testid="input-assistant-question" /><button onClick={() => ask(question)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c06d48] text-[#fffaf1]" aria-label="Enviar pregunta" data-testid="button-ask-assistant"><ArrowRight size={15} /></button></div><a href={`https://wa.me/525500000000?text=${encodeURIComponent('Hola MSA Scrubs, necesito orientación con mi pedido.')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs font-bold text-[#1d3d43]" data-testid="link-assistant-whatsapp"><MessageCircle size={15} className="text-[#718f88]" /> Hablar con el equipo por WhatsApp</a></div></div>}</>;
}

function Home() {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<'Todos' | Gender>('Todos');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [guide, setGuide] = useState(false);
  const [companionOffer, setCompanionOffer] = useState<CompanionOffer | null>(null);
  const filtered = useMemo(() => products.filter((product) => (gender === 'Todos' || product.gender === gender) && (category === 'Todos' || product.category === category) && `${product.name} ${product.category} ${product.note}`.toLowerCase().includes(search.toLowerCase())), [gender, category, search]);
  const addToCart = (product: Product, gender: Gender | undefined, cut: string | undefined, size: string, color: string, quantity: number) => setCart((current) => { const found = current.find((item) => item.product.id === product.id && item.gender === gender && item.cut === cut && item.size === size && item.color === color); if (found) return current.map((item) => item === found ? { ...item, quantity: item.quantity + quantity } : item); return [...current, { product, gender, cut, size, color, quantity }]; });
  const changeCart = (index: number, amount: number) => setCart((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const categories = ['Todos', 'Conjunto', 'Filipina', 'Pantalón', 'Cubrepolvo', 'Gorro quirúrgico'];
  return <div className="msa-app msa-grain">
    <Header cartCount={cartCount} onCart={() => setCartOpen(true)} onSearch={setSearch} />
    <main>
      <section className="mx-auto grid max-w-[1380px] gap-7 px-5 pb-20 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-28 lg:pt-14">
        <div className="flex flex-col justify-center">
          <div className="mb-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.22em] text-[#718f88]"><span className="h-px w-8 bg-[#c06d48]" /> Uniformes para tu manera de cuidar</div>
          <h1 className="max-w-2xl font-display text-[clamp(3.5rem,8vw,7.5rem)] font-bold leading-[.88] tracking-[-.08em] text-[#1d3d43]">Tu turno,<br /><span className="text-[#718f88]">a tu ritmo.</span></h1>
          <p className="mt-8 max-w-md text-base leading-7 text-[#60716e]">Scrubs que se sienten bien desde la primera ronda. Diseñados en México para acompañar cada movimiento de quienes cuidan.</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="#coleccion" className="flex items-center gap-3 rounded-full bg-[#c06d48] px-6 py-3.5 text-sm font-bold text-[#fffaf1] transition hover:bg-[#a95b39]" data-testid="link-shop-collection">Ver colección <ArrowRight size={16} /></a><button onClick={() => setGuide(true)} className="flex items-center gap-2 rounded-full border border-[#bdb6aa] px-5 py-3.5 text-sm font-semibold text-[#1d3d43] hover:border-[#1d3d43]" data-testid="button-open-guide-hero"><Ruler size={16} /> Encuentra tu talla</button></div>
          <div className="mt-14 flex items-center gap-5 text-xs text-[#718078]"><div className="flex -space-x-2"><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f4ed] bg-[#d8b8a4] text-[10px] font-bold text-[#1d3d43]">LP</span><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f4ed] bg-[#9eb5ae] text-[10px] font-bold text-[#1d3d43]">AR</span><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f4ed] bg-[#c8ccd0] text-[10px] font-bold text-[#1d3d43]">MG</span></div><span>Elegidos por profesionales en todo México</span></div>
        </div>
        <div className="relative min-h-[500px] overflow-hidden rounded-[30px] bg-[#dfe9e5] lg:min-h-[650px]"><div className="absolute right-[-18%] top-[-12%] h-[70%] w-[75%] rounded-full bg-[#bdcec6]" /><div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#f0e6dc]" /><div className="absolute left-[15%] top-[12%] rounded-full border border-[#718f88]/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#526866]">Colección 2024</div><div className="absolute bottom-0 left-1/2 h-[82%] w-[62%] -translate-x-1/2 rounded-t-[48%] bg-[#718f88]" style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 18%, 83% 100%, 58% 100%, 50% 48%, 42% 100%, 17% 100%, 0 18%)' }} /><div className="absolute bottom-[38%] left-1/2 h-28 w-32 -translate-x-1/2 rounded-b-[45%] rounded-t-[20%] border-[12px] border-[#dfe9e5]/40 bg-[#bdcec6]" /><div className="absolute bottom-7 left-7 right-7 flex items-end justify-between"><div><p className="font-display text-2xl font-bold text-[#1d3d43]">Línea esencial</p><p className="mt-1 text-xs text-[#526866]">Comodidad que se nota.</p></div><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f4ed] text-[#1d3d43]"><ArrowRight size={18} /></span></div></div>
      </section>
      <section className="border-y border-[#d8d0c2] bg-[#efe9df]"><div className="mx-auto grid max-w-[1380px] gap-5 px-5 py-5 sm:grid-cols-3 lg:px-10"><div className="flex items-center gap-3 text-xs text-[#526866]"><Stethoscope size={19} className="text-[#718f88]" /><span><strong className="block text-[#1d3d43]">Pensados para tu turno</strong>Movimiento sin distracciones</span></div><div className="flex items-center gap-3 text-xs text-[#526866]"><Truck size={19} className="text-[#718f88]" /><span><strong className="block text-[#1d3d43]">Envíos a todo México</strong>Seguimiento en cada pedido</span></div><div className="flex items-center gap-3 text-xs text-[#526866]"><Sparkles size={19} className="text-[#c06d48]" /><span><strong className="block text-[#1d3d43]">Hechos para durar</strong>Telas suaves y resistentes</span></div></div></section>
       <section id="coleccion" className="mx-auto max-w-[1380px] scroll-mt-24 px-5 py-20 lg:px-10 lg:py-28"><div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#c06d48]">La colección</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-[#1d3d43] sm:text-5xl">Piezas para estar<br className="hidden sm:block" /> bien en lo que haces.</h2></div><div className="flex max-w-sm items-center gap-3 rounded-2xl bg-[#dfe9e5] p-4 text-xs leading-5 text-[#526866]"><Filter size={18} className="shrink-0 text-[#718f88]" /> Filtra por corte, género o busca una pieza específica.</div></div><div className="mb-8 grid gap-3 sm:grid-cols-2"><button onClick={() => { setGender('Todos'); setCategory('Cubrepolvo'); }} className="flex items-center justify-between rounded-2xl bg-[#efe9df] px-5 py-4 text-left transition hover:-translate-y-0.5" data-testid="button-catalog-cubrepolvos"><span><strong className="block text-sm text-[#1d3d43]">Cubrepolvos</strong><span className="mt-1 block text-xs text-[#718078]">Color y talla para tu día clínico.</span></span><ArrowRight size={17} className="text-[#c06d48]" /></button><button onClick={() => { setGender('Todos'); setCategory('Gorro quirúrgico'); }} className="flex items-center justify-between rounded-2xl bg-[#dfe9e5] px-5 py-4 text-left transition hover:-translate-y-0.5" data-testid="button-catalog-gorros"><span><strong className="block text-sm text-[#1d3d43]">Catálogo de gorros quirúrgicos</strong><span className="mt-1 block text-xs text-[#526866]">Diseños unitalla para completar tu uniforme.</span></span><ArrowRight size={17} className="text-[#718f88]" /></button></div><div className="mb-9 flex flex-wrap items-center gap-2 border-b border-[#d8d0c2] pb-4"><div className="flex flex-wrap gap-2">{(['Todos', 'Mujer', 'Caballero', 'Unisex'] as const).map((item) => <button key={item} onClick={() => setGender(item)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${gender === item ? 'bg-[#1d3d43] text-[#f7f4ed]' : 'text-[#718078] hover:bg-[#efe9df]'}`} data-testid={`button-filter-gender-${item}`}>{item}</button>)}</div><span className="hidden h-5 w-px bg-[#d8d0c2] sm:block" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-[#d8d0c2] bg-transparent px-4 py-2 text-xs font-semibold text-[#1d3d43] outline-none" data-testid="select-filter-category">{categories.map((item) => <option key={item}>{item}</option>)}</select><label className="ml-auto flex h-9 items-center gap-2 rounded-full border border-[#d8d0c2] bg-[#fbf9f4] px-3 sm:hidden"><Search size={14} className="text-[#718f88]" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="w-24 bg-transparent text-xs outline-none" placeholder="Buscar" data-testid="input-search-mobile" /></label></div>{filtered.length > 0 ? <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">{filtered.map((product) => <ProductCard key={product.id} product={product} onOpen={setSelected} />)}</div> : <div className="rounded-2xl bg-[#efe9df] px-6 py-16 text-center"><Search className="mx-auto text-[#718f88]" /><h3 className="mt-4 font-display text-2xl font-bold text-[#1d3d43]">No encontramos esa pieza</h3><p className="mt-2 text-sm text-[#718078]">Prueba con otro término o limpia tus filtros.</p><button onClick={() => { setSearch(''); setGender('Todos'); setCategory('Todos'); }} className="mt-5 rounded-full bg-[#1d3d43] px-5 py-3 text-xs font-bold text-[#f7f4ed]" data-testid="button-clear-filters">Limpiar filtros</button></div>}</section>
      <section id="esenciales" className="bg-[#1d3d43] text-[#f7f4ed]"><div className="mx-auto grid max-w-[1380px] items-center gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:py-24"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d8b39a]">El uniforme como herramienta</p><h2 className="mt-4 max-w-lg font-display text-4xl font-bold leading-[.96] tracking-[-.06em] sm:text-6xl">Más espacio para lo que importa.</h2><p className="mt-7 max-w-md text-sm leading-7 text-[#bdcec6]">Bolsillos donde los necesitas, cortes que siguen tu postura y materiales que resisten el ritmo. Nada sobra. Nada te detiene.</p><a href="#coleccion" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#f0c2a8] hover:text-[#fffaf1]" data-testid="link-essentials-shop">Conoce los esenciales <ArrowRight size={16} /></a></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-[26px] bg-[#2b5358] p-6 sm:translate-y-8"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#718f88] text-[#1d3d43]"><UserRound size={21} /></div><h3 className="mt-12 font-display text-2xl font-bold">Para cada cuerpo</h3><p className="mt-2 text-sm leading-6 text-[#bdcec6]">Cortes mujer, caballero y unisex para encontrar tu forma de trabajar.</p></div><div className="rounded-[26px] bg-[#c06d48] p-6 text-[#fffaf1]"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0c2a8] text-[#1d3d43]"><Sparkles size={21} /></div><h3 className="mt-12 font-display text-2xl font-bold">Para cada turno</h3><p className="mt-2 text-sm leading-6 text-[#f8dfd2]">Telas que se sienten ligeras y detalles que hacen la diferencia.</p></div></div></div></section>
      <section id="guia" className="mx-auto max-w-[1380px] scroll-mt-24 px-5 py-20 lg:px-10 lg:py-24"><div className="rounded-[28px] bg-[#dfe9e5] p-7 sm:p-12"><div className="grid items-center gap-9 lg:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#718f88]"><Ruler size={17} /> La talla correcta cambia todo</div><h2 className="mt-4 max-w-2xl font-display text-4xl font-bold tracking-[-.06em] text-[#1d3d43] sm:text-5xl">Encuentra tu ajuste<br />en menos de un minuto.</h2><p className="mt-4 max-w-lg text-sm leading-6 text-[#526866]">Ten a la mano tu cinta métrica y elige la talla que te permita moverte con libertad. Te acompañamos si tienes dudas.</p><button onClick={() => setGuide(true)} className="mt-7 flex items-center gap-2 rounded-full bg-[#1d3d43] px-5 py-3 text-xs font-bold text-[#f7f4ed]" data-testid="button-open-guide-section">Abrir guía de tallas <ArrowRight size={15} /></button></div><div className="hidden h-44 w-44 items-center justify-center rounded-full border border-[#718f88]/50 md:flex"><div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#718f88]/50"><Ruler size={40} strokeWidth={1} className="text-[#718f88]" /></div></div></div></div></section>
      <section id="preguntas" className="border-t border-[#d8d0c2] bg-[#efe9df] scroll-mt-24"><div className="mx-auto grid max-w-[1380px] gap-10 px-5 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-24"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#c06d48]">Preguntas frecuentes</p><h2 className="mt-4 font-display text-4xl font-bold tracking-[-.06em] text-[#1d3d43]">Compra con<br />tranquilidad.</h2><p className="mt-5 max-w-sm text-sm leading-6 text-[#718078]">Si aquí no encuentras lo que buscas, nuestro equipo te responde por WhatsApp.</p><a href={`https://wa.me/525500000000?text=${encodeURIComponent('Hola MSA Scrubs, tengo una pregunta.')}`} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#1d3d43]" data-testid="link-faq-whatsapp"><MessageCircle size={16} className="text-[#c06d48]" /> Escribir al equipo</a></div><div className="divide-y divide-[#d8d0c2]">{[['¿Cómo elijo mi talla?', 'Consulta la guía de tallas y mide sobre ropa ligera. Si estás entre dos tallas, elige la mayor.'], ['¿Hacen envíos a todo México?', 'Sí. Enviamos a todo el país y confirmamos el costo y tiempo según tu ciudad al tomar el pedido.'], ['¿Puedo hacer un cambio?', 'Sí, tienes 30 días para solicitarlo. La prenda debe estar sin uso y conservar sus etiquetas.'], ['¿Qué materiales utilizan?', 'Nuestras telas son suaves, flexibles y de secado rápido, elegidas para acompañar turnos largos.']].map(([question, answer]) => <details className="group py-5" key={question}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-bold text-[#1d3d43]"><span>{question}</span><ChevronDown size={18} className="transition group-open:rotate-180" /></summary><p className="max-w-xl pt-3 text-sm leading-6 text-[#718078]">{answer}</p></details>)}</div></div></section>
    </main>
    <footer className="bg-[#f7f4ed]"><div className="mx-auto max-w-[1380px] px-5 py-12 lg:px-10"><div className="flex flex-col justify-between gap-8 border-b border-[#d8d0c2] pb-10 sm:flex-row"><div><img src={logoImage} alt="MSA Scrubs & Uniforms" className="h-14 w-[100px] object-contain object-left mix-blend-multiply" /><p className="mt-2 max-w-xs text-sm leading-6 text-[#718078]">Uniformes que acompañan tu forma de cuidar.</p></div><div className="flex flex-wrap gap-6 text-xs font-semibold text-[#526866]"><a href="#coleccion" data-testid="link-footer-collection">Colección</a><button onClick={() => setGuide(true)} data-testid="button-footer-guide">Guía de tallas</button><a href="https://www.instagram.com/msa_scrubs/" target="_blank" rel="noreferrer" className="flex items-center gap-1" data-testid="link-instagram"><Instagram size={14} /> Instagram</a><a href={`https://wa.me/525500000000`} target="_blank" rel="noreferrer" className="flex items-center gap-1" data-testid="link-footer-whatsapp"><MessageCircle size={14} /> WhatsApp</a></div></div><div className="flex flex-col justify-between gap-3 pt-6 text-[10px] uppercase tracking-[.12em] text-[#8b918a] sm:flex-row"><span>© 2024 MSA Scrubs · Hecho en México</span><span>WhatsApp provisional: {WHATSAPP_NUMBER}</span></div></div></footer>
    <FaqAssistant />
    {selected && <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={(product, gender, cut, size, color, quantity) => {
      addToCart(product, gender, cut, size, color, quantity);
      const companionCategory = product.category === 'Filipina' ? 'Pantalón' : product.category === 'Pantalón' ? 'Filipina' : null;
      const companion = companionCategory ? products.find((item) => item.category === companionCategory) : undefined;
      if (companion) setCompanionOffer({ source: product, companion, gender, cut, size, color, quantity });
      else setCartOpen(true);
    }} />}
    {companionOffer && <CompanionOfferModal
      offer={companionOffer}
      onAdd={() => {
        addToCart(companionOffer.companion, companionOffer.gender, companionOffer.cut, companionOffer.size, companionOffer.color, companionOffer.quantity);
        setCompanionOffer(null);
        setCartOpen(true);
      }}
      onKeep={() => {
        setCompanionOffer(null);
        setCartOpen(true);
      }}
    />}
    {cartOpen && <CartDrawer items={cart} onClose={() => setCartOpen(false)} onChange={changeCart} onContinue={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckout(true); }} />}
    {checkout && <CheckoutModal items={cart} onClose={() => setCheckout(false)} />}
    {guide && <SizeGuide onClose={() => setGuide(false)} />}
  </div>;
}

function Router() {
  return <ErrorBoundary resetKey={window.location.pathname}><Switch><Route path="/" component={Home} /><Route component={() => <div className="flex min-h-dvh items-center justify-center bg-[#f7f4ed] text-[#1d3d43]"><div className="text-center"><h1 className="font-display text-5xl font-bold">Página no encontrada</h1><a className="mt-5 inline-block text-sm font-bold text-[#c06d48]" href="/">Volver a la tienda</a></div></div>} /></Switch></ErrorBoundary>;
}

const queryClient = new QueryClient();
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;