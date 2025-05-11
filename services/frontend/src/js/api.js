/**
 * API通信用のクライアントライブラリ
 */

// APIエンドポイントのベースURL
const API_ENDPOINTS = {
    auth: 'http://localhost:8001/api',  // 認証サービス
    task: 'http://localhost:8002/api/v1',  // タスクサービス
    time: 'http://localhost:8003/api/v1',  // 時間サービス
    group: 'http://localhost:8004/api/v1', // グループサービス
    report: 'http://localhost:8005/api/v1' // レポートサービス
};

// モックデータを使用するフラグ
const USE_MOCK_DATA = false;

// グローバルに公開
window.API_ENDPOINTS = API_ENDPOINTS;

/**
 * 認証用トークンの取得
 * @returns {string} 認証トークン
 */
function getAuthToken() {
    const token = localStorage.getItem('auth_token') || '';
    console.log('Current auth token:', token);
    return token;
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
    // モックデータを使用する場合
    if (USE_MOCK_DATA && service === 'task') {
        console.log('Using mock data for:', endpoint);
        return getMockData(endpoint);
    }

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
        console.error('API呼び出しエラー:', error);
        
        // エラーが発生した場合はモックデータを使用
        if (USE_MOCK_DATA) {
            console.log('APIエラー発生: モックデータを使用します');
            return getMockData(endpoint);
        }
        
        throw error;
    }
}

/**
 * モックデータの取得
 * @param {string} endpoint - エンドポイント
 * @returns {Object} モックデータ
 */
function getMockData(endpoint) {
    // タスク一覧のモックデータ
    if (endpoint === '/tasks/') {
        return [
            {
                task_id: 1,
                user_id: 1,
                task_name: "サンプルタスク1",
                task_content: "これはサンプルタスクの説明です。",
                start_date: "2023-05-01",
                due_date: "2023-05-30",
                category: "開発",
                target_time: 120,
                progress: 30,
                subtasks: [
                    {
                        subtask_id: 1,
                        task_id: 1,
                        subtask_name: "サブタスク1",
                        contribution_value: 50,
                        progress: 60
                    }
                ]
            },
            {
                task_id: 2,
                user_id: 1,
                task_name: "サンプルタスク2",
                task_content: "もう一つのサンプルタスクです。",
                start_date: "2023-05-15",
                due_date: "2023-06-15",
                category: "テスト",
                target_time: 60,
                progress: 0,
                subtasks: []
            }
        ];
    }
    
    // 特定のタスク詳細のモックデータ
    if (endpoint.startsWith('/tasks/') && endpoint !== '/tasks/') {
        const taskId = parseInt(endpoint.split('/').pop());
        return {
            task_id: taskId,
            user_id: 1,
            task_name: `タスク ${taskId}`,
            task_content: `タスク ${taskId} の詳細説明`,
            start_date: "2023-05-01",
            due_date: "2023-05-30",
            category: "開発",
            target_time: 120,
            progress: 30,
            subtasks: []
        };
    }
    
    // サブタスクのモックデータ
    if (endpoint.startsWith('/subtasks/task/')) {
        const taskId = parseInt(endpoint.split('/').pop());
        return [
            {
                subtask_id: 1,
                task_id: taskId,
                subtask_name: `サブタスク1 for タスク${taskId}`,
                contribution_value: 50,
                progress: 60
            },
            {
                subtask_id: 2,
                task_id: taskId,
                subtask_name: `サブタスク2 for タスク${taskId}`,
                contribution_value: 30,
                progress: 0
            }
        ];
    }
    
    // デフォルトの空データ
    return [];
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
        apiCall('task', '/tasks/', 'GET'),
    
    getTask: (taskId) => 
        apiCall('task', `/tasks/${taskId}`, 'GET'),
    
    createTask: (taskData) => {
        // フィールド名を変換（フロントエンドのフォームフィールドはUI用の名前を使用している可能性があるため）
        const apiTaskData = {
            task_name: taskData.title || taskData.task_name,
            task_content: taskData.description || taskData.task_content,
            recent_schedule: taskData.recent_schedule,
            start_date: taskData.start_date,
            due_date: taskData.due_date,
            category: taskData.category,
            target_time: taskData.estimated_hours || taskData.target_time,
            comment: taskData.comment
        };
        return apiCall('task', '/tasks/', 'POST', apiTaskData);
    },
    
    updateTask: (taskId, taskData) => {
        // フィールド名を変換
        const apiTaskData = {
            task_name: taskData.title || taskData.task_name,
            task_content: taskData.description || taskData.task_content,
            recent_schedule: taskData.recent_schedule,
            start_date: taskData.start_date,
            due_date: taskData.due_date,
            category: taskData.category,
            target_time: taskData.estimated_hours || taskData.target_time,
            comment: taskData.comment
        };
        return apiCall('task', `/tasks/${taskId}`, 'PUT', apiTaskData);
    },
    
    deleteTask: (taskId) => 
        apiCall('task', `/tasks/${taskId}`, 'DELETE'),
    
    calculateInitialValues: (formData) => 
        apiCall('task', '/tasks/calculate-initial-values', 'POST', formData),
    
    getSubtasks: (taskId) => 
        apiCall('task', `/subtasks/task/${taskId}`, 'GET'),
    
    createSubtask: (taskId, subtaskData) => {
        // フィールド名を変換
        const apiSubtaskData = {
            subtask_name: subtaskData.title || subtaskData.subtask_name,
            contribution_value: subtaskData.contribution_value
        };
        return apiCall('task', `/subtasks/task/${taskId}`, 'POST', apiSubtaskData);
    },
    
    updateSubtask: (subtaskId, subtaskData) => {
        // フィールド名を変換
        const apiSubtaskData = {
            subtask_name: subtaskData.title || subtaskData.subtask_name,
            contribution_value: subtaskData.contribution_value
        };
        return apiCall('task', `/subtasks/${subtaskId}`, 'PUT', apiSubtaskData);
    },
    
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