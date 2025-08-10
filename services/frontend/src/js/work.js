/**
 * 作業実績入力機能
 * 
 * ER図に基づく機能：
 * - tasks: タスク一覧・詳細表示
 * - subtasks: サブタスク一覧・貢献値更新
 * - work_times: タスクレベルの作業時間記録（API未実装）
 * - record_works: サブタスクレベルの作業記録（API未実装）
 */

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeWorkPage();
});

/**
 * ページの初期化
 */
async function initializeWorkPage() {
    try {
        // タスク一覧を読み込み
        await loadTasks();
        
        // イベントリスナーを設定
        setupEventListeners();
        
    } catch (error) {
        console.error('ページ初期化エラー:', error);
        showAlert('ページの初期化に失敗しました。', 'danger');
    }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // タスク選択時のイベント
    document.getElementById('taskSelect').addEventListener('change', function() {
        const selectedTaskId = this.value;
        const loadBtn = document.getElementById('loadTaskDataBtn');
        
        if (selectedTaskId) {
            loadBtn.disabled = false;
        } else {
            loadBtn.disabled = true;
            hideTaskDetails();
        }
    });

    // 実績データ読み込みボタン
    document.getElementById('loadTaskDataBtn').addEventListener('click', async function() {
        const selectedTaskId = document.getElementById('taskSelect').value;
        if (selectedTaskId) {
            await loadTaskData(selectedTaskId);
        }
    });

    // サブタスク更新ボタン
    document.getElementById('refreshSubtasksBtn').addEventListener('click', function() {
        const selectedTaskId = document.getElementById('taskSelect').value;
        if (selectedTaskId) {
            loadSubtasks(selectedTaskId);
        }
    });

    // 作業時間実績更新ボタン
    document.getElementById('refreshWorkTimesBtn').addEventListener('click', function() {
        const selectedTaskId = document.getElementById('taskSelect').value;
        if (selectedTaskId) {
            loadWorkTimes(selectedTaskId);
        }
    });

    // 作業時間追加ボタン
    document.getElementById('addWorkTimeBtn').addEventListener('click', function() {
        openWorkTimeModal();
    });

    // サブタスク保存ボタン
    document.getElementById('saveSubtaskBtn').addEventListener('click', saveSubtask);

    // 作業時間保存ボタン
    document.getElementById('saveWorkTimeBtn').addEventListener('click', saveWorkTime);

    // 作業時間削除ボタン
    document.getElementById('deleteWorkTimeBtn').addEventListener('click', deleteWorkTime);
}

/**
 * タスク一覧を読み込み
 */
async function loadTasks() {
    try {
        // task-serviceのAPIエンドポイントを使用
        const response = await apiCall('task', '/tasks', 'GET');
        const tasks = response || [];
        
        const taskSelect = document.getElementById('taskSelect');
        
        // 既存のオプションをクリア（最初のデフォルトオプション以外）
        taskSelect.innerHTML = '<option value="">タスクを選択してください</option>';
        
        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.task_id;
            option.textContent = `${task.task_name} (${task.category || '未分類'})`;
            taskSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('タスク一覧読み込みエラー:', error);
        showAlert('タスク一覧の読み込みに失敗しました。', 'danger');
    }
}

/**
 * 選択されたタスクのデータを読み込み
 */
async function loadTaskData(taskId) {
    try {
        // タスク詳細を取得
        const task = await apiCall('task', `/tasks/${taskId}`, 'GET');
        
        // タスク詳細を表示
        displayTaskDetails(task);
        
        // サブタスクを読み込み（タスク詳細にサブタスクが含まれている）
        loadSubtasksFromTask(task);
        
        // 作業時間実績を読み込み（現在はサポートされていないため、プレースホルダー表示）
        loadWorkTimesPlaceholder();
        
        // タスク詳細セクションを表示
        document.getElementById('taskDetailsSection').classList.remove('d-none');
        
    } catch (error) {
        console.error('タスクデータ読み込みエラー:', error);
        showAlert('タスクデータの読み込みに失敗しました。', 'danger');
    }
}

/**
 * タスク詳細を表示
 */
function displayTaskDetails(task) {
    document.getElementById('taskName').textContent = task.task_name;
    document.getElementById('taskContent').textContent = task.task_content || '内容なし';
    document.getElementById('taskStartDate').textContent = task.start_date || '未設定';
    document.getElementById('taskDueDate').textContent = task.due_date || '未設定';
}

/**
 * サブタスク一覧を読み込み
 */
async function loadSubtasks(taskId) {
    try {
        const subtasks = await apiCall('task', `/subtasks/task/${taskId}`, 'GET');
        displaySubtasks(subtasks);
        
    } catch (error) {
        console.error('サブタスク読み込みエラー:', error);
        showAlert('サブタスクの読み込みに失敗しました。', 'danger');
    }
}

/**
 * タスクからサブタスクを読み込み（タスク詳細取得時に使用）
 */
function loadSubtasksFromTask(task) {
    const subtasks = task.subtasks || [];
    displaySubtasks(subtasks);
}

/**
 * サブタスクを表示
 */
function displaySubtasks(subtasks) {
    const subtasksList = document.getElementById('subtasksList');
    
    subtasksList.innerHTML = '';
    
    if (subtasks.length === 0) {
        subtasksList.innerHTML = '<div class="text-muted text-center py-3">サブタスクがありません</div>';
        return;
    }
    
    subtasks.forEach(subtask => {
        const subtaskElement = createSubtaskElement(subtask);
        subtasksList.appendChild(subtaskElement);
    });
}

/**
 * サブタスク要素を作成
 */
function createSubtaskElement(subtask) {
    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action';
    div.style.cursor = 'pointer';
    
    // 現在のtask-serviceではprogress（完了率）フィールドを使用
    const completionRate = subtask.progress || 0;
    const progressBarClass = completionRate === 100 ? 'bg-success' : 'bg-primary';
    
    div.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
            <div class="flex-grow-1">
                <h6 class="mb-1">${subtask.subtask_name}</h6>
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar ${progressBarClass}" role="progressbar" 
                         style="width: ${completionRate}%" aria-valuenow="${completionRate}" 
                         aria-valuemin="0" aria-valuemax="100">
                        ${completionRate}%
                    </div>
                </div>
                <small class="text-muted">貢献値: ${subtask.contribution_value || 0}</small>
            </div>
            <div class="ms-3">
                <i class="bi bi-pencil-square"></i>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => openSubtaskModal(subtask));
    
    return div;
}

/**
 * 作業時間実績のプレースホルダーを表示
 */
function loadWorkTimesPlaceholder() {
    const workTimesList = document.getElementById('workTimesList');
    workTimesList.innerHTML = '<div class="text-muted text-center py-3">作業時間実績機能は開発中です<br><small>task-serviceにwork_timesのAPIが必要です</small></div>';
}

/**
 * 作業時間実績一覧を読み込み（将来のAPI実装用）
 */
async function loadWorkTimes(taskId) {
    try {
        // 将来のAPI実装時にコメントアウトを外してください
        // const workTimes = await apiCall('task', `/tasks/${taskId}/work-times`, 'GET');
        
        loadWorkTimesPlaceholder();
        
    } catch (error) {
        console.error('作業時間実績読み込みエラー:', error);
        showAlert('作業時間実績の読み込みに失敗しました。', 'danger');
    }
}

/**
 * 作業時間実績要素を作成
 */
function createWorkTimeElement(workTime) {
    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action';
    div.style.cursor = 'pointer';
    
    const workHours = Math.floor(workTime.work_time / 60);
    const workMinutes = workTime.work_time % 60;
    const timeText = workHours > 0 ? `${workHours}時間${workMinutes}分` : `${workMinutes}分`;
    
    div.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
            <div>
                <h6 class="mb-1">${workTime.date}</h6>
                <span class="badge bg-primary">${timeText}</span>
                <small class="text-muted ms-2">(${workTime.work_time}分)</small>
            </div>
            <div>
                <i class="bi bi-pencil-square"></i>
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => openWorkTimeModal(workTime));
    
    return div;
}

/**
 * サブタスクモーダルを開く
 */
function openSubtaskModal(subtask) {
    document.getElementById('subtaskId').value = subtask.subtask_id;
    document.getElementById('subtaskNameEdit').value = subtask.subtask_name;
    document.getElementById('completionRate').value = subtask.progress || 0;
    document.getElementById('actualValue').value = subtask.contribution_value || 0;
    
    const modal = new bootstrap.Modal(document.getElementById('subtaskModal'));
    modal.show();
}

/**
 * 作業時間モーダルを開く（プレースホルダー）
 */
function openWorkTimeModal(workTime = null) {
    showAlert('作業時間実績機能は開発中です。task-serviceにwork_timesのAPIが必要です。', 'info');
}

/**
 * サブタスクを保存
 */
async function saveSubtask() {
    try {
        const subtaskId = document.getElementById('subtaskId').value;
        const completionRate = parseFloat(document.getElementById('completionRate').value);
        const contributionValue = parseInt(document.getElementById('actualValue').value) || 0;
        
        if (completionRate < 0 || completionRate > 100) {
            showAlert('完了率は0～100の範囲で入力してください。', 'warning');
            return;
        }
        
        if (contributionValue < 0 || contributionValue > 100) {
            showAlert('貢献値は0～100の範囲で入力してください。', 'warning');
            return;
        }
        
        const updateData = {
            subtask_name: document.getElementById('subtaskNameEdit').value,
            contribution_value: contributionValue
            // 注意: 現在のtask-serviceではprogressフィールドは更新APIでサポートされていない可能性があります
        };
        
        await apiCall('task', `/subtasks/${subtaskId}`, 'PUT', updateData);
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('subtaskModal'));
        modal.hide();
        
        // サブタスク一覧を更新
        const selectedTaskId = document.getElementById('taskSelect').value;
        await loadSubtasks(selectedTaskId);
        
        showAlert('サブタスクを更新しました。', 'success');
        
    } catch (error) {
        console.error('サブタスク保存エラー:', error);
        showAlert('サブタスクの保存に失敗しました。', 'danger');
    }
}

/**
 * 作業時間実績を保存（プレースホルダー）
 */
async function saveWorkTime() {
    showAlert('作業時間実績機能は開発中です。task-serviceにwork_timesのAPIが必要です。', 'info');
}

/**
 * 作業時間実績を削除（プレースホルダー）
 */
async function deleteWorkTime() {
    showAlert('作業時間実績機能は開発中です。task-serviceにwork_timesのAPIが必要です。', 'info');
}

/**
 * タスク詳細セクションを非表示にする
 */
function hideTaskDetails() {
    document.getElementById('taskDetailsSection').classList.add('d-none');
}

/**
 * アラートを表示
 */
function showAlert(message, type = 'info') {
    // 既存のアラートを削除
    const existingAlert = document.querySelector('.alert-custom');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // 新しいアラートを作成
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-custom`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // ページの最上部に挿入
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);
    
    // 5秒後に自動で消去
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
