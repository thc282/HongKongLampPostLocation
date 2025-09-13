// 應用程式主類
class LampPostApp {
    constructor() {
        this.elements = {};
        this.currentData = {
            latitude: null,
            longitude: null,
            title: '位置資訊'
        };
        this.config = {
            breakpoint: 600,
            apis: {
                lamppost: 'https://api.csdi.gov.hk/apim/dataquery/api/?id=hyd_rcd_1629267205229_84645&layer=lamppost&limit=10&offset=0',
                slope: 'https://www.slope.landsd.gov.hk/smris/getSlopeTechInfo?sn=',
                slopeProxy: 'https://api.allorigins.win/get?url='
            }
        };

        document.addEventListener('DOMContentLoaded', () => {
            this.initElements();
            this.bindEvents();
            this.startClock();
        });
    }

    // 初始化所有DOM元素
    initElements() {
        const elementIds = [
            'queryMode', 'lampContainer', 'lampName', 'slopeContainer',
            'slopePart1', 'slopePart2', 'slopePart3', 'slopePart4', 'slopePart5',
            'hk80Container', 'hk80X', 'hk80Y', 'travelMode', 'navigateCheckbox',
            'drivingModeCheckbox', 'searchForm', 'coordinateInfo',
            'latDisplay', 'lngDisplay', 'latlngDisplay', 'openMapBtn', 'themeBtn', 'datetime',
            'copyLatBtn', 'copyLngBtn', 'copyBothBtn'
        ];

        elementIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) {
                console.warn(`Element with id "${id}" not found in DOM.`);
            }
            this.elements[id] = el; 
        });
    }

    // 綁定所有事件
    bindEvents() {
        // 查詢模式切換
        this.elements.queryMode?.addEventListener('change', () => this.handleQueryModeChange());
        
        // 表單提交
        this.elements.searchForm?.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // 地圖按鈕
        this.elements.openMapBtn?.addEventListener('click', (e) => this.handleMapButtonClick(e));
        
        // 主題切換
        this.elements.themeBtn?.addEventListener('click', () => this.toggleTheme());
        
        // 駕駛模式處理
        this.elements.navigateCheckbox?.addEventListener('change', (e) => this.handleDrivingMode(e.target.checked));
        
        // 複製按鈕
        this.elements.copyLatBtn?.addEventListener('click', () => this.copyToClipboard('lat'));
        this.elements.copyLngBtn?.addEventListener('click', () => this.copyToClipboard('lng'));
        this.elements.copyBothBtn?.addEventListener('click', () => this.copyToClipboard('both'));
        
        // 斜坡輸入處理
        this.setupSlopeInputHandlers();
        
        // 窗口大小變化
        window.addEventListener('resize', () => this.handleResize());
    }

    // 查詢模式切換處理
    handleQueryModeChange() {
        const mode = this.elements.queryMode.value;
        const containers = {
            lamp: this.elements.lampContainer,
            slope: this.elements.slopeContainer,
            hk80: this.elements.hk80Container
        };

        Object.keys(containers).forEach(key => {
            if (containers[key]) {
                if (key === mode) {
                    containers[key].classList.remove('hidden');
                    if (key === 'hk80') {
                        containers[key].style.display = 'flex';
                    }
                } else {
                    containers[key].classList.add('hidden');
                }
            }
        });
    }

    // 表單提交處理
    handleFormSubmit(event) {
        event.preventDefault();

        const mode = this.elements.queryMode.value;
        const searchMethods = {
            lamp: () => this.searchLamp(),
            slope: () => this.searchSlope(),
            hk80: () => this.searchHK80()
        };

        if (searchMethods[mode]) {
            searchMethods[mode]();
        } else {
            this.showAlert('請選擇查詢模式!');
        }
    }

    // 路燈查詢
    async searchLamp() {
        const lampName = this.elements.lampName.value.toUpperCase();
        
        if (!lampName) {
            this.showAlert('請輸入燈柱編號!');
            return;
        }

        this.elements.lampName.value = lampName;
        
        try {
            const url = `${this.config.apis.lamppost}&Lamp_Post_Number=${lampName}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.numberMatched > 0) {
                const { Latitude: lat, Longitude: lng } = data.features[0].properties;
                this.displayCoordinates(lat, lng, `路燈: ${lampName}`);
            } else {
                this.showAlert('沒有該路燈位置及資訊!');
            }
        } catch (error) {
            console.error('路燈查詢錯誤:', error);
            this.showAlert('查詢過程中發生錯誤!');
        }
    }

    // 斜坡查詢
    async searchSlope() {
        const parts = [
            this.elements.slopePart1.value,
            this.elements.slopePart2.value,
            this.elements.slopePart3.value,
            this.elements.slopePart4.value,
            this.elements.slopePart5.value.toUpperCase()
        ];

        if (parts.some(part => !part)) {
            this.showAlert('請填入完整的斜坡編號! (格式: XX方向-級別/類型編號)');
            return;
        }

        const slopeNumber = `${parts[0]}${parts[1]}-${parts[2]}/${parts[3]}${parts[4]}`;
        console.log('查詢斜坡編號:', slopeNumber);

        const urls = [
            `${this.config.apis.slope}${encodeURIComponent(slopeNumber)}`,
            `${this.config.apis.slopeProxy}${encodeURIComponent(this.config.apis.slope + slopeNumber)}`
        ];

        await this.tryFetchWithProxy(urls, slopeNumber);
    }

    // 代理服務嘗試
    async tryFetchWithProxy(urls, slopeNumber) {
        for (let i = 0; i < urls.length; i++) {
            try {
                const response = await fetch(urls[i]);
                //console.log('代理請求回應:', urls[0]);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                const slopeData = data.contents ? JSON.parse(data.contents) : data;
                
                if (!slopeData || slopeData.length === 0) {
                    this.showAlert('找不到該斜坡資料!');
                    return;
                }

                const { NORTHING, EASTING } = slopeData[0];
                const coordinate = new Conversion().gridToLatLng({ x: EASTING, y: NORTHING });
                this.displayCoordinates(coordinate.lat, coordinate.lng, `斜坡: ${slopeNumber}`);
                return;
            } catch (error) {
                console.error(`代理 ${i + 1} 失敗:`, error);
                if (i === urls.length - 1) {
                    this.showAlert('無法連接到斜坡資料庫，請稍後再試!');
                }
            }
        }
    }

    // HK80座標查詢
    searchHK80() {
        const x = this.elements.hk80X.value;
        const y = this.elements.hk80Y.value;

        if (!x || !y) {
            this.showAlert('請輸入東經及北緯座標!');
            return;
        }

        const coordinate = new Conversion().gridToLatLng({ x, y });
        this.displayCoordinates(coordinate.lat, coordinate.lng, `HK80座標: ${x}, ${y}`);
    }

    // 顯示座標資訊
    displayCoordinates(latitude, longitude, title = '位置資訊') {
        this.currentData = { latitude, longitude, title };
        
        this.elements.latDisplay.textContent = latitude.toFixed(6);
        this.elements.lngDisplay.textContent = longitude.toFixed(6);
        this.elements.latlngDisplay.textContent = `${longitude.toFixed(6)}, ${latitude.toFixed(6)}`;
        
        this.updateTitle(title);
        this.elements.coordinateInfo.classList.remove('hidden');
        this.elements.coordinateInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 更新標題
    updateTitle(title) {
        const titleElement = document.getElementById('coordinateTitle');
        if (!titleElement) return;

        const isNarrowScreen = window.innerWidth < this.config.breakpoint;
        const displayTitle = (isNarrowScreen && title.includes(':')) 
            ? title.replace(':', ':<br>') 
            : title;
        
        titleElement.innerHTML = displayTitle;
    }

    // 地圖按鈕點擊處理
    handleMapButtonClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.currentData.latitude && this.currentData.longitude) {
            this.openMap(this.currentData.latitude, this.currentData.longitude);
        } else {
            this.showAlert('請先獲取位置資料!');
        }
    }

    // 打開地圖
    openMap(latitude, longitude) {
        const encodedAddress = encodeURIComponent(`${latitude},${longitude}`);
        const isNavigate = this.elements.navigateCheckbox.checked;
        const travelMode = this.elements.travelMode.value;
        const isDriving = this.elements.drivingModeCheckbox.checked;

        const urls = this.buildMapUrls(encodedAddress, isNavigate, travelMode, isDriving);
        const isIPhone = /\(i[^;]+;( U;)? CPU.+Mac OS X/.test(navigator.userAgent);

        if (isIPhone) {
            window.location.href = urls.apple;
        } else {
            window.open(urls.google, '_blank');
        }
    }

    // 構建地圖URL
    buildMapUrls(encodedAddress, isNavigate, travelMode, isDriving) {
        const baseUrls = {
            google: 'https://maps.google.com/maps/',
            apple: 'https://maps.apple.com/maps/'
        };

        let googleUrl = baseUrls.google;
        let appleUrl = baseUrls.apple;

        if (isNavigate) {
            googleUrl += `dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}`;
            const appleMode = travelMode === 'transit' ? 'r' : travelMode[0];
            appleUrl += `?daddr=${encodedAddress}&dirflg=${appleMode}`;
            
            if (isDriving) {
                googleUrl += '&dir_action=navigate';
            }
        } else {
            googleUrl += `search/?api=1&query=${encodedAddress}`;
            appleUrl += `?q=${encodedAddress}`;
        }

        return { google: googleUrl, apple: appleUrl };
    }

    // 駕駛模式處理
    handleDrivingMode(isNavigateChecked) {
        this.elements.drivingModeCheckbox.disabled = !isNavigateChecked;
        const label = document.querySelector('label[for="drivingModeCheckbox"]');
        label?.classList.toggle('disabled', !isNavigateChecked);
    }

    // 主題切換
    toggleTheme() {
        const selectors = ['.sun-icon', '.moon-icon', '.github-icon'];
        const classes = ['animate-sun', 'animate-moon', 'animate-github-icon'];
        
        selectors.forEach((selector, index) => {
            document.querySelector(selector)?.classList.toggle(classes[index]);
        });
        
        document.body.classList.toggle('dark-mode');
    }

    // 設置斜坡輸入處理器
    setupSlopeInputHandlers() {
        const parts = ['slopePart1', 'slopePart2', 'slopePart3', 'slopePart4', 'slopePart5'];
        
        parts.forEach((partId, index) => {
            const element = this.elements[partId];
            if (!element) return;

            if (index === 4) {
                // Part 5: 限制4位數字
                element.addEventListener('input', (e) => {
                    // 只保留數字
                    let value = e.target.value.replace(/\D/g, '');
                    // 限制最多4位
                    if (value.length > 4) {
                        value = value.slice(0, 4);
                    }
                    e.target.value = value;
                });
            } else {
                // Parts 1-4: 選擇框自動跳轉
                element.addEventListener('change', (e) => {
                    if (e.target.value && this.elements[parts[index + 1]]) {
                        this.elements[parts[index + 1]].focus();
                    }
                });
            }

            // 退格鍵處理
            if (index > 0) {
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !e.target.value && this.elements[parts[index - 1]]) {
                        this.elements[parts[index - 1]].focus();
                        e.preventDefault();
                    }
                });
            }
        });
    }

    // 窗口大小變化處理
    handleResize() {
        if (this.currentData.title) {
            this.updateTitle(this.currentData.title);
        }
    }

    // 時鐘
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-TW', { hour12: false });
            const dateString = now.toLocaleDateString('zh-TW');
            
            if (this.elements.datetime) {
                this.elements.datetime.innerHTML = `${dateString}<br><br>${timeString}`;
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    // 顯示警告
    showAlert(message) {
        alert(message);
    }

    // 複製到剪貼板
    async copyToClipboard(type) {
        if (!this.currentData.latitude || !this.currentData.longitude) {
            this.showAlert('沒有可複製的座標資料!');
            return;
        }

        let textToCopy = '';
        let buttonElement = null;

        switch (type) {
            case 'lat':
                textToCopy = this.currentData.latitude.toFixed(6);
                buttonElement = this.elements.copyLatBtn;
                break;
            case 'lng':
                textToCopy = this.currentData.longitude.toFixed(6);
                buttonElement = this.elements.copyLngBtn;
                break;
            case 'both':
                textToCopy = `${this.currentData.longitude.toFixed(6)}, ${this.currentData.latitude.toFixed(6)}`;
                buttonElement = this.elements.copyBothBtn;
                break;
            default:
                return;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                // 使用現代 Clipboard API
                await navigator.clipboard.writeText(textToCopy);
            } else {
                // 回退到舊方法
                this.fallbackCopyToClipboard(textToCopy);
            }
            
            this.showCopySuccess(buttonElement, type);
        } catch (error) {
            console.error('複製失敗:', error);
            this.showAlert('複製失敗，請手動複製座標');
        }
    }

    // 回退複製方法（適用於不支持 Clipboard API 的環境）
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (error) {
            throw new Error('Fallback copy failed');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // 顯示複製成功動畫
    showCopySuccess(buttonElement, type) {
        if (!buttonElement) return;

        // 添加成功樣式
        buttonElement.classList.add('copied');
        
        // 更新提示文字
        const messages = {
            lat: '已複製緯度',
            lng: '已複製經度',
            both: '已複製經緯度'
        };
        
        buttonElement.title = messages[type] || '已複製';

        // 1.5秒後恢復原樣
        setTimeout(() => {
            buttonElement.classList.remove('copied');
            const originalMessages = {
                lat: '複製緯度',
                lng: '複製經度',
                both: '複製經緯度'
            };
            buttonElement.title = originalMessages[type] || '複製';
        }, 1500);
    }
}

// 初始化應用程式
const app = new LampPostApp();

// 全局函數（用於HTML onclick，如果需要的話）
function handleDrivingMode(checked) {
    app.handleDrivingMode(checked);
}