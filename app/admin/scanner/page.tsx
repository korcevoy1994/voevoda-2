'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import type { OrderItemWithSeatDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Settings, Volume2, VolumeX, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ScanResult = {
  orderId: string;
  seatId: string;
};

type TicketStatus = 'valid' | 'used' | 'invalid' | null;

export default function ScannerPage() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  // Основные состояния по логике
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [modalOpen, setModalOpen] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<OrderItemWithSeatDetails | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [scanCooldown, setScanCooldown] = useState(false);
  
  // Дополнительные состояния
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>(null);

  // Инициализация сканера
  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode('qr-reader');
    }
    
    return () => {
      cleanupScanner();
    };
  }, []);

  // Очистка сканера
  const cleanupScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.log('Ошибка при очистке сканера:', err);
      }
    }
    setIsScanning(false);
  }, []);

  // Voice synthesis setup
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) {
        speechSynthesis.onvoiceschanged = () => {
          // Voices loaded
        };
      }
    }
  }, []);

  const speak = (text: string) => {
    if (!soundEnabled || mode !== 'auto' || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.volume = 1;
    utterance.pitch = 1.1;
    
    const voices = speechSynthesis.getVoices();
    const preferredVoices = [
      'Google UK English Female',
      'Google UK English Male', 
      'Google US English',
      'Samantha',
      'Alex',
      'Victoria'
    ];
    
    const goodVoice = voices.find(voice => 
      preferredVoices.includes(voice.name) || 
      (voice.lang.includes('en') && voice.name.includes('Google'))
    );
    
    if (goodVoice) {
      utterance.voice = goodVoice;
    }
    
    speechSynthesis.speak(utterance);
  };

  const showModal = useCallback((message: string, ticket?: OrderItemWithSeatDetails | null, status?: TicketStatus) => {
    setNotificationMessage(message);
    setScannedTicket(ticket || null);
    setTicketStatus(status || null);
    setModalOpen(true);
    
    // Автоматически закрываем модалку через 3 секунды в авто режиме
    if (mode === 'auto') {
      setTimeout(() => {
        setModalOpen(false);
        setScannedTicket(null);
        setTicketStatus(null);
        // Включаем камеру снова
        if (scannerRef.current && !isScanning) {
          startScanning();
        }
      }, 3000);
    }
  }, [mode, isScanning]);

  const startScanning = useCallback(async () => {
    console.log('🚀 startScanning вызван:', { 
      isScanning, 
      mode, 
      hasScanner: !!scannerRef.current,
      scannerState: scannerRef.current?.getState(),
      scanCooldown
    });
    
    if (isScanning) {
      console.log('⚠️ Сканер уже запущен, пропускаем');
      return;
    }
    
    console.log('✅ Запуск сканера в режиме:', mode);
    setIsScanning(true);
    
    // В ручном режиме сбрасываем cooldown при запуске сканера
    if (mode === 'manual') {
      console.log('🔓 Сбрасываем scanCooldown в ручном режиме');
      setScanCooldown(false);
      setLastScannedCode('');
    }
    
    try {
      // Убеждаемся, что у нас есть экземпляр сканера
      if (!scannerRef.current) {
        console.log('🆕 Создание нового экземпляра сканера');
        scannerRef.current = new Html5Qrcode('qr-reader');
      }
      
      console.log('🎥 Запускаем камеру...');
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        (errorMessage) => { console.log('📷 Ошибка камеры:', errorMessage) }
      );
      
      console.log('✅ Сканер успешно запущен');
    } catch (err) {
      console.error('❌ Ошибка запуска сканера:', err);
      toast.error('Не удалось запустить камеру. Проверьте разрешения.');
      setIsScanning(false);
    }
  }, [isScanning, mode, scanCooldown]);

  const stopScanning = useCallback(async () => {
    console.log('🛑 stopScanning вызван:', { 
      hasScanner: !!scannerRef.current,
      scannerState: scannerRef.current?.getState(),
      isScanning
    });
    
    if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        console.log('🛑 Останавливаем сканер...');
        await scannerRef.current.stop();
        console.log('✅ Сканер остановлен');
      } catch (err) {
        console.error("❌ Ошибка при остановке сканера", err);
      }
    } else {
      console.log('ℹ️ Сканер уже остановлен или не запущен');
    }
    setIsScanning(false);
  }, [isScanning]);
  
  const onScanSuccess = useCallback(async (decodedText: string) => {
    console.log('📱 onScanSuccess вызван:', { 
      decodedText: decodedText.substring(0, 20) + '...',
      mode,
      scanCooldown,
      lastScannedCode: lastScannedCode.substring(0, 20) + '...',
      isScanning
    });
    
    // В ручном режиме игнорируем сканирование если сканер не запущен
    if (mode === 'manual' && !isScanning) {
      console.log('🚫 Ручной режим: сканер не запущен, игнорируем сканирование');
      return;
    }
    
    // Защита от двойного сканирования (дебаунсинг)
    if (scanCooldown || decodedText === lastScannedCode) {
      console.log('🚫 Сканирование заблокировано: cooldown или дубликат');
      return;
    }
    
    console.log('✅ Обрабатываем сканирование');
    
    // Устанавливаем защиту от повторного сканирования
    setScanCooldown(true);
    setLastScannedCode(decodedText);
    
    // В автоматическом режиме останавливаем сканер
    if (mode === 'auto') {
      console.log('🛑 Останавливаем сканер в авто режиме');
      await stopScanning();
    }
    
    setLoading(true);
    
    try {
      const { orderId, seatId } = JSON.parse(decodedText) as ScanResult;
      console.log('🔍 Поиск билета:', { orderId, seatId });

      const { data, error } = await supabase
        .from('order_items')
        .select(`
            *,
            orders (*),
            seats (
                *,
                zones (*)
            )
        `)
        .eq('order_id', orderId)
        .eq('seat_id', seatId)
        .single();
      
      if (error || !data) {
        throw new Error('Билет не найден');
      }
      
      const item: any = data;
      const ticketData = {
        id: item.id,
        order_id: item.orders.id,
        seat_id: item.seats.id,
        price: item.price,
        seat: {
          id: item.seats.id,
          status: item.seats.status,
          row_number: item.seats.row_number,
          seat_number: item.seats.seat_number,
          zone: {
            id: item.seats.zones.id,
            name: item.seats.zones.name,
            color: item.seats.zones.color,
          },
        },
      };

      console.log('🎫 Билет найден:', { 
        status: item.seats.status, 
        zone: ticketData.seat.zone.name,
        row: ticketData.seat.row_number,
        seat: ticketData.seat.seat_number
      });

      if (mode === 'auto') {
        // Автоматический режим
        if (item.seats.status === 'sold') {
          // Билет найден и не использован
          const info = `${ticketData.seat.zone.name} - Ряд ${ticketData.seat.row_number}, Место ${ticketData.seat.seat_number}`;
          console.log('✅ Показываем модалку успеха');
          showModal(`Билет действителен! ${info}`, ticketData, 'valid');
          speak('Success');
          
          // Автоматически отмечаем как использованный
          setTimeout(async () => {
            console.log('🔄 Автоматически отмечаем билет как использованный');
            await markAsUsed(ticketData);
          }, 1000);
        } else if (item.seats.status === 'used') {
          // Билет уже использован
          console.log('❌ Билет уже использован');
          showModal('Билет уже использован!', null, 'used');
          speak('Error');
        } else {
          // Недействительный билет
          console.log('⚠️ Недействительный билет');
          showModal('Недействительный билет!', null, 'invalid');
          speak('Error');
        }
      } else {
        // Ручной режим
        console.log('✋ Ручной режим - показываем информацию о билете');
        setScannedTicket(ticketData);
        if (item.seats.status === 'sold') {
          setTicketStatus('valid');
        } else if (item.seats.status === 'used') {
          setTicketStatus('used');
        } else {
          setTicketStatus('invalid');
        }
        await stopScanning(); // Останавливаем камеру в ручном режиме
      }

    } catch (err) {
      console.error('❌ Ошибка обработки QR-кода:', err);
      if (mode === 'auto') {
        showModal('Ошибка! Неверный QR-код!', null, 'invalid');
        speak('Error');
      } else {
        setTicketStatus('invalid');
        await stopScanning();
      }
      toast.error('Ошибка! Неверный формат QR-кода или билет не найден.');
    } finally {
      setLoading(false);
      
      // Снимаем защиту от повторного сканирования через 2 секунды только в авто режиме
      if (mode === 'auto') {
        setTimeout(() => {
          console.log('🔓 Снимаем защиту от повторного сканирования (авто режим)');
          setScanCooldown(false);
        }, 2000);
      } else {
        console.log('✋ Ручной режим - scanCooldown будет сброшен при следующем запуске сканера');
      }
    }
  }, [mode, scanCooldown, lastScannedCode, stopScanning, showModal]);

  const markAsUsed = useCallback(async (data?: OrderItemWithSeatDetails) => {
    const ticketData = data || scannedTicket;
    if (!ticketData?.seat.id) {
      console.log('⚠️ markAsUsed: нет данных билета');
      return;
    }
    
    console.log('🔄 markAsUsed вызван:', { 
      mode, 
      seatId: ticketData.seat.id,
      orderId: ticketData.order_id 
    });
    
    setLoading(true);
    try {
      // Обновляем статус места
      console.log('💾 Обновляем статус места в БД...');
      const { error: seatError } = await supabase
        .from('seats')
        .update({ status: 'used' })
        .eq('id', ticketData.seat.id);

      if (seatError) throw seatError;
      console.log('✅ Статус места обновлен');
      
      // Обновляем статус заказа
      console.log('💾 Обновляем статус заказа в БД...');
      const { error: orderError } = await supabase.rpc('exec_sql', {
        sql_query: `
          UPDATE orders 
          SET status = CASE 
            WHEN (
              SELECT COUNT(*) = COUNT(CASE WHEN s.status = 'used' THEN 1 END)
              FROM order_items oi
              JOIN seats s ON oi.seat_id = s.id
              WHERE oi.order_id = '${ticketData.order_id}'
            ) THEN 'completed'
            ELSE 'partially_used'
          END
          WHERE id = '${ticketData.order_id}'
        `
      });

      if (orderError) {
        console.warn('⚠️ Не удалось обновить статус заказа:', orderError);
      } else {
        console.log('✅ Статус заказа обновлен');
      }
      
      setTicketStatus('used');
      if (scannedTicket) {
        setScannedTicket({ ...scannedTicket, seat: { ...scannedTicket.seat, status: 'used' } });
      }
      
      // В ручном режиме сразу начинаем новое сканирование
      if (mode === 'manual') {
        console.log('🔄 Перезапуск сканера в ручном режиме после отметки');
        
        // Очищаем состояние
        setScannedTicket(null);
        setTicketStatus(null);
        setLastScannedCode('');
        setScanCooldown(false); // Принудительно сбрасываем cooldown
        
        // Небольшая задержка перед перезапуском
        setTimeout(() => {
          console.log('🚀 Запускаем новое сканирование');
          startScanning();
        }, 500);
      }
      
    } catch (err) {
      console.error('❌ Ошибка обновления статуса:', err);
      toast.error('Не удалось обновить статус билета.');
    } finally {
      setLoading(false);
    }
  }, [scannedTicket, mode, startScanning]);

  // Обработчик переключения режимов
  const handleModeChange = useCallback(async (newMode: boolean) => {
    const newModeValue = newMode ? 'auto' : 'manual';
    console.log('🔄 handleModeChange вызван:', { 
      currentMode: mode, 
      newMode: newModeValue, 
      isScanning, 
      hasScanner: !!scannerRef.current 
    });
    
    // Останавливаем текущий сканер при переключении режимов
    console.log('🛑 Останавливаем текущий сканер...');
    await cleanupScanner();
    
    // Очищаем состояние
    console.log('🧹 Очищаем состояние...');
    setScannedTicket(null);
    setTicketStatus(null);
    setModalOpen(false);
    setLastScannedCode('');
    setScanCooldown(false);
    setLoading(false);
    
    // Очищаем контейнер полностью
    const container = document.getElementById('qr-reader');
    if (container) {
      console.log('🗑️ Очищаем контейнер qr-reader');
      container.innerHTML = '';
    } else {
      console.warn('⚠️ Контейнер qr-reader не найден!');
    }
    
    // Небольшая задержка для полной очистки
    console.log('⏳ Ждем 500ms для очистки...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Создаем новый экземпляр сканера
    console.log('🆕 Создаем новый экземпляр Html5Qrcode');
    scannerRef.current = new Html5Qrcode('qr-reader');
    
    // Устанавливаем новый режим
    console.log('✅ Устанавливаем новый режим:', newModeValue);
    setMode(newModeValue);
    
    // Если переключаемся в автоматический режим, запускаем сканер
    if (newModeValue === 'auto') {
      console.log('🚀 Запуск автоматического режима через 300ms');
      setTimeout(() => {
        startScanning();
      }, 300);
    } else {
      console.log('✋ Переключение в ручной режим завершено');
    }
  }, [mode, isScanning, cleanupScanner, startScanning]);

  const resetScannerState = useCallback(() => {
    console.log('🔄 Принудительный сброс состояния сканера');
    setScannedTicket(null);
    setTicketStatus(null);
    setLastScannedCode('');
    setScanCooldown(false);
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    await cleanupScanner();
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Сканер Билетов</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowSettings(!showSettings)} 
              variant="outline" 
              size="sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => router.push('/admin/orders')} 
              variant="outline" 
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Заказы
            </Button>
            <Button onClick={handleLogout} variant="outline">Выйти</Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Настройки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-mode" className="text-sm font-medium">
                  Автоматический режим
                </Label>
                <Switch
                  id="auto-mode"
                  checked={mode === 'auto'}
                  onCheckedChange={handleModeChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="text-sm font-medium">
                  Звуковые оповещения
                </Label>
                <Switch
                  id="sound"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
              <p className="text-xs text-gray-500">
                {mode === 'auto'
                  ? 'Автоматически обрабатывает билеты с звуком' 
                  : 'Требует ручного подтверждения без звука'
                }
              </p>
            </CardContent>
          </Card>
        )}
        
        <div id="qr-reader" className="w-full bg-black rounded-lg overflow-hidden"></div>

        {/* Modal Overlay - Only in auto mode */}
        {modalOpen && mode === 'auto' && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className={`px-8 py-6 rounded-lg text-white font-bold text-2xl shadow-lg ${
              ticketStatus === 'valid' ? 'bg-green-500' :
              ticketStatus === 'used' ? 'bg-red-500' :
              'bg-yellow-500'
            }`}>
              {notificationMessage}
            </div>
          </div>
        )}

        {!isScanning && mode === 'manual' && (
          <div className="mt-6 flex justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center text-blue-600 mb-2">
                <Camera className="mr-2 h-5 w-5" />
                <span className="font-medium">Ручной режим</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={startScanning} size="sm" variant="outline" disabled={isScanning}>
                  {isScanning ? 'Камера работает' : 'Запустить камеру'}
                </Button>
                {isScanning && (
                  <Button onClick={stopScanning} size="sm" variant="outline">
                    Остановить камеру
                  </Button>
                )}
                <Button onClick={resetScannerState} size="sm" variant="outline">
                  <RefreshCw className="mr-1 h-3 w-3" /> Сброс
                </Button>
              </div>
            </div>
          </div>
        )}

        {mode === 'auto' && (
          <div className="mt-6 flex justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center text-green-600 mb-2">
                <Camera className="mr-2 h-5 w-5 animate-pulse" />
                <span className="font-medium">Автоматический режим активен</span>
              </div>
              <Button onClick={startScanning} size="sm" variant="outline" disabled={isScanning}>
                {isScanning ? 'Камера работает' : 'Запустить камеру'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Manual mode results */}
        {mode === 'manual' && (loading || ticketStatus) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Результат Сканирования</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <div>
                  {ticketStatus === 'valid' && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="mr-2" />
                      <span className="font-medium">Билет действителен</span>
                    </div>
                  )}
                  {ticketStatus === 'used' && (
                    <div className="flex items-center text-red-600">
                      <XCircle className="mr-2" />
                      <span className="font-medium">Билет уже был использован</span>
                    </div>
                  )}
                  {ticketStatus === 'invalid' && (
                    <div className="flex items-center text-yellow-600">
                      <AlertTriangle className="mr-2" />
                      <span className="font-medium">Недействительный билет</span>
                    </div>
                  )}
                  
                  {scannedTicket && (
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Информация о билете:</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">ID заказа:</span>
                            <span className="font-mono text-xs">{scannedTicket.order_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Зона:</span>
                            <span className="font-medium">{scannedTicket.seat.zone.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ряд:</span>
                            <span className="font-medium">{scannedTicket.seat.row_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Место:</span>
                            <span className="font-medium">{scannedTicket.seat.seat_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Цена:</span>
                            <span className="font-medium">{scannedTicket.price} ₽</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Статус места:</span>
                            <span className={`font-medium ${
                              scannedTicket.seat.status === 'sold' ? 'text-green-600' :
                              scannedTicket.seat.status === 'used' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {scannedTicket.seat.status === 'sold' ? 'Продан' :
                               scannedTicket.seat.status === 'used' ? 'Использован' :
                               'Неизвестно'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {ticketStatus === 'valid' && (
                    <Button onClick={() => markAsUsed()} className="w-full mt-4 bg-green-600 hover:bg-green-700">
                      Отметить как использованный
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 