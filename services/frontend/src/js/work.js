/**
 * 作業実績管理関連の機能を提供するモジュール
 */
const Work = {
    /**
     * 作業実績一覧を取得
     * @returns {Promise<Array>} 作業実績一覧
     */
    async getWorks() {
        try {
            return await API.get('/v1/works/');
        } catch (error) {
            console.error('作業実績一覧取得エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業実績詳細を取得
     * @param {number} workId - 作業実績ID
     * @returns {Promise<Object>} 作業実績詳細
     */
    async getWork(workId) {
        try {
            return await API.get(`/v1/works/${workId}`);
        } catch (error) {
            console.error('作業実績詳細取得エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業実績を登録
     * @param {Object} workData - 作業実績データ
     * @returns {Promise<Object>} 登録された作業実績
     */
    async createWork(workData) {
        try {
            return await API.post('/v1/works/', workData);
        } catch (error) {
            console.error('作業実績登録エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業実績を更新
     * @param {number} workId - 作業実績ID
     * @param {Object} workData - 更新データ
     * @returns {Promise<Object>} 更新された作業実績
     */
    async updateWork(workId, workData) {
        try {
            return await API.put(`/v1/works/${workId}`, workData);
        } catch (error) {
            console.error('作業実績更新エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業実績を削除
     * @param {number} workId - 作業実績ID
     * @returns {Promise<void>}
     */
    async deleteWork(workId) {
        try {
            return await API.delete(`/v1/works/${workId}`);
        } catch (error) {
            console.error('作業実績削除エラー:', error);
            throw error;
        }
    },
    
    /**
     * 作業実績一覧を表示
     * @param {HTMLElement} container - 表示先の要素
     */
    async renderWorkList(container) {
        try {
            container.innerHTML = '<div class="loading">読み込み中...</div>';
            
            const works = await this.getWorks();
            
            if (works.length === 0) {
                container.innerHTML = '<div class="empty-state">作業実績データがありません。</div>';
                return;
            }
            
            const workListHtml = works.map(work => `
                <div class="list-item">
                    <div class="item-header">
                        <div class="item-title">${work.task_title}</div>
                        <div class="item-actions">
                            <button class="btn btn-small edit-work-btn" data-id="${work.id}">編集</button>
                            <button class="btn btn-small delete-work-btn" data-id="${work.id}">削除</button>
                        </div>
                    </div>
                    <div class="work-details">
                        <div class="work-date">${new Date(work.work_date).toLocaleDateString()}</div>
                        <div class="work-progress">進捗: ${work.progress}%</div>
                    </div>
                    <div class="work-notes">${work.notes || ''}</div>
                </div>
            `).join('');
            
            container.innerHTML = workListHtml;
            
            // イベントリスナーを設定
            this.setupWorkListEventListeners(container);
            
        } catch (error) {
            container.innerHTML = '<div class="error-state">作業実績データの読み込みに失敗しました。</div>';
            console.error('作業実績一覧表示エラー:', error);
        }
    },
    
    /**
     * 作業実績一覧のイベントリスナー設定
     * @param {HTMLElement} container - 作業実績一覧コンテナ
     */
    setupWorkListEventListeners(container) {
        // 編集ボタン
        container.querySelectorAll('.edit-work-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const workId = e.target.dataset.id;
                this.showWorkEditForm(workId);
            });
        });
        
        // 削除ボタン
        container.querySelectorAll('.delete-work-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const workId = e.target.dataset.id;
                this.confirmDeleteWork(workId);
            });
        });
    },
    
    /**
     * 作業実績入力フォームを表示
     * @param {number} workId - 作業実績ID（新規作成の場合はnull）
     */
    async showWorkEditForm(workId = null) {
        try {
            // タスク一覧を取得
            const tasks = await Tasks.getTasks();
            
            const modalContent = document.getElementById('modal-content');
            let work = null;
            
            if (workId) {
                try {
                    work = await this.getWork(workId);
                } catch (error) {
                    console.error('作業実績取得エラー:', error);
                    return;
                }
            }
            
            const workDate = work ? new Date(work.work_date).toISOString().split('T')[0] : '';
            
            modalContent.innerHTML = `
                <h2>${work ? '作業実績編集' : '作業実績入力'}</h2>
                <form id="work-form">
                    <div class="form-group">
                        <label for="task_id">タスク</label>
                        <select id="task_id" name="task_id" required>
                            <option value="">選択してください</option>
                            ${tasks.map(task => `
                                <option value="${task.id}" ${work && work.task_id === task.id ? 'selected' : ''}>
                                    ${task.title}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="work_date">作業日</label>
                        <input type="date" id="work_date" name="work_date" value="${workDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="progress">進捗率 (%)</label>
                        <input type="number" id="progress" name="progress" min="0" max="100" value="${work?.progress || 0}" required>
                    </div>
                    <div class="form-group">
                        <label for="notes">備考</label>
                        <textarea id="notes" name="notes" rows="3">${work?.notes || ''}</textarea>
                    </div>
                    <button type="submit" class="btn">${work ? '更新' : '登録'}</button>
                </form>
            `;
            
            // モーダルを表示
            document.getElementById('modal').classList.remove('hidden');
            
            // フォーム送信イベントを設定
            document.getElementById('work-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const workData = {
                    task_id: parseInt(formData.get('task_id')),
                    work_date: formData.get('work_date'),
                    progress: parseInt(formData.get('progress')),
                    notes: formData.get('notes')
                };
                
                try {
                    if (work) {
                        await this.updateWork(workId, workData);
                    } else {
                        await this.createWork(workData);
                    }
                    
                    // モーダルを閉じる
                    document.getElementById('modal').classList.add('hidden');
                    
                    // 作業実績一覧を更新
                    this.renderWorkList(document.getElementById('work-list'));
                    
                } catch (error) {
                    console.error('作業実績保存エラー:', error);
                    alert('作業実績の保存に失敗しました。');
                }
            });
            
        } catch (error) {
            console.error('フォーム表示エラー:', error);
        }
    },
    
    /**
     * 作業実績削除確認
     * @param {number} workId - 作業実績ID
     */
    confirmDeleteWork(workId) {
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <h2>作業実績削除確認</h2>
            <p>この作業実績記録を削除してもよろしいですか？</p>
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
                await this.deleteWork(workId);
                
                // モーダルを閉じる
                document.getElementById('modal').classList.add('hidden');
                
                // 作業実績一覧を更新
                this.renderWorkList(document.getElementById('work-list'));
                
            } catch (error) {
                console.error('作業実績削除エラー:', error);
                alert('作業実績の削除に失敗しました。');
            }
        });
        
        // キャンセルボタン
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            document.getElementById('modal').classList.add('hidden');
        });
    }
}; 