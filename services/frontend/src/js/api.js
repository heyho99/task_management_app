/**
 * API通信用のクライアントライブラリ
 */

// APIエンドポイントのベースURL
const API_ENDPOINTS = {
    auth: 'http://localhost:8001/api',  // 認証サービス - "/api/v1"から"/api"に変更
    task: 'http://localhost:8002/api/v1',  // タスクサービス
    time: 'http://localhost:8003/api/v1',  // 時間サービス
    group: 'http://localhost:8004/api/v1', // グループサービス
    report: 'http://localhost:8005/api/v1' // レポートサービス
};

/**
 * 認証用トークンの取得
 * @returns {string} 認証トークン
 */
function getAuthToken() {
    return localStorage.getItem('auth_token') || '';
}

/**
 * API呼び出しのための共通関数
 * @param {string} service - サービス名（auth, task, time, group, report）
 * @param {string} endpoint - エンドポイントパス
 * @param {string} method - HTTPメソッド
 * @param {Object} data - リクエストボディ
 * @param {boolean} requiresAuth - 認証が必要かどうか
 * @returns {Promise} レスポンスデータのPromise
 */
async function apiCall(service, endpoint, method = 'GET', data = null, requiresAuth = true) {
    const baseUrl = API_ENDPOINTS[service];
    if (!baseUrl) {
        throw new Error(`不明なサービス: ${service}`);
    }

    const url = `${baseUrl}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 認証トークンが必要な場合は追加
    if (requiresAuth) {
        const token = getAuthToken();
        if (!token) {
            // 未認証の場合はログインページへリダイレクト
            window.location.href = '/login.html';
            return Promise.reject(new Error('認証が必要です'));
        }
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
        credentials: 'include' // クッキーを含める
    };
    
    // データがある場合はJSONに変換してリクエストボディに追加
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        // レスポンスをJSONとしてパース
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }
        
        // エラーレスポンスの場合
        if (!response.ok) {
            const error = new Error(responseData.detail || '不明なエラーが発生しました');
            error.statusCode = response.status;
            error.responseData = responseData;
            throw error;
        }
        
        return responseData;
    } catch (error) {
        // 認証エラーの場合
        if (error.statusCode === 401) {
            // リフレッシュトークンを使って再認証
            try {
                await refreshToken();
                // 再認証成功したら、元のリクエストを再試行
                return apiCall(service, endpoint, method, data, requiresAuth);
            } catch (refreshError) {
                // リフレッシュに失敗した場合はログインページへ
                localStorage.removeItem('auth_token');
                window.location.href = '/login.html';
                throw refreshError;
            }
        }
        
        // その他のエラー
        throw error;
    }
}

/**
 * リフレッシュトークンを使った再認証
 * @returns {Promise} 認証結果のPromise
 */
async function refreshToken() {
    const response = await fetch(`${API_ENDPOINTS.auth}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include' // クッキーを含める
    });
    
    if (!response.ok) {
        throw new Error('再認証に失敗しました');
    }
    
    const data = await response.json();
    localStorage.setItem('auth_token', data.access_token);
    return data;
}

/**
 * エラーメッセージの表示
 * @param {Error} error - エラーオブジェクト
 * @param {string} elementId - エラーメッセージを表示する要素のID
 */
function displayError(error, elementId = 'error-message') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = error.message || '不明なエラーが発生しました';
        errorElement.style.display = 'block';
        
        // 5秒後に非表示
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
    
    console.error('API Error:', error);
}

// 認証系API
const authApi = {
    login: (username, password) => 
        apiCall('auth', '/v1/auth/login', 'POST', { username, password }, false),
    
    logout: () => 
        apiCall('auth', '/v1/auth/logout', 'POST'),
    
    register: (userData) => 
        apiCall('auth', '/v1/users', 'POST', userData, false),
    
    getUserProfile: () => 
        apiCall('auth', '/v1/users/me', 'GET')
};

// タスク系API
const taskApi = {
    getTasks: (params = {}) => 
        apiCall('task', '/tasks', 'GET'),
    
    getTask: (taskId) => 
        apiCall('task', `/tasks/${taskId}`, 'GET'),
    
    createTask: (taskData) => 
        apiCall('task', '/tasks', 'POST', taskData),
    
    updateTask: (taskId, taskData) => 
        apiCall('task', `/tasks/${taskId}`, 'PUT', taskData),
    
    deleteTask: (taskId) => 
        apiCall('task', `/tasks/${taskId}`, 'DELETE'),
    
    calculateInitialValues: (formData) => 
        apiCall('task', '/tasks/calculate-initial-values', 'POST', formData),
    
    getSubtasks: (taskId) => 
        apiCall('task', `/subtasks/task/${taskId}`, 'GET'),
    
    createSubtask: (taskId, subtaskData) => 
        apiCall('task', `/subtasks/task/${taskId}`, 'POST', subtaskData),
    
    updateSubtask: (subtaskId, subtaskData) => 
        apiCall('task', `/subtasks/${subtaskId}`, 'PUT', subtaskData),
    
    deleteSubtask: (subtaskId) => 
        apiCall('task', `/subtasks/${subtaskId}`, 'DELETE')
};

// 時間系API（仮実装例）
const timeApi = {
    getWorkTimes: (taskId) => 
        apiCall('time', `/work-times/task/${taskId}`, 'GET'),
    
    createWorkTime: (workTimeData) => 
        apiCall('time', '/work-times', 'POST', workTimeData)
};

// グローバルに公開
window.ApiClient = {
    auth: authApi,
    task: taskApi,
    time: timeApi,
    displayError
};