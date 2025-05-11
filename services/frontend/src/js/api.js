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
const USE_MOCK_DATA = false; // 実際のAPIを使用する

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
async function apiCall(service, endpoint, method = 'GET', data = null, requiresAuth = false) {
    // モックデータを使用する場合
    if (USE_MOCK_DATA && service === 'task') {
        console.log('Using mock data for:', endpoint, method, data);
        return getMockData(endpoint, method, data);
    }

    const baseUrl = API_ENDPOINTS[service];
    if (!baseUrl) {
        throw new Error(`不明なサービス: ${service}`);
    }

    // エンドポイントが/で始まらない場合は追加する
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const url = `${baseUrl}${normalizedEndpoint}`;
    console.log(`API呼び出し: ${method} ${url}`, data);  // デバッグ用ログ追加
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // 認証トークンが必要な場合は追加
    if (requiresAuth) {
        const token = getAuthToken();
        if (!token) {
            // 一時的に認証なしでも続行できるようにする
            console.warn('認証なしでAPIを呼び出します');
        } else {
            headers['Authorization'] = `Bearer ${token}`;
        }
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
        console.log(`Fetch実行: ${method} ${url}`, options);
        const response = await fetch(url, options);
        console.log(`Fetchレスポンス: ${response.status} ${response.statusText}`);
        
        // レスポンスをJSONとしてパース
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            try {
                responseData = await response.json();
                console.log('JSONレスポンス:', responseData);
            } catch (jsonError) {
                console.error('JSONパースエラー:', jsonError);
                const text = await response.text();
                console.error('レスポンステキスト:', text);
                throw new Error(`JSONパースエラー: ${jsonError.message}\nレスポンス: ${text}`);
            }
        } else {
            responseData = await response.text();
            console.log('テキストレスポンス:', responseData);
        }
        
        // エラーレスポンスの場合
        if (!response.ok) {
            const errorMsg = typeof responseData === 'object' ? 
                responseData.detail || JSON.stringify(responseData) : 
                responseData || '不明なエラーが発生しました';
            
            console.error(`APIエラー [${response.status}]: ${errorMsg}`);
            
            const error = new Error(errorMsg);
            error.statusCode = response.status;
            error.responseData = responseData;
            error.url = url;
            error.method = method;
            throw error;
        }
        
        return responseData;
    } catch (error) {
        // 通信エラーかどうか確認
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.error('ネットワークエラー:', error);
            error.isFetchError = true;
            error.url = url;
            error.method = method;
            
            // バックエンドサーバーのURLを出力
            console.error(`APIエンドポイント: ${url}`);
            console.error('API_ENDPOINTS:', API_ENDPOINTS);
        }
        
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
        if (error.url && error.method) {
            console.error(`URL: ${error.url}, Method: ${error.method}`);
        }
        if (data) {
            console.error('送信データ:', data);
        }
        
        // エラーが発生した場合はモックデータを使用
        if (USE_MOCK_DATA) {
            console.log('APIエラー発生: モックデータを使用します');
            return getMockData(endpoint, method, data);
        }
        
        throw error;
    }
}

/**
 * モックデータの取得
 * @param {string} endpoint - エンドポイント
 * @param {string} method - HTTPメソッド
 * @param {Object} data - リクエストデータ
 * @returns {Object} モックデータ
 */
function getMockData(endpoint, method = 'GET', data = null) {
    console.log('Getting mock data for:', endpoint, method, data);
    
    // タスク一覧のモックデータ
    if (endpoint === '/tasks/' && method === 'GET') {
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
    if (endpoint.startsWith('/tasks/') && endpoint !== '/tasks/' && method !== 'POST') {
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
    
    // タスク作成のモックレスポンス
    if (endpoint === '/tasks/' && method === 'POST') {
        return {
            task_id: 999,
            user_id: 1,
            task_name: data?.task_name || "新規タスク",
            task_content: data?.task_content || "新規タスクの内容",
            recent_schedule: data?.recent_schedule || "",
            start_date: data?.start_date || "2023-05-01",
            due_date: data?.due_date || "2023-05-30",
            category: data?.category || "その他",
            target_time: data?.target_time || 60,
            comment: data?.comment || "",
            progress: 0
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
    
    // タスク初期値計算のモックデータ
    if (endpoint === '/tasks/calculate-initial-values') {
        const startDate = data?.start_date || new Date().toISOString().split('T')[0];
        const dueDate = data?.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const targetTime = data?.target_time || 120;
        const subtaskCount = data?.subtask_count || 1;
        
        // 日付の差分を計算
        const start = new Date(startDate);
        const end = new Date(dueDate);
        const daysDiff = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        
        // 日次計画値
        const dailyTaskPlans = [];
        const dailyTimePlans = [];
        const baseTaskPlanValue = 100 / daysDiff;
        const baseTimePlanValue = targetTime / daysDiff;
        
        for (let i = 0; i < daysDiff; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            dailyTaskPlans.push({
                date: dateStr,
                task_plan_value: baseTaskPlanValue
            });
            
            dailyTimePlans.push({
                date: dateStr,
                time_plan_value: baseTimePlanValue
            });
        }
        
        return {
            subtask_contribution_value: 100 / subtaskCount,
            daily_task_plans: dailyTaskPlans,
            daily_time_plans: dailyTimePlans
        };
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
 * @param {Error|Object} error - エラーオブジェクトまたはカスタムエラー情報
 * @param {string} elementId - エラーメッセージを表示する要素のID
 */
function displayError(error, elementId = 'error-message') {
    console.error('API Error:', error);
    
    // エラーがオブジェクトで、originalErrorプロパティがある場合は、そちらも出力
    if (error.originalError) {
        console.error('Original Error:', error.originalError);
    }
    
    let errorMessage = '';
    
    // エラーメッセージを取得
    if (typeof error === 'string') {
        errorMessage = error;
    } else if (error.message) {
        errorMessage = error.message;
    } else {
        errorMessage = '不明なエラーが発生しました';
    }
    
    // Fetchエラーやネットワークエラーの場合の特別なメッセージ
    if (error.isFetchError || 
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') ||
        (error.originalError && error.originalError.message && 
         error.originalError.message.includes('Failed to fetch'))) {
            
        errorMessage = 'サーバーとの通信に失敗しました。インターネット接続とバックエンドサーバーが正常に動作しているか確認してください。';
        
        // 問題のAPIエンドポイントを開発者向けに表示
        const url = error.url || (error.originalError && error.originalError.url);
        if (url) {
            console.error(`問題のエンドポイント: ${url}`);
            // 開発環境のみ詳細を表示
            errorMessage += '\n\n開発者向け情報:';
            errorMessage += `\nエンドポイント: ${url}`;
            errorMessage += '\nサーバーが起動しているか、正しいポートで実行されているか確認してください。';
        }
    }
    
    // APIエンドポイント情報を追加（開発中のみ）
    if (!errorMessage.includes('エンドポイント:') && error.url && process.env.NODE_ENV !== 'production') {
        errorMessage += `\n(エンドポイント: ${error.method || ''} ${error.url})`;
    }
    
    // レスポンスデータがある場合は詳細を追加
    if (error.responseData) {
        if (typeof error.responseData === 'object') {
            const details = JSON.stringify(error.responseData, null, 2);
            console.log('エラー詳細:', details);
            if (details.length < 100) {  // 短い場合のみ表示
                errorMessage += `\n詳細: ${details}`;
            }
        } else {
            errorMessage += `\n詳細: ${error.responseData}`;
        }
    }
    
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        // エラーメッセージ要素までスクロール
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 10秒後に非表示
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 10000);
    } else {
        alert(errorMessage);
    }
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
        console.log('フォームデータ:', taskData); // デバッグ用ログ
        
        // タスク基本データを整形
        const apiTaskData = {
            task_name: taskData.title || taskData.task_name,
            task_content: taskData.description || taskData.task_content,
            recent_schedule: taskData.recent_schedule,
            start_date: taskData.start_date,
            due_date: taskData.due_date,
            category: taskData.category,
            target_time: taskData.estimated_hours || taskData.target_time,
            comment: taskData.comment || '',
            
            // サブタスク情報
            subtasks: taskData.subtasks || [],
            
            // 日次作業計画値
            daily_task_plans: taskData.daily_task_plans || [],
            
            // 日次作業時間計画値
            daily_time_plans: taskData.daily_time_plans || []
        };
        
        console.log('API送信データ:', apiTaskData);
        return apiCall('task', '/tasks/', 'POST', apiTaskData);
    },
    
    updateTask: (taskId, taskData) => {
        console.log('タスク更新データ:', taskData); // デバッグ用ログ追加
        
        // フィールド名を変換
        const apiTaskData = {
            task_name: taskData.title || taskData.task_name,
            task_content: taskData.description || taskData.task_content,
            recent_schedule: taskData.recent_schedule,
            start_date: taskData.start_date,
            due_date: taskData.due_date,
            category: taskData.category,
            target_time: taskData.estimated_hours || taskData.target_time,
            comment: taskData.comment || '',
            
            // オプションで送信するデータ
            subtasks: taskData.subtasks || [],
            daily_task_plans: taskData.daily_task_plans || [],
            daily_time_plans: taskData.daily_time_plans || []
        };
        console.log('API送信データ (更新):', apiTaskData);
        return apiCall('task', `/tasks/${taskId}`, 'PUT', apiTaskData);
    },
    
    deleteTask: (taskId) => 
        apiCall('task', `/tasks/${taskId}`, 'DELETE'),
    
    calculateInitialValues: (formData) => 
        apiCall('task', '/tasks/calculate-initial-values', 'POST', formData),
    
    getSubtasks: (taskId) => 
        apiCall('task', `/subtasks/task/${taskId}`, 'GET'),
    
    createSubtask: (taskId, subtaskData) => {
        console.log(`サブタスク作成: タスクID=${taskId}`, subtaskData);
        // フィールド名を変換
        const apiSubtaskData = {
            subtask_name: subtaskData.title || subtaskData.subtask_name,
            contribution_value: subtaskData.contribution_value
        };
        return apiCall('task', `/subtasks/task/${taskId}`, 'POST', apiSubtaskData);
    },
    
    updateSubtask: (subtaskId, subtaskData) => {
        console.log(`サブタスク更新: ID=${subtaskId}`, subtaskData);
        // フィールド名を変換
        const apiSubtaskData = {
            subtask_name: subtaskData.title || subtaskData.subtask_name,
            contribution_value: subtaskData.contribution_value
        };
        return apiCall('task', `/subtasks/${subtaskId}`, 'PUT', apiSubtaskData);
    },
    
    deleteSubtask: (subtaskId) => {
        console.log(`サブタスク削除: ID=${subtaskId}`);
        return apiCall('task', `/subtasks/${subtaskId}`, 'DELETE');
    }
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