/**
 * API通信用のクライアントモジュール
 */
const API = {
    /**
     * ベースURL
     */
    baseUrl: '/api',
    
    /**
     * 認証トークン
     */
    token: null,
    
    /**
     * トークンの設定
     * @param {string} token - JWTトークン
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    },
    
    /**
     * トークンのクリア
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    },
    
    /**
     * トークンの取得（ローカルストレージから）
     * @returns {string|null} トークン
     */
    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('auth_token');
        }
        return this.token;
    },
    
    /**
     * リクエストヘッダーの作成
     * @param {Object} additionalHeaders - 追加のヘッダー
     * @returns {Object} ヘッダーオブジェクト
     */
    getHeaders(additionalHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...additionalHeaders
        };
        
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },
    
    /**
     * GETリクエスト
     * @param {string} endpoint - APIエンドポイント
     * @param {Object} params - クエリパラメータ
     * @returns {Promise<any>} レスポンス
     */
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    },
    
    /**
     * POSTリクエスト
     * @param {string} endpoint - APIエンドポイント
     * @param {Object} data - リクエストボディ
     * @returns {Promise<any>} レスポンス
     */
    async post(endpoint, data = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        
        return this.handleResponse(response);
    },
    
    /**
     * PUTリクエスト
     * @param {string} endpoint - APIエンドポイント
     * @param {Object} data - リクエストボディ
     * @returns {Promise<any>} レスポンス
     */
    async put(endpoint, data = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        
        return this.handleResponse(response);
    },
    
    /**
     * DELETEリクエスト
     * @param {string} endpoint - APIエンドポイント
     * @returns {Promise<any>} レスポンス
     */
    async delete(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    },
    
    /**
     * レスポンス処理
     * @param {Response} response - fetchのレスポンスオブジェクト
     * @returns {Promise<any>} 処理されたレスポンスデータ
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.detail || 'APIリクエストエラー');
            error.status = response.status;
            error.data = errorData;
            throw error;
        }
        
        // 204 No Content の場合は空のオブジェクトを返す
        if (response.status === 204) {
            return {};
        }
        
        return response.json();
    }
}; 





// ファイルの先頭のAPI定義部分はそのままで、以下を末尾に追加
// デモ用ダミーデータ
API.demoData = {
    tasks: [
        { id: 1, title: 'デザイン作成', description: 'ウェブサイトのデザインを作成する', progress: 80, start_date: '2023-04-01', due_date: '2023-04-15' },
        { id: 2, title: 'フロントエンド実装', description: 'HTMLとCSSの実装', progress: 60, start_date: '2023-04-05', due_date: '2023-04-20' },
        { id: 3, title: 'バックエンド開発', description: 'APIとデータベースの構築', progress: 30, start_date: '2023-04-10', due_date: '2023-05-10' }
    ],
    workTimes: [
        { id: 1, task_id: 1, task_title: 'デザイン作成', hours: 4.5, work_date: '2023-04-02', notes: 'ヘッダーとフッターの作成' },
        { id: 2, task_id: 1, task_title: 'デザイン作成', hours: 3.0, work_date: '2023-04-03', notes: 'メインコンテンツのレイアウト' },
        { id: 3, task_id: 2, task_title: 'フロントエンド実装', hours: 5.5, work_date: '2023-04-06', notes: 'HTML構造の作成' }
    ],
    taskTimes: [
        { task_id: 1, task_title: 'デザイン作成', planned_hours: 20, actual_hours: 15, progress_percent: 80, time_progress_percent: 75 },
        { task_id: 2, task_title: 'フロントエンド実装', planned_hours: 30, actual_hours: 12, progress_percent: 60, time_progress_percent: 40 },
        { task_id: 3, task_title: 'バックエンド開発', planned_hours: 50, actual_hours: 10, progress_percent: 30, time_progress_percent: 20 }
    ],
    works: [
        { id: 1, task_id: 1, task_title: 'デザイン作成', work_date: '2023-04-02', progress: 30, notes: 'ワイヤーフレーム作成' },
        { id: 2, task_id: 1, task_title: 'デザイン作成', work_date: '2023-04-05', progress: 50, notes: 'デザインカラー決定' },
        { id: 3, task_id: 2, task_title: 'フロントエンド実装', work_date: '2023-04-07', progress: 20, notes: 'HTML基本構造実装' }
    ]
};

// 、Auth.testMode = false と API.testMode = false に設定するだけで実際のAPIに接続できるようになります。
// テストモード設定
API.testMode = true;

// 本来のget関数を保存
API._originalGet = API.get;
// 本来のpost関数を保存
API._originalPost = API.post;
// 本来のput関数を保存
API._originalPut = API.put;
// 本来のdelete関数を保存
API._originalDelete = API.delete;

// テストモード用のget関数をオーバーライド
API.get = async function(endpoint, params = {}) {
    if (this.testMode) {
        return this.mockResponse(endpoint, 'GET', params);
    }
    return this._originalGet(endpoint, params);
};

// テストモード用のpost関数をオーバーライド
API.post = async function(endpoint, data = {}) {
    if (this.testMode) {
        return this.mockResponse(endpoint, 'POST', data);
    }
    return this._originalPost(endpoint, data);
};

// テストモード用のput関数をオーバーライド
API.put = async function(endpoint, data = {}) {
    if (this.testMode) {
        return this.mockResponse(endpoint, 'PUT', data);
    }
    return this._originalPut(endpoint, data);
};

// テストモード用のdelete関数をオーバーライド
API.delete = async function(endpoint) {
    if (this.testMode) {
        return this.mockResponse(endpoint, 'DELETE');
    }
    return this._originalDelete(endpoint);
};

// モックレスポンスを生成
API.mockResponse = function(endpoint, method, data = {}) {
    return new Promise((resolve, reject) => {
        // 実際のAPIリクエストを模倣するための遅延
        setTimeout(() => {
            try {
                let response;
                
                // タスク関連API
                if (endpoint === '/v1/tasks/') {
                    if (method === 'GET') {
                        response = [...this.demoData.tasks];
                    } else if (method === 'POST') {
                        const newTask = {
                            id: this.demoData.tasks.length + 1,
                            ...data
                        };
                        this.demoData.tasks.push(newTask);
                        response = newTask;
                    }
                } 
                else if (endpoint.match(/^\/v1\/tasks\/\d+$/)) {
                    const id = parseInt(endpoint.split('/').pop());
                    const taskIndex = this.demoData.tasks.findIndex(t => t.id === id);
                    
                    if (taskIndex === -1) {
                        throw new Error('タスクが見つかりません');
                    }
                    
                    if (method === 'GET') {
                        response = this.demoData.tasks[taskIndex];
                    } else if (method === 'PUT') {
                        this.demoData.tasks[taskIndex] = {
                            ...this.demoData.tasks[taskIndex],
                            ...data
                        };
                        response = this.demoData.tasks[taskIndex];
                    } else if (method === 'DELETE') {
                        this.demoData.tasks.splice(taskIndex, 1);
                        response = {};
                    }
                }
                
                // 作業時間関連API
                else if (endpoint === '/v1/work_times/') {
                    if (method === 'GET') {
                        response = [...this.demoData.workTimes];
                    } else if (method === 'POST') {
                        const newWorkTime = {
                            id: this.demoData.workTimes.length + 1,
                            task_title: this.demoData.tasks.find(t => t.id === data.task_id)?.title || 'Unknown Task',
                            ...data
                        };
                        this.demoData.workTimes.push(newWorkTime);
                        response = newWorkTime;
                    }
                }
                else if (endpoint === '/v1/work_times/task_times') {
                    response = [...this.demoData.taskTimes];
                }
                else if (endpoint.match(/^\/v1\/work_times\/\d+$/)) {
                    const id = parseInt(endpoint.split('/').pop());
                    const timeIndex = this.demoData.workTimes.findIndex(t => t.id === id);
                    
                    if (timeIndex === -1) {
                        throw new Error('作業時間が見つかりません');
                    }
                    
                    if (method === 'GET') {
                        response = this.demoData.workTimes[timeIndex];
                    } else if (method === 'PUT') {
                        this.demoData.workTimes[timeIndex] = {
                            ...this.demoData.workTimes[timeIndex],
                            task_title: this.demoData.tasks.find(t => t.id === data.task_id)?.title || this.demoData.workTimes[timeIndex].task_title,
                            ...data
                        };
                        response = this.demoData.workTimes[timeIndex];
                    } else if (method === 'DELETE') {
                        this.demoData.workTimes.splice(timeIndex, 1);
                        response = {};
                    }
                }
                
                // 作業実績関連API
                else if (endpoint === '/v1/works/') {
                    if (method === 'GET') {
                        response = [...this.demoData.works];
                    } else if (method === 'POST') {
                        const newWork = {
                            id: this.demoData.works.length + 1,
                            task_title: this.demoData.tasks.find(t => t.id === data.task_id)?.title || 'Unknown Task',
                            ...data
                        };
                        this.demoData.works.push(newWork);
                        response = newWork;
                    }
                }
                else if (endpoint.match(/^\/v1\/works\/\d+$/)) {
                    const id = parseInt(endpoint.split('/').pop());
                    const workIndex = this.demoData.works.findIndex(w => w.id === id);
                    
                    if (workIndex === -1) {
                        throw new Error('作業実績が見つかりません');
                    }
                    
                    if (method === 'GET') {
                        response = this.demoData.works[workIndex];
                    } else if (method === 'PUT') {
                        this.demoData.works[workIndex] = {
                            ...this.demoData.works[workIndex],
                            task_title: this.demoData.tasks.find(t => t.id === data.task_id)?.title || this.demoData.works[workIndex].task_title,
                            ...data
                        };
                        response = this.demoData.works[workIndex];
                    } else if (method === 'DELETE') {
                        this.demoData.works.splice(workIndex, 1);
                        response = {};
                    }
                }
                
                // 未対応のエンドポイント
                else {
                    throw new Error(`未対応のエンドポイント: ${endpoint}`);
                }
                
                resolve(response);
            } catch (error) {
                console.error('モックAPIエラー:', error);
                reject(error);
            }
        }, 300); // 300msの遅延
    });
};