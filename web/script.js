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
                lamppostProxy: 'https://hklamppost-proxy.thc282.workers.dev/lp/',
                slope: 'https://www.slope.landsd.gov.hk/smris/getSlopeTechInfo?sn=',
                fetchProxy: 'https://api.allorigins.win/get?url='
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
            'drivingModeCheckbox', 'searchForm', 'coordinateInfo', 'coordinateList',
            'coordinateTemplate', 'themeBtn', 'datetime'
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
        
        // 主題切換
        this.elements.themeBtn?.addEventListener('click', () => this.toggleTheme());

        // 駕駛模式處理
        this.elements.navigateCheckbox?.addEventListener('change', (e) => this.handleDrivingMode(e.target.checked));

        // 座標卡片動作
        this.elements.coordinateList?.addEventListener('click', (event) => this.handleCoordinateAction(event));
        
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
        const lampName = this.elements.lampName.value.trim().toUpperCase();
        
        if (!lampName) {
            this.showAlert('請輸入燈柱編號!');
            return;
        }

        this.elements.lampName.value = lampName;
        
        await this.tryFetchLampWithProxy(lampName);
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
            `${this.config.apis.fetchProxy}${encodeURIComponent(this.config.apis.slope + slopeNumber)}`
        ];

        await this.tryFetchSlopeWithProxy(urls, slopeNumber);
    }

    // 代理服務嘗試
    async tryFetchSlopeWithProxy(urls, slopeNumber) {
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
                this.displayCoordinates([
                    {
                        latitude: coordinate.lat,
                        longitude: coordinate.lng,
                        title: `斜坡: ${slopeNumber}`
                    }
                ]);
                return;
            } catch (error) {
                console.error(`代理 ${i + 1} 失敗:`, error);
                if (i === urls.length - 1) {
                    this.showAlert('無法連接到斜坡資料庫，請稍後再試!');
                }
            }
        }
    }

    async tryFetchLampWithProxy(lampName) {
        try {
            const url = `${this.config.apis.lamppostProxy}${lampName}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
        
            if (data.length > 0) {
                const coordinates = this.transformToCoordinatesList(data);
                const coordinateCards = coordinates.map((coordinate, index) => ({
                    latitude: coordinate.lat,
                    longitude: coordinate.lng,
                    title: coordinates.length > 1 ? `路燈: ${lampName} (${index + 1})` : `路燈: ${lampName}`
                }));
                this.displayCoordinates(coordinateCards);
            } else {
                this.showAlert('沒有該路燈位置及資訊!');
            }
        } catch (error) {
            console.error('路燈查詢錯誤:', error);
            this.showAlert('查詢過程中發生錯誤!');
        }
    }

    // 轉換為座標列表
    transformToCoordinatesList(data) {
        return data.map(({X, Y}) => 
            new Conversion().gridToLatLng({ x: X, y: Y })
        );
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
        this.displayCoordinates([
            {
                latitude: coordinate.lat,
                longitude: coordinate.lng,
                title: `HK80座標: ${x}, ${y}`
            }
        ]);
    }

    // 顯示座標資訊
    displayCoordinates(latitude, longitude, title = '位置資訊') {
        if (Array.isArray(latitude)) {
            this.renderCoordinates(latitude);
            return;
        }

        this.renderCoordinates([
            {
                latitude,
                longitude,
                title
            }
        ]);
    }

    renderCoordinates(coordinates) {
        const coordinateList = this.elements.coordinateList;
        const template = this.elements.coordinateTemplate;

        if (!coordinateList || !template) {
            console.warn('Coordinate list template is missing from the DOM.');
            return;
        }

        const normalizedCoordinates = coordinates.filter(({ latitude, longitude }) =>
            Number.isFinite(latitude) && Number.isFinite(longitude)
        );

        if (normalizedCoordinates.length === 0) {
            this.showAlert('沒有可顯示的座標資料!');
            return;
        }

        coordinateList.innerHTML = '';
        this.currentData = normalizedCoordinates[0];

        normalizedCoordinates.forEach((coordinate, index) => {
            const card = template.content.firstElementChild.cloneNode(true);
            const titleElement = card.querySelector('[data-coordinate-title]');
            const latDisplay = card.querySelector('[data-coordinate-lat]');
            const lngDisplay = card.querySelector('[data-coordinate-lng]');
            const latlngDisplay = card.querySelector('[data-coordinate-latlng]');
            const mapButton = card.querySelector('[data-coordinate-action="map"]');
            const displayTitle = coordinate.title || '位置資訊';

            card.dataset.latitude = coordinate.latitude.toFixed(6);
            card.dataset.longitude = coordinate.longitude.toFixed(6);
            card.dataset.title = displayTitle;
            card.dataset.index = String(index);

            if (titleElement) {
                titleElement.dataset.fullTitle = displayTitle;
                this.updateTitle(titleElement, displayTitle);
            }

            if (latDisplay) {
                latDisplay.textContent = coordinate.latitude.toFixed(6);
                latDisplay.dataset.latitude = coordinate.latitude.toFixed(6);
            }

            if (lngDisplay) {
                lngDisplay.textContent = coordinate.longitude.toFixed(6);
                lngDisplay.dataset.longitude = coordinate.longitude.toFixed(6);
            }

            if (latlngDisplay) {
                latlngDisplay.textContent = `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`;
                latlngDisplay.dataset.latitude = coordinate.latitude.toFixed(6);
                latlngDisplay.dataset.longitude = coordinate.longitude.toFixed(6);
            }

            if (mapButton) {
                mapButton.dataset.title = displayTitle;
                mapButton.title = `開啟地圖 - ${displayTitle}`;
                mapButton.setAttribute('aria-label', `開啟地圖 - ${displayTitle}`);
            }

            coordinateList.appendChild(card);
        });

        this.elements.coordinateInfo.classList.remove('hidden');
        this.elements.coordinateInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 更新標題
    updateTitle(titleElement, title) {
        if (!titleElement) return;

        const isNarrowScreen = window.innerWidth < this.config.breakpoint;
        const displayTitle = (isNarrowScreen && title.includes(':')) 
            ? title.replace(':', ':<br>') 
            : title;
        
        titleElement.innerHTML = displayTitle;
    }

    // 地圖按鈕點擊處理
    handleMapButtonClick({ latitude, longitude }) {
        if (latitude && longitude) {
            this.openMap(latitude, longitude);
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
        // const isIPhone = /\(i[^;]+;( U;)? CPU.+Mac OS X/.test(navigator.userAgent);

        // console.log('打開地圖URL:', isIPhone ? urls.apple : urls.google);
        
        // if (isIPhone) {
        //     window.location.href = urls.apple;
        // } else {
        //     window.open(urls.google, '_blank');
        // }


        // 暫時只使用 Google Map
        window.open(urls.google, '_blank');
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
        this.refreshCoordinateTitles();
    }

    refreshCoordinateTitles() {
        const titleElements = this.elements.coordinateList?.querySelectorAll('[data-coordinate-title]') ?? [];

        titleElements.forEach((titleElement) => {
            const title = titleElement.dataset.fullTitle || titleElement.textContent || '位置資訊';
            this.updateTitle(titleElement, title);
        });
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
    async copyToClipboard(type, coordinate, buttonElement) {
        if (!coordinate || !Number.isFinite(coordinate.latitude) || !Number.isFinite(coordinate.longitude)) {
            this.showAlert('沒有可複製的座標資料!');
            return;
        }

        const { latitude, longitude } = coordinate;
        let textToCopy = '';

        switch (type) {
            case 'lat':
                textToCopy = latitude.toFixed(6);
                break;
            case 'lng':
                textToCopy = longitude.toFixed(6);
                break;
            case 'both':
                // 改為 緯度,經度 順序 (Google Map 格式)
                textToCopy = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
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

    // 座標卡片點擊處理
    handleCoordinateAction(event) {
        const actionButton = event.target.closest('[data-coordinate-action]');

        if (!actionButton || !this.elements.coordinateList?.contains(actionButton)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const coordinateCard = actionButton.closest('.coordinate-card');
        const latitudeField = coordinateCard?.querySelector('[data-coordinate-lat]');
        const longitudeField = coordinateCard?.querySelector('[data-coordinate-lng]');
        const coordinate = {
            latitude: Number.parseFloat(latitudeField?.dataset.latitude || latitudeField?.textContent || ''),
            longitude: Number.parseFloat(longitudeField?.dataset.longitude || longitudeField?.textContent || '')
        };
        const action = actionButton.dataset.coordinateAction;

        switch (action) {
            case 'lat':
            case 'lng':
            case 'both':   
                this.copyToClipboard(action, coordinate, actionButton);
                break;
            case 'map':
                this.handleMapButtonClick(coordinate);
                break;  
            default:
                console.warn(`未知的座標操作: ${action}`);
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

        if (buttonElement._copySuccessTimeout) {
            clearTimeout(buttonElement._copySuccessTimeout);
            buttonElement._copySuccessTimeout = null;
        }

        const existingPopup = buttonElement.querySelector('.copy-success-popup');
        existingPopup?.remove();

        // 添加成功樣式
        buttonElement.classList.add('copied');
        
        // 更新提示文字
        const messages = {
            lat: '已複製緯度',
            lng: '已複製經度',
            both: '已複製經緯度'
        };

        const popup = document.createElement('span');
        popup.className = 'copy-success-popup';
        popup.setAttribute('role', 'status');
        popup.setAttribute('aria-live', 'polite');
        popup.textContent = messages[type] || '已複製';

        buttonElement.appendChild(popup);

        requestAnimationFrame(() => {
            popup.classList.add('visible');
        });

        // 1.5秒後恢復原樣
        buttonElement._copySuccessTimeout = setTimeout(() => {
            buttonElement.classList.remove('copied');
            popup.classList.remove('visible');

            setTimeout(() => {
                popup.remove();
            }, 200);
        }, 1500);
    }
}

// 初始化應用程式
const app = new LampPostApp();

// 全局函數（用於HTML onclick，如果需要的話）
function handleDrivingMode(checked) {
    app.handleDrivingMode(checked);
}
