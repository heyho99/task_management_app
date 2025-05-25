/**
 * 時間管理関連の機能を提供するモジュール
 */
const Time = {
    /**
     * タスク時間一覧を取得
     * @returns {Promise<Array>} タスク時間一覧
     */
    async getTaskTimes() {
        try {
            return await API.get('/v1/work_times/task_times');
        } catch (error) {
            console.error('タスク時間一覧取得エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業時間一覧を取得
     * @returns {Promise<Array>} 作業時間一覧
     */
    async getWorkTimes() {
        try {
            return await API.get('/v1/work_times/');
        } catch (error) {
            console.error('作業時間一覧取得エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業時間を登録
     * @param {Object} timeData - 作業時間データ
     * @returns {Promise<Object>} 登録された作業時間
     */
    async createWorkTime(timeData) {
        try {
            return await API.post('/v1/work_times/', timeData);
        } catch (error) {
            console.error('作業時間登録エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業時間を更新
     * @param {number} timeId - 作業時間ID
     * @param {Object} timeData - 更新データ
     * @returns {Promise<Object>} 更新された作業時間
     */
    async updateWorkTime(timeId, timeData) {
        try {
            return await API.put(`/v1/work_times/${timeId}`, timeData);
        } catch (error) {
            console.error('作業時間更新エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業時間を削除
     * @param {number} timeId - 作業時間ID
     * @returns {Promise<void>}
     */
    async deleteWorkTime(timeId) {
        try {
            return await API.delete(`/v1/work_times/${timeId}`);
        } catch (error) {
            console.error('作業時間削除エラー:', error);
            throw error;
        }
    },
    
    /**
     * タスク時間一覧を表示
     * @param {HTMLElement} container - 表示先の要素
     */
    async renderTaskTimeList(container) {
        try {
            container.innerHTML = '<div class="loading">読み込み中...</div>';
            
            const taskTimes = await this.getTaskTimes();
            
            if (taskTimes.length === 0) {
                container.innerHTML = '<div class="empty-state">タスク時間データがありません。</div>';
                return;
            }
            
            const timeListHtml = taskTimes.map(taskTime => `
                <div class="list-item">
                    <div class="item-header">
                        <div class="item-title">${taskTime.task_title}</div>
                        <div class="item-actions">
                            <button class="btn btn-small view-task-btn" data-id="${taskTime.task_id}">タスク詳細</button>
                        </div>
                    </div>
                    <div class="time-stats">
                        <div class="time-stat">
                            <span class="stat-label">予定時間:</span>
                            <span class="stat-value">${taskTime.planned_hours}時間</span>
                        </div>
                        <div class="time-stat">
                            <span class="stat-label">実績時間:</span>
                            <span class="stat-value">${taskTime.actual_hours}時間</span>
                        </div>
                        <div class="time-stat">
                            <span class="stat-label">進捗率:</span>
                            <span class="stat-value">${taskTime.progress_percent}%</span>
                        </div>
                    </div>
                    <div class="time-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${taskTime.time_progress_percent}%"></div>
                        </div>
                        <div class="progress-text">${taskTime.time_progress_percent}%</div>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = timeListHtml;
            
            // イベントリスナーを設定
            container.querySelectorAll('.view-task-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const taskId = e.target.dataset.id;
                    // タスク詳細表示機能は現在 tasks.html で実装されています
                    window.location.href = `tasks.html#task-${taskId}`;
                });
            });
            
        } catch (error) {
            container.innerHTML = '<div class="error-state">タスク時間データの読み込みに失敗しました。</div>';
            console.error('タスク時間一覧表示エラー:', error);
        }
    },
    
    /**
     * 作業時間一覧を表示
     * @param {HTMLElement} container - 表示先の要素
     */
    async renderWorkTimeList(container) {
        try {
            container.innerHTML = '<div class="loading">読み込み中...</div>';
            
            const workTimes = await this.getWorkTimes();
            
            if (workTimes.length === 0) {
                container.innerHTML = '<div class="empty-state">作業時間データがありません。</div>';
                return;
            }
            
            const timeListHtml = workTimes.map(workTime => `
                <div class="list-item">
                    <div class="item-header">
                        <div class="item-title">${workTime.task_title}</div>
                        <div class="item-actions">
                            <button class="btn btn-small edit-time-btn" data-id="${workTime.id}">編集</button>
                            <button class="btn btn-small delete-time-btn" data-id="${workTime.id}">削除</button>
                        </div>
                    </div>
                    <div class="time-details">
                        <div class="time-date">${new Date(workTime.work_date).toLocaleDateString()}</div>
                        <div class="time-hours">${workTime.hours}時間</div>
                    </div>
                    <div class="time-notes">${workTime.notes || ''}</div>
                </div>
            `).join('');
            
            container.innerHTML = timeListHtml;
            
            // イベントリスナーを設定
            this.setupWorkTimeListEventListeners(container);
            
        } catch (error) {
            container.innerHTML = '<div class="error-state">作業時間データの読み込みに失敗しました。</div>';
            console.error('作業時間一覧表示エラー:', error);
        }
    },
    
    /**
     * 作業時間一覧のイベントリスナー設定
     * @param {HTMLElement} container - 作業時間一覧コンテナ
     */
    setupWorkTimeListEventListeners(container) {
        // 編集ボタン
        container.querySelectorAll('.edit-time-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const timeId = e.target.dataset.id;
                this.showWorkTimeEditForm(timeId);
            });
        });
        
        // 削除ボタン
        container.querySelectorAll('.delete-time-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const timeId = e.target.dataset.id;
                this.confirmDeleteWorkTime(timeId);
            });
        });
    },
    
    /**
     * 作業時間入力フォームを表示
     * @param {number} timeId - 作業時間ID（新規作成の場合はnull）
     */
    async showWorkTimeEditForm(timeId = null) {
        try {
            // タスク一覧を取得
            const tasks = await window.ApiClient.task.getTasks();
            
            const modalContent = document.getElementById('modal-content');
            let workTime = null;
            
            if (timeId) {
                try {
                    workTime = await API.get(`/v1/work_times/${timeId}`);
                } catch (error) {
                    console.error('作業時間取得エラー:', error);
                    return;
                }
            }
            
            const workDate = workTime ? new Date(workTime.work_date).toISOString().split('T')[0] : '';
            
            modalContent.innerHTML = `
                <h2>${workTime ? '作業時間編集' : '作業時間入力'}</h2>
                <form id="work-time-form">
                    <div class="form-group">
                        <label for="task_id">タスク</label>
                        <select id="task_id" name="task_id" required>
                            <option value="">選択してください</option>
                            ${tasks.map(task => `
                                <option value="${task.task_id}" ${workTime && workTime.task_id === task.task_id ? 'selected' : ''}>
                                    ${task.task_name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="work_date">作業日</label>
                        <input type="date" id="work_date" name="work_date" value="${workDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="hours">作業時間（時間）</label>
                        <input type="number" id="hours" name="hours" min="0.1" step="0.1" value="${workTime?.hours || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="notes">備考</label>
                        <textarea id="notes" name="notes" rows="3">${workTime?.notes || ''}</textarea>
                    </div>
                    <button type="submit" class="btn">${workTime ? '更新' : '登録'}</button>
                </form>
            `;
            
            // モーダルを表示
            document.getElementById('modal').classList.remove('hidden');
            
            // フォーム送信イベントを設定
            document.getElementById('work-time-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const timeData = {
                    task_id: parseInt(formData.get('task_id')),
                    work_date: formData.get('work_date'),
                    hours: parseFloat(formData.get('hours')),
                    notes: formData.get('notes')
                };
                
                try {
                    if (workTime) {
                        await this.updateWorkTime(timeId, timeData);
                    } else {
                        await this.createWorkTime(timeData);
                    }
                    
                    // モーダルを閉じる
                    document.getElementById('modal').classList.add('hidden');
                    
                    // 作業時間一覧を更新
                    this.renderWorkTimeList(document.getElementById('time-record-list'));
                    
                } catch (error) {
                    console.error('作業時間保存エラー:', error);
                    alert('作業時間の保存に失敗しました。');
                }
            });
            
        } catch (error) {
            console.error('フォーム表示エラー:', error);
        }
    },
    
    /**
     * 作業時間削除確認
     * @param {number} timeId - 作業時間ID
     */
    confirmDeleteWorkTime(timeId) {
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <h2>作業時間削除確認</h2>
            <p>この作業時間記録を削除してもよろしいですか？</p>
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
                await this.deleteWorkTime(timeId);
                
                // モーダルを閉じる
                document.getElementById('modal').classList.add('hidden');
                
                // 作業時間一覧を更新
                this.renderWorkTimeList(document.getElementById('time-record-list'));
                
            } catch (error) {
                console.error('作業時間削除エラー:', error);
                alert('作業時間の削除に失敗しました。');
            }
        });
        
        // キャンセルボタン
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });
    }
}; 