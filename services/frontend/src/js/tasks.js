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
                window.location.href = `task-edit.html?id=${taskId}`;
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
    console.log('initTaskCreationPage関数が呼び出されました');
    const form = document.getElementById('task-create-form');
    const addSubtaskBtn = document.getElementById('add-subtask');
    const subtaskContainer = document.getElementById('subtasks-container');
    const startDateInput = document.getElementById('start-date');
    const dueDateInput = document.getElementById('due-date');
    const targetTimeInput = document.getElementById('target-time');

    console.log('addSubtaskBtn要素:', addSubtaskBtn);

    // サブタスク追加ボタンのイベントリスナー
    if (addSubtaskBtn) {
        console.log('サブタスク追加ボタンにイベントリスナーを追加します');
        // インラインのonclick属性を使用する代わりに、ここでイベントリスナーを追加
        addSubtaskBtn.onclick = function() {
            console.log('サブタスク追加ボタンがクリックされました');
            window.addSubtaskField(); // グローバル関数として呼び出し
        };
    }

    // 日付またはターゲット時間が変更されたら初期値を再計算
    if (startDateInput && dueDateInput && targetTimeInput) {
        [startDateInput, dueDateInput, targetTimeInput].forEach(input => {
            input.addEventListener('change', updateInitialValues);
        });
    }

    // 初期サブタスク追加
    addSubtaskField();

    // フォーム送信イベントリスナー
    if (form) {
        form.addEventListener('submit', handleTaskSubmit);
    }
}

/**
 * タスク編集ページの初期化
 */
function initTaskEditPage() {
    console.log('initTaskEditPage関数が呼び出されました');
    const form = document.getElementById('task-edit-form');
    const addSubtaskBtn = document.getElementById('add-subtask');
    const subtaskContainer = document.getElementById('subtasks-container');
    const startDateInput = document.getElementById('start-date');
    const dueDateInput = document.getElementById('due-date');
    const targetTimeInput = document.getElementById('target-time');

    console.log('addSubtaskBtn要素:', addSubtaskBtn);

    // URLパラメータからタスクIDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');
    
    if (!taskId) {
        alert('タスクIDが指定されていません。タスク一覧に戻ります。');
        window.location.href = 'tasks.html';
        return;
    }

    // タスク情報を読み込んで表示
    loadTaskForEdit(taskId);

    // サブタスク追加ボタンのイベントリスナー
    if (addSubtaskBtn) {
        console.log('サブタスク追加ボタンにイベントリスナーを追加します');
        addSubtaskBtn.onclick = function() {
            console.log('サブタスク追加ボタンがクリックされました');
            window.addSubtaskField(); // グローバル関数として呼び出し
        };
    }

    // 日付またはターゲット時間が変更されたら初期値を再計算
    if (startDateInput && dueDateInput && targetTimeInput) {
        [startDateInput, dueDateInput, targetTimeInput].forEach(input => {
            input.addEventListener('change', updateInitialValues);
        });
    }

    // フォーム送信イベントリスナー
    if (form) {
        form.addEventListener('submit', async (event) => {
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
                console.log('更新するタスクデータ:', formData);
                await ApiClient.task.updateTask(taskId, formData);
                
                alert('タスクが正常に更新されました');
                
                // タスク一覧ページにリダイレクト
                window.location.href = 'tasks.html';
            } catch (error) {
                console.error('タスク更新エラー詳細:', error);
                ApiClient.displayError(error);
            }
        });
    }
}

/**
 * 編集用にタスク情報を読み込んで表示する
 * @param {string} taskId - 編集対象のタスクID
 */
async function loadTaskForEdit(taskId) {
    try {
        const task = await ApiClient.task.getTask(taskId);
        console.log('編集するタスク:', task);
        
        // hiddenフィールドにタスクIDをセット
        if (document.getElementById('task-id')) {
            document.getElementById('task-id').value = taskId;
        }
        
        // フォームに値を設定
        document.getElementById('task-name').value = task.task_name;
        document.getElementById('task-content').value = task.task_content || '';
        document.getElementById('recent-schedule').value = task.recent_schedule || '';
        document.getElementById('start-date').value = new Date(task.start_date).toISOString().split('T')[0];
        document.getElementById('due-date').value = new Date(task.due_date).toISOString().split('T')[0];
        document.getElementById('category').value = task.category;
        document.getElementById('target-time').value = task.target_time;
        document.getElementById('comment').value = task.comment || '';
        
        // サブタスクの読み込みと表示
        const subtasks = await ApiClient.task.getSubtasks(taskId);
        const subtasksContainer = document.getElementById('subtasks-container');
        subtasksContainer.innerHTML = ''; // 既存のサブタスクをクリア
        
        if (subtasks && subtasks.length > 0) {
            subtasks.forEach((subtask, index) => {
                addSubtaskField(subtask);
            });
        } else {
            // サブタスクがない場合は初期フィールドを追加
            addSubtaskField();
        }
        
        // 日次プランの取得と表示（あれば）
        // 注: APIに日次プラン取得メソッドがある場合はそれを使用
        updateInitialValues();
        
    } catch (error) {
        console.error('タスク読み込みエラー:', error);
        alert('タスクの読み込みに失敗しました。タスク一覧に戻ります。');
        window.location.href = 'tasks.html';
    }
}

/**
 * サブタスクフィールドを追加
 * @param {Object} subtaskData - 既存のサブタスクデータ（オプション）
 */
function addSubtaskField(subtaskData = null) {
    console.log('addSubtaskField関数が呼び出されました', subtaskData);
    const container = document.getElementById('subtasks-container');
    console.log('subtasks-container要素:', container);
    const index = container.children.length;
    console.log('現在のサブタスク数:', index);
    
    // 編集モードの場合は、既存の値を使用
    if (subtaskData) {
        const contributionValue = subtaskData.contribution_value;
        console.log('既存のサブタスクデータを使用:', contributionValue);
        
        const subtaskHtml = `
            <div class="row g-3 subtask-row mb-3" data-index="${index}">
                <div class="col-md-6">
                    <label for="subtask-name-${index}" class="form-label">サブタスク名</label>
                    <input type="text" class="form-control subtask-name" id="subtask-name-${index}" 
                           value="${subtaskData.subtask_name}" required>
                </div>
                <div class="col-md-4">
                    <label for="subtask-contrib-${index}" class="form-label">作業貢献値（%）</label>
                    <input type="number" class="form-control subtask-contrib" id="subtask-contrib-${index}" 
                           min="1" max="100" value="${contributionValue.toFixed(2)}" 
                           data-subtask-id="${subtaskData.subtask_id}"
                           step="0.01" onchange="window.redistributeContributionValues(this)" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger w-100" onclick="window.removeSubtask(this)">削除</button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', subtaskHtml);
        console.log('サブタスクHTMLを追加しました');
        validateSubtaskContributions();
    } else {
        // 新規追加の場合は、空のフィールドを追加してから全ての貢献値を均等分配
        const subtaskHtml = `
            <div class="row g-3 subtask-row mb-3" data-index="${index}">
                <div class="col-md-6">
                    <label for="subtask-name-${index}" class="form-label">サブタスク名</label>
                    <input type="text" class="form-control subtask-name" id="subtask-name-${index}" 
                           value="" required>
                </div>
                <div class="col-md-4">
                    <label for="subtask-contrib-${index}" class="form-label">作業貢献値（%）</label>
                    <input type="number" class="form-control subtask-contrib" id="subtask-contrib-${index}" 
                           min="1" max="100" value="0" 
                           data-subtask-id=""
                           step="0.01" onchange="window.redistributeContributionValues(this)" required>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button type="button" class="btn btn-outline-danger w-100" onclick="window.removeSubtask(this)">削除</button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', subtaskHtml);
        console.log('空のサブタスクHTMLを追加しました');
        
        // すべてのサブタスクに均等に貢献値を再配分
        redistributeSubtaskContributions();
    }
}

/**
 * サブタスクの貢献値を均等に再配分
 */
function redistributeSubtaskContributions() {
    console.log('貢献値を均等に再配分します');
    const container = document.getElementById('subtasks-container');
    const subtasks = container.getElementsByClassName('subtask-row');
    const count = subtasks.length;
    
    if (count === 0) return;
    
    // 均等な貢献値を計算
    const equalContribution = (100 / count).toFixed(2);
    console.log(`均等分配値: ${equalContribution}% (${count}個のサブタスク)`);
    
    // すべてのサブタスクに均等な値を設定
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
        input.value = equalContribution;
    });
    
    validateSubtaskContributions();
}

/**
 * サブタスクを削除
 * @param {HTMLElement} button - 削除ボタン要素
 */
function removeSubtask(button) {
    const row = button.closest('.subtask-row');
    row.remove();
    
    // 削除後に残ったサブタスクの作業貢献値を再調整
    redistributeSubtaskContributions();
}

/**
 * 初期値の更新
 */
async function updateInitialValues() {
    const startDate = document.getElementById('start-date').value;
    const dueDate = document.getElementById('due-date').value;
    const targetTime = document.getElementById('target-time').value;
    const subtasksCount = document.getElementById('subtasks-container').getElementsByClassName('subtask-row').length || 1;
    
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
    const subtasks = container.getElementsByClassName('subtask-row');
    
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
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
    const subtasks = container.getElementsByClassName('subtask-row');
    const errorElement = document.getElementById('subtask-error');
    
    let total = 0;
    Array.from(subtasks).forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
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
        window.location.href = 'tasks.html';
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
    const subtasks = container.getElementsByClassName('subtask-row');
    
    return Array.from(subtasks).map(subtask => {
        return {
            subtask_name: subtask.querySelector('.subtask-name').value,
            contribution_value: parseFloat(subtask.querySelector('.subtask-contrib').value)
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

/**
 * サブタスクの貢献値を再分配
 * @param {HTMLElement} changedInput - 変更された入力要素（省略可）
 */
function redistributeContributionValues(changedInput = null) {
    const container = document.getElementById('subtasks-container');
    const subtasks = container.querySelectorAll('.subtask-row');
    const count = subtasks.length;
    
    if (count === 0) return;
    
    // 変更された入力があれば、その値を優先
    if (changedInput) {
        const value = parseFloat(changedInput.value) || 0;
        const maxValue = 100;
        
        // 最大値を超えないように制限
        if (value > maxValue) {
            changedInput.value = maxValue;
        }
        
        // 負の値を入力できないように制限
        if (value < 0) {
            changedInput.value = 0;
        }
    }
    
    // 現在の合計値を計算
    let total = 0;
    let changedValue = 0;
    
    subtasks.forEach(subtask => {
        const input = subtask.querySelector('.subtask-contrib');
        const value = parseFloat(input.value) || 0;
        
        if (input === changedInput) {
            changedValue = value;
        } else {
            total += value;
        }
    });
    
    // 変更された入力も含めた合計
    const currentTotal = total + changedValue;
    
    // 合計が100を超える場合、他の入力を調整
    if (currentTotal > 100 && changedInput) {
        // 調整が必要な差分
        const diff = currentTotal - 100;
        const remainingSubtasks = count - 1; // 変更された入力以外の数
        
        if (remainingSubtasks > 0) {
            // 差分を他のサブタスクに均等に振り分ける
            const adjustValue = Math.ceil(diff / remainingSubtasks);
            
            subtasks.forEach(subtask => {
                const input = subtask.querySelector('.subtask-contrib');
                
                if (input !== changedInput) {
                    const currentValue = parseFloat(input.value) || 0;
                    const newValue = Math.max(0, currentValue - adjustValue);
                    input.value = newValue;
                }
            });
        }
    }
    
    validateSubtaskContributions();
}

// ページ初期化処理の追加
document.addEventListener('DOMContentLoaded', function() {
    // 現在のページのパスを取得
    const currentPage = window.location.pathname.split('/').pop();
    
    // ページに応じた初期化関数を呼び出す
    if (currentPage === 'task-create.html') {
        initTaskCreationPage();
    } else if (currentPage === 'task-edit.html') {
        initTaskEditPage();
    } else if (currentPage === 'tasks.html') {
        // タスク一覧ページの初期化
        const taskListContainer = document.querySelector('.task-list');
        if (taskListContainer) {
            Tasks.renderTaskList(taskListContainer);
        }
    }
});

// グローバルに公開する関数
window.addSubtaskField = addSubtaskField;
window.removeSubtask = removeSubtask;
window.redistributeContributionValues = redistributeContributionValues;
window.redistributeSubtaskContributions = redistributeSubtaskContributions;
window.validateSubtaskContributions = validateSubtaskContributions; 