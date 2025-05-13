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

// Docker環境用のエンドポイント
const DOCKER_API_ENDPOINTS = {
    auth: 'http://localhost:8001/api',                // 認証サービス
    task: 'http://localhost:8002/api/v1',          // タスクサービス
    time: 'http://localhost:8003/api/v1',          // 時間サービス
    group: 'http://localhost:8004/api/v1',         // グループサービス
    report: 'http://localhost:8005/api/v1'         // レポートサービス
};

// 環境に応じたエンドポイントを選択
const CURRENT_ENDPOINTS = window.location.hostname === 'localhost' ? API_ENDPOINTS : DOCKER_API_ENDPOINTS;

// グローバルに公開
window.API_ENDPOINTS = CURRENT_ENDPOINTS;

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
    const baseUrl = CURRENT_ENDPOINTS[service];
    if (!baseUrl) {
        throw new Error(`不明なサービス: ${service}`);
    }

    // エンドポイントが/で始まらない場合は追加する
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const url = `${baseUrl}${normalizedEndpoint}`;
    console.log(`API呼び出し: ${method} ${url}`, data);  // デバッグ用ログ追加
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
    
    // CORS設定を環境に応じて調整
    let corsOptions = {
        mode: 'cors',
        credentials: 'include'
    };
    
    // Docker環境ではクレデンシャルの送信方法を変更
    if (window.location.hostname === 'localhost' && 
        (window.location.port === '8080' || window.location.port === '80')) {
        corsOptions = {
            mode: 'cors',
            credentials: 'same-origin'
        };
    }
    
    const options = {
        method,
        headers,
        ...corsOptions
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
            console.error('API_ENDPOINTS:', CURRENT_ENDPOINTS);
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
        
        throw error;
    }
}

/**
 * リフレッシュトークンを使った再認証
 * @returns {Promise} 認証結果のPromise
 */
async function refreshToken() {
    const response = await fetch(`${CURRENT_ENDPOINTS.auth}/auth/refresh`, {
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
    
    // ログには必ず出力
    console.error('表示するエラーメッセージ:', errorMessage);
    
    // 指定されたIDの要素があれば、そこに表示
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
        // ウィンドウを表示せず、ページ内に新しいエラー表示要素を動的に作成
        const newErrorElement = document.createElement('div');
        newErrorElement.className = 'alert alert-danger fixed-top mx-auto mt-3';
        newErrorElement.style.width = '80%';
        newErrorElement.style.maxWidth = '600px';
        newErrorElement.style.zIndex = '9999';
        
        // 改行をHTMLの改行に変換
        newErrorElement.innerHTML = errorMessage.replace(/\n/g, '<br>');
        
        // 閉じるボタンを追加
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.addEventListener('click', () => {
            if (document.body.contains(newErrorElement)) {
                document.body.removeChild(newErrorElement);
            }
        });
        newErrorElement.appendChild(closeButton);
        
        // ページに追加
        document.body.appendChild(newErrorElement);
        
        // 10秒後に自動的に非表示
        setTimeout(() => {
            if (document.body.contains(newErrorElement)) {
                document.body.removeChild(newErrorElement);
            }
        }, 10000);
    }
    
    // エラー情報を返す（後続の処理で使用できるようにするため）
    return {
        message: errorMessage,
        originalError: error
    };
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
    // タスク一覧取得
    getTasks: (params = {}) => 
        apiCall('task', '/tasks/', 'GET'),
    
    // 特定タスク取得
    getTask: (taskId) => 
        apiCall('task', `/tasks/${taskId}`, 'GET'),
    
    // タスク作成
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
    
    // タスク更新
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
    
    // タスク削除
    deleteTask: (taskId) => 
        apiCall('task', `/tasks/${taskId}`, 'DELETE'),
    
    // 初期値計算API
    calculateInitialValues: (formData) => 
        apiCall('task', '/tasks/calculate-initial-values', 'POST', formData),
    
    // サブタスク取得
    getSubtasks: (taskId) => 
        apiCall('task', `/subtasks/task/${taskId}`, 'GET'),
    
    // サブタスク作成
    createSubtask: (taskId, subtaskData) => {
        console.log(`サブタスク作成: タスクID=${taskId}`, subtaskData);
        // フィールド名を変換
        const apiSubtaskData = {
            subtask_name: subtaskData.title || subtaskData.subtask_name,
            contribution_value: subtaskData.contribution_value
        };
        return apiCall('task', `/subtasks/task/${taskId}`, 'POST', apiSubtaskData);
    },
    
    // サブタスク更新
    updateSubtask: (subtaskId, subtaskData) => {
        console.log(`サブタスク更新: ID=${subtaskId}`, subtaskData);
        // フィールド名を変換
        const apiSubtaskData = {
            subtask_name: subtaskData.title || subtaskData.subtask_name,
            contribution_value: subtaskData.contribution_value
        };
        return apiCall('task', `/subtasks/${subtaskId}`, 'PUT', apiSubtaskData);
    },
    
    // サブタスク削除
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