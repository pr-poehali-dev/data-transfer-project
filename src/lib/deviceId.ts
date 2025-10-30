const DEVICE_ID_KEY = 'device-id';
const DEVICE_NAME_KEY = 'device-name';

function generateDeviceId(): string {
  const adjectives = [
    'Быстрый', 'Красный', 'Синий', 'Зелёный', 'Яркий',
    'Тихий', 'Громкий', 'Умный', 'Весёлый', 'Добрый'
  ];
  
  const nouns = [
    'Телефон', 'Ноутбук', 'Планшет', 'Компьютер', 'Устройство',
    'Гаджет', 'Смартфон', 'Макбук', 'Айфон', 'Андроид'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9999);
  
  return `${adjective}${noun}${number}`;
}

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

export function getDeviceName(): string {
  let deviceName = localStorage.getItem(DEVICE_NAME_KEY);
  
  if (!deviceName) {
    const userAgent = navigator.userAgent;
    
    if (/iPhone/.test(userAgent)) {
      deviceName = 'iPhone';
    } else if (/iPad/.test(userAgent)) {
      deviceName = 'iPad';
    } else if (/Android/.test(userAgent)) {
      deviceName = 'Android';
    } else if (/Mac/.test(userAgent)) {
      deviceName = 'Mac';
    } else if (/Windows/.test(userAgent)) {
      deviceName = 'Windows PC';
    } else if (/Linux/.test(userAgent)) {
      deviceName = 'Linux';
    } else {
      deviceName = 'Устройство';
    }
    
    localStorage.setItem(DEVICE_NAME_KEY, deviceName);
  }
  
  return deviceName;
}

export function setDeviceName(name: string) {
  localStorage.setItem(DEVICE_NAME_KEY, name);
}

export function resetDeviceId() {
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_NAME_KEY);
}
