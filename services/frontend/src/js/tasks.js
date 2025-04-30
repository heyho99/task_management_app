/**
 * タスク管理関連の機能を提供するモジュール
 */
const Tasks = {
    /**
     * タスク一覧を取得
     * @returns {Promise<Array>} タスク一覧
     */
    async getTasks() {
        try {
            return await API.get('/v1/tasks/');
        } catch (error) {
            console.error('タスク一覧取得エラー:', error);
            throw error;
        }
    },
    
    /**
     * タスク詳細を取得
     * @param {number} taskId - タスクID
     * @returns {Promise<Object>} タスク詳細
     */
    async getTask(taskId) {
        try {
            return await API.get(`/v1/tasks/${taskId}`);
        } catch (error) {
            console.error('タスク詳細取得エラー:', error);
            throw error;
        }
    },
    
    /**
     * タスクを作成
     * @param {Object} taskData - タスクデータ
     * @returns {Promise<Object>} 作成されたタスク
     */
    async createTask(taskData) {
        try {
            return await API.post('/v1/tasks/', taskData);
        } catch (error) {
            console.error('タスク作成エラー:', error);
            throw error;
        }
    },
    
    /**
     * タスクを更新
     * @param {number} taskId - タスクID
     * @param {Object} taskData - 更新データ
     * @returns {Promise<Object>} 更新されたタスク
     */
    async updateTask(taskId, taskData) {
        try {
            return await API.put(`/v1/tasks/${taskId}`, taskData);
        } catch (error) {
            console.error('タスク更新エラー:', error);
            throw error;
        }
    },
    
    /**
     * タスクを削除
     * @param {number} taskId - タスクID
     * @returns {Promise<void>}
     */
    async deleteTask(taskId) {
        try {
            return await API.delete(`/v1/tasks/${taskId}`);
        } catch (error) {
            console.error('タスク削除エラー:', error);
            throw error;
        }
    },
    
    /**
     * タスク一覧を表示
     * @param {HTMLElement} container - 表示先の要素
     */
    async renderTaskList(container) {
        try {
            container.innerHTML = '<div class="loading">読み込み中...</div>';
            
            const tasks = await this.getTasks();
            
            if (tasks.length === 0) {
                container.innerHTML = '<div class="empty-state">タスクがありません。新しいタスクを作成してください。</div>';
                return;
            }
            
            const taskListHtml = tasks.map(task => `
                <div class="list-item" data-id="${task.id}">
                    <div class="item-header">
                        <div class="item-title">${task.title}</div>
                        <div class="item-actions">
                            <button class="btn btn-small view-task-btn" data-id="${task.id}">詳細</button>
                            <button class="btn btn-small edit-task-btn" data-id="${task.id}">編集</button>
                            <button class="btn btn-small delete-task-btn" data-id="${task.id}">削除</button>
                        </div>
                    </div>
                    <div class="item-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${task.progress || 0}%"></div>
                        </div>
                        <div class="progress-text">${task.progress || 0}%</div>
                    </div>
                    <div class="item-dates">
                        <span>開始: ${new Date(task.start_date).toLocaleDateString()}</span>
                        <span>期限: ${new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = taskListHtml;
            
            // イベントリスナーを設定
            this.setupTaskListEventListeners(container);
            
        } catch (error) {
            container.innerHTML = '<div class="error-state">タスクの読み込みに失敗しました。</div>';
            console.error('タスク一覧表示エラー:', error);
        }
    },
    
    /**
     * タスク一覧のイベントリスナー設定
     * @param {HTMLElement} container - タスク一覧コンテナ
     */
    setupTaskListEventListeners(container) {
        // 詳細ボタン
        container.querySelectorAll('.view-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const taskId = e.target.dataset.id;
                this.showTaskDetail(taskId);
            });
        });
        
        // 編集ボタン
        container.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const taskId = e.target.dataset.id;
                this.showTaskEditForm(taskId);
            });
        });
        
        // 削除ボタン
        container.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const taskId = e.target.dataset.id;
                this.confirmDeleteTask(taskId);
            });
        });
    },
    
    /**
     * タスク詳細を表示
     * @param {number} taskId - タスクID
     */
    async showTaskDetail(taskId) {
        try {
            const task = await this.getTask(taskId);
            
            const modalContent = document.getElementById('modal-content');
            modalContent.innerHTML = `
                <h2>${task.title}</h2>
                <div class="task-detail">
                    <div class="task-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${task.progress || 0}%"></div>
                        </div>
                        <div class="progress-text">${task.progress || 0}%</div>
                    </div>
                    <div class="task-dates">
                        <p><strong>開始日:</strong> ${new Date(task.start_date).toLocaleDateString()}</p>
                        <p><strong>期限日:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
                    </div>
                    <div class="task-description">
                        <h3>説明</h3>
                        <p>${task.description || '説明はありません'}</p>
                    </div>
                </div>
            `;
            
            // モーダルを表示
            document.getElementById('modal').classList.remove('hidden');
            
        } catch (error) {
            console.error('タスク詳細表示エラー:', error);
        }
    },
    
    /**
     * タスク編集フォームを表示
     * @param {number} taskId - タスクID（新規作成の場合はnull）
     */
    async showTaskEditForm(taskId = null) {
        const modalContent = document.getElementById('modal-content');
        let task = null;
        
        if (taskId) {
            try {
                task = await this.getTask(taskId);
            } catch (error) {
                console.error('タスク取得エラー:', error);
                return;
            }
        }
        
        const startDate = task ? new Date(task.start_date).toISOString().split('T')[0] : '';
        const dueDate = task ? new Date(task.due_date).toISOString().split('T')[0] : '';
        
        modalContent.innerHTML = `
            <h2>${task ? 'タスク編集' : 'タスク作成'}</h2>
            <form id="task-form">
                <div class="form-group">
                    <label for="title">タイトル</label>
                    <input type="text" id="title" name="title" value="${task?.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="description">説明</label>
                    <textarea id="description" name="description" rows="4">${task?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="start_date">開始日</label>
                    <input type="date" id="start_date" name="start_date" value="${startDate}" required>
                </div>
                <div class="form-group">
                    <label for="due_date">期限日</label>
                    <input type="date" id="due_date" name="due_date" value="${dueDate}" required>
                </div>
                <div class="form-group">
                    <label for="progress">進捗率 (%)</label>
                    <input type="number" id="progress" name="progress" min="0" max="100" value="${task?.progress || 0}" required>
                </div>
                <button type="submit" class="btn">${task ? '更新' : '作成'}</button>
            </form>
        `;
        
        // モーダルを表示
        document.getElementById('modal').classList.remove('hidden');
        
        // フォーム送信イベントを設定
        document.getElementById('task-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                start_date: formData.get('start_date'),
                due_date: formData.get('due_date'),
                progress: parseInt(formData.get('progress'))
            };
            
            try {
                if (task) {
                    await this.updateTask(taskId, taskData);
                } else {
                    await this.createTask(taskData);
                }
                
                // モーダルを閉じる
                document.getElementById('modal').classList.add('hidden');
                
                // タスク一覧を更新
                this.renderTaskList(document.getElementById('task-list'));
                
            } catch (error) {
                console.error('タスク保存エラー:', error);
                alert('タスクの保存に失敗しました。');
            }
        });
    },
    
    /**
     * タスク削除確認
     * @param {number} taskId - タスクID
     */
    confirmDeleteTask(taskId) {
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <h2>タスク削除確認</h2>
            <p>このタスクを削除してもよろしいですか？</p>
            <div class="modal-actions">
                <button id="confirm-delete-btn" class="btn">削除する</button>
                <button id="cancel-delete-btn" class="btn btn-secondary">キャンセル</button>
            </div>
        `;
        
        // モーダルを表示
        document.getElementById('modal').classList.remove('hidden');
        
        // 削除確認ボタン
        document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
            try {
                await this.deleteTask(taskId);
                
                // モーダルを閉じる
                document.getElementById('modal').classList.add('hidden');
                
                // タスク一覧を更新
                this.renderTaskList(document.getElementById('task-list'));
                
            } catch (error) {
                console.error('タスク削除エラー:', error);
                alert('タスクの削除に失敗しました。');
            }
        });
        
        // キャンセルボタン
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });
    }
}; 