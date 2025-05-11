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

/**
 * 初期値計算処理
 * @param {Object} formData - 入力データ
 * @returns {Promise} - 計算結果Promise
 */
async function calculateInitialValues(formData) {
    try {
        const result = await ApiClient.task.calculateInitialValues({
            start_date: formData.start_date,
            due_date: formData.due_date,
            target_time: parseInt(formData.target_time),
            subtask_count: formData.subtasks.length || 1
        });
        return result;
    } catch (error) {
        ApiClient.displayError(error);
        throw error;
    }
}

/**
 * タスク作成ページの初期化
 */
function initTaskCreationPage() {
    const form = document.getElementById('task-create-form');
    const addSubtaskBtn = document.getElementById('add-subtask');
    const subtaskContainer = document.getElementById('subtasks-container');
    const startDateInput = document.getElementById('start-date');
    const dueDateInput = document.getElementById('due-date');
    const targetTimeInput = document.getElementById('target-time');

    // サブタスク追加ボタンのイベントリスナー
    if (addSubtaskBtn) {
        addSubtaskBtn.addEventListener('click', addSubtaskField);
    }

    // 日付またはターゲット時間が変更されたら初期値を再計算
    if (startDateInput && dueDateInput && targetTimeInput) {
        [startDateInput, dueDateInput, targetTimeInput].forEach(input => {
            input.addEventListener('change', updateInitialValues);
        });
    }

    // フォーム送信イベントリスナー
    if (form) {
        form.addEventListener('submit', handleTaskSubmit);
    }

    // 初期サブタスク追加
    addSubtaskField();
}

/**
 * サブタスクフィールドを追加
 */
function addSubtaskField() {
    const container = document.getElementById('subtasks-container');
    const subtaskCount = container.getElementsByClassName('subtask-item').length;
    
    const subtaskDiv = document.createElement('div');
    subtaskDiv.className = 'subtask-item mb-3';
    
    // サブタスク貢献値の初期値を計算 (均等配分)
    const contributionValue = Math.floor(100 / (subtaskCount + 1));
    
    // サブタスク要素のHTMLを構築
    subtaskDiv.innerHTML = `
        <div class="row g-3">
            <div class="col-md-8">
                <input type="text" class="form-control subtask-name" placeholder="サブタスク名" required>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control subtask-contribution" value="${contributionValue}" min="0" max="100" required>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger remove-subtask">削除</button>
            </div>
        </div>
    `;
    
    container.appendChild(subtaskDiv);
    
    // 削除ボタンのイベント設定
    const removeBtn = subtaskDiv.querySelector('.remove-subtask');
    removeBtn.addEventListener('click', function() {
        container.removeChild(subtaskDiv);
        redistributeContributionValues();
    });
    
    // 既存のサブタスクの貢献値を再配分
    redistributeContributionValues();
}

/**
 * サブタスクの貢献値を再分配
 */
function redistributeContributionValues() {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-item');
    const count = subtasks.length;
    
    if (count === 0) return;
    
    const contributionValue = Math.floor(100 / count);
    const remainder = 100 - (contributionValue * count);
    
    Array.from(subtasks).forEach((subtask, index) => {
        const input = subtask.querySelector('.subtask-contribution');
        // 均等配分 + 余りは最後のサブタスクに追加
        input.value = contributionValue + (index === count - 1 ? remainder : 0);
    });
}

/**
 * 初期値の更新
 */
async function updateInitialValues() {
    const startDate = document.getElementById('start-date').value;
    const dueDate = document.getElementById('due-date').value;
    const targetTime = document.getElementById('target-time').value;
    const subtasksCount = document.getElementById('subtasks-container').getElementsByClassName('subtask-item').length || 1;
    
    if (!startDate || !dueDate || !targetTime) return;
    
    try {
        const data = await calculateInitialValues({
            start_date: startDate,
            due_date: dueDate,
            target_time: parseInt(targetTime),
            subtasks: Array(subtasksCount).fill({}) // ダミーのサブタスク配列
        });
        
        // 計算結果を表示
        updateDailyTaskPlans(data.daily_task_plans);
        updateDailyTimePlans(data.daily_time_plans);
        
        // サブタスク貢献値の更新
        updateSubtaskContributions(data.subtask_contribution_value);
    } catch (error) {
        console.error('初期値計算エラー:', error);
    }
}

/**
 * 日次作業計画値の更新
 */
function updateDailyTaskPlans(dailyTaskPlans) {
    const container = document.getElementById('daily-task-plans-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    dailyTaskPlans.forEach(plan => {
        const date = new Date(plan.date);
        const formattedDate = date.toLocaleDateString('ja-JP');
        
        const planDiv = document.createElement('div');
        planDiv.className = 'daily-task-plan mb-2';
        planDiv.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <input type="date" class="form-control" value="${plan.date}" readonly>
                </div>
                <div class="col-md-6">
                    <input type="number" class="form-control daily-task-plan-value" 
                           value="${plan.task_plan_value.toFixed(2)}" step="0.01" min="0" max="100" required>
                </div>
            </div>
        `;
        
        container.appendChild(planDiv);
    });
    
    // 作業計画値変更時のイベント登録
    const planInputs = container.querySelectorAll('.daily-task-plan-value');
    planInputs.forEach(input => {
        input.addEventListener('change', validateDailyTaskPlans);
    });
}

/**
 * 日次作業時間計画値の更新
 */
function updateDailyTimePlans(dailyTimePlans) {
    const container = document.getElementById('daily-time-plans-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    dailyTimePlans.forEach(plan => {
        const date = new Date(plan.date);
        const formattedDate = date.toLocaleDateString('ja-JP');
        
        const planDiv = document.createElement('div');
        planDiv.className = 'daily-time-plan mb-2';
        planDiv.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <input type="date" class="form-control" value="${plan.date}" readonly>
                </div>
                <div class="col-md-6">
                    <input type="number" class="form-control daily-time-plan-value" 
                           value="${plan.time_plan_value.toFixed(2)}" step="0.01" min="0" required>
                </div>
            </div>
        `;
        
        container.appendChild(planDiv);
    });
    
    // 作業時間計画値変更時のイベント登録
    const planInputs = container.querySelectorAll('.daily-time-plan-value');
    planInputs.forEach(input => {
        input.addEventListener('change', validateDailyTimePlans);
    });
}

/**
 * サブタスク貢献値の更新
 */
function updateSubtaskContributions(contributionValue) {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-item');
    
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contribution');
        input.value = contributionValue.toFixed(2);
    });
}

/**
 * 日次作業計画値のバリデーション
 */
function validateDailyTaskPlans() {
    const container = document.getElementById('daily-task-plans-container');
    const planInputs = container.querySelectorAll('.daily-task-plan-value');
    const errorElement = document.getElementById('task-plan-error');
    
    let total = 0;
    planInputs.forEach(input => {
        total += parseFloat(input.value || 0);
    });
    
    // 100に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - 100) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `日次作業計画値の合計は100にしてください（現在: ${total.toFixed(2)}）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    return isValid;
}

/**
 * 日次作業時間計画値のバリデーション
 */
function validateDailyTimePlans() {
    const container = document.getElementById('daily-time-plans-container');
    const planInputs = container.querySelectorAll('.daily-time-plan-value');
    const targetTime = parseFloat(document.getElementById('target-time').value || 0);
    const errorElement = document.getElementById('time-plan-error');
    
    let total = 0;
    planInputs.forEach(input => {
        total += parseFloat(input.value || 0);
    });
    
    // 目標時間に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - targetTime) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `日次作業時間計画値の合計は目標作業時間（${targetTime}分）にしてください（現在: ${total.toFixed(2)}分）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    return isValid;
}

/**
 * サブタスク貢献値のバリデーション
 */
function validateSubtaskContributions() {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-item');
    const errorElement = document.getElementById('subtask-error');
    
    let total = 0;
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contribution');
        total += parseFloat(input.value || 0);
    });
    
    // 100に近い値かチェック（浮動小数点の誤差を考慮）
    const isValid = Math.abs(total - 100) < 0.1;
    
    if (errorElement) {
        errorElement.textContent = isValid ? '' : `サブタスクの作業貢献値の合計は100にしてください（現在: ${total.toFixed(2)}）`;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    return isValid;
}

/**
 * フォーム送信処理
 * @param {Event} event - イベントオブジェクト
 */
async function handleTaskSubmit(event) {
    event.preventDefault();
    
    // バリデーション
    const isTaskPlansValid = validateDailyTaskPlans();
    const isTimePlansValid = validateDailyTimePlans();
    const isSubtasksValid = validateSubtaskContributions();
    
    if (!isTaskPlansValid || !isTimePlansValid || !isSubtasksValid) {
        return;
    }
    
    // フォームデータの収集
    const formData = {
        task_name: document.getElementById('task-name').value,
        task_content: document.getElementById('task-content').value,
        recent_schedule: document.getElementById('recent-schedule').value,
        start_date: document.getElementById('start-date').value,
        due_date: document.getElementById('due-date').value,
        category: document.getElementById('category').value,
        target_time: parseInt(document.getElementById('target-time').value),
        comment: document.getElementById('comment').value || '',
        
        // サブタスク情報
        subtasks: collectSubtasks(),
        
        // 日次作業計画値
        daily_task_plans: collectDailyTaskPlans(),
        
        // 日次作業時間計画値
        daily_time_plans: collectDailyTimePlans()
    };
    
    try {
        console.log('送信するタスクデータ:', formData);
        const createdTask = await ApiClient.task.createTask(formData);
        console.log('作成されたタスク:', createdTask);
        
        alert('タスクが正常に作成されました');
        
        // タスク一覧ページにリダイレクト
        window.location.href = '/tasks.html';
    } catch (error) {
        console.error('タスク作成エラー詳細:', error);
        ApiClient.displayError(error);
    }
}

/**
 * サブタスク情報の収集
 * @returns {Array} - サブタスク情報の配列
 */
function collectSubtasks() {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-item');
    
    return Array.from(subtasks).map(subtask => {
        return {
            subtask_name: subtask.querySelector('.subtask-name').value,
            contribution_value: parseInt(subtask.querySelector('.subtask-contribution').value)
        };
    });
}

/**
 * 日次作業計画値の収集
 * @returns {Array} - 日次作業計画値の配列
 */
function collectDailyTaskPlans() {
    const container = document.getElementById('daily-task-plans-container');
    const plans = container.getElementsByClassName('daily-task-plan');
    
    return Array.from(plans).map(plan => {
        return {
            date: plan.querySelector('input[type="date"]').value,
            task_plan_value: parseFloat(plan.querySelector('.daily-task-plan-value').value)
        };
    });
}

/**
 * 日次作業時間計画値の収集
 * @returns {Array} - 日次作業時間計画値の配列
 */
function collectDailyTimePlans() {
    const container = document.getElementById('daily-time-plans-container');
    const plans = container.getElementsByClassName('daily-time-plan');
    
    return Array.from(plans).map(plan => {
        return {
            date: plan.querySelector('input[type="date"]').value,
            time_plan_value: parseFloat(plan.querySelector('.daily-time-plan-value').value)
        };
    });
}

// DOMが読み込まれた後にページ初期化
document.addEventListener('DOMContentLoaded', function() {
    // URLからページを判定して初期化
    const path = window.location.pathname;
    
    if (path.includes('task-create.html')) {
        initTaskCreationPage();
    }
}); 