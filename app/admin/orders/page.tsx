'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Search, 
  RefreshCw, 
  LogOut,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type OrderWithDetails = {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  total_amount: number;
  status: string | null;
  created_at: string | null;
  pdf_url: string | null;
  items: {
    id: string;
    price: number;
    seat: {
      id: string;
      row_number: number;
      seat_number: number;
      status: string | null;
      zone: {
        name: string;
        color: string;
      };
    };
  }[];
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            price,
            seats (
              id,
              row_number,
              seat_number,
              status,
              zones (
                name,
                color
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersWithDetails = data?.map((order: any) => ({
        id: order.id,
        user_name: order.user_name,
        user_email: order.user_email,
        user_phone: order.user_phone,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        pdf_url: order.pdf_url,
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          price: item.price,
          seat: {
            id: item.seats.id,
            row_number: item.seats.row_number,
            seat_number: item.seats.seat_number,
            status: item.seats.status,
            zone: {
              name: item.seats.zones.name,
              color: item.seats.zones.color,
            },
          },
        })) || [],
      })) || [];

      setOrders(ordersWithDetails);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" />Активный</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Завершен</Badge>;
      case 'partially_used':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertTriangle className="w-3 h-3 mr-1" />Частично использован</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const getSeatStatusBadge = (status: string | null) => {
    switch (status) {
      case 'sold':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Продан</Badge>;
      case 'used':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Использован</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_phone?.includes(searchTerm) ||
      order.id.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/admin/scanner')} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Сканер
            </Button>
            <h1 className="text-2xl font-bold">Все Заказы</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            <Button onClick={handleLogout} variant="outline">Выйти</Button>
          </div>
        </div>

        {/* Фильтры */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск по имени, email, телефону..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Все
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Активные
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('completed')}
                >
                  Завершенные
                </Button>
                <Button
                  variant={statusFilter === 'partially_used' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('partially_used')}
                >
                  Частично
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  Заказы не найдены
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {order.user_name}
                          {getStatusBadge(order.status)}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {order.user_email}
                          </div>
                          {order.user_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {order.user_phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {order.total_amount} ₽
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {order.id.slice(0, 8)}...
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Места:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                          >
                            <div>
                              <span className="font-medium">
                                {item.seat.zone.name} - Ряд {item.seat.row_number}, Место {item.seat.seat_number}
                              </span>
                              <div className="text-xs text-gray-500">
                                {item.price} ₽
                              </div>
                            </div>
                            {getSeatStatusBadge(item.seat.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 